import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');

async function read(relative) { return fs.readFile(path.join(repo, relative), 'utf8'); }
async function write(relative, content) { await fs.writeFile(path.join(repo, relative), content); }
function replaceOnce(text, oldValue, newValue, label) {
  const first = text.indexOf(oldValue);
  if (first < 0) throw new Error(`Migration pattern not found: ${label}`);
  if (text.indexOf(oldValue, first + oldValue.length) >= 0) throw new Error(`Migration pattern is ambiguous: ${label}`);
  return text.slice(0, first) + newValue + text.slice(first + oldValue.length);
}
function replaceRegexOnce(text, regex, replacement, label) {
  const matches = [...text.matchAll(new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`))];
  if (matches.length !== 1) throw new Error(`Migration regex ${label} matched ${matches.length} times.`);
  return text.replace(regex, replacement);
}

// My Gear: structured facts only; authored Notes live only in deterministic Markdown.
const gearPath = 'pwa/data/gear.seed.json';
const gear = JSON.parse(await read(gearPath));
gear.schemaVersion = 3;
gear.dataVersion = '2026-09-04-my-gear-v3-external-notes-1';
let removedGearNotes = 0;
for (const item of gear.items || []) {
  if (Object.hasOwn(item, 'notes')) { delete item.notes; removedGearNotes++; }
}
if (removedGearNotes !== 41) throw new Error(`Expected to remove 41 inline Gear Notes, removed ${removedGearNotes}.`);
await write(gearPath, `${JSON.stringify(gear, null, 2)}\n`);

// Catch Log: preserve only the user-authored Exact Spot Notes as external Markdown.
const catchesPath = 'pwa/data/catches.seed.json';
const catches = JSON.parse(await read(catchesPath));
catches.schemaVersion = 2;
catches.dataVersion = '2026-09-04-catches-v2-external-notes-1';
await fs.mkdir(path.join(here, 'catch-content'), { recursive:true });
let migratedCatchNotes = 0;
for (const record of catches.catches || []) {
  const authored = typeof record.exactSpotNotes === 'string' ? record.exactSpotNotes.trim() : '';
  if (authored) {
    await fs.writeFile(path.join(here, 'catch-content', `${record.id}.md`), `${authored}\n`);
    migratedCatchNotes++;
  }
  delete record.exactSpotNotes;
  delete record.notes;
  delete record.source;
}
if (migratedCatchNotes !== 5) throw new Error(`Expected to migrate 5 Catch Exact Spot Notes, migrated ${migratedCatchNotes}.`);
await write(catchesPath, `${JSON.stringify(catches, null, 2)}\n`);

// Gear schema v3: inline Notes are not an allowed structured field.
let text = await read('pwa/gear-model.js');
text = replaceOnce(text, 'export const GEAR_SCHEMA_VERSION = 2;', 'export const GEAR_SCHEMA_VERSION = 3;', 'Gear schema version');
text = replaceOnce(text,
  "const PRODUCT_FIELDS = ['id','category','type','name','manufacturer','model','specifications','links','notes'];\nconst SETUP_FIELDS = ['id','category','type','name','rod','reel','notes'];",
  "const PRODUCT_FIELDS = ['id','category','type','name','manufacturer','model','specifications','links'];\nconst SETUP_FIELDS = ['id','category','type','name','rod','reel'];",
  'Gear allowed fields');
text = replaceOnce(text, "\n    validateNotes(item.notes, `${at}.notes`, errors);", '', 'Gear inline Notes validation call');
text = replaceRegexOnce(text, /\nfunction validateNotes\(notes, at, errors\) \{[\s\S]*?\n\}\n/, '\n', 'Gear inline Notes validator');
await write('pwa/gear-model.js', text);

// Gear runtime: external Markdown is now the only Notes source, with no legacy JSON fallback.
text = await read('pwa/gear-app.js');
text = replaceRegexOnce(text,
  /  \/\/ Direct source-tree development may not have the generated asset manifest yet\.[\s\S]*?  return loaded;\n\}/,
  "  const empty = { markdown:'', contentPath };\n  gearNoteCache.set(item.id, empty);\n  return empty;\n}",
  'Gear runtime legacy Notes fallback');
await write('pwa/gear-app.js', text);

// Catch schema v2: structured facts/relationships only.
text = await read('pwa/kb-model.js');
text = replaceOnce(text, 'export const CATCH_SCHEMA_VERSION = 1;', 'export const CATCH_SCHEMA_VERSION = 2;', 'Catch schema version');
text = replaceOnce(text,
  "const CATCH_FIELDS = ['id', 'date', 'time', 'size', 'speciesId', 'locationId', 'exactSpotNotes', 'rodReelSetupId', 'techniqueId', 'lureOrBait', 'picture', 'notes', 'source'];",
  "const CATCH_FIELDS = ['id', 'date', 'time', 'size', 'speciesId', 'locationId', 'rodReelSetupId', 'techniqueId', 'lureOrBait', 'picture'];",
  'Catch allowed fields');
text = replaceOnce(text, "    if (record.exactSpotNotes != null && !isText(record.exactSpotNotes)) errors.push(`${at}.exactSpotNotes must be Markdown text or null.`);\n", '', 'Catch exactSpotNotes validator');
text = replaceOnce(text, "    if (record.notes != null && !isText(record.notes)) errors.push(`${at}.notes must be Markdown text or null.`);\n    if (!isText(record.source)) errors.push(`${at}.source is required.`);\n", '', 'Catch notes/source validators');
await write('pwa/kb-model.js', text);

// Catch runtime: one optional Notes card loaded from catch-content/<stable-id>.md; no Provenance card.
text = await read('pwa/kb-app.js');
text = replaceOnce(text,
  "const state = { kb:null, catches:null, gear:null, content:new Map(), entityByContentPath:new Map() };",
  "const state = { kb:null, catches:null, gear:null, content:new Map(), entityByContentPath:new Map(), catchNoteAssets:null, catchNotes:new Map() };",
  'KB state catch Notes');
text = replaceOnce(text,
`  const [kb, catches, gear] = await Promise.all([\n    fetchJson('./data/kb.seed.json'),\n    fetchJson('./data/catches.seed.json'),\n    gearRepository.initialize()\n  ]);`,
`  const [kb, catches, gear, catchNoteAssets] = await Promise.all([\n    fetchJson('./data/kb.seed.json'),\n    fetchJson('./data/catches.seed.json'),\n    gearRepository.initialize(),\n    fetchJson('./catch-notes-assets.json', null)\n  ]);`,
  'KB initialize catch Notes manifest');
text = replaceOnce(text, '  state.gear = gear;\n  state.entityByContentPath', '  state.gear = gear;\n  state.catchNoteAssets = Array.isArray(catchNoteAssets) ? new Set(catchNoteAssets) : null;\n  state.entityByContentPath', 'KB catch Notes manifest state');
const newCatchRenderer = `async function renderCatch(id) {
  const record = state.catches.catches.find(item => item.id === id);
  if (!record) return navigate('#/kb/catches');
  const species = entity(record.speciesId);
  const location = entity(record.locationId);
  const setup = state.gear.items.find(item => item.id === record.rodReelSetupId);
  const method = entity(record.techniqueId);
  const lureOrBait = state.gear.items.find(item => item.id === record.lureOrBait.itemId);
  const catchPicture = record.picture || species?.picture || null;
  app.innerHTML = \`${'${pageHeader(`${species?.name || \'Catch\'} - ${formatCatchDate(record.date, record.time)}`, location?.name || \'\', \'#/kb/catches\')}'}
    ${'${representativePicture(catchPicture, species?.name || \'Catch\')}'}
    <section class="panel"><div class="detail-grid">
      ${'${detailLink(\'Species\', species?.name || record.speciesId, species ? `#/kb/entity/${species.id}` : \'\')}'}
      ${'${detailLink(\'Location\', location?.name || record.locationId, location ? `#/kb/entity/${location.id}` : \'\')}'}
      ${'${detailCell(\'Date / time\', escapeHtml(formatCatchDate(record.date, record.time))) }'}
      ${'${detailCell(\'Size\', escapeHtml(formatCatchSize(record.size))) }'}
      ${'${detailLink(\'Rod & reel\', setup?.name || \'Not recorded\', setup ? `#/inventory/item/${setup.id}` : \'\')}'}
      ${'${detailLink(\'Technique / presentation\', method?.name || \'Not recorded\', method ? `#/kb/entity/${method.id}` : \'\')}'}
      ${'${detailLink(record.lureOrBait.type === \'bait\' ? \'Bait\' : \'Lure\', lureOrBait?.name || record.lureOrBait.nameSnapshot, `#/inventory/item/${record.lureOrBait.itemId}`)}'}
    </div></section>
    ${'${catchNotesPanelShell()}'}\`;
  bindRoutes();
  await loadCatchNotesIntoPanel(record);
}

function catchNotesPanelShell() {
  return '<section class="panel" id="catchNotesPanel" hidden><h3>Notes</h3><div class="kb-content compact-content" id="catchNotesBody"></div></section>';
}

async function loadCatchNotesIntoPanel(record) {
  const result = await loadCatchNotes(record);
  if (location.hash !== \`#/kb/catch/${'${encodeURIComponent(record.id)}'}\`) return;
  const panel = document.querySelector('#catchNotesPanel');
  const body = document.querySelector('#catchNotesBody');
  if (!panel || !body) return;
  if (!result.markdown.trim()) { panel.remove(); return; }
  body.innerHTML = renderMarkdown(result.markdown, { contentPath:result.contentPath, entityByContentPath:state.entityByContentPath });
  panel.hidden = false;
}

async function loadCatchNotes(record) {
  if (state.catchNotes.has(record.id)) return state.catchNotes.get(record.id);
  const contentPath = \`./catch-content/${'${record.id}'}.md\`;
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

function catchCard(record)`;
text = replaceRegexOnce(text, /function renderCatch\(id\) \{[\s\S]*?\n\}\n\nfunction catchCard\(record\)/, newCatchRenderer, 'Catch leaf renderer');
text = replaceRegexOnce(text, /\nfunction markdownPanel\(title, markdown\) \{[\s\S]*?\n\}\n/, '\n', 'retired Catch markdownPanel helper');
text = replaceRegexOnce(text, /async function fetchJson\(path\) \{[\s\S]*?\n\}/,
`async function fetchJson(path, fallback) {
  try {
    const response = await fetch(path, { cache:'no-cache' });
    if (!response.ok) {
      if (arguments.length > 1) return fallback;
      throw new Error(\`Could not load ${'${path}'}.\`);
    }
    return response.json();
  } catch (error) {
    if (arguments.length > 1) return fallback;
    throw error;
  }
}`,
  'KB fetchJson fallback support');
await write('pwa/kb-app.js', text);

// Offline cache both Gear and Catch authored Markdown manifests.
text = await read('pwa/sw.js');
text = replaceOnce(text, "  './gear-notes-assets.json',\n  './kb-assets.json',", "  './gear-notes-assets.json',\n  './catch-notes-assets.json',\n  './kb-assets.json',", 'service worker Catch Notes manifest');
text = replaceOnce(text,
  "    const gearNoteAssets = gearNotesResponse ? await gearNotesResponse.json() : [];\n    await cache.addAll(gearNoteAssets || []);\n    const kbResponse",
  "    const gearNoteAssets = gearNotesResponse ? await gearNotesResponse.json() : [];\n    await cache.addAll(gearNoteAssets || []);\n    const catchNotesResponse = await cache.match('./catch-notes-assets.json');\n    const catchNoteAssets = catchNotesResponse ? await catchNotesResponse.json() : [];\n    await cache.addAll(catchNoteAssets || []);\n    const kbResponse",
  'service worker Catch Notes precache');
await write('pwa/sw.js', text);

// Retire the Gear-only build stage; the unified stage handles both authored-note domains.
await fs.rm(path.join(here, 'apply-gear-notes.mjs'));

// Convert the temporary self-migration workflow back to normal read-only CI before committing.
const workflowPath = '.github/workflows/fishing-pwa-build.yml';
text = await read(workflowPath);
text = replaceOnce(text, '  contents: write\n', '  contents: read\n', 'workflow temporary write permission');
text = replaceOnce(text,
`      - uses: actions/checkout@v4
        with:
          ref: \${{ github.head_ref || github.ref }}
`,
`      - uses: actions/checkout@v4
`,
  'workflow temporary head checkout');
text = replaceRegexOnce(text, /      # BEGIN ONE-TIME AUTHORED NOTES MIGRATION[\s\S]*?      # END ONE-TIME AUTHORED NOTES MIGRATION\n/, '', 'workflow one-time migration block');
await write(workflowPath, text);

// Delete this one-time migration source from the final branch state.
await fs.rm(fileURLToPath(import.meta.url));
console.log(`Authored Notes migration complete: ${removedGearNotes} Gear inline Notes removed; ${migratedCatchNotes} Catch Notes externalized.`);
