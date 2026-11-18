import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {planD6Wp3H2Resume,D6Wp3H2ResumeError}
 from '../server/d6-wp3-h2-resume-plan.mjs';
import {createD6Wp3H2OperatorApproval}
 from '../server/d6-wp3-h2-operator-approval.mjs';

const ID='123e4567-e89b-42d3-a456-426614174000';
const SHA='a'.repeat(40),DIGEST='b'.repeat(64);
const RECORD='h2-synthetic-kb-publishing-proof';
const KEY='wp3_h2_synthetic_kb_001';
const STEPS=['tree','branch','commit','advance','pr'];
const NOW=2000000000;
const row=()=>({
 operation_id:ID,owner_github_id:265665562,idempotency_key:KEY,
 domain:'kb',operation_kind:'add',record_id:RECORD,
 state:'Accepted',source_revision:SHA,snapshot_sha256:DIGEST,
 created_at:NOW-60,updated_at:NOW-50,
});
const current=(n=0,state='AwaitingAuthorizedWrite')=>({
 ok:true,operationId:ID,sourceRevision:SHA,
 state,step:state==='VerifiedPr'?null:STEPS[n],
 verifiedSteps:STEPS.slice(0,n),
 sourceOnly:true,canPublish:false,isLive:false,
 requiresHostedReleaseProof:true,safeToRetryWrite:false,
 ...(state==='VerifiedPr'?{prNumber:1234}:{}),
});
const rejected=(fn,code)=>assert.throws(fn,e=>
 e instanceof D6Wp3H2ResumeError&&e.code===code);

test('WP3-H2RES01 exact D1 Accepted and owner status only propose tree without activation',()=>{
 const p=planD6Wp3H2Resume({receiptRow:row(),status:current()});
 assert.equal(p.nextAction,'REQUEST_EXACT_STEP_APPROVAL');
 assert.equal(p.step,'tree');
 assert.equal(p.endpoint,'/api/v3/operations/'+ID+'/begin');
 assert.deepEqual(p.verifiedSteps,[]);
 assert.equal(p.expectedBranch,'fish-v3/publish/'+ID);
 assert.equal(p.approvalPins.D6_WP3_H2_APPROVED_STEP_PREFIX,'');
 assert.equal(p.approvalPins.D6_WP3_H2_APPROVED_OPERATION_ID,ID);
 assert.equal(p.approvalPins.D6_WP3_H2_APPROVED_PHASE,'steps');
 assert.equal(p.approvalPins.D6_WP3_H2_APPROVED_SOURCE_REVISION,SHA);
 assert.equal(p.approvalPins.D6_WP3_H2_APPROVED_RECORD_ID,RECORD);
 assert.equal(p.approvalPins.D6_WP3_H2_TEST_NAME,'WP3-H2-SYNTH-KB-001');
 assert.equal(p.operatorApproved,false);
 assert.equal(p.canActivate,false);
 assert.equal(p.isLive,false);
 assert.equal(p.canPublish,false);
 assert.equal(p.requiresFreshIndependentReadback,true);
 assert.equal(p.requiresOffRestoration,true);
 assert.equal('D6_WP3_H2_OPERATOR_APPROVED' in p.approvalPins,false);
 assert.equal('D6_WP3_H2_APPROVED_START' in p.approvalPins,false);
 assert.equal('D6_WP3_H2_APPROVED_END' in p.approvalPins,false);
 assert.equal('D6_WP3_H2_APPROVED_ENVELOPE_SHA256' in p.approvalPins,false);
 assert(Object.isFrozen(p)&&Object.isFrozen(p.checkpoint)&&
  Object.isFrozen(p.approvalPins));
});

test('WP3-H2RES02 each verified D1 prefix proposes only its exact next step',()=>{
 for(let i=0;i<STEPS.length;i++){
  const p=planD6Wp3H2Resume({
   receiptRow:row(),status:current(i),
  });
  assert.equal(p.step,STEPS[i]);
  assert.equal(p.approvalPins.D6_WP3_H2_APPROVED_STEP,STEPS[i]);
  assert.equal(p.approvalPins.D6_WP3_H2_APPROVED_STEP_PREFIX,
   STEPS.slice(0,i).join(','));
  assert.equal(p.endpoint,'/api/v3/operations/'+ID+'/begin');
  assert.deepEqual(p.checkpoint.verifiedSteps,STEPS.slice(0,i));
 }
});

test('WP3-H2RES03 Unknown fence permits reconciliation only, never another begin',()=>{
 for(let i=0;i<STEPS.length;i++){
  const p=planD6Wp3H2Resume({
   receiptRow:row(),status:current(i,'ReconciliationRequired'),
  });
  assert.equal(p.nextAction,'RECONCILE_ONLY');
  assert.equal(p.step,STEPS[i]);
  assert.equal(p.endpoint,'/api/v3/operations/'+ID+'/reconcile');
  assert.equal(p.checkpoint.state,'ReconciliationRequired');
  assert.equal(p.approvalPins.D6_WP3_H2_APPROVED_STEP_PREFIX,
   STEPS.slice(0,i).join(','));
  assert.equal(p.operatorApproved,false);
 }
});

