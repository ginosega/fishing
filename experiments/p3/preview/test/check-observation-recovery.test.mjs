import test from 'node:test';
import assert from 'node:assert/strict';
import {sandbox,sample} from './d1-fixture.mjs';
import {createD1CheckObservationStore,D1CheckError}
 from '../src/d1-check-observation-store.mjs';
import {createSandboxCheckCoordinator}
 from '../src/sandbox-check-coordinator.mjs';
import {SandboxCheckError} from '../src/sandbox-check-observer.mjs';

const ID=1430581407,HEAD='a'.repeat(40),BASE='b'.repeat(40);
const BRANCH='p3-test-00000001-1111-4111-8111-123456789abc';
const RESULT={repositoryId:ID,prNumber:17,headSha:HEAD,baseSha:BASE,
 checkName:'validate-sandbox-head',actionsAppId:15368,checkObserved:'success',
 checkRunId:120492395098,canMerge:false,canDeploy:false};
const lease='p3-check-lease-test-000001';

async function fixture({enabled=true,observerFn=null,makeLease=()=>lease}={}){
 const e=sandbox();let at=1800000000;
 const store=e.store(),checkStore=createD1CheckObservationStore({
  DB:e.DB,ownerGitHubId:778899,now:()=>at,
 });
 const inserted=await store.accept({idempotencyKey:e.key,snapshot:sample});
 const id=inserted.operationId;
 let claim=await store.claim({operationId:id,leaseOwner:'p3-owner-init-a'});
 assert.equal(claim.state,'Accepted');
 await store.advance({operationId:id,leaseOwner:'p3-owner-init-a',from:'Accepted',to:'Validating'});
 claim=await store.claim({operationId:id,leaseOwner:'p3-owner-init-b'});
 assert.equal(claim.state,'Validating');
 await store.saveBranchReceipt({
  operationId:id,leaseOwner:'p3-owner-init-b',baseSha:BASE,headSha:HEAD,
 });
 await store.advance({operationId:id,leaseOwner:'p3-owner-init-b',
  from:'Validating',to:'Checking',
  details:{prNumber:17,prHeadSha:HEAD,mainBaseSha:BASE},
 });
 const calls=[];
 const observer={observe:async params=>{
  calls.push(params);
  if(observerFn)return observerFn(params,{e,id,advance:seconds=>{e.clock(seconds);at+=seconds;}});
  return RESULT;
 }};
 const coordinator=createSandboxCheckCoordinator({
  store,checkStore,observer,now:()=>at,enabled:()=>enabled,makeLease,
 });
 return {e,id,store,checkStore,observer,coordinator,calls,
  advance(seconds){e.clock(seconds);at+=seconds;},
  get time(){return at;},
 };
}
const fail=code=>{throw new SandboxCheckError(code);};
const readSQL=(f)=>f.e.sql.prepare(
 'SELECT lease_owner,lease_expires_at,state FROM p3_operations WHERE operation_id=?').get(f.id);

