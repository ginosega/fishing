import { GearRepository } from './gear-store.js';
import { gearDisplayModel, gearSpecificationText, gearLinks, validateGearBundle, GEAR_ACCESSORY_TYPES } from './gear-model.js';
import { renderMarkdown, renderCatchCard } from './markdown-render.js';
import { slugify, uniqueStableId, isHttpUrl, isSafeImageFilename, validatePlainText, renderPreparedHandoff } from './authoring-common.js';

const ACCESSORIES_ICON = `<svg viewBox="0 0 64 64" role="img" aria-label="Kayak">
  <defs><linearGradient id="kayakHull" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a2def7"/><stop offset="1" stop-color="#76c8ef"/></linearGradient></defs>
  <g transform="rotate(-35 32 32)" stroke-linecap="round" stroke-linejoin="round">
    <path d="M32 3 C40 9 43 20 43 32 C43 46 38 56 32 61 C26 56 21 46 21 32 C21 20 24 9 32 3Z" fill="url(#kayakHull)" stroke="#2f8fc0" stroke-width="2"/>
    <path d="M32 5 C27 12 25 20 25 32 M32 5 C37 12 39 20 39 32" fill="none" stroke="#e5f6fd" stroke-width=".8" opacity=".8"/>
    <path d="M25 15 39 19 M25 19 39 15 M24 45 40 49 M24 49 40 45" fill="none" stroke="#367da3" stroke-width="1.2"/>
    <ellipse cx="32" cy="32" rx="8.5" ry="12" fill="#233b4e" stroke="#377fa4" stroke-width="1.6"/>
    <ellipse cx="32" cy="32" rx="5.2" ry="7.5" fill="#344d60"/>
    <path d="M27 27 Q32 24 37 27 M27 37 Q32 40 37 37" fill="none" stroke="#6d8998" stroke-width="1.2"/>
    <path d="M8 32H56" stroke="#555e63" stroke-width="2.8"/>
    <path d="M8 29 3 25 Q1 32 3 39 L8 35Z" fill="#a9afb2" stroke="#737b80" stroke-width="1.2"/>
    <path d="M56 29 61 25 Q63 32 61 39 L56 35Z" fill="#a9afb2" stroke="#737b80" stroke-width="1.2"/>
  </g>
</svg>`;
const CATEGORY_META = {
  'rods-reels': { label:'Rods & Reels', icon:'🎣' },
  line: { label:'Line', icon:'〰️' },
  weights: { label:'Weights', icon:'⚓' },
  'snaps-swivels': { label:'Snaps & Swivels', icon:'🔗' },
  hooks: { label:'Hooks', icon:'🪝' },
  lures: { label:'Lures', icon:'🐟' },
  bait: { label:'Bait', icon:'🪱' },
  accessories: { label:'Equipment', iconHtml:ACCESSORIES_ICON }
};
const CATEGORY_ORDER = Object.keys(CATEGORY_META);
const TYPE_ORDER = {
  'rods-reels':['Spinning','Baitcasting','Spincasting']
};
const FIXED_TYPE_OPTIONS = {
  'rods-reels':['Spinning','Baitcasting','Spincasting'],
  accessories:GEAR_ACCESSORY_TYPES
};
const TYPE_LABELS = {
  'Trolling lures':'Trolling'
};
const SEARCH_THRESHOLD = 10;
const MAX_NOTES_LENGTH = 50000;

const app = document.querySelector('#app');
const repo = new GearRepository();
let bundle = null;
let catchRows = [];
let kbEntities = new Map();
let gearNoteAssets = null;
let gearMedia = [];
const gearNoteCache = new Map();
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
  const [gearBundle, catches, kb, noteAssets, media] = await Promise.all([
    repo.initialize(),
    loadJson('./data/catches.seed.json', { catches:[] }),
    loadJson('./data/kb.seed.json', { entities:[] }),
    loadJson('./gear-notes-assets.json', null),
    loadJson('./gear-media.json', [])
  ]);
  bundle = gearBundle;
  catchRows = Array.isArray(catches.catches) ? catches.catches : [];
  kbEntities = new Map((kb.entities || []).map(entity => [entity.id, entity]));
  gearNoteAssets = Array.isArray(noteAssets) ? new Set(noteAssets) : null;
  gearMedia = Array.isArray(media) ? media : [];
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
    if (parts[1] === 'new') renderGearEditor(null);
    else if (parts[1] === 'edit') renderGearEditor(bundle.items.find(record => record.id === decodeURIComponent(parts.slice(2).join('/'))) || null, true);
    else if (parts[1] === 'item') renderItem(decodeURIComponent(parts.slice(2).join('/')));
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
  app.innerHTML = `${pageHeader('My Gear','Browse your inventory of equipment, tackle, and bait','#/home', {
      id:'gearRootSearch',
      placeholder:'Search all gear…'
    })}
    <section class="category-grid" id="gearCategoryGrid">${CATEGORY_ORDER.map(key => {
      const meta = CATEGORY_META[key];
      return `<button class="category-card" data-gear-route="#/inventory/${key}">${categoryIcon(meta)}<strong>${escapeHtml(meta.label)}</strong></button>`;
    }).join('')}</section>
    <section class="item-list root-search-results" id="gearRootSearchResults" hidden></section>
    ${pageActions('<a class="text-action" href="#/inventory/new" data-gear-route="#/inventory/new">＋ Add Gear item</a>')}`;
  const search = document.querySelector('#gearRootSearch');
  const categories = document.querySelector('#gearCategoryGrid');
  const results = document.querySelector('#gearRootSearchResults');
  const draw = () => {
    const q = normalize(search?.value || '');
    categories.hidden = Boolean(q);
    results.hidden = !q;
    if (!q) { results.innerHTML = ''; bindGearRoutes(); return; }
    const filtered = bundle.items.filter(item => searchableText(item).includes(q));
    results.innerHTML = filtered.length ? filtered.map(itemCard).join('') : '<div class="empty">No matching records.</div>';
    bindGearRoutes();
  };
  search?.addEventListener('input', draw);
  bindGearRoutes();
}

