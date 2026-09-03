import { GEAR_SCHEMA_VERSION, validateGearBundle } from './gear-model.js';

const DB_NAME = 'fishing-companion';
const DB_VERSION = 1;
const ITEM_STORE = 'gear-items';
const META_STORE = 'gear-meta';
const LEGACY_PROFILE_KEY = 'profiles';
const META_KEY = 'meta';

export class GearRepository {
  constructor(seedUrl = './data/gear.seed.json') {
    this.seedUrl = seedUrl;
    this.dbPromise = null;
  }

  async initialize() {
    const seed = await this.loadSeed();
    const db = await this.open();
    const tx = db.transaction([ITEM_STORE, META_STORE], 'readonly');
    const [count, meta] = await Promise.all([
      requestResult(tx.objectStore(ITEM_STORE).count()),
      requestResult(tx.objectStore(META_STORE).get(META_KEY))
    ]);

    if (count === 0) {
      await this.replace(seed, { source:'seed' });
      return this.exportBundle();
    }

    const localIsSeedManaged = !meta?.source || meta.source === 'seed';
    if (localIsSeedManaged && (meta?.schemaVersion !== GEAR_SCHEMA_VERSION || meta?.dataVersion !== seed.dataVersion)) {
      await this.replace(seed, { source:'seed' });
    }
    return this.exportBundle();
  }

  async loadSeed() {
    const response = await fetch(this.seedUrl, { cache:'no-cache' });
    if (!response.ok) throw new Error(`Failed to load ${this.seedUrl} (${response.status})`);
    const seed = await response.json();
    const validation = validateGearBundle(seed);
    if (!validation.valid) throw new Error(`Invalid My Gear seed: ${validation.errors.join(' ')}`);
    return seed;
  }

  async getAll() {
    const db = await this.open();
    const items = await requestResult(db.transaction(ITEM_STORE, 'readonly').objectStore(ITEM_STORE).getAll());
    return items.sort(sortItems);
  }

  async getById(id) {
    const db = await this.open();
    return requestResult(db.transaction(ITEM_STORE, 'readonly').objectStore(ITEM_STORE).get(id));
  }

  async exportBundle() {
    const db = await this.open();
    const tx = db.transaction([ITEM_STORE, META_STORE], 'readonly');
    const [items, metaRecord] = await Promise.all([
      requestResult(tx.objectStore(ITEM_STORE).getAll()),
      requestResult(tx.objectStore(META_STORE).get(META_KEY))
    ]);
    return {
      schemaVersion: GEAR_SCHEMA_VERSION,
      dataVersion: metaRecord?.dataVersion || 'local',
      items: items.sort(sortItems)
    };
  }

  async merge(bundle) {
    const validation = validateGearBundle(bundle);
    if (!validation.valid) throw new Error(validation.errors.join('\n'));
    const db = await this.open();
    const tx = db.transaction([ITEM_STORE, META_STORE], 'readwrite');
    for (const item of bundle.items) tx.objectStore(ITEM_STORE).put(item);
    tx.objectStore(META_STORE).delete(LEGACY_PROFILE_KEY);
    tx.objectStore(META_STORE).put({ key:META_KEY, schemaVersion:GEAR_SCHEMA_VERSION, dataVersion:bundle.dataVersion, updatedAt:new Date().toISOString(), source:'import-merge' });
    await transactionDone(tx);
    return this.exportBundle();
  }

  async replace(bundle, options = {}) {
    const validation = validateGearBundle(bundle);
    if (!validation.valid) throw new Error(validation.errors.join('\n'));
    const db = await this.open();
    const tx = db.transaction([ITEM_STORE, META_STORE], 'readwrite');
    const items = tx.objectStore(ITEM_STORE);
    items.clear();
    for (const item of bundle.items) items.put(item);
    tx.objectStore(META_STORE).delete(LEGACY_PROFILE_KEY);
    tx.objectStore(META_STORE).put({ key:META_KEY, schemaVersion:GEAR_SCHEMA_VERSION, dataVersion:bundle.dataVersion, updatedAt:new Date().toISOString(), source:options.source || 'import-replace' });
    await transactionDone(tx);
    return this.exportBundle();
  }

  async open() {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve,reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error || new Error('Unable to open IndexedDB.'));
      request.onupgradeneeded = event => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(ITEM_STORE)) db.createObjectStore(ITEM_STORE, { keyPath:'id' });
        if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath:'key' });
      };
      request.onsuccess = () => resolve(request.result);
    });
    return this.dbPromise;
  }
}

function sortItems(a,b) {
  return String(a.category).localeCompare(String(b.category)) || String(a.type).localeCompare(String(b.type)) || String(a.name).localeCompare(String(b.name));
}

function requestResult(request) {
  return new Promise((resolve,reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
  });
}

function transactionDone(tx) {
  return new Promise((resolve,reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed.'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted.'));
  });
}
