import test from 'node:test';
import assert from 'node:assert/strict';
import {sha256} from '../src/shared.mjs';
import {prepareChange} from '../src/handoff.mjs';
import {D6_PUBLISH_REPOSITORY as REPO,
 D6_PUBLISH_INTAKE_ORIGIN as ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionMediaUploadPreflight}
 from '../../experiments/p3/preview/src/d6-production-media-upload-preflight.mjs';
import {createD6ProductionMediaWriteRouteCandidate}
 from '../../experiments/p3/preview/src/d6-production-media-write-route-candidate.mjs';

const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),SNAP='b'.repeat(64),BLOB='c'.repeat(40);
const PATH='Catches/assets/catch-example/notes/photo.png';
const PNG=Uint8Array.from(Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==',
 'base64'));
const stageRequest=(changed={})=>{
 const headers={
  Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'stage-media',
  'Content-Type':'image/png',
  'X-Fish-V3-Operation':ID,
  'X-Fish-V3-Media-Path':encodeURIComponent(PATH),
  'X-Fish-V3-CSRF':'test-only-owner-session-csrf',
  ...(changed.headers??{}),
 };
 return new Request(ORIGIN+(changed.path??'/api/v3/media'),{
  method:changed.method??'POST',headers,
  ...(changed.method==='GET'?{}:{body:changed.bytes??PNG}),
 });
};
const hint=()=>({operationId:ID,path:PATH,blobSha:BLOB});
const control=(data=hint(),changed={})=>
 new Request(ORIGIN+(changed.path??'/api/v3/media/reconcile'),{
  method:changed.method??'POST',headers:{
   Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
   'X-Fish-V3-Intent':'publish',
   'X-Fish-V3-CSRF':'test-only-owner-session-csrf',
   'Content-Type':'application/json',...(changed.headers??{}),
  },body:changed.raw??JSON.stringify(data),
 });
async function stored(){
 const pkg=await prepareChange({
  domain:'catches',operation:'add',id:'catch-example',
  record:{id:'catch-example',date:'2026-11-12'},
  text:'![Photo](../assets/catch-example/notes/photo.png)',
  sourceRevision:MAIN,notesImages:[{
   path:PATH,bytes:PNG.length,sha256:await sha256(PNG),
  }],
 });
 return {operation:{
  operationId:ID,ownerGitHubId:REPO.ownerGitHubId,
  repositoryId:REPO.id,ref:REPO.ref,
  sourceRevision:MAIN,snapshotSha256:SNAP,
  domain:'catches',operation:'add',recordId:'catch-example',
  state:'Accepted',
 },package:pkg};
}
async function setup({enabled=true,writeEnabled=true,
 stageEnabled=true,reconcileEnabled=true,owner=true,
 stageResult='ok',readbackResult='ok',usePreflight=false}={}){
 const stats={authMedia:0,authWrite:0,stage:0,reconcile:0,
  d1:0,readback:0,gitWrites:0};
 const flags={enabled,writeEnabled,stageEnabled,reconcileEnabled,owner};
 const session={
  authorizeMedia:async r=>{
   stats.authMedia++;
   if(!flags.owner||r.headers.get('X-Fish-V3-Intent')!=='stage-media')
    throw Error('media denied');
   return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
  },
  authorizeWrite:async r=>{
   stats.authWrite++;
   if(!flags.owner||r.headers.get('X-Fish-V3-Intent')!=='publish')
    throw Error('write denied');
   return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
  },
 };
 const original=await stored();
 const preflight=createD6ProductionMediaUploadPreflight({
  session,enabled:()=>flags.enabled&&flags.writeEnabled,
  loadAcceptedOperation:async()=>{stats.d1++;return original;},
 });
 let fenced=false;
 const stage={attempt:async req=>{
  stats.stage++;
  if(usePreflight){
   const proof=await preflight.preflight(req);
   assert.equal(proof.path,PATH);
   assert.deepEqual(proof.originalBytes,PNG);
   assert.equal(proof.verifiedOriginal,true);
  }
  fenced=true;
  return {
   operationId:ID,stepKey:'media:'+PATH,
   state:stageResult==='ok'?'Unknown':'VerifiedStage',
   sourceOnly:true,canPublish:false,isLive:false,
   expectedBlobSha:BLOB,
   requiresIndependentGitReadback:true,
   requiresDurableReconciliation:true,
  };
 }};
 const reconciliation={reconcile:async(req,args)=>{
  stats.reconcile++;
  assert.deepEqual(args,hint());
  if(!fenced)throw Error('no durable fence');
  stats.readback++;
  return {
   ...args,state:readbackResult==='ok'?
    'VerifiedStage':'Unknown',
   verifiedStage:readbackResult==='ok',
   sourceOnly:true,canPublish:false,isLive:false,
   requiresSignedTicket:true,
  };
 }};
 const route=createD6ProductionMediaWriteRouteCandidate({
  session,stage,reconciliation,
  enabled:()=>flags.enabled,writeEnabled:()=>flags.writeEnabled,
  stageEnabled:()=>flags.stageEnabled,
  reconcileEnabled:()=>flags.reconcileEnabled,
 });
 return {route,stats,flags};
}

