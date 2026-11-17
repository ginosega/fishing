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
import {describeD6PublishAdvanceStep}
 from '../../experiments/p3/preview/src/d6-production-publish-advance-coordinator.mjs';
import {describeD6PublishPrStep,
 createD6ProductionPublishPrCoordinator,D6PublishPrError,
 D6_PUBLISH_PR_PROOF_SQL}
 from '../../experiments/p3/preview/src/d6-production-publish-pr-coordinator.mjs';

const REPO=D6_PUBLISH_REPOSITORY,ORIGIN=D6_PUBLISH_INTAKE_ORIGIN;
const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),BASE='b'.repeat(40),TREE='c'.repeat(40);
const COMMIT='d'.repeat(40),SNAP='9'.repeat(64);
const INDEX='2'.repeat(40),NOTE='3'.repeat(40),IMAGE='4'.repeat(40);
const ROOT='https://api.github.com/repos/ginosega/fishing';
const BRANCH='fish-v3/publish/'+ID,HEAD='refs/heads/'+BRANCH;
const MESSAGE='Fishing Companion V3 content update '+ID;
const NUMBER=892,PR_ID=202011010,AT=1800000010;
const req=()=>new Request(ORIGIN+'/api/v3/operations',{
 method:'POST',headers:{
 Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
 'X-Fish-V3-Intent':'publish','X-Fish-V3-CSRF':'test-only',
 'Content-Type':'application/json'},body:'{}'});
const json=(v,status=200)=>new Response(JSON.stringify(v),{
 status,headers:{'Content-Type':'application/json'}});
