import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,createHash} from 'node:crypto';
import {createD6Wp3PinnedWriteOrigin,
 D6_WP3_PROPOSED_ISOLATED_ORIGIN as ISO,D6Wp3OriginError}
 from '../../experiments/p3/preview/src/d6-production-wp3-origin-profile.mjs';
import {D6_PUBLISH_INTAKE_ORIGIN as PROD,
 D6_PUBLISH_REPOSITORY as REPO,
 createD6ProductionPublishIntake,D6PublishIntakeError}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionPublishWriteRouteCandidate}
 from '../../experiments/p3/preview/src/d6-production-publish-write-route-candidate.mjs';
import {createD6ProductionMediaWriteRouteCandidate}
 from '../../experiments/p3/preview/src/d6-production-media-write-route-candidate.mjs';
import {createD6ProductionSingleGatewayCandidate}
 from '../../experiments/p3/preview/src/d6-production-single-gateway-candidate.mjs';
import {createD2UnifiedOwnerSession}
 from '../../experiments/p3/preview/src/d2-unified-owner-session.mjs';
import {createD6ProductionMediaTicketVerifier,D6MediaTicketError,
 d6CanonicalMediaTicketPayload}
 from '../../experiments/p3/preview/src/d6-production-media-ticket-verify.mjs';

const ID='123e4567-e89b-42d3-a456-426614174000';
const SHA='a'.repeat(40),HMAC='t'.repeat(48),NOW=1800000002;
const CONTENT='/api/v3/operations',MEDIA='/api/v3/media';
const PATH='Catches/assets/catch-example/notes/photo.png';
const COOKIE='K'.repeat(43),CSRF_KEY='C'.repeat(48);
const BASE=Object.freeze({
 operationId:ID,status:'Accepted',sourceRevision:SHA,
 sourceOnly:true,canPublish:false,isLive:false,
});
const req=(host,path=CONTENT,change={})=>new Request(
 host+path,{method:'POST',headers:{
  'Origin':host,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'publish','Content-Type':'application/json',
  ...change.headers,
 },body:change.body??'{}'});
const stageReq=(host)=>new Request(host+MEDIA,{
 method:'POST',headers:{
  'Origin':host,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'stage-media',
  'X-Fish-V3-Operation':ID,
  'X-Fish-V3-Media-Path':encodeURIComponent(PATH),
  'Content-Type':'image/png',
 },body:new Uint8Array([137,80,78,71]),
});
const counts=()=>({auth:0,source:0,receipt:0,stage:0,read:0});
function fixture({enabled=false,owner=true}={}){
 const flags={enabled,owner},calls=counts();
 const session={
  authorizeWrite:async()=>{
   calls.auth++;
   if(!flags.owner)throw Error('denied');
   return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
  },
  authorizeMedia:async()=>{
   calls.auth++;
   if(!flags.owner)throw Error('denied');
   return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
  },
 };
 const options={origin:ISO,isolatedOriginEnabled:()=>flags.enabled,
  enabled:()=>true,writeEnabled:()=>true};
 const operationRoute=createD6ProductionPublishWriteRouteCandidate({
  ...options,session,
  receipts:{accept:async()=>{calls.receipt++;return BASE;}},
  getTrustedCurrentMain:async()=>{
   calls.source++;
   return {verified:true,repositoryId:REPO.id,ref:REPO.ref,
    sourceRevision:SHA};
  },
  dispatcher:{
   current:async()=>{throw Error('not verified');},
   beginOne:async()=>{throw Error('not permitted');},
   reconcileOne:async()=>{throw Error('not permitted');},
  },
 });
 const mediaRoute=createD6ProductionMediaWriteRouteCandidate({
  ...options,session,
  stageEnabled:()=>true,reconcileEnabled:()=>true,
  stage:{attempt:async()=>{calls.stage++;return {
   operationId:ID,stepKey:'media:'+PATH,state:'Unknown',
   sourceOnly:true,canPublish:false,isLive:false,
   expectedBlobSha:'b'.repeat(40),
   requiresIndependentGitReadback:true,
   requiresDurableReconciliation:true,
  };}},
  reconciliation:{reconcile:async()=>{throw Error('not verified');}},
 });
 const readGateway={fetch:async()=>{
  calls.read++;
  return new Response(JSON.stringify({readOnly:true}),{
   status:200,headers:{'Content-Type':'application/json',
    'Cache-Control':'private, no-store'},
  });
 }};
 const gateway=createD6ProductionSingleGatewayCandidate({
  ...options,readGateway,operationRoute,mediaRoute,
  writeMountEnabled:()=>true,
  operationEnabled:()=>true,mediaEnabled:()=>true,
 });
 return {flags,calls,operationRoute,mediaRoute,gateway};
}

