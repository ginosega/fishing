/**
 * FISH-TODO-118 WP3 H2 — one authorized operator phase, SOURCE ONLY.
 *
 * NOT a Worker entrypoint, credential holder, authorization source, or
 * deployable client. All provider effects are injected by a separately
 * reviewed operator adapter with real owner approval and crash-independent
 * OFF fail-safe. This module NEVER silently advances to another Git step.
 *
 * Modes: intake (one Save POST); step (one begin, then separately observed
 * Unknown and independently read-back reconciled); reconcile (only a
 * previously fenced Unknown, with no begin or provider write).
 */
import {planD6Wp3H2Resume} from './d6-wp3-h2-resume-plan.mjs';
import {
 D6_WP3_H2_SYNTHETIC_TEST_NAME as NAME,
 D6_WP3_H2_SYNTHETIC_IDEMPOTENCY_KEY as KEY,
} from './d6-wp3-h2-synthetic-kb-fixture.mjs';

const STEPS=Object.freeze(['tree','branch','commit','advance','pr']);
const ORIGIN='https://fishing-v3-wp3-test.ginosega.workers.dev';
const WORKER='fishing-v3-wp3-test';
const REPO='ginosega/fishing';
const OWNER=265665562,REPO_ID=1350909744;
const AUTH_DB='0d8da698-87b8-4b5e-a1e7-fe6de49e5afc';
const WP3_DB='5a47841e-7874-4ec8-9fa8-be0315f6a802';
const SHA40=/^[a-f0-9]{40}$/;
const SHA64=/^[a-f0-9]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REF=/^[a-zA-Z0-9][a-zA-Z0-9._:-]{7,127}$/;
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const stepFor=v=>STEPS.includes(v);

export class D6Wp3H2PhaseError extends Error {
 constructor(code) {
  super('H2 phase action denied or incomplete');
  this.name='D6Wp3H2PhaseError';this.code=code;
 }
}
const deny=code=>{throw new D6Wp3H2PhaseError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};

