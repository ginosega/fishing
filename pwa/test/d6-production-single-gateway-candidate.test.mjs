import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6ProductionSingleGatewayCandidate}
 from '../../experiments/p3/preview/src/d6-production-single-gateway-candidate.mjs';
import {createD6ProductionPublishWriteRouteCandidate}
 from '../../experiments/p3/preview/src/d6-production-publish-write-route-candidate.mjs';
import {createD6ProductionMediaWriteRouteCandidate}
 from '../../experiments/p3/preview/src/d6-production-media-write-route-candidate.mjs';
import {createD6ProductionRuntimeBindingContract}
 from '../../experiments/p3/preview/src/d6-production-runtime-bindings.mjs';
import {D6_PUBLISH_REPOSITORY as REPO,
 D6_PUBLISH_INTAKE_ORIGIN as ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';

const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),BLOB='b'.repeat(40);
const PATH='Catches/assets/sample/notes/photo.png';
const OP='/api/v3/operations',MEDIA='/api/v3/media';
const req=(path,body='{}',options={})=>new Request(ORIGIN+path,{
 method:'POST',
 headers:{
  Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'publish',
  'Content-Type':'application/json',
  ...options.headers,
 },
 body,
});
const stage=(options={})=>new Request(ORIGIN+MEDIA,{
 method:'POST',headers:{
  Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'stage-media',
  'X-Fish-V3-Operation':ID,
  'X-Fish-V3-Media-Path':encodeURIComponent(PATH),
  'Content-Type':'image/png',
  ...options.headers,
 },body:new Uint8Array([137,80,78,71]),
});
const readHeaders={'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0'};
async function setup({mount=true,writable=true,opEnabled=true,
 mediaEnabled=true,owner=true,readOverride=null,
 badRouteResponse=false}={}){
 const flags={mount,writable,opEnabled,mediaEnabled,owner};
 const calls={read:[],auth:0,accepted:0,main:0,op:0,
  stage:0,mediaReconcile:0};
 const session={
  authorizeWrite:async r=>{
   calls.auth++;assert.equal(r.method,'POST');
   if(!flags.owner)throw Error('not owner');
   return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
  },
  authorizeMedia:async r=>{
   calls.auth++;assert.equal(r.method,'POST');
   if(!flags.owner)throw Error('not owner');
   return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
  },
 };
 const readGateway=readOverride??{fetch:async r=>{
  calls.read.push([new URL(r.url).pathname,r.method]);
  return new Response(JSON.stringify({
   readOnly:true,path:new URL(r.url).pathname,
  }),{status:200,headers:readHeaders});
 }};
 const operationRoute=createD6ProductionPublishWriteRouteCandidate({
  session,enabled:()=>true,writeEnabled:()=>true,
  receipts:{accept:async()=>{
   calls.accepted++;
   return {operationId:ID,status:'Accepted',sourceRevision:MAIN,
    sourceOnly:true,canPublish:false,isLive:false};
  }},
  getTrustedCurrentMain:async()=>{
   calls.main++;
   return {verified:true,repositoryId:REPO.id,ref:REPO.ref,
    sourceRevision:MAIN};
  },
  dispatcher:{
   current:async()=>{
    calls.op++;
    return {operationId:ID,domain:'gear',recordId:'sample',
     sourceRevision:MAIN,state:'AwaitingAuthorizedWrite',
     step:'tree',verifiedSteps:[],safeToRetryWrite:false,
     requiresHostedReleaseProof:true,sourceOnly:true,
     isLive:false,canPublish:false};
   },
   beginOne:async()=>{calls.op++;throw Error('not authorized');},
   reconcileOne:async()=>{calls.op++;throw Error('no fence');},
  },
 });
 const mediaRoute=createD6ProductionMediaWriteRouteCandidate({
  session,enabled:()=>true,writeEnabled:()=>true,
  stageEnabled:()=>true,reconcileEnabled:()=>true,
  stage:{attempt:async()=>{
   calls.stage++;
   return {operationId:ID,stepKey:'media:'+PATH,
    expectedBlobSha:BLOB,state:'Unknown',
    requiresIndependentGitReadback:true,
    requiresDurableReconciliation:true,sourceOnly:true,
    canPublish:false,isLive:false};
  }},
  reconciliation:{reconcile:async()=>{
   calls.mediaReconcile++;
   return {operationId:ID,path:PATH,blobSha:BLOB,
    state:'VerifiedStage',verifiedStage:true,
    requiresSignedTicket:true,sourceOnly:true,
    canPublish:false,isLive:false};
  }},
 });
 const r=createD6ProductionSingleGatewayCandidate({
  readGateway,
  operationRoute:badRouteResponse?
   {serve:async()=>new Response('forged success',{
    status:200,headers:{'Content-Type':'text/html'}})}:
   operationRoute,
  mediaRoute,
  writeMountEnabled:()=>flags.mount,
  writeEnabled:()=>flags.writable,
  operationEnabled:()=>flags.opEnabled,
  mediaEnabled:()=>flags.mediaEnabled,
 });
 return {gateway:r,flags,calls};
}
const json=async r=>JSON.parse(await r.text());

