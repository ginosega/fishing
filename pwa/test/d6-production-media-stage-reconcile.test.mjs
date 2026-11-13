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
import {createD6ProductionMediaStageReconciliation,
 D6_MEDIA_STAGE_PROOF_SQL,D6MediaStageReconcileError}
 from '../../experiments/p3/preview/src/d6-production-media-stage-reconcile.mjs';

const REPO=D6_PUBLISH_REPOSITORY,origin=D6_PUBLISH_INTAKE_ORIGIN;
const ID='123e4567-e89b-42d3-a456-426614174000',MAIN='a'.repeat(40);
const SNAPSHOT='b'.repeat(64),PATH='Catches/assets/catch-example/notes/photo.png';
const PNG=Uint8Array.from(Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64'));
const GIT_SHA=createHash('sha1').update(Buffer.concat([
 Buffer.from('blob '+PNG.length+'\0'),Buffer.from(PNG)])).digest('hex');
const responseBlob=(bytes=PNG,sha=GIT_SHA)=>new Response(JSON.stringify({
 sha,encoding:'base64',size:bytes.length,
 content:Buffer.from(bytes).toString('base64'),
}),{status:200,headers:{'Content-Type':'application/json'}});
const upload=()=>new Request(origin+'/api/v3/media',{method:'POST',
 headers:{
  Origin:origin,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-CSRF':'test-only',
  'X-Fish-V3-Intent':'stage-media',
  'X-Fish-V3-Operation':ID,'X-Fish-V3-Media-Path':encodeURIComponent(PATH),
  'Content-Type':'image/png',
 },body:PNG});
const authRequest=()=>new Request(origin+'/api/v3/operations/reconcile',{
 method:'POST',headers:{
  Origin:origin,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-CSRF':'test-only','X-Fish-V3-Intent':'publish',
  'Content-Type':'application/json',
 },body:'{}'});
const operation=()=>({
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
 return {operation:operation(),package:pkg};
}
function memoryD1({lostProofAck=false}={}){
 const fences=[],proofs=[],stats={reads:0,writes:0};
 let lose=lostProofAck;
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
     owner_github_id:owner,repository_id:repo,request_sha256:digest,
     state:'Unknown',created_at:at});
    return {meta:{changes:found?0:1}};
   }
   assert(sql.includes('INSERT OR IGNORE INTO d6_media_stage_verified'));
   const [id,path,owner,repo,requestSha,blobSha,digest,bytes,mime,at]=args;
   const found=proofs.find(x=>x.operation_id===id&&x.path===path);
   if(!found)proofs.push({operation_id:id,path,
    owner_github_id:owner,repository_id:repo,
    request_sha256:requestSha,blob_sha:blobSha,
    sha256:digest,bytes,mime,state:'VerifiedStage',verified_at:at});
   if(lose){lose=false;throw Error('D1 proof write ack lost');}
   return {meta:{changes:found?0:1}};
  },
 };}};}};
 return {DB,fences,proofs,stats};
}
async function setup({db=memoryD1(),enabled=true,
 ownerAllowed=true,readMode='ok',wrongSource=false}={}){
 const stored=await fixture();
 if(wrongSource)stored.operation.sourceRevision='c'.repeat(40);
 const state={enabled,ownerAllowed,readMode,
  auth:0,sourceLoads:0,readRequests:[],writeRequests:[],
  issuedReadTokens:0,issuedWriteTokens:0};
 const session={
  authorizeMedia:async request=>{
   assert.equal(request.headers.get('X-Fish-V3-Intent'),'stage-media');
   if(!state.ownerAllowed)throw Error('denied');
   return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
  },
  authorizeWrite:async request=>{
   state.auth++;
   assert.equal(request.method,'POST');
   assert.equal(request.headers.get('X-Fish-V3-Intent'),'publish');
   if(!state.ownerAllowed)throw Error('denied');
   return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
  },
 };
 const loadAcceptedOperation=async()=>{
  state.sourceLoads++;
  return stored;
 };
 const preflight=createD6ProductionMediaUploadPreflight({
  session,loadAcceptedOperation,enabled:()=>state.enabled,
 });
 const stage=createD6ProductionMediaStageFence({
  DB:db.DB,preflight,enabled:()=>state.enabled,now:()=>1800000000,
  verifyPrerequisite:async c=>({
   verified:true,operationId:c.operationId,ownerGitHubId:c.ownerGitHubId,
   repositoryId:c.repositoryId,requestSha256:c.requestSha256,
   expectedBlobSha:c.expectedBlobSha,
  }),
  issueWriteToken:async()=>{state.issuedWriteTokens++;return {
   repositoryId:REPO.id,permissions:{contents:'write'},
   token:'TEST-ONLY-GITHUB-WRITE-CREDENTIAL',
  };},
  request:async(url,options)=>{
   state.writeRequests.push({url,options});
   return new Response(JSON.stringify({sha:GIT_SHA}),{
    status:201,headers:{'Content-Type':'application/json'},
   });
  },
 });
 const reconcile=createD6ProductionMediaStageReconciliation({
  DB:db.DB,session,loadAcceptedOperation,
  now:()=>1800000001,enabled:()=>state.enabled,
  issueReadToken:async args=>{
   state.issuedReadTokens++;assert.deepEqual(args,{
    repositoryId:REPO.id,permissions:{contents:'read'},
   });
   return {repositoryId:REPO.id,permissions:{contents:'read'},
    token:'TEST-ONLY-GITHUB-READ-CREDENTIAL'};
  },
  request:async(url,options)=>{
   state.readRequests.push({url,options});
   if(state.readMode==='timeout')throw Error('read timed out');
   if(state.readMode==='404')return new Response('not found',{status:404});
   if(state.readMode==='bad-base64')return new Response(JSON.stringify({
    sha:GIT_SHA,encoding:'base64',size:PNG.length,content:'@@@',
   }),{status:200,headers:{'Content-Type':'application/json'}});
   if(state.readMode==='mismatch'){
    const altered=Uint8Array.from(PNG);altered[20]^=1;
    return responseBlob(altered);
   }
   if(state.readMode==='sha-spoof')return responseBlob(PNG,'c'.repeat(40));
   return responseBlob();
  },
 });
 return {db,state,stage,reconcile,stored};
}
const args={operationId:ID,path:PATH,blobSha:GIT_SHA};
const denied=(promise,code)=>assert.rejects(promise,
 e=>e instanceof D6MediaStageReconcileError&&e.code===code);

