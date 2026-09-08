import { GearRepository } from './gear-store.js';
import { validateKbBundle, validateCatchBundle, groupEntitiesByType, catchesForEntity } from './kb-model.js';
import { renderMarkdown, renderCatchCard, formatCatchDate, formatCatchSize } from './markdown-render.js';
import { mountKbEditor } from './kb-authoring.js';

const KB_SUBTITLE = 'Fishing reference and catch log';
const CATCH_SUBTITLE = 'Recorded catches';

const TYPE_META = {
  location: { label:'Locations', icon:'📍', description:'Waters, access, seasonal patterns, and local observations' },
  species: { label:'Species', icon:'🐟', description:'Fish identification, behavior, habitat, and targeting notes' },
  equipment: { label:'Gear Guides', icon:'🧰', description:'Equipment, rig, and presentation reference' },
  technique: { label:'Techniques', icon:'🧭', description:'Strategy, conditions, and species reference' },
  knot: { label:'Knots', icon:'🪢', description:'Connection guidance, cautions, and learning resources' }
};
const SEARCH_THRESHOLD = 10;

const app = document.querySelector('#app');
const homeButton = document.querySelector('#homeButton');
const statusDot = document.querySelector('#onlineStatus');
const gearRepository = new GearRepository();
const state = { kb:null, kbSource:null, catches:null, gear:null, content:new Map(), entityByContentPath:new Map(), catchNoteAssets:null, catchNotes:new Map(), media:[], localMedia:{kb:[]} };

const ready = initialize();

window.addEventListener('hashchange', () => {
  if (!isKbRoute()) return;
  ready.then(renderRoute);
});
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
homeButton?.addEventListener('click', () => navigate('#/home'));

async function initialize() {
  const [kb, kbSource, catches, gear, catchNoteAssets, media, localMedia] = await Promise.all([
    fetchJson('./data/kb.seed.json'),
    fetchJson('./kb-authoring-source.json'),
    fetchJson('./data/catches.seed.json'),
    gearRepository.initialize(),
    fetchJson('./catch-notes-assets.json', null),
    fetchJson('./gear-media.json', []),
    fetchJson('./kb-media.json', {kb:[]})
  ]);
  const kbValidation = validateKbBundle(kb);
  if (!kbValidation.valid) throw new Error(`Invalid Knowledge Base data: ${kbValidation.errors.join(' ')}`);
  const catchValidation = validateCatchBundle(catches, kb, gear);
  if (!catchValidation.valid) throw new Error(`Invalid Catch Log data: ${catchValidation.errors.join(' ')}`);
  const sourceValidation = validateKbBundle(kbSource);
  if (!sourceValidation.valid || kbSource.dataVersion !== kb.dataVersion || kbSource.schemaVersion !== kb.schemaVersion) throw new Error('KB authoring source does not match the deployed data.');
  state.kb = kb;
  state.kbSource = kbSource;
  state.catches = catches;
  state.gear = gear;
  state.media = media;
  state.localMedia = localMedia;
  state.catchNoteAssets = Array.isArray(catchNoteAssets) ? new Set(catchNoteAssets) : null;
  state.entityByContentPath = new Map(kb.entities.map(entity => [entity.content, entity]));
  updateOnlineStatus();
  updateFooter();
  registerServiceWorker();
  if (!location.hash) location.hash = '#/home';
  else renderRoute();
}

function isKbRoute() {
  const hash = location.hash || '#/home';
  return !hash.startsWith('#/inventory');
}

