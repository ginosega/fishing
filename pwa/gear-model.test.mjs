import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { validateGearBundle, GEAR_CATEGORIES, gearLinks } from './gear-model.js';

const seed = JSON.parse(await fs.readFile(new URL('./data/gear.seed.json', import.meta.url), 'utf8'));
const result = validateGearBundle(seed);
assert.equal(result.valid, true, result.errors.join('\n'));
assert.equal(seed.items.some(item => item.category === 'knots'), false, 'Knots must not be part of My Gear.');
for (const category of GEAR_CATEGORIES) assert.ok(seed.items.some(item => item.category === category), `Missing category ${category}`);

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

console.log(`Structured My Gear seed validated: ${seed.items.length} records across ${GEAR_CATEGORIES.length} categories.`);
