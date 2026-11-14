import test from 'node:test';
import assert from 'node:assert/strict';
import {D6_PUBLISH_REPOSITORY as REPO,
 D6_PUBLISH_INTAKE_ORIGIN as ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionPublishStepDispatcher,
 D6PublishStepDispatcherError}
 from '../../experiments/p3/preview/src/d6-production-publish-step-dispatcher.mjs';

const ID='123e4567-e89b-42d3-a456-426614174000';
const SHA='a'.repeat(40);
const STEPS=['tree','branch','commit','advance','pr'];
const auth=()=>new Request(ORIGIN+'/api/v3/operations',{method:'POST'});
const denied=(promise,code)=>assert.rejects(promise,e=>
 e instanceof D6PublishStepDispatcherError&&e.code===code);

function harness({enabled=true,writeEnabled=true,owner=true,
 approved=true,loseAck=false,alterAttempt=false,
 tamper=null,approvalHook=null,readFail=false}={}){
 const s={enabled,writeEnabled,owner,approved,loseAck,alterAttempt,
  verified:0,fenced:null,auth:0,reads:0,attempts:[],approvals:[],
  reconciliations:[],tamper,readFail};
 const view=()=>{
  const finished=s.verified===STEPS.length;
  const result={
   operationId:ID,domain:'catches',recordId:'catch-1',
   sourceRevision:SHA,
   state:finished?'VerifiedPr':
    s.fenced?'ReconciliationRequired':'AwaitingAuthorizedWrite',
   step:finished?null:STEPS[s.verified],
   verifiedSteps:STEPS.slice(0,s.verified),
   sourceOnly:true,canPublish:false,isLive:false,
   requiresHostedReleaseProof:true,
   ...(finished?{requiresGuardedMerge:true,prNumber:42}:
    {safeToRetryWrite:false}),
  };
  if(s.tamper)Object.assign(result,s.tamper);
  return result;
 };
 const session={authorizeWrite:async()=>{
  s.auth++;if(!s.owner)throw Error('denied');
  return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
 }};
 const lifecycle={
  inspect:async()=>{s.reads++;if(s.readFail)throw Error('DB failed');return view();},
  reconcile:async()=>{
   if(!s.fenced)throw Error('no fence');
   s.reconciliations.push(s.fenced);
   s.verified++;s.fenced=null;
   return view();
  },
 };
 const coordinators=Object.fromEntries(STEPS.map(step=>[step,{
  attempt:async()=>{
   s.attempts.push(step);
   if(s.fenced||STEPS[s.verified]!==step)throw Error('untrusted step');
   s.fenced=step;
   if(s.loseAck){s.loseAck=false;throw Error('lost fence ack');}
   return {operationId:ID,stepKey:step,state:'Unknown',
    sourceOnly:true,isLive:false,canPublish:false,
    ...(s.alterAttempt?{canPublish:true}:{})};
  },
 }]));
 const authorizeStep=async claim=>{
  s.approvals.push(claim);
  if(approvalHook)await approvalHook(s,claim);
  return s.approved;
 };
 const driver=createD6ProductionPublishStepDispatcher({
  session,lifecycle,coordinators,authorizeStep,
  enabled:()=>s.enabled,writeEnabled:()=>s.writeEnabled,
 });
 return {driver,s,view};
}

test('WP3-DISP01 default OFF blocks all access and never accesses D1/provider',async()=>{
 const x=harness({enabled:false});
 await denied(x.driver.current(auth(),ID),'DISABLED');
 await denied(x.driver.beginOne(auth(),ID),'DISABLED');
 await denied(x.driver.reconcileOne(auth(),ID),'DISABLED');
 assert.equal(x.s.auth,0);assert.equal(x.s.reads,0);
 assert.equal(x.s.attempts.length,0);
});

test('WP3-DISP02 source observation is owner gated, non-Live, no mutation',async()=>{
 const x=harness();
 const state=await x.driver.current(auth(),ID);
 assert.equal(state.state,'AwaitingAuthorizedWrite');
 assert.equal(state.step,'tree');assert.equal(state.isLive,false);
 assert.equal(state.canPublish,false);
 assert.equal(state.safeToRetryWrite,false);
 assert.deepEqual(x.s.attempts,[]);
 assert.deepEqual(x.s.approvals,[]);
 const deniedOwner=harness({owner:false});
 await denied(deniedOwner.driver.current(auth(),ID),'OWNER_DENIED');
 assert.equal(deniedOwner.s.reads,0);
 await denied(x.driver.current(new Request(ORIGIN),ID),'INVALID_REQUEST');
 await denied(x.driver.current(auth(),'bad-id'),'INVALID_REQUEST');
});

test('WP3-DISP03 independent write enable AND server per-step approval required',async()=>{
 const disabled=harness({writeEnabled:false});
 await denied(disabled.driver.beginOne(auth(),ID),'WRITE_DISABLED');
 assert.equal(disabled.s.reads,0);
 const deniedStep=harness({approved:false});
 await denied(deniedStep.driver.beginOne(auth(),ID),'STEP_NOT_APPROVED');
 assert.equal(deniedStep.s.attempts.length,0);
 assert.equal(deniedStep.s.approvals[0].step,'tree');
 assert.deepEqual(deniedStep.s.approvals[0].verifiedSteps,[]);
});

