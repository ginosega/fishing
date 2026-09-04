import fs from 'node:fs/promises';

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const writeJson = async (path, value) => fs.writeFile(path, `${JSON.stringify(value, null, 2)}\n`);

const gearPath = 'pwa/data/gear.seed.json';
const kbPath = 'pwa/data/kb.seed.json';
const localMediaPath = 'pwa/local-media.json';
const applyMediaPath = 'pwa/apply-local-media.mjs';
const stylesPath = 'pwa/styles.css';

const gear = await readJson(gearPath);
gear.dataVersion = '2026-09-04-my-gear-v2-final-content-1';

function appendNote(item, sentence) {
  const current = typeof item.notes === 'string' ? item.notes.trim() : '';
  if (current.includes(sentence)) return;
  item.notes = [current, sentence].filter(Boolean).join('\n\n');
}

let inlineSpinnerCount = 0;
let snapSwivelCount = 0;
for (const item of gear.items) {
  if (item.category === 'lures') {
    if (item.type === 'Soft plastics') item.type = 'Soft plastics and swimbaits';
    if (item.type === 'Topwater / frogs') item.type = 'Topwater';
    if (item.type === 'Trout / kokanee trolling attractors') item.type = 'Trolling lures';
    if (String(item.type || '').toLowerCase().includes('inline spinner')) {
      appendNote(item, 'See [Inline Spinner](kb://technique-inline-spinner) for usage and technique.');
      inlineSpinnerCount += 1;
    }
  }
  if (item.category === 'snaps-swivels') {
    appendNote(item, 'See [Snaps & Swivels](kb://technique-snaps-swivels) for usage and technique.');
    snapSwivelCount += 1;
  }
  if (['south-bend-hook-assortment','south-bend-assorted-brass-swivels'].includes(item.id)) {
    for (const spec of item.specifications || []) if (spec.label === 'Material') delete spec.label;
  }
  if (typeof item.notes === 'string') {
    item.notes = item.notes
      .replaceAll('[Swimbait / Soft Jerk Shad](kb://technique-swimbait-soft-jerk-shad)', '[Swimbait](kb://technique-swimbait-soft-jerk-shad)')
      .replaceAll('[Jigs](kb://technique-jigs)', '[Jig](kb://technique-jigs)')
      .replaceAll('[Frogs](kb://technique-frogs)', '[Frog](kb://technique-frogs)')
      .replaceAll('[Chatterbait / Bladed Jig](kb://technique-chatterbait-bladed-jig)', '[Chatterbait](kb://technique-chatterbait-bladed-jig)');
  }
}
if (!inlineSpinnerCount) throw new Error('No inline-spinner Gear entries were found.');
if (!snapSwivelCount) throw new Error('No Snaps & Swivels Gear entries were found.');
await writeJson(gearPath, gear);

const kb = await readJson(kbPath);
kb.dataVersion = '2026-09-04-kb-v1-final-content-1';
const kbById = new Map(kb.entities.map(entity => [entity.id, entity]));

function updateEntity(id, fields) {
  const entity = kbById.get(id);
  if (!entity) throw new Error(`Missing existing KB entity ${id}`);
  Object.assign(entity, fields);
}
function ensureEntity(entity) {
  const existing = kbById.get(entity.id);
  if (existing) Object.assign(existing, entity);
  else {
    kb.entities.push(entity);
    kbById.set(entity.id, entity);
  }
}

updateEntity('technique-swimbait-soft-jerk-shad', {
  name:'Swimbait',
  description:'Lifelike baitfish presentations, rigging, retrieves, and swimbait styles.'
});
updateEntity('technique-jerkbait', { name:'Jerkbait' });
updateEntity('technique-crankbait', { name:'Crankbait' });
updateEntity('technique-chatterbait-bladed-jig', {
  name:'Chatterbait',
  description:'Bladed-jig presentation for grass, stained water, cover, and reaction bites.'
});
updateEntity('technique-spinnerbait', { name:'Spinnerbait' });
updateEntity('technique-jigs', {
  name:'Jig',
  description:'Casting, swim, football-head, and finesse jig guidance.'
});
updateEntity('technique-frogs', {
  name:'Frog',
  description:'Frog tackle, retrieves, hook-set timing, lure types, and common modifications.'
});
updateEntity('technique-drop-shot', { name:'Drop Shot' });
updateEntity('technique-wacky-worm', { name:'Wacky Worm' });
updateEntity('technique-ned-rig', { name:'Ned Rig' });
updateEntity('technique-trout-fishing', {
  name:'Trout Fishing',
  description:'Casting, bank-fishing, bobber, still-fishing, and kayak-trolling guidance.'
});

