import test from 'node:test';
import assert from 'node:assert/strict';
import {createD3VersionedDeliveryPrototype,D3VersionedDeliveryError}
 from '../src/d3-versioned-delivery-prototype.mjs';
const repo='ginosega/fishing',gitsha='a'.repeat(40),
 old='b'.repeat(40),head='c'.repeat(40);
const id='p3_01234567-1234-4234-8234-123456789abc',enc=new TextEncoder();
async function blob(bytes){
 const h=enc.encode('blob '+bytes.length+'\0');
 const x=new Uint8Array(h.length+bytes.length);x.set(h);x.set(bytes,h.length);
 return [...new Uint8Array(await crypto.subtle.digest('SHA-1',x))]
  .map(v=>v.toString(16).padStart(2,'0')).join('');
}
const denied=code=>e=>e instanceof D3VersionedDeliveryError&&e.code===code;
async function setup(opts={}){
 const content=enc.encode('{"items":[{"id":"sample"}]}');
 const file={path:'pwa/KB/kb.json',bytes:content,gitBlobSha:await blob(content)};
 let current=old,reads=0,stage=0,cas=0,publicReads=0;
 const objects=new Map(),trace=[];
 const loadCanonical=async()=>{
  reads++;trace.push('canonical');
  return {repository:repo,repositoryId:1,commitSha:
   opts.mainMoved&&reads>1?old:gitsha,mergeSha:gitsha,
   prHeadSha:head,exactHeadCheckVerified:true,
   protectedMergeVerified:true,mainMatchesMerge:true,
   files:[opts.badBlob?{...file,gitBlobSha:old}:
    opts.badPath?{...file,path:'pwa/src/app.mjs'}:file]};
 };
 const putImmutable=async ({key,bytes})=>{
  stage++;trace.push('stage:'+key);
  if(objects.has(key)&&!Buffer.from(objects.get(key)).equals(Buffer.from(bytes)))
   throw Error('Immutable object collision');
  objects.set(key,new Uint8Array(bytes));
  return {immutable:true};
 };
 const getImmutable=async key=>{
  const value=objects.get(key);
  if(opts.corruptStage&&key.endsWith('.json'))
   return enc.encode('corrupt');
  return value&&new Uint8Array(value);
 };
 const compareAndSwapActive=async ({expectedVersion,nextVersion})=>{
  cas++;trace.push('cas');
  if(opts.casUnknown)throw Error('unknown CAS outcome');
  if(current!==expectedVersion)return {activated:false};
  current=nextVersion;return {activated:true};
 };
 const publicGet=async ({version,path})=>{
  publicReads++;trace.push('public:'+path);
  const bytes=objects.get('v3-content/'+version+'/'+
   (path==='release-manifest.json'?path:path));
  if(opts.stalePublic&&path==='pwa/KB/kb.json')
   return {status:200,anonymous:true,version:old,bytes};
  if(opts.publicUnavailable)throw Error('network unavailable');
  return {status:200,anonymous:true,version,bytes:new Uint8Array(bytes)};
 };
 const service=createD3VersionedDeliveryPrototype({
  loadCanonical,putImmutable,getImmutable,compareAndSwapActive,
  readActive:async()=>opts.pointerMoved?gitsha:current,
  publicGet,enabled:()=>opts.enabled??true,
 });
 return {service,trace,counts:()=>({reads,stage,cas,publicReads}),
  current:()=>current,objectCount:()=>objects.size};
}
test('V3-V01 fail-closed default OFF denies all adapter calls',async()=>{
 const x=await setup({enabled:false});
 await assert.rejects(x.service.activate({
  operationId:id,expectedPrevious:old,
 }),denied('DISABLED'));
 assert.deepEqual(x.counts(),{reads:0,stage:0,cas:0,publicReads:0});
});
test('V3-V02 current verified canonical bytes staged before atomic pointer',async()=>{
 const x=await setup(),r=await x.service.activate({
  operationId:id,expectedPrevious:old,
 });
 assert.equal(r.prototypeVerified,true);
 assert.equal(r.canonicalLive,false);
 assert.equal(r.realPublicLive,false);
 assert.equal(r.release,gitsha);
 assert.equal(r.fileCount,1);
 assert.equal(x.current(),gitsha);
 assert.equal(x.objectCount(),2);
 assert.equal(x.counts().publicReads,2);
 assert.ok(x.trace.indexOf('cas')>
  x.trace.findIndex(s=>s.startsWith('stage:')));
 assert.ok(x.trace.findIndex(s=>s.startsWith('public:'))>
  x.trace.indexOf('cas'));
});
test('V3-V03 bytes must match GitHub immutable blob SHA before any stage',async()=>{
 const x=await setup({badBlob:true});
 await assert.rejects(x.service.activate({
  operationId:id,expectedPrevious:old,
 }),denied('GITHUB_BLOB_MISMATCH'));
 assert.equal(x.counts().stage,0);
 assert.equal(x.counts().cas,0);
});
test('V3-V04 never stage executable/runtime paths in content-only lane',async()=>{
 const x=await setup({badPath:true});
 await assert.rejects(x.service.activate({
  operationId:id,expectedPrevious:old,
 }),denied('INVALID_CANONICAL_FILE'));
 assert.equal(x.counts().stage,0);
});
test('V3-V05 incomplete/corrupted immutable staging never reaches pointer',async()=>{
 const x=await setup({corruptStage:true});
 await assert.rejects(x.service.activate({
  operationId:id,expectedPrevious:old,
 }),denied('STAGED_BYTES_MISMATCH'));
 assert.equal(x.counts().cas,0);
});
test('V3-V06 stale GitHub main after staging cannot be promoted',async()=>{
 const x=await setup({mainMoved:true});
 await assert.rejects(x.service.activate({
  operationId:id,expectedPrevious:old,
 }),denied('MAIN_MOVED'));
 assert.equal(x.counts().cas,0);
});
test('V3-V07 stale primary pointer cannot be overwritten',async()=>{
 const x=await setup({pointerMoved:true});
 await assert.rejects(x.service.activate({
  operationId:id,expectedPrevious:old,
 }),denied('PREVIOUS_VERSION_MOVED'));
 assert.equal(x.counts().cas,0);
});
test('V3-V08 ambiguous atomic pointer is never blindly retried',async()=>{
 const x=await setup({casUnknown:true});
 await assert.rejects(x.service.activate({
  operationId:id,expectedPrevious:old,
 }),denied('ACTIVATION_OUTCOME_UNKNOWN'));
 assert.equal(x.counts().cas,1);
 assert.equal(x.counts().publicReads,0);
});
test('V3-V09 stale edge public bytes are NOT Live; no blind rollback',async()=>{
 const x=await setup({stalePublic:true});
 await assert.rejects(x.service.activate({
  operationId:id,expectedPrevious:old,
 }),denied('PUBLIC_BYTES_UNVERIFIED'));
 assert.equal(x.current(),gitsha);
 assert.equal(x.counts().cas,1);
});
test('V3-V10 lost independent public proof leaves activation uncertain',async()=>{
 const x=await setup({publicUnavailable:true});
 await assert.rejects(x.service.activate({
  operationId:id,expectedPrevious:old,
 }),denied('PUBLIC_PROOF_UNAVAILABLE'));
 assert.equal(x.current(),gitsha);
 assert.equal(x.counts().cas,1);
});
test('V3-V11 source-only prototype never claims a real 60s result',async()=>{
 const x=await setup();
 const r=await x.service.activate({
  operationId:id,expectedPrevious:old,
 });
 assert.equal(r.requiresLiveProviderBenchmark,true);
 assert.equal(r.canonicalLive,false);
 assert.equal('clickToPublicProofMs' in r,false);
});