test('WP3-DISP04 one deliberate write per invocation; recovery only by distinct GET',async()=>{
 const x=harness();
 for(let i=0;i<STEPS.length;i++){
  const before=await x.driver.current(auth(),ID);
  assert.equal(before.state,'AwaitingAuthorizedWrite');
  assert.equal(before.step,STEPS[i]);
  const pending=await x.driver.beginOne(auth(),ID);
  assert.equal(pending.state,'ReconciliationRequired');
  assert.equal(pending.step,STEPS[i]);
  assert.equal(pending.isLive,false);
  assert.equal(x.s.attempts.length,i+1);
  await denied(x.driver.beginOne(auth(),ID),'NOT_READY');
  assert.equal(x.s.attempts.length,i+1);
  const verified=await x.driver.reconcileOne(auth(),ID);
  assert.equal(verified.verifiedSteps.length,i+1);
  assert.equal(verified.isLive,false);
  assert.equal(x.s.reconciliations.length,i+1);
 }
 assert.deepEqual(x.s.attempts,STEPS);
 assert.deepEqual(x.s.reconciliations,STEPS);
 const finished=await x.driver.current(auth(),ID);
 assert.equal(finished.state,'VerifiedPr');
 assert.equal(finished.prNumber,42);
 assert.equal(finished.canPublish,false);
 assert.equal(finished.isLive,false);
 await denied(x.driver.beginOne(auth(),ID),'NOT_READY');
 await denied(x.driver.reconcileOne(auth(),ID),'NOTHING_TO_RECONCILE');
});

test('WP3-DISP05 source, approval or step moves revoke pending authorization',async()=>{
 const x=harness({approvalHook:s=>{s.fenced='tree';}});
 await denied(x.driver.beginOne(auth(),ID),'STEP_MOVED');
 assert.deepEqual(x.s.attempts,[]);
 const revoked=harness({approvalHook:s=>{s.writeEnabled=false;}});
 await denied(revoked.driver.beginOne(auth(),ID),'WRITE_DISABLED');
 assert.deepEqual(revoked.s.attempts,[]);
 const noOwner=harness({approvalHook:s=>{s.owner=false;}});
 await denied(noOwner.driver.beginOne(auth(),ID),'OWNER_DENIED');
 assert.deepEqual(noOwner.s.attempts,[]);
});

test('WP3-DISP06 lost first D1 acknowledgement leaves Unknown; no blind retry',async()=>{
 const x=harness({loseAck:true});
 await assert.rejects(x.driver.beginOne(auth(),ID),/lost fence ack/);
 assert.equal((await x.driver.current(auth(),ID)).state,
  'ReconciliationRequired');
 assert.equal(x.s.attempts.length,1);
 await denied(x.driver.beginOne(auth(),ID),'NOT_READY');
 assert.equal(x.s.attempts.length,1);
 const after=await x.driver.reconcileOne(auth(),ID);
 assert.equal(after.state,'AwaitingAuthorizedWrite');
 assert.equal(after.step,'branch');
 assert.deepEqual(x.s.reconciliations,['tree']);
});

test('WP3-DISP07 corrupt status, missing D1, forged coordinator response denied',async()=>{
 for(const tamper of [
  {sourceRevision:'forged'},
  {verifiedSteps:['branch']},
  {step:'pr'},
  {state:'Live'},
  {isLive:true},
  {safeToRetryWrite:true},
 ]){
  const x=harness({tamper});
  await denied(x.driver.beginOne(auth(),ID),'UNTRUSTED_LIFECYCLE');
  assert.equal(x.s.attempts.length,0);
 }
 const down=harness({readFail:true});
 await denied(down.driver.current(auth(),ID),'LIFECYCLE_UNAVAILABLE');
 const fake=harness({alterAttempt:true});
 await denied(fake.driver.beginOne(auth(),ID),'UNVERIFIED_ATTEMPT');
 assert.equal(fake.s.attempts.length,1);
 assert.equal((await fake.driver.current(auth(),ID)).state,
  'ReconciliationRequired');
 await denied(fake.driver.beginOne(auth(),ID),'NOT_READY');
});

test('WP3-DISP08 recovery never writes and never validates missing fence',async()=>{
 const x=harness();
 await denied(x.driver.reconcileOne(auth(),ID),'NOTHING_TO_RECONCILE');
 assert.deepEqual(x.s.attempts,[]);
 assert.deepEqual(x.s.reconciliations,[]);
 const y=harness({owner:false});
 await denied(y.driver.reconcileOne(auth(),ID),'OWNER_DENIED');
 assert.deepEqual(y.s.attempts,[]);
});

test('WP3-DISP09 exported surface contains no route, merge, auto-publish or retry',()=>{
 const x=harness();
 assert.deepEqual(Object.keys(x.driver).sort(),
  ['current','reconcileOne','beginOne'].sort());
 for(const key of ['publish','merge','autoRetry','handleRequest',
  'deploy','activate'])assert.equal(key in x.driver,false);
});