test('WP3-ISO01 only canonical or proposed isolated host; isolated OFF by default',()=>{
 assert.equal(createD6Wp3PinnedWriteOrigin().origin,PROD);
 assert.equal(createD6Wp3PinnedWriteOrigin().enabled(),true);
 assert.equal(createD6Wp3PinnedWriteOrigin({origin:ISO}).enabled(),false);
 assert.equal(new URL(ISO).origin,ISO);
 assert.notEqual(ISO,PROD);
 for(const origin of [
  'https://evil.invalid',
  'https://fishing.ginosega.workers.dev.evil.invalid',
  'http://'+new URL(ISO).host,
  ISO+'/',ISO+'?config=1','',
 ]){
  assert.throws(()=>createD6Wp3PinnedWriteOrigin({origin}),
   D6Wp3OriginError);
 }
});

test('WP3-ISO02 all write paths 404 before owner/D1/provider when isolated OFF',async()=>{
 const x=fixture();
 for(const request of [
  req(ISO),req(ISO,CONTENT+'/'+ID+'/begin'),stageReq(ISO),
  req(ISO,MEDIA+'/reconcile'),
 ]){
  assert.equal((await x.gateway.fetch(request)).status,404);
 }
 assert.deepEqual(x.calls,counts());
 const read=await x.gateway.fetch(new Request(ISO+'/fishing/index.html'));
 assert.equal(read.status,200);
 assert.equal(x.calls.read,1);
});

test('WP3-ISO03 exact isolated POST can reach existing guarded components only after gate',async()=>{
 const x=fixture({enabled:true});
 assert.equal((await x.gateway.fetch(req(ISO))).status,202);
 assert.equal(x.calls.auth,1);
 assert.equal(x.calls.source,1);
 assert.equal(x.calls.receipt,1);
 const stage=await x.gateway.fetch(stageReq(ISO));
 assert.equal(stage.status,202);
 assert.equal(x.calls.auth,2);
 assert.equal(x.calls.stage,1);
 const body=await stage.json();
 assert.equal(body.isLive,false);
 assert.equal(body.canPublish,false);
});

test('WP3-ISO04 production and hostile hosts rejected even while isolated switch ON',async()=>{
 const x=fixture({enabled:true});
 for(const origin of [PROD,'https://other.invalid']){
  assert.equal((await x.gateway.fetch(req(origin))).status,404);
  assert.equal((await x.gateway.fetch(stageReq(origin))).status,404);
 }
 assert.deepEqual(x.calls,counts());
});

test('WP3-ISO05 origin revocation fail closed for previously composed routes',async()=>{
 const x=fixture({enabled:true});
 assert.equal((await x.gateway.fetch(req(ISO))).status,202);
 x.flags.enabled=false;
 assert.equal((await x.gateway.fetch(req(ISO))).status,404);
 assert.equal((await x.operationRoute.serve(req(ISO))).status,404);
 assert.equal((await x.mediaRoute.serve(stageReq(ISO))).status,404);
 assert.equal(x.calls.receipt,1);
 assert.equal(x.calls.stage,0);
});

