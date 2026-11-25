import test from 'node:test';
import assert from 'node:assert/strict';
import {D6_PUBLISH_REPOSITORY,D6_PUBLISH_INTAKE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {describeD6AtomicTreeStep}
 from '../../experiments/p3/preview/src/d6-production-atomic-tree-step.mjs';
import {describeD6PublishBranchStep}
 from '../../experiments/p3/preview/src/d6-production-publish-branch-coordinator.mjs';
import {describeD6PublishCommitStep}
 from '../../experiments/p3/preview/src/d6-production-publish-commit-coordinator.mjs';
import {createD6ProductionPublishAdvanceCoordinator,
 describeD6PublishAdvanceStep,D6PublishAdvanceError,
 D6_PUBLISH_ADVANCE_PROOF_SQL}
 from '../../experiments/p3/preview/src/d6-production-publish-advance-coordinator.mjs';

const REPO=D6_PUBLISH_REPOSITORY,ORIGIN=D6_PUBLISH_INTAKE_ORIGIN;
const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),BASE='b'.repeat(40),TREE='c'.repeat(40);
const COMMIT='d'.repeat(40),SNAP='9'.repeat(64);
const INDEX='2'.repeat(40),NOTE='3'.repeat(40),IMAGE='4'.repeat(40);
const API='https://api.github.com/repos/ginosega/fishing';
const BRANCH='refs/heads/fish-v3/publish/'+ID;
const MESSAGE='Fishing Companion V3 content update '+ID;
const NOW=1800000008;
const auth=()=>new Request(ORIGIN+'/api/v3/operations',{method:'POST',
 headers:{Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
 'X-Fish-V3-Intent':'publish','X-Fish-V3-CSRF':'test-only',
 'Content-Type':'application/json'},body:'{}'});
const response=(body,status=200)=>new Response(JSON.stringify(body),{
 status,headers:{'Content-Type':'application/json'}});
const ref=(sha=COMMIT)=>({ref:BRANCH,object:{type:'commit',sha}});
const mainRef=(sha=MAIN)=>({ref:REPO.ref,object:{type:'commit',sha}});
const commit=()=>({sha:COMMIT,message:MESSAGE,tree:{sha:TREE},
 parents:[{sha:MAIN}]});
