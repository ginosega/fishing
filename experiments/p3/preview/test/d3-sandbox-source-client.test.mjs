import test from 'node:test';
import assert from 'node:assert/strict';
import {createD3SandboxSourceClient,D3SourceClientError}
 from '../src/d3-sandbox-source-client.mjs';
const ORIGIN='https://fishing.example';
const MAIN='a'.repeat(40),TREE='b'.repeat(40),ID=1430581407;
const NOTE='KB/Locations/content/P3 Test Lake.md';
const records={
 gear:{schemaVersion:2,items:[{id:'p3-test-rod',name:'P3 Test Rod',
   category:'rods-reels',type:'Spinning rod',manufacturer:'Fixture Only'}]},
 kb:{schemaVersion:2,entities:[{id:'location-p3-test-lake',
   type:'location',name:'P3 Test Lake',content:NOTE}]},
 catches:{schemaVersion:2,catches:[]},
};
const payload=()=>({
 ok:true,repositoryId:ID,sourceRevision:MAIN,treeSha:TREE,
 sandboxOnly:true,canonicalLive:false,
 data:structuredClone(records),files:[NOTE],
 markdown:[{path:NOTE,body:'# P3 Test Lake\n\nSynthetic notes.\n'}],
});
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,
 headers:{'Content-Type':'application/json; charset=utf-8',
   'Cache-Control':'private, no-store'}});
const reject=code=>e=>e instanceof D3SourceClientError&&e.code===code;
function fixture({enabled=true,online=true,value=payload(),status=200}={}){
 let hits=0;
 const client=createD3SandboxSourceClient({
  origin:ORIGIN,enabled:()=>enabled,online:()=>online,
  request:async(url,options)=>{
   hits++;
   assert.equal(url,ORIGIN+'/api/v3/authoring-source');
   assert.equal(options.method,'GET');
   assert.equal(options.credentials,'same-origin');
   assert.equal(options.redirect,'manual');
   assert.equal(options.cache,'no-store');
   return json(value,status);
  },
 });
 return {client,get hits(){return hits;}};
}
test('D3-SC01 explicit gate and offline reading never start a network request',async()=>{
 const disabled=fixture({enabled:false});
 await assert.rejects(disabled.client.load(),reject('NOT_ENABLED'));
 assert.equal(disabled.hits,0);
 const offline=fixture({online:false});
 await assert.rejects(offline.client.load(),reject('OFFLINE_DENIED'));
 assert.equal(offline.hits,0);
});
test('D3-SC02 owner private source preserves exact sandbox revision and Markdown bytes',async()=>{
 const x=fixture(),v=await x.client.load();
 assert.equal(v.repositoryId,ID);
 assert.equal(v.sourceRevision,MAIN);
 assert.equal(v.treeSha,TREE);
 assert.equal(v.canonicalLive,false);
 assert.equal(v.sandboxOnly,true);
 assert.equal(v.data.gear.items[0].id,'p3-test-rod');
 assert.equal(v.markdown.get(NOTE),'# P3 Test Lake\n\nSynthetic notes.\n');
 assert(v.files.has(NOTE));
 assert.equal(x.hits,1);
});
test('D3-SC03 repo impersonation and public canonical claims fail closed',async()=>{
 for(const modify of [
  {repositoryId:1350909744},{canonicalLive:true},
  {sandboxOnly:false},{sourceRevision:'public-v2-release-not-a-sha'},
 ]){
  const bad={...payload(),...modify};
  await assert.rejects(fixture({value:bad}).client.load(),
   reject('UNTRUSTED_SOURCE'));
 }
});
test('D3-SC04 unknown Markdown, missing resources and unsafe tree inventory are rejected',async()=>{
 for(const update of [
  {files:[]},
  {markdown:[]},
  {files:[NOTE,'../secrets.txt']},
  {files:[NOTE,NOTE]},
  {markdown:[{path:'KB/Locations/content/Not Owner.md',body:'x'}]},
 ]){
  const bad={...payload(),...update};
  await assert.rejects(fixture({value:bad}).client.load(),
   e=>e instanceof D3SourceClientError);
 }
});
test('D3-SC05 unauthenticated source response is never used as an editable base',async()=>{
 await assert.rejects(fixture({status:401}).client.load(),
  reject('OWNER_SESSION_REQUIRED'));
 await assert.rejects(fixture({status:503}).client.load(),
  reject('SOURCE_UNAVAILABLE'));
});
