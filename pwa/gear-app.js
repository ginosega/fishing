import { GearRepository } from './gear-store.js';
import { gearDisplayModel, gearSpecificationText, gearLinks } from './gear-model.js';
import { renderMarkdown, renderCatchCard } from './markdown-render.js';

const CATEGORY_META = {
  'rods-reels': { label:'Rods & Reels', icon:'🎣' },
  line: { label:'Line', icon:'〰️' },
  weights: { label:'Weights', icon:'⚓' },
  'snaps-swivels': { label:'Snaps & Swivels', icon:'🔗' },
  hooks: { label:'Hooks', icon:'🪝' },
  lures: { label:'Lures', icon:'🐟' },
  bait: { label:'Bait', icon:'🪱' }
};
const CATEGORY_ORDER = Object.keys(CATEGORY_META);
const TYPE_ORDER = {
  'rods-reels':['Spinning','Baitcasting','Spincasting'],
  line:['Braided','Fluorocarbon','Monofilament']
};
const SEARCH_THRESHOLD = 10;

const app = document.querySelector('#app');
const repo = new GearRepository();
let bundle = null;
let catchRows = [];
let kbEntities = new Map();
let rendering = false;

const ready = initialize();

// My Gear owns every #/inventory route. Capture these hash changes before any
// non-inventory route handler so this boundary remains explicit.
window.addEventListener('hashchange', event => {
  if (!isGearRoute()) return;
  event.stopImmediatePropagation();
  ready.then(renderIfGearRoute);
}, true);

if (app) new MutationObserver(() => {
  if (rendering) return;
  if (isGearRoute() && app.dataset.gearV2Root !== 'true') ready.then(renderIfGearRoute);
  else if (location.hash === '#/home' || !location.hash) patchHomeCopy();
}).observe(app, { childList:true, subtree:false });

async function initialize() {
  const [gearBundle, catches, kb] = await Promise.all([
    repo.initialize(),
    loadJson('./data/catches.seed.json', { catches:[] }),
    loadJson('./data/kb.seed.json', { entities:[] })
  ]);
  bundle = gearBundle;
  catchRows = Array.isArray(catches.catches) ? catches.catches : [];
  kbEntities = new Map((kb.entities || []).map(entity => [entity.id, entity]));
  renderIfGearRoute();
  patchHomeCopy();
}

function isGearRoute() {
  return (location.hash || '').startsWith('#/inventory');
}