function op(domain='catches'){return {
 operationId:ID,state:'Accepted',ownerGitHubId:REPO.ownerGitHubId,
 repositoryId:REPO.id,ref:REPO.ref,sourceRevision:MAIN,
 snapshotSha256:SNAP,domain,operation:'add',recordId:'catch-example',
};}
function plan(domain='catches'){
 const root=domain==='gear'?'Gear':domain==='kb'?'KB':'Catches';
 const index=root+'/'+(domain==='gear'?'gear':domain==='kb'?'kb':'catches')+'.json';
 const narrative=root+'/content/catch-example.md';
 const media=root+'/assets/catch-example/notes/image.png';
 return {operationId:ID,repositoryId:REPO.id,ref:REPO.ref,
  sourceRevision:MAIN,baseTreeSha:BASE,domain,recordId:'catch-example',
  entries:[
   {path:index,mode:'100644',type:'blob',sha:INDEX},
   {path:narrative,mode:'100644',type:'blob',sha:NOTE},
   {path:media,mode:'100644',type:'blob',sha:IMAGE},
  ],verifiedText:[{path:index,sha:INDEX,bytes:80},
   {path:narrative,sha:NOTE,bytes:40}],
  fileCount:3,textCount:2,mediaCount:1,atomicTreeReady:true,
  sourceOnly:true,canSubmitTree:false,canPublish:false,isLive:false,
  requiresDurableGitStepFence:true,
  requiresIndependentTreeReadback:true,
  requiresSourceConflictRecheck:true,
 };
}
function memoryD1({lostFenceAck=false,lostProofAck=false,unavailable=false}={}){
 const fences=[],treeProofs=[],branchProofs=[],commitProofs=[],advanceProofs=[];
 const stats={reads:0,writes:0};
 let loseFence=lostFenceAck,loseProof=lostProofAck;
 const DB={prepare(sql){
  if(unavailable)throw Error('D1 offline');
  return {bind(...args){return {
   async first(){
    stats.reads++;
    if(sql.includes('FROM d6_provider_step_fences'))
     return fences.find(x=>x.operation_id===args[0]&&x.step_key===args[1])??null;
    if(sql.includes('FROM d6_atomic_tree_verified'))
     return treeProofs.find(x=>x.operation_id===args[0])??null;
    if(sql.includes('FROM d6_publish_branch_verified'))
     return branchProofs.find(x=>x.operation_id===args[0])??null;
    if(sql.includes('FROM d6_publish_commit_verified'))
     return commitProofs.find(x=>x.operation_id===args[0])??null;
    assert(sql.includes('FROM d6_publish_advance_verified'));
    return advanceProofs.find(x=>x.operation_id===args[0])??null;
   },
   async run(){
    stats.writes++;
    if(sql.includes('INSERT OR IGNORE INTO d6_provider_step_fences')){
     const [id,key,owner,repo,digest,at]=args;
     const existing=fences.find(x=>x.operation_id===id&&x.step_key===key);
     if(!existing)fences.push({operation_id:id,step_key:key,
      owner_github_id:owner,repository_id:repo,
      request_sha256:digest,state:'Unknown',created_at:at});
     if(loseFence){loseFence=false;throw Error('D1 fence ack lost');}
     return {meta:{changes:existing?0:1}};
    }
    assert(sql.includes('INSERT OR IGNORE INTO d6_publish_advance_verified'));
    const [id,owner,repo,treeRequestSha256,branchRequestSha256,
     commitRequestSha256,requestSha256,sourceRevision,
     resultTreeSha,resultCommitSha,refName,at]=args;
    const existing=advanceProofs.find(x=>x.operation_id===id);
    if(!existing)advanceProofs.push({
     operation_id:id,owner_github_id:owner,repository_id:repo,
     tree_request_sha256:treeRequestSha256,
     branch_request_sha256:branchRequestSha256,
     commit_request_sha256:commitRequestSha256,
     request_sha256:requestSha256,
     source_revision:sourceRevision,result_tree_sha:resultTreeSha,
     result_commit_sha:resultCommitSha,ref_name:refName,
     state:'VerifiedAdvance',verified_at:at,
    });
    if(loseProof){loseProof=false;throw Error('D1 proof ack lost');}
    return {meta:{changes:existing?0:1}};
   },
  };}};}};
 return {DB,fences,treeProofs,branchProofs,commitProofs,advanceProofs,stats};
}
async function setup({domain='catches',db=memoryD1(),enabled=true,
 owner=true,precondition='ok',tokenScope='ok',
 remoteRef=ref(),remoteCommit=commit(),remoteMain=mainRef(),
 networkError=false,revokeOnToken=false}={}){
 const operation=op(domain),packageValue={domain,operation:'add',
  id:'catch-example',base:{sourceRevision:MAIN}};
 const stored={operation,package:packageValue,mediaTickets:[{synthetic:true}]};
 const atomic=plan(domain);
 const tAction=await describeD6AtomicTreeStep({operation,plan:atomic});
 const tProof={operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,request_sha256:tAction.requestSha256,
  source_revision:MAIN,base_tree_sha:BASE,result_tree_sha:TREE,
  changed_paths:3,state:'VerifiedTree',verified_at:1800000001};
 const bAction=await describeD6PublishBranchStep({
  operation,treeAction:tAction,treeProof:tProof});
 const bProof={operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,tree_request_sha256:tAction.requestSha256,
  request_sha256:bAction.requestSha256,source_revision:MAIN,
  base_tree_sha:BASE,result_tree_sha:TREE,ref_name:BRANCH,
  state:'VerifiedBranch',verified_at:1800000003};
 const cAction=await describeD6PublishCommitStep({
  operation,treeAction:tAction,treeProof:tProof,
  branchAction:bAction,branchProof:bProof});
 const cProof={operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,tree_request_sha256:tAction.requestSha256,
  branch_request_sha256:bAction.requestSha256,
  request_sha256:cAction.requestSha256,source_revision:MAIN,
  result_tree_sha:TREE,result_commit_sha:COMMIT,ref_name:BRANCH,
  state:'VerifiedCommit',verified_at:1800000005};
 const action=await describeD6PublishAdvanceStep({
  operation,treeAction:tAction,branchAction:bAction,
  commitAction:cAction,commitReceipt:cProof});
 for(const [key,sha,at] of [
  ['tree',tAction.requestSha256,1800000000],
  ['branch',bAction.requestSha256,1800000002],
  ['commit',cAction.requestSha256,1800000004],
 ]){
  db.fences.push({operation_id:ID,step_key:key,
   owner_github_id:REPO.ownerGitHubId,repository_id:REPO.id,
   request_sha256:sha,state:'Unknown',created_at:at});
 }
 db.treeProofs.push(tProof);db.branchProofs.push(bProof);
 db.commitProofs.push(cProof);
 const state={enabled,owner,precondition,tokenScope,networkError,
  revokeOnToken,remoteRef,remoteCommit,remoteMain,
  auth:0,loads:0,plans:0,checks:0,writeTokens:0,readTokens:0,
  requests:[]};
 const coord=createD6ProductionPublishAdvanceCoordinator({
  DB:db.DB,enabled:()=>state.enabled,now:()=>NOW,
  session:{authorizeWrite:async req=>{
   state.auth++;assert.equal(req.method,'POST');
   assert.equal(req.headers.get('X-Fish-V3-Intent'),'publish');
   if(!state.owner)throw Error('owner not authorized');
   return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
  }},
  loadAcceptedOperation:async()=>{
   state.loads++;return stored;
  },
  atomicPlanner:{plan:async args=>{
   state.plans++;assert.equal(args.operation,stored.operation);
   assert.equal(args.package,stored.package);
   assert.equal(args.mediaTickets,stored.mediaTickets);
   return atomic;
  }},
  verifyPrerequisite:async args=>{
   state.checks++;
   if(state.precondition==='never'||
    state.precondition==='first-only'&&state.checks>1)
    return {verified:false};
   return {...args,verified:true};
  },
  issueWriteToken:async args=>{
   state.writeTokens++;assert.deepEqual(args,{
    repositoryId:REPO.id,permissions:{contents:'write'}});
   if(state.revokeOnToken)state.enabled=false;
   return state.tokenScope==='ok'?{
    repositoryId:REPO.id,permissions:{contents:'write'},
    token:'TEST-ONLY-ADVANCE-WRITE-CREDENTIAL'}:{
    repositoryId:REPO.id,permissions:{contents:'read'},token:'bad'};
  },
  issueReadToken:async args=>{
   state.readTokens++;assert.deepEqual(args,{
    repositoryId:REPO.id,permissions:{contents:'read'}});
   return state.tokenScope==='ok'?{
    repositoryId:REPO.id,permissions:{contents:'read'},
    token:'TEST-ONLY-ADVANCE-READ-CREDENTIAL'}:{
    repositoryId:REPO.id,permissions:{contents:'write'},token:'bad'};
  },
  request:async(url,options)=>{
   state.requests.push({url,options,
    fenced:db.fences.some(x=>x.step_key==='advance')});
   if(state.networkError)throw Error('transport loss');
   if(options.method==='PATCH')return response(ref(),200);
   if(url===API+'/git/ref/heads/main')return response(state.remoteMain);
   if(options.method==='GET'&&
    url===API+'/git/ref/heads/fish-v3/publish/'+ID)
    return response(state.remoteRef??{message:'missing'},
     state.remoteRef?200:404);
   if(url===API+'/git/commits/'+COMMIT)
    return response(state.remoteCommit??{message:'missing'},
     state.remoteCommit?200:404);
   throw Error('Unexpected provider path');
  },
 });
 return {coord,db,state,stored,action};
}
const denied=(p,code)=>assert.rejects(p,e=>
 e instanceof D6PublishAdvanceError&&e.code===code);

