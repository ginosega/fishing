import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sha256} from '../src/shared.mjs';
import {prepareChange} from '../src/handoff.mjs';
import {D6_PUBLISH_REPOSITORY,D6_PUBLISH_INTAKE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionMediaUploadPreflight}
 from '../../experiments/p3/preview/src/d6-production-media-upload-preflight.mjs';
import {createD6ProductionMediaStageFence}
 from '../../experiments/p3/preview/src/d6-production-media-stage-fence.mjs';
import {createD6ProductionMediaStageReconciliation}
 from '../../experiments/p3/preview/src/d6-production-media-stage-reconcile.mjs';
import {createD6ProductionVerifiedMediaTicketIssuer,D6MediaTicketIssueError}
 from '../../experiments/p3/preview/src/d6-production-media-ticket-issuer.mjs';
import {createD6ProductionMediaTicketVerifier,D6_MEDIA_TICKET_TTL_SECONDS}
 from '../../experiments/p3/preview/src/d6-production-media-ticket-verify.mjs';
import {verifyD6CanonicalStagedGitBlobs}
 from '../../experiments/p3/preview/src/d6-production-media-blob-proof.mjs';

const REPO=D6_PUBLISH_REPOSITORY,origin=D6_PUBLISH_INTAKE_ORIGIN;
const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),SNAPSHOT='b'.repeat(64);
const PATH='Catches/assets/catch-example/notes/photo.png';
const SECRET='test-only-hmac-issuer-secret-cccccccccccccccccccccccccccccccc';
const NOW=1800000002;
const PNG=Uint8Array.from(Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64'));
const GIT_SHA=createHash('sha1').update(Buffer.concat([
 Buffer.from('blob '+PNG.length+'\0'),Buffer.from(PNG)])).digest('hex');
const blob=()=>({sha:GIT_SHA,encoding:'base64',size:PNG.length,
 content:Buffer.from(PNG).toString('base64')});
const responseBlob=()=>new Response(JSON.stringify(blob()),{
 status:200,headers:{'Content-Type':'application/json'},
});
const upload=()=>new Request(origin+'/api/v3/media',{
 method:'POST',headers:{
  'Origin':origin,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'stage-media',
  'X-Fish-V3-CSRF':'injected-fake-session-validates',
  'X-Fish-V3-Operation':ID,'X-Fish-V3-Media-Path':
   encodeURIComponent(PATH),
  'Content-Type':'image/png',
 },body:PNG,
});
const authorizedRequest=()=>new Request(origin+'/api/v3/operations',{
 method:'POST',headers:{
  Origin:origin,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'publish',
  'X-Fish-V3-CSRF':'injected-fake-session-validates',
  'Content-Type':'application/json',
 },body:'{}',
});
const op=()=>({
 operationId:ID,repositoryId:REPO.id,ownerGitHubId:REPO.ownerGitHubId,
 ref:REPO.ref,state:'Accepted',sourceRevision:MAIN,
 snapshotSha256:SNAPSHOT,domain:'catches',recordId:'catch-example',
});
async function fixture(){
 const pkg=await prepareChange({
  domain:'catches',operation:'add',id:'catch-example',
  record:{id:'catch-example',date:'2026-11-12'},
  sourceRevision:MAIN,text:'![Fish](../assets/catch-example/notes/photo.png)',
  notesImages:[{path:PATH,bytes:PNG.length,sha256:await sha256(PNG)}],
 });
 return {operation:op(),package:pkg};
}
function memoryD1(){
 const fences=[],proofs=[],stats={reads:0,writes:0};
 const DB={prepare(sql){return {bind(...args){return {
  async first(){
   stats.reads++;
   if(sql.includes('FROM d6_provider_step_fences')){
    const [id,key]=args;
    return fences.find(x=>x.operation_id===id&&x.step_key===key)??null;
   }
   assert(sql.includes('FROM d6_media_stage_verified'));
   const [id,path]=args;
   return proofs.find(x=>x.operation_id===id&&x.path===path)??null;
  },
  async run(){
   stats.writes++;
   if(sql.includes('INSERT OR IGNORE INTO d6_provider_step_fences')){
    const [id,key,owner,repo,digest,at]=args;
    const found=fences.find(x=>x.operation_id===id&&x.step_key===key);
    if(!found)fences.push({operation_id:id,step_key:key,
     owner_github_id:owner,repository_id:repo,
     request_sha256:digest,state:'Unknown',created_at:at});
    return {meta:{changes:found?0:1}};
   }
   assert(sql.includes('INSERT OR IGNORE INTO d6_media_stage_verified'));
   const [id,path,owner,repo,requestSha,blobSha,digest,bytes,mime,at]=args;
   const found=proofs.find(x=>x.operation_id===id&&x.path===path);
   if(!found)proofs.push({operation_id:id,path,
    owner_github_id:owner,repository_id:repo,
    request_sha256:requestSha,blob_sha:blobSha,
    sha256:digest,bytes,mime,state:'VerifiedStage',verified_at:at});
   return {meta:{changes:found?0:1}};
  },
 };}};}};
 return {DB,fences,proofs,stats};
}
async function setup({enabled=true,owner=true,sourceOk=true,
 db=memoryD1(),readError=false}={}){
 const stored=await fixture();
 const state={enabled,owner,sourceOk,
  ownerCalls:0,sourceLoads:0,sourceChecks:0,
  blobPosts:0,blobGets:0};
 const session={
  authorizeMedia:async req=>{
   state.ownerCalls++;
   assert.equal(req.headers.get('X-Fish-V3-Intent'),'stage-media');
   if(!state.owner)throw Error('not owner');
   return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
  },
  authorizeWrite:async req=>{
   state.ownerCalls++;
   assert.equal(req.method,'POST');
   assert.equal(req.headers.get('X-Fish-V3-Intent'),'publish');
   if(!state.owner)throw Error('not owner');
   return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
  },
 };
 const loadAcceptedOperation=async()=>{
  state.sourceLoads++;return stored;
 };
 const preflight=createD6ProductionMediaUploadPreflight({
  session,loadAcceptedOperation,enabled:()=>state.enabled,
 });
 const stage=createD6ProductionMediaStageFence({
  DB:db.DB,preflight,enabled:()=>state.enabled,
  now:()=>1800000000,
  verifyPrerequisite:async ctx=>({
   verified:true,operationId:ctx.operationId,
   repositoryId:ctx.repositoryId,ownerGitHubId:ctx.ownerGitHubId,
   requestSha256:ctx.requestSha256,expectedBlobSha:ctx.expectedBlobSha,
  }),
  issueWriteToken:async()=>({
   repositoryId:REPO.id,permissions:{contents:'write'},
   token:'TEST-ONLY-FAKE-WRITE-CREDENTIAL',
  }),
  request:async()=>{
   state.blobPosts++;
   return new Response(JSON.stringify({sha:GIT_SHA}),{
    status:201,headers:{'Content-Type':'application/json'},
   });
  },
 });
 const readback=createD6ProductionMediaStageReconciliation({
  DB:db.DB,session,loadAcceptedOperation,
  now:()=>1800000001,enabled:()=>state.enabled,
  issueReadToken:async()=>({
   repositoryId:REPO.id,permissions:{contents:'read'},
   token:'TEST-ONLY-FAKE-READ-CREDENTIAL',
  }),
  request:async()=>{state.blobGets++;
   if(readError)throw Error('provider unavailable');
   return responseBlob();
  },
 });
 const issuer=createD6ProductionVerifiedMediaTicketIssuer({
  DB:db.DB,session,loadAcceptedOperation,
  enabled:()=>state.enabled,now:()=>NOW,secret:SECRET,
  verifyCanonicalSource:async args=>{
   state.sourceChecks++;
   return {
    verified:state.sourceOk,operationId:args.operationId,
    repositoryId:args.repositoryId,
    ownerGitHubId:args.ownerGitHubId,
    ref:args.ref,sourceRevision:args.sourceRevision,
    snapshotSha256:args.snapshotSha256,
    requestSha256:args.requestSha256,
   };
  },
 });
 const verifier=createD6ProductionMediaTicketVerifier({
  origin,secret:SECRET,now:()=>NOW,
 }).verifyTicket;
 return {stage,readback,issuer,verifier,db,stored,state};
}
async function verified(x){
 await x.stage.attempt(upload());
 await x.readback.reconcile(authorizedRequest(),{
  operationId:ID,path:PATH,blobSha:GIT_SHA,
 });
}
const issueArgs={operationId:ID,path:PATH};
const denied=(p,code)=>assert.rejects(p,e=>
 e instanceof D6MediaTicketIssueError&&e.code===code);

test('WP3-ISSUE01 authenticated original stage to signed ticket and independent blob proof',async()=>{
 const x=await setup();await verified(x);
 const result=await x.issuer.issue(authorizedRequest(),issueArgs);
 assert.equal(result.issuedFromVerifiedStage,true);
 assert.equal(result.canPublish,false);
 assert.equal(result.isLive,false);
 assert.equal(result.sourceOnly,true);
 assert.equal(result.requiresIndependentGitReadback,true);
 assert.equal(result.ticket.operationId,ID);
 assert.equal(result.ticket.blobSha,GIT_SHA);
 assert.equal(result.ticket.expiresAt-result.ticket.issuedAt,
  D6_MEDIA_TICKET_TTL_SECONDS);
 assert.equal(Object.isFrozen(result.ticket),true);
 const signed=await x.verifier(result.ticket,{
  operation:x.stored.operation,allowExpired:false});
 assert.equal(signed.path,PATH);
 const completed=await verifyD6CanonicalStagedGitBlobs({
  package:x.stored.package,operation:x.stored.operation,
  media:[result.ticket],verifyTicket:x.verifier,
  readGitBlob:async({repositoryId,blobSha})=>{
   assert.equal(repositoryId,REPO.id);
   assert.equal(blobSha,GIT_SHA);
   return blob();
  },
 });
 assert.equal(completed.verified,true);
 assert.equal(completed.canPublish,false);
 assert.equal(completed.fileCount,1);
 assert.equal(x.state.blobPosts,1);
 assert.equal(x.state.blobGets,1);
 assert.equal(x.db.fences.length,1);
 assert.equal(x.db.proofs.length,1);
});

test('WP3-ISSUE02 no durable stage proof or fence means no signing',async()=>{
 const x=await setup();
 await denied(x.issuer.issue(authorizedRequest(),issueArgs),'FENCE_UNVERIFIED');
 await x.stage.attempt(upload());
 await denied(x.issuer.issue(authorizedRequest(),issueArgs),'PROOF_UNVERIFIED');
 assert.equal(x.state.sourceChecks,0);
 assert.equal(x.state.blobPosts,1);
});

test('WP3-ISSUE03 default-off and denied owner precede D1/source reads',async()=>{
 const off=await setup({enabled:false});
 await denied(off.issuer.issue(authorizedRequest(),issueArgs),'DISABLED');
 assert.deepEqual(off.db.stats,{reads:0,writes:0});
 assert.equal(off.state.sourceLoads,0);
 const no=await setup({owner:false});
 await denied(no.issuer.issue(authorizedRequest(),issueArgs),'OWNER_DENIED');
 assert.deepEqual(no.db.stats,{reads:0,writes:0});
 assert.equal(no.state.sourceLoads,0);
});

test('WP3-ISSUE04 wrong path, record, operation or source cannot reuse a proof',async()=>{
 const x=await setup();await verified(x);
 await denied(x.issuer.issue(authorizedRequest(),{...issueArgs,
  operationId:'123e4567-e89b-42d3-a456-426614174001'}),
  'UNTRUSTED_OPERATION');
 await denied(x.issuer.issue(authorizedRequest(),{...issueArgs,
  path:'Catches/assets/catch-example/notes/different.png'}),
  'UNEXPECTED_MEDIA_PATH');
 x.stored.operation.recordId='different';
 await denied(x.issuer.issue(authorizedRequest(),issueArgs),'UNTRUSTED_OPERATION');
 x.stored.operation.recordId='catch-example';
 x.stored.operation.sourceRevision='c'.repeat(40);
 await denied(x.issuer.issue(authorizedRequest(),issueArgs),'UNTRUSTED_OPERATION');
 assert.equal(x.state.sourceChecks,0);
});

test('WP3-ISSUE05 corrupted D1 proof/fence never produces a ticket',async()=>{
 const variants=[
  ['wrong digest',r=>r.sha256='f'.repeat(64),'PROOF_UNVERIFIED'],
  ['wrong blob sha',r=>r.blob_sha='f'.repeat(40),'FENCE_MISMATCH'],
  ['wrong record owner',r=>r.owner_github_id=8,'PROOF_UNVERIFIED'],
  ['unknown proof state',r=>r.state='Unknown','PROOF_UNVERIFIED'],
  ['wrong request fingerprint',r=>r.request_sha256='f'.repeat(64),
   'PROOF_UNVERIFIED'],
  ['untrusted verification time',r=>r.verified_at=NOW+100,
   'PROOF_UNVERIFIED'],
 ];
 for(const [,mutate,code] of variants){
  const x=await setup();await verified(x);
  mutate(x.db.proofs[0]);
  await denied(x.issuer.issue(authorizedRequest(),issueArgs),code);
  assert.equal(x.state.blobPosts,1);
 }
 const fenced=await setup();await verified(fenced);
 fenced.db.fences[0].request_sha256='0'.repeat(64);
 await denied(fenced.issuer.issue(authorizedRequest(),issueArgs),
  'PROOF_UNVERIFIED');
});

test('WP3-ISSUE06 stale/failed trusted main gate blocks issuing',async()=>{
 const x=await setup({sourceOk:false});await verified(x);
 await denied(x.issuer.issue(authorizedRequest(),issueArgs),
  'SOURCE_UNVERIFIED');
 assert.equal(x.state.sourceChecks,1);
 assert.equal(x.state.blobPosts,1);
 assert.equal(x.db.proofs.length,1);
});

test('WP3-ISSUE07 ticket forgery, cross-operation replay and expiry fail verification',async()=>{
 const x=await setup();await verified(x);
 const r=await x.issuer.issue(authorizedRequest(),issueArgs);
 const altered={...r.ticket,sha256:'f'.repeat(64)};
 await assert.rejects(x.verifier(altered,{
  operation:x.stored.operation,allowExpired:false}));
 await assert.rejects(x.verifier(r.ticket,{
  operation:{...x.stored.operation,
   operationId:'123e4567-e89b-42d3-a456-426614174001'},
  allowExpired:false}));
 const expired=createD6ProductionMediaTicketVerifier({
  secret:SECRET,origin,now:()=>NOW+D6_MEDIA_TICKET_TTL_SECONDS,
 }).verifyTicket;
 await assert.rejects(expired(r.ticket,{
  operation:x.stored.operation,allowExpired:false}));
});

test('WP3-ISSUE08 repeated ticket issuance never repeats media provider write',async()=>{
 const x=await setup();await verified(x);
 const a=await x.issuer.issue(authorizedRequest(),issueArgs);
 const b=await x.issuer.issue(authorizedRequest(),issueArgs);
 assert.deepEqual(b.ticket,a.ticket);
 assert.equal(x.state.blobPosts,1);
 assert.equal(x.state.blobGets,1);
 assert.equal(x.db.proofs.length,1);
 assert.equal(x.state.sourceChecks,2);
});

test('WP3-ISSUE09 readback uncertainty and invalid server secret fail closed',async()=>{
 const x=await setup({readError:true});
 await x.stage.attempt(upload());
 await assert.rejects(x.readback.reconcile(authorizedRequest(),{
  operationId:ID,path:PATH,blobSha:GIT_SHA,
 }));
 await denied(x.issuer.issue(authorizedRequest(),issueArgs),'PROOF_UNVERIFIED');
 assert.equal(x.state.blobPosts,1);
 await assert.rejects(async()=>createD6ProductionVerifiedMediaTicketIssuer({
  DB:x.db.DB,session:{authorizeWrite:async()=>({})},
  loadAcceptedOperation:async()=>x.stored,
  verifyCanonicalSource:async()=>({verified:true}),
  secret:'short',enabled:()=>true,
 }),e=>e instanceof D6MediaTicketIssueError&&e.code==='INVALID_CONFIG');
});
