import { GearRepository } from './gear-store.js';
import { validateKbBundle, validateCatchBundle, groupEntitiesByType, catchesForEntity } from './kb-model.js';
import { renderMarkdown } from './markdown-render.js';

const TYPE_META = {
  location: { label:'Locations', icon:'📍', description:'Waters, access, seasonal patterns, and local observations' },
  species: { label:'Species', icon:'🐟', description:'Fish identification, behavior, habitat, and targeting notes' },
  technique: { label:'Techniques', icon:'🧭', description:'Presentations, rigging, use, and supporting resources' },
  knot: { label:'Knots', icon:'🪢', description:'Connection guidance, cautions, and learning resources' }
};

const app = document.querySelector('#app');
const homeButton = document.querySelector('#homeButton');
const statusDot = document.querySelector('#onlineStatus');
const gearRepository = new GearRepository();
const state = { kb:null, catches:null, gear:null, content:new Map(), entityByContentPath:new Map() };

const ready = initialize();

window.addEventListener('hashchange', () => {
  if (!isKbRoute()) return;
  ready.then(renderRoute);
});
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
homeButton?.addEventListener('click', () => navigate('#/home'));

async function initialize() {
  const [kb, catches, gear] = await Promise.all([
    fetchJson('./data/kb.seed.json'),
    fetchJson('./data/catches.seed.json'),
    gearRepository.initialize()
  ]);
  const kbValidation = validateKbBundle(kb);
  if (!kbValidation.valid) throw new Error(`Invalid Knowledge Base data: ${kbValidation.errors.join(' ')}`);
  const catchValidation = validateCatchBundle(catches, kb, gear);
  if (!catchValidation.valid) throw new Error(`Invalid Catch Log data: ${catchValidation.errors.join(' ')}`);
  state.kb = kb;
  state.catches = catches;
  state.gear = gear;
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
      <button class="choice-card" data-kb-route="#/kb"><span class="choice-icon">📚</span><div><strong>Knowledge Base</strong><p>Browse locations, species, techniques, knots, and catches</p></div></button>
    </section>`;
  bindRoutes();
}

function renderKbIndex() {
  const groups = groupEntitiesByType(state.kb);
  app.innerHTML = `${pageHeader('Knowledge Base', 'Browse your fishing reference by subject.', '#/home')}
    <section class="category-grid kb-category-grid">${Object.entries(TYPE_META).map(([type, meta]) => categoryCard(meta.icon, meta.label, meta.description, `#/kb/${plural(type)}`, groups[type].length)).join('')}
      ${categoryCard('🗒️', 'Catch Log', 'Recorded catches with stable links to species, locations, techniques, setups, lures, and bait', '#/kb/catches', state.catches.catches.length)}
    </section>`;
  bindRoutes();
}

function renderEntityList(type) {
  const meta = TYPE_META[type];
  if (!meta) return navigate('#/kb');
  const entities = state.kb.entities.filter(entity => entity.type === type).sort((a, b) => a.name.localeCompare(b.name));
  app.innerHTML = `${pageHeader(meta.label, meta.description, '#/kb')}
    <section class="item-list">${entities.map(entity => `<button type="button" class="item-card kb-entity-card" data-kb-route="#/kb/entity/${escapeAttr(entity.id)}">
      ${pictureThumb(entity.picture, entity.name)}<div><h3>${escapeHtml(entity.name)}</h3>${entity.description ? `<div class="item-meta">${escapeHtml(entity.description)}</div>` : ''}</div>
    </button>`).join('')}</section>`;
  bindRoutes();
}

async function renderEntity(id) {
  const entity = state.kb.entities.find(record => record.id === id);
  if (!entity) return navigate('#/kb');
  app.innerHTML = `${pageHeader(entity.name, entity.description || '', `#/kb/${plural(entity.type)}`)}<section class="loading-card compact"><div class="spinner" aria-hidden="true"></div><p>Loading content…</p></section>`;
  bindRoutes();
  const content = await loadContent(entity.content);
  const catchFieldName = catchField(entity.type);
  const catches = catchFieldName ? catchesForEntity(state.catches, catchFieldName, entity.id) : [];
  app.innerHTML = `${pageHeader(entity.name, entity.description || '', `#/kb/${plural(entity.type)}`)}
    ${representativePicture(entity.picture, entity.name)}
    <article class="panel kb-content">${renderMarkdown(content, { contentPath:entity.content, entityByContentPath:state.entityByContentPath })}</article>
    ${catchFieldName ? catchBacklinks(catches) : ''}`;
  bindRoutes();
}

function renderCatchList() {
  const records = [...state.catches.catches].sort((a, b) => `${b.date} ${b.time || ''}`.localeCompare(`${a.date} ${a.time || ''}`));
  app.innerHTML = `${pageHeader('Catch Log', 'Recorded catches with exact structured relationships.', '#/kb')}
    <section class="item-list">${records.map(record => {
      const species = entity(record.speciesId);
      const location = entity(record.locationId);
      return `<button type="button" class="item-card" data-kb-route="#/kb/catch/${escapeAttr(record.id)}"><h3>${escapeHtml(species?.name || 'Unknown species')}</h3><div class="item-meta">${escapeHtml(formatDate(record.date, record.time))} · ${escapeHtml(location?.name || 'Unknown location')} · ${escapeHtml(formatSize(record.size))}</div></button>`;
    }).join('')}</section>`;
  bindRoutes();
}

function renderCatch(id) {
  const record = state.catches.catches.find(item => item.id === id);
  if (!record) return navigate('#/kb/catches');
  const species = entity(record.speciesId);
  const location = entity(record.locationId);
  const technique = entity(record.techniqueId);
  const setup = gear(record.rodReelSetupId);
  const lureOrBait = gear(record.lureOrBait.itemId);
  app.innerHTML = `${pageHeader(species?.name || 'Catch', formatDate(record.date, record.time), '#/kb/catches')}
    ${representativePicture(record.picture, `${species?.name || 'Catch'} on ${record.date}`)}
    <section class="panel"><div class="detail-grid">
      ${detailLink('Species', species?.name, species ? `#/kb/entity/${species.id}` : '')}
      ${detailLink('Location', location?.name, location ? `#/kb/entity/${location.id}` : '')}
      ${detailCell('Size', formatSize(record.size))}
      ${detailLink('Rod & reel', setup?.name || 'Not recorded', setup ? `#/inventory/item/${setup.id}` : '')}
      ${detailLink('Technique', technique?.name || 'Not recorded', technique ? `#/kb/entity/${technique.id}` : '')}
      ${detailLink(record.lureOrBait.type === 'bait' ? 'Bait' : 'Lure', lureOrBait?.name || record.lureOrBait.nameSnapshot, `#/inventory/item/${record.lureOrBait.itemId}`)}
    </div></section>
    ${markdownPanel('Exact spot notes', record.exactSpotNotes)}
    ${markdownPanel('Notes', record.notes)}
    <section class="panel"><div class="detail-cell"><div class="label">Provenance</div><div class="value">${escapeHtml(record.source)}</div></div></section>`;
  bindRoutes();
}

function catchBacklinks(records) {
  return `<section class="panel"><h3>My catch history</h3>${records.length ? records.map(record => {
    const species = entity(record.speciesId);
    const location = entity(record.locationId);
    return `<button class="catch-backlink" data-kb-route="#/kb/catch/${escapeAttr(record.id)}"><strong>${escapeHtml(species?.name || 'Catch')}</strong><span>${escapeHtml(formatDate(record.date, record.time))} · ${escapeHtml(location?.name || '')} · ${escapeHtml(formatSize(record.size))}</span></button>`;
  }).join('') : '<div class="empty">No catches have been recorded here.</div>'}</section>`;
}

function markdownPanel(title, markdown) {
  if (!markdown) return '';
  return `<section class="panel"><h3>${escapeHtml(title)}</h3><div class="kb-content compact-content">${renderMarkdown(markdown)}</div></section>`;
}

function representativePicture(picture, fallbackAlt) {
  if (!picture) return '';
  return `<figure class="panel kb-hero-picture"><button type="button" class="kb-picture-button" data-media-source="${escapeAttr(picture.src)}" data-media-alt="${escapeAttr(picture.alt || fallbackAlt)}"><img src="${escapeAttr(picture.src)}" alt="${escapeAttr(picture.alt || fallbackAlt)}"></button>${picture.caption ? `<figcaption>${escapeHtml(picture.caption)}</figcaption>` : ''}</figure>`;
}

function pictureThumb(picture, fallbackAlt) {
  return picture ? `<img class="kb-card-picture" src="${escapeAttr(picture.src)}" alt="${escapeAttr(picture.alt || fallbackAlt)}" loading="lazy">` : '';
}

function categoryCard(icon, label, description, route, count) {
  return `<button class="category-card kb-category-card" data-kb-route="${escapeAttr(route)}"><span>${icon}</span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(description)}</small><span class="badge">${count} ${count === 1 ? 'entry' : 'entries'}</span></button>`;
}

function pageHeader(title, subtitle, back) {
  return `<div class="section-title"><div><h2>${escapeHtml(title)}</h2>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div>${back ? `<button class="back-button" data-kb-route="${escapeAttr(back)}">← Back</button>` : ''}</div>`;
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

async function fetchJson(path) {
  const response = await fetch(path, { cache:'no-cache' });
  if (!response.ok) throw new Error(`Could not load ${path}.`);
  return response.json();
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
function singular(value) { return ({ locations:'location', species:'species', techniques:'technique', knots:'knot' })[value] || value; }
function plural(value) { return ({ location:'locations', species:'species', technique:'techniques', knot:'knots' })[value] || value; }
function formatDate(date, time) { const parsed = new Date(`${date}T12:00:00Z`); const label = Number.isNaN(parsed.valueOf()) ? date : new Intl.DateTimeFormat(undefined, { year:'numeric', month:'short', day:'numeric', timeZone:'UTC' }).format(parsed); return time ? `${label} at ${time}` : label; }
function formatSize(size) { if (!size) return 'Not recorded'; const parts = []; if (size.length) parts.push(`${size.length.value} ${size.length.unit}`); if (size.weight) parts.push(`${size.weight.value} ${size.weight.unit}`); if (size.display) parts.push(size.display); return parts.join(' · ') || 'Not recorded'; }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]); }
function escapeAttr(value = '') { return escapeHtml(value); }

ready.catch(error => {
  console.error(error);
  if (app && isKbRoute()) app.innerHTML = `<section class="panel error"><h2>Fishing Companion unavailable</h2><p>${escapeHtml(error.message)}</p></section>`;
});
