import test from 'node:test';
import assert from 'node:assert/strict';
import {createD2SandboxOperationRunner,D2RunnerError} from '../src/d2-sandbox-operation-runner.mjs';
const ID=1430581407,OP='p3_01234567-1234-4234-8234-123456789abc';
const BASE='a'.repeat(40),HEAD='b'.repeat(40),MERGE='c'.repeat(40);
const BRANCH='p3-test-'+OP.slice(3);
const snapshot={package:{
 format:'fishing-companion-change-v2',domain:'gear',operation:'edit',id:'p3-test-rod',
},media:[]};
const reason=code=>e=>e instanceof D2RunnerError&&e.code===code;
function fixture({enabled=true,holdLease=false,invalidPR=false,
 invalidCheck=false,invalidMerge=false,invalidHost=false,invalidSnapshot=false,
 unknownMerge=false}={}){
 let row={operationId:OP,state:'Accepted'};
 const trace=[];
 let call=0;
 const store={
  claim:async({operationId,leaseOwner})=>{
   trace.push('claim:'+operationId);return holdLease?null:{
    operationId,state:row.state,leaseOwner};
  },
  get:async()=>structuredClone(row),
  readSnapshot:async()=>invalidSnapshot?{}:snapshot,
  markMergeAttempt:async({operationId,leaseOwner})=>{
   trace.push('mark-merge:'+operationId);
   assert.equal(operationId,OP);
   assert.equal(leaseOwner,'lease-owner-012345');
   if(row.state!=='Merging'||row.reasonCode!=null)return false;
   row.reasonCode='merge_attempted';
   return true;
  },
  advance:async({from,to,details})=>{
   trace.push('advance:'+from+'>'+to);
   assert.equal(row.state,from);
   row={...row,state:to,
    ...(from==='Merging'&&to==='Deploying'?{reasonCode:null}:{}),
    ...(details.prNumber?{prNumber:details.prNumber}:{}),
    ...(details.prHeadSha?{prHeadSha:details.prHeadSha}:{}),
    ...(details.mainBaseSha?{mainBaseSha:details.mainBaseSha}:{}),
    ...(details.mergeSha?{mergeSha:details.mergeSha}:{}),
    ...(details.workflowRunId?{workflowRunId:details.workflowRunId}:{}),
    ...(details.verifiedReleaseId?{verifiedReleaseId:details.verifiedReleaseId}:{}),
   };
   return structuredClone(row);
  },
 };
 const runner=createD2SandboxOperationRunner({
  store,enabled:()=>enabled,
  currentMain:async({repositoryId})=>{trace.push('main');assert.equal(repositoryId,ID);return BASE;},
  createDraft:async({operationId,repositoryId,expectedMainSha,package:pkg})=>{
   trace.push('PR');assert.equal(operationId,OP);
   assert.equal(repositoryId,ID);assert.equal(expectedMainSha,BASE);
   assert.equal(pkg.domain,'gear');
   return {number:4,branch:BRANCH,baseSha:BASE,
    headSha:HEAD,state:'open',merged:false,
    ...(invalidPR?{branch:'p3-test-attacker-substituted'}:{})};
  },
  observeCheck:async info=>{
   trace.push('checks');assert.equal(info.repositoryId,ID);
   return {repositoryId:ID,prNumber:4,headSha:invalidCheck?'f'.repeat(40):HEAD,
    baseSha:BASE,actionsAppId:15368,checkName:'validate-sandbox-head',
    checkObserved:'success',checkRunId:556,workflowRunId:8877};
  },
  merge:async info=>{
   trace.push('merge');
   if(unknownMerge)throw Error('UNKNOWN GITHUB WRITE OUTCOME');
   return {repositoryId:ID,sandboxMerged:!invalidMerge,
    canonicalLive:false,mergeSha:MERGE};
  },
  verifyHosted:async info=>{
   trace.push('host');assert.equal(info.mergeSha,MERGE);
   return {verified:!invalidHost,repositoryId:ID,mergeSha:MERGE,
    canonicalLive:false,verifiedReleaseId:'d'.repeat(32),workflowRunId:8877};
  },
 });
 const run=()=>runner.run({operationId:OP,leaseOwner:'lease-owner-012345'});
 return {runner,run,trace,get state(){return row.state;}};
}
test('D2-R01 hard disabled before D1 claim or repo activity',async()=>{
 const x=fixture({enabled:false});
 await assert.rejects(x.run(),reason('RUNNER_DISABLED'));
 assert.deepEqual(x.trace,[]);
});
test('D2-R02 one state transition per invocation and no canonical Live claim',async()=>{
 const x=fixture();const expected=['Validating','Checking','Merging',
  'Deploying','Verifying','Live'];
 for(const state of expected){
  const step=await x.run();
  assert.equal(step.progressed,true);
  assert.equal(step.state,state);
  assert.equal(step.canonicalLive,false);
 }
 assert.equal(x.state,'Live');
 assert.deepEqual(x.trace.filter(v=>v.startsWith('advance:')),
  ['advance:Accepted>Validating','advance:Validating>Checking',
   'advance:Checking>Merging','advance:Merging>Deploying',
   'advance:Deploying>Verifying','advance:Verifying>Live']);
});
test('D2-R03 leased operation is untouched when not claimed',async()=>{
 const x=fixture({holdLease:true});
 assert.deepEqual(await x.run(),{
  progressed:false,reason:'NOT_CLAIMED',operationId:OP,canonicalLive:false});
 assert.equal(x.state,'Accepted');
});
test('D2-R04 bad stored Gear package or unrelated record cannot create PR',async()=>{
 const x=fixture({invalidSnapshot:true});
 await x.run();
 await assert.rejects(x.run(),reason('SNAPSHOT_DENIED'));
 assert.equal(x.state,'Validating');
 assert.equal(x.trace.includes('PR'),false);
});
test('D2-R05 wrong PR proof prevents advancement to Checking',async()=>{
 const x=fixture({invalidPR:true});
 await x.run();
 await assert.rejects(x.run(),reason('PR_UNVERIFIED'));
 assert.equal(x.state,'Validating');
});
test('D2-R06 wrong exact-head Actions check cannot reach merge',async()=>{
 const x=fixture({invalidCheck:true});
 await x.run();await x.run();
 await assert.rejects(x.run(),reason('CHECK_UNVERIFIED'));
 assert.equal(x.trace.includes('merge'),false);
 assert.equal(x.state,'Checking');
});
test('D2-R07 altered merge receipt does not advance to deploy',async()=>{
 const x=fixture({invalidMerge:true});
 await x.run();await x.run();await x.run();
 await assert.rejects(x.run(),reason('MERGE_UNVERIFIED'));
 assert.equal(x.state,'Merging');
});
test('D2-R08 unknown merge outcome leaves state Merging, never retries implicitly',async()=>{
 const x=fixture({unknownMerge:true});
 await x.run();await x.run();await x.run();
 await assert.rejects(x.run(),/UNKNOWN GITHUB WRITE OUTCOME/);
 assert.equal(x.state,'Merging');
 assert.equal(x.trace.filter(v=>v==='merge').length,1);
 assert.equal(x.trace.filter(v=>v.startsWith('mark-merge:')).length,1);
 // Simulate expiry of original lease and invocation in new process;
 // a second merge must never run while outcome is unknown.
 await assert.rejects(x.run(),reason('MERGE_RECONCILIATION_REQUIRED'));
 assert.equal(x.trace.filter(v=>v==='merge').length,1);
});
test('D2-R09 unverified hosted test path cannot be called sandbox Live',async()=>{
 const x=fixture({invalidHost:true});
 for(let i=0;i<5;i++)await x.run();
 await assert.rejects(x.run(),reason('HOSTED_UNVERIFIED'));
 assert.equal(x.state,'Verifying');
});
test('D2-R10 incorrect operation ID or lease owner cannot claim',async()=>{
 const x=fixture();
 for(const pair of [
  {operationId:'p3_wrong',leaseOwner:'lease-owner-012345'},
  {operationId:OP,leaseOwner:'bad'},
 ]){
  await assert.rejects(x.runner.run(pair),reason('INVALID_REQUEST'));
 }
 assert.equal(x.trace.length,0);
});

test('D2-R11 a normal merge writes ahead before any remote action and clears marker after receipt',async()=>{
 const x=fixture();
 await x.run();await x.run();await x.run();await x.run();
 const events=x.trace;
 assert(events.indexOf('mark-merge:'+OP)!==-1);
 assert(events.indexOf('mark-merge:'+OP)<events.indexOf('merge'));
 assert.equal(x.state,'Deploying');
});
