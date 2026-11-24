import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildNewCatchSpecies,createCatchSpecies} from '../src/d6-catch-species.mjs';
import {validateRecord} from '../src/validation.mjs';
import {applyCatchField} from '../src/catch-fields.mjs';

const src=readFileSync(new URL('../src/d6-direct-catch-editor.mjs',import.meta.url),'utf8');
const catalog=()=>({gear:{schemaVersion:2,items:[]},
 kb:{schemaVersion:2,entities:[{
  id:'rainbow-trout',name:'Rainbow Trout',type:'species',
  content:'KB/Species/content/Rainbow Trout.md',
 }]},catches:{schemaVersion:2,catches:[]}});
function context(overrides={}){
 const data=catalog(),maps={kb:new Map(data.kb.entities.map(x=>[x.id,x]))};
 const files=new Set(data.kb.entities.map(x=>x.content));
 const stats={lists:0,saves:0,invalidations:0};
 const client={
  async list(){stats.lists++;return [...data.kb.entities];},
  async save({record,markdown,expectedRevision}){
   stats.saves++;
   assert.equal(expectedRevision,0);
   return {record,markdown,revision:1};
  },
  ...overrides,
 };
 const ctx={data,maps,v3:{directKBCanSave:()=>true,
  directKBClient:client,source:{files},
  onDirectKBSaved:()=>{stats.invalidations++;}}};
 return {ctx,stats};
}
test('L01-SPECIES01 Add Catch selects existing species via native select, not datalist',()=>{
 assert.match(src,/const speciesSelect=select\(\[\['','Choose species'\]/);
 assert.match(src,/field\('Species',speciesSelect\)/);
 assert.match(src,/button\('Add new species'/);
 assert.match(src,/const speciesAdd=button\('Add',async\(\)=>/);
 assert.match(src,/const speciesCancel=button\('Cancel',closeSpecies\)/);
 assert.match(src,/speciesPanel\.append\(field\('New species',speciesNameInput\)/);
 assert.doesNotMatch(src,/createAutocomplete\('species'/);
 assert.match(src,/class:'gear-choice-control'/);
});
test('L01-SPECIES02 newly added Species is a valid KB entity with starter Notes',()=>{
 const data=catalog();
 const {record,markdown}=buildNewCatchSpecies('  White  Sturgeon ',data.kb.entities);
 assert.deepEqual(record,{
  id:'white-sturgeon',name:'White Sturgeon',type:'species',
  content:'KB/Species/content/White Sturgeon.md',
 });
 assert.equal(markdown,'# White Sturgeon\n');
 assert.doesNotThrow(()=>validateRecord(record,'kb',data));
});
test('L01-SPECIES03 Add is a verified owner-only KB Save and links Catch by speciesId',async()=>{
 const {ctx,stats}=context();
 const created=await createCatchSpecies({name:'White Sturgeon',context:ctx});
 assert.equal(created.id,'white-sturgeon');
 assert.equal(stats.lists,1);
 assert.equal(stats.saves,1);
 assert.equal(stats.invalidations,1);
 assert(ctx.data.kb.entities.some(x=>x.id==='white-sturgeon'));
 assert.equal(ctx.maps.kb.get('white-sturgeon'),created);
 assert(ctx.v3.source.files.has(created.content));
 const catchRecord={id:'catch-white-sturgeon',date:'2026-11-23'};
 applyCatchField(catchRecord,'species',created.name,
  ctx.data.kb.entities.filter(x=>x.type==='species'));
 assert.equal(catchRecord.speciesId,created.id);
 assert.equal(catchRecord.speciesName,undefined);
 assert.doesNotThrow(()=>validateRecord(catchRecord,'catches',ctx.data));
});
test('L01-SPECIES04 duplicate name and ID collision never publish another KB entity',()=>{
 const entries=catalog().kb.entities;
 assert.throws(()=>buildNewCatchSpecies('RAINBOW trout',entries),/already exists/);
 assert.throws(()=>buildNewCatchSpecies('  ',entries),/Enter a species name/);
 assert.throws(()=>buildNewCatchSpecies('Bad\/Name',entries),/unsupported filename/);
 assert.throws(()=>buildNewCatchSpecies('X'.repeat(161),entries),/1–160/);
 assert.throws(()=>buildNewCatchSpecies('Lake Bass',[
  ...entries,{id:'lake-bass',name:'Other Fish',type:'technique',
   content:'KB/Techniques/content/Other Fish.md'}]),/generated ID/);
});
test('L01-SPECIES05 offline/unsigned or failed/unverified KB writes do not mutate Catch catalog',async()=>{
 for(const overrides of [
  {directKBCanSave:()=>false},
  {directKBClient:{list:async()=>{throw Error('Network unavailable');}}},
  {directKBClient:{list:async()=>[],save:async()=>{throw Error('Save refused');}}},
  {directKBClient:{list:async()=>[],save:async({record,markdown})=>({record,markdown,revision:0})}},
 ]){
  const {ctx,stats}=context();
  Object.assign(ctx.v3,overrides);
  const before=ctx.data.kb.entities.slice();
  await assert.rejects(createCatchSpecies({name:'White Sturgeon',context:ctx}));
  assert.deepEqual(ctx.data.kb.entities,before);
  assert.equal(stats.invalidations,0);
  assert.equal(ctx.maps.kb.has('white-sturgeon'),false);
 }
});