test('WP3-READ01 independent Git GET produces durable non-Live staging receipt',async()=>{
 const x=await setup();
 const unknown=await x.stage.attempt(upload());
 assert.equal(unknown.state,'Unknown');
 const proof=await x.reconcile.reconcile(authRequest(),args);
 assert.equal(proof.state,'VerifiedStage');
 assert.equal(proof.verifiedStage,true);assert.equal(proof.canPublish,false);
 assert.equal(proof.isLive,false);assert.equal(proof.sourceOnly,true);
 assert.equal(proof.blobSha,GIT_SHA);
 assert.equal(proof.requiresSignedTicket,true);
 assert.equal(x.db.fences.length,1);assert.equal(x.db.proofs.length,1);
 assert.equal(x.state.writeRequests.length,1);
 assert.equal(x.state.readRequests.length,1);
 assert.equal(x.state.readRequests[0].url,
  'https://api.github.com/repos/ginosega/fishing/git/blobs/'+GIT_SHA);
 assert.equal(x.state.readRequests[0].options.method,'GET');
 assert.equal(x.state.readRequests[0].options.redirect,'manual');
 assert.match(D6_MEDIA_STAGE_PROOF_SQL,
  /PRIMARY KEY\(operation_id,path\)/);
 assert.match(D6_MEDIA_STAGE_PROOF_SQL,/CHECK\(state='VerifiedStage'\)/);
});

test('WP3-READ02 missing Unknown fence blocks GitHub read',async()=>{
 const x=await setup();
 await denied(x.reconcile.reconcile(authRequest(),args),'FENCE_UNVERIFIED');
 assert.equal(x.state.issuedReadTokens,0);
 assert.equal(x.state.readRequests.length,0);
 assert.equal(x.db.proofs.length,0);
});

test('WP3-READ03 owner authorization and default-off precede source read',async()=>{
 const off=await setup({enabled:false});
 await denied(off.reconcile.reconcile(authRequest(),args),'DISABLED');
 assert.equal(off.state.auth,0);assert.equal(off.state.sourceLoads,0);
 const notOwner=await setup({ownerAllowed:false});
 await denied(notOwner.reconcile.reconcile(authRequest(),args),
  'OWNER_DENIED');
 assert.equal(notOwner.state.sourceLoads,0);
 assert.deepEqual(notOwner.db.stats,{reads:0,writes:0});
});

