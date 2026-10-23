/**
 * FISH118 P3-12 source-only, read-only sandbox CI coordinator.
 *
 * P3 Checking may accumulate durable retry/review/pass evidence but NEVER
 * advances to Merging or issues a GitHub write. No Worker route or deployment.
 * Exact receipt comes only from the owner-scoped, leased D1 operation.
 */
const ID=1430581407;
const OP=/^p3_[0-9a-f-]{36}$/;
const SHA=/^[a-f0-9]{40}$/;
const MAX=12;
const RETRY=new Set([
 'CHECK_PENDING','CHECK_MISSING_OR_AMBIGUOUS',
 'GITHUB_READ_FAILED','GITHUB_NETWORK_ERROR','INVALID_GITHUB_JSON',
]);
const result=(operationId,state,code,extra={})=>Object.freeze({
 operationId,state,reasonCode:code,...extra,canMerge:false,canDeploy:false,
});
const reasonCode=e=>typeof e?.code==='string'&&/^[A-Z_]{3,60}$/.test(e.code)?
 e.code:'UNKNOWN_CHECK_ERROR';
const branchOf=id=>'p3-test-'+id.slice(3);
const goodId=n=>Number.isSafeInteger(n)&&n>0;
const matches=(r,expected)=>r?.operationId===expected.operationId&&
 r?.state==='Checking'&&r?.prNumber===expected.prNumber&&
 r?.prHeadSha===expected.prHeadSha&&r?.mainBaseSha===expected.mainBaseSha;
const verified=(v,r)=>v?.repositoryId===ID&&v?.prNumber===r.prNumber&&
 v?.headSha===r.prHeadSha&&v?.baseSha===r.mainBaseSha&&
 v?.checkName==='validate-sandbox-head'&&v?.actionsAppId===15368&&
 v?.checkObserved==='success'&&goodId(v?.checkRunId)&&
 v?.canMerge===false&&v?.canDeploy===false;
const delay=attempt=>Math.min(600,15*2**Math.min(attempt-1,5));

