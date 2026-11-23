import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD6OwnerDeviceDraftStore}
 from '../src/d6-owner-device-drafts.mjs';
import {restoreD5EditorDraft,saveD5EditorDraft}
 from '../src/d5-editor-recovery.mjs';

const ROOT='https://fishing-d6-wp2-test.ginosega.workers.dev/fishing/';
const FIRST='a'.repeat(40),NEXT='b'.repeat(40),HASH='c'.repeat(64);
const KEY='gear:edit:test-gear';
const base={key:KEY,domain:'gear',sourceRevision:FIRST,baseHash:HASH,
 record:{id:'test-gear',name:'Unsent changes'},notes:'Local notes',
 requiresMedia:false};
function fixture(){
 const map=new Map();
 const io={get:async key=>map.get(key),
  put:async row=>map.set(row.key,row),
  delete:async key=>map.delete(key)};
 const open=()=>createD6OwnerDeviceDraftStore({
  enabled:true,root:ROOT,privateGearPilot:true,io});
 return {map,open,scoped:ROOT+KEY};
}

test('D01-01 D1 revision, not software SHA, governs clean Restore after upgrade',async()=>{
 const x=fixture(),store=x.open();
 await saveD5EditorDraft({store,...base,baseRevision:7});
 assert.equal(x.map.get(x.scoped).version,2);
 assert.equal(x.map.get(x.scoped).baseRevision,7);
 const resumed=await x.open().read(KEY,{
  sourceRevision:NEXT,baseHash:HASH,baseRevision:7});
 assert.equal(resumed.status,'ready');
 assert.equal(resumed.draft.record.name,'Unsent changes');
 assert.equal(resumed.draft.sourceRevision,FIRST);
 const recovery=await restoreD5EditorDraft({store:x.open(),key:KEY,
  sourceRevision:NEXT,baseHash:HASH,baseRevision:7,ask:()=>true});
 assert.equal(recovery.status,'restored');
 assert.equal(recovery.notes,'Local notes');
 assert.equal(x.map.size,1);
});

test('D01-02 same Notes hash never overrides a changed D1 row revision',async()=>{
 const x=fixture(),store=x.open();
 await store.save({...base,baseRevision:5});
 const changed=await store.read(KEY,{
  sourceRevision:FIRST,baseHash:HASH,baseRevision:6});
 assert.equal(changed.status,'conflict');
 assert.equal(changed.draft.baseRevision,5);
 assert.equal(x.map.get(x.scoped).baseRevision,5);
 const keep=await restoreD5EditorDraft({store,key:KEY,baseRevision:6,
  sourceRevision:FIRST,baseHash:HASH,ask:()=>false});
 assert.equal(keep.status,'conflict');
 assert.equal(x.map.get(x.scoped).record.name,'Unsent changes');
 const review=await restoreD5EditorDraft({store,key:KEY,baseRevision:6,
  sourceRevision:FIRST,baseHash:HASH,ask:()=>true});
 assert.equal(review.status,'review');
 assert.equal(review.reviewOnly,true);
 assert.equal(review.record.name,'Unsent changes');
 assert.equal(x.map.size,1);
});

test('D01-03 changed Notes within same D1 revision also fails closed',async()=>{
 const x=fixture(),store=x.open();
 await store.save({...base,baseRevision:3});
 assert.equal((await x.open().read(KEY,{
  sourceRevision:NEXT,baseHash:'d'.repeat(64),baseRevision:3})).status,
 'conflict');
 assert.equal(x.map.size,1);
});

test('D01-04 pre-D01 v1 draft is preserved as review-only in direct-D1 editor',async()=>{
 const x=fixture(),store=x.open();
 await store.save(base);
 assert.equal(x.map.get(x.scoped).version,1);
 // Legacy standalone lookup is retained for the historical caller.
 assert.equal((await store.read(KEY,{
  sourceRevision:FIRST,baseHash:HASH})).status,'ready');
 // D01 cannot infer a D1 revision from Git SHA or the Notes hash.
 assert.equal((await x.open().read(KEY,{
  sourceRevision:FIRST,baseHash:HASH,baseRevision:1})).status,'legacy');
 const restored=await restoreD5EditorDraft({store,key:KEY,
  sourceRevision:NEXT,baseHash:HASH,baseRevision:1,ask:()=>true});
 assert.equal(restored.status,'review');
 assert.equal(restored.reviewOnly,true);
 assert.equal(x.map.get(x.scoped).version,1);
 await store.discard(KEY);
 assert.equal((await store.read(KEY,{baseRevision:1})).status,'missing');
});

test('D01-05 version-2 add and all domains use expected D1 revision zero',async()=>{
 const x=fixture(),store=x.open();
 for(const row of [
  {...base,key:'gear:add:lures',baseRevision:0},
  {...base,key:'kb:add:technique',domain:'kb',
   record:{id:'local-kb',name:'KB'},baseRevision:0},
  {...base,key:'catches:add:catch',domain:'catches',
   record:{id:'local-catch',date:'2026-11-22'},baseRevision:0},
 ]){
  await store.save(row);
  const read=await x.open().read(row.key,{
   sourceRevision:NEXT,baseHash:HASH,baseRevision:0});
  assert.equal(read.status,'ready');
  assert.equal(read.draft.baseRevision,0);
  assert.equal((await store.read(row.key,{
   sourceRevision:NEXT,baseHash:HASH,baseRevision:1})).status,'conflict');
 }
 assert.equal(x.map.size,3);
});

test('D01-06 draft schema rejects invalid D1 revisions and excess data',async()=>{
 const x=fixture(),store=x.open();
 for(const bad of [-1,1.2,Number.NaN,'1',Number.MAX_SAFE_INTEGER+1])
  await assert.rejects(store.save({...base,baseRevision:bad}),
   /INVALID_DEVICE_DRAFT/);
 await assert.rejects(store.save({...base,baseRevision:1,
  record:{...base.record,csrfToken:'not allowed'}}),
 /INVALID_DEVICE_DRAFT/);
 assert.equal(x.map.size,0);
});

test('D01-07 both direct-D1 forms pin restore and persistence; review blocks Save',()=>{
 const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
 for(const path of ['../src/d6-approved-owner-editor-preview.mjs',
   '../src/d6-direct-catch-editor.mjs']){
  const src=read(path);
  const revision=path.includes('catch-editor')?'directCatch?directRevision:null':
   'directSave?directRevision:null';
  assert.equal(src.split('baseRevision:'+revision).length-1,2,
   'Expected exactly one read and one save revision pin: '+path);
  assert.match(src,/recovery\.reviewOnly===true/);
  assert.match(src,/if\(reviewOnly\)/);
  assert.match(src,/Discard saved draft and reload/);
  assert.match(src,/draftStore\.discard\(draftKey\);location\.reload\(\)/);
 }
});