function renderList(category) {
  const meta = CATEGORY_META[category];
  if (!meta) return navigate('#/inventory');
  const items = bundle.items.filter(item => item.category === category);
  const order = TYPE_ORDER[category];
  if (order) {
    const present = order.filter(type => items.some(item => item.type === type));
    app.innerHTML = `${pageHeader(meta.label,'','#/inventory')}<div class="grouped-list">${present.map(type => `<section class="item-group"><h2>${escapeHtml(displayGearType(type))}</h2><div class="item-list">${items.filter(item => item.type === type).map(itemCard).join('')}</div></section>`).join('')}</div>`;
    bindGearRoutes();
    return;
  }

  const types = [...new Set(items.map(item => item.type).filter(Boolean))].sort((a,b) => displayGearType(a).localeCompare(displayGearType(b)));
  const search = items.length >= SEARCH_THRESHOLD;
  const filter = category === 'lures' || category === 'hooks';
  app.innerHTML = `${pageHeader(meta.label,'','#/inventory', search ? {
      id:'gearSearch',
      placeholder:`Search ${meta.label.toLowerCase()}…`
    } : null)}
    ${filter ? `<div class="toolbar compact-toolbar"><select class="select" id="gearTypeFilter"><option value="">All types</option>${types.map(type => `<option value="${escapeAttr(type)}">${escapeHtml(displayGearType(type))}</option>`).join('')}</select></div>` : ''}
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
  const displayModel = gearDisplayModel(item);
  const details = [
    displayModel ? detailCell('Manufacturer / Model', escapeHtml(displayModel)) : '',
    item.specifications?.length ? detailCell('Specifications', escapeHtml(gearSpecificationText(item))) : '',
    links.length ? detailCell('Links', linksHtml(links)) : ''
  ].filter(Boolean).join('');
  app.innerHTML = `${pageHeader(item.name,`${meta.label} - ${displayGearType(item.type)}`,`#/inventory/${item.category}`)}
    ${details ? `<section class="panel"><div class="detail-grid">${details}</div></section>` : ''}
    ${notesPanelShell()}
    ${['lures','bait'].includes(item.category) ? renderCatchHistory(item) : ''}
    ${pageActions(`<a class="text-action" href="#/inventory/edit/${encodeURIComponent(item.id)}" data-gear-route="#/inventory/edit/${escapeAttr(item.id)}">Edit Gear item</a>`)}`;
  bindGearRoutes();
  loadGearNotesIntoPanel(item);
}

function renderSetup(item) {
  const rodName = `${item.rod.manufacturer.name} ${item.rod.model}`;
  const reelName = `${item.reel.manufacturer.name} ${item.reel.model}`;
  app.innerHTML = `${pageHeader(`Rod: ${rodName}, Reel: ${reelName}`,`Rods & Reels - ${displayGearType(item.type)}`,'#/inventory/rods-reels')}
    ${componentPanel('Rod',item.rod)}
    ${componentPanel('Reel',item.reel)}
    ${notesPanelShell()}
    ${renderCatchHistory(item)}
    ${pageActions(`<a class="text-action" href="#/inventory/edit/${encodeURIComponent(item.id)}" data-gear-route="#/inventory/edit/${escapeAttr(item.id)}">Edit Gear item</a>`)}`;
  bindGearRoutes();
  loadGearNotesIntoPanel(item);
}

function componentPanel(title,component) {
  const links = [];
  links.push(...(component.links || []));
  return `<section class="panel"><h2 class="subsection-heading">${escapeHtml(title)}</h2><div class="detail-grid">
    ${detailCell('Manufacturer / Model',escapeHtml(`${component.manufacturer.name} / ${component.model}`))}
    ${component.specifications?.length ? detailCell('Specifications',escapeHtml(component.specifications.map(spec => spec.label ? `${spec.label}: ${spec.value}` : spec.value).join(', '))) : ''}
    ${links.length ? detailCell('Links',linksHtml(links)) : ''}
  </div></section>`;
}

function notesPanelShell() {
  return '<section class="panel" id="gearNotesPanel" hidden><h3>Notes</h3><div class="kb-content gear-notes" id="gearNotesBody"></div></section>';
}

async function loadGearNotesIntoPanel(item) {
  const result = await loadGearNotes(item);
  if (location.hash !== `#/inventory/item/${encodeURIComponent(item.id)}`) return;
  const panel = document.querySelector('#gearNotesPanel');
  const body = document.querySelector('#gearNotesBody');
  if (!panel || !body) return;
  if (!result.markdown.trim()) { panel.remove(); return; }
  body.innerHTML = renderMarkdown(result.markdown, { contentPath:result.contentPath });
  panel.hidden = false;
}

