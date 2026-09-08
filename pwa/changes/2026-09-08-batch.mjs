import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { prepareKbChange } from '../kb-authoring-model.js';
import { promoteKbChange } from '../promote-kb-change.mjs';
import { validateGearBundle } from '../gear-model.js';
import { validateKbBundle, validateCatchBundle } from '../kb-model.js';
import { readValidatedImage } from '../image-validation.mjs';

const root = new URL('../../', import.meta.url);
const read = async path => JSON.parse(await fs.readFile(new URL(path, root), 'utf8'));
const write = async (path, value) => fs.writeFile(new URL(path, root), JSON.stringify(value, null, 2) + '\n');
const text = async path => fs.readFile(new URL(path, root), 'utf8');
const put = async (path, value) => fs.writeFile(new URL(path, root), value);
const blob = bytes => crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const gearVersion = '2026-09-08-my-gear-v4-dagger-length-1';
const kbVersion = '2026-09-08-kb-v1-three-hero-images-1';
const oldGearVersion = '2026-09-08-my-gear-v4-dagger-axis-1';
const oldKbVersion = '2026-09-04-kb-v1-final-content-1';
const originalGear = await read('pwa/data/gear.seed.json');
const originalKb = await read('pwa/data/kb.seed.json');
const catches = await read('pwa/data/catches.seed.json');
const originalLocal = await read('pwa/local-media.json');
assert.equal(originalGear.dataVersion, oldGearVersion);
assert.equal(originalKb.dataVersion, oldKbVersion);
assert.equal(originalGear.items.length, 65);
assert.equal(originalKb.entities.length, 54);
assert.equal(catches.catches.length, 5);
assert.ok(validateGearBundle(originalGear).valid);
assert.ok(validateKbBundle(originalKb).valid);
assert.ok(validateCatchBundle(catches, originalKb, originalGear).valid);

const dagger = originalGear.items.find(item => item.id === 'dagger-axis-10-5');
assert.ok(dagger);
assert.deepEqual(dagger.specifications.find(spec => spec.label === 'Length'), {label:'Length',value:'12\' 6"'});
const nextGear = structuredClone(originalGear);
nextGear.items.find(item => item.id === dagger.id).specifications.find(spec => spec.label === 'Length').value = '10\' 6"';
nextGear.dataVersion = gearVersion;
assert.ok(validateGearBundle(nextGear).valid);
const expectedGear = structuredClone(originalGear);
expectedGear.items.find(item => item.id === dagger.id).specifications.find(spec => spec.label === 'Length').value = '10\' 6"';
expectedGear.dataVersion = gearVersion;
assert.deepEqual(nextGear, expectedGear);
await write('pwa/data/gear.seed.json', nextGear);

const pictures = [
  {id:'technique-fishing-line',name:'Fishing Line',description:'Braid, fluorocarbon, mono, leader, knot, and spooling guidance.',path:'./kb-content/techniques/fishing-line.md',filename:'technique-fishing-line.jpg',alt:'Sufix 832 fishing line',gearItemId:'sufix-832-15',markdownBlob:'f5b4b1f11638c7630889e9ecc2a59bd94b1ffc70',imageBlob:'6bbf79095fb60cda21ea086553a1ec3bf64132cb'},
  {id:'technique-walking-bait',name:'Walking Bait',description:'Walk-the-dog tackle, line, cadence, color guidance, and bait examples.',path:'./kb-content/techniques/walking-bait.md',filename:'technique-walking-bait.jpg',alt:'Heddon Zara Spook',markdownBlob:'766aa8bbb0445184b9804abf5119bc2274089900',imageBlob:'9181d2b9a5767ae01855bbcdffdfa5d6c7dcd7d8'},
  {id:'technique-rods-reels',name:'Rods & Reels',description:'Spinning and baitcasting selection, setup, adjustment, and casting guidance.',path:'./kb-content/techniques/rods-reels.md',filename:'technique-rods-reels.png',alt:'Baitcasting reel',markdownBlob:'50e36182db41b7a222a5231c545799ad25bbc270',imageBlob:'0304c3a3c3964f280db88ab70edca52e593a49e2'}
];
const sourceSnapshots = new Map();
for (const p of pictures) {
  const original = originalKb.entities.find(entity => entity.id === p.id);
  assert.deepEqual(original, {id:p.id,type:'equipment',name:p.name,description:p.description,picture:null,content:p.path});
  assert.equal(originalLocal.kb.filter(row => row.entityId === p.id).length, 0);
  const markdown = await fs.readFile(new URL('pwa/' + p.path.slice(2), root));
  assert.equal(blob(markdown), p.markdownBlob, `Authored Markdown changed for ${p.id}`);
  const src = './assets/kb/entries/' + p.filename;
  const bytes = await readValidatedImage(new URL('pwa/' + src.slice(2), root));
  assert.equal(blob(bytes), p.imageBlob, `Uploaded image changed for ${p.id}`);
  sourceSnapshots.set(p.id, {original,markdown:markdown.toString('utf8'),src,bytes});
  p.imageBytes = bytes.length;
}