test('WP3-ADV01 exact confirmed tree, branch and commit allow only guarded PATCH and later non-Live proof',async()=>{
 const x=await setup();
 const pending=await x.coord.attempt(auth(),ID);
 assert.equal(pending.state,'Unknown');
 assert.equal(pending.attemptedNow,true);
 assert.equal(pending.canPublish,false);
 assert.equal(x.db.fences.filter(f=>f.step_key==='advance').length,1);
 assert.equal(x.state.requests.length,1);
 assert.equal(x.state.requests[0].fenced,true);
 assert.equal(x.state.requests[0].options.method,'PATCH');
 assert.equal(x.state.requests[0].url,API+'/git/refs/heads/fish-v3/publish/'+ID);
 assert.deepEqual(JSON.parse(x.state.requests[0].options.body),
  {sha:COMMIT,force:false});
 const proof=await x.coord.reconcile(auth(),ID);
 assert.equal(proof.state,'VerifiedAdvance');
 assert.equal(proof.verifiedAdvance,true);
 assert.equal(proof.resultCommitSha,COMMIT);
 assert.equal(proof.isLive,false);
 assert.equal(proof.canCreatePr,false);
 assert.equal(x.db.advanceProofs.length,1);
 assert.equal(x.state.requests.filter(r=>r.options.method==='PATCH').length,1);
 assert.deepEqual(x.state.requests.filter(r=>r.options.method==='GET')
  .map(r=>r.url),[
   API+'/git/ref/heads/main',
   API+'/git/ref/heads/fish-v3/publish/'+ID,
   API+'/git/commits/'+COMMIT,
   API+'/git/ref/heads/main',
  ]);
 assert.match(D6_PUBLISH_ADVANCE_PROOF_SQL,
  /CHECK\(state='VerifiedAdvance'\)/);
});
test('WP3-ADV02 disabled, denied owner and untrusted operation touch no D1/provider',async()=>{
 const off=await setup({enabled:false});
 await denied(off.coord.attempt(auth(),ID),'DISABLED');
 assert.equal(off.state.auth,0);assert.equal(off.db.stats.reads,0);
 const notOwner=await setup({owner:false});
 await denied(notOwner.coord.attempt(auth(),ID),'OWNER_DENIED');
 assert.equal(notOwner.state.loads,0);
 const untrusted=await setup();
 untrusted.stored.operation.repositoryId=9;
 await denied(untrusted.coord.attempt(auth(),ID),'UNTRUSTED_OPERATION');
 assert.equal(untrusted.state.requests.length,0);
});
test('WP3-ADV03 missing or mismatched upstream proof prevents all writes',async()=>{
 const alterations=[
  x=>x.db.treeProofs.length=0,
  x=>x.db.branchProofs[0].result_tree_sha='f'.repeat(40),
  x=>x.db.commitProofs[0].result_commit_sha='not-a-sha',
  x=>x.db.fences[2].request_sha256='f'.repeat(64),
 ];
 for(const mutate of alterations){
  const x=await setup();mutate(x);
  await assert.rejects(x.coord.attempt(auth(),ID));
  assert.equal(x.state.requests.length,0);
  assert.equal(x.db.fences.filter(v=>v.step_key==='advance').length,0);
 }
});
test('WP3-ADV04 concurrent submissions or repeats cannot advance twice',async()=>{
 const x=await setup();
 const results=await Promise.all([x.coord.attempt(auth(),ID),
  x.coord.attempt(auth(),ID)]);
 assert.deepEqual(results.map(r=>r.state),['Unknown','Unknown']);
 assert.equal(x.state.requests.filter(r=>r.options.method==='PATCH').length,1);
 assert.equal((await x.coord.attempt(auth(),ID)).attemptedNow,false);
 assert.equal(x.state.requests.filter(r=>r.options.method==='PATCH').length,1);
});
test('WP3-ADV05 lost D1 write acknowledgment prevents PATCH and retries',async()=>{
 const x=await setup({db:memoryD1({lostFenceAck:true})});
 await denied(x.coord.attempt(auth(),ID),'STORE_UNAVAILABLE');
 assert.equal(x.db.fences.filter(f=>f.step_key==='advance').length,1);
 assert.equal(x.state.requests.length,0);
 assert.equal((await x.coord.attempt(auth(),ID)).attemptedNow,false);
 assert.equal(x.state.requests.length,0);
});
test('WP3-ADV06 lost HTTP response stays Unknown, independent ref can prove result',async()=>{
 const x=await setup({networkError:true});
 assert.equal((await x.coord.attempt(auth(),ID)).state,'Unknown');
 x.state.networkError=false;
 const proof=await x.coord.reconcile(auth(),ID);
 assert.equal(proof.verifiedAdvance,true);
 assert.equal((await x.coord.attempt(auth(),ID)).attemptedNow,false);
 assert.equal(x.state.requests.filter(r=>r.options.method==='PATCH').length,1);
});
test('WP3-ADV07 foreign, absent or wrong-type remote branch never verifies',async()=>{
 for(const remoteRef of [
  ref(MAIN),null,{...ref(),ref:'refs/heads/main'},
  {ref:BRANCH,object:{type:'tree',sha:COMMIT}},
 ]){
  const x=await setup({remoteRef});
  await x.coord.attempt(auth(),ID);
  await assert.rejects(x.coord.reconcile(auth(),ID));
  assert.equal(x.db.advanceProofs.length,0);
  assert.equal(x.state.requests.filter(r=>r.options.method==='PATCH').length,1);
 }
});
test('WP3-ADV08 wrong Git commit SHA, tree or parent denies proof',async()=>{
 for(const remoteCommit of [
  {...commit(),sha:MAIN},
  {...commit(),tree:{sha:MAIN}},
  {...commit(),parents:[{sha:TREE}]},
  {...commit(),parents:[]},
  {...commit(),message:'unrelated'},
 ]){
  const x=await setup({remoteCommit});
  await x.coord.attempt(auth(),ID);
  await denied(x.coord.reconcile(auth(),ID),'COMMIT_UNVERIFIED');
  assert.equal(x.db.advanceProofs.length,0);
 }
});
test('WP3-ADV09 main or branch drift before/after minting prevents PATCH',async()=>{
 const before=await setup({precondition:'never'});
 await denied(before.coord.attempt(auth(),ID),'SOURCE_OR_BRANCH_MOVED');
 assert.equal(before.state.requests.length,0);
 const later=await setup({precondition:'first-only'});
 await denied(later.coord.attempt(auth(),ID),'SOURCE_OR_BRANCH_MOVED');
 assert.equal(later.state.requests.length,0);
 assert.equal(later.db.fences.filter(f=>f.step_key==='advance').length,1);
 const drift=await setup({remoteMain:mainRef('f'.repeat(40))});
 await drift.coord.attempt(auth(),ID);
 await denied(drift.coord.reconcile(auth(),ID),'SOURCE_MOVED');
 assert.equal(drift.db.advanceProofs.length,0);
});
test('WP3-ADV10 invalid credentials and revoked enable flag block provider',async()=>{
 const bad=await setup({tokenScope:'bad'});
 assert.equal((await bad.coord.attempt(auth(),ID)).state,'Unknown');
 assert.equal(bad.state.requests.length,0);
 await denied(bad.coord.reconcile(auth(),ID),'TOKEN_UNAVAILABLE');
 const revoked=await setup({revokeOnToken:true});
 await denied(revoked.coord.attempt(auth(),ID),'DISABLED');
 assert.equal(revoked.db.fences.filter(f=>f.step_key==='advance').length,1);
 assert.equal(revoked.state.requests.length,0);
});
test('WP3-ADV11 lost receipt acknowledgment requires independent reread',async()=>{
 const x=await setup({db:memoryD1({lostProofAck:true})});
 await x.coord.attempt(auth(),ID);
 await denied(x.coord.reconcile(auth(),ID),'STORE_UNAVAILABLE');
 assert.equal(x.db.advanceProofs.length,1);
 const proof=await x.coord.reconcile(auth(),ID);
 assert.equal(proof.verifiedAdvance,true);
 assert.equal(x.db.advanceProofs.length,1);
 assert.equal(x.state.requests.filter(r=>r.options.method==='PATCH').length,1);
 x.db.advanceProofs[0].result_commit_sha=MAIN;
 await denied(x.coord.reconcile(auth(),ID),'ADVANCE_PROOF_MISMATCH');
});
test('WP3-ADV12 shifted immutable fingerprint blocks repeat without PATCH',async()=>{
 const x=await setup();
 await x.coord.attempt(auth(),ID);
 x.db.commitProofs[0].result_commit_sha='f'.repeat(40);
 await denied(x.coord.attempt(auth(),ID),'FENCE_UNVERIFIED');
 assert.equal(x.state.requests.filter(r=>r.options.method==='PATCH').length,1);
});
test('WP3-ADV13 same guarded non-force branch advance for Gear and KB',async()=>{
 for(const domain of ['gear','kb']){
  const x=await setup({domain});
  await x.coord.attempt(auth(),ID);
  assert.equal((await x.coord.reconcile(auth(),ID)).verifiedAdvance,true);
  assert.equal(x.state.requests.filter(r=>r.options.method==='PATCH').length,1);
 }
});

test('WP3-ADV14 mutation and independent single-ref readback are disjoint',async()=>{
 const x=await setup();
 await x.coord.attempt(auth(),ID);
 const pending=x.state.requests[0];
 assert.equal(pending.options.method,'PATCH');
 assert.equal(pending.url,API+'/git/refs/heads/fish-v3/publish/'+ID);
 const verified=await x.coord.reconcile(auth(),ID);
 assert.equal(verified.verifiedAdvance,true);
 const reads=x.state.requests.filter(r=>r.options.method==='GET');
 assert.equal(reads.filter(r=>
  r.url===API+'/git/ref/heads/fish-v3/publish/'+ID).length,1);
 assert.equal(reads.some(r=>r.url===pending.url),false);
 assert.equal(x.db.advanceProofs.length,1);
 assert.equal(x.state.requests.filter(r=>r.options.method==='PATCH').length,1);
});
