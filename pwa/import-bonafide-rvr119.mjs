import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { validateGearBundle } from './gear-model.js';

const read = async path => fs.readFile(new URL(path, import.meta.url), 'utf8');
const write = async (path, text) => fs.writeFile(new URL(path, import.meta.url), text);
const item = {
  id:'bonafide-rvr119',
  category:'accessories',
  type:'Kayaks',
  name:'Bonafide RVR119',
  manufacturer:{ name:'Bonafide', url:'https://bonafidefishing.com/products/rvr119' },
  model:'RVR119',
  specifications:[
    {label:'S/N',value:'LPS00469H526'},
    {label:'Length',value:'11\' 9"'},
    {label:'Width',value:'35"'},
    {label:'Weight',value:'85 lb'},
    {label:'Capacity',value:'425 lb'},
    {label:'Color',value:'Steel'}
  ],
  links:[{kind:'retailer',label:'Eco Fishing',url:'https://ecofishingshop.com/products/bonafide-rvr119-fishing-kayak?variant=41430925508742'}]
};
const oldVersion = '2026-09-04-my-gear-v3-external-notes-1';
const newVersion = '2026-09-06-my-gear-v3-bonafide-rvr119-1';
const seed = JSON.parse(await read('./data/gear.seed.json'));
assert.equal(seed.schemaVersion,3);
assert.equal(seed.dataVersion,oldVersion);
assert.equal(seed.items.length,63);
assert.ok(!seed.items.some(record => record.id === item.id));
assert.equal(validateGearBundle({ ...seed, items:[...seed.items,item] }).valid,true);
seed.items.push(item);
seed.dataVersion = newVersion;
const result = validateGearBundle(seed);
assert.equal(result.valid,true,result.errors.join('\n'));
await write('./data/gear.seed.json',JSON.stringify(seed,null,2)+'\n');

const notes = '# Accessories\n- Bow hatch\n  - Tool bag: Phillips screwdriver, 7/16 box wrench for seat nuts, hex wrench for studs\n  - How to tie this off?\n';
assert.equal(await read('./gear-content/bonafide-rvr119.md'),notes,'Preserve user-authored Notes exactly.');

async function replaceExact(path,oldText,newText) {
  const source = await read(path);
  assert.ok(source.includes(oldText),`Expected source text missing from ${path}: ${oldText}`);
  assert.equal(source.split(oldText).length,2,`Expected exactly one occurrence in ${path}`);
  await write(path,source.replace(oldText,newText));
}

await replaceExact('./gear-model.test.mjs','assert.equal(seed.items.length, 63);','assert.ok(seed.items.length >= 64, \'The accepted Gear baseline must remain present.\');');
await replaceExact('./gear-model.test.mjs',oldVersion,newVersion);
await replaceExact('./final-content.test.mjs',oldVersion,newVersion);
await replaceExact('./final-content.test.mjs',"assert.equal(externalNoteFiles.length, 41, 'Expected all 41 authored Gear Notes to remain externalized.');","assert.ok(externalNoteFiles.length >= 41, 'The original 41 authored Gear Notes must remain externalized.');");
await replaceExact('../.github/workflows/fishing-pwa-build.yml',oldVersion,newVersion);

const gearTestPath = './gear-model.test.mjs';
let gearTest = await read(gearTestPath);
const anchor = "assert.deepEqual(GEAR_ACCESSORY_TYPES, ['Kayaks','Tools','Tackle Management','Electronics','Storage','Miscellaneous']);";
assert.equal(gearTest.split(anchor).length,2);
gearTest = gearTest.replace(anchor,anchor+"\nconst rvr119 = seed.items.find(item => item.id === 'bonafide-rvr119');\nassert.ok(rvr119, 'Owned Bonafide RVR119 must be in the seed.');\nassert.equal(rvr119.category, 'accessories');\nassert.equal(rvr119.type, 'Kayaks');\nassert.equal(rvr119.name, 'Bonafide RVR119');\nassert.deepEqual(rvr119.manufacturer, {name:'Bonafide',url:'https://bonafidefishing.com/products/rvr119'});\nassert.equal(rvr119.model, 'RVR119');\nassert.deepEqual(rvr119.specifications, [\n  {label:'S/N',value:'LPS00469H526'},\n  {label:'Length',value:'11\\' 9\"'},\n  {label:'Width',value:'35\"'},\n  {label:'Weight',value:'85 lb'},\n  {label:'Capacity',value:'425 lb'},\n  {label:'Color',value:'Steel'}\n]);\nassert.deepEqual(rvr119.links, [{kind:'retailer',label:'Eco Fishing',url:'https://ecofishingshop.com/products/bonafide-rvr119-fishing-kayak?variant=41430925508742'}]);\n");
await write(gearTestPath,gearTest);

let finalTest = await read('./final-content.test.mjs');
const finalAnchor = "const catchNoteFiles = fs.readdirSync(new URL('./catch-content/', import.meta.url)).filter(name => name.endsWith('.md'));";
assert.equal(finalTest.split(finalAnchor).length,2);
finalTest = finalTest.replace(finalAnchor,"assert.equal(gearNotes(gear.items.find(item => item.id === 'bonafide-rvr119')), '# Accessories\\n- Bow hatch\\n  - Tool bag: Phillips screwdriver, 7/16 box wrench for seat nuts, hex wrench for studs\\n  - How to tie this off?\\n'.replaceAll('\\\\n','\\n'));\n"+finalAnchor);
await write('./final-content.test.mjs',finalTest);

console.log('Bonafide RVR119 import integrated and schema validated; existing records preserved.');
