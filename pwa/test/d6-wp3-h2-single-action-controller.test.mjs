import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD6Wp3H2PhasedController,D6Wp3H2PhaseError}
 from '../server/d6-wp3-h2-single-action-controller.mjs';

const NAME='WP3-H2-SYNTH-KB-001',ID='123e4567-e89b-42d3-a456-426614174000';
const SOURCE='a'.repeat(40),HEAD='c'.repeat(40),ENVELOPE='d'.repeat(64);
const OFF='b552efc6-a24c-4ca1-ab6c-b88a68c99ff0';
const STEPS=['tree','branch','commit','advance','pr'],NOW=2000000000;
const REF='H2-20261118-AUTH-0001';
const input=(mode,step)=>({
 mode,sourceRevision:SOURCE,artifactHead:HEAD,envelopeSha256:ENVELOPE,
 approvalRef:REF,
 ...(mode==='intake'?{}:{operationId:ID,step}),
});
const receipt=()=>({
 operation_id:ID,owner_github_id:265665562,
 idempotency_key:'wp3_h2_synthetic_kb_001',domain:'kb',
 operation_kind:'add',record_id:'h2-synthetic-kb-publishing-proof',
 state:'Accepted',source_revision:SOURCE,snapshot_sha256:'b'.repeat(64),
 created_at:NOW-100,updated_at:NOW-90,
});
const lifecycle=(stepIndex=0,state='AwaitingAuthorizedWrite')=>({
 ok:true,operationId:ID,sourceRevision:SOURCE,state,
 step:state==='VerifiedPr'?null:STEPS[stepIndex],
 verifiedSteps:STEPS.slice(0,stepIndex),sourceOnly:true,
 isLive:false,canPublish:false,requiresHostedReleaseProof:true,
 safeToRetryWrite:false,
 ...(state==='VerifiedPr'?{prNumber:405}:{}),
});
const deny=async(p,code)=>await assert.rejects(p,e=>
 e instanceof D6Wp3H2PhaseError&&e.code===code);

function harness({
 mode='step',step='tree',initial='AwaitingAuthorizedWrite',
 preflightPatch={},grantPatch={},watchdogPatch={},onPatch={},
 offPatch={},failSend=null,failReconcile=false,prPatch={},
 noFenceAfterBegin=false,noProofAfterReconcile=false,
 delayBeforeActivate=null,
}={}) {
 const calls=[],claimed=new Set(),completed=new Map();
 let index=STEPS.indexOf(step),state=initial;
 const p={
  verified:true,isolatedOrigin:'https://fishing-v3-wp3-test.ginosega.workers.dev',
  workerName:'fishing-v3-wp3-test',
  authDbId:'0d8da698-87b8-4b5e-a1e7-fe6de49e5afc',
  wp3DbId:'5a47841e-7874-4ec8-9fa8-be0315f6a802',
  offVerified:true,offTraffic:100,offVersion:OFF,
  canonicalMainVerified:true,currentMainSha:SOURCE,
  sourceTreeVerified:true,schemaIndexesVerified:true,
  workerAppApiGrantVerified:true,ownerSessionVerified:true,
  exactArtifactVerified:true,artifactHead:HEAD,
  syntheticRecordAbsent:true,envelopeSha256:ENVELOPE,
  otherActiveOperationAbsent:true,noExistingSyntheticReceipt:true,
  operationId:ID,existingAcceptedReceipt:true,
  ...preflightPatch,
 };
 const journal={
  async claimOnce(key,safe){
   calls.push('claim:'+key);
   assert.equal(Object.hasOwn(safe,'token'),false);
   if(claimed.has(key))return false;
   claimed.add(key);return true;
  },
  async complete(key,safe){
   calls.push('complete');
   assert.equal(Object.hasOwn(safe,'secrets'),false);
   completed.set(key,safe);
  },
 };
 const deps={
  now:()=>NOW,
  async readPreflight(){calls.push('preflight');return p;},
  async readReceipt(args){
   calls.push('receipt');
   return mode==='intake'&&!args.operationId?null:receipt();
  },
  async readOwnerStatus(){calls.push('status');return lifecycle(index,state);},
  async verifyApproval(req){
   calls.push('approval');
   return {
    approved:true,testName:NAME,mode:req.mode,
    sourceRevision:SOURCE,artifactHead:HEAD,envelopeSha256:ENVELOPE,
    offVersion:OFF,approvalRef:REF,operationId:req.operationId,
    step:req.step,grantId:'grant-h2-0001',
    windowStart:NOW-60,windowEnd:NOW+600,...grantPatch,
   };
  },
  async armIndependentOff(req){
   calls.push('watchdog');
   return {armed:true,independent:true,offVersion:OFF,
    deadline:req.deadline,...watchdogPatch};
  },
  async activate(req){
   calls.push('activate');
   if(delayBeforeActivate)await delayBeforeActivate();
   return {verified:true,traffic:100,sourceHead:HEAD,
    mode:req.mode,step:req.step,operationId:req.operationId,
    ...onPatch};
  },
  async sendOne(args){
   calls.push('send:'+args.mode);
   if(failSend===args.mode)throw Error('Simulated lost browser or provider acknowledgement');
   if(args.mode==='intake')return {httpStatus:202,operationId:ID,
    sourceRevision:SOURCE};
   if(args.mode==='step'){
    if(!noFenceAfterBegin)state='ReconciliationRequired';
    return {httpStatus:202};
   }
   if(failReconcile)return {httpStatus:503};
   if(!noProofAfterReconcile){
    index++;
    state=index===5?'VerifiedPr':'AwaitingAuthorizedWrite';
   }
   return {httpStatus:200};
  },
  async restoreOff(){calls.push('restoreOff');},
  async verifyOff(){calls.push('verifyOff');
   return {verified:true,workerName:'fishing-v3-wp3-test',
    version:OFF,traffic:100,writeRoutesDenied:true,...offPatch};
  },
  async verifyFinalPr(){calls.push('verifyPr');
   return {verified:true,unmerged:true,mainUnchanged:true,
    onlySyntheticKbDiff:true,...prPatch};
  },
  journal,
 };
 return {controller:createD6Wp3H2PhasedController(deps),calls,claimed,
  completed,deps};
}