test('WP3-ISO06 original D2 session CSRF is exact-origin bound, not transferable',async()=>{
 const sessionHash=createHash('sha256').update(COOKIE).digest('base64url');
 const db={prepare(sql){
  assert(sql.includes('FROM sessions'));
  return{bind(key,at){
   assert.equal(key,sessionHash);
   assert.equal(at,NOW);
   return{first:async()=>({
    github_id:REPO.ownerGitHubId,expires_at:NOW+3600,
   })};
  }};
 }};
 const session=createD2UnifiedOwnerSession({
  AUTH_DB:db,origin:ISO,ownerGitHubId:REPO.ownerGitHubId,
  csrfKey:CSRF_KEY,now:()=>NOW,
 });
 const csrf=host=>createHmac('sha256',CSRF_KEY)
  .update('fishing-v3-csrf-v1\n'+host+'\n'+COOKIE)
  .digest('base64url');
 const ownerReq=(host,token)=>req(host,CONTENT,{headers:{
  Cookie:'__Host-fish_p0_session='+COOKIE,
  'X-Fish-V3-CSRF':token,
 }});
 assert.equal((await session.authorizeWrite(ownerReq(ISO,csrf(ISO))))
  .authorized,true);
 await assert.rejects(session.authorizeWrite(ownerReq(ISO,csrf(PROD))));
 await assert.rejects(session.authorizeWrite(ownerReq(PROD,csrf(ISO))));
});

test('WP3-ISO07 intake builds ORIGINAL D2 with isolated exact origin only after approval',async()=>{
 const flags={enabled:false},calls={made:0};
 const intake=createD6ProductionPublishIntake({
  origin:ISO,isolatedOriginEnabled:()=>flags.enabled,
  enabled:()=>true,
  sessionFactory:params=>{
   calls.made++;
   assert.equal(params.origin,ISO);
   return {authorizeWrite:async()=>({
    authorized:true,ownerGitHubId:REPO.ownerGitHubId,
   })};
  },
 });
 const inspect=request=>intake.inspect(request,{trustedMainSha:SHA});
 await assert.rejects(inspect(req(ISO)),e=>e instanceof
  D6PublishIntakeError&&e.code==='DISABLED');
 assert.equal(calls.made,0);
 flags.enabled=true;
 await assert.rejects(inspect(req(PROD)),e=>e instanceof
  D6PublishIntakeError&&e.code==='ROUTE_DENIED');
 assert.equal(calls.made,0);
 await assert.rejects(inspect(req(ISO)),e=>e instanceof D6PublishIntakeError);
 assert.equal(calls.made,1); // owner session passed; invalid stub body fails after auth
});

test('WP3-ISO08 original HMAC media ticket is isolated-origin and gate bound',async()=>{
 const payload={
  version:'fish-v3-media-ticket-v1',operationId:ID,
  repositoryId:REPO.id,ownerGitHubId:REPO.ownerGitHubId,
  ref:REPO.ref,sourceRevision:SHA,
  snapshotSha256:'b'.repeat(64),
  path:PATH,blobSha:'c'.repeat(40),sha256:'d'.repeat(64),
  bytes:64,mime:'image/png',
  issuedAt:NOW-10,expiresAt:NOW+600,
 };
 const sign=host=>createHmac('sha256',HMAC)
  .update(d6CanonicalMediaTicketPayload(host,payload))
  .digest('base64url');
 const ticket={...payload,signature:sign(ISO)};
 const operation={operationId:ID,state:'Accepted',
  ownerGitHubId:REPO.ownerGitHubId,repositoryId:REPO.id,
  ref:REPO.ref,sourceRevision:SHA,
  snapshotSha256:'b'.repeat(64),domain:'catches',
  recordId:'catch-example'};
 const flags={enabled:false};
 const isolated=createD6ProductionMediaTicketVerifier({
  origin:ISO,secret:HMAC,now:()=>NOW,
  isolatedOriginEnabled:()=>flags.enabled,
 }).verifyTicket;
 await assert.rejects(isolated(ticket,{operation}),
  e=>e instanceof D6MediaTicketError&&e.code==='DISABLED');
 flags.enabled=true;
 assert.equal((await isolated(ticket,{operation})).path,PATH);
 const production=createD6ProductionMediaTicketVerifier({
  secret:HMAC,now:()=>NOW,
 }).verifyTicket;
 await assert.rejects(production(ticket,{operation}),
  e=>e instanceof D6MediaTicketError&&e.code==='SIGNATURE_UNVERIFIED');
});