function renderIfGearRoute() {
  if (!isGearRoute() || !app || !bundle) return;
  const parts = (location.hash || '#/inventory').replace(/^#\//,'').split('/').filter(Boolean);
  rendering = true;
  try {
    if (parts[0] !== 'inventory') return;
    if (parts[1] === 'item') renderItem(decodeURIComponent(parts.slice(2).join('/')));
    else if (parts[1]) renderList(parts[1]);
    else renderCategories();
    app.dataset.gearV2Root = 'true';
  } finally {
    requestAnimationFrame(() => { rendering = false; });
  }
}

function patchHomeCopy() {
  const button = [...document.querySelectorAll('.choice-card')].find(el => /my gear/i.test(el.textContent));
  const p = button?.querySelector('p');
  if (p) p.textContent = 'Browse your inventory of equipment, tackle, and bait';
}

function renderCategories() {
  app.innerHTML = `${pageHeader('My Gear','Browse your inventory of equipment, tackle, and bait','#/home')}
    <section class="category-grid">${CATEGORY_ORDER.map(key => {
      const meta = CATEGORY_META[key];
      return `<button class="category-card" data-gear-route="#/inventory/${key}"><span>${meta.icon}</span><strong>${escapeHtml(meta.label)}</strong></button>`;
    }).join('')}</section>`;
  bindGearRoutes();
}

function renderList(category) {
  const meta = CATEGORY_META[category];
  if (!meta) return navigate('#/inventory');
  const items = bundle.items.filter(item => item.category === category);
  const order = TYPE_ORDER[category];
  if (order) {
    const present = order.filter(type => items.some(item => item.type === type));
    app.innerHTML = `${pageHeader(meta.label,'','#/inventory')}<div class="grouped-list">${present.map(type => `<section class="item-group"><h2>${escapeHtml(type)}</h2><div class="item-list">${items.filter(item => item.type === type).map(itemCard).join('')}</div></section>`).join('')}</div>`;
    bindGearRoutes();
    return;
  }

  const types = [...new Set(items.map(item => item.type).filter(Boolean))].sort();
  const search = items.length >= SEARCH_THRESHOLD;
  const filter = category === 'lures' || category === 'hooks';
  app.innerHTML = `${pageHeader(meta.label,'','#/inventory')}
    ${search || filter ? `<div class="toolbar">${search ? `<input class="search" id="gearSearch" type="search" placeholder="Search ${escapeAttr(meta.label.toLowerCase())}…" />` : ''}${filter ? `<select class="select" id="gearTypeFilter"><option value="">All types</option>${types.map(type => `<option value="${escapeAttr(type)}">${escapeHtml(type)}</option>`).join('')}</select>` : ''}</div>` : ''}
    <section class="item-list" id="gearItemList"></section>`;
  const draw = () => {
    const q = normalize(document.querySelector('#gearSearch')?.value || '');
    const type = document.querySelector('#gearTypeFilter')?.value || '';
    const filtered = items.filter(item => (!q || searchableText(item).includes(q)) && (!type || item.type === type));
    document.querySelector('#gearItemList').innerHTML = filtered.length ? filtered.map(itemCard).join('') : '<div class="empty">No matching records.</div>';
    bindGearRoutes();
  };
  document.querySelector('#gearSearch')?.addEventListener('input', draw);
  document.querySelector('#gearTypeFilter')?.addEventListener('change', draw);
  draw();
}

function renderItem(id) {
  const item = bundle.items.find(record => record.id === id);
  if (!item) return navigate('#/inventory');
  if (item.category === 'rods-reels') return renderSetup(item);
  const meta = CATEGORY_META[item.category];
  const links = gearLinks(item);
  app.innerHTML = `${pageHeader(item.name,`${meta.label} - ${item.type}`,`#/inventory/${item.category}`)}
    <section class="panel"><div class="detail-grid">
      ${detailCell('Manufacturer / Model', escapeHtml(gearDisplayModel(item)))}
      ${item.specifications?.length ? detailCell('Specifications', escapeHtml(gearSpecificationText(item))) : ''}
      ${links.length ? detailCell('Links', linksHtml(links)) : ''}
    </div></section>
    ${notesPanel(item.notes)}
    ${['lures','bait'].includes(item.category) ? renderCatchHistory(item) : ''}`;
  bindGearRoutes();
}

function renderSetup(item) {
  const rodName = `${item.rod.manufacturer.name} ${item.rod.model}`;
  const reelName = `${item.reel.manufacturer.name} ${item.reel.model}`;
  app.innerHTML = `${pageHeader(`Rod: ${rodName}, Reel: ${reelName}`,`Rods & Reels - ${item.type}`,'#/inventory/rods-reels')}
    ${componentPanel('Rod',item.rod)}
    ${componentPanel('Reel',item.reel)}
    ${notesPanel(item.notes)}
    ${renderCatchHistory(item)}`;
  bindGearRoutes();
}

function componentPanel(title,component) {
  const links = [];
  if (component.manufacturer.url) links.push({kind:'manufacturer',label:component.manufacturer.name,url:component.manufacturer.url});
  links.push(...(component.links || []));
  return `<section class="panel"><h2 class="subsection-heading">${escapeHtml(title)}</h2><div class="detail-grid">
    ${detailCell('Manufacturer / Model',escapeHtml(`${component.manufacturer.name} / ${component.model}`))}
    ${component.specifications?.length ? detailCell('Specifications',escapeHtml(component.specifications.map(spec => spec.label ? `${spec.label}: ${spec.value}` : spec.value).join(', '))) : ''}
    ${links.length ? detailCell('Links',linksHtml(links)) : ''}
  </div></section>`;
}

function notesPanel(notes) {
  if (typeof notes !== 'string' || !notes.trim()) return '';
  return `<section class="panel"><h3>Notes</h3><div class="kb-content gear-notes">${renderMarkdown(notes)}</div></section>`;
}

function renderCatchHistory(item) {
  const matches = catchRows.filter(record => item.category === 'rods-reels'
    ? record.rodReelSetupId === item.id
    : record.lureOrBait?.itemId === item.id);
  const noun = item.category === 'bait' ? 'bait' : item.category === 'rods-reels' ? 'rod & reel' : 'lure';
  if (!matches.length) return `<section class="panel"><h3>My catch history</h3><div class="empty">No catches have been recorded with this ${noun}.</div></section>`;
  return `<section class="panel"><h3>My catch history</h3>${matches.map(record => {
    const species = kbEntities.get(record.speciesId);
    const picture = record.picture || species?.picture || null;
    return renderCatchCard(record, {
      speciesName: species?.name || 'Catch',
      locationName: kbEntities.get(record.locationId)?.name || '',
      href: `#/kb/catch/${encodeURIComponent(record.id)}`,
      pictureSrc: picture?.src || '',
      pictureAlt: picture?.alt || species?.name || 'Catch'
    });
  }).join('')}</section>`;
}

function itemCard(item) {
  const meta = item.type || '';
  return `<article class="item-card" data-gear-item="${escapeAttr(item.id)}"><h3>${escapeHtml(item.name)}</h3>${meta ? `<div class="item-meta"><span>${escapeHtml(meta)}</span></div>` : ''}</article>`;
}

function pageHeader(title,subtitle,back) {
  return `<div class="section-title"><div><h2>${escapeHtml(title)}</h2>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div>${back ? `<button class="back-button" data-gear-route="${escapeAttr(back)}">← Back</button>` : ''}</div>`;
}

function detailCell(label,value) {
  return `<div class="detail-cell"><div class="label">${escapeHtml(label)}</div><div class="value">${value}</div></div>`;
}

function linksHtml(links) {
  return `<div class="detail-links">${dedupeLinks(links).map(link => `<a href="${escapeAttr(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.label)} ↗</a>`).join('<br>')}</div>`;
}

function bindGearRoutes() {
  document.querySelectorAll('[data-gear-route]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault(); navigate(button.dataset.gearRoute);
  }));
  document.querySelectorAll('[data-gear-item]').forEach(card => card.addEventListener('click', () => navigate(`#/inventory/item/${encodeURIComponent(card.dataset.gearItem)}`)));
}

function navigate(hash) {
  if (location.hash === hash) { renderIfGearRoute(); return; }
  location.hash = hash;
  window.scrollTo({top:0,behavior:'smooth'});
}

async function loadJson(path, fallback) {
  try {
    const response = await fetch(path, {cache:'no-cache'});
    return response.ok ? await response.json() : fallback;
  } catch { return fallback; }
}

function searchableText(item) {
  return normalize([item.name,item.type,item.manufacturer?.name,item.model,gearSpecificationText(item)].filter(Boolean).join(' '));
}
function dedupeLinks(links) { const seen=new Set(); return links.filter(link => link?.url && !seen.has(link.url) && seen.add(link.url)); }
function normalize(value='') { return String(value).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim(); }
function escapeHtml(value='') { return String(value).replace(/[&<>\"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char])); }
function escapeAttr(value='') { return escapeHtml(value).replace(/'/g,'&#39;'); }
