import assert from 'node:assert/strict';
import fs from 'node:fs';

const readJson = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const gear = readJson('./data/gear.seed.json');
const kb = readJson('./data/kb.seed.json');
const local = readJson('./local-media.json');
const mediaSources = readJson('./media-sources.json');
const styles = fs.readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
const applyMedia = fs.readFileSync(new URL('./apply-local-media.mjs', import.meta.url), 'utf8');

assert.equal(gear.dataVersion, '2026-09-04-my-gear-v2-final-content-1');
assert.equal(kb.dataVersion, '2026-09-04-kb-v1-final-content-1');

const lureTypes = new Set(gear.items.filter(item => item.category === 'lures').map(item => item.type));
for (const oldType of ['Soft plastics','Topwater / frogs','Trout / kokanee trolling attractors']) assert.equal(lureTypes.has(oldType), false, `Retired lure type remains: ${oldType}`);
for (const newType of ['Soft plastics and swimbaits','Topwater','Trolling lures']) assert.equal(lureTypes.has(newType), true, `Missing renamed lure type: ${newType}`);

const inlineSpinners = gear.items.filter(item => item.category === 'lures' && String(item.type || '').toLowerCase().includes('inline spinner'));
assert.ok(inlineSpinners.length > 0, 'Expected at least one inline spinner Gear item.');
for (const item of inlineSpinners) assert.match(item.notes || '', /kb:\/\/technique-inline-spinner/, `${item.id} must link to Inline Spinner.`);

const snapSwivels = gear.items.filter(item => item.category === 'snaps-swivels');
assert.ok(snapSwivels.length > 0, 'Expected Snaps & Swivels Gear items.');
for (const item of snapSwivels) assert.match(item.notes || '', /kb:\/\/technique-snaps-swivels/, `${item.id} must link to Snaps & Swivels.`);

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
  assert.match(markdown, /## Related/, `${filename} must include authored KB/Gear navigation links.`);
}

console.log(`Final content batch validated: ${newEntities.length} new KB entities, ${localImageCases.size} new local KB images, ${gearMediaCases.size} Gear-backed KB images.`);
