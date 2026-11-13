import test from 'node:test';
import assert from 'node:assert/strict';
import {D6_PUBLISH_REPOSITORY,D6_PUBLISH_INTAKE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {describeD6AtomicTreeStep}
 from '../../experiments/p3/preview/src/d6-production-atomic-tree-step.mjs';
import {createD6ProductionPublishBranchCoordinator,
 D6PublishBranchError,D6_PUBLISH_BRANCH_PROOF_SQL}
 from '../../experiments/p3/preview/src/d6-production-publish-branch-coordinator.mjs';

const REPO=D6_PUBLISH_REPOSITORY,ORIGIN=D6_PUBLISH_INTAKE_ORIGIN;
const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),BASE='b'.repeat(40),TREE='e'.repeat(40);
const JSON_SHA='c'.repeat(40),NOTE_SHA='d'.repeat(40),MEDIA_SHA='f'.repeat(40);
const SNAP='9'.repeat(64),API='https://api.github.com/repos/ginosega/fishing';
const BRANCH='refs/heads/fish-v3/publish/'+ID,WHEN=1800000003;
const request=()=>new Request(ORIGIN+'/api/v3/operations',{method:'POST',
 headers:{Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
 'X-Fish-V3-Intent':'publish','X-Fish-V3-CSRF':'test-csrf',
 'Content-Type':'application/json'},body:'{}'});
