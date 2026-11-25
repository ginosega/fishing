import test from 'node:test';
import assert from 'node:assert/strict';
import {D6_PUBLISH_REPOSITORY,D6_PUBLISH_INTAKE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionPublishRecoveryLifecycle,
 D6PublishRecoveryError}
 from '../../experiments/p3/preview/src/d6-production-publish-recovery-lifecycle.mjs';

const REPO=D6_PUBLISH_REPOSITORY,ORIGIN=D6_PUBLISH_INTAKE_ORIGIN;
const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),BASE='b'.repeat(40),TREE='c'.repeat(40);
const COMMIT='d'.repeat(40),SNAP='9'.repeat(64),AT=1800000012;
const HASHES=['1','2','3','4','5'].map(x=>x.repeat(64));
const STEPS=['tree','branch','commit','advance','pr'];
const REF='refs/heads/fish-v3/publish/'+ID;
const request=()=>new Request(ORIGIN+'/api/v3/operations',{method:'POST',
 headers:{Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'publish','X-Fish-V3-CSRF':'test',
  'Content-Type':'application/json'},body:'{}'});
const op=(domain='catches')=>({
 operationId:ID,state:'Accepted',ownerGitHubId:REPO.ownerGitHubId,
 repositoryId:REPO.id,ref:REPO.ref,sourceRevision:MAIN,
 snapshotSha256:SNAP,domain,operation:'add',recordId:'catch-example',
});
function fence(index){
 return {operation_id:ID,step_key:STEPS[index],
  owner_github_id:REPO.ownerGitHubId,repository_id:REPO.id,
  request_sha256:HASHES[index],state:'Unknown',
  created_at:1800000000+index*2,
 };
}
function proof(index){
 const common={operation_id:ID,
  owner_github_id:REPO.ownerGitHubId,repository_id:REPO.id,
  request_sha256:HASHES[index],source_revision:MAIN,
  state:['VerifiedTree','VerifiedBranch','VerifiedCommit',
   'VerifiedAdvance','VerifiedPr'][index],
  verified_at:1800000001+index*2,
 };
 if(index===0)return {...common,base_tree_sha:BASE,
  result_tree_sha:TREE,changed_paths:3};
 if(index===1)return {...common,tree_request_sha256:HASHES[0],
  base_tree_sha:BASE,result_tree_sha:TREE,ref_name:REF};
 if(index===2)return {...common,tree_request_sha256:HASHES[0],
  branch_request_sha256:HASHES[1],result_tree_sha:TREE,
  result_commit_sha:COMMIT,ref_name:REF};
 if(index===3)return {...common,tree_request_sha256:HASHES[0],
  branch_request_sha256:HASHES[1],
  commit_request_sha256:HASHES[2],result_tree_sha:TREE,
  result_commit_sha:COMMIT,ref_name:REF};
 return {...common,tree_request_sha256:HASHES[0],
  branch_request_sha256:HASHES[1],
  commit_request_sha256:HASHES[2],
  advance_request_sha256:HASHES[3],
  result_commit_sha:COMMIT,ref_name:REF,
  pr_number:938,pr_id:1000938};
}
function memoryD1(){
 const fences=[],proofs=[],stats={reads:0,writes:0};
 const DB={prepare(sql){return {bind(...args){return {
  async first(){
   stats.reads++;
   if(sql.includes('FROM d6_provider_step_fences')){
    const [id,step]=args;
    return fences.find(f=>f.operation_id===id&&f.step_key===step)??null;
   }
   const table=STEPS.find(s=>
    sql.includes('FROM d6_'+(s==='tree'?'atomic_tree_verified':
     s==='pr'?'publish_pr_verified':'publish_'+s+'_verified')));
   assert(table,'unexpected D1 table');
   assert.equal(args[0],ID);
   return proofs.find(x=>x.step===table)?.value??null;
  },
 };}};}};
 return {DB,fences,proofs,stats,
  addFence(index){fences.push(fence(index));},
  addProof(index){proofs.push({step:STEPS[index],value:proof(index)});},
  fill(n){for(let i=0;i<n;i++){
   fences.push(fence(i));proofs.push({step:STEPS[i],value:proof(i)});
  }},
 };
}
function setup({db=memoryD1(),enabled=true,owner=true,
 domain='catches',storeState='Accepted',reconcileWorks=true}={}){
 const stored={operation:op(domain),package:{
  domain,operation:'add',id:'catch-example',
  base:{sourceRevision:MAIN}},mediaTickets:[{signed:true}]};
 stored.operation.state=storeState;
 const state={enabled,owner,auth:0,loads:0,reconciles:[],
  attempts:0,reconcileWorks};
 const reconcilers={};
 for(let i=0;i<STEPS.length;i++){
  const step=STEPS[i];
  reconcilers[step]={reconcile:async(authRequest,id)=>{
   assert.equal(authRequest.method,'POST');
   assert.equal(id,ID);state.reconciles.push(step);
   if(state.reconcileWorks)db.addProof(i);
   return {operationId:id,sourceOnly:true,isLive:false,
    state:['VerifiedTree','VerifiedBranch','VerifiedCommit',
     'VerifiedAdvance','VerifiedPr'][i]};
  }};
 }
 const lifecycle=createD6ProductionPublishRecoveryLifecycle({
  DB:db.DB,reconcilers,enabled:()=>state.enabled,now:()=>AT,
  session:{authorizeWrite:async req=>{
   state.auth++;assert.equal(req.method,'POST');
   if(!state.owner)throw Error('denied');
   return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
  }},
  loadAcceptedOperation:async({operationId,ownerGitHubId})=>{
   state.loads++;assert.equal(operationId,ID);
   assert.equal(ownerGitHubId,REPO.ownerGitHubId);
   return stored;
  },
 });
 return {lifecycle,db,stored,state};
}
const denied=(promise,code)=>assert.rejects(promise,e=>
 e instanceof D6PublishRecoveryError&&e.code===code);