test('WP3-H2PH01 intake one Save followed by independent D1/owner read, OFF first',async()=>{
 const h=harness({mode:'intake'});
 const got=await h.controller.runPhase(input('intake'));
 assert.equal(got.operationId,ID);
 assert.equal(got.nextAction,'REQUEST_EXACT_STEP_APPROVAL');
 assert.equal(got.checkpoint.step,'tree');
 assert.equal(got.offVerified,true);
 assert.equal(got.canPublish,false);
 assert.equal(got.isLive,false);
 assert.equal(h.calls.filter(v=>v==='send:intake').length,1);
 assert.equal(h.calls.filter(v=>v.startsWith('send:')).length,1);
 assert(h.calls.indexOf('claim:h2-intake:'+NAME)<h.calls.indexOf('watchdog'));
 assert(h.calls.indexOf('watchdog')<h.calls.indexOf('activate'));
 assert(h.calls.indexOf('restoreOff')<h.calls.indexOf('verifyOff'));
 assert(h.calls.indexOf('verifyOff')<h.calls.indexOf('complete'));
 assert.equal(h.completed.size,1);
});

test('WP3-H2PH02 one approved tree step has one begin, independent Unknown and reconcile',async()=>{
 const h=harness();
 const got=await h.controller.runPhase(input('step','tree'));
 assert.equal(got.nextAction,'REQUEST_EXACT_STEP_APPROVAL');
 assert.equal(got.checkpoint.step,'branch');
 assert.deepEqual(got.checkpoint.verifiedSteps,['tree']);
 assert.deepEqual(h.calls.filter(x=>x.startsWith('send:')),
  ['send:step','send:reconcile']);
 assert.equal(h.calls.filter(x=>x==='status').length,3);
 assert.equal(h.calls.filter(x=>x==='receipt').length,3);
 assert.equal(h.calls.filter(x=>x==='restoreOff').length,1);
 assert.equal(h.completed.size,1);
});

test('WP3-H2PH03 previous Unknown may only reconcile, without begin',async()=>{
 const h=harness({mode:'reconcile',step:'commit',initial:'ReconciliationRequired'});
 const got=await h.controller.runPhase(input('reconcile','commit'));
 assert.equal(got.checkpoint.step,'advance');
 assert.deepEqual(got.checkpoint.verifiedSteps,['tree','branch','commit']);
 assert.deepEqual(h.calls.filter(x=>x.startsWith('send:')),['send:reconcile']);
 assert.equal(got.isLive,false);
});

test('WP3-H2PH04 PR step independently verifies exact unmerged PR and then OFF',async()=>{
 const h=harness({step:'pr'});
 const got=await h.controller.runPhase(input('step','pr'));
 assert.equal(got.nextAction,'VERIFY_UNMERGED_PR_READ_ONLY');
 assert.equal(got.prNumber,405);
 assert.equal(got.finalPrVerified,true);
 assert.equal(got.isLive,false);
 assert.equal(got.canPublish,false);
 assert(h.calls.includes('verifyPr'));
 assert(h.calls.indexOf('verifyPr')<h.calls.indexOf('restoreOff'));
});