test('WP3-GW01 all write routes absent by default, no read fallback or D1/auth',async()=>{
 const x=await setup({mount:false});
 for(const path of [OP,OP+'/'+ID+'/status',OP+'/'+ID+'/begin',
  OP+'/'+ID+'/reconcile',MEDIA,MEDIA+'/reconcile']){
  const r=await x.gateway.fetch(req(path));
  assert.equal(r.status,404);
  assert.equal((await json(r)).error,'NOT_FOUND');
 }
 assert.deepEqual(x.calls.read,[]);
 assert.equal(x.calls.auth,0);
 assert.equal(x.calls.accepted,0);
 assert.equal(x.calls.stage,0);
});

test('WP3-GW02 WP2 static/session/source read routes remain untouched',async()=>{
 const x=await setup({mount:false});
 for(const path of ['/session','/api/v3/authoring-source',
  '/fishing/index.html','/auth/start','/auth/callback']){
  const req=new Request(ORIGIN+path,{method:'GET'});
  const r=await x.gateway.fetch(req);
  assert.equal(r.status,200);
  const body=await json(r);
  assert.deepEqual(body,{readOnly:true,path});
 }
 assert.equal(x.calls.read.length,5);
 assert.equal(x.calls.auth,0);
});

test('WP3-GW03 one gateway serves real route candidates but never Live',async()=>{
 const x=await setup();
 const accepted=await x.gateway.fetch(req(OP));
 assert.equal(accepted.status,202);
 assert.equal((await json(accepted)).state,'Accepted');
 const s=await x.gateway.fetch(req(OP+'/'+ID+'/status'));
 assert.equal(s.status,200);
 const state=await json(s);
 assert.equal(state.state,'AwaitingAuthorizedWrite');
 assert.equal(state.isLive,false);
 const media=await x.gateway.fetch(stage());
 assert.equal(media.status,202);
 const mediaStatus=await json(media);
 assert.equal(mediaStatus.state,'Unknown');
 assert.equal(mediaStatus.safeToRetryWrite,false);
 assert.equal(mediaStatus.isLive,false);
 const reconcile=await x.gateway.fetch(req(MEDIA+'/reconcile',
  JSON.stringify({operationId:ID,path:PATH,blobSha:BLOB})));
 assert.equal(reconcile.status,200);
 assert.equal((await json(reconcile)).state,'VerifiedStage');
 assert.equal(x.calls.accepted,1);assert.equal(x.calls.op,1);
 assert.equal(x.calls.stage,1);
 assert.equal(x.calls.mediaReconcile,1);
 assert.equal(x.calls.read.length,0);
});

