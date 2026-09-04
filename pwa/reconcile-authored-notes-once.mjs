import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const read = relative => fs.readFile(path.join(repo, relative), 'utf8');
const write = (relative, content) => fs.writeFile(path.join(repo, relative), content);

function replaceRegexOnce(text, regex, replacement, label) {
  const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
  const matches = [...text.matchAll(new RegExp(regex.source, flags))];
  if (matches.length !== 1) throw new Error(`${label} matched ${matches.length} times.`);
  return text.replace(regex, replacement);
}

let kbApp = await read('pwa/kb-app.js');
const catchBlock = `async function renderCatch(id) {
  const record = state.catches.catches.find(item => item.id === id);
  if (!record) return navigate('#/kb/catches');
  const species = entity(record.speciesId);
  const location = entity(record.locationId);
  const method = entity(record.techniqueId);
  const setup = gear(record.rodReelSetupId);
  const lureOrBait = gear(record.lureOrBait.itemId);
  const catchPicture = record.picture || species?.picture || null;
  app.innerHTML = \`${'${pageHeader(species?.name || \'Catch\', formatCatchDate(record.date, record.time), \'#/kb/catches\')}'}
    ${'${representativePicture(catchPicture, `${species?.name || \'Catch\'} on ${record.date}`)}'}
    <section class="panel"><div class="detail-grid">
      ${'${detailLink(\'Species\', species?.name, species ? `#/kb/entity/${species.id}` : \'\')}'}
      ${'${detailLink(\'Location\', location?.name, location ? `#/kb/entity/${location.id}` : \'\')}'}
      ${'${detailCell(\'Size\', formatCatchSize(record.size))}'}
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
kbApp = replaceRegexOnce(kbApp, /async function renderCatch\(id\) \{[\s\S]*?\nfunction catchCard\(record\)/, catchBlock, 'Catch leaf block');
await write('pwa/kb-app.js', kbApp);

let build = await read('pwa/build.mjs');
build = build.replace("for (const item of gearSeed.items) validateGearNotesLinks(item.notes, item.id, gearIds, kbIds);\n", '');
build = replaceRegexOnce(build, /\nfunction validateGearNotesLinks\(markdown, itemId, gearIds, kbIds\) \{[\s\S]*?\n\}\n\nfunction validateContentLinks/, '\nfunction validateContentLinks', 'retired inline Gear Notes build validator');
await write('pwa/build.mjs', build);

await fs.rm(fileURLToPath(import.meta.url));
console.log('Final authored Notes implementation reconciliation applied.');