export function createD6Wp3H2PhasedController({
 readPreflight,readReceipt,readOwnerStatus,verifyApproval,
 armIndependentOff,activate,sendOne,restoreOff,verifyOff,
 journal,verifyFinalPr=async()=>({verified:false}),
 now=()=>Math.floor(Date.now()/1000),
}={}) {
 const fns=[readPreflight,readReceipt,readOwnerStatus,verifyApproval,
  armIndependentOff,activate,sendOne,restoreOff,verifyOff,
  verifyFinalPr,now];
 need(fns.every(fn=>typeof fn==='function')&&
  typeof journal?.claimOnce==='function'&&
  typeof journal?.complete==='function','INVALID_ADAPTER');
 let running=false;

 function validateRequest(req) {
  const allowed=['mode','sourceRevision','artifactHead',
   'envelopeSha256','approvalRef','operationId','step','previous'];
  need(plain(req)&&Object.keys(req).every(k=>allowed.includes(k))&&
   ['intake','step','reconcile'].includes(req.mode)&&
   SHA40.test(req.sourceRevision??'')&&
   SHA40.test(req.artifactHead??'')&&
   SHA64.test(req.envelopeSha256??'')&&
   REF.test(req.approvalRef??''),'INVALID_ACTION');
  if(req.mode==='intake')need(req.operationId===undefined&&
   req.step===undefined&&req.previous===undefined,'INVALID_ACTION');
  else need(UUID.test(req.operationId??'')&&stepFor(req.step),
   'INVALID_ACTION');
 }

 function validPreflight(p,req) {
  need(plain(p)&&p.verified===true&&
   p.isolatedOrigin===ORIGIN&&p.workerName===WORKER&&
   p.repositoryFullName===REPO&&
   p.repositoryId===REPO_ID&&p.ownerGitHubId===OWNER&&
   p.authDbId===AUTH_DB&&p.wp3DbId===WP3_DB&&
   p.offVerified===true&&p.offTraffic===100&&
   UUID.test(p.offVersion??'')&&
   p.canonicalMainVerified===true&&
   p.currentMainSha===req.sourceRevision&&
   p.sourceTreeVerified===true&&p.schemaIndexesVerified===true&&
   p.workerAppApiGrantVerified===true&&
   p.ownerSessionVerified===true&&
   p.exactArtifactVerified===true&&
   p.artifactHead===req.artifactHead&&
   p.syntheticRecordAbsent===true&&
   p.envelopeSha256===req.envelopeSha256&&
   p.otherActiveOperationAbsent===true,
   'PREFLIGHT_UNVERIFIED');
  if(req.mode==='intake')
   need(p.noExistingSyntheticReceipt===true,'INTAKE_ALREADY_ATTEMPTED');
  else need(p.operationId===req.operationId&&
   p.existingAcceptedReceipt===true,'OPERATION_UNVERIFIED');
  return p;
 }

 function validateApproval(a,req,p) {
  const t=now();
  // Never carry credentials, raw auth/session context or arbitrary fields
  // into the deploy adapter or saved journal.
  const allowed=['approved','testName','mode','operationId','step',
   'sourceRevision','artifactHead','envelopeSha256','offVersion',
   'approvalRef','grantId','windowStart','windowEnd'];
  need(plain(a)&&Object.keys(a).every(k=>allowed.includes(k)),
   'APPROVAL_UNVERIFIED');
  need(a.approved===true&&
   a.testName===NAME&&a.mode===req.mode&&
   a.sourceRevision===req.sourceRevision&&
   a.artifactHead===req.artifactHead&&
   a.envelopeSha256===req.envelopeSha256&&
   a.offVersion===p.offVersion&&
   a.approvalRef===req.approvalRef&&
   (req.mode==='intake'?
    a.operationId===null&&a.step===null:
    a.operationId===req.operationId&&a.step===req.step)&&
   REF.test(a.grantId??'')&&
   Number.isSafeInteger(t)&&
   Number.isSafeInteger(a.windowStart)&&
   Number.isSafeInteger(a.windowEnd)&&
   a.windowStart>=1700000000&&
   a.windowStart<=t&&
   a.windowEnd>a.windowStart&&
   a.windowEnd-a.windowStart<=1800&&
   a.windowEnd-t>=420,'APPROVAL_UNVERIFIED');
  return a;
 }

 async function observe(req,previous,afterReadback=false) {
  const [receiptRow,status]=await Promise.all([
   readReceipt({operationId:req.operationId,mode:req.mode}),
   readOwnerStatus({operationId:req.operationId,mode:req.mode}),
  ]);
  const plan=planD6Wp3H2Resume({receiptRow,status,previous});
  const i=STEPS.indexOf(req.step);
  need(plan.operationId===req.operationId&&
   plan.sourceRevision===req.sourceRevision&&
   (afterReadback?
    i===STEPS.length-1?
     plan.nextAction==='VERIFY_UNMERGED_PR_READ_ONLY'&&
      plan.step===null&&plan.prNumber>0:
     plan.nextAction==='REQUEST_EXACT_STEP_APPROVAL'&&
      plan.step===STEPS[i+1]:
    plan.step===req.step),
   'LIFECYCLE_MISMATCH');
  return plan;
 }

 function validOff(off,p) {
  need(plain(off)&&off.verified===true&&
   off.workerName===WORKER&&
   off.version===p.offVersion&&off.traffic===100&&
   off.writeRoutesDenied===true,'OFF_UNVERIFIED');
 }

 async function executePhase(req) {
  let restoreRequired=false,p=null,grant=null,claimKey=null;
  let result;
  try{
   validateRequest(req);
   p=validPreflight(await readPreflight({
    mode:req.mode,operationId:req.operationId??null,
    step:req.step??null,sourceRevision:req.sourceRevision,
    artifactHead:req.artifactHead,envelopeSha256:req.envelopeSha256,
   }),req);
   // Independent D1 read is required before first intake. A previous browser
   // 503 is NOT permission for another Save with the same idempotency key.
   if(req.mode==='intake')
    need(await readReceipt({idempotencyKey:KEY,mode:'intake'})===null,
     'INTAKE_ALREADY_ATTEMPTED');
   grant=validateApproval(await verifyApproval({
    approvalRef:req.approvalRef,mode:req.mode,
    operationId:req.operationId??null,step:req.step??null,
    sourceRevision:req.sourceRevision,artifactHead:req.artifactHead,
    envelopeSha256:req.envelopeSha256,offVersion:p.offVersion,
   }),req,p);
   // The trusted journal adapter MUST durably create an exclusive one-shot
   // fence before ANY ON attempt. begin and intake fences never reset.
   claimKey=req.mode==='intake'?'h2-intake:'+NAME:
    req.mode==='step'?'h2-begin:'+req.operationId+':'+req.step:
     'h2-reconcile:'+req.operationId+':'+req.step+':'+grant.grantId;
   const claimed=await journal.claimOnce(claimKey,{
    mode:req.mode,operationId:req.operationId??null,
    step:req.step??null,sourceRevision:req.sourceRevision,
    approvalRef:req.approvalRef,
   });
   need(claimed===true,'ACTION_ALREADY_CLAIMED');
   restoreRequired=true;
   // An in-process try/finally alone cannot recover process termination.
   // Separate independently armed OFF supervision is mandatory.
   const deadline=Math.min(now()+300,grant.windowEnd-90);
   need(deadline-now()>=90,'WINDOW_TOO_SHORT');
   const watchdog=await armIndependentOff({
    offVersion:p.offVersion,deadline,claimKey,
   });
   need(watchdog?.armed===true&&watchdog.independent===true&&
    watchdog.workerName===WORKER&&
    watchdog.offVersion===p.offVersion&&
    Number.isSafeInteger(watchdog.deadline)&&
    watchdog.deadline>=now()+60&&
    watchdog.deadline<=deadline,'INDEPENDENT_OFF_NOT_ARMED');
   const on=await activate({
    mode:req.mode,step:req.step??null,
    operationId:req.operationId??null,grant,
    artifactHead:req.artifactHead,claimKey,
   });
   need(on?.verified===true&&on.traffic===100&&
    on.workerName===WORKER&&UUID.test(on.version??'')&&
    on.version!==p.offVersion&&
    on.sourceHead===req.artifactHead&&
    on.mode===req.mode&&
    on.step===(req.step??null)&&
    on.operationId===(req.operationId??null),'ON_UNVERIFIED');
   need(now()<deadline-30,'WINDOW_EXPIRED');

   if(req.mode==='intake'){
    // EXACTLY one Save; NO loop or retry, regardless of response/503.
    const r=await sendOne({mode:'intake',path:'/api/v3/operations',
     claimKey,sourceRevision:req.sourceRevision});
    need(r?.httpStatus===202&&UUID.test(r.operationId??'')&&
     r.sourceRevision===req.sourceRevision,'INTAKE_UNCONFIRMED');
    const nextReq={...req,operationId:r.operationId,step:'tree'};
    const plan=await observe(nextReq);
    need(plan.nextAction==='REQUEST_EXACT_STEP_APPROVAL'&&
     plan.verifiedSteps.length===0,'INTAKE_RECEIPT_UNVERIFIED');
    result={mode:'intake',operationId:r.operationId,
     nextAction:plan.nextAction,checkpoint:plan.checkpoint};
   }else{
    const before=await observe(req,req.previous);
    need(before.nextAction===(req.mode==='step'?
     'REQUEST_EXACT_STEP_APPROVAL':'RECONCILE_ONLY')&&
     before.step===req.step,'STEP_NOT_READY');
    need(now()<deadline-30,'WINDOW_EXPIRED');
    const response=await sendOne({
     mode:req.mode,path:before.endpoint,claimKey,
     operationId:req.operationId,step:req.step,
    });
    need(response?.httpStatus===(req.mode==='step'?202:200),
     'STEP_OUTCOME_UNKNOWN');
    if(req.mode==='step'){
     // A second, independent owner+D1 observation must first confirm the
     // sticky Unknown fence. Then make a distinct readback-only request.
     const fenced=await observe(req,before.checkpoint);
     need(fenced.nextAction==='RECONCILE_ONLY'&&
      fenced.step===req.step,'FENCE_UNVERIFIED');
     need(now()<deadline-30,'WINDOW_EXPIRED');
     const readback=await sendOne({
      mode:'reconcile',path:fenced.endpoint,claimKey,
      operationId:req.operationId,step:req.step,
     });
     need(readback?.httpStatus===200,'READBACK_UNKNOWN');
     const after=await observe(req,fenced.checkpoint,true);
     result={mode:'step',operationId:req.operationId,step:req.step,
      nextAction:after.nextAction,checkpoint:after.checkpoint,
      ...(after.prNumber?{prNumber:after.prNumber}:{})};
    }else{
     const after=await observe(req,before.checkpoint,true);
     result={mode:'reconcile',operationId:req.operationId,
      step:req.step,nextAction:after.nextAction,
      checkpoint:after.checkpoint,
      ...(after.prNumber?{prNumber:after.prNumber}:{})};
    }
    need(result.nextAction==='REQUEST_EXACT_STEP_APPROVAL'||
     result.nextAction==='VERIFY_UNMERGED_PR_READ_ONLY',
     'READBACK_UNVERIFIED');
    if(result.nextAction==='VERIFY_UNMERGED_PR_READ_ONLY'){
     const proof=await verifyFinalPr({
      operationId:req.operationId,prNumber:result.prNumber,
      sourceRevision:req.sourceRevision,
      expectedBranch:'fish-v3/publish/'+req.operationId,
     });
     need(proof?.verified===true&&proof.unmerged===true&&
      proof.mainUnchanged===true&&proof.onlySyntheticKbDiff===true,
      'PR_NOT_INDEPENDENTLY_VERIFIED');
     result.finalPrVerified=true;
    }
   }
  }finally{
   // Always attempt independent OFF restoration once an exclusive action
   // was claimed—even if watchdog, ON, network, D1, or readback fails.
   try{
    if(restoreRequired){
     await restoreOff({offVersion:p.offVersion,claimKey});
     validOff(await verifyOff({offVersion:p.offVersion}),p);
    }
   }catch{deny('OFF_UNVERIFIED');}
  }
  // Only after the off verification is this successful phase durable as
  // an operator report. Failure to persist keeps its one-shot claim burned.
  need(result!==undefined,'ACTION_INCOMPLETE');
  await journal.complete(claimKey,{
   mode:result.mode,operationId:result.operationId,
   step:result.step??null,nextAction:result.nextAction,
   checkpoint:result.checkpoint,
   prNumber:result.prNumber??null,
   ...(result.finalPrVerified?{finalPrVerified:true}:{}),
  });
  return Object.freeze({
   ...result,canPublish:false,isLive:false,
   offVerified:true,sourceOnly:true,
  });
 }

 // Serialize through durable audit completion as well as provider OFF
 // restoration; no second phase starts while this one is still being logged.
 async function runPhase(req) {
  need(!running,'CONCURRENT_CONTROLLER');
  running=true;
  try{return await executePhase(req);}
  finally{running=false;}
 }
 return Object.freeze({runPhase});
}