export function createSandboxCheckCoordinator({
 store,checkStore,observer,now=()=>Math.floor(Date.now()/1000),
 enabled=()=>false,makeLease=()=> 'p3-check-'+crypto.randomUUID(),
}={}){
 if(typeof store?.get!=='function'||typeof store?.claim!=='function'||
  typeof checkStore?.get!=='function'||typeof checkStore?.record!=='function'||
  typeof checkStore?.release!=='function'||typeof observer?.observe!=='function'||
  typeof now!=='function'||typeof enabled!=='function'||typeof makeLease!=='function')
  throw Error('INVALID_CHECK_COORDINATOR_CONFIGURATION');

 async function checkOnce(operationId){
  if(enabled()!==true)return result(operationId,'Disabled','CHECK_READER_DISABLED');
  if(typeof operationId!=='string'||!OP.test(operationId))
   return result(operationId,'NeedsReview','INVALID_OPERATION');
  let initial;
  try{initial=await store.get(operationId);}
  catch{return result(operationId,'NeedsReview','DURABLE_READ_FAILED');}
  if(initial?.state!=='Checking')return result(operationId,'NotChecking','CHECK_STATE_DENIED');
  if(!goodId(initial.prNumber)||!SHA.test(initial.prHeadSha??'')||
   !SHA.test(initial.mainBaseSha??'')||
   initial.prHeadSha===initial.mainBaseSha)
   return result(operationId,'NeedsReview','INCOMPLETE_OPERATION_RECEIPT');

  const leaseOwner=makeLease();
  let claimed;
  try{claimed=await store.claim({operationId,leaseOwner});}
  catch{return result(operationId,'NeedsReview','CLAIM_FAILED');}
  if(!claimed)return result(operationId,'Unclaimed','LEASE_UNAVAILABLE');

  let outcome=result(operationId,'NeedsReview','CHECK_NOT_COMPLETED');
  let released=false;
  try{
   if(claimed?.state!=='Checking'){
    outcome=result(operationId,'NeedsReview','CHECK_STATE_CHANGED');
   }else{
    const current=await store.get(operationId);
    if(!matches(current,initial)){
     outcome=result(operationId,'NeedsReview','DURABLE_RECEIPT_CHANGED');
    }else{
     const old=await checkStore.get(operationId);
     const at=now();
     if(!Number.isSafeInteger(at)||at<0){
      outcome=result(operationId,'NeedsReview','INVALID_CLOCK');
     }else if(old&&(
      old.repositoryId!==ID||old.prNumber!==initial.prNumber||
      old.headSha!==initial.prHeadSha||old.baseSha!==initial.mainBaseSha||
      old.branch!==branchOf(operationId))){
      outcome=result(operationId,'NeedsReview','STORED_RECEIPT_MISMATCH');
     }else if(old?.state==='passed'){
      // Historical proof is not re-used as a fresh merge authorization.
      outcome=result(operationId,'ManualReview','CI_ALREADY_RECORDED',
       {checkRunId:old.checkRunId,attempts:old.attempts});
     }else if(old?.state==='review'){
      outcome=result(operationId,'ManualReview','CI_REVIEW_REQUIRED',
       {attempts:old.attempts});
     }else if(old&&old.nextPollAt>at){
      outcome=result(operationId,'Deferred','RETRY_NOT_DUE',
       {nextPollAt:old.nextPollAt,attempts:old.attempts});
     }else{
      const attempts=(old?.attempts??0)+1;
      if(attempts>MAX){
       outcome=result(operationId,'ManualReview','RETRY_LIMIT');
      }else{
       let state='passed',checkRunId=null,code=null;
       try{
        const seen=await observer.observe({
         repositoryId:ID,prNumber:initial.prNumber,
         expectedHeadSha:initial.prHeadSha,
         expectedBaseSha:initial.mainBaseSha,
         expectedBranch:branchOf(operationId),
        });
        if(!verified(seen,initial)){state='review';code='ci_untrusted_evidence';}
        else checkRunId=seen.checkRunId;
       }catch(error){
        const codeFromObserver=reasonCode(error);
        state=RETRY.has(codeFromObserver)?'retry':'review';
        code=state==='retry'?'ci_temporarily_unavailable':'ci_requires_review';
       }
       if(state==='retry'&&attempts===MAX){
        state='review';code='ci_retry_exhausted';
       }
       const nextPollAt=state==='retry'?at+delay(attempts):null;
       const saved=await checkStore.record({
        operationId,leaseOwner,prNumber:initial.prNumber,
        headSha:initial.prHeadSha,baseSha:initial.mainBaseSha,
        expectedAttempts:attempts-1,state,
        checkRunId:state==='passed'?checkRunId:null,
        reasonCode:code,nextPollAt,
       });
       if(!saved){
        outcome=result(operationId,'NeedsReview','LEASE_OR_RECEIPT_CHANGED');
       }else{
        outcome=result(operationId,
         state==='passed'?'ManualReview':state==='retry'?'RetryScheduled':'ManualReview',
         state==='passed'?'CI_SUCCESS_RECORDED':state==='retry'?'CI_RETRY_SCHEDULED':'CI_REVIEW_REQUIRED',
         {attempts:saved.attempts,checkRunId:saved.checkRunId,nextPollAt:saved.nextPollAt});
       }
      }
     }
    }
   }
  }catch{
   // Do not leak private GitHub exception messages or assume writes succeeded.
   outcome=result(operationId,'NeedsReview','CHECK_RECONCILIATION_REQUIRED');
  }finally{
   try{released=await checkStore.release({operationId,leaseOwner});}
   catch{released=false;}
  }
  if(!released)return result(operationId,'NeedsReview','LEASE_RELEASE_UNCONFIRMED');
  return outcome;
 }
 return Object.freeze({checkOnce});
}