async function loadGearNotes(item) {
  if (gearNoteCache.has(item.id)) return gearNoteCache.get(item.id);
  const contentPath = `./gear-content/${item.id}.md`;
  if (gearNoteAssets && !gearNoteAssets.has(contentPath)) {
    const empty = { markdown:'', contentPath };
    gearNoteCache.set(item.id, empty);
    return empty;
  }
  try {
    const response = await fetch(contentPath, { cache:'no-cache' });
    if (response.ok) {
      const loaded = { markdown:await response.text(), contentPath };
      gearNoteCache.set(item.id, loaded);
      return loaded;
    }
  } catch {}
  const empty = { markdown:'', contentPath };
  gearNoteCache.set(item.id, empty);
  return empty;
}

function renderGearEditor(item, requestedExisting=false) {
  if (requestedExisting && !item) return navigate('#/inventory');
  if (item?.category === 'rods-reels') return renderSetupEditor(item);
  const expectedRoute = item ? `#/inventory/edit/${encodeURIComponent(item.id)}` : '#/inventory/new';
  if (item) {
    app.innerHTML = `${pageHeader('Edit Gear Item','Loading current Notes…',`#/inventory/item/${item.id}`)}<section class="panel loading-card compact"><div class="spinner"></div><div>Loading item…</div></section>`;
    loadGearNotes(item).then(result => {
      if (location.hash !== expectedRoute) return;
      renderProductEditor(item, result.markdown);
    });
  } else {
    renderProductEditor(null, '');
  }
}

function renderProductEditor(item, notesMarkdown) {
  const editing = Boolean(item);
  const currentMedia = editing ? directMediaForItem(item.id) : null;
  const hasPicture = Boolean(currentMedia);
  const hasNotes = Boolean(notesMarkdown.trim());
  const currentFilename = currentMedia?.sourcePath ? basename(currentMedia.sourcePath) : '';
  const suggestedFilename = item ? `${item.id}.png` : '';
  const pictureSource = currentMedia?.sourcePath || currentMedia?.imageSource || '';
  const currentMediaId = currentMedia?.id || item?.id || null;
  const initialCategory = item?.category || '';
  const initialType = item?.type || '';
  const specs = item?.specifications?.length ? item.specifications : [{label:'',value:''}];
  const links = item?.links?.length ? item.links : [{label:'',url:''}];
  const back = editing ? `#/inventory/item/${item.id}` : '#/inventory';

  app.innerHTML = `${pageHeader(editing ? 'Edit Gear Item' : 'New Gear Item', editing ? 'Prepare a validated change package for this Gear record.' : 'Create a new Gear item entry for handoff.', back)}
    <form class="gear-editor" id="gearEditor" novalidate>
      <section class="panel form-panel">
        <div class="form-errors" id="gearFormErrors" role="alert" hidden></div>
        <div class="form-grid">
          ${formField('Gear ID', `<input class="input read-only-input" id="gearId" value="${escapeAttr(item?.id || '')}" readonly aria-readonly="true">`, 'Generated from Name for new items and permanently stable after creation.')}
          ${formField('Category *', `<select class="select" id="gearCategory" required><option value="">Select category…</option>${categoryOptions(initialCategory)}</select>`, 'Categories are maintained in chat; this form only selects among existing categories.')}
          ${formField('Type *', `<select class="select" id="gearType" required>${typeOptionsHtml(initialCategory, initialType, true)}</select>`, 'Types are maintained in chat; this form only selects among existing types.')}
          ${formField('Name *', `<input class="input" id="gearName" maxlength="160" value="${escapeAttr(item?.name || '')}" required>`)}
          ${formField('Manufacturer', `<input class="input" id="gearManufacturer" maxlength="120" value="${escapeAttr(item?.manufacturer?.name || '')}">`)}
          ${formField('Model', `<input class="input" id="gearModel" maxlength="160" value="${escapeAttr(item?.model || '')}">`)}
        </div>
      </section>

      <section class="panel form-panel">
        <div class="form-section-title"><div><h3>Specifications</h3><p>Optional structured Label / Value facts.</p></div></div>
        <div class="repeater" id="specRows">${specs.map(specRowHtml).join('')}</div>
        <button class="link-button" id="addSpec" type="button">＋ Add specification</button>
      </section>

      <section class="panel form-panel">
        <div class="form-section-title"><div><h3>Links</h3><p>Optional links associated with this item.</p></div></div>
        <div class="repeater" id="linkRows">${links.map(linkRowHtml).join('')}</div>
        <button class="link-button" id="addLink" type="button">＋ Add link</button>
      </section>

      <section class="panel form-panel">
        <fieldset class="choice-fieldset">
          <legend>Picture? *</legend>
          <label><input type="radio" name="gearPictureChoice" value="yes" ${hasPicture ? 'checked' : ''}> Yes</label>
          <label><input type="radio" name="gearPictureChoice" value="no" ${hasPicture ? '' : 'checked'}> No</label>
        </fieldset>
        ${hasPicture ? `<div class="current-state-note">Current picture: <code>${escapeHtml(currentMedia.asset)}</code><br>Media ID: <code>${escapeHtml(currentMediaId)}</code><br>Source: ${pictureSource ? pictureSource.startsWith('https://') || pictureSource.startsWith('http://') ? `<a href="${escapeAttr(pictureSource)}" target="_blank" rel="noopener">${escapeHtml(pictureSource)}</a>` : `<code>${escapeHtml(pictureSource)}</code>` : 'Source unavailable'}${currentMedia.sourcePath ? `<br>Repository source: <code>${escapeHtml(currentMedia.sourcePath)}</code>` : ''}</div>` : ''}
        <div id="pictureFields" ${hasPicture ? '' : 'hidden'}>
          ${hasPicture ? `<fieldset class="choice-fieldset"><legend>Picture action</legend><label><input type="radio" name="gearPictureAction" value="keep" checked> Keep current picture</label><label><input type="radio" name="gearPictureAction" value="replace"> Replace picture</label></fieldset>` : ''}
          <div id="replacementPictureFields" ${hasPicture ? 'hidden' : ''}>
            ${formField('Preferred source filename *', `<input class="input" id="gearPictureFilename" maxlength="180" value="${escapeAttr(currentFilename || suggestedFilename)}" placeholder="example-item.jpg">`, 'Use the exact extension of your replacement image. JPG, PNG, WebP, and GIF are supported. The filename may be the same as the existing one.')}
          </div>
        </div>
      </section>

      <section class="panel form-panel">
        <fieldset class="choice-fieldset">
          <legend>Notes? *</legend>
          <label><input type="radio" name="gearNotesChoice" value="yes" ${hasNotes ? 'checked' : ''}> Yes</label>
          <label><input type="radio" name="gearNotesChoice" value="no" ${hasNotes ? '' : 'checked'}> No</label>
        </fieldset>
        <div id="notesFields" ${hasNotes ? '' : 'hidden'}>
          <label class="field-label" for="gearNotes">Notes Markdown</label>
          <p class="form-help">Upload supporting images alongside the Markdown in pwa/gear-content/. Prefix each filename with the Gear ID, then reference it by filename, for example ![Bow hatch](bonafide-rvr119-bow-hatch.png). New images appear in Preview after they are available on the site.</p>
          <textarea class="input markdown-editor" id="gearNotes" maxlength="${MAX_NOTES_LENGTH}" rows="14">${escapeHtml(notesMarkdown)}</textarea>
          <div class="inline-actions"><button class="secondary-button" id="previewNotes" type="button">Preview</button></div>
          <div class="panel markdown-preview" id="notesPreview" hidden><h3>Notes preview</h3><div class="kb-content" id="notesPreviewBody"></div></div>
        </div>
      </section>

      <div class="form-actions">
        <button class="primary-button" type="submit">${editing ? 'Prepare changes' : 'Create item'}</button>
        <button class="secondary-button" id="cancelGearEditor" type="button">Cancel</button>
      </div>
    </form>
    <section class="panel prepared-change" id="gearPreparedPanel" hidden></section>`;

  bindGearRoutes();
  bindProductEditor({ item, notesMarkdown, currentMedia, currentFilename, currentMediaId, hasNotes, hasPicture, back });
}