test('WP3-H2RES04 restart checkpoint advances only after fenced readback',()=>{
 const beginning=planD6Wp3H2Resume({
  receiptRow:row(),status:current(0),
 });
 const unknown=planD6Wp3H2Resume({
  receiptRow:row(),status:current(0,'ReconciliationRequired'),
  previous:beginning.checkpoint,
 });
 assert.equal(unknown.nextAction,'RECONCILE_ONLY');
 const after=planD6Wp3H2Resume({
  receiptRow:row(),status:current(1),
  previous:unknown.checkpoint,
 });
 assert.equal(after.nextAction,'REQUEST_EXACT_STEP_APPROVAL');
 assert.equal(after.step,'branch');
 const same=planD6Wp3H2Resume({
  receiptRow:row(),status:current(1),previous:after.checkpoint,
 });
 assert.deepEqual(same.checkpoint,after.checkpoint);
 rejected(()=>planD6Wp3H2Resume({
  receiptRow:row(),status:current(1),
  previous:beginning.checkpoint,
 }),'CHECKPOINT_UNOBSERVED_ADVANCE');
 rejected(()=>planD6Wp3H2Resume({
  receiptRow:row(),status:current(0),
  previous:after.checkpoint,
 }),'CHECKPOINT_PROGRESS_JUMP');
});

test('WP3-H2RES05 confirmed PR remains unmerged and requires external verification',()=>{
 const prior=planD6Wp3H2Resume({
  receiptRow:row(),status:current(4,'ReconciliationRequired'),
 });
 const complete=planD6Wp3H2Resume({
  receiptRow:row(),status:current(5,'VerifiedPr'),
  previous:prior.checkpoint,
 });
 assert.equal(complete.nextAction,'VERIFY_UNMERGED_PR_READ_ONLY');
 assert.equal(complete.prNumber,1234);
 assert.equal(complete.endpoint,null);
 assert.equal(complete.approvalPins,null);
 assert.equal(complete.operatorApproved,false);
 assert.equal(complete.canPublish,false);
 assert.equal(complete.isLive,false);
 assert.equal(complete.requiresOffRestoration,true);
});

test('WP3-H2RES06 no foreign, Unknown, malformed or mismatched receipt is trusted',()=>{
 for(const bad of [
  {owner_github_id:1},{idempotency_key:'some-other-key_0000'},
  {domain:'gear'},{operation_kind:'edit'},{record_id:'actual-gear'},
  {state:'Unknown'},{source_revision:'z'.repeat(40)},
  {snapshot_sha256:'invalid'},
  {created_at:-1},{updated_at:NOW-100},
  {operation_id:'wrong'}, {operation_id:null},
 ]){
  rejected(()=>planD6Wp3H2Resume({
   receiptRow:{...row(),...bad},status:current(),
  }),'UNTRUSTED_RECEIPT');
 }
});

test('WP3-H2RES07 client or contradictory lifecycle state cannot create a pin',()=>{
 for(const bad of [
  {ok:false},{operationId:'invalid'},
  {operationId:'123e4567-e89b-42d3-a456-426614174009'},
  {sourceRevision:'b'.repeat(40)},
  {state:'Live'},{step:'pr'},
  {verifiedSteps:['branch']},{verifiedSteps:['tree','tree']},
  {canPublish:true},{isLive:true},{sourceOnly:false},
  {safeToRetryWrite:true},{requiresHostedReleaseProof:false},
  {prNumber:99},
 ]){
  const proposed={...current(),...bad};
  assert.throws(()=>planD6Wp3H2Resume({
   receiptRow:row(),status:proposed,
  }),D6Wp3H2ResumeError);
 }
 rejected(()=>planD6Wp3H2Resume({
  receiptRow:row(),status:current(5,'VerifiedPr'),
  previous:{operationId:'wrong',sourceRevision:SHA,
   state:'ReconciliationRequired',step:'pr',
   verifiedSteps:STEPS.slice(0,4)},
 }),'INVALID_CHECKPOINT');
});

test('WP3-H2RES08 untrusted checkpoint cannot authorize step or skip',()=>{
 const p=planD6Wp3H2Resume({receiptRow:row(),status:current()});
 rejected(()=>planD6Wp3H2Resume({
  receiptRow:row(),status:current(),
  previous:{...p.checkpoint,sourceRevision:'f'.repeat(40)},
 }),'CHECKPOINT_IDENTITY_CHANGED');
 rejected(()=>planD6Wp3H2Resume({
  receiptRow:row(),status:current(2),
  previous:p.checkpoint,
 }),'CHECKPOINT_PROGRESS_JUMP');
 rejected(()=>planD6Wp3H2Resume({
  receiptRow:row(),status:current(),
  previous:{...p.checkpoint,state:'ReconciliationRequired'},
 }),'CHECKPOINT_REGRESSION');
});

test('WP3-H2RES09 proposed pins alone cannot activate actual server authorizer',async()=>{
 const p=planD6Wp3H2Resume({receiptRow:row(),status:current(2)});
 const deny=createD6Wp3H2OperatorApproval({
  env:{...p.approvalPins},now:()=>NOW,cryptoApi:webcrypto,
 });
 assert.equal(deny.approved(),false);
 assert.equal(await deny.authorizeStep({
  operationId:ID,step:'commit',domain:'kb',recordId:RECORD,
  sourceRevision:SHA,verifiedSteps:['tree','branch'],
 }),false);
});

test('WP3-H2RES10 no provider client, D1 writer or hidden grant in module',()=>{
 const src=readFileSync(new URL(
  '../server/d6-wp3-h2-resume-plan.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(src,/fetch\(|\.run\(|wrangler|issueWriteToken/);
 assert.doesNotMatch(src,/operatorApproved:true|canActivate:true/);
 assert.doesNotMatch(src,/method:'POST'|https:\/\/api\.github\.com/);
});