ensureEntity({
  id:'technique-inline-spinner', type:'equipment', name:'Inline Spinner',
  description:'Casting and retrieve guidance for inline spinners in lakes, rivers, and creeks.',
  picture:null, content:'./kb-content/techniques/inline-spinner.md'
});
ensureEntity({
  id:'technique-snaps-swivels', type:'equipment', name:'Snaps & Swivels',
  description:'When to use snaps, swivels, and snap swivels without hurting lure action.',
  picture:null, content:'./kb-content/techniques/snaps-swivels.md'
});
ensureEntity({
  id:'technique-flasher-rig', type:'equipment', name:'Flasher Rig',
  description:'Kayak-trolling rig with a dodger, leader, and trout or kokanee lure.',
  picture:null, content:'./kb-content/techniques/flasher-rig.md'
});
ensureEntity({
  id:'technique-inline-trolling-rig', type:'equipment', name:'Inline Trolling Rig',
  description:'Simple weighted trolling rig for trout and kokanee from a kayak.',
  picture:null, content:'./kb-content/techniques/inline-trolling-rig.md'
});
ensureEntity({
  id:'technique-bobber-rig', type:'equipment', name:'Bobber Rig',
  description:'Float rig with split shot, swivel, leader, and bait for suspended trout.',
  picture:null, content:'./kb-content/techniques/bobber-rig.md'
});
ensureEntity({
  id:'technique-slip-sinker-rig', type:'equipment', name:'Slip Sinker Rig',
  description:'Bottom-fishing rig with an egg sinker, swivel, leader, and bait.',
  picture:null, content:'./kb-content/techniques/slip-sinker-rig.md'
});
ensureEntity({
  id:'technique-spring-fishing', type:'technique', name:'Spring Fishing',
  description:'Spring bass patterns by temperature, wind, clarity, depth, and presentation.',
  picture:null, content:'./kb-content/techniques/spring-fishing.md'
});
await writeJson(kbPath, kb);

const local = await readJson(localMediaPath);
function upsertKb(entry) {
  const index = local.kb.findIndex(item => item.entityId === entry.entityId);
  if (index >= 0) local.kb[index] = entry;
  else local.kb.push(entry);
}

