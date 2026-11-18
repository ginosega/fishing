/**
 * FISH-TODO-118 WP3 H2 — source-only, read-only resume planning guard.
 *
 * This checks two INDEPENDENT operator observations: a fresh raw isolated
 * WP3_DB receipt row and the owner-authorized D1-derived /status response.
 * It emits an advisory NEXT step, not a server approval, deploy command,
 * HTTP client, token, provider mutation, or durable D1/hosted proof.
 *
 * Operators must independently fetch both observations every time; passing
 * caller-supplied JSON here NEVER authenticates it. A persisted checkpoint
 * is a rollback alarm, never a source of authority or a replay permission.
 */
import {
 D6_WP3_H2_SYNTHETIC_TEST_NAME as NAME,
 D6_WP3_H2_SYNTHETIC_RECORD_ID as RECORD,
 D6_WP3_H2_SYNTHETIC_NOTES_PATH as NOTES,
 D6_WP3_H2_SYNTHETIC_IDEMPOTENCY_KEY as KEY,
} from './d6-wp3-h2-synthetic-kb-fixture.mjs';

const OWNER=265665562;
const STEPS=Object.freeze(['tree','branch','commit','advance','pr']);
const SHA=/^[a-f0-9]{40}$/;
const DIGEST=/^[a-f0-9]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATES=new Set([
 'AwaitingAuthorizedWrite','ReconciliationRequired','VerifiedPr',
]);