const ref=(name,sha)=>({ref:name,object:{type:'commit',sha}});
const commit=()=>({sha:COMMIT,message:MESSAGE,tree:{sha:TREE},parents:[{sha:MAIN}]});
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
  requiresDurableGitStepFence:true,requiresIndependentTreeReadback:true,
  requiresSourceConflictRecheck:true,
 };
}
function d1({lostFenceAck=false,lostProofAck=false,unavailable=false}={}){
 const fences=[],treeProofs=[],branchProofs=[],commitProofs=[],advanceProofs=[],prProofs=[];
 const stats={reads:0,writes:0};
 let loseFence=lostFenceAck,loseProof=lostProofAck;
 const DB={prepare(sql){
  if(unavailable)throw Error('D1 not ready');
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
    if(sql.includes('FROM d6_publish_advance_verified'))
     return advanceProofs.find(x=>x.operation_id===args[0])??null;
    assert(sql.includes('FROM d6_publish_pr_verified'));
    return prProofs.find(x=>x.operation_id===args[0])??null;
   },
   async run(){
    stats.writes++;
    if(sql.includes('INSERT OR IGNORE INTO d6_provider_step_fences')){
     const [id,key,owner,repo,digest,at]=args;
     const existing=fences.find(x=>x.operation_id===id&&x.step_key===key);
     if(!existing)fences.push({operation_id:id,step_key:key,
      owner_github_id:owner,repository_id:repo,
      request_sha256:digest,state:'Unknown',created_at:at});
     if(loseFence){loseFence=false;throw Error('D1 fence lost ack');}
     return {meta:{changes:existing?0:1}};
    }
    assert(sql.includes('INSERT OR IGNORE INTO d6_publish_pr_verified'));
    const [id,owner,repo,treeHash,branchHash,commitHash,advanceHash,
     requestHash,source,commitSha,refName,number,prId,at]=args;
    const existing=prProofs.find(x=>x.operation_id===id);
    if(!existing)prProofs.push({
     operation_id:id,owner_github_id:owner,repository_id:repo,
     tree_request_sha256:treeHash,branch_request_sha256:branchHash,
     commit_request_sha256:commitHash,advance_request_sha256:advanceHash,
     request_sha256:requestHash,source_revision:source,
     result_commit_sha:commitSha,ref_name:refName,
     pr_number:number,pr_id:prId,state:'VerifiedPr',verified_at:at,
    });
    if(loseProof){loseProof=false;throw Error('D1 proof lost ack');}
    return {meta:{changes:existing?0:1}};
   },
  };}};}};
 return {DB,fences,treeProofs,branchProofs,commitProofs,advanceProofs,prProofs,stats};
}
async function setup({domain='catches',db=d1(),enabled=true,
 owner=true,precondition='ok',tokenScope='ok',
 remotePrChange=pr=>pr,prListCount=1,
 remoteMain=MAIN,remoteHead=COMMIT,remoteCommit=commit(),
 networkError=false}={}){
 const operation=op(domain),pkg={domain,operation:'add',
  id:'catch-example',base:{sourceRevision:MAIN}};
 const stored={operation,package:pkg,mediaTickets:[{synthetic:true}]};
 const atomic=plan(domain);
 const tAction=await describeD6AtomicTreeStep({operation,plan:atomic});
 const tp={operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,request_sha256:tAction.requestSha256,
  source_revision:MAIN,base_tree_sha:BASE,result_tree_sha:TREE,
  changed_paths:3,state:'VerifiedTree',verified_at:1800000001};
 const bAction=await describeD6PublishBranchStep({operation,treeAction:tAction,
  treeProof:tp});
 const bp={operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,tree_request_sha256:tAction.requestSha256,
  request_sha256:bAction.requestSha256,source_revision:MAIN,
  base_tree_sha:BASE,result_tree_sha:TREE,ref_name:HEAD,
  state:'VerifiedBranch',verified_at:1800000003};
 const cAction=await describeD6PublishCommitStep({operation,
  treeAction:tAction,treeProof:tp,branchAction:bAction,branchProof:bp});
 const cp={operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,tree_request_sha256:tAction.requestSha256,
  branch_request_sha256:bAction.requestSha256,
  request_sha256:cAction.requestSha256,source_revision:MAIN,
  result_tree_sha:TREE,result_commit_sha:COMMIT,ref_name:HEAD,
  state:'VerifiedCommit',verified_at:1800000005};
 const aAction=await describeD6PublishAdvanceStep({
  operation,treeAction:tAction,branchAction:bAction,
  commitAction:cAction,commitReceipt:cp});
 const ap={operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,tree_request_sha256:tAction.requestSha256,
  branch_request_sha256:bAction.requestSha256,
  commit_request_sha256:cAction.requestSha256,
  request_sha256:aAction.requestSha256,source_revision:MAIN,
  result_tree_sha:TREE,result_commit_sha:COMMIT,ref_name:HEAD,
  state:'VerifiedAdvance',verified_at:1800000007};
 const action=await describeD6PublishPrStep({operation,
  treeAction:tAction,branchAction:bAction,commitAction:cAction,
  advanceAction:aAction,advanceReceipt:ap});
 for(const [key,digest,at] of [
  ['tree',tAction.requestSha256,1800000000],
  ['branch',bAction.requestSha256,1800000002],
  ['commit',cAction.requestSha256,1800000004],
  ['advance',aAction.requestSha256,1800000006],
 ])db.fences.push({operation_id:ID,step_key:key,
  owner_github_id:REPO.ownerGitHubId,repository_id:REPO.id,
  request_sha256:digest,state:'Unknown',created_at:at});
 db.treeProofs.push(tp);db.branchProofs.push(bp);
 db.commitProofs.push(cp);db.advanceProofs.push(ap);
 const pr=remotePrChange({
  number:NUMBER,id:PR_ID,
  html_url:'https://github.com/'+REPO.name+'/pull/'+NUMBER,
  title:action.body.title,body:action.body.body,
  state:'open',draft:false,merged_at:null,closed_at:null,
  created_at:new Date(AT*1000).toISOString(),
  head:{ref:BRANCH,sha:COMMIT,repo:{id:REPO.id,full_name:REPO.name}},
  base:{ref:'main',sha:MAIN,repo:{id:REPO.id,full_name:REPO.name}},
 });
 const state={enabled,owner,precondition,tokenScope,remoteMain,remoteHead,
  remoteCommit,networkError,pr,prListCount,authCount:0,loads:0,plans:0,
  checks:0,readTokens:0,writeTokens:0,requests:[]};
 const coord=createD6ProductionPublishPrCoordinator({
  DB:db.DB,enabled:()=>state.enabled,now:()=>AT,
  session:{authorizeWrite:async request=>{
   state.authCount++;assert.equal(request.method,'POST');
   assert.equal(request.headers.get('X-Fish-V3-Intent'),'publish');
   if(!state.owner)throw Error('Owner denied');
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
    repositoryId:REPO.id,permissions:{pull_requests:'write'}});
   return state.tokenScope==='ok'?{
    repositoryId:REPO.id,permissions:{pull_requests:'write'},
    token:'TEST-ONLY-PR-WRITE-CREDENTIAL-1234567'}:{
    repositoryId:REPO.id,permissions:{contents:'write'},token:'bad'};
  },
  issueReadToken:async args=>{
   state.readTokens++;assert.deepEqual(args,{
    repositoryId:REPO.id,permissions:{
     contents:'read',pull_requests:'read'}});
   return state.tokenScope==='ok'?{
    repositoryId:REPO.id,permissions:{
     contents:'read',pull_requests:'read'},
    token:'TEST-ONLY-PR-READ-CREDENTIAL-12345678'}:{
    repositoryId:REPO.id,permissions:{contents:'read'},token:'bad'};
  },
  request:async(url,options)=>{
   state.requests.push({url,options,
    fenced:db.fences.some(f=>f.step_key==='pr')});
   if(state.networkError)throw Error('lost response');
   if(options.method==='POST')return json(state.pr,201);
   if(url===ROOT+'/git/ref/heads/main')
    return json(ref(REPO.ref,state.remoteMain));
   if(url===ROOT+'/git/ref/heads/'+BRANCH)
    return json(ref(HEAD,state.remoteHead));
   if(url.startsWith(ROOT+'/pulls?'))
    return json(Array.from({length:state.prListCount},()=>state.pr));
   if(url===ROOT+'/pulls/'+NUMBER)return json(state.pr);
   if(url===ROOT+'/git/commits/'+COMMIT)return json(state.remoteCommit);
   throw Error('Unexpected GitHub endpoint '+url);
  },
 });
 return {coord,db,state,stored,action};
}
const denied=(promise,code)=>assert.rejects(promise,e=>
 e instanceof D6PublishPrError&&e.code===code);

