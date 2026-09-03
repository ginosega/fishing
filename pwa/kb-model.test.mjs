import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateKbBundle, validateCatchBundle, groupEntitiesByType, catchesForEntity, KB_DESCRIPTION_MAX_LENGTH } from './kb-model.js';

const readJson = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const kb = readJson('./data/kb.seed.json');
const catches = readJson('./data/catches.seed.json');
const gear = readJson('./data/gear.seed.json');

assert.deepEqual(validateKbBundle(kb), { valid:true, errors:[] });
assert.deepEqual(validateCatchBundle(catches, kb, gear), { valid:true, errors:[] });

const groups = groupEntitiesByType(kb);
assert.equal(groups.location.length, 8);
assert.equal(groups.species.length, 7);
assert.equal(groups.equipment.length, 16);
assert.equal(groups.technique.length, 6);
assert.equal(groups.knot.length, 10);
assert.equal(catchesForEntity(catches, 'locationId', 'location-lake-sammamish').length, 2);
assert.equal(groups.equipment.some(entity => entity.id === 'technique-ned-rig'), true,
  'Equipment split must preserve existing stable KB IDs.');
assert.ok(kb.entities.every(entity => entity.description == null || entity.description.length <= KB_DESCRIPTION_MAX_LENGTH),
  'KB descriptions must obey the mobile-friendly maximum length convention.');

for (const [entityId, gearItemId] of [
  ['technique-frogs', 'booyah-pad-crasher'],
  ['technique-popper', 'rebel-pop-r'],
  ['technique-whopper-plopper', 'river2sea-whopper-plopper-60']
]) {
  const entity = kb.entities.find(record => record.id === entityId);
  assert.equal(entity?.picture?.gearItemId, gearItemId,
    `${entityId} picture must identify the owned Gear record used for its caption.`);
  assert.equal(gear.items.some(item => item.id === gearItemId), true,
    `${entityId} picture must reference an existing Gear record.`);
}

const yellowPerch = kb.entities.find(record => record.id === 'species-perch');
assert.equal(yellowPerch?.name, 'Yellow Perch');
assert.ok(yellowPerch?.picture?.src, 'Yellow Perch must have a representative picture.');
const perchCatch = catches.catches.find(record => record.id === 'catch-2026-08-04-lake-sammamish-perch-01');
assert.equal(perchCatch?.speciesId, 'species-perch', 'Existing perch catch must retain its stable species reference.');
assert.match(perchCatch?.notes || '', /Yellow Perch/, 'Existing perch catch must document the Yellow Perch convention.');

const kokanee = kb.entities.find(record => record.id === 'species-kokanee');
assert.equal(kokanee?.picture?.src, './assets/kb/species/kokanee-phases.webp');
assert.equal(fs.existsSync(new URL('./assets/kb/species/kokanee-phases.webp', import.meta.url)), true,
  'User-supplied Kokanee phase image must exist as a local KB asset.');

const invalidEntity = structuredClone(kb);
invalidEntity.entities[0].use = 'This field must not return.';
assert.equal(validateKbBundle(invalidEntity).valid, false);

const overlongDescription = structuredClone(kb);
overlongDescription.entities[0].description = 'x'.repeat(KB_DESCRIPTION_MAX_LENGTH + 1);
assert.equal(validateKbBundle(overlongDescription).valid, false);

const invalidGearPictureId = structuredClone(kb);
invalidGearPictureId.entities.find(record => record.id === 'technique-frogs').picture.gearItemId = 'INVALID ID';
assert.equal(validateKbBundle(invalidGearPictureId).valid, false);

const equipmentCatch = structuredClone(catches);
equipmentCatch.catches[0].techniqueId = 'technique-ned-rig';
assert.equal(validateCatchBundle(equipmentCatch, kb, gear).valid, true,
  'Catch techniqueId must continue to support rig/presentation guides moved to Equipment.');

const invalidCatch = structuredClone(catches);
invalidCatch.catches[0].techniqueId = 'technique-does-not-exist';
assert.equal(validateCatchBundle(invalidCatch, kb, gear).valid, false);

console.log('Unified Knowledge Base and Catch Log model tests passed.');
