import { GearRepository } from './gear-store.js';
import { gearDisplayModel, gearSpecificationText, gearLinks, resolveGuidance } from './gear-model.js';

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

const app = document.querySelector('#app');
const repo = new GearRepository();
let bundle = null;
let catchRows = [];
let rendering = false;

const ready = initialize();

// My Gear owns every #/inventory route. Capture these hash changes before the
// legacy Markdown router can see them; that router remains active only for the
// Home/Knowledge Base/planner routes during the transition to structured data.
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
  bundle = await repo.initialize();
  catchRows = await loadCatchRows();
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
  const search = category === 'lures';
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
  const connections = resolveGuidance(bundle,item,'connections');
  const usage = resolveGuidance(bundle,item,'usage');
  app.innerHTML = `${pageHeader(item.name,`${meta.label} - ${item.type}`,`#/inventory/${item.category}`)}
    <section class="panel"><div class="detail-grid">
      ${detailCell('Manufacturer / Model', escapeHtml(gearDisplayModel(item)))}
      ${item.specifications?.length ? detailCell('Specifications', escapeHtml(gearSpecificationText(item))) : ''}
      ${links.length ? detailCell('Links', linksHtml(links)) : ''}
    </div></section>
    ${connections.length ? `<section class="panel"><h3>Knots & connections</h3>${guidanceHtml(connections)}</section>` : ''}
    ${usage.length ? `<section class="panel"><h3>How to use it</h3>${guidanceHtml(usage)}</section>` : ''}
    ${['lures','bait'].includes(item.category) ? renderCatchHistory(item) : ''}`;
  bindGearRoutes();
}

function renderSetup(item) {
  const usage = resolveGuidance(bundle,item,'usage');
  const rodName = `${item.rod.manufacturer.name} ${item.rod.model}`;
  const reelName = `${item.reel.manufacturer.name} ${item.reel.model}`;
  app.innerHTML = `${pageHeader(`Rod: ${rodName}, Reel: ${reelName}`,`Rods & Reels - ${item.type}`,'#/inventory/rods-reels')}
    ${componentPanel('Rod',item.rod)}
    ${componentPanel('Reel',item.reel)}
    ${usage.length ? `<section class="panel"><h3>How to use it</h3>${guidanceHtml(usage)}</section>` : ''}
    <section class="panel"><h3>My catch history</h3><div class="empty">No catches have been recorded with this rod & reel.</div></section>`;
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

function renderCatchHistory(item) {
  const terms = [item.name, ...(item.aliases || [])].map(normalize).filter(Boolean);
  const matches = catchRows.filter(row => terms.some(term => normalize(row['Gear used'] || '').includes(term)));
  const noun = item.category === 'bait' ? 'bait' : 'lure';
  if (!matches.length) return `<section class="panel"><h3>My catch history</h3><div class="empty">No catches have been recorded with this ${noun}.</div></section>`;
  return `<section class="panel"><h3>My catch history</h3>${matches.map(row => `<div class="recommendation"><h4>${escapeHtml([row.Date,row.Water].filter(Boolean).join(' · '))}</h4><p><strong>Conditions:</strong> ${escapeHtml(row.Conditions || '')}</p><p><strong>Gear:</strong> ${escapeHtml(row['Gear used'] || '')}</p><p><strong>Results:</strong> ${escapeHtml(row.Results || '')}</p>${row.Observations ? `<p><strong>Observations:</strong> ${escapeHtml(row.Observations)}</p>` : ''}</div>`).join('')}</section>`;
}

function itemCard(item) {
  const specs = item.category === 'rods-reels' ? '' : gearSpecificationText(item);
  const meta = [item.type,specs].filter(Boolean).join(' · ');
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

function guidanceHtml(sections) {
  return sections.map(section => `<div class="recommendation">${section.title ? `<h4>${escapeHtml(section.title)}</h4>` : ''}<div class="guidance-body">${section.html ? sanitizeGuidanceHtml(section.html) : `<p>${escapeHtml(section.text || '')}</p>`}</div></div>`).join('');
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

async function loadCatchRows() {
  try {
    const response = await fetch('./kb/Trip_Logs_Field_Observations.md', {cache:'no-cache'});
    if (!response.ok) return [];
    const markdown = await response.text();
    const section = /## OneNote catch log\s*\n([\s\S]*?)(?=\n## |$)/i.exec(markdown)?.[1] || '';
    return parseFirstTable(section);
  } catch { return []; }
}

function parseFirstTable(markdown) {
  const lines = markdown.split('\n').map(line => line.trim()).filter(line => line.startsWith('|'));
  if (lines.length < 3) return [];
  const headers = splitRow(lines[0]);
  return lines.slice(2).map(line => splitRow(line)).filter(cells => cells.length === headers.length).map(cells => Object.fromEntries(headers.map((header,index) => [header,cells[index]])));
}

function splitRow(line) {
  return line.replace(/^\||\|$/g,'').split('|').map(cell => cell.trim());
}

function sanitizeGuidanceHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = String(html || '');
  const allowed = new Set(['P','UL','OL','LI','STRONG','EM','CODE','BR','A']);
  for (const element of [...template.content.querySelectorAll('*')]) {
    if (!allowed.has(element.tagName)) { element.replaceWith(...element.childNodes); continue; }
    for (const attr of [...element.attributes]) {
      const name = attr.name.toLowerCase();
      if (element.tagName === 'A' && ['href','target','rel'].includes(name)) continue;
      element.removeAttribute(attr.name);
    }
    if (element.tagName === 'A') {
      const href = element.getAttribute('href') || '';
      if (!(href.startsWith('#/') || /^https?:\/\//i.test(href))) element.removeAttribute('href');
      if (/^https?:\/\//i.test(href)) { element.target='_blank'; element.rel='noopener'; }
    }
  }
  return template.innerHTML;
}

function searchableText(item) {
  return normalize([item.name,item.type,item.manufacturer?.name,item.model,gearSpecificationText(item)].filter(Boolean).join(' '));
}
function dedupeLinks(links) { const seen=new Set(); return links.filter(link => link?.url && !seen.has(link.url) && seen.add(link.url)); }
function normalize(value='') { return String(value).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim(); }
function escapeHtml(value='') { return String(value).replace(/[&<>\"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char])); }
function escapeAttr(value='') { return escapeHtml(value).replace(/'/g,'&#39;'); }