test('WP3-PR01 verified atomic source/branch/commit/advance yield one fenced POST and independent PR proof',async()=>{
 const x=await setup();
 const unknown=await x.coord.attempt(req(),ID);
 assert.equal(unknown.state,'Unknown');
 assert.equal(unknown.attemptedNow,true);
 assert.equal(unknown.canPublish,false);
 assert.equal(x.db.fences.filter(f=>f.step_key==='pr').length,1);
 const post=x.state.requests[0];
 assert.equal(post.fenced,true);
 assert.equal(post.options.method,'POST');
 assert.equal(post.url,ROOT+'/pulls');
 assert.deepEqual(JSON.parse(post.options.body),x.action.body);
 assert.equal(post.options.redirect,'manual');
 assert.equal(post.options.credentials,'omit');
 const result=await x.coord.reconcile(req(),ID);
 assert.equal(result.state,'VerifiedPr');
 assert.equal(result.prNumber,NUMBER);
 assert.equal(result.prId,PR_ID);
 assert.equal(result.isLive,false);
 assert.equal(result.canMerge,false);
 assert.equal(result.requiresGuardedMerge,true);
 assert.equal(x.db.prProofs.length,1);
 assert.equal(x.db.fences.find(f=>f.step_key==='pr').state,'Unknown');
 assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
 assert(x.state.requests.every(r=>r.fenced));
 assert.match(D6_PUBLISH_PR_PROOF_SQL,/CHECK\(state='VerifiedPr'\)/);
});
test('WP3-PR02 default off and denied owner prevent any D1/provider request',async()=>{
 const disabled=await setup({enabled:false});
 await denied(disabled.coord.attempt(req(),ID),'DISABLED');
 assert.equal(disabled.state.authCount,0);
 assert.equal(disabled.db.stats.reads,0);
 const no=await setup({owner:false});
 await denied(no.coord.attempt(req(),ID),'OWNER_DENIED');
 assert.equal(no.db.stats.reads,0);
 assert.equal(no.state.loads,0);
});
test('WP3-PR03 missing or altered upstream proof cannot open PR',async()=>{
 for(const mutate of [
  x=>x.db.treeProofs.length=0,
  x=>x.db.branchProofs[0].result_tree_sha='f'.repeat(40),
  x=>x.db.commitProofs[0].result_commit_sha='f'.repeat(40),
  x=>x.db.advanceProofs[0].request_sha256='f'.repeat(64),
  x=>x.db.fences[3].state='VerifiedAdvance',
 ]){
  const x=await setup();mutate(x);
  await assert.rejects(x.coord.attempt(req(),ID));
  assert.equal(x.state.requests.length,0);
  assert.equal(x.db.fences.filter(f=>f.step_key==='pr').length,0);
 }
});
test('WP3-PR04 concurrent and repeated requests never issue second PR POST',async()=>{
 const x=await setup();
 const pair=await Promise.all([x.coord.attempt(req(),ID),
  x.coord.attempt(req(),ID)]);
 assert.deepEqual(pair.map(x=>x.state),['Unknown','Unknown']);
 assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
 assert.equal((await x.coord.attempt(req(),ID)).attemptedNow,false);
 assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
});
test('WP3-PR05 lost D1 claim ack fails closed and never POSTs',async()=>{
 const x=await setup({db:d1({lostFenceAck:true})});
 await denied(x.coord.attempt(req(),ID),'STORE_UNAVAILABLE');
 assert.equal(x.state.requests.length,0);
 assert.equal(x.db.fences.filter(f=>f.step_key==='pr').length,1);
 assert.equal((await x.coord.attempt(req(),ID)).attemptedNow,false);
 assert.equal(x.state.requests.length,0);
});
test('WP3-PR06 lost HTTP response resolves by discovery, never blindly POSTs',async()=>{
 const x=await setup({networkError:true});
 assert.equal((await x.coord.attempt(req(),ID)).state,'Unknown');
 x.state.networkError=false;
 const proven=await x.coord.reconcile(req(),ID);
 assert.equal(proven.verifiedPr,true);
 assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
 assert.equal((await x.coord.attempt(req(),ID)).attemptedNow,false);
});
test('WP3-PR07 no matching PR or duplicate PRs remain Unknown',async()=>{
 for(const prListCount of [0,2]){
  const x=await setup({prListCount});
  await x.coord.attempt(req(),ID);
  await denied(x.coord.reconcile(req(),ID),'PR_AMBIGUOUS');
  assert.equal(x.db.prProofs.length,0);
  assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
 }
});
test('WP3-PR08 forged PR head, base, body, repo, draft or age never verifies',async()=>{
 for(const change of [
  p=>p.head.sha=MAIN,
  p=>p.base.sha=COMMIT,
  p=>p.head.repo.id=123,
  p=>p.base.repo.full_name='other/repo',
  p=>p.draft=true,
  p=>p.body='another operation',
  p=>p.state='closed',
  p=>p.created_at=new Date((AT-500)*1000).toISOString(),
 ]){
  const x=await setup({remotePrChange:pr=>{
   change(pr);return pr;
  }});
  await x.coord.attempt(req(),ID);
  await denied(x.coord.reconcile(req(),ID),'PR_UNVERIFIED');
  assert.equal(x.db.prProofs.length,0);
 }
});
test('WP3-PR09 main/branch or commit readback drift blocks receipt',async()=>{
 for(const config of [
  {remoteMain:COMMIT},{remoteHead:MAIN},
  {remoteCommit:{...commit(),parents:[]}},
  {remoteCommit:{...commit(),tree:{sha:MAIN}}},
 ]){
  const x=await setup(config);await x.coord.attempt(req(),ID);
  await assert.rejects(x.coord.reconcile(req(),ID));
  assert.equal(x.db.prProofs.length,0);
 }
});
test('WP3-PR10 source drift pre- and post-token denies POST',async()=>{
 const early=await setup({precondition:'never'});
 await denied(early.coord.attempt(req(),ID),'SOURCE_OR_BRANCH_MOVED');
 assert.equal(early.db.fences.filter(f=>f.step_key==='pr').length,0);
 const later=await setup({precondition:'first-only'});
 await denied(later.coord.attempt(req(),ID),'SOURCE_OR_BRANCH_MOVED');
 assert.equal(later.db.fences.filter(f=>f.step_key==='pr').length,1);
 assert.equal(later.state.requests.length,0);
});
test('WP3-PR11 improper tokens never allow mutation or verification',async()=>{
 const x=await setup({tokenScope:'bad'});
 assert.equal((await x.coord.attempt(req(),ID)).state,'Unknown');
 assert.equal(x.state.requests.length,0);
 await denied(x.coord.reconcile(req(),ID),'TOKEN_UNAVAILABLE');
 assert.equal(x.db.prProofs.length,0);
});
test('WP3-PR12 lost proof acknowledgment reconciles without mutation; corrupt D1 fails closed',async()=>{
 const x=await setup({db:d1({lostProofAck:true})});
 await x.coord.attempt(req(),ID);
 await denied(x.coord.reconcile(req(),ID),'STORE_UNAVAILABLE');
 assert.equal(x.db.prProofs.length,1);
 const result=await x.coord.reconcile(req(),ID);
 assert.equal(result.verifiedPr,true);
 assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
 x.db.prProofs[0].result_commit_sha=MAIN;
 await denied(x.coord.reconcile(req(),ID),'PR_PROOF_MISMATCH');
});
test('WP3-PR13 same bounded PR protection for Gear and KB',async()=>{
 for(const domain of ['gear','kb']){
  const x=await setup({domain});
  assert.equal((await x.coord.attempt(req(),ID)).state,'Unknown');
  const receipt=await x.coord.reconcile(req(),ID);
  assert.equal(receipt.verifiedPr,true);
  assert.equal(x.state.requests.filter(r=>r.options.method==='POST').length,1);
 }
});