test('WP3-GW04 global and family kill switches deny all writes, preserve owner reads',async()=>{
 for(const mode of ['writable','opEnabled','mediaEnabled']){
  const x=await setup();
  x.flags[mode]=false;
  const expectedOps=mode!=='writable'&&mode!=='opEnabled';
  const expectedMedia=mode!=='writable'&&mode!=='mediaEnabled';
  assert.equal((await x.gateway.fetch(req(OP))).status,
   expectedOps?202:404);
  assert.equal((await x.gateway.fetch(stage())).status,
   expectedMedia?202:404);
  assert.equal((await x.gateway.fetch(new Request(ORIGIN+'/session'))).status,200);
 }
});

test('WP3-GW05 wrong routes, methods, queries never reach read or write provider',async()=>{
 const x=await setup();
 for(const path of [
  OP+'/'+ID+'/PUBLISH',OP+'/bad/status',OP+'/abc',
  OP+'?force=true',MEDIA+'/tickets',MEDIA+'/reconcile?retry=true',
  '/api/v3/operations/no-such-id/begin',
 ]){
  assert.equal((await x.gateway.fetch(req(path))).status,404);
 }
 for(const path of [OP,MEDIA,OP+'/'+ID+'/status']){
  assert.equal((await x.gateway.fetch(
   new Request(ORIGIN+path,{method:'GET'}))).status,404);
 }
 assert.equal(x.calls.auth,0);
 assert.equal(x.calls.stage,0);
 assert.equal(x.calls.read.length,0);
});

test('WP3-GW06 foreign origin and bearer never reach owner routes',async()=>{
 const x=await setup();
 assert.equal((await x.gateway.fetch(
  new Request('https://bad.example'+OP,{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:'{}',
  }))).status,404);
 assert.equal((await x.gateway.fetch(req(OP,'{}',{
  headers:{Authorization:'Bearer forged'},
 }))).status,404);
 assert.equal(x.calls.auth,0);
 assert.equal(x.calls.read.length,0);
});

test('WP3-GW07 absent D2 authorization or forbidden provider response fails closed',async()=>{
 const x=await setup({owner:false});
 assert.equal((await x.gateway.fetch(req(OP))).status,403);
 assert.equal(x.calls.accepted,0);
 const y=await setup({badRouteResponse:true});
 assert.equal((await y.gateway.fetch(req(OP))).status,503);
 assert.equal(y.calls.auth,0);
});

test('WP3-GW08 unchanged actual WP2 runtime read adapter remains read-only',async()=>{
 const provider=[];
 const read=createD6ProductionRuntimeBindingContract({
  env:{
   D6_PRODUCTION_ENABLED:'true',
   D6_ORIGIN:ORIGIN,
   D6_OWNER_GITHUB_ID:String(REPO.ownerGitHubId),
   D6_REPOSITORY_ID:String(REPO.id),
   D6_GATEWAY_ENABLED:'true',D6_STATIC_ENABLED:'true',
  },
  network:async(url,opts)=>{
   provider.push({url,method:opts.method});
   return new Response('isolated static',{status:200,
    headers:{'Content-Type':'text/plain'}});
  },
 });
 const x=await setup({mount:false,readOverride:read});
 assert.equal((await x.gateway.fetch(
  new Request(ORIGIN+'/fishing/index.html'))).status,200);
 assert.equal(provider.length,1);
 for(const path of [OP,MEDIA,MEDIA+'/reconcile']){
  assert.equal((await x.gateway.fetch(req(path))).status,404);
 }
 assert.equal(provider.length,1);
 assert.equal(x.calls.auth,0);
 assert.equal(x.calls.accepted,0);
 assert.equal(x.calls.stage,0);
});

test('WP3-GW09 only one fetch entry; no deploy, merge, token or proof authority',async()=>{
 const x=await setup();
 assert.deepEqual(Object.keys(x.gateway),['fetch']);
 for(const name of ['serve','deploy','publish','merge',
  'issueWriteToken','sign','start','reconcile','accept'])
  assert.equal(name in x.gateway,false);
});