test('WP3-MROUTE01 default-off returns 404 before any authorization or media read',async()=>{
 const x=await setup({enabled:false});
 assert.equal((await x.route.serve(stageRequest())).status,404);
 assert.equal((await x.route.serve(control())).status,404);
 assert.equal(x.stats.authMedia,0);
 assert.equal(x.stats.authWrite,0);
 assert.equal(x.stats.stage,0);
 assert.equal(x.stats.reconcile,0);
});

test('WP3-MROUTE02 exact binary staging through real accepted-image preflight is Unknown',async()=>{
 const x=await setup({usePreflight:true});
 const res=await x.route.serve(stageRequest());
 assert.equal(res.status,202);
 assert.deepEqual(await res.json(),{
  ok:true,operationId:ID,path:PATH,candidateBlobSha:BLOB,
  state:'Unknown',safeToRetryWrite:false,verifiedStage:false,
  requiresIndependentGitReadback:true,
  requiresSignedTicket:true,isLive:false,canPublish:false,
 });
 assert.equal(x.stats.authMedia,2); // route + actual D2 preflight
 assert.equal(x.stats.d1,1);
 assert.equal(x.stats.stage,1);
 assert.equal(x.stats.reconcile,0);
 assert.equal(x.stats.gitWrites,0); // no provider mutation in route
 assert.equal(res.headers.get('Cache-Control'),
  'private, no-store, max-age=0');
});

test('WP3-MROUTE03 readback can prove prior stage, never POSTs a blob again',async()=>{
 const x=await setup();
 assert.equal((await x.route.serve(control())).status,503);
 assert.equal(x.stats.stage,0);
 assert.equal((await x.route.serve(stageRequest())).status,202);
 const res=await x.route.serve(control());
 assert.equal(res.status,200);
 assert.deepEqual(await res.json(),{
  ok:true,operationId:ID,path:PATH,blobSha:BLOB,
  state:'VerifiedStage',verifiedStage:true,
  requiresSignedTicket:true,requiresAtomicTree:true,
  canPublish:false,isLive:false,
 });
 assert.equal(x.stats.stage,1);assert.equal(x.stats.reconcile,2);
 assert.equal(x.stats.readback,1);
 assert.equal(x.stats.gitWrites,0);
});

test('WP3-MROUTE04 route and separate mutation/recovery kill switches fail closed',async()=>{
 for(const variant of [
  {writeEnabled:false},
  {stageEnabled:false},
  {reconcileEnabled:false},
 ]){
  const x=await setup(variant);
  if(variant.writeEnabled===false||variant.stageEnabled===false){
   assert.equal((await x.route.serve(stageRequest())).status,503);
   assert.equal(x.stats.stage,0);
  }
  if(variant.writeEnabled===false||variant.reconcileEnabled===false){
   assert.equal((await x.route.serve(control())).status,503);
   assert.equal(x.stats.reconcile,0);
  }
 }
 const toggled=await setup();
 toggled.flags.writeEnabled=false;
 assert.equal((await toggled.route.serve(stageRequest())).status,503);
 assert.equal((await toggled.route.serve(control())).status,503);
 assert.equal(toggled.stats.authMedia,0);
 assert.equal(toggled.stats.authWrite,0);
});