for (const p of pictures) {
  const bundle = await read('pwa/data/kb.seed.json');
  const gearBundle = await read('pwa/data/gear.seed.json');
  const localMedia = await read('pwa/local-media.json');
  const {original,markdown,src} = sourceSnapshots.get(p.id);
  const desired = {src,alt:p.alt,caption:null,credit:null,sourceUrl:null,...(p.gearItemId ? {gearItemId:p.gearItemId} : {})};
  const prepared = prepareKbChange({bundle,sourceBundle:bundle,gearBundle,catchBundle:catches,original,sourceOriginal:original,originalMarkdown:markdown,markdown,localMedia,availableMedia:[],entity:{...original,picture:desired},picturePlan:{action:'add',filename:p.filename,desired}});
  assert.ok(prepared.valid, prepared.errors.join('\n'));
  assert.equal(prepared.package.content.action, 'keep');
  assert.deepEqual(prepared.package.sourceEntity.picture, desired);
  await promoteKbChange(prepared.package, {root:new URL('../../', import.meta.url).pathname,apply:true,dataVersion:kbVersion,availableMedia:[]});
  assert.equal(blob(await fs.readFile(new URL('pwa/' + p.path.slice(2), root))), p.markdownBlob);
}

const nextKb = await read('pwa/data/kb.seed.json');
const nextLocal = await read('pwa/local-media.json');
assert.equal(nextKb.dataVersion, kbVersion);
assert.equal(nextKb.entities.length, 54);
for (const p of pictures) {
  const {original,src} = sourceSnapshots.get(p.id);
  const desired = {src,alt:p.alt,caption:null,credit:null,sourceUrl:null,...(p.gearItemId ? {gearItemId:p.gearItemId} : {})};
  assert.deepEqual(nextKb.entities.find(row => row.id === p.id), {...original,picture:desired});
  assert.deepEqual(nextLocal.kb.find(row => row.entityId === p.id), {entityId:p.id,source:src,alt:p.alt,caption:null,credit:null,sourceUrl:null,...(p.gearItemId ? {gearItemId:p.gearItemId} : {})});
}
const unchangedKb = originalKb.entities.filter(row => !pictures.some(p => p.id === row.id));
assert.deepEqual(nextKb.entities.filter(row => !pictures.some(p => p.id === row.id)), unchangedKb);
assert.deepEqual(nextLocal.gear, originalLocal.gear);
assert.deepEqual(nextLocal.kb.filter(row => !pictures.some(p => p.id === row.entityId)), originalLocal.kb);
assert.deepEqual(await read('pwa/data/catches.seed.json'), catches);
assert.ok(validateKbBundle(nextKb).valid);
assert.ok(validateCatchBundle(catches, nextKb, nextGear).valid);

// Update source-version assertions, not the protected deployment workflow.
const testFiles = ['gear-model.test.mjs','dagger-axis.test.mjs','final-content.test.mjs','kb-model.test.mjs','kb-promotion.test.mjs','kb-authoring.test.mjs','my-gear-routing.test.mjs','kb-routing.test.mjs','gear-media-policy.test.mjs'];
for (const filename of testFiles) {
  const path = 'pwa/' + filename;
  let source = await text(path);
  source = source.replaceAll(oldGearVersion, gearVersion).replaceAll(oldKbVersion, kbVersion);
  if (filename === 'dagger-axis.test.mjs') source = source.replaceAll('12\' 6\\"', '10\' 6\\"').replaceAll('12\' 6"', '10\' 6"');
  if (filename === 'gear-model.test.mjs') source = source.replace("assert.equal(seed.dataVersion, '" + gearVersion + "');", "assert.equal(seed.dataVersion, '" + gearVersion + "');\nassert.equal(seed.items.find(item => item.id === 'dagger-axis-10-5').specifications.find(spec => spec.label === 'Length').value, '10\\' 6\"');");
  await put(path, source);
}

