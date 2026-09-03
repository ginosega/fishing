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

const invalidEntity = structuredClone(kb);
invalidEntity.entities[0].use = 'This field must not return.';
assert.equal(validateKbBundle(invalidEntity).valid, false);

const overlongDescription = structuredClone(kb);
overlongDescription.entities[0].description = 'x'.repeat(KB_DESCRIPTION_MAX_LENGTH + 1);
assert.equal(validateKbBundle(overlongDescription).valid, false);

const equipmentCatch = structuredClone(catches);
equipmentCatch.catches[0].techniqueId = 'technique-ned-rig';
assert.equal(validateCatchBundle(equipmentCatch, kb, gear).valid, true,
  'Catch techniqueId must continue to support rig/presentation guides moved to Equipment.');

const invalidCatch = structuredClone(catches);
invalidCatch.catches[0].techniqueId = 'technique-does-not-exist';
assert.equal(validateCatchBundle(invalidCatch, kb, gear).valid, false);

console.log('Unified Knowledge Base and Catch Log model tests passed.');