async function renderRoute() {
  if (!app || !state.kb || !isKbRoute()) return;
  const parts = (location.hash || '#/home').replace(/^#\//, '').split('/').filter(Boolean);
  try {
    if (!parts.length || parts[0] === 'home') return renderHome();
    if (parts[0] !== 'kb') return navigate('#/home');
    if (!parts[1]) return renderKbIndex();
    if (parts[1] === 'new') return renderKbEditor(null, false, parts[2] || '');
    if (parts[1] === 'edit') return renderKbEditor(state.kb.entities.find(row => row.id === decodeURIComponent(parts.slice(2).join('/'))) || null, true);
    if (parts[1] === 'catches') return renderCatchList();
    if (parts[1] === 'catch' && parts[2]) return renderCatch(decodeURIComponent(parts.slice(2).join('/')));
    if (parts[1] === 'entity' && parts[2]) return renderEntity(decodeURIComponent(parts.slice(2).join('/')));
    if (TYPE_META[singular(parts[1])]) return renderEntityList(singular(parts[1]));
    navigate('#/kb');
  } catch (error) {
    console.error(error);
    app.innerHTML = `${pageHeader('Knowledge Base unavailable', 'The structured data could not be displayed.', '#/home')}<section class="panel error"><p>${escapeHtml(error.message)}</p></section>`;
    bindRoutes();
  }
}

function renderHome() {
  app.innerHTML = `<section class="hero"><h2>Fishing Companion</h2><p class="muted">Your local-first gear inventory and browsable fishing reference.</p></section>
    <section class="choice-grid">
      <button class="choice-card" data-kb-route="#/inventory"><span class="choice-icon">🎒</span><div><strong>My Gear</strong><p>Browse your inventory of equipment, tackle, and bait</p></div></button>
      <button class="choice-card" data-kb-route="#/kb"><span class="choice-icon">📚</span><div><strong>Knowledge Base</strong><p>${KB_SUBTITLE}</p></div></button>
    </section>`;
  bindRoutes();
}

function renderKbIndex() {
  const groups = groupEntitiesByType(state.kb);
  app.innerHTML = `${pageHeader('Knowledge Base', KB_SUBTITLE, '#/home', {
      id:'kbRootSearch',
      placeholder:'Search all knowledge…'
    })}
    <section class="category-grid kb-category-grid" id="kbCategoryGrid">${Object.entries(TYPE_META).map(([type, meta]) => categoryCard(meta.icon, meta.label, meta.description, `#/kb/${plural(type)}`, groups[type].length)).join('')}
      ${categoryCard('🗒️', 'Catch Log', CATCH_SUBTITLE, '#/kb/catches', state.catches.catches.length)}
    </section>
    <section class="item-list root-search-results" id="kbRootSearchResults" hidden></section>
    ${kbPageActions('<a class="text-action" href="#/kb/new" data-kb-route="#/kb/new">＋ Add KB entry</a>')}`;
  const search = document.querySelector('#kbRootSearch');
  const categories = document.querySelector('#kbCategoryGrid');
  const results = document.querySelector('#kbRootSearchResults');
  const draw = () => {
    const q = normalize(search?.value || '');
    categories.hidden = Boolean(q);
    results.hidden = !q;
    if (!q) { results.innerHTML = ''; bindRoutes(); return; }
    const filtered = state.kb.entities
      .filter(entity => normalize(`${entity.name} ${entity.description || ''}`).includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
    results.innerHTML = filtered.length ? filtered.map(entityCard).join('') : '<div class="empty">No matching entries.</div>';
    bindRoutes();
  };
  search?.addEventListener('input', draw);
  bindRoutes();
}

function renderEntityList(type) {
  const meta = TYPE_META[type];
  if (!meta) return navigate('#/kb');
  const entities = state.kb.entities.filter(entity => entity.type === type).sort((a, b) => a.name.localeCompare(b.name));
  const searchable = entities.length >= SEARCH_THRESHOLD;
  app.innerHTML = `${pageHeader(meta.label, meta.description, '#/kb', searchable ? {
      id:'kbEntitySearch',
      placeholder:`Search ${meta.label.toLowerCase()}…`
    } : null)}
    <section class="item-list" id="kbEntityList"></section>
    ${kbPageActions(`<a class="text-action" href="#/kb/new/${type}" data-kb-route="#/kb/new/${type}">＋ Add ${{location:'Location',species:'Species',equipment:'Gear Guide',technique:'Technique',knot:'Knot'}[type]} entry</a>`)}`;
  const draw = () => {
    const q = normalize(document.querySelector('#kbEntitySearch')?.value || '');
    const filtered = entities.filter(entity => !q || normalize(`${entity.name} ${entity.description || ''}`).includes(q));
    document.querySelector('#kbEntityList').innerHTML = filtered.length ? filtered.map(entityCard).join('') : '<div class="empty">No matching entries.</div>';
    bindRoutes();
  };
  document.querySelector('#kbEntitySearch')?.addEventListener('input', draw);
  draw();
}

async function renderEntity(id) {
  const entity = state.kb.entities.find(record => record.id === id);
  if (!entity) return navigate('#/kb');
  app.innerHTML = `${pageHeader(entity.name, entity.description || '', `#/kb/${plural(entity.type)}`)}<section class="loading-card compact"><div class="spinner" aria-hidden="true"></div><p>Loading content…</p></section>`;
  bindRoutes();
  const content = await loadContent(entity.content);
  if (location.hash !== `#/kb/entity/${encodeURIComponent(id)}`) return;
  const catchFieldName = catchField(entity.type);
  const catches = catchFieldName ? catchesForEntity(state.catches, catchFieldName, entity.id) : [];
  app.innerHTML = `${pageHeader(entity.name, entity.description || '', `#/kb/${plural(entity.type)}`)}
    ${representativePicture(entity.picture, entity.name)}
    <article class="panel kb-content">${renderMarkdown(content, { contentPath:entity.content, entityByContentPath:state.entityByContentPath })}</article>
    ${catchFieldName ? catchBacklinks(catches) : ''}
    ${kbPageActions(`<a class="text-action" href="#/kb/edit/${encodeURIComponent(entity.id)}" data-kb-route="#/kb/edit/${escapeAttr(entity.id)}">Edit KB entry</a>`)}`;
  bindRoutes();
}

async function renderKbEditor(entity, requestedExisting=false, initialType='') {
  if (requestedExisting && !entity) return navigate('#/kb');
  const route = entity ? `#/kb/edit/${encodeURIComponent(entity.id)}` : initialType ? `#/kb/new/${initialType}` : '#/kb/new';
  const back = entity ? `#/kb/entity/${encodeURIComponent(entity.id)}` : initialType ? `#/kb/${plural(initialType)}` : '#/kb';
  const title = entity ? 'Edit KB Entry' : 'New KB Entry';
  app.innerHTML = `${pageHeader(title, entity ? 'Loading the complete authored document…' : 'Create a new Knowledge Base entry for handoff.', back)}<section class="loading-card compact"><div class="spinner" aria-hidden="true"></div><p>Loading editor…</p></section>`;
  bindRoutes();
  const markdown = entity ? await loadContent(entity.content) : '';
  if (location.hash !== route) return;
  app.innerHTML = `${pageHeader(title, entity ? 'Prepare a validated change package for this KB entry.' : 'Create a new Knowledge Base entry for handoff.', back)}<div id="kbEditorRoot"></div>`;
  bindRoutes();
  mountKbEditor({root:document.querySelector('#kbEditorRoot'),bundle:state.kb,sourceBundle:state.kbSource,gearBundle:state.gear,catchBundle:state.catches,
    original:entity,sourceOriginal:entity ? state.kbSource.entities.find(row => row.id === entity.id) : null,markdown,media:state.media,localMedia:state.localMedia,initialType,entityByContentPath:state.entityByContentPath,
    onCancel:()=>navigate(back)});
}

function kbPageActions(content) {
  return `<div class="page-actions">${content}</div>`;
}

function renderCatchList() {
  const records = [...state.catches.catches].sort((a, b) => `${b.date} ${b.time || ''}`.localeCompare(`${a.date} ${a.time || ''}`));
  app.innerHTML = `${pageHeader('Catch Log', CATCH_SUBTITLE, '#/kb')}
    <section class="panel">${records.length ? records.map(record => catchCard(record)).join('') : '<div class="empty">No catches have been recorded.</div>'}</section>`;
  bindRoutes();
}

async function renderCatch(id) {
  const record = state.catches.catches.find(item => item.id === id);
  if (!record) return navigate('#/kb/catches');
  const species = entity(record.speciesId);
  const location = entity(record.locationId);
  const method = entity(record.techniqueId);
  const setup = gear(record.rodReelSetupId);
  const lureOrBait = gear(record.lureOrBait.itemId);
  const catchPicture = record.picture || species?.picture || null;
  app.innerHTML = `${pageHeader(species?.name || 'Catch', formatCatchDate(record.date, record.time), '#/kb/catches')}
    ${representativePicture(catchPicture, `${species?.name || 'Catch'} on ${record.date}`)}
    <section class="panel"><div class="detail-grid">
      ${detailLink('Species', species?.name, species ? `#/kb/entity/${species.id}` : '')}
      ${detailLink('Location', location?.name, location ? `#/kb/entity/${location.id}` : '')}
      ${detailCell('Size', formatCatchSize(record.size))}
      ${detailLink('Rod & reel', setup?.name || 'Not recorded', setup ? `#/inventory/item/${setup.id}` : '')}
      ${detailLink('Technique / presentation', method?.name || 'Not recorded', method ? `#/kb/entity/${method.id}` : '')}
      ${detailLink(record.lureOrBait.type === 'bait' ? 'Bait' : 'Lure', lureOrBait?.name || record.lureOrBait.nameSnapshot, `#/inventory/item/${record.lureOrBait.itemId}`)}
    </div></section>
    ${catchNotesPanelShell()}`;
  bindRoutes();
  await loadCatchNotesIntoPanel(record);
}

function catchNotesPanelShell() {
  return '<section class="panel" id="catchNotesPanel" hidden><h3>Notes</h3><div class="kb-content compact-content" id="catchNotesBody"></div></section>';
}

async function loadCatchNotesIntoPanel(record) {
  const result = await loadCatchNotes(record);
  if (location.hash !== `#/kb/catch/${encodeURIComponent(record.id)}`) return;
  const panel = document.querySelector('#catchNotesPanel');
  const body = document.querySelector('#catchNotesBody');
  if (!panel || !body) return;
  if (!result.markdown.trim()) { panel.remove(); return; }
  body.innerHTML = renderMarkdown(result.markdown, { contentPath:result.contentPath, entityByContentPath:state.entityByContentPath });
  panel.hidden = false;
}

async function loadCatchNotes(record) {
  if (state.catchNotes.has(record.id)) return state.catchNotes.get(record.id);
  const contentPath = `./catch-content/${record.id}.md`;
  if (state.catchNoteAssets && !state.catchNoteAssets.has(contentPath)) {
    const empty = { markdown:'', contentPath };
    state.catchNotes.set(record.id, empty);
    return empty;
  }
  try {
    const response = await fetch(contentPath, { cache:'no-cache' });
    if (response.ok) {
      const loaded = { markdown:await response.text(), contentPath };
      state.catchNotes.set(record.id, loaded);
      return loaded;
    }
  } catch {}
  const empty = { markdown:'', contentPath };
  state.catchNotes.set(record.id, empty);
  return empty;
}

function catchCard(record) {
  const species = entity(record.speciesId);
  const picture = record.picture || species?.picture || null;
  return renderCatchCard(record, {
    speciesName: species?.name || 'Catch',
    locationName: entity(record.locationId)?.name || '',
    href: `#/kb/catch/${encodeURIComponent(record.id)}`,
    pictureSrc: picture?.src || '',
    pictureAlt: picture?.alt || species?.name || 'Catch'
  });
}

function catchBacklinks(records) {
  return `<section class="panel"><h3>My catch history</h3>${records.length ? records.map(catchCard).join('') : '<div class="empty">No catches have been recorded here.</div>'}</section>`;
}


function representativePicture(picture, fallbackAlt) {
  if (!picture) return '';
  const ownedItem = picture.gearItemId ? gear(picture.gearItemId) : null;
  if (ownedItem) {
    return `<figure class="panel kb-hero-picture"><button type="button" class="kb-picture-button" data-media-source="${escapeAttr(picture.src)}" data-media-alt="${escapeAttr(picture.alt || fallbackAlt)}"><img src="${escapeAttr(picture.src)}" alt="${escapeAttr(picture.alt || fallbackAlt)}"></button><figcaption><a href="#/inventory/item/${encodeURIComponent(ownedItem.id)}">${escapeHtml(ownedItem.name)}</a> · Tap to enlarge</figcaption></figure>`;
  }
  const caption = [picture.caption, picture.credit].filter(Boolean).map(escapeHtml).join(' · ');
  const source = picture.sourceUrl ? ` · <a href="${escapeAttr(picture.sourceUrl)}" target="_blank" rel="noopener">Source ↗</a>` : '';
  return `<figure class="panel kb-hero-picture"><button type="button" class="kb-picture-button" data-media-source="${escapeAttr(picture.src)}" data-media-alt="${escapeAttr(picture.alt || fallbackAlt)}"><img src="${escapeAttr(picture.src)}" alt="${escapeAttr(picture.alt || fallbackAlt)}"></button><figcaption>${caption ? `${caption} · ` : ''}Tap to enlarge${source}</figcaption></figure>`;
}

function pictureThumb(picture, fallbackAlt) {
  return picture ? `<img class="kb-card-picture" src="${escapeAttr(picture.src)}" alt="${escapeAttr(picture.alt || fallbackAlt)}" loading="lazy">` : '';
}

function entityCard(entity) {
  return `<button type="button" class="item-card kb-entity-card" data-kb-route="#/kb/entity/${escapeAttr(entity.id)}">
    ${pictureThumb(entity.picture, entity.name)}<div><h3>${escapeHtml(entity.name)}</h3>${entity.description ? `<div class="item-meta">${escapeHtml(entity.description)}</div>` : ''}</div>
  </button>`;
}

function categoryCard(icon, label, description, route, count) {
  return `<button class="category-card kb-category-card" data-kb-route="${escapeAttr(route)}"><span>${icon}</span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(description)}</small><span class="badge">${count} ${count === 1 ? 'entry' : 'entries'}</span></button>`;
}

function pageHeader(title, subtitle, back, search = null) {
  const searchControl = search ? `<input class="search section-search" id="${escapeAttr(search.id)}" type="search" placeholder="${escapeAttr(search.placeholder)}" />` : '';
  const actions = searchControl || back ? `<div class="section-title-actions">${searchControl}${back ? `<button class="back-button" data-kb-route="${escapeAttr(back)}">← Back</button>` : ''}</div>` : '';
  return `<div class="section-title"><div><h2>${escapeHtml(title)}</h2>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div>${actions}</div>`;
}

function detailCell(label, value) {
  return `<div class="detail-cell"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value || 'Not recorded')}</div></div>`;
}

function detailLink(label, value, route) {
  const content = route ? `<a href="${escapeAttr(route)}">${escapeHtml(value || 'Not recorded')}</a>` : escapeHtml(value || 'Not recorded');
  return `<div class="detail-cell"><div class="label">${escapeHtml(label)}</div><div class="value">${content}</div></div>`;
}

function bindRoutes() {
  document.querySelectorAll('[data-kb-route]').forEach(element => element.addEventListener('click', event => {
    event.preventDefault();
    navigate(element.dataset.kbRoute);
  }));
}

function navigate(hash) {
  if (location.hash === hash) renderRoute();
  else location.hash = hash;
  window.scrollTo({ top:0, behavior:'smooth' });
}

async function loadContent(path) {
  if (state.content.has(path)) return state.content.get(path);
  const response = await fetch(path, { cache:'no-cache' });
  if (!response.ok) throw new Error(`Could not load ${path}.`);
  const markdown = await response.text();
  state.content.set(path, markdown);
  return markdown;
}

async function fetchJson(path, fallback) {
  try {
    const response = await fetch(path, { cache:'no-cache' });
    if (!response.ok) {
      if (arguments.length > 1) return fallback;
      throw new Error(`Could not load ${path}.`);
    }
    return response.json();
  } catch (error) {
    if (arguments.length > 1) return fallback;
    throw error;
  }
}

function updateOnlineStatus() {
  if (!statusDot) return;
  statusDot.classList.toggle('offline', !navigator.onLine);
  statusDot.title = navigator.onLine ? 'Online' : 'Offline — cached knowledge remains available';
  statusDot.setAttribute('aria-label', statusDot.title);
}

function updateFooter() {
  const footer = document.querySelector('#copyrightFooter');
  if (footer) footer.textContent = `Fishing Companion · ${new Date().getFullYear()}`;
}

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) try { await navigator.serviceWorker.register('./sw.js'); } catch (error) { console.warn(error); }
}

function entity(id) { return id ? state.kb.entities.find(record => record.id === id) : null; }
function gear(id) { return id ? state.gear.items.find(record => record.id === id) : null; }
function catchField(type) { return ({ location:'locationId', species:'speciesId' })[type] || ''; }
function singular(value) { return ({ locations:'location', species:'species', equipment:'equipment', techniques:'technique', knots:'knot' })[value] || value; }
function plural(value) { return ({ location:'locations', species:'species', equipment:'equipment', technique:'techniques', knot:'knots' })[value] || value; }
function normalize(value = '') { return String(value).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]); }
function escapeAttr(value = '') { return escapeHtml(value); }

ready.catch(error => {
  console.error(error);
  if (app && isKbRoute()) app.innerHTML = `<section class="panel error"><h2>Fishing Companion unavailable</h2><p>${escapeHtml(error.message)}</p></section>`;
});
