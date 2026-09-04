import assert from 'node:assert/strict';
import fs from 'node:fs';

const readJson = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const gear = readJson('./data/gear.seed.json');
const kb = readJson('./data/kb.seed.json');
const catches = readJson('./data/catches.seed.json');
const local = readJson('./local-media.json');
const mediaSources = readJson('./media-sources.json');
const styles = fs.readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
const applyMedia = fs.readFileSync(new URL('./apply-local-media.mjs', import.meta.url), 'utf8');
const applyAuthoredNotes = fs.readFileSync(new URL('./apply-authored-notes.mjs', import.meta.url), 'utf8');

const gearNotes = item => {
  const url = new URL(`./gear-content/${item.id}.md`, import.meta.url);
  return fs.existsSync(url) ? fs.readFileSync(url, 'utf8') : '';
};
const catchNotes = record => {
  const url = new URL(`./catch-content/${record.id}.md`, import.meta.url);
  return fs.existsSync(url) ? fs.readFileSync(url, 'utf8') : '';
};

assert.equal(gear.schemaVersion, 3);
assert.equal(gear.dataVersion, '2026-09-04-my-gear-v3-external-notes-1');
assert.equal(kb.dataVersion, '2026-09-04-kb-v1-final-content-1');
assert.equal(catches.schemaVersion, 2);
assert.equal(catches.dataVersion, '2026-09-04-catches-v2-external-notes-1');
assert.ok(gear.items.every(item => !Object.hasOwn(item, 'notes')), 'Structured Gear seed must not contain inline Notes.');
for (const record of catches.catches) {
  for (const field of ['exactSpotNotes','notes','source']) assert.equal(Object.hasOwn(record, field), false, `${record.id} must not retain ${field}.`);
}

const externalNoteFiles = fs.readdirSync(new URL('./gear-content/', import.meta.url)).filter(name => name.endsWith('.md'));
for (const filename of externalNoteFiles) {
  const id = filename.replace(/\.md$/i, '');
  assert.ok(gear.items.some(item => item.id === id), `${filename} must map to a current Gear stable ID.`);
}
assert.equal(externalNoteFiles.length, 41, 'Expected all 41 authored Gear Notes to remain externalized.');
const catchNoteFiles = fs.readdirSync(new URL('./catch-content/', import.meta.url)).filter(name => name.endsWith('.md'));
assert.equal(catchNoteFiles.length, 5, 'Expected the five authored Catch Exact Spot Notes to be externalized.');
for (const filename of catchNoteFiles) {
  const id = filename.replace(/\.md$/i, '');
  assert.ok(catches.catches.some(record => record.id === id), `${filename} must map to a current Catch stable ID.`);
}
assert.match(catchNotes(catches.catches.find(record => record.id === 'catch-2026-07-27-silver-lake-largemouth-01')), /beach north of the county park office/,
  'Silver Lake authored Exact Spot Notes content must be preserved.');
assert.match(catchNotes(catches.catches.find(record => record.id === 'catch-2026-08-04-lake-sammamish-perch-01')), /bench west of Tibbetts Beach/,
  'Lake Sammamish authored Exact Spot Notes content must be preserved.');
assert.match(catchNotes(catches.catches.find(record => record.id === 'catch-2026-08-19-mayfield-pikeminnow-01')), /point at the southern end of Ike Kinswa State Park/,
  'Mayfield authored Exact Spot Notes content must be preserved.');
assert.match(applyAuthoredNotes, /gear-notes-assets\.json/, 'Build must generate the Gear Notes offline asset manifest.');
assert.match(applyAuthoredNotes, /catch-notes-assets\.json/, 'Build must generate the Catch Notes offline asset manifest.');
assert.match(applyAuthoredNotes, /Structured My Gear seed must not contain inline notes/,
  'Build must reject reintroduced inline Gear Notes.');
assert.match(applyAuthoredNotes, /Structured Catch \$\{record\.id\} must not contain \$\{field\}/,
  'Build must reject reintroduced structured Catch narrative/provenance fields.');

