import test from 'node:test';
import assert from 'node:assert/strict';
import {D6_PUBLISH_REPOSITORY,D6_PUBLISH_INTAKE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {describeD6AtomicTreeStep}
 from '../../experiments/p3/preview/src/d6-production-atomic-tree-step.mjs';
import {describeD6PublishBranchStep}
 from '../../experiments/p3/preview/src/d6-production-publish-branch-coordinator.mjs';
import {createD6ProductionPublishCommitCoordinator,
 D6PublishCommitError,D6_PUBLISH_COMMIT_PROOF_SQL,
 describeD6PublishCommitStep}
 from '../../experiments/p3/preview/src/d6-production-publish-commit-coordinator.mjs';

const REPO=D6_PUBLISH_REPOSITORY,ORIGIN=D6_PUBLISH_INTAKE_ORIGIN;
const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),BASE='b'.repeat(40),TREE='c'.repeat(40);
const COMMIT='d'.repeat(40),SNAP='9'.repeat(64);
const INDEX='2'.repeat(40),NOTE='3'.repeat(40),IMAGE='4'.repeat(40);
const API='https://api.github.com/repos/ginosega/fishing';
const BRANCH='refs/heads/fish-v3/publish/'+ID;
const MESSAGE='Fishing Companion V3 content update '+ID;
const NOW=1800000004;
const request=()=>new Request(ORIGIN+'/api/v3/operations',{method:'POST',
 headers:{Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'publish','X-Fish-V3-CSRF':'test-only',
  'Content-Type':'application/json'},body:'{}'});
const response=(value,status=200)=>new Response(JSON.stringify(value),{
 status,headers:{'Content-Type':'application/json'},
});
const remote=()=>({sha:COMMIT,message:MESSAGE,
 tree:{sha:TREE},parents:[{sha:MAIN}]});