test('WP3-READ04 unknown provider result never causes a repeated Git POST',async()=>{
 const x=await setup({readMode:'404'});
 await x.stage.attempt(upload());
 await denied(x.reconcile.reconcile(authRequest(),args),
  'BLOB_READ_UNKNOWN');
 x.state.readMode='timeout';
 await denied(x.reconcile.reconcile(authRequest(),args),
  'BLOB_READ_UNKNOWN');
 assert.equal(x.db.fences.length,1);assert.equal(x.db.proofs.length,0);
 assert.equal(x.state.writeRequests.length,1);
 assert.equal((await x.stage.attempt(upload())).attemptedNow,false);
 assert.equal(x.state.writeRequests.length,1);
});

test('WP3-READ05 forged Git SHA, invalid base64 and bytes cannot become proof',async()=>{
 for(const [mode,code] of [
  ['sha-spoof','BLOB_UNVERIFIED'],['bad-base64','BLOB_UNVERIFIED'],
  ['mismatch','BLOB_DIGEST_MISMATCH'],
 ]){
  const x=await setup({readMode:mode});
  await x.stage.attempt(upload());
  await denied(x.reconcile.reconcile(authRequest(),args),code);
  assert.equal(x.db.proofs.length,0);
  assert.equal(x.state.writeRequests.length,1);
 }
});

test('WP3-READ06 immutable D1 stage proofs tolerate duplicate readbacks',async()=>{
 const x=await setup();
 await x.stage.attempt(upload());
 const first=await x.reconcile.reconcile(authRequest(),args);
 const second=await x.reconcile.reconcile(authRequest(),args);
 assert.deepEqual(second,first);
 assert.equal(x.db.proofs.length,1);
 assert.equal(x.state.writeRequests.length,1);
 assert.equal(x.state.readRequests.length,2);
});

test('WP3-READ07 mismatched durable fingerprint and corrupt receipt fail closed',async()=>{
 const x=await setup();
 await x.stage.attempt(upload());
 x.db.fences[0].request_sha256='f'.repeat(64);
 await denied(x.reconcile.reconcile(authRequest(),args),'FENCE_MISMATCH');
 assert.equal(x.db.proofs.length,0);
 const y=await setup();
 await y.stage.attempt(upload());
 await y.reconcile.reconcile(authRequest(),args);
 y.db.proofs[0].sha256='f'.repeat(64);
 await denied(y.reconcile.reconcile(authRequest(),args),'PROOF_MISMATCH');
 assert.equal(y.db.proofs.length,1);
 assert.equal(y.state.writeRequests.length,1);
});

test('WP3-READ08 lost D1 proof acknowledgement requires readback reconciliation',async()=>{
 const x=await setup({db:memoryD1({lostProofAck:true})});
 await x.stage.attempt(upload());
 await denied(x.reconcile.reconcile(authRequest(),args),'STORE_UNAVAILABLE');
 assert.equal(x.db.proofs.length,1);
 assert.equal(x.state.writeRequests.length,1);
 const proof=await x.reconcile.reconcile(authRequest(),args);
 assert.equal(proof.state,'VerifiedStage');
 assert.equal(x.db.proofs.length,1);
 assert.equal(x.state.writeRequests.length,1);
});

test('WP3-READ09 source, operation and blob hints cannot bypass trusted source',async()=>{
 const x=await setup();await x.stage.attempt(upload());
 await denied(x.reconcile.reconcile(authRequest(),{...args,
  path:'Catches/assets/other/notes/photo.png'}),'UNEXPECTED_MEDIA_PATH');
 await denied(x.reconcile.reconcile(authRequest(),{...args,
  operationId:'123e4567-e89b-42d3-a456-426614174001'}),
  'UNTRUSTED_OPERATION');
 await denied(x.reconcile.reconcile(authRequest(),{...args,
  blobSha:'f'.repeat(40)}),'BLOB_UNVERIFIED');
 assert.equal(x.db.proofs.length,0);
 assert.equal(x.state.writeRequests.length,1);
 const stale=await setup({wrongSource:true});
 await denied(stale.reconcile.reconcile(authRequest(),args),
  'UNTRUSTED_OPERATION');
 assert.equal(stale.state.readRequests.length,0);
});
