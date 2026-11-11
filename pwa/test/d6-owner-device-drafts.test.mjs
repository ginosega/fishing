import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6OwnerDeviceDraftStore} from '../src/d6-owner-device-drafts.mjs';

const ROOT='https://fishing.ginosega.workers.dev/fishing/';
const SHA='a'.repeat(40);
const ID='gear:edit:daiwa-tatula-xt-rod';
const row={key:ID,domain:'gear',sourceRevision:SHA,
 baseHash:null,record:{id:'daiwa-tatula-xt-rod',name:'Unsaved local test'},
 notes:'# Unpublished notes',requiresMedia:false};
function fixture(){
 const map=new Map();
 const io={
  get:async key=>map.get(key),put:async val=>map.set(val.key,val),
  delete:async key=>map.delete(key),
 };
 return {map,io,store:createD6OwnerDeviceDraftStore({
  root:ROOT,enabled:true,io,
 })};
}
test('WP1-DRAFT01 defaults off, guards foreign origin and exact root',()=>{
 assert.equal(createD6OwnerDeviceDraftStore({enabled:false}),null);
 for(const root of [
  'https://fishing.ginosega.workers.dev/',
  'https://fishing.ginosega.workers.dev/fishing/other/',
  'https://not-owned.example/fishing/',
  'http://fishing.ginosega.workers.dev/fishing/',
  'https://fishing.ginosega.workers.dev/fishing/?x=1',
  'https://fishing.ginosega.workers.dev/fishing/#any',
 ]){
  assert.throws(()=>createD6OwnerDeviceDraftStore({
   root,enabled:true,io:fixture().io,
  }),/DEVICE_DRAFT_SCOPE_DENIED/);
 }
});
test('WP1-DRAFT02 store is a separate D6 namespace, never D5 or V2',async()=>{
 const x=fixture();
 await x.store.save(row);
 assert.equal(x.map.size,1);
 const [key,value]=[...x.map][0];
 assert.equal(key,ROOT+ID);
 assert.equal(value.key,ROOT+ID);
 assert.equal(JSON.stringify(value).includes('token'),false);
 const result=await x.store.read(ID,{sourceRevision:SHA,baseHash:null});
 assert.equal(result.status,'ready');
 assert.equal(result.draft.notes,row.notes);
 assert.deepEqual(result.draft.record,row.record);
 assert.equal(await x.store.discard(ID),true);
 assert.equal((await x.store.read(ID,{sourceRevision:SHA})).status,'missing');
});
test('WP1-DRAFT03 stale source revision or Markdown base retains local changes',async()=>{
 const x=fixture();
 await x.store.save(row);
 assert.equal((await x.store.read(ID,{sourceRevision:'b'.repeat(40)})).status,'stale');
 assert.equal((await x.store.read(ID,{sourceRevision:SHA,baseHash:'c'.repeat(64)})).status,'stale');
 assert.equal(x.map.size,1);
});
test('WP1-DRAFT04 draft retains text only and rejects unwanted fields',async()=>{
 const x=fixture();
 for(const field of ['authorization','githubToken','uploadTicket','operationId']){
  await assert.rejects(x.store.save({...row,record:{...row.record,[field]:'secret'}}),
   /INVALID_DEVICE_DRAFT/);
 }
 await assert.rejects(x.store.save({...row,notes:'x'.repeat(205000)}),
  /DEVICE_DRAFT_TOO_LARGE/);
 await assert.rejects(x.store.save({...row,key:'catches:edit:../escape'}),
  /INVALID_DEVICE_DRAFT_KEY/);
 assert.equal(x.map.size,0);
});
test('WP1-DRAFT05 Catch and KB record text follow same revision guards',async()=>{
 const x=fixture();
 for(const r of [
  {key:'kb:add:technique',domain:'kb',
   record:{id:'new-technique',name:'New technique'},notes:'## Draft'},
  {key:'catches:add:catch',domain:'catches',
   record:{id:'catch-local',date:'2026-11-11',speciesId:'trout'},notes:'Catch notes'},
 ]){
  await x.store.save({...row,...r});
  const v=await x.store.read(r.key,{sourceRevision:SHA});
  assert.equal(v.status,'ready');
  assert.equal(v.draft.notes,r.notes);
 }
 assert.equal(x.map.size,2);
});
test('WP1-DRAFT06 IndexedDB denial never grants publishing or destroys drafts',async()=>{
 const bad=createD6OwnerDeviceDraftStore({
  root:ROOT,enabled:true,io:{
   get:async()=>{throw Error('denied');},
   put:async()=>{throw Error('denied');},
   delete:async()=>{throw Error('denied');},
  },
 });
 assert.equal((await bad.read(ID,{sourceRevision:SHA})).status,'unavailable');
 await assert.rejects(bad.save(row),/DEVICE_DRAFT_STORAGE_UNAVAILABLE/);
 await assert.rejects(bad.discard(ID),/DEVICE_DRAFT_STORAGE_UNAVAILABLE/);
 assert.deepEqual(Object.keys(bad),['read','save','discard']);
});