function plan(domain='catches'){
 const json=domain==='catches'?'Catches/catches.json':
  domain==='gear'?'Gear/gear.json':'KB/kb.json';
 const note=domain==='catches'?'Catches/content/catch-example.md':
  domain==='gear'?'Gear/Lures/content/Example.md':
  'KB/Knots/content/Example.md';
 const image=domain==='catches'?'Catches/assets/catch-example/notes/photo.png':
  domain==='gear'?'Gear/Lures/assets/photo.png':
  'KB/Knots/assets/example/step-01.png';
 const entries=[{path:json,mode:'100644',type:'blob',sha:JSON_SHA},
  {path:note,mode:'100644',type:'blob',sha:NOTE_SHA},
  {path:image,mode:'100644',type:'blob',sha:MEDIA_SHA}];
 return {operationId:ID,repositoryId:REPO.id,ref:REPO.ref,
  sourceRevision:MAIN,baseTreeSha:BASE,domain,recordId:'catch-example',
  entries,verifiedText:[{path:json,sha:JSON_SHA,bytes:40},
   {path:note,sha:NOTE_SHA,bytes:30}],
  fileCount:3,textCount:2,mediaCount:1,atomicTreeReady:true,
  sourceOnly:true,canSubmitTree:false,canPublish:false,isLive:false,
  requiresDurableGitStepFence:true,requiresIndependentTreeReadback:true,
  requiresSourceConflictRecheck:true};
}
function op(domain='catches'){return {
 operationId:ID,repositoryId:REPO.id,ownerGitHubId:REPO.ownerGitHubId,
 ref:REPO.ref,state:'Accepted',sourceRevision:MAIN,snapshotSha256:SNAP,
 domain,operation:'add',recordId:'catch-example',
};}
const ref=(sha=MAIN)=>({ref:BRANCH,object:{type:'commit',sha}});
const json=(value,{status=200}={})=>new Response(JSON.stringify(value),{
 status,headers:{'Content-Type':'application/json'},
});
function memoryD1({lostFenceAck=false,lostProofAck=false,disabled=false}={}){
 const fences=[],treeProofs=[],branchProofs=[];
 const stats={reads:0,writes:0};let loseFence=lostFenceAck,loseProof=lostProofAck;
 const DB={prepare(sql){
  if(disabled)throw Error('D1 down');
  return {bind(...args){return {
   async first(){
    stats.reads++;
    if(sql.includes('FROM d6_provider_step_fences'))
     return fences.find(r=>r.operation_id===args[0]&&
      r.step_key===args[1])??null;
    if(sql.includes('FROM d6_atomic_tree_verified'))
     return treeProofs.find(r=>r.operation_id===args[0])??null;
    assert(sql.includes('FROM d6_publish_branch_verified'));
    return branchProofs.find(r=>r.operation_id===args[0])??null;
   },
   async run(){
    stats.writes++;
    if(sql.includes('INSERT OR IGNORE INTO d6_provider_step_fences')){
     const [id,key,owner,repositoryId,requestSha256,at]=args;
     const old=fences.find(r=>r.operation_id===id&&r.step_key===key);
     if(!old)fences.push({operation_id:id,step_key:key,
      owner_github_id:owner,repository_id:repositoryId,
      request_sha256:requestSha256,state:'Unknown',created_at:at});
     if(loseFence){loseFence=false;throw Error('D1 fence ack lost');}
     return {meta:{changes:old?0:1}};
    }
    assert(sql.includes('INSERT OR IGNORE INTO d6_publish_branch_verified'));
    const [id,owner,repositoryId,treeRequestSha256,
     requestSha256,sourceRevision,baseTreeSha,resultTreeSha,refName,at]=args;
    const old=branchProofs.find(r=>r.operation_id===id);
    if(!old)branchProofs.push({operation_id:id,owner_github_id:owner,
     repository_id:repositoryId,tree_request_sha256:treeRequestSha256,
     request_sha256:requestSha256,source_revision:sourceRevision,
     base_tree_sha:baseTreeSha,result_tree_sha:resultTreeSha,
     ref_name:refName,state:'VerifiedBranch',verified_at:at});
    if(loseProof){loseProof=false;throw Error('D1 proof ack lost');}
    return {meta:{changes:old?0:1}};
   },
  };}};}};
 return {DB,fences,treeProofs,branchProofs,stats};
}
async function setup({
 domain='catches',db=memoryD1(),enabled=true,owner=true,
 mainMode='ok',tokenScope='ok',remote=ref(),
 networkFail=false,
}={}){
 const state={enabled,owner,mainMode,tokenScope,remote,networkFail,
  auth:0,loads:0,plans:0,main:0,issuedWrite:0,issuedRead:0,
  requests:[]};
 const operation=op(domain),packageValue={
  domain,id:'catch-example',operation:'add',base:{sourceRevision:MAIN},
 };
 const stored={operation,package:packageValue,mediaTickets:[{mock:true}]};
 const atomic=plan(domain);
 const descriptor=await describeD6AtomicTreeStep({operation,plan:atomic});
 db.fences.push({operation_id:ID,step_key:'tree',
  owner_github_id:REPO.ownerGitHubId,repository_id:REPO.id,
  request_sha256:descriptor.requestSha256,state:'Unknown',
  created_at:1800000000});
 db.treeProofs.push({operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,request_sha256:descriptor.requestSha256,
  source_revision:MAIN,base_tree_sha:BASE,result_tree_sha:TREE,
  changed_paths:3,state:'VerifiedTree',verified_at:1800000001});
 const coordinator=createD6ProductionPublishBranchCoordinator({
  DB:db.DB,enabled:()=>state.enabled,now:()=>WHEN,
  session:{authorizeWrite:async req=>{
   state.auth++;assert.equal(req.method,'POST');
   assert.equal(req.headers.get('X-Fish-V3-Intent'),'publish');
   if(!state.owner)throw Error('not owner');
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
  verifyCurrentMain:async args=>{
   state.main++;
   if(state.mainMode==='after-first'&&state.main>1)
    return {verified:false};
   if(state.mainMode==='no')return {verified:false};
   return {verified:true,operationId:args.operationId,
    ownerGitHubId:args.ownerGitHubId,repositoryId:args.repositoryId,
    ref:args.ref,sourceRevision:args.sourceRevision,
    snapshotSha256:args.snapshotSha256,
    baseTreeSha:args.baseTreeSha,
    treeRequestSha256:args.treeRequestSha256,
    branchRequestSha256:args.branchRequestSha256};
  },
  issueWriteToken:async args=>{
   state.issuedWrite++;
   assert.deepEqual(args,{repositoryId:REPO.id,permissions:{
    contents:'write'}});
   return state.tokenScope==='ok'?{
    repositoryId:REPO.id,permissions:{contents:'write'},
    token:'TEST-ONLY-BRANCH-WRITE-CREDENTIAL'}:{
    repositoryId:REPO.id,permissions:{contents:'read'},
    token:'bad'};
  },
  issueReadToken:async args=>{
   state.issuedRead++;
   assert.deepEqual(args,{repositoryId:REPO.id,permissions:{
    contents:'read'}});
   return state.tokenScope==='ok'?{
    repositoryId:REPO.id,permissions:{contents:'read'},
    token:'TEST-ONLY-BRANCH-READ-CREDENTIAL'}:{
    repositoryId:REPO.id,permissions:{contents:'write'},
    token:'bad'};
  },
  request:async(url,options)=>{
   state.requests.push({url,options});
   if(state.networkFail)throw Error('Lost provider response');
   if(options.method==='POST')return json(ref(),{status:201});
   return json(state.remote??{message:'missing'},
    state.remote?{}:{status:404});
  },
 });
 return {coordinator,db,state,stored,atomic,descriptor};
}
const denied=(promise,code)=>assert.rejects(promise,e=>
 e instanceof D6PublishBranchError&&e.code===code);

test('WP3-BRANCH01 verified tree required before durable branch and independent GET proof',async()=>{
 const x=await setup();
 const pending=await x.coordinator.attempt(request(),ID);
 assert.equal(pending.state,'Unknown');
 assert.equal(pending.isLive,false);
 assert.equal(pending.attemptedNow,true);
 assert.equal(x.db.fences.filter(r=>r.step_key==='branch').length,1);
 assert.equal(x.state.requests.length,1);
 const post=x.state.requests[0];
 assert.equal(post.url,API+'/git/refs');
 assert.equal(post.options.method,'POST');
 assert.equal(post.options.redirect,'manual');
 assert.equal(post.options.credentials,'omit');
 assert.deepEqual(JSON.parse(post.options.body),{ref:BRANCH,sha:MAIN});
 const verified=await x.coordinator.reconcile(request(),ID);
 assert.equal(verified.state,'VerifiedBranch');
 assert.equal(verified.verifiedBranch,true);
 assert.equal(verified.canCommit,false);
 assert.equal(verified.isLive,false);
 assert.equal(verified.resultTreeSha,TREE);
 assert.equal(x.db.branchProofs.length,1);
 assert.equal(x.state.requests.length,2);
 assert.equal(x.state.requests[1].options.method,'GET');
 assert.equal(x.state.requests[1].url,API+'/git/ref/heads/fish-v3/publish/'+ID);
 assert.equal(x.db.fences.find(r=>r.step_key==='branch').state,'Unknown');
 assert.match(D6_PUBLISH_BRANCH_PROOF_SQL,/PRIMARY KEY/);
});

test('WP3-BRANCH02 default disabled and denied owner never access D1',async()=>{
 const off=await setup({enabled:false});
 await denied(off.coordinator.attempt(request(),ID),'DISABLED');
 assert.equal(off.state.auth,0);
 assert.equal(off.state.requests.length,0);
 const no=await setup({owner:false});
 await denied(no.coordinator.attempt(request(),ID),'OWNER_DENIED');
 assert.equal(no.state.loads,0);
 assert.equal(no.state.requests.length,0);
});

test('WP3-BRANCH03 no verified tree or corrupt tree fence blocks branch',async()=>{
 const x=await setup();
 x.db.treeProofs.length=0;
 await denied(x.coordinator.attempt(request(),ID),'TREE_PROOF_UNVERIFIED');
 assert.equal(x.state.requests.length,0);
 const y=await setup();
 y.db.fences[0].request_sha256='f'.repeat(64);
 await denied(y.coordinator.attempt(request(),ID),'TREE_FENCE_UNVERIFIED');
 assert.equal(y.state.issuedWrite,0);
});

test('WP3-BRANCH04 duplicate/concurrent submissions never repeat branch POST',async()=>{
 const x=await setup();
 const pair=await Promise.all([
  x.coordinator.attempt(request(),ID),x.coordinator.attempt(request(),ID),
 ]);
 assert.deepEqual(pair.map(v=>v.state),['Unknown','Unknown']);
 assert.equal(x.state.requests.filter(v=>v.options.method==='POST').length,1);
 assert.equal((await x.coordinator.attempt(request(),ID)).attemptedNow,false);
 assert.equal(x.state.requests.filter(v=>v.options.method==='POST').length,1);
 assert.equal(x.state.auth,3);
});

test('WP3-BRANCH05 lost D1 fence acknowledgement cannot send a POST',async()=>{
 const x=await setup({db:memoryD1({lostFenceAck:true})});
 await denied(x.coordinator.attempt(request(),ID),'STORE_UNAVAILABLE');
 assert.equal(x.state.requests.length,0);
 assert.equal((await x.coordinator.attempt(request(),ID)).state,'Unknown');
 assert.equal(x.state.requests.length,0);
 assert.equal(x.state.issuedWrite,0);
});

test('WP3-BRANCH06 uncertain provider response remains Unknown, GET can reconcile',async()=>{
 const x=await setup({networkFail:true});
 const pending=await x.coordinator.attempt(request(),ID);
 assert.equal(pending.state,'Unknown');
 assert.equal(pending.attemptedNow,true);
 assert.equal(x.state.requests.length,1);
 x.state.networkFail=false;
 const verified=await x.coordinator.reconcile(request(),ID);
 assert.equal(verified.state,'VerifiedBranch');
 assert.equal((await x.coordinator.attempt(request(),ID)).attemptedNow,false);
 assert.equal(x.state.requests.filter(v=>v.options.method==='POST').length,1);
});

test('WP3-BRANCH07 branch ref foreign SHA, missing ref or unexpected type denied',async()=>{
 for(const remote of [
  ref('f'.repeat(40)),{...ref(),ref:'refs/heads/main'},
  {ref:BRANCH,object:{type:'tree',sha:MAIN}},null,
 ]){
  const x=await setup({remote});
  await x.coordinator.attempt(request(),ID);
  await assert.rejects(x.coordinator.reconcile(request(),ID));
  assert.equal(x.db.branchProofs.length,0);
  assert.equal(x.state.requests.filter(v=>v.options.method==='POST').length,1);
 }
});

test('WP3-BRANCH08 main change before or after token blocks any POST',async()=>{
 const a=await setup({mainMode:'no'});
 await denied(a.coordinator.attempt(request(),ID),'SOURCE_MOVED');
 assert.equal(a.state.requests.length,0);
 const b=await setup({mainMode:'after-first'});
 await denied(b.coordinator.attempt(request(),ID),'SOURCE_MOVED');
 assert.equal(b.state.requests.length,0);
 assert.equal(b.db.fences.filter(v=>v.step_key==='branch').length,1);
});

test('WP3-BRANCH09 token scope mismatch is sticky Unknown without mutation',async()=>{
 const x=await setup({tokenScope:'wrong'});
 const pending=await x.coordinator.attempt(request(),ID);
 assert.equal(pending.state,'Unknown');
 assert.equal(x.state.requests.length,0);
 await denied(x.coordinator.reconcile(request(),ID),'TOKEN_UNAVAILABLE');
 assert.equal((await x.coordinator.attempt(request(),ID)).attemptedNow,false);
 assert.equal(x.state.requests.length,0);
});

test('WP3-BRANCH10 changed immutable plan/receipt cannot replay existing fence',async()=>{
 const x=await setup();
 await x.coordinator.attempt(request(),ID);
 x.db.treeProofs[0].result_tree_sha='f'.repeat(40);
 await denied(x.coordinator.attempt(request(),ID),'BRANCH_FENCE_MISMATCH');
 assert.equal(x.state.requests.length,1);
});
test('WP3-BRANCH11 durable proof reread after lost acknowledgment',async()=>{
 const x=await setup({db:memoryD1({lostProofAck:true})});
 await x.coordinator.attempt(request(),ID);
 await denied(x.coordinator.reconcile(request(),ID),'STORE_UNAVAILABLE');
 assert.equal(x.db.branchProofs.length,1);
 const proved=await x.coordinator.reconcile(request(),ID);
 assert.equal(proved.verifiedBranch,true);
 assert.equal(x.db.branchProofs.length,1);
 assert.equal(x.state.requests.filter(v=>v.options.method==='POST').length,1);
 x.db.branchProofs[0].source_revision='f'.repeat(40);
 await denied(x.coordinator.reconcile(request(),ID),'BRANCH_PROOF_MISMATCH');
});
test('WP3-BRANCH12 Gear and KB use same canonical branch guard',async()=>{
 for(const domain of ['gear','kb']){
  const x=await setup({domain});
  await x.coordinator.attempt(request(),ID);
  const p=await x.coordinator.reconcile(request(),ID);
  assert.equal(p.state,'VerifiedBranch');
  assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
 }
});