test('P3-D01 success commits immutable, audited check evidence and NEVER advances to Merging',async()=>{
 const f=await fixture();
 const out=await f.coordinator.checkOnce(f.id);
 assert.equal(out.state,'ManualReview');
 assert.equal(out.reasonCode,'CI_SUCCESS_RECORDED');
 assert.equal(out.checkRunId,RESULT.checkRunId);
 assert.equal(out.canMerge,false);
 assert.equal(out.canDeploy,false);
 assert.equal((await f.store.get(f.id)).state,'Checking');
 const saved=await f.checkStore.get(f.id);
 assert.deepEqual([saved.repositoryId,saved.prNumber,saved.headSha,saved.baseSha,saved.branch],
  [ID,17,HEAD,BASE,BRANCH]);
 assert.equal(saved.state,'passed');
 assert.equal(saved.attempts,1);
 assert.equal(saved.nextPollAt,null);
 assert.deepEqual((await f.checkStore.history(f.id)).map(e=>[e.attempt,e.state,e.checkRunId]),
  [[1,'passed',120492395098]]);
 assert.equal(readSQL(f).lease_owner,null);
 assert.equal(f.calls.length,1);
 assert.deepEqual(f.calls[0],{repositoryId:ID,prNumber:17,
  expectedHeadSha:HEAD,expectedBaseSha:BASE,expectedBranch:BRANCH});
});
test('P3-D02 repeated success only returns manual review; cannot rerun/rewrite past evidence',async()=>{
 const f=await fixture();
 await f.coordinator.checkOnce(f.id);
 const out=await f.coordinator.checkOnce(f.id);
 assert.equal(out.reasonCode,'CI_ALREADY_RECORDED');
 assert.equal(f.calls.length,1);
 assert.equal((await f.checkStore.history(f.id)).length,1);
});
test('P3-D03 pending check logs retry, honors cooldown and resumes after expiry',async()=>{
 let called=0;
 const f=await fixture({observerFn:async()=>++called===1?fail('CHECK_PENDING'):RESULT});
 const first=await f.coordinator.checkOnce(f.id);
 assert.equal(first.state,'RetryScheduled');
 assert.equal(first.attempts,1);
 assert.equal(first.nextPollAt,f.time+15);
 assert.equal((await f.checkStore.get(f.id)).state,'retry');
 const tooSoon=await f.coordinator.checkOnce(f.id);
 assert.equal(tooSoon.state,'Deferred');
 assert.equal(called,1);
 f.advance(15);
 const second=await f.coordinator.checkOnce(f.id);
 assert.equal(second.state,'ManualReview');
 assert.equal(second.checkRunId,RESULT.checkRunId);
 assert.equal(called,2);
 assert.deepEqual((await f.checkStore.history(f.id)).map(x=>x.state),['retry','passed']);
});
test('P3-D04 API error and missing check use retries, but failed CI is manual review',async()=>{
 for(const code of ['CHECK_MISSING_OR_AMBIGUOUS','GITHUB_NETWORK_ERROR','GITHUB_READ_FAILED']){
  const f=await fixture({observerFn:()=>fail(code)});
  const out=await f.coordinator.checkOnce(f.id);
  assert.equal(out.state,'RetryScheduled',code);
  assert.equal((await f.checkStore.history(f.id)).length,1);
 }
 for(const code of ['CHECK_NOT_SUCCESSFUL','PR_HEAD_OR_BASE_MOVED',
  'PR_NOT_OPEN_DRAFT','CHECK_IDENTITY_DENIED']){
  const f=await fixture({observerFn:()=>fail(code)});
  const out=await f.coordinator.checkOnce(f.id);
  assert.equal(out.state,'ManualReview',code);
  assert.equal((await f.checkStore.get(f.id)).state,'review');
  assert.equal((await f.coordinator.checkOnce(f.id)).reasonCode,'CI_REVIEW_REQUIRED');
  assert.equal(f.calls.length,1);
 }
});
test('P3-D05 excessive transient errors are bounded to twelve audited attempts',async()=>{
 const f=await fixture({observerFn:()=>fail('GITHUB_NETWORK_ERROR')});
 for(let i=1;i<=12;i++){
  const out=await f.coordinator.checkOnce(f.id);
  assert.equal(out.state,i===12?'ManualReview':'RetryScheduled');
  f.advance(601);
 }
 const final=await f.checkStore.get(f.id);
 assert.equal(final.attempts,12);
 assert.equal(final.state,'review');
 assert.equal(final.reasonCode,'ci_retry_exhausted');
 assert.equal((await f.checkStore.history(f.id)).length,12);
 assert.equal((await f.coordinator.checkOnce(f.id)).reasonCode,'CI_REVIEW_REQUIRED');
 assert.equal(f.calls.length,12);
});
test('P3-D06 active lease never allows a second observer; expired lease can safely recover',async()=>{
 const f=await fixture();
 const other=await f.store.claim({operationId:f.id,leaseOwner:'other-owner-lock'});
 assert.equal(other.state,'Checking');
 const locked=await f.coordinator.checkOnce(f.id);
 assert.equal(locked.state,'Unclaimed');
 assert.equal(f.calls.length,0);
 f.advance(31);
 const recovered=await f.coordinator.checkOnce(f.id);
 assert.equal(recovered.state,'ManualReview');
 assert.equal(f.calls.length,1);
});
test('P3-D07 lease expiration during network read cannot persist a claimed success',async()=>{
 const f=await fixture({observerFn:(params,{advance})=>{advance(31);return RESULT;}});
 const outcome=await f.coordinator.checkOnce(f.id);
 assert.equal(outcome.state,'NeedsReview');
 assert.equal(outcome.reasonCode,'LEASE_RELEASE_UNCONFIRMED');
 assert.equal(await f.checkStore.get(f.id),null);
 assert.equal((await f.checkStore.history(f.id)).length,0);
});
test('P3-D08 changed durable PR head during observer forbids proof commit',async()=>{
 const f=await fixture({observerFn:(_p,{e,id})=>{
  e.sql.prepare('UPDATE p3_operations SET pr_head_sha=? WHERE operation_id=?')
   .run('c'.repeat(40),id);
  return RESULT;
 }});
 const out=await f.coordinator.checkOnce(f.id);
 assert.equal(out.reasonCode,'LEASE_OR_RECEIPT_CHANGED');
 assert.equal(await f.checkStore.get(f.id),null);
 assert.equal(readSQL(f).lease_owner,null);
});
test('P3-D09 forged/wider/partial observer successes are marked for review, never success',async()=>{
 for(const patch of [
  {repositoryId:1350909744},{prNumber:18},{headSha:'f'.repeat(40)},
  {baseSha:'f'.repeat(40)},{checkName:'unrelated'},
  {actionsAppId:42},{checkObserved:'neutral'},{canMerge:true},{canDeploy:true},
  {checkRunId:0},
 ]){
  const f=await fixture({observerFn:()=>({...RESULT,...patch})});
  const out=await f.coordinator.checkOnce(f.id);
  assert.equal(out.state,'ManualReview',JSON.stringify(patch));
  assert.equal((await f.checkStore.get(f.id)).state,'review');
 }
});
test('P3-D10 disabled gate makes no claim, evidence or GitHub request',async()=>{
 const f=await fixture({enabled:false});
 const out=await f.coordinator.checkOnce(f.id);
 assert.equal(out.state,'Disabled');
 assert.equal(f.calls.length,0);
 assert.equal(await f.checkStore.get(f.id),null);
 assert.equal(readSQL(f).lease_owner,null);
});
test('P3-D11 invalid identity and receipt prevent read or claim',async()=>{
 const f=await fixture();
 assert.equal((await f.coordinator.checkOnce('not-an-operation')).reasonCode,'INVALID_OPERATION');
 f.e.sql.prepare('UPDATE p3_operations SET pr_number=NULL WHERE operation_id=?').run(f.id);
 assert.equal((await f.coordinator.checkOnce(f.id)).reasonCode,'INCOMPLETE_OPERATION_RECEIPT');
 assert.equal(f.calls.length,0);
 assert.equal(await f.checkStore.get(f.id),null);
});
test('P3-D12 direct store cannot append checks without an exact unexpired claim and receipt',async()=>{
 const f=await fixture();
 const params={operationId:f.id,leaseOwner:lease,prNumber:17,headSha:HEAD,baseSha:BASE,
  expectedAttempts:0,state:'passed',checkRunId:101};
 assert.equal(await f.checkStore.record(params),null);
 const claimed=await f.store.claim({operationId:f.id,leaseOwner:lease});
 assert.equal(claimed.state,'Checking');
 assert.equal(await f.checkStore.record({...params,headSha:'c'.repeat(40)}),null);
 assert.equal(await f.checkStore.record({...params,prNumber:18}),null);
 const real=await f.checkStore.record(params);
 assert.equal(real.state,'passed');
 assert.equal(await f.checkStore.record(params),null);
 assert.equal(await f.checkStore.release({operationId:f.id,leaseOwner:lease}),true);
 assert.equal(await f.checkStore.record(params),null);
 assert.equal((await f.checkStore.history(f.id)).length,1);
});
test('P3-D13 SQL constraint, CAS and audit retain exact immutable past successes',async()=>{
 const f=await fixture();
 const claim=await f.store.claim({operationId:f.id,leaseOwner:lease});
 assert.equal(claim.state,'Checking');
 const payload={operationId:f.id,leaseOwner:lease,prNumber:17,headSha:HEAD,baseSha:BASE,
  expectedAttempts:0,state:'retry',reasonCode:'ci_temporarily_unavailable',
  nextPollAt:f.time+60};
 assert.equal((await f.checkStore.record(payload)).attempts,1);
 assert.equal((await f.checkStore.record(payload)),null);
 assert.equal((await f.checkStore.record({...payload,expectedAttempts:1,state:'passed',
  checkRunId:RESULT.checkRunId,reasonCode:null,nextPollAt:null})).state,'passed');
 assert.equal(await f.checkStore.record({...payload,expectedAttempts:2}),null);
 const records=await f.checkStore.history(f.id);
 assert.deepEqual(records.map(x=>[x.attempt,x.state]),[[1,'retry'],[2,'passed']]);
 await f.checkStore.release({operationId:f.id,leaseOwner:lease});
});
test('P3-D14 no methods can merge, create PR, publish or deploy',async()=>{
 const f=await fixture();
 assert.deepEqual(Object.keys(f.coordinator),['checkOnce']);
 assert.deepEqual(Object.keys(f.checkStore),['get','record','release','history']);
 const record=await f.coordinator.checkOnce(f.id);
 assert.equal(record.canMerge,false);
 assert.equal(record.canDeploy,false);
 assert.equal((await f.store.get(f.id)).state,'Checking');
});