test('WP3-LIFE01 canonical source operation never reports Live before or after PR proof',async()=>{
 const x=setup();
 const initial=await x.lifecycle.inspect(request(),ID);
 assert.equal(initial.state,'AwaitingAuthorizedWrite');
 assert.equal(initial.step,'tree');
 assert.equal(initial.canMerge,false);
 assert.equal(initial.canPublish,false);assert.equal(initial.isLive,false);
 assert.equal(initial.safeToRetryWrite,false);
 x.db.fill(5);
 const result=await x.lifecycle.inspect(request(),ID);
 assert.equal(result.state,'VerifiedPr');
 assert.equal(result.prNumber,938);
 assert.equal(result.prId,1000938);
 assert.equal(result.prUrl,'https://github.com/ginosega/fishing/pull/938');
 assert.deepEqual(result.verifiedSteps,STEPS);
 assert.equal(result.canMerge,false);
 assert.equal(result.canPublish,false);assert.equal(result.isLive,false);
 assert.equal(result.requiresGuardedMerge,true);
});
test('WP3-LIFE02 every prefix of 5 verified steps identifies ONLY next pending fence',async()=>{
 for(let i=0;i<STEPS.length;i++){
  const db=memoryD1();db.fill(i);
  const x=setup({db}),r=await x.lifecycle.inspect(request(),ID);
  assert.equal(r.state,'AwaitingAuthorizedWrite');
  assert.equal(r.step,STEPS[i]);
  assert.deepEqual(r.verifiedSteps,STEPS.slice(0,i));
  assert.equal(r.canPublish,false);
  assert.equal(x.state.reconciles.length,0);
 }
});
test('WP3-LIFE03 each sticky fence without proof yields readback-only recovery',async()=>{
 for(let i=0;i<STEPS.length;i++){
  const db=memoryD1();db.fill(i);db.addFence(i);
  const x=setup({db}),r=await x.lifecycle.inspect(request(),ID);
  assert.equal(r.state,'ReconciliationRequired');
  assert.equal(r.step,STEPS[i]);
  assert.equal(r.requiresIndependentReadback,true);
  assert.equal(r.safeToRetryWrite,false);
  assert.deepEqual(r.verifiedSteps,STEPS.slice(0,i));
  assert.equal(x.state.reconciles.length,0);
 }
});
test('WP3-LIFE04 only a previously fenced step can run its independent reconciler',async()=>{
 const db=memoryD1();db.fill(3);db.addFence(3);
 const x=setup({db});
 const result=await x.lifecycle.reconcile(request(),ID);
 assert.deepEqual(x.state.reconciles,['advance']);
 assert.equal(result.state,'AwaitingAuthorizedWrite');
 assert.equal(result.step,'pr');
 assert.equal(result.isLive,false);
 await denied(x.lifecycle.reconcile(request(),ID),'NOTHING_TO_RECONCILE');
 assert.deepEqual(x.state.reconciles,['advance']);
 assert.equal(db.stats.writes,0);
});
test('WP3-LIFE05 independent reconciler must durably persist correct step',async()=>{
 const db=memoryD1();db.fill(2);db.addFence(2);
 const x=setup({db,reconcileWorks:false});
 await denied(x.lifecycle.reconcile(request(),ID),'RECONCILIATION_NOT_PERSISTED');
 assert.deepEqual(x.state.reconciles,['commit']);
 assert.equal((await x.lifecycle.inspect(request(),ID)).state,
  'ReconciliationRequired');
 assert.equal(db.stats.writes,0);
});
test('WP3-LIFE06 out-of-order D1 claims and orphan proofs never imply progress',async()=>{
 for(const mutate of [
  db=>db.addProof(0),
  db=>{db.addFence(1);},
  db=>{db.addFence(0);db.addFence(2);},
  db=>{db.addFence(0);db.addProof(0);db.addFence(4);},
 ]){
  const db=memoryD1();mutate(db);
  const x=setup({db});
  await denied(x.lifecycle.inspect(request(),ID),'EVIDENCE_OUT_OF_ORDER');
 }
});
test('WP3-LIFE07 forged owner, immutable chain hash, ref or receipt state fails closed',async()=>{
 for(const mutate of [
  db=>db.fences[2].request_sha256='f'.repeat(64),
  db=>db.proofs[3].value.commit_request_sha256='f'.repeat(64),
  db=>db.proofs[4].value.advance_request_sha256='f'.repeat(64),
  db=>db.proofs[1].value.ref_name='refs/heads/foreign',
  db=>db.proofs[4].value.state='Live',
  db=>db.proofs[0].value.owner_github_id=123,
  db=>db.proofs[4].value.pr_number=0,
 ]){
  const db=memoryD1();db.fill(5);mutate(db);
  await denied(setup({db}).lifecycle.inspect(request(),ID),
   'PROOF_CORRUPT');
 }
});
test('WP3-LIFE08 future-phase fence present before prior proof must block',async()=>{
 const db=memoryD1();db.fill(1);db.addFence(1);db.addFence(2);
 await denied(setup({db}).lifecycle.inspect(request(),ID),
  'EVIDENCE_OUT_OF_ORDER');
});
test('WP3-LIFE09 disabled/denied owner fail before D1 or operation load',async()=>{
 const disabled=setup({enabled:false});
 await denied(disabled.lifecycle.inspect(request(),ID),'DISABLED');
 assert.equal(disabled.state.auth,0);
 assert.equal(disabled.db.stats.reads,0);
 const no=setup({owner:false});
 await denied(no.lifecycle.inspect(request(),ID),'OWNER_DENIED');
 assert.equal(no.state.loads,0);
 assert.equal(no.db.stats.reads,0);
});
test('WP3-LIFE10 an Unknown or altered original operation cannot claim verified PR',async()=>{
 const db=memoryD1();db.fill(5);
 const uncertain=setup({db,storeState:'Unknown'});
 await denied(uncertain.lifecycle.inspect(request(),ID),'UNTRUSTED_OPERATION');
 const other=setup({db});other.stored.operation.recordId='different';
 await denied(other.lifecycle.inspect(request(),ID),'UNTRUSTED_OPERATION');
});
test('WP3-LIFE11 trusted D1 unavailable blocks inspection; no fallback to guessed status',async()=>{
 const x=setup();x.db.DB.prepare=()=>{throw Error('D1 offline')};
 await denied(x.lifecycle.inspect(request(),ID),'STORE_UNAVAILABLE');
 assert.equal(x.state.reconciles.length,0);
});
test('WP3-LIFE12 all three canonical domains use one non-Live recovery projection',async()=>{
 for(const domain of ['gear','kb','catches']){
  const db=memoryD1();db.fill(5);
  const x=setup({db,domain});
  const r=await x.lifecycle.inspect(request(),ID);
  assert.equal(r.state,'VerifiedPr');
  assert.equal(r.domain,domain);
  assert.equal(r.isLive,false);
  assert.equal(r.canMerge,false);
 }
});