function renderSetupEditor(item) {
  const expectedRoute = `#/inventory/edit/${encodeURIComponent(item.id)}`;
  app.innerHTML = `${pageHeader('Edit Gear Item','Loading current Notes…',`#/inventory/item/${item.id}`)}<section class="panel loading-card compact"><div class="spinner"></div><div>Loading item…</div></section>`;
  loadGearNotes(item).then(result => {
    if (location.hash !== expectedRoute) return;
    const hasNotes = Boolean(result.markdown.trim());
    const setupMedia = mediaForItem(item.id);
    app.innerHTML = `${pageHeader('Edit Gear Item','Rods & Reels use a paired-component schema. Setup identity and Notes can be prepared here; component facts and pictures remain chat-managed.',`#/inventory/item/${item.id}`)}
      <form class="gear-editor" id="gearSetupEditor" novalidate>
        <section class="panel form-panel">
          <div class="form-errors" id="gearFormErrors" role="alert" hidden></div>
          <div class="form-grid">
            ${formField('Gear ID', `<input class="input read-only-input" id="gearId" value="${escapeAttr(item.id)}" readonly>`)}
            ${formField('Category', `<input class="input read-only-input" value="Rods & Reels" readonly>`)}
            ${formField('Type *', `<select class="select" id="gearType">${FIXED_TYPE_OPTIONS['rods-reels'].map(type => `<option value="${escapeAttr(type)}" ${type === item.type ? 'selected' : ''}>${escapeHtml(type)}</option>`).join('')}</select>`)}
            ${formField('Name *', `<input class="input" id="gearName" maxlength="160" value="${escapeAttr(item.name)}">`)}
          </div>
        </section>
        <section class="panel form-panel disabled-section" aria-disabled="true">
          <h3>Rod</h3>
          <div class="form-grid">
            ${formField('Manufacturer', `<input class="input read-only-input" value="${escapeAttr(item.rod.manufacturer.name)}" readonly>`)}
            ${formField('Model', `<input class="input read-only-input" value="${escapeAttr(item.rod.model)}" readonly>`)}
            ${formField('Specifications', `<textarea class="input read-only-input" rows="3" readonly>${escapeHtml(gearSpecificationText(item.rod))}</textarea>`)}
          </div>
        </section>
        <section class="panel form-panel disabled-section" aria-disabled="true">
          <h3>Reel</h3>
          <div class="form-grid">
            ${formField('Manufacturer', `<input class="input read-only-input" value="${escapeAttr(item.reel.manufacturer.name)}" readonly>`)}
            ${formField('Model', `<input class="input read-only-input" value="${escapeAttr(item.reel.model)}" readonly>`)}
            ${formField('Specifications', `<textarea class="input read-only-input" rows="3" readonly>${escapeHtml(gearSpecificationText(item.reel))}</textarea>`)}
          </div>
        </section>
        <section class="panel form-panel disabled-section" aria-disabled="true">
          <fieldset class="choice-fieldset" disabled>
            <legend>Picture?</legend>
            <label><input type="radio" ${setupMedia.length ? 'checked' : ''}> Yes</label>
            <label><input type="radio" ${setupMedia.length ? '' : 'checked'}> No</label>
          </fieldset>
          <p class="form-help">Rod/Reel setup pictures are component-specific and remain chat-managed.</p>
        </section>
        <section class="panel form-panel">
          <fieldset class="choice-fieldset">
            <legend>Notes? *</legend>
            <label><input type="radio" name="gearNotesChoice" value="yes" ${hasNotes ? 'checked' : ''}> Yes</label>
            <label><input type="radio" name="gearNotesChoice" value="no" ${hasNotes ? '' : 'checked'}> No</label>
          </fieldset>
          <div id="notesFields" ${hasNotes ? '' : 'hidden'}>
            <label class="field-label" for="gearNotes">Notes Markdown</label>
            <textarea class="input markdown-editor" id="gearNotes" maxlength="${MAX_NOTES_LENGTH}" rows="14">${escapeHtml(result.markdown)}</textarea>
            <div class="inline-actions"><button class="secondary-button" id="previewNotes" type="button">Preview</button></div>
            <div class="panel markdown-preview" id="notesPreview" hidden><h3>Notes preview</h3><div class="kb-content" id="notesPreviewBody"></div></div>
          </div>
        </section>
        <div class="form-actions">
          <button class="primary-button" type="submit">Prepare changes</button>
          <button class="secondary-button" id="cancelGearEditor" type="button">Cancel</button>
        </div>
      </form>
      <section class="panel prepared-change" id="gearPreparedPanel" hidden></section>`;
    bindGearRoutes();
    bindSetupEditor({ item, notesMarkdown:result.markdown, hasNotes, back:`#/inventory/item/${item.id}` });
  });
}