const lureTypes = new Set(gear.items.filter(item => item.category === 'lures').map(item => item.type));
for (const oldType of ['Soft plastics','Topwater / frogs','Trout / kokanee trolling attractors']) assert.equal(lureTypes.has(oldType), false, `Retired lure type remains: ${oldType}`);
for (const newType of ['Soft plastics and swimbaits','Topwater','Trolling lures']) assert.equal(lureTypes.has(newType), true, `Missing renamed lure type: ${newType}`);

const inlineSpinners = gear.items.filter(item => item.category === 'lures' && String(item.type || '').toLowerCase().includes('inline spinner'));
assert.ok(inlineSpinners.length > 0, 'Expected at least one inline spinner Gear item.');
for (const item of inlineSpinners) assert.match(gearNotes(item), /kb:\/\/technique-inline-spinner/, `${item.id} must link to Inline Spinner.`);

const snapSwivels = gear.items.filter(item => item.category === 'snaps-swivels');
assert.ok(snapSwivels.length > 0, 'Expected Snaps & Swivels Gear items.');
for (const item of snapSwivels) assert.match(gearNotes(item), /kb:\/\/technique-snaps-swivels/, `${item.id} must link to Snaps & Swivels.`);

for (const id of ['south-bend-hook-assortment','south-bend-assorted-brass-swivels']) {
  const item = gear.items.find(record => record.id === id);
  assert.ok(item, `Missing ${id}`);
  assert.ok((item.specifications || []).some(spec => spec.value === 'Brass' && !('label' in spec)), `${id} must show Brass without a Material label.`);
  assert.equal((item.specifications || []).some(spec => spec.label === 'Material'), false, `${id} must not retain Material label.`);
}

const kbById = new Map(kb.entities.map(entity => [entity.id, entity]));
const existingNames = new Map([
  ['technique-swimbait-soft-jerk-shad','Swimbait'],
  ['technique-chatterbait-bladed-jig','Chatterbait'],
  ['technique-jigs','Jig'],
  ['technique-frogs','Frog']
]);
for (const [id, name] of existingNames) assert.equal(kbById.get(id)?.name, name, `${id} display name`);