test('WP3-H2PH05 denied/off/foreign preflight forbids ON and POST',async()=>{
 for(const bad of [
  {offVerified:false},{offTraffic:90},{offVersion:'bogus'},
  {authDbId:'foreign'},{wp3DbId:'wrong'},
  {workerAppApiGrantVerified:false},{schemaIndexesVerified:false},
  {ownerSessionVerified:false},{currentMainSha:'b'.repeat(40)},
  {sourceTreeVerified:false},{syntheticRecordAbsent:false},
  {otherActiveOperationAbsent:false},{artifactHead:'f'.repeat(40)},
  {envelopeSha256:'f'.repeat(64)},
 ]){
  const h=harness({preflightPatch:bad});
  await deny(h.controller.runPhase(input('step','tree')),
   'PREFLIGHT_UNVERIFIED');
  assert(!h.calls.includes('activate'));
  assert(!h.calls.includes('watchdog'));
  assert(!h.calls.some(x=>x.startsWith('send:')));
 }
});

test('WP3-H2PH06 no owner approval, broad phase or stale window can enable ON',async()=>{
 for(const bad of [
  {approved:false},{step:'pr'},{mode:'intake'},
  {sourceRevision:'b'.repeat(40)},{offVersion:'wrong'},
  {operationId:'wrong'},{artifactHead:'b'.repeat(40)},
  {windowStart:NOW-1900,windowEnd:NOW+10},
  {windowStart:NOW-10,windowEnd:NOW+300},
  {approvalRef:'foreign-ref'},
 ]){
  const h=harness({grantPatch:bad});
  await deny(h.controller.runPhase(input('step','tree')),
   'APPROVAL_UNVERIFIED');
  assert(!h.calls.includes('activate'));
 }
});

test('WP3-H2PH07 missing crash-independent OFF watchdog forbids ON and burns fence',async()=>{
 for(const bad of [{armed:false},{independent:false},
  {offVersion:'other'},{deadline:NOW+301}]){
  const h=harness({watchdogPatch:bad});
  await deny(h.controller.runPhase(input('step','tree')),
   'INDEPENDENT_OFF_NOT_ARMED');
  assert(!h.calls.includes('activate'));
  assert(h.calls.includes('restoreOff'));
  assert(h.calls.includes('verifyOff'));
  assert.equal(h.claimed.size,1);
  assert.equal(h.completed.size,0);
 }
});

test('WP3-H2PH08 uncertain begin acknowledgement cannot retry or auto-reconcile',async()=>{
 const h=harness({failSend:'step'});
 await assert.rejects(h.controller.runPhase(input('step','tree')),
  /Simulated lost browser/);
 assert.deepEqual(h.calls.filter(v=>v.startsWith('send:')),['send:step']);
 assert(h.calls.includes('restoreOff'));
 assert.equal(h.completed.size,0);
 await deny(h.controller.runPhase(input('step','tree')),'ACTION_ALREADY_CLAIMED');
 assert.deepEqual(h.calls.filter(v=>v.startsWith('send:')),['send:step']);
});

test('WP3-H2PH09 one intake 503 or lost ack is never automatically resubmitted',async()=>{
 const h=harness({mode:'intake',failSend:'intake'});
 await assert.rejects(h.controller.runPhase(input('intake')),
  /Simulated lost browser/);
 assert(h.calls.includes('restoreOff'));
 assert.equal(h.calls.filter(x=>x==='send:intake').length,1);
 await deny(h.controller.runPhase(input('intake')),'ACTION_ALREADY_CLAIMED');
 assert.equal(h.calls.filter(x=>x==='send:intake').length,1);
});

test('WP3-H2PH10 bad ON identity always restores OFF, never sends',async()=>{
 const h=harness({onPatch:{traffic:50}});
 await deny(h.controller.runPhase(input('step','tree')),'ON_UNVERIFIED');
 assert(!h.calls.some(x=>x.startsWith('send:')));
 assert(h.calls.includes('restoreOff'));
 assert(h.calls.includes('verifyOff'));
});

test('WP3-H2PH11 bad OFF independent proof overrides success with OFF_UNVERIFIED',async()=>{
 const h=harness({offPatch:{writeRoutesDenied:false}});
 await deny(h.controller.runPhase(input('step','tree')),'OFF_UNVERIFIED');
 assert.equal(h.completed.size,0);
 assert(h.calls.includes('restoreOff'));
});

