const CACHE_NAME = 'fishing-companion-__BUILD_VERSION__';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './gear-app.js',
  './kb-app.js',
  './gear-store.js',
  './gear-model.js',
  './kb-model.js',
  './markdown-render.js',
  './media-ui.js',
  './data/gear.seed.json',
  './data/kb.seed.json',
  './data/catches.seed.json',
  './gear-media.json',
  './gear-notes-assets.json',
  './kb-assets.json',
  './video-titles.json',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE);
    try {
      const response = await cache.match('./gear-media.json');
      const media = response ? await response.json() : [];
      await Promise.allSettled((media || []).map(item => item.asset ? cache.add(item.asset) : Promise.resolve()));
    } catch (error) {
      console.warn('Optional gear media precache incomplete', error);
    }
    const gearNotesResponse = await cache.match('./gear-notes-assets.json');
    const gearNoteAssets = gearNotesResponse ? await gearNotesResponse.json() : [];
    await cache.addAll(gearNoteAssets || []);
    const kbResponse = await cache.match('./kb-assets.json');
    const kbAssets = kbResponse ? await kbResponse.json() : [];
    await cache.addAll(kbAssets || []);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('fishing-companion-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, './index.html'));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(CACHE_NAME)).put(request, response.clone());
  return response;
}

async function networkFirst(request, fallbackPath) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(CACHE_NAME)).put(request, response.clone());
    return response;
  } catch {
    return (await caches.match(request)) || (fallbackPath ? await caches.match(fallbackPath) : undefined) || new Response('Offline and not cached', { status: 503 });
  }
}