function bindProductEditor(context) {
  const form = document.querySelector('#gearEditor');
  if (!form) return;
  const category = document.querySelector('#gearCategory');
  const type = document.querySelector('#gearType');
  const name = document.querySelector('#gearName');
  const id = document.querySelector('#gearId');
  const pictureFilename = document.querySelector('#gearPictureFilename');
  let autoPictureFilename = !context.hasPicture;
  const updatePictureAction = () => {
    const replacement = document.querySelector('#replacementPictureFields');
    if (replacement) replacement.hidden = context.hasPicture && document.querySelector('input[name="gearPictureAction"]:checked')?.value !== 'replace';
  };
  document.querySelectorAll('input[name="gearPictureAction"]').forEach(input => input.addEventListener('change', updatePictureAction));

  const updateTypeOptions = () => {
    const selected = type.value;
    type.innerHTML = typeOptionsHtml(category.value, selected, true);
  };
  const updateGeneratedIdentity = () => {
    if (context.item) return;
    id.value = uniqueGearId(name.value);
    if (autoPictureFilename && document.querySelector('input[name="gearPictureChoice"]:checked')?.value === 'yes') {
      pictureFilename.value = id.value ? `${id.value}.jpg` : '';
    }
  };

  category.addEventListener('change', updateTypeOptions);
  name.addEventListener('input', updateGeneratedIdentity);
  pictureFilename?.addEventListener('input', () => { autoPictureFilename = false; });
  document.querySelectorAll('input[name="gearPictureChoice"]').forEach(input => input.addEventListener('change', () => {
    toggleChoicePanel('gearPictureChoice','pictureFields');
    updatePictureAction();
    if (!context.item && input.checked && input.value === 'yes' && autoPictureFilename) pictureFilename.value = id.value ? `${id.value}.jpg` : '';
  }));
  document.querySelectorAll('input[name="gearNotesChoice"]').forEach(input => input.addEventListener('change', () => toggleChoicePanel('gearNotesChoice','notesFields')));

  document.querySelector('#addSpec')?.addEventListener('click', () => document.querySelector('#specRows')?.insertAdjacentHTML('beforeend', specRowHtml({label:'',value:''})));
  document.querySelector('#addLink')?.addEventListener('click', () => document.querySelector('#linkRows')?.insertAdjacentHTML('beforeend', linkRowHtml({label:'',url:''})));
  form.addEventListener('click', event => {
    const remove = event.target.closest('[data-remove-row]');
    if (!remove) return;
    const row = remove.closest('.repeater-row');
    const container = row?.parentElement;
    row?.remove();
    if (container && !container.querySelector('.repeater-row')) {
      container.insertAdjacentHTML('beforeend', container.id === 'specRows' ? specRowHtml({label:'',value:''}) : linkRowHtml({label:'',url:''}));
    }
  });

  document.querySelector('#previewNotes')?.addEventListener('click', () => previewNotes(id.value));
  document.querySelector('#cancelGearEditor')?.addEventListener('click', () => navigate(context.back));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const prepared = collectProductChange(context);
    if (!prepared) return;
    if (context.hasPicture && prepared.picture.action === 'remove' && !window.confirm('This item currently has a picture. Prepare a request to remove its picture association?')) return;
    if (context.hasNotes && prepared.notes.action === 'remove' && !window.confirm('This item currently has Notes. Prepare a request to remove its Notes Markdown file?')) return;
    showPreparedChange(prepared);
  });

  updateGeneratedIdentity();
  if (context.item) updateTypeOptions();
}