for (const entry of [
  { entityId:'technique-swimbait-soft-jerk-shad', gearMediaId:'fin-sanity-bluegill', alt:'Fin-Sanity Bluegill swimbait', caption:'Fin-Sanity Bluegill', gearItemId:'fin-sanity-bluegill' },
  { entityId:'technique-jerkbait', gearMediaId:'berkley-stunna', alt:'Berkley Stunna jerkbait', caption:'Berkley Stunna', gearItemId:'berkley-stunna' },
  { entityId:'technique-crankbait', gearMediaId:'strike-king-kvd-square-bill-1', alt:'Strike King KVD Square Bill 1.0 crankbait', caption:'Strike King KVD Square Bill 1.0', gearItemId:'strike-king-kvd-square-bill-1' },
  { entityId:'technique-chatterbait-bladed-jig', gearMediaId:'zman-original-chatterbait', alt:'Z-Man Original ChatterBait', caption:'Z-Man Original ChatterBait', gearItemId:'zman-original-chatterbait' },
  { entityId:'technique-spinnerbait', gearMediaId:'strike-king-red-eyed-special', alt:'Strike King Red Eyed Special spinnerbait', caption:'Strike King Red Eyed Special', gearItemId:'strike-king-red-eyed-special' },
  { entityId:'technique-jigs', gearMediaId:'strike-king-tour-grade-football-jig', alt:'Strike King Tour Grade Football Jig', caption:'Strike King Tour Grade Football Jig', gearItemId:'strike-king-tour-grade-football-jig' },
  { entityId:'technique-inline-spinner', source:'./assets/kb/equipment/inline-spinner-rig.png', alt:'Inline spinner rig', caption:'Inline spinner rig', credit:null, sourceUrl:null },
  { entityId:'technique-drop-shot', source:'./assets/kb/equipment/drop-shot.png', alt:'Drop shot rig', caption:'Drop shot rig', credit:null, sourceUrl:null },
  { entityId:'technique-wacky-worm', source:'./assets/kb/equipment/wacky-worm.png', alt:'Wacky worm rig', caption:'Wacky worm rig', credit:null, sourceUrl:null },
  { entityId:'technique-ned-rig', source:'./assets/kb/equipment/ned-rig.png', alt:'Ned rig', caption:'Ned rig', credit:null, sourceUrl:null },
  { entityId:'technique-snaps-swivels', source:'./assets/kb/equipment/snap-swivel.png', alt:'Snap swivel', caption:'Snap swivel', credit:null, sourceUrl:null },
  { entityId:'technique-flasher-rig', source:'./assets/kb/equipment/flasher-rig.png', alt:'Flasher trolling rig', caption:'Flasher rig', credit:null, sourceUrl:null },
  { entityId:'technique-inline-trolling-rig', source:'./assets/kb/equipment/inline-trolling-rig.png', alt:'Inline trolling rig', caption:'Inline trolling rig', credit:null, sourceUrl:null },
  { entityId:'technique-bobber-rig', source:'./assets/kb/equipment/bobber-rig.png', alt:'Bobber rig', caption:'Bobber rig', credit:null, sourceUrl:null },
  { entityId:'technique-slip-sinker-rig', source:'./assets/kb/equipment/slip-sinker-rig.png', alt:'Slip sinker rig', caption:'Slip sinker rig', credit:null, sourceUrl:null },
  { entityId:'species-rainbow-trout', source:'./assets/kb/species/rainbow-trout.png', alt:'Rainbow trout', caption:'Rainbow trout', credit:null, sourceUrl:null },
  { entityId:'species-coastal-cutthroat-trout', source:'./assets/kb/species/coastal-cutthroat-trout.png', alt:'Coastal cutthroat trout', caption:'Coastal cutthroat trout', credit:null, sourceUrl:null },
  { entityId:'species-smallmouth-bass', source:'./assets/kb/species/smallmouth-bass.png', alt:'Smallmouth bass', caption:'Smallmouth bass', credit:null, sourceUrl:null },
  { entityId:'species-largemouth-bass', source:'./assets/kb/species/largemouth-bass.png', alt:'Largemouth bass', caption:'Largemouth bass', credit:null, sourceUrl:null }
]) upsertKb(entry);
await writeJson(localMediaPath, local);

let apply = await fs.readFile(applyMediaPath, 'utf8');
const oldKbStart = `  const source = localSource(item.source, 'assets/kb/');\n  const bytes = await readValidatedImage(source);\n  const relative = normalizeRelative(item.source);\n  const built = path.join(dist, relative);\n  await fs.mkdir(path.dirname(built), { recursive:true });\n  await fs.writeFile(built, bytes);\n\n  const previous = entity.picture?.src;`;
const newKbStart = `  if (item.gearMediaId) {\n    const media = byMediaId.get(item.gearMediaId);\n    if (!media?.asset) throw new Error(\`KB media for \${item.entityId} references unavailable Gear media \${item.gearMediaId}.\`);\n    entity.picture = {\n      src:media.asset,\n      alt:item.alt || media.alt || entity.name,\n      caption:item.caption || entity.name,\n      credit:item.credit ?? null,\n      sourceUrl:item.sourceUrl ?? null,\n      ...(item.gearItemId ? { gearItemId:item.gearItemId } : {})\n    };\n    continue;\n  }\n  const source = localSource(item.source, 'assets/kb/');\n  const bytes = await readValidatedImage(source);\n  const relative = normalizeRelative(item.source);\n  const built = path.join(dist, relative);\n  await fs.mkdir(path.dirname(built), { recursive:true });\n  await fs.writeFile(built, bytes);\n\n  const previous = entity.picture?.src;`;
if (!apply.includes(oldKbStart)) throw new Error('Could not locate KB local-media block to extend.');
apply = apply.replace(oldKbStart, newKbStart);
await fs.writeFile(applyMediaPath, apply);

let styles = await fs.readFile(stylesPath, 'utf8');
if (!styles.includes('.compact-toolbar { margin-top: -4px; }')) throw new Error('Could not locate compact-toolbar CSS rule.');
styles = styles.replace('.compact-toolbar { margin-top: -4px; }', '.compact-toolbar { margin-top: -4px; justify-content: flex-end; }');
await fs.writeFile(stylesPath, styles);

console.log(`Final content materialized: ${gear.items.length} Gear records; ${kb.entities.length} KB entities; ${inlineSpinnerCount} inline-spinner notes; ${snapSwivelCount} snaps/swivels notes.`);
