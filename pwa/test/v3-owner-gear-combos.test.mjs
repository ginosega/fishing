import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GEAR_CATEGORIES,gearCategoryKey,gearCategoryLabel,gearCategoryChoices,
 categoryFolder} from '../src/shared.mjs';
import {TAXONOMY,validateRecords} from '../src/validation.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const load=()=>({
 gear:read('../Gear/gear.json'),
 kb:read('../KB/kb.json'),
 catches:read('../Catches/catches.json'),
});

test('L01 Gear combo maps built-in labels to unchanged stable keys and media folders',()=>{
 for(const row of GEAR_CATEGORIES){
  assert.equal(gearCategoryKey(row[1]),row[0]);
  assert.equal(gearCategoryLabel(row[0]),row[1]);
  assert.equal(categoryFolder('gear',row[0]),'Gear/'+row[2]);
 }
 assert(TAXONOMY.weights.includes('Cannonball sinkers'));
});

test('L01 Gear can save new Weight Type and newly introduced Category through existing schema',()=>{
 const data=load(),old=data.gear.items[0];
 const weight={...structuredClone(old),id:'test-cannonball-sinkers',
  name:'Cannonball sinkers',category:'weights',type:'Cannonball sinkers'};
 delete weight.notes;delete weight.picture;
 data.gear.items.push(weight);
 assert.doesNotThrow(()=>validateRecords(data));
 const category=gearCategoryKey('Fly fishing accessories');
 assert.equal(category,'fly-fishing-accessories');
 const custom={...weight,id:'test-fly-fishing-accessories',
  name:'Fly gear',category,type:'Hand-tied rigs'};
 data.gear.items.push(custom);
 assert.doesNotThrow(()=>validateRecords(data));
 assert.equal(categoryFolder('gear',category),
  'Gear/Custom/fly-fishing-accessories');
 assert(gearCategoryChoices(data.gear.items).some(
  ([key,label])=>key===category&&label==='Fly Fishing Accessories'));
});

test('L01 custom Gear categories still reject unsafe or overlong keys',()=>{
 const data=load();
 const base={...structuredClone(data.gear.items[0]),id:'test-bad-category',
  name:'Bad category',type:'New type'};
 delete base.notes;delete base.picture;
 for(const bad of ['../unsafe','Invalid Spaces','evil/path','a'.repeat(81)]){
  const item={...base,category:bad};
  data.gear.items.push(item);
  assert.throws(()=>validateRecords(data));
  data.gear.items.pop();
  assert.throws(()=>categoryFolder('gear',bad));
 }
});