test('WP3-H2PH12 real lifecycle preflight guards prevent stale or wrong D1 state',async()=>{
 for(const opts of [
  {step:'tree',initial:'ReconciliationRequired'},
  {mode:'reconcile',step:'tree',initial:'AwaitingAuthorizedWrite'},
 ]){
  const h=harness(opts);
  await deny(h.controller.runPhase(input(opts.mode??'step',opts.step)),
   'STEP_NOT_READY');
  assert(!h.calls.some(x=>x.startsWith('send:')));
  assert(h.calls.includes('restoreOff'));
 }
});

test('WP3-H2PH13 incomplete reconcile HTTP readback keeps Unknown without next step',async()=>{
 const h=harness({failReconcile:true});
 await deny(h.controller.runPhase(input('step','tree')),'READBACK_UNKNOWN');
 assert.deepEqual(h.calls.filter(x=>x.startsWith('send:')),
  ['send:step','send:reconcile']);
 assert.equal(h.completed.size,0);
 assert(h.calls.includes('restoreOff'));
});

test('WP3-H2PH14 final PR mismatched evidence denies VerifiedPr acceptance',async()=>{
 const h=harness({step:'pr',prPatch:{onlySyntheticKbDiff:false}});
 await deny(h.controller.runPhase(input('step','pr')),
  'PR_NOT_INDEPENDENTLY_VERIFIED');
 assert(h.calls.includes('restoreOff'));
 assert.equal(h.completed.size,0);
});

test('WP3-H2PH15 missing adapter or unsupported operation never creates permission',async()=>{
 assert.throws(()=>createD6Wp3H2PhasedController({}),
  e=>e.code==='INVALID_ADAPTER');
 const h=harness();
 await deny(h.controller.runPhase({...input('step','tree'),step:'out-of-order'}),
  'INVALID_ACTION');
 await deny(h.controller.runPhase({...input('step','tree'),mode:'publish'}),
  'INVALID_ACTION');
 await deny(h.controller.runPhase({...input('intake'),operationId:ID}),
  'INVALID_ACTION');
 assert(!h.calls.includes('activate'));
});

test('WP3-H2PH16 module contains no real Cloudflare/GitHub provider client or credential',()=>{
 const s=readFileSync(new URL(
  '../server/d6-wp3-h2-single-action-controller.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(s,/wrangler|api\.github\.com|fetch\s*\(|process\.env/);
 assert.doesNotMatch(s,/Authorization:|D6_WP3_H2_OPERATOR_APPROVED:'true'/);
 assert.doesNotMatch(s,/createD6ProductionPublishStepDispatcher/);
});

test('WP3-H2PH17 a 202 without durable Unknown fence cannot trigger reconcile',async()=>{
 const h=harness({noFenceAfterBegin:true});
 await deny(h.controller.runPhase(input('step','tree')),'FENCE_UNVERIFIED');
 assert.deepEqual(h.calls.filter(x=>x.startsWith('send:')),['send:step']);
 assert(h.calls.includes('restoreOff'));
});

test('WP3-H2PH18 readback 200 without one more verified proof is rejected',async()=>{
 const h=harness({noProofAfterReconcile:true});
 await assert.rejects(h.controller.runPhase(input('step','tree')));
 assert.deepEqual(h.calls.filter(x=>x.startsWith('send:')),
  ['send:step','send:reconcile']);
 assert(h.calls.includes('restoreOff'));
 assert.equal(h.completed.size,0);
});

test('WP3-H2PH19 unexpected approval fields cannot carry secrets to ON adapter',async()=>{
 const h=harness({grantPatch:{githubToken:'do-not-store'}});
 await deny(h.controller.runPhase(input('step','tree')),'APPROVAL_UNVERIFIED');
 assert(!h.calls.includes('activate'));
 assert.equal(h.claimed.size,0);
});

test('WP3-H2PH20 controller rejects concurrent phases through journal completion',async()=>{
 let release;
 const h=harness({delayBeforeActivate:()=>new Promise(ok=>{release=ok;})});
 const a=h.controller.runPhase(input('step','tree'));
 for(let i=0;i<20&&!release;i++)
  await new Promise(resolve=>setImmediate(resolve));
 assert.equal(typeof release,'function');
 await deny(h.controller.runPhase(input('step','tree')),'CONCURRENT_CONTROLLER');
 release();
 const result=await a;
 assert.equal(result.checkpoint.step,'branch');
 assert.equal(h.calls.filter(x=>x==='send:step').length,1);
});