const newEntities = [
  ['technique-inline-spinner','equipment','Inline Spinner','./kb-content/techniques/inline-spinner.md'],
  ['technique-snaps-swivels','equipment','Snaps & Swivels','./kb-content/techniques/snaps-swivels.md'],
  ['technique-flasher-rig','equipment','Flasher Rig','./kb-content/techniques/flasher-rig.md'],
  ['technique-inline-trolling-rig','equipment','Inline Trolling Rig','./kb-content/techniques/inline-trolling-rig.md'],
  ['technique-bobber-rig','equipment','Bobber Rig','./kb-content/techniques/bobber-rig.md'],
  ['technique-slip-sinker-rig','equipment','Slip Sinker Rig','./kb-content/techniques/slip-sinker-rig.md'],
  ['technique-spring-fishing','technique','Spring Fishing','./kb-content/techniques/spring-fishing.md']
];
for (const [id,type,name,content] of newEntities) {
  const entity = kbById.get(id);
  assert.ok(entity, `Missing new KB entity ${id}`);
  assert.equal(entity.type, type, `${id} type`);
  assert.equal(entity.name, name, `${id} name`);
  assert.equal(entity.content, content, `${id} content path`);
  assert.equal(fs.existsSync(new URL(content.replace(/^\.\//,'./'), import.meta.url)), true, `${id} Markdown file must exist.`);
}

const kbMedia = new Map(local.kb.map(item => [item.entityId, item]));
const localImageCases = new Map([
  ['technique-inline-spinner','./assets/kb/equipment/inline-spinner-rig.png'],
  ['technique-drop-shot','./assets/kb/equipment/drop-shot.png'],
  ['technique-wacky-worm','./assets/kb/equipment/wacky-worm.png'],
  ['technique-ned-rig','./assets/kb/equipment/ned-rig.png'],
  ['technique-snaps-swivels','./assets/kb/equipment/snap-swivel.png'],
  ['technique-flasher-rig','./assets/kb/equipment/flasher-rig.png'],
  ['technique-inline-trolling-rig','./assets/kb/equipment/inline-trolling-rig.png'],
  ['technique-bobber-rig','./assets/kb/equipment/bobber-rig.png'],
  ['technique-slip-sinker-rig','./assets/kb/equipment/slip-sinker-rig.png'],
  ['species-rainbow-trout','./assets/kb/species/rainbow-trout.png'],
  ['species-coastal-cutthroat-trout','./assets/kb/species/coastal-cutthroat-trout.png'],
  ['species-smallmouth-bass','./assets/kb/species/smallmouth-bass.png'],
  ['species-largemouth-bass','./assets/kb/species/largemouth-bass.png']
]);
for (const [id, source] of localImageCases) {
  assert.equal(kbMedia.get(id)?.source, source, `${id} local image source`);
  assert.equal(fs.existsSync(new URL(source, import.meta.url)), true, `${source} must exist.`);
}

const gearMediaCases = new Map([
  ['technique-swimbait-soft-jerk-shad','fin-sanity-bluegill'],
  ['technique-jerkbait','berkley-stunna'],
  ['technique-crankbait','strike-king-kvd-square-bill-1'],
  ['technique-chatterbait-bladed-jig','zman-original-chatterbait'],
  ['technique-spinnerbait','strike-king-red-eyed-special'],
  ['technique-jigs','strike-king-tour-grade-football-jig']
]);
const mediaIds = new Set(mediaSources.items.map(item => item.id));
for (const [id, mediaId] of gearMediaCases) {
  assert.equal(kbMedia.get(id)?.gearMediaId, mediaId, `${id} Gear picture source`);
  assert.ok(mediaIds.has(mediaId), `Unknown Gear media ${mediaId}`);
}
assert.equal(kbMedia.get('technique-frogs')?.gearItemId, 'booyah-pad-crasher');

assert.match(styles, /\.compact-toolbar\s*\{[^}]*justify-content:\s*flex-end;/s, 'Search/filter dropdown toolbar must align right.');
assert.match(styles, /\[hidden\]\s*\{[^}]*display:\s*none\s*!important;/s,
  'The hidden attribute must override grid/list display rules so root Search replaces category cards.');
assert.match(styles, /\.gear-card-picture\s*\{[^}]*width:\s*78px;[^}]*height:\s*78px;/s,
  'Gear card thumbnails must use a square frame.');
assert.match(styles, /\.kb-card-picture\s*\{[^}]*width:\s*78px;[^}]*height:\s*78px;/s,
  'Knowledge Base card thumbnails must use a square frame.');
assert.match(styles, /\.catch-card-picture\s*\{[^}]*width:\s*72px;[^}]*height:\s*72px;/s,
  'Catch card thumbnails must use a square frame.');
assert.match(styles, /\.gear-card-picture, \.kb-card-picture, \.catch-card-picture\s*\{[^}]*object-fit:\s*contain;[^}]*background:\s*#fff;/s,
  'All card thumbnails must preserve the full image with white letterboxing instead of cropping.');
assert.match(applyMedia, /if \(item\.gearMediaId\)/, 'Local-media build must support reusing Gear media on KB pages.');
assert.match(applyMedia, /byMediaId\.get\(item\.gearMediaId\)/, 'Gear-backed KB media must resolve by stable media ID.');

for (const filename of [
  './kb-content/techniques/swimbait-soft-jerk-shad.md','./kb-content/techniques/jerkbait.md','./kb-content/techniques/crankbait.md',
  './kb-content/techniques/chatterbait-bladed-jig.md','./kb-content/techniques/spinnerbait.md','./kb-content/techniques/jigs.md',
  './kb-content/techniques/frogs.md','./kb-content/techniques/drop-shot.md','./kb-content/techniques/wacky-worm.md',
  './kb-content/techniques/ned-rig.md','./kb-content/techniques/trout-fishing.md'
]) {
  const markdown = fs.readFileSync(new URL(filename, import.meta.url), 'utf8');
  assert.ok(markdown.length > 100, `${filename} replacement content is unexpectedly short.`);
  assert.match(markdown, /(?:gear|kb):\/\/[a-z0-9-]+/, `${filename} must retain at least one authored KB/Gear stable-ID navigation link.`);
}

console.log(`Final content validated: ${externalNoteFiles.length} Gear Notes, ${catchNoteFiles.length} Catch Notes, ${newEntities.length} new KB entities, ${localImageCases.size} local KB images, ${gearMediaCases.size} Gear-backed KB images.`);