function bindSetupEditor(context) {
  const form = document.querySelector('#gearSetupEditor');
  if (!form) return;
  document.querySelectorAll('input[name="gearNotesChoice"]').forEach(input => input.addEventListener('change', () => toggleChoicePanel('gearNotesChoice','notesFields')));
  document.querySelector('#previewNotes')?.addEventListener('click', () => previewNotes(context.item.id));
  document.querySelector('#cancelGearEditor')?.addEventListener('click', () => navigate(context.back));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const errors = [];
    const type = document.querySelector('#gearType').value;
    const name = document.querySelector('#gearName').value.trim();
    validatePlainText(name,'Name',160,errors,true);
    if (!FIXED_TYPE_OPTIONS['rods-reels'].includes(type)) errors.push('Type is invalid for Rods & Reels.');
    const notesYes = document.querySelector('input[name="gearNotesChoice"]:checked')?.value === 'yes';
    const notesMarkdown = document.querySelector('#gearNotes')?.value || '';
    if (notesYes && !notesMarkdown.trim()) errors.push('Notes Markdown is required when Notes is Yes.');
    if (notesMarkdown.length > MAX_NOTES_LENGTH) errors.push(`Notes must be ${MAX_NOTES_LENGTH.toLocaleString()} characters or fewer.`);
    if (errors.length) return showFormErrors(errors);

    const nextItem = structuredClone(context.item);
    nextItem.type = type;
    nextItem.name = name;
    const candidate = { ...bundle, items:bundle.items.map(row => row.id === nextItem.id ? nextItem : row) };
    const validation = validateGearBundle(candidate);
    if (!validation.valid) return showFormErrors(validation.errors);

    const notes = notesChange(context.hasNotes, context.notesMarkdown, notesYes, notesMarkdown, nextItem.id);
    if (context.hasNotes && notes.action === 'remove' && !window.confirm('This item currently has Notes. Prepare a request to remove its Notes Markdown file?')) return;
    const summary = [];
    if (context.item.type !== nextItem.type) summary.push(`Type: ${context.item.type} → ${nextItem.type}`);
    if (context.item.name !== nextItem.name) summary.push(`Name: ${context.item.name} → ${nextItem.name}`);
    addNotesSummary(summary, notes);
    if (!summary.length) summary.push('No changes detected.');
    showFormErrors([]);
    showPreparedChange({
      format:'fishing-companion-gear-change-v1',
      operation:'edit',
      gearId:nextItem.id,
      summary,
      item:nextItem,
      picture:{ action:'chat-managed', note:'Rods & Reels pictures are component-specific and remain chat-managed.' },
      notes
    });
  });
}

function collectProductChange(context) {
  const errors = [];
  const editing = Boolean(context.item);
  const id = document.querySelector('#gearId').value.trim();
  const category = document.querySelector('#gearCategory').value;
  const type = document.querySelector('#gearType').value;
  const name = document.querySelector('#gearName').value.trim();
  const manufacturerName = document.querySelector('#gearManufacturer').value.trim();
  const model = document.querySelector('#gearModel').value.trim();

  if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) errors.push('A valid generated Gear ID is required.');
  if (!CATEGORY_META[category] || category === 'rods-reels') errors.push('Select a supported product Category. Rods & Reels paired setups remain chat-managed for creation.');
  const allowedTypes = gearTypeOptions(category);
  if (!type || !allowedTypes.includes(type)) errors.push('Select a valid Type for the selected Category.');
  validatePlainText(name,'Name',160,errors,true);
  validatePlainText(manufacturerName,'Manufacturer',120,errors,false);
  validatePlainText(model,'Model',160,errors,false);

  const specifications = [];
  document.querySelectorAll('#specRows .repeater-row').forEach((row,index) => {
    const label = row.querySelector('[data-spec-label]').value.trim();
    const value = row.querySelector('[data-spec-value]').value.trim();
    if (!label && !value) return;
    validatePlainText(label,`Specification ${index + 1} label`,80,errors,false);
    validatePlainText(value,`Specification ${index + 1} value`,500,errors,true);
    specifications.push(label ? {label,value} : {value});
  });

  const links = [];
  document.querySelectorAll('#linkRows .repeater-row').forEach((row,index) => {
    const label = row.querySelector('[data-link-label]').value.trim();
    const url = row.querySelector('[data-link-url]').value.trim();
    if (!label && !url) return;
    validatePlainText(label,`Link ${index + 1} text`,120,errors,true);
    if (!isHttpUrl(url)) errors.push(`Link ${index + 1} URL must be a valid http(s) URL.`);
    links.push({label,url});
  });

  const pictureYes = document.querySelector('input[name="gearPictureChoice"]:checked')?.value === 'yes';
  const pictureFilename = document.querySelector('#gearPictureFilename')?.value.trim() || '';
  const pictureAction = context.hasPicture ? document.querySelector('input[name="gearPictureAction"]:checked')?.value : 'add';
  if (pictureYes && (!context.hasPicture || pictureAction === 'replace') && !isSafeImageFilename(pictureFilename)) errors.push('Preferred source filename must be a filename ending in .jpg, .jpeg, .png, .webp, or .gif, with no folder path.');

  const notesYes = document.querySelector('input[name="gearNotesChoice"]:checked')?.value === 'yes';
  const notesMarkdown = document.querySelector('#gearNotes')?.value || '';
  if (notesYes && !notesMarkdown.trim()) errors.push('Notes Markdown is required when Notes is Yes.');
  if (notesMarkdown.length > MAX_NOTES_LENGTH) errors.push(`Notes must be ${MAX_NOTES_LENGTH.toLocaleString()} characters or fewer.`);

  const item = { id, category, type, name };
  if (manufacturerName) item.manufacturer = { name:manufacturerName };
  if (model) item.model = model;
  if (specifications.length) item.specifications = specifications;
  if (links.length) item.links = links;

  if (!editing && bundle.items.some(row => row.id === id)) errors.push(`Gear ID ${id} already exists.`);
  const candidate = { ...bundle, items:editing ? bundle.items.map(row => row.id === item.id ? item : row) : [...bundle.items,item] };
  const validation = validateGearBundle(candidate);
  if (!validation.valid) errors.push(...validation.errors);

  if (errors.length) { showFormErrors([...new Set(errors)]); return null; }
  showFormErrors([]);

  const picture = pictureChange(context, pictureYes, pictureFilename, id, pictureAction);
  const notes = notesChange(context.hasNotes, context.notesMarkdown, notesYes, notesMarkdown, id);
  const summary = editing ? productEditSummary(context.item, item) : [`Add new ${CATEGORY_META[category].label} item: ${name}`];
  addPictureSummary(summary, picture);
  addNotesSummary(summary, notes);
  if (!summary.length) summary.push('No changes detected.');

  return {
    format:'fishing-companion-gear-change-v1',
    operation:editing ? 'edit' : 'add',
    gearId:id,
    summary,
    item,
    picture,
    notes
  };
}