const permanent = `import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {validateGearBundle} from './gear-model.js';
import {validateKbBundle,validateCatchBundle} from './kb-model.js';
import {materializeKbEntity,validateKbMediaBundle} from './kb-picture-model.js';
import {readValidatedImage} from './image-validation.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const digest=bytes=>crypto.createHash('sha1').update('blob '+bytes.length+'\\0').update(bytes).digest('hex');
const gear=read('./data/gear.seed.json');
const kb=read('./data/kb.seed.json');
const catches=read('./data/catches.seed.json');
const local=read('./local-media.json');
const plans=${JSON.stringify(pictures.map(({imageBytes,...p})=>({...p,imageBytes})))};
export async function verifyAcceptedBatch(dist=false){
 assert.ok(validateGearBundle(gear).valid);
 assert.ok(validateKbBundle(kb).valid);
 assert.ok(validateCatchBundle(catches,kb,gear).valid);
 assert.equal(gear.schemaVersion,4);
 assert.equal(gear.dataVersion,'${gearVersion}');
 assert.equal(gear.items.length,65);
 assert.equal(kb.schemaVersion,1);
 assert.equal(kb.dataVersion,'${kbVersion}');
 assert.equal(kb.entities.length,54);
 assert.equal(catches.catches.length,5);
 const dagger=gear.items.find(x=>x.id==='dagger-axis-10-5');
 assert.equal(dagger.specifications.find(x=>x.label==='Length').value,'10\\' 6"');
 const expected=structuredClone(dagger);
 expected.specifications.find(x=>x.label==='Length').value='12\\' 6"';
 assert.deepEqual({...dagger,specifications:expected.specifications},expected);
 for(const p of plans){
  const src='./assets/kb/entries/'+p.filename;
  const desired={src,alt:p.alt,caption:null,credit:null,sourceUrl:null,...(p.gearItemId?{gearItemId:p.gearItemId}:{})};
  assert.deepEqual(kb.entities.filter(x=>x.id===p.id),[{id:p.id,type:'equipment',name:p.name,description:p.description,picture:desired,content:p.path}]);
  assert.deepEqual(local.kb.filter(x=>x.entityId===p.id),[{entityId:p.id,source:src,alt:p.alt,caption:null,credit:null,sourceUrl:null,...(p.gearItemId?{gearItemId:p.gearItemId}:{})}]);
  const bytes=await readValidatedImage(new URL('./'+src.slice(2),import.meta.url));
  assert.equal(bytes.length,p.imageBytes);
  assert.equal(digest(bytes),p.imageBlob);
  const markdown=fs.readFileSync(new URL('./'+p.path.slice(2),import.meta.url));
  assert.equal(digest(markdown),p.markdownBlob);
 }
 if(dist){
  const builtGear=read('./dist/data/gear.seed.json');
  const builtKb=read('./dist/data/kb.seed.json');
  const media=read('./dist/gear-media.json');
  assert.deepEqual(builtGear,gear);
  assert.ok(validateKbBundle(builtKb).valid);
  assert.ok(validateCatchBundle(catches,builtKb,builtGear).valid);
  assert.equal(builtKb.dataVersion,'${kbVersion}');
  for(const p of plans){
   const expected=materializeKbEntity(kb.entities.find(x=>x.id===p.id),local,media,gear);
   assert.deepEqual(builtKb.entities.find(x=>x.id===p.id),expected);
   const source=fs.readFileSync(new URL('./assets/kb/entries/'+p.filename,import.meta.url));
   assert.deepEqual(fs.readFileSync(new URL('./dist/assets/kb/entries/'+p.filename,import.meta.url)),source);
   assert.ok(read('./dist/kb-assets.json').includes('./assets/kb/entries/'+p.filename));
  }
 }
}
await verifyAcceptedBatch(process.argv.includes('--dist'));
console.log('Accepted kayak length and three KB image source/bundle checks passed.');
`;
await put('pwa/accepted-2026-09-08.test.mjs', permanent);
for (const [filename,importLine] of [['final-content.test.mjs',"import './accepted-2026-09-08.test.mjs';"],['verify-final-bundle.mjs',"import {verifyAcceptedBatch} from './accepted-2026-09-08.test.mjs';\nawait verifyAcceptedBatch(true);"]]) {
  const path = 'pwa/' + filename;
  const existing = await text(path);
  assert.ok(!existing.includes(importLine), 'Regression import already installed.');
  await put(path, existing + '\n' + importLine + '\n');
}
await fs.rm(new URL('pwa/changes/2026-09-08-batch.mjs',root));
console.log('Prepared exact kayak correction and three source-aware KB images; all other domain records and authored Markdown preserved.');
