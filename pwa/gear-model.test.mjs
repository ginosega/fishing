import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { validateGearBundle, GEAR_CATEGORIES, GEAR_SCHEMA_VERSION, gearLinks } from './gear-model.js';

const seed = JSON.parse(await fs.readFile(new URL('./data/gear.seed.json', import.meta.url), 'utf8'));
const result = validateGearBundle(seed);
assert.equal(result.valid, true, result.errors.join('\n'));
assert.equal(seed.schemaVersion, GEAR_SCHEMA_VERSION);
assert.equal(seed.schemaVersion, 3);
assert.equal(seed.items.length, 63);
assert.equal(seed.dataVersion, '2026-09-04-my-gear-v3-external-notes-1');
assert.equal('profiles' in seed, false, 'Gear schema v3 must not contain profiles.');
assert.equal(seed.items.some(item => item.category === 'knots'), false, 'Knots must not be part of My Gear.');
for (const category of GEAR_CATEGORIES) assert.ok(seed.items.some(item => item.category === category), `Missing category ${category}`);

const legacyFields = ['notes','usage','connections','usageProfileId','connectionProfileId','mainLine','leader','configuration','knowledgeRefs','aliases'];
for (const item of seed.items) {
  for (const field of legacyFields) assert.equal(field in item, false, `${item.id} must not contain retired/speculative field ${field}.`);
}

const manufacturerCases = [
  ['river2sea-whopper-plopper-60','River2Sea'],
  ['sufix-832-15','Sufix'],
  ['seaguar-invizx-12','Seaguar'],
  ['swiveling-trolling-sinkers','Eagle Claw'],
  ['cylinder-weights','THKFISH']
];
for (const [id,label] of manufacturerCases) {
  const item = seed.items.find(record => record.id === id);
  assert.ok(item, `Missing ${id}`);
  const links = gearLinks(item);
  assert.equal(links[0]?.label, label, `${id} manufacturer link label`);
  assert.equal(links[0]?.kind, 'manufacturer', `${id} manufacturer link kind`);
}

const modelCases = new Map([
  ['vmc-crossover-rings','Crossover rings'],
  ['gamakatsu-g-finesse-drop-shot-hook','G-Finesse Drop Shot Hook'],
  ['gamakatsu-ewg-worm-offset-hook','EWG Worm Offset Hook'],
  ['south-bend-hook-assortment','120-Piece Hook Assortment'],
  ['generic-0-inline-spinner-assortment','3-Piece Classic Dressed Spinners'],
  ['south-bend-removable-split-shot-sinkers','125-Piece Removable Split Shot Sinkers'],
  ['south-bend-assorted-brass-swivels','24-Piece Assorted Brass Swivels'],
  ['kastmaster','Kastmaster']
]);
for (const [id,model] of modelCases) assert.equal(seed.items.find(record => record.id === id)?.model, model, `${id} model`);

const booyah = seed.items.find(item => item.id === 'booyah-pad-crasher');
assert.deepEqual(booyah?.manufacturer, { name:'Booyah' });
assert.equal(booyah?.links?.[0]?.label, "Dick's Sporting Goods");
assert.match(booyah?.links?.[0]?.url || '', /booyah-pad-crasher-frog-assortment-3-pack/);

const spinner = seed.items.find(item => item.id === 'generic-0-inline-spinner-assortment');
assert.equal(spinner?.name, 'South Bend 3-Piece Classic Dressed Spinners');
assert.equal(spinner?.specifications?.find(spec => spec.label === 'Size')?.value, '#0');
assert.equal(spinner?.specifications?.find(spec => spec.label === 'Weight')?.value, '1/8 oz');

const splitShot = seed.items.find(item => item.id === 'south-bend-removable-split-shot-sinkers');
assert.equal(splitShot?.specifications?.find(spec => spec.label === 'Material')?.value, 'Lead');
assert.equal(splitShot?.specifications?.find(spec => spec.label === 'Sizes')?.value, 'BB, 3/0, 7, 5, 4');

const brassSwivels = seed.items.find(item => item.id === 'south-bend-assorted-brass-swivels');
assert.equal(brassSwivels?.specifications?.find(spec => spec.value === 'Brass' && !('label' in spec))?.value, 'Brass');
assert.equal(brassSwivels?.specifications?.find(spec => spec.label === 'Sizes')?.value, '5, 7, 10, 12');

const hooks = seed.items.find(item => item.id === 'south-bend-hook-assortment');
assert.equal(hooks?.name, 'South Bend 120-Piece Hook Assortment');
assert.equal(hooks?.specifications?.find(spec => spec.value === 'Brass' && !('label' in spec))?.value, 'Brass');
assert.equal(hooks?.specifications?.find(spec => spec.label === 'Sizes')?.value, '2, 4, 6, 8, and 10');