function pictureChange(context, desired, filename, id, pictureAction='add') {
  const current = context.currentMedia || null;
  const currentAsset = current?.asset || null;
  const mediaId = context.currentMediaId || current?.id || id;
  const currentSource = current?.sourcePath || current?.imageSource || null;
  const currentInfo = { mediaId, currentAsset, currentSource };
  if (!context.hasPicture && !desired) return { action:'none', hasPicture:false };
  if (context.hasPicture && !desired) return { action:'remove', hasPicture:false, ...currentInfo };
  if (context.hasPicture && pictureAction !== 'replace') return { action:'keep', hasPicture:true, ...currentInfo };
  const uploadPath = `pwa/assets/gear-source/${filename}`;
  return { action:context.hasPicture ? 'replace' : 'add', hasPicture:true, mediaId,
    sourceFilename:filename, uploadPath, ...(context.hasPicture ? currentInfo : {}) };
}

function notesChange(hadNotes, originalMarkdown, desired, markdown, id) {
  const path = `pwa/gear-content/${id}.md`;
  if (!hadNotes && !desired) return { action:'none', hasNotes:false, path };
  if (!hadNotes && desired) return { action:'create', hasNotes:true, path, markdown };
  if (hadNotes && !desired) return { action:'remove', hasNotes:false, path };
  return markdown === originalMarkdown
    ? { action:'keep', hasNotes:true, path, markdown }
    : { action:'update', hasNotes:true, path, markdown };
}

function productEditSummary(before, after) {
  const summary = [];
  const scalar = [
    ['Category', before.category, after.category],
    ['Type', before.type, after.type],
    ['Name', before.name, after.name],
    ['Manufacturer', before.manufacturer?.name || '', after.manufacturer?.name || ''],
    ['Model', before.model || '', after.model || '']
  ];
  for (const [label,oldValue,newValue] of scalar) if (oldValue !== newValue) summary.push(`${label}: ${oldValue || '(blank)'} → ${newValue || '(blank)'}`);
  if (stableJson(before.specifications || []) !== stableJson(after.specifications || [])) summary.push('Specifications updated.');
  if (stableJson(before.links || []) !== stableJson(after.links || [])) summary.push('Links updated.');
  return summary;
}

function addPictureSummary(summary, picture) {
  if (picture.action === 'add') summary.push(`Picture: add ${picture.sourceFilename}.`);
  else if (picture.action === 'replace') summary.push(`Picture: replace with ${picture.sourceFilename}.`);
  else if (picture.action === 'remove') summary.push('Picture: remove current picture association.');
}

function addNotesSummary(summary, notes) {
  if (notes.action === 'create') summary.push(`Notes: create ${notes.path}.`);
  else if (notes.action === 'update') summary.push(`Notes: update ${notes.path}.`);
  else if (notes.action === 'remove') summary.push(`Notes: remove ${notes.path}.`);
}

function showPreparedChange(prepared) {
  renderPreparedHandoff(document.querySelector('#gearPreparedPanel'), prepared, {
    id:'gearChangePackage', label:prepared.operation === 'add' ? 'Gear item' : 'Gear changes'
  });
}

function previewNotes(id) {
  const preview = document.querySelector('#notesPreview');
  const body = document.querySelector('#notesPreviewBody');
  const notes = document.querySelector('#gearNotes')?.value || '';
  if (!preview || !body) return;
  body.innerHTML = notes.trim() ? renderMarkdown(notes, { contentPath:`./gear-content/${id || 'new-item'}.md` }) : '<div class="empty">No Notes to preview.</div>';
  preview.hidden = false;
}

function toggleChoicePanel(groupName, panelId) {
  const yes = document.querySelector(`input[name="${groupName}"]:checked`)?.value === 'yes';
  const panel = document.querySelector(`#${panelId}`);
  if (panel) panel.hidden = !yes;
}

