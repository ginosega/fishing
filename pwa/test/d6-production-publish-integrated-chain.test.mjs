/**
 * FISH-TODO-118 WP3 — source-only integration of the REAL existing components.
 * No alternative coordinator, staging implementation or GitHub write path.
 * Fixture media and provider responses are synthetic; D1 writes are forbidden.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DOMAIN,sha256} from '../src/shared.mjs';
import {prepareChange,promoteChange} from '../src/handoff.mjs';
import {D6_PUBLISH_REPOSITORY,D6_PUBLISH_INTAKE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {expectedD6CanonicalMedia}
 from '../../experiments/p3/preview/src/d6-production-media-contract.mjs';
import {describeD6CanonicalMediaStageMetadata}
 from '../../experiments/p3/preview/src/d6-production-media-stage-fence.mjs';
import {createD6ProductionAcceptedOperationReader}
 from '../../experiments/p3/preview/src/d6-production-accepted-operation-reader.mjs';
import {createD6ProductionVerifiedMediaTicketIssuer}
 from '../../experiments/p3/preview/src/d6-production-media-ticket-issuer.mjs';
import {createD6ProductionMediaTicketVerifier}
 from '../../experiments/p3/preview/src/d6-production-media-ticket-verify.mjs';
import {createD6ProductionVerifiedMediaOperationBinding}
 from '../../experiments/p3/preview/src/d6-production-verified-media-operation-binding.mjs';
import {createD6ProductionAtomicSourceMediaTree}
 from '../../experiments/p3/preview/src/d6-production-atomic-source-media-tree.mjs';
import {describeD6AtomicTreeStep}
 from '../../experiments/p3/preview/src/d6-production-atomic-tree-step.mjs';
import {describeD6PublishBranchStep}
 from '../../experiments/p3/preview/src/d6-production-publish-branch-coordinator.mjs';
import {describeD6PublishCommitStep}
 from '../../experiments/p3/preview/src/d6-production-publish-commit-coordinator.mjs';
import {describeD6PublishAdvanceStep}
 from '../../experiments/p3/preview/src/d6-production-publish-advance-coordinator.mjs';
import {describeD6PublishPrStep}
 from '../../experiments/p3/preview/src/d6-production-publish-pr-coordinator.mjs';
import {createD6ProductionPublishRecoveryLifecycle,
 D6PublishRecoveryError}
 from '../../experiments/p3/preview/src/d6-production-publish-recovery-lifecycle.mjs';

const REPO=D6_PUBLISH_REPOSITORY,ORIGIN=D6_PUBLISH_INTAKE_ORIGIN;
const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),BASE='b'.repeat(40);
const TREE='c'.repeat(40),COMMIT='d'.repeat(40);
const CLOCK=1800000300,PR_NUMBER=991,PR_ID=200991;
const SECRET='test-only-WP3-integration-HMAC-AAAAAAAAAAAAAAAAAAAAAAAAAA';
const PNG=Uint8Array.from(Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64'));
const gitSha=data=>createHash('sha1').update(Buffer.concat([
 Buffer.from('blob '+data.length+'\0'),Buffer.from(data),
])).digest('hex');
const IMAGE_SHA=gitSha(PNG);
const STEPS=['tree','branch','commit','advance','pr'];
const verifiedStates=['VerifiedTree','VerifiedBranch','VerifiedCommit',
 'VerifiedAdvance','VerifiedPr'];
const fullRef='refs/heads/fish-v3/publish/'+ID;
const request=()=>new Request(ORIGIN+'/api/v3/operations',{
 method:'POST',headers:{
  Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'publish','X-Fish-V3-CSRF':'integration-test',
  'Content-Type':'application/json',
 },body:'{}',
});
const baseData=()=>({
 gear:{schemaVersion:2,items:[]},
 kb:{schemaVersion:2,entities:[]},
 catches:{schemaVersion:2,catches:[]},
});
const media=async path=>({path,bytes:PNG.length,sha256:await sha256(PNG)});
async function packageFor(domain='gear',withMedia=true){
 if(domain==='gear'){
  const record={id:'example-jig',name:'Example Jig',category:'lures',
   type:'Jigs'};
  const path='Gear/Lures/assets/example-jig.png';
  return prepareChange({
   domain,operation:'add',id:record.id,record,sourceRevision:MAIN,
   ...(withMedia?{pictureAction:'add',picturePath:path,
    pictureFile:await media(path)}:{}),
  });
 }
 if(domain==='catches'){
  const record={id:'catch-example',date:'2026-11-12'};
  const path='Catches/assets/catch-example/notes/photo.png';
  return prepareChange({
   domain,operation:'add',id:record.id,record,sourceRevision:MAIN,
   text:withMedia?'![Catch](../assets/catch-example/notes/photo.png)':
    'Catch notes without media',
   ...(withMedia?{notesImages:[await media(path)]}:{}),
  });
 }
 const record={id:'example-knot',type:'knot',name:'Example Knot'};
 const paths=[1,2].map(n=>
  'KB/Knots/assets/example-knot/step-0'+n+'.png');
 return prepareChange({
  domain:'kb',operation:'add',id:record.id,record,sourceRevision:MAIN,
  text:'# Knot instructions',
  ...(withMedia?{
   pictureAction:'add',picturePath:paths[1],
   pictureFile:await media(paths[1]),
   pictureSequenceAction:'set',pictureSequencePaths:paths,
   pictureSequenceFiles:await Promise.all(paths.map(media)),
  }:{})
 });
}
const blob=bytes=>({sha:gitSha(bytes),size:bytes.length,
 encoding:'base64',content:Buffer.from(bytes).toString('base64')});
async function fixture(domain='gear',withMedia=true){
 const pkg=await packageFor(domain,withMedia);
 const originals=expectedD6CanonicalMedia(pkg);
 const raw=JSON.stringify({
  owner:REPO.ownerGitHubId,repositoryId:REPO.id,
  snapshot:{package:pkg,media:originals},
 });
 const record={
  operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  idempotency_key:'integration_chain_1234567890',
  snapshot_sha256:await sha256(raw),snapshot_json:raw,
  candidate_sha256:'e'.repeat(64),source_revision:MAIN,
  domain,operation_kind:'add',record_id:pkg.id,
  state:'Accepted',created_at:1800000000,updated_at:1800000000,
 };
 const source={
  repositoryId:REPO.id,repositoryFullName:REPO.name,
  ref:REPO.ref,sourceRevision:MAIN,treeSha:BASE,
  sourceOnly:true,canPublish:false,
  data:baseData(),
  files:new Set(Object.values(DOMAIN).map(x=>x.file)),
  markdown:new Map(),
 };
 const promoted=await promoteChange({package:pkg,sourceRevision:MAIN});
 const finalData=baseData();
 finalData[domain][DOMAIN[domain].array].push(promoted.record);
 const jsonBody=Buffer.from(JSON.stringify(finalData[domain],null,2)+'\n');
 const blobs=new Map([[gitSha(jsonBody),jsonBody]]);
 for(const write of promoted.writes){
  if(write.remove)continue;
  const bytes=Buffer.from(write.body);
  blobs.set(gitSha(bytes),bytes);
 }
 if(withMedia)blobs.set(IMAGE_SHA,PNG);
 const fences=[],stageProofs=[],publishProofs=[];
 const counts={owner:0,d1Reads:0,d1Writes:0,blobReads:0,
  signed:0,sourceChecks:0,mutations:0,plans:0};
 let enabled=true,owner=true,sourceRevision=MAIN;
 for(const original of originals){
  const claim=await describeD6CanonicalMediaStageMetadata({
   operationId:ID,sourceRevision:MAIN,
   snapshotSha256:record.snapshot_sha256,
   path:original.path,bytes:original.bytes,
   sha256:original.sha256,mime:'image/png',
   expectedBlobSha:IMAGE_SHA,
  });
  fences.push({
   operation_id:ID,step_key:claim.stepKey,
   owner_github_id:REPO.ownerGitHubId,
   repository_id:REPO.id,request_sha256:claim.requestSha256,
   state:'Unknown',created_at:1800000020,
  });
  stageProofs.push({
   operation_id:ID,path:original.path,
   owner_github_id:REPO.ownerGitHubId,
   repository_id:REPO.id,request_sha256:claim.requestSha256,
   blob_sha:IMAGE_SHA,sha256:original.sha256,
   bytes:original.bytes,mime:'image/png',
   state:'VerifiedStage',verified_at:1800000021,
  });
 }
 const DB={prepare(sql){return {bind(...args){return {
  async first(){
   counts.d1Reads++;
   if(sql.includes('FROM d6_operation_receipts'))
    return record.operation_id===args[0]&&
     record.owner_github_id===args[1]?record:null;
   if(sql.includes('FROM d6_provider_step_fences'))
    return fences.find(x=>x.operation_id===args[0]&&
     x.step_key===args[1])??null;
   if(sql.includes('FROM d6_media_stage_verified'))
    return stageProofs.find(x=>x.operation_id===args[0]&&
     x.path===args[1])??null;
   const table={
    d6_atomic_tree_verified:'tree',
    d6_publish_branch_verified:'branch',
    d6_publish_commit_verified:'commit',
    d6_publish_advance_verified:'advance',
    d6_publish_pr_verified:'pr',
   };
   for(const [name,step] of Object.entries(table)){
    if(sql.includes('FROM '+name))
     return publishProofs.find(x=>x.step===step)?.row??null;
   }
   throw Error('Unsupported D1 SQL '+sql);
  },
  async run(){
   counts.d1Writes++;
   throw Error('No D1 writes are authorized for chain audit');
  },
 };}};}};
 const session={authorizeWrite:async req=>{
  counts.owner++;
  assert.equal(req.method,'POST');
  assert.equal(req.headers.get('X-Fish-V3-Intent'),'publish');
  if(!owner)throw Error('D2 owner rejected');
  return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
 }};
 const loadAcceptedOperation=createD6ProductionAcceptedOperationReader({
  DB,enabled:()=>enabled,
 }).loadAcceptedOperation;
 const issuerImpl=createD6ProductionVerifiedMediaTicketIssuer({
  DB,session,loadAcceptedOperation,
  secret:SECRET,enabled:()=>enabled,now:()=>CLOCK,
  verifyCanonicalSource:async args=>{
   counts.sourceChecks++;
   return {...args,verified:sourceRevision===MAIN};
  },
 });
 const issuer={issue:async(...args)=>{
  counts.signed++;
  return issuerImpl.issue(...args);
 }};
 const verifyTicket=createD6ProductionMediaTicketVerifier({
  secret:SECRET,origin:ORIGIN,now:()=>CLOCK,
 }).verifyTicket;
 const readGitBlob=async({repositoryId,repositoryFullName,blobSha})=>{
  counts.blobReads++;
  assert.equal(repositoryId,REPO.id);
  assert.equal(repositoryFullName,REPO.name);
  const bytes=blobs.get(blobSha);
  if(!bytes)throw Error('Synthetic Git blob missing');
  return blob(bytes);
 };
 const binding=createD6ProductionVerifiedMediaOperationBinding({
  session,loadAcceptedOperation,issuer,verifyTicket,readGitBlob,
  enabled:()=>enabled,
 });
 const atomicPlanner=createD6ProductionAtomicSourceMediaTree({
  loadSnapshot:async({expectedReleaseRevision})=>{
   counts.plans++;
   assert.equal(expectedReleaseRevision,MAIN);
   return {...source,sourceRevision};
  },
  readGitBlob,verifyTicket,enabled:()=>enabled,
 });
 const authRequest=request();
 const bound=binding.forRequest(authRequest);
 const accepted=async()=>bound.loadAcceptedOperation({
  operationId:ID,ownerGitHubId:REPO.ownerGitHubId,
 });
 const reconcilers=Object.fromEntries(STEPS.map(step=>[
  step,{reconcile:async()=>{
   throw Error('No synthetic or real provider writes in chain audit');
  }},
 ]));
 const lifecycle=createD6ProductionPublishRecoveryLifecycle({
  DB,session,loadAcceptedOperation:bound.loadAcceptedOperation,
  reconcilers,enabled:()=>enabled,now:()=>CLOCK,
 });
 return {pkg,record,source,originals,blobs,fences,stageProofs,
  publishProofs,counts,DB,authRequest,accepted,atomicPlanner,lifecycle,
  disable:()=>{enabled=false},
  denyOwner:()=>{owner=false},
  moveSource:()=>{sourceRevision='f'.repeat(40)},
 };
}
async function chain(x){
 const stored=await x.accepted();
 const plan=await x.atomicPlanner.plan({
  operation:stored.operation,package:stored.package,
  mediaTickets:stored.mediaTickets,
 });
 const tree=await describeD6AtomicTreeStep({
  operation:stored.operation,plan,
 });
 const tp={
  operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,request_sha256:tree.requestSha256,
  source_revision:MAIN,base_tree_sha:BASE,
  result_tree_sha:TREE,changed_paths:tree.entryCount,
  state:'VerifiedTree',verified_at:1800000201,
 };
 const branch=await describeD6PublishBranchStep({
  operation:stored.operation,treeAction:tree,treeProof:tp,
 });
 const bp={
  operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,tree_request_sha256:tree.requestSha256,
  request_sha256:branch.requestSha256,source_revision:MAIN,
  base_tree_sha:BASE,result_tree_sha:TREE,ref_name:fullRef,
  state:'VerifiedBranch',verified_at:1800000203,
 };
 const commit=await describeD6PublishCommitStep({
  operation:stored.operation,treeAction:tree,treeProof:tp,
  branchAction:branch,branchProof:bp,
 });
 const cp={
  operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,tree_request_sha256:tree.requestSha256,
  branch_request_sha256:branch.requestSha256,
  request_sha256:commit.requestSha256,
  source_revision:MAIN,result_tree_sha:TREE,
  result_commit_sha:COMMIT,ref_name:fullRef,
  state:'VerifiedCommit',verified_at:1800000205,
 };
 const advance=await describeD6PublishAdvanceStep({
  operation:stored.operation,treeAction:tree,branchAction:branch,
  commitAction:commit,commitReceipt:cp,
 });
 const ap={
  operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,tree_request_sha256:tree.requestSha256,
  branch_request_sha256:branch.requestSha256,
  commit_request_sha256:commit.requestSha256,
  request_sha256:advance.requestSha256,
  source_revision:MAIN,result_tree_sha:TREE,
  result_commit_sha:COMMIT,ref_name:fullRef,
  state:'VerifiedAdvance',verified_at:1800000207,
 };
 const pr=await describeD6PublishPrStep({
  operation:stored.operation,treeAction:tree,branchAction:branch,
  commitAction:commit,advanceAction:advance,advanceReceipt:ap,
 });
 const pp={
  operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,tree_request_sha256:tree.requestSha256,
  branch_request_sha256:branch.requestSha256,
  commit_request_sha256:commit.requestSha256,
  advance_request_sha256:advance.requestSha256,
  request_sha256:pr.requestSha256,source_revision:MAIN,
  result_commit_sha:COMMIT,ref_name:fullRef,
  pr_number:PR_NUMBER,pr_id:PR_ID,state:'VerifiedPr',
  verified_at:1800000209,
 };
 const actions=[tree,branch,commit,advance,pr],proofs=[tp,bp,cp,ap,pp];
 const fences=actions.map((action,i)=>({
  operation_id:ID,step_key:STEPS[i],
  owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,request_sha256:action.requestSha256,
  state:'Unknown',created_at:1800000200+i*2,
 }));
 return {stored,plan,actions,proofs,fences,
  addFence(i){x.fences.push(fences[i]);},
  addProof(i){x.publishProofs.push({step:STEPS[i],row:proofs[i]});},
 };
}
const state=async x=>x.lifecycle.inspect(x.authRequest,ID);
const denied=(p,code)=>assert.rejects(p,e=>
 e instanceof D6PublishRecoveryError&&e.code===code);

test('WP3-CHAIN01 Gear original travels real Accepted -> stage ticket -> tree -> five-step evidence',async()=>{
 const x=await fixture('gear',true),a=await chain(x);
 assert.equal(a.stored.mediaTickets.length,1);
 assert.equal(a.plan.mediaCount,1);
 assert.equal(a.plan.textCount,1);
 assert.equal(a.plan.fileCount,2);
 assert.equal(a.plan.canPublish,false);
 assert.deepEqual(a.actions.map(v=>v.stepKey),STEPS);
 assert(a.actions.every(v=>v.operationId===ID));
 assert.deepEqual(a.actions[2].body,{
  message:'Fishing Companion V3 content update '+ID,
  tree:TREE,parents:[MAIN],
 });
 assert.deepEqual(a.actions[3].body,{sha:COMMIT,force:false});
 assert.equal(a.actions[4].body.head,'fish-v3/publish/'+ID);
 assert.equal(a.actions[4].body.base,'main');
 for(let i=0;i<STEPS.length;i++){
  const waiting=await state(x);
  assert.equal(waiting.state,'AwaitingAuthorizedWrite');
  assert.equal(waiting.step,STEPS[i]);
  assert.equal(waiting.isLive,false);
  a.addFence(i);
  const uncertain=await state(x);
  assert.equal(uncertain.state,'ReconciliationRequired');
  assert.equal(uncertain.step,STEPS[i]);
  assert.equal(uncertain.safeToRetryWrite,false);
  assert.equal(uncertain.isLive,false);
  a.addProof(i);
 }
 const final=await state(x);
 assert.equal(final.state,'VerifiedPr');
 assert.equal(final.prNumber,PR_NUMBER);
 assert.deepEqual(final.verifiedSteps,STEPS);
 assert.equal(final.isLive,false);
 assert.equal(final.canMerge,false);
 assert.equal(final.canPublish,false);
 assert.equal(x.counts.mutations,0);
 assert.equal(x.counts.d1Writes,0);
});

test('WP3-CHAIN02 Catch Notes original and Knot frame order produce a single atomic tree',async()=>{
 for(const domain of ['catches','kb']){
  const x=await fixture(domain,true),a=await chain(x);
  assert.equal(a.plan.mediaCount,domain==='kb'?2:1);
  assert.equal(a.plan.textCount,2);
  assert.equal(a.plan.fileCount,domain==='kb'?4:3);
  assert.deepEqual(a.stored.mediaTickets.map(t=>t.path),
   x.originals.map(t=>t.path));
  assert.equal(a.actions[0].body.tree.length,a.plan.fileCount);
  assert.equal(a.actions[1].treeRequestSha256,a.actions[0].requestSha256);
  assert.equal(a.actions[2].branchRequestSha256,a.actions[1].requestSha256);
  assert.equal(a.actions[3].commitRequestSha256,a.actions[2].requestSha256);
  assert.equal(a.actions[4].advanceRequestSha256,a.actions[3].requestSha256);
  assert.equal((await state(x)).state,'AwaitingAuthorizedWrite');
  assert.equal(x.counts.d1Writes,0);
 }
});

test('WP3-CHAIN03 text-only accepted Gear/Catch/KB skips media without bypassing tree proofs',async()=>{
 for(const domain of ['gear','kb','catches']){
  const x=await fixture(domain,false),a=await chain(x);
  assert.deepEqual(a.stored.mediaTickets,[]);
  assert.equal(a.plan.mediaCount,0);
  assert.equal(a.plan.textCount,domain==='gear'?1:2);
  assert.equal(a.plan.fileCount,a.plan.textCount);
  assert.equal(x.counts.signed,0);
  assert.equal(a.actions[0].entryCount,a.plan.fileCount);
  a.addFence(0);a.addProof(0);
  const next=await state(x);
  assert.equal(next.state,'AwaitingAuthorizedWrite');
  assert.equal(next.step,'branch');
  assert.equal(next.isLive,false);
 }
});

test('WP3-CHAIN04 forged tree/commit/PR receipts cannot promote publishing lifecycle',async()=>{
 for(const change of [
  a=>a.proofs[0].request_sha256='f'.repeat(64),
  a=>a.proofs[1].tree_request_sha256='f'.repeat(64),
  a=>a.proofs[2].result_commit_sha='f'.repeat(40),
  a=>a.proofs[3].commit_request_sha256='f'.repeat(64),
  a=>a.proofs[4].advance_request_sha256='f'.repeat(64),
 ]){
  const x=await fixture(),a=await chain(x);
  for(let i=0;i<STEPS.length;i++){a.addFence(i);a.addProof(i);}
  change(a);
  await denied(state(x),'PROOF_CORRUPT');
  assert.equal(x.counts.d1Writes,0);
 }
});

test('WP3-CHAIN05 missing prior proof plus later fence is rejected, not silently resumed',async()=>{
 const x=await fixture(),a=await chain(x);
 a.addFence(0);a.addFence(1);
 await denied(state(x),'EVIDENCE_OUT_OF_ORDER');
 assert.equal(x.counts.d1Writes,0);
});

test('WP3-CHAIN06 a missing one-of-many Knot stages forbids constructing tree or write',async()=>{
 const x=await fixture('kb');
 x.stageProofs.pop();
 await assert.rejects(chain(x));
 assert.equal(x.counts.d1Writes,0);
 assert.equal(x.fences.filter(f=>STEPS.includes(f.step_key)).length,0);
});

test('WP3-CHAIN07 canonical source drift, D1 corruption and revoked owner fail closed',async()=>{
 const moved=await fixture('catches');
 moved.moveSource();
 await assert.rejects(chain(moved));
 const altered=await fixture('gear');
 altered.record.snapshot_sha256='f'.repeat(64);
 await assert.rejects(chain(altered));
 const deniedOwner=await fixture('gear');
 deniedOwner.denyOwner();
 await assert.rejects(chain(deniedOwner));
 const disabled=await fixture('kb');
 disabled.disable();
 await assert.rejects(chain(disabled));
 for(const x of [moved,altered,deniedOwner,disabled])
  assert.equal(x.counts.d1Writes,0);
});

test('WP3-CHAIN08 no provider mutation or Live even after all five correct proofs',async()=>{
 const x=await fixture('catches'),a=await chain(x);
 for(let i=0;i<STEPS.length;i++){a.addFence(i);a.addProof(i);}
 const result=await state(x);
 assert.equal(result.state,'VerifiedPr');
 assert.equal(result.requiresGuardedMerge,true);
 assert.equal(result.requiresHostedReleaseProof,true);
 assert.equal(result.isLive,false);
 assert.equal(result.canPublish,false);
 assert.equal(result.canMerge,false);
 assert.equal(x.counts.d1Writes,0);
 await denied(x.lifecycle.reconcile(x.authRequest,ID),'NOTHING_TO_RECONCILE');
 assert.equal(x.counts.mutations,0);
});
