/**
 * FISH-TODO-118 WP3 — one-step owner publishing dispatcher.
 *
 * SOURCE ONLY / DEFAULT OFF / NO HTTP ROUTE, D1 MIGRATION OR DEPLOYMENT.
 * This is the single, bounded server-side decision surface between the
 * existing D1 proof-chain recovery lifecycle and its five already-fenced
 * provider coordinators. It never mints a token or supplies a provider route.
 *
 * Inspect/reconcile are readback-only; beginOne requires a separate trusted
 * server approval for the EXACT next step and permits at most one existing
 * coordinator attempt. It then re-reads D1, never trusts an HTTP response as
 * publication, and never advances to the next step in the same invocation.
 * A missing/lost acknowledgement leaves an Unknown fence; retry is denied.
 */
import {D6_PUBLISH_REPOSITORY as REPO}
 from './d6-production-publish-intake.mjs';

const STEPS=Object.freeze(['tree','branch','commit','advance','pr']);
const SHA=/^[a-f0-9]{40}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export class D6PublishStepDispatcherError extends Error{
 constructor(code){
  super('WP3 publishing step dispatcher cannot authorize transition');
  this.name='D6PublishStepDispatcherError';this.code=code;
 }
}
const deny=code=>{throw new D6PublishStepDispatcherError(code);};
const need=(v,code)=>{if(!v)deny(code);};
const prefix=steps=>Array.isArray(steps)&&steps.length<=STEPS.length&&
 steps.every((step,i)=>step===STEPS[i]);
function inspect(state,id){
 need(state&&state.operationId===id&&
  ['gear','kb','catches'].includes(state.domain)&&
  typeof state.recordId==='string'&&state.recordId.length>0&&
  SHA.test(state.sourceRevision??'')&&
  prefix(state.verifiedSteps)&&
  state.sourceOnly===true&&state.canPublish===false&&
  state.isLive===false&&state.requiresHostedReleaseProof===true,
  'UNTRUSTED_LIFECYCLE');
 if(state.state==='VerifiedPr'){
  need(state.verifiedSteps.length===STEPS.length&&
   state.step===null&&state.requiresGuardedMerge===true&&
   Number.isSafeInteger(state.prNumber)&&state.prNumber>0,
   'UNTRUSTED_LIFECYCLE');
 }else{
  need(['AwaitingAuthorizedWrite','ReconciliationRequired']
   .includes(state.state)&&state.step===STEPS[state.verifiedSteps.length]&&
   state.verifiedSteps.length<STEPS.length&&
   state.safeToRetryWrite===false,
   'UNTRUSTED_LIFECYCLE');
 }
 return state;
}
function stable(a,b){
 return a.operationId===b.operationId&&
  a.domain===b.domain&&a.recordId===b.recordId&&
  a.sourceRevision===b.sourceRevision&&
  a.state===b.state&&a.step===b.step&&
  JSON.stringify(a.verifiedSteps)===JSON.stringify(b.verifiedSteps);
}
export function createD6ProductionPublishStepDispatcher({
 session,lifecycle,coordinators,enabled=()=>false,
 writeEnabled=()=>false,authorizeStep=async()=>false,
}={}){
 need(typeof session?.authorizeWrite==='function'&&
  typeof lifecycle?.inspect==='function'&&
  typeof lifecycle?.reconcile==='function'&&
  coordinators&&STEPS.every(step=>
   typeof coordinators[step]?.attempt==='function')&&
  typeof enabled==='function'&&typeof writeEnabled==='function'&&
  typeof authorizeStep==='function',
  'INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 const writable=()=>need(writeEnabled()===true,'WRITE_DISABLED');
 async function owner(request,operationId){
  active();
  need(request instanceof Request&&request.method==='POST'&&
   UUID.test(operationId??''),'INVALID_REQUEST');
  let verified;
  try{verified=await session.authorizeWrite(request);}
  catch{deny('OWNER_DENIED');}
  need(verified?.authorized===true&&
   verified.ownerGitHubId===REPO.ownerGitHubId,'OWNER_DENIED');
  active();
 }
 async function observe(request,operationId){
  await owner(request,operationId);
  let status;
  try{status=await lifecycle.inspect(request,operationId);}
  catch{deny('LIFECYCLE_UNAVAILABLE');}
  return inspect(status,operationId);
 }
 async function current(request,operationId){
  return observe(request,operationId);
 }
 async function reconcileOne(request,operationId){
  const before=await observe(request,operationId);
  need(before.state==='ReconciliationRequired',
   'NOTHING_TO_RECONCILE');
  const index=before.verifiedSteps.length;
  // Existing lifecycle permits ONLY independent GET readback on a fenced
  // step. No direct provider POST/PATCH is available on this interface.
  await lifecycle.reconcile(request,operationId);
  const after=await observe(request,operationId);
  need(after.operationId===before.operationId&&
   after.sourceRevision===before.sourceRevision&&
   after.domain===before.domain&&after.recordId===before.recordId&&
   after.verifiedSteps.length===index+1&&
   after.verifiedSteps[index]===before.step&&
   (index===STEPS.length-1?
    after.state==='VerifiedPr':
    after.state==='AwaitingAuthorizedWrite'&&
     after.step===STEPS[index+1]),
   'RECONCILIATION_UNVERIFIED');
  return after;
 }
 async function beginOne(request,operationId){
  active();writable();
  const before=await observe(request,operationId);
  need(before.state==='AwaitingAuthorizedWrite','NOT_READY');
  const step=before.step;
  let grant;
  try{
   grant=await authorizeStep(Object.freeze({
    operationId,step,domain:before.domain,recordId:before.recordId,
    sourceRevision:before.sourceRevision,
    verifiedSteps:Object.freeze([...before.verifiedSteps]),
   }));
  }catch{deny('STEP_NOT_APPROVED');}
  need(grant===true,'STEP_NOT_APPROVED');
  // Approval is for ONE precise D1 transition, not a chain. In
  // particular, approval cannot convert a sticky Unknown into a retry.
  active();writable();
  const fresh=await observe(request,operationId);
  need(stable(before,fresh),'STEP_MOVED');
  active();writable();
  const result=await coordinators[step].attempt(request,operationId);
  need(result?.operationId===operationId&&result.state==='Unknown'&&
   result.sourceOnly===true&&result.isLive===false&&
   result.canPublish===false&&
   (result.stepKey===step||step==='branch'&&result.refName!==undefined),
   'UNVERIFIED_ATTEMPT');
  // No outcome of the provider POST/PATCH is promoted; only D1 Unknown
  // evidence is returned. A subsequent distinct call must reconcile.
  const after=await observe(request,operationId);
  need(after.state==='ReconciliationRequired'&&
   after.step===step&&after.sourceRevision===before.sourceRevision&&
   after.domain===before.domain&&after.recordId===before.recordId&&
   JSON.stringify(after.verifiedSteps)===
    JSON.stringify(before.verifiedSteps),
   'FENCE_NOT_CONFIRMED');
  return after;
 }
 return Object.freeze({current,reconcileOne,beginOne});
}