test('WP3-MROUTE05 invalid method, origin, path, body-type and bearer never reach owner auth',async()=>{
 const x=await setup();
 const invalid=[
  stageRequest({method:'GET'}),
  stageRequest({path:'/api/v3/media/../../admin'}),
  stageRequest({headers:{Authorization:'Bearer wrong'}}),
  stageRequest({headers:{Origin:'https://bad.example'}}),
  stageRequest({headers:{'Sec-Fetch-Site':'cross-site'}}),
  stageRequest({headers:{'X-Fish-V3-Intent':'publish'}}),
  stageRequest({headers:{'Content-Type':'application/json'}}),
  control(hint(),{headers:{'X-Fish-V3-Intent':'stage-media'}}),
  control(hint(),{headers:{'Content-Type':'image/png'}}),
  control(hint(),{path:'/api/v3/media/reconcile?allow=true'}),
  control(hint(),{headers:{Authorization:'Bearer wrong'}}),
 ];
 for(const request of invalid){
  const result=await x.route.serve(request);
  assert.ok([403,404].includes(result.status));
 }
 assert.equal(x.stats.authMedia,0);assert.equal(x.stats.authWrite,0);
 assert.equal(x.stats.stage,0);assert.equal(x.stats.reconcile,0);
});

test('WP3-MROUTE06 reject unauthorized owner before D1, body and provider',async()=>{
 const x=await setup({owner:false,usePreflight:true});
 assert.equal((await x.route.serve(stageRequest())).status,403);
 assert.equal((await x.route.serve(control())).status,403);
 assert.equal(x.stats.d1,0);assert.equal(x.stats.stage,0);
 assert.equal(x.stats.reconcile,0);
});

test('WP3-MROUTE07 forged hints and oversized payload never dispatch GET reconciliation',async()=>{
 const x=await setup();
 for(const changed of [
  {operationId:'bad',path:PATH,blobSha:BLOB},
  {operationId:ID,path:'../private',blobSha:BLOB},
  {operationId:ID,path:PATH,blobSha:'invalid'},
  {...hint(),step:'advance'},
 ]){
  assert.equal((await x.route.serve(control(changed))).status,404);
 }
 for(const raw of [
  JSON.stringify(hint())+' ',
  JSON.stringify({blobSha:BLOB,operationId:ID,path:PATH}),
  '[1,2,3]',
  'not json',
  'x'.repeat(3000),
 ]){
  // canonical field order is expected operationId,path,blobSha
  const reply=await x.route.serve(control(hint(),{raw}));
  assert.equal(reply.status,404);
 }
 assert.equal(x.stats.reconcile,0);
});

test('WP3-MROUTE08 no HTTP response or uncertain stage becomes VerifiedStage or Live',async()=>{
 const x=await setup({stageResult:'forged',readbackResult:'forged'});
 assert.equal((await x.route.serve(stageRequest())).status,503);
 const result=await x.route.serve(control());
 assert.equal(result.status,503);
 assert.equal(x.stats.stage,1);
 assert.equal(x.stats.reconcile,1);
 assert.equal(JSON.stringify(await result.json()).includes('Live'),false);
});

test('WP3-MROUTE09 no public fetch, retry, token, merge, ticket or deploy method',async()=>{
 const x=await setup();
 assert.deepEqual(Object.keys(x.route),['serve']);
 for(const key of ['fetch','publish','merge','retry','issueTicket',
  'install','deploy','issueWriteToken'])
  assert.equal(key in x.route,false);
});