function operation(domain='catches'){return {
 operationId:ID,state:'Accepted',ownerGitHubId:REPO.ownerGitHubId,
 repositoryId:REPO.id,ref:REPO.ref,sourceRevision:MAIN,
 snapshotSha256:SNAP,domain,operation:'add',recordId:'catch-example',
};}
function atomicPlan(domain='catches'){
 const root=domain==='gear'?'Gear':domain==='kb'?'KB':'Catches';
 const index=root+'/'+(domain==='gear'?'gear':domain==='kb'?'kb':'catches')+'.json';
 const narrative=root+'/content/catch-example.md';
 const asset=root+'/assets/catch-example/notes/image.png';
 return {operationId:ID,repositoryId:REPO.id,ref:REPO.ref,
  sourceRevision:MAIN,baseTreeSha:BASE,domain,recordId:'catch-example',
  entries:[
   {path:index,mode:'100644',type:'blob',sha:INDEX},
   {path:narrative,mode:'100644',type:'blob',sha:NOTE},
   {path:asset,mode:'100644',type:'blob',sha:IMAGE},
  ],verifiedText:[{path:index,sha:INDEX,bytes:72},
   {path:narrative,sha:NOTE,bytes:41}],
  fileCount:3,textCount:2,mediaCount:1,atomicTreeReady:true,
  sourceOnly:true,canSubmitTree:false,canPublish:false,isLive:false,
  requiresDurableGitStepFence:true,requiresIndependentTreeReadback:true,
  requiresSourceConflictRecheck:true,
 };
}
function memoryD1({lostFenceAck=false,lostProofAck=false,unavailable=false}={}){
 const fences=[],treeProofs=[],branchProofs=[],commitProofs=[];
 const stats={reads:0,writes:0};
 let loseFence=lostFenceAck,loseProof=lostProofAck;
 const DB={prepare(sql){
  if(unavailable)throw Error('D1 unavailable');
  return {bind(...args){return {
   async first(){
    stats.reads++;
    if(sql.includes('FROM d6_provider_step_fences'))
     return fences.find(r=>r.operation_id===args[0]&&r.step_key===args[1])??null;
    if(sql.includes('FROM d6_atomic_tree_verified'))
     return treeProofs.find(r=>r.operation_id===args[0])??null;
    if(sql.includes('FROM d6_publish_branch_verified'))
     return branchProofs.find(r=>r.operation_id===args[0])??null;
    assert(sql.includes('FROM d6_publish_commit_verified'));
    return commitProofs.find(r=>r.operation_id===args[0])??null;
   },
   async run(){
    stats.writes++;
    if(sql.includes('INSERT OR IGNORE INTO d6_provider_step_fences')){
     const [id,key,owner,repositoryId,requestSha256,at]=args;
     const previous=fences.find(r=>r.operation_id===id&&r.step_key===key);
     if(!previous)fences.push({operation_id:id,step_key:key,
      owner_github_id:owner,repository_id:repositoryId,
      request_sha256:requestSha256,state:'Unknown',created_at:at});
     if(loseFence){loseFence=false;throw Error('D1 fence ack lost');}
     return {meta:{changes:previous?0:1}};
    }
    assert(sql.includes('INSERT OR IGNORE INTO d6_publish_commit_verified'));
    const [id,owner,repositoryId,treeRequestSha256,branchRequestSha256,
     requestSha256,sourceRevision,resultTreeSha,resultCommitSha,refName,at]=args;
    const previous=commitProofs.find(r=>r.operation_id===id);
    if(!previous)commitProofs.push({
     operation_id:id,owner_github_id:owner,repository_id:repositoryId,
     tree_request_sha256:treeRequestSha256,
     branch_request_sha256:branchRequestSha256,
     request_sha256:requestSha256,source_revision:sourceRevision,
     result_tree_sha:resultTreeSha,result_commit_sha:resultCommitSha,
     ref_name:refName,state:'VerifiedCommit',verified_at:at});
    if(loseProof){loseProof=false;throw Error('D1 commit ack lost');}
    return {meta:{changes:previous?0:1}};
   },
  };}};}};
 return {DB,fences,treeProofs,branchProofs,commitProofs,stats};
}
async function setup({db=memoryD1(),domain='catches',enabled=true,
 owner=true,prerequisite='ok',tokenScope='ok',
 hint=true,gitCommit=remote(),networkError=false,
 custodyLostAck=false,createdReply=remote(),createdStatus=201}={}){
 const op=operation(domain),p=atomicPlan(domain);
 const stored={operation:op,package:{
  domain,operation:'add',id:'catch-example',
  base:{sourceRevision:MAIN}},mediaTickets:[{synthetic:true}]};
 const treeAction=await describeD6AtomicTreeStep({operation:op,plan:p});
 const tProof={operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,request_sha256:treeAction.requestSha256,
  source_revision:MAIN,base_tree_sha:BASE,result_tree_sha:TREE,
  changed_paths:3,state:'VerifiedTree',verified_at:1800000001};
 const branchAction=await describeD6PublishBranchStep({
  operation:op,treeAction,treeProof:tProof});
 const bProof={operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,tree_request_sha256:treeAction.requestSha256,
  request_sha256:branchAction.requestSha256,source_revision:MAIN,
  base_tree_sha:BASE,result_tree_sha:TREE,
  ref_name:BRANCH,state:'VerifiedBranch',verified_at:1800000003};
 const action=await describeD6PublishCommitStep({
  operation:op,treeAction,treeProof:tProof,
  branchAction,branchProof:bProof});
 db.fences.push({operation_id:ID,step_key:'tree',
  owner_github_id:REPO.ownerGitHubId,repository_id:REPO.id,
  request_sha256:treeAction.requestSha256,
  state:'Unknown',created_at:1800000000});
 db.fences.push({operation_id:ID,step_key:'branch',
  owner_github_id:REPO.ownerGitHubId,repository_id:REPO.id,
  request_sha256:branchAction.requestSha256,
  state:'Unknown',created_at:1800000002});
 db.treeProofs.push(tProof);db.branchProofs.push(bProof);
 const state={enabled,owner,prerequisite,tokenScope,hint,
  gitCommit,networkError,custodyLostAck,createdReply,createdStatus,
  candidate:null,auth:0,loads:0,plans:0,prechecks:0,
  readTokens:0,writeTokens:0,requests:[]};
 const coordinator=createD6ProductionPublishCommitCoordinator({
  DB:db.DB,enabled:()=>state.enabled,now:()=>NOW,
  session:{authorizeWrite:async r=>{
   state.auth++;
   assert.equal(r.method,'POST');
   assert.equal(r.headers.get('X-Fish-V3-Intent'),'publish');
   if(!state.owner)throw Error('owner denied');
   return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
  }},
  loadAcceptedOperation:async()=>{
   state.loads++;return stored;
  },
  atomicPlanner:{plan:async args=>{
   state.plans++;assert.equal(args.operation,op);
   assert.equal(args.package,stored.package);
   assert.equal(args.mediaTickets,stored.mediaTickets);
   return p;
  }},
  verifyPrerequisite:async args=>{
   state.prechecks++;
   assert.equal(args.commitRequestSha256,action.requestSha256);
   if(state.prerequisite==='none'||
    state.prerequisite==='first-only'&&state.prechecks>1)
    return {verified:false};
   return {...args,verified:true};
  },
  issueWriteToken:async args=>{
   state.writeTokens++;assert.deepEqual(args,{
    repositoryId:REPO.id,permissions:{contents:'write'}});
   return state.tokenScope==='ok'?{
    repositoryId:REPO.id,permissions:{contents:'write'},
    token:'TEST-ONLY-COMMIT-WRITE-CREDENTIAL'}:{
    repositoryId:REPO.id,permissions:{contents:'read'},token:'bad'};
  },
  issueReadToken:async args=>{
   state.readTokens++;assert.deepEqual(args,{
    repositoryId:REPO.id,permissions:{contents:'read'}});
   return state.tokenScope==='ok'?{
    repositoryId:REPO.id,permissions:{contents:'read'},
    token:'TEST-ONLY-COMMIT-READ-CREDENTIAL'}:{
    repositoryId:REPO.id,permissions:{contents:'write'},token:'bad'};
  },
  storeCandidateCommitHint:async args=>{
   if(!state.hint)throw Error('D1 commit candidate unavailable');
   state.candidate={...args,provenance:'server-provider-result'};
   if(state.custodyLostAck){
    state.custodyLostAck=false;
    throw Error('D1 response lost after durable insert');
   }
   return state.candidate;
  },
  loadCandidateCommitHint:async()=>state.candidate,
  request:async(url,options)=>{
   state.requests.push({url,options,
    fencePresent:db.fences.some(r=>r.step_key==='commit')});
   if(state.networkError)throw Error('provider timeout');
   if(options.method==='POST')
    return response(state.createdReply,state.createdStatus);
   return response(state.gitCommit??{message:'not found'},
    state.gitCommit?200:404);
  },
 });
 return {coordinator,db,stored,state,treeAction,branchAction,action};
}
const denied=(promise,code)=>assert.rejects(promise,e=>
 e instanceof D6PublishCommitError&&e.code===code);