const gearNotes = async id => fs.readFile(new URL(`./gear-content/${id}.md`, import.meta.url), 'utf8');
for (const [id,kbId] of [
  ['zman-original-chatterbait','technique-chatterbait-bladed-jig'],
  ['strike-king-red-eyed-special','technique-spinnerbait'],
  ['rebel-crawfish','technique-crankbait'],
  ['berkley-stunna','technique-jerkbait'],
  ['strike-king-premier-pro-model-jig','technique-jigs'],
  ['sixth-sense-divine-swimbait','technique-swimbait-soft-jerk-shad'],
  ['yamamoto-senko','technique-wacky-worm'],
  ['zman-ned-rig-kit','technique-ned-rig']
]) assert.match(await gearNotes(id), new RegExp(`kb:\\/\\/${kbId}`), `${id} external KB Notes link`);

assert.match(await gearNotes('setup-spinning'), /Sufix 832 15 lb/);
assert.match(await gearNotes('swiveling-trolling-sinkers'), /kb:\/\/technique-paddle-only-kayak-strategy/);
assert.match(await gearNotes('fin-sanity-bluegill'), /hard-jointed bluegill-profile/);
assert.match(await gearNotes('fin-sanity-bluegill'), /kb:\/\/technique-swimbait-soft-jerk-shad/);

const clone = value => structuredClone(value);
const invalidExtra = clone(seed); invalidExtra.items[0].unexpected = true;
assert.equal(validateGearBundle(invalidExtra).valid, false, 'Unknown Gear fields must be rejected.');
const invalidProfiles = clone(seed); invalidProfiles.profiles = {};
assert.equal(validateGearBundle(invalidProfiles).valid, false, 'Legacy profiles must be rejected.');
const invalidUsage = clone(seed); invalidUsage.items[3].usage = [];
assert.equal(validateGearBundle(invalidUsage).valid, false, 'Legacy usage must be rejected.');
const invalidMainLine = clone(seed); invalidMainLine.items[0].mainLine = 'text';
assert.equal(validateGearBundle(invalidMainLine).valid, false, 'Legacy setup mainLine must be rejected.');
const invalidKnowledgeRefs = clone(seed); invalidKnowledgeRefs.items[3].knowledgeRefs = {};
assert.equal(validateGearBundle(invalidKnowledgeRefs).valid, false, 'Speculative knowledgeRefs must be rejected.');
const invalidInlineNotes = clone(seed); invalidInlineNotes.items[3].notes = 'Narrative belongs in Markdown.';
assert.equal(validateGearBundle(invalidInlineNotes).valid, false, 'Inline Gear Notes must be rejected; use gear-content/<stable-id>.md.');
const invalidVersion = clone(seed); invalidVersion.dataVersion = '';
assert.equal(validateGearBundle(invalidVersion).valid, false, 'dataVersion must be required.');

const mediaSources = JSON.parse(await fs.readFile(new URL('./media-sources.json', import.meta.url), 'utf8'));
const mediaOwners = JSON.parse(await fs.readFile(new URL('./media-owners.json', import.meta.url), 'utf8'));
const localMedia = JSON.parse(await fs.readFile(new URL('./local-media.json', import.meta.url), 'utf8'));
const sourceIds = new Set(mediaSources.items.map(item => item.id));
const gearIds = new Set(seed.items.map(item => item.id));
for (const record of mediaOwners.items) {
  assert.ok(sourceIds.has(record.mediaId), `Unknown media source ${record.mediaId}`);
  assert.ok(record.owners.length, `${record.mediaId} must have at least one owner.`);
  for (const owner of record.owners) {
    assert.ok(gearIds.has(owner.gearItemId), `${record.mediaId} references unknown Gear ID ${owner.gearItemId}`);
    if (owner.component) {
      assert.ok(['rod','reel'].includes(owner.component));
      assert.equal(seed.items.find(item => item.id === owner.gearItemId)?.category, 'rods-reels');
    }
  }
}

for (const mediaId of ['south-bend-classic-dressed-spinners','south-bend-removable-split-shot-sinkers','south-bend-assorted-brass-swivels','south-bend-hook-assortment']) {
  const record = localMedia.gear.find(item => item.mediaId === mediaId);
  assert.ok(record, `Missing repository-local media ${mediaId}`);
  assert.ok(record.owners?.length, `${mediaId} must declare an explicit stable Gear owner.`);
  for (const owner of record.owners) assert.ok(gearIds.has(owner.gearItemId), `${mediaId} references unknown Gear ID ${owner.gearItemId}`);
}
assert.equal(localMedia.staged.length, 0, 'Recovery B South Bend images must no longer be staged-only.');

console.log(`Structured My Gear v3 seed validated: ${seed.items.length} records across ${GEAR_CATEGORIES.length} categories; authored Notes externalized.`);