export class D6Wp3H2ResumeError extends Error {
 constructor(code) {
  super('H2 operator resume proof denied');
  this.name='D6Wp3H2ResumeError';
  this.code=code;
 }
}
const deny=code=>{throw new D6Wp3H2ResumeError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
 Object.getPrototypeOf(v)===Object.prototype;
const prefix=v=>Array.isArray(v)&&v.length<=STEPS.length&&
 v.every((step,i)=>step===STEPS[i]);
const validStep=(state,step,verifiedSteps)=>{
 if(state==='VerifiedPr')
  return step===null&&verifiedSteps.length===STEPS.length;
 return verifiedSteps.length<STEPS.length&&
  step===STEPS[verifiedSteps.length];
};
const statusOf=v=>{
 need(plain(v)&&v.ok===true&&
  UUID.test(v.operationId??'')&&SHA.test(v.sourceRevision??'')&&
  STATES.has(v.state)&&prefix(v.verifiedSteps)&&
  validStep(v.state,v.step,v.verifiedSteps)&&
  v.sourceOnly!==true?false:true,'INVALID_STATUS');
 // Explicit checks below keep all returned operator observations fail closed.
 need(v.sourceOnly===true&&v.canPublish===false&&v.isLive===false&&
  v.requiresHostedReleaseProof===true&&
  v.safeToRetryWrite===false,'UNTRUSTED_STATUS');
 if(v.state==='VerifiedPr')
  need(Number.isSafeInteger(v.prNumber)&&v.prNumber>0,
   'UNVERIFIED_PR');
 else need(v.prNumber===undefined,'UNTRUSTED_STATUS');
 return v;
};

function checkPrevious(previous,current) {
 if(previous===undefined||previous===null)return;
 need(plain(previous)&&UUID.test(previous.operationId??'')&&
  SHA.test(previous.sourceRevision??'')&&STATES.has(previous.state)&&
  prefix(previous.verifiedSteps)&&
  validStep(previous.state,previous.step,previous.verifiedSteps),
  'INVALID_CHECKPOINT');
 need(previous.operationId===current.operationId&&
  previous.sourceRevision===current.sourceRevision,
  'CHECKPOINT_IDENTITY_CHANGED');
 const a=previous.verifiedSteps.length,b=current.verifiedSteps.length;
 need(b>=a&&b<=a+1,'CHECKPOINT_PROGRESS_JUMP');
 need(previous.verifiedSteps.every((s,i)=>current.verifiedSteps[i]===s),
  'CHECKPOINT_PROGRESS_CHANGED');
 if(b===a){
  need(previous.step===current.step&&
   !(previous.state==='ReconciliationRequired'&&
    current.state==='AwaitingAuthorizedWrite')&&
   !(previous.state==='VerifiedPr'&&current.state!=='VerifiedPr'),
   'CHECKPOINT_REGRESSION');
 }else{
  // A fenced Unknown step must first obtain independent readback proof.
  // Never interpret one more verified step as a valid automatic retry.
  need(previous.state==='ReconciliationRequired'&&
   previous.step===STEPS[a]&&current.verifiedSteps[a]===previous.step,
   'CHECKPOINT_UNOBSERVED_ADVANCE');
 }
}

/**
 * Advisory, non-executable plan. The caller is responsible for fresh,
 * independently verified WP3_DB/owner-HTTP observations and separate approval.
 */
export function planD6Wp3H2Resume({receiptRow,status,previous}={}) {
 const row=receiptRow;
 need(plain(row)&&UUID.test(row.operation_id??'')&&
  row.owner_github_id===OWNER&&
  row.idempotency_key===KEY&&
  row.domain==='kb'&&row.operation_kind==='add'&&
  row.record_id===RECORD&&row.state==='Accepted'&&
  SHA.test(row.source_revision??'')&&
  DIGEST.test(row.snapshot_sha256??'')&&
  Number.isSafeInteger(row.created_at)&&row.created_at>0&&
  Number.isSafeInteger(row.updated_at)&&
  row.updated_at>=row.created_at,'UNTRUSTED_RECEIPT');
 const current=statusOf(status);
 need(current.operationId===row.operation_id&&
  current.sourceRevision===row.source_revision,
  'STATUS_RECEIPT_MISMATCH');
 checkPrevious(previous,current);
 const checkpoint=Object.freeze({
  operationId:current.operationId,
  sourceRevision:current.sourceRevision,
  state:current.state,step:current.step,
  verifiedSteps:Object.freeze([...current.verifiedSteps]),
 });
 const base={
  testName:NAME,recordId:RECORD,notesPath:NOTES,
  idempotencyKey:KEY,operationId:row.operation_id,
  sourceRevision:row.source_revision,
  expectedBranch:'fish-v3/publish/'+row.operation_id,
  verifiedSteps:Object.freeze([...current.verifiedSteps]),
  checkpoint,sourceOnly:true,operatorApproved:false,
  canActivate:false,canPublish:false,isLive:false,
  requiresFreshIndependentReadback:true,
 };
 if(current.state==='VerifiedPr'){
  return Object.freeze({...base,nextAction:'VERIFY_UNMERGED_PR_READ_ONLY',
   prNumber:current.prNumber,step:null,approvalPins:null,
   endpoint:null,requiresOffRestoration:true});
 }
 const step=current.step;
 const pinDraft=Object.freeze({
  D6_WP3_H2_TEST_NAME:NAME,
  D6_WP3_H2_APPROVED_PHASE:'steps',
  D6_WP3_H2_APPROVED_SOURCE_REVISION:row.source_revision,
  D6_WP3_H2_APPROVED_RECORD_ID:RECORD,
  D6_WP3_H2_APPROVED_NOTES_PATH:NOTES,
  D6_WP3_H2_APPROVED_OPERATION_ID:row.operation_id,
  D6_WP3_H2_APPROVED_STEP:step,
  D6_WP3_H2_APPROVED_STEP_PREFIX:
   STEPS.slice(0,current.verifiedSteps.length).join(','),
 });
 const reconciliation=current.state==='ReconciliationRequired';
 return Object.freeze({...base,
  nextAction:reconciliation?'RECONCILE_ONLY':'REQUEST_EXACT_STEP_APPROVAL',
  step,approvalPins:pinDraft,
  endpoint:'/api/v3/operations/'+row.operation_id+
   (reconciliation?'/reconcile':'/begin'),
  requiresOffRestoration:true,
 });
}