function showFormErrors(errors) {
  const box = document.querySelector('#gearFormErrors');
  if (!box) return;
  if (!errors.length) { box.hidden = true; box.innerHTML = ''; return; }
  box.innerHTML = `<strong>Please correct the following:</strong><ul>${errors.map(error => `<li>${escapeHtml(error)}</li>`).join('')}</ul>`;
  box.hidden = false;
  box.scrollIntoView({ behavior:'smooth', block:'center' });
}

function formField(label,control,help='') {
  return `<div class="form-field"><label class="field-label">${escapeHtml(label)}</label>${control}${help ? `<div class="form-help">${escapeHtml(help)}</div>` : ''}</div>`;
}

function categoryOptions(selected='') {
  return CATEGORY_ORDER.map(key => {
    const disabled = key === 'rods-reels' ? ' disabled' : '';
    const note = key === 'rods-reels' ? ' — paired setup; create in chat' : '';
    return `<option value="${escapeAttr(key)}"${key === selected ? ' selected' : ''}${disabled}>${escapeHtml(CATEGORY_META[key].label + note)}</option>`;
  }).join('');
}

function gearTypeOptions(category) {
  if (!category) return [];
  if (FIXED_TYPE_OPTIONS[category]) return [...FIXED_TYPE_OPTIONS[category]];
  return [...new Set(bundle.items.filter(item => item.category === category).map(item => item.type).filter(Boolean))]
    .sort((a,b) => displayGearType(a).localeCompare(displayGearType(b)));
}

function typeOptionsHtml(category, selected='', includePlaceholder=false) {
  const options = gearTypeOptions(category);
  const placeholder = includePlaceholder ? '<option value="">Select type…</option>' : '';
  return placeholder + options.map(type => `<option value="${escapeAttr(type)}" ${type === selected ? 'selected' : ''}>${escapeHtml(displayGearType(type))}</option>`).join('');
}

function specRowHtml(spec={}) {
  return `<div class="repeater-row specification-row">
    <input class="input" data-spec-label maxlength="80" placeholder="Label (optional)" aria-label="Specification label" value="${escapeAttr(spec.label || '')}">
    <input class="input" data-spec-value maxlength="500" placeholder="Value" aria-label="Specification value" value="${escapeAttr(spec.value || '')}">
    <button class="remove-row-button" type="button" data-remove-row aria-label="Remove specification">×</button>
  </div>`;
}

function linkRowHtml(link={}) {
  return `<div class="repeater-row link-row">
    <input class="input" data-link-label maxlength="120" placeholder="Link text" aria-label="Link text" value="${escapeAttr(link.label || '')}">
    <input class="input" data-link-url maxlength="2000" inputmode="url" placeholder="https://…" aria-label="URL" value="${escapeAttr(link.url || '')}">
    <button class="remove-row-button" type="button" data-remove-row aria-label="Remove link">×</button>
  </div>`;
}

function uniqueGearId(name) {
  return uniqueStableId(name, bundle.items.map(item => item.id));
}

function directMediaForItem(id) {
  return gearMedia.find(media => (media.owners || []).some(owner => owner?.gearItemId === id && !owner.component)) || null;
}

function mediaForItem(id) {
  return gearMedia.filter(media => (media.owners || []).some(owner => owner?.gearItemId === id));
}

function basename(value='') {
  return String(value).split('/').filter(Boolean).at(-1) || '';
}

function categoryIcon(meta) {
  return `<span class="category-card-icon" aria-hidden="true">${meta.iconHtml || escapeHtml(meta.icon || '')}</span>`;
}

function pageActions(content) {
  return `<div class="page-actions">${content}</div>`;
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
  const meta = displayGearType(item.type);
  return `<article class="item-card" data-gear-item="${escapeAttr(item.id)}"><h3>${escapeHtml(item.name)}</h3>${meta ? `<div class="item-meta"><span>${escapeHtml(meta)}</span></div>` : ''}</article>`;
}

function pageHeader(title,subtitle,back,search = null) {
  const searchControl = search ? `<input class="search section-search" id="${escapeAttr(search.id)}" type="search" placeholder="${escapeAttr(search.placeholder)}" />` : '';
  const actions = searchControl || back ? `<div class="section-title-actions">${searchControl}${back ? `<button class="back-button" data-gear-route="${escapeAttr(back)}">← Back</button>` : ''}</div>` : '';
  return `<div class="section-title"><div><h2>${escapeHtml(title)}</h2>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div>${actions}</div>`;
}

function detailCell(label,value) {
  return `<div class="detail-cell"><div class="label">${escapeHtml(label)}</div><div class="value">${value}</div></div>`;
}

function linksHtml(links) {
  return `<div class="detail-links">${links.map(link => `<a href="${escapeAttr(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.label)} ↗</a>`).join('<br>')}</div>`;
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

function displayGearType(type='') { return TYPE_LABELS[type] || type; }
function searchableText(item) {
  return normalize([item.name,displayGearType(item.type),item.manufacturer?.name,item.model,gearSpecificationText(item)].filter(Boolean).join(' '));
}
function dedupeLinks(links) { const seen=new Set(); return links.filter(link => link?.url && !seen.has(link.url) && seen.add(link.url)); }
function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function normalize(value='') { return String(value).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim(); }
function escapeHtml(value='') { return String(value).replace(/[&<>\"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char])); }
function escapeAttr(value='') { return escapeHtml(value).replace(/'/g,'&#39;'); }
