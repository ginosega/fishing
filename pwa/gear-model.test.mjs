import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { validateGearBundle, GEAR_CATEGORIES, GEAR_SCHEMA_VERSION, gearLinks } from './gear-model.js';

const seed = JSON.parse(await fs.readFile(new URL('./data/gear.seed.json', import.meta.url), 'utf8'));
const result = validateGearBundle(seed);
assert.equal(result.valid, true, result.errors.join('\n'));
assert.equal(seed.schemaVersion, GEAR_SCHEMA_VERSION);
assert.equal(seed.schemaVersion, 2);
assert.equal(seed.items.length, 61);
assert.ok(seed.dataVersion, 'dataVersion is required.');
assert.equal('profiles' in seed, false, 'Gear schema v2 must not contain profiles.');
assert.equal(seed.items.some(item => item.category === 'knots'), false, 'Knots must not be part of My Gear.');
for (const category of GEAR_CATEGORIES) assert.ok(seed.items.some(item => item.category === category), `Missing category ${category}`);

const legacyFields = ['usage','connections','usageProfileId','connectionProfileId','mainLine','leader','configuration','knowledgeRefs','aliases'];
for (const item of seed.items) {
  for (const field of legacyFields) assert.equal(field in item, false, `${item.id} must not contain legacy/speculative field ${field}.`);
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
  ['south-bend-hook-assortment','Hook Assortment'],
  ['kastmaster','Kastmaster']
]);
for (const [id,model] of modelCases) assert.equal(seed.items.find(record => record.id === id)?.model, model, `${id} model`);

assert.match(seed.items.find(item => item.id === 'setup-spinning')?.notes || '', /Sufix 832 15 lb/);
assert.match(seed.items.find(item => item.id === 'swiveling-trolling-sinkers')?.notes || '', /kb:\/\/technique-paddle-only-kayak-strategy/);

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
const invalidNotes = clone(seed); invalidNotes.items[3].notes = 42;
assert.equal(validateGearBundle(invalidNotes).valid, false, 'Notes must be Markdown text or null.');
const invalidVersion = clone(seed); invalidVersion.dataVersion = '';
assert.equal(validateGearBundle(invalidVersion).valid, false, 'dataVersion must be required.');

const mediaSources = JSON.parse(await fs.readFile(new URL('./media-sources.json', import.meta.url), 'utf8'));
const mediaOwners = JSON.parse(await fs.readFile(new URL('./media-owners.json', import.meta.url), 'utf8'));
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

console.log(`Structured My Gear v2 seed validated: ${seed.items.length} records across ${GEAR_CATEGORIES.length} categories.`);