test('WP3-COMMIT01 verified tree+branch fence single commit and independent GET proof',async()=>{
 const x=await setup();
 const first=await x.coordinator.attempt(request(),ID);
 assert.equal(first.state,'Unknown');
 assert.equal(first.attemptedNow,true);
 assert.equal(first.isLive,false);assert.equal(first.canPublish,false);
 assert.equal(x.state.requests.length,1);
 assert.equal(x.state.requests[0].fencePresent,true);
 assert.equal(x.state.requests[0].url,API+'/git/commits');
 assert.equal(x.state.requests[0].options.method,'POST');
 assert.equal(x.state.requests[0].options.redirect,'manual');
 assert.equal(x.state.requests[0].options.credentials,'omit');
 assert.deepEqual(JSON.parse(x.state.requests[0].options.body),{
  message:MESSAGE,tree:TREE,parents:[MAIN]});
 const result=await x.coordinator.reconcile(request(),ID);
 assert.equal(result.state,'VerifiedCommit');
 assert.equal(result.resultCommitSha,COMMIT);
 assert.equal(result.resultTreeSha,TREE);
 assert.equal(result.requiresGuardedBranchAdvance,true);
 assert.equal(result.canPublish,false);
 assert.equal(x.db.commitProofs.length,1);
 assert.equal(x.db.fences.find(r=>r.step_key==='commit').state,'Unknown');
 assert.equal(x.state.requests[1].url,API+'/git/commits/'+COMMIT);
 assert.equal(x.state.requests[1].options.method,'GET');
 assert.match(D6_PUBLISH_COMMIT_PROOF_SQL,/CHECK\(state='VerifiedCommit'\)/);
});
test('WP3-COMMIT02 disabled and denied owner never read trusted source or D1',async()=>{
 const disabled=await setup({enabled:false});
 await denied(disabled.coordinator.attempt(request(),ID),'DISABLED');
 assert.equal(disabled.state.auth,0);
 assert.equal(disabled.db.stats.reads,0);
 const deniedOwner=await setup({owner:false});
 await denied(deniedOwner.coordinator.attempt(request(),ID),'OWNER_DENIED');
 assert.equal(deniedOwner.state.loads,0);
 assert.equal(deniedOwner.db.stats.reads,0);
});
test('WP3-COMMIT03 missing or forged verified tree/branch never POST',async()=>{
 for(const corrupt of [
  x=>x.db.treeProofs.length=0,
  x=>x.db.branchProofs[0].result_tree_sha='f'.repeat(40),
  x=>x.db.fences[0].request_sha256='f'.repeat(64),
  x=>x.db.fences[1].state='VerifiedBranch',
 ]){
  const x=await setup();corrupt(x);
  await assert.rejects(x.coordinator.attempt(request(),ID));
  assert.equal(x.state.requests.length,0);
  assert.equal(x.db.fences.filter(v=>v.step_key==='commit').length,0);
 }
});
test('WP3-COMMIT04 concurrent and repeated requests use one sticky commit fence',async()=>{
 const x=await setup();
 const both=await Promise.all([
  x.coordinator.attempt(request(),ID),x.coordinator.attempt(request(),ID),
 ]);
 assert.deepEqual(both.map(r=>r.state),['Unknown','Unknown']);
 assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
 assert.equal((await x.coordinator.attempt(request(),ID)).attemptedNow,false);
 assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
});
test('WP3-COMMIT05 lost D1 fence ack forbids any POST or replay',async()=>{
 const x=await setup({db:memoryD1({lostFenceAck:true})});
 await denied(x.coordinator.attempt(request(),ID),'STORE_UNAVAILABLE');
 assert.equal(x.db.fences.filter(r=>r.step_key==='commit').length,1);
 assert.equal(x.state.requests.length,0);
 assert.equal((await x.coordinator.attempt(request(),ID)).state,'Unknown');
 assert.equal(x.state.requests.length,0);
});
test('WP3-COMMIT06 lost provider ack with no stored SHA stays Unknown; no blind POST',async()=>{
 const x=await setup({networkError:true});
 assert.equal((await x.coordinator.attempt(request(),ID)).state,'Unknown');
 assert.equal(x.state.requests.length,1);
 x.state.networkError=false;
 await denied(x.coordinator.reconcile(request(),ID),'COMMIT_SHA_UNKNOWN');
 assert.equal((await x.coordinator.attempt(request(),ID)).attemptedNow,false);
 assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
});
test('WP3-COMMIT07 absent server-custodied SHA stays Unknown without GET',async()=>{
 const x=await setup({hint:false});
 await x.coordinator.attempt(request(),ID);
 await denied(x.coordinator.reconcile(request(),ID),'COMMIT_SHA_UNKNOWN');
 assert.equal(x.db.commitProofs.length,0);
 assert.equal(x.state.requests.filter(r=>r.options.method==='GET').length,0);
 assert.equal((await x.coordinator.attempt(request(),ID)).attemptedNow,false);
 assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
});
test('WP3-COMMIT08 forged commit SHA, parent, tree and message reject proof',async()=>{
 for(const changed of [
  {...remote(),sha:'f'.repeat(40)},
  {...remote(),tree:{sha:'f'.repeat(40)}},
  {...remote(),parents:[{sha:TREE}]},
  {...remote(),parents:[{sha:MAIN},{sha:TREE}]},
  {...remote(),message:'other publication'},
  null,
 ]){
  const x=await setup({gitCommit:changed});
  await x.coordinator.attempt(request(),ID);
  await assert.rejects(x.coordinator.reconcile(request(),ID));
  assert.equal(x.db.commitProofs.length,0);
  assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
 }
});
test('WP3-COMMIT09 main/branch drift before or after token blocks POST',async()=>{
 const a=await setup({prerequisite:'none'});
 await denied(a.coordinator.attempt(request(),ID),'SOURCE_OR_BRANCH_MOVED');
 assert.equal(a.db.fences.filter(r=>r.step_key==='commit').length,0);
 const b=await setup({prerequisite:'first-only'});
 await denied(b.coordinator.attempt(request(),ID),'SOURCE_OR_BRANCH_MOVED');
 assert.equal(b.db.fences.filter(r=>r.step_key==='commit').length,1);
 assert.equal(b.state.requests.length,0);
});
test('WP3-COMMIT10 bad token scope and corrupt durable receipt never prove commit',async()=>{
 const x=await setup({tokenScope:'bad'});
 assert.equal((await x.coordinator.attempt(request(),ID)).state,'Unknown');
 assert.equal(x.state.requests.length,0);
 await denied(x.coordinator.reconcile(request(),ID),'COMMIT_SHA_UNKNOWN');
 const good=await setup();
 await good.coordinator.attempt(request(),ID);
 await good.coordinator.reconcile(request(),ID);
 good.db.commitProofs[0].tree_request_sha256='f'.repeat(64);
 await denied(good.coordinator.reconcile(request(),ID),'COMMIT_PROOF_MISMATCH');
 assert.equal(good.state.requests.filter(r=>r.options.method==='POST').length,1);
});
test('WP3-COMMIT11 lost D1 proof ack is resolved only by readback',async()=>{
 const x=await setup({db:memoryD1({lostProofAck:true})});
 await x.coordinator.attempt(request(),ID);
 await denied(x.coordinator.reconcile(request(),ID),'STORE_UNAVAILABLE');
 assert.equal(x.db.commitProofs.length,1);
 const receipt=await x.coordinator.reconcile(request(),ID);
 assert.equal(receipt.verifiedCommit,true);
 assert.equal(x.db.commitProofs.length,1);
 assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
});
test('WP3-COMMIT12 Gear and KB use the same immutable three-domain gate',async()=>{
 for(const domain of ['gear','kb']){
  const x=await setup({domain});
  const result=await x.coordinator.attempt(request(),ID);
  assert.equal(result.state,'Unknown');
  assert.equal((await x.coordinator.reconcile(request(),ID)).verifiedCommit,true);
  assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
 }
});

test('WP3-COMMIT13 invalid provider 201/202 cannot produce commit candidate',async()=>{
 for(const variant of [
  {createdReply:{sha:COMMIT},createdStatus:201},
  {createdReply:{...remote(),message:'untrusted'},createdStatus:201},
  {createdReply:remote(),createdStatus:202},
  {createdReply:{...remote(),tree:{sha:MAIN}},createdStatus:201},
 ]){
  const x=await setup(variant);
  const status=await x.coordinator.attempt(request(),ID);
  assert.equal(status.state,'Unknown');
  assert.equal(x.state.candidate,null);
  await denied(x.coordinator.reconcile(request(),ID),'COMMIT_SHA_UNKNOWN');
  assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
 }
});
test('WP3-COMMIT14 lost candidate D1 insert ack recovers through custody + independent GET',async()=>{
 const x=await setup({custodyLostAck:true});
 assert.equal((await x.coordinator.attempt(request(),ID)).state,'Unknown');
 assert.equal(x.state.candidate.resultCommitSha,COMMIT);
 assert.equal((await x.coordinator.reconcile(request(),ID)).verifiedCommit,true);
 assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
});
