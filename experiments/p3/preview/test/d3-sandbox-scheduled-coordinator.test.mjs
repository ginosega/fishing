import test from 'node:test';
import assert from 'node:assert/strict';
import {createD3SandboxScheduledCoordinator,D3CoordinatorError}
 from '../src/d3-sandbox-scheduled-coordinator.mjs';
const ID=1430581407,OWNER=265665562;
const OP='p3_01234567-1234-4234-8234-123456789abc';
const denied=code=>e=>e instanceof D3CoordinatorError&&e.code===code;
function fixture({active=true,hosted=false,state='Accepted',owner=OWNER,
 operationId=OP}={}){
 const calls={eligible:0,get:0,claim:0,advanced:0,requests:0,
  token:0,host:0,merges:0};
 const env={
  D3_RUNNER_ENABLED:active?'true':'false',
  D3_WRITE_ENABLED:'true',D3_READ_TOKENS_ENABLED:'true',
  D3_TEST_HOST_ENABLED:hosted?'true':'false',
  D3_SANDBOX_REPO_ID:String(ID),OWNER_GITHUB_ID:String(owner),
 };
 let status=state;
 const store={
  nextRecoverableMerge:async()=>null,
  reconcileVerifiedMerge:async()=>{throw Error('Unexpected recovery');},
  nextEligible:async()=>{calls.eligible++;return operationId;},
  get:async id=>{
   calls.get++;return {operationId:id,state:status};
  },
  claim:async ({operationId:id})=>{
   calls.claim++;return {operationId:id,state:status};
  },
  advance:async ({operationId:id,from,to})=>{
   assert.equal(from,status);calls.advanced++;
   status=to;return {operationId:id,state:status};
  },
  readSnapshot:async()=>({package:{},media:[]}),
  branchReceipt:async()=>null,
  saveBranchReceipt:async()=>null,
  markMergeAttempt:async()=>{calls.merges++;return false;},
  saveMergeReceipt:async()=>null,
 };
 const server=createD3SandboxScheduledCoordinator({
  env,store,
  requestGitHub:async()=>{
   calls.requests++;throw Error('No GitHub request expected');
  },
  issueReadToken:async()=>{
   calls.token++;throw Error('No token expected');
  },
  issueWriteToken:async()=>{
   calls.token++;throw Error('No token expected');
  },
  verifyHosted:async()=>{
   calls.host++;throw Error('No hosted proof expected');
  },
  makeLease:()=> 'lease-owner-d3-012345',
 });
 return {server,calls,get state(){return status;}};
}
test('D3-O01 default-off coordinator denies before D1 or GitHub access',async()=>{
 const x=fixture({active:false});
 await assert.rejects(x.server.tick(),denied('RUNNER_DISABLED'));
 assert.deepEqual(x.calls,{eligible:0,get:0,claim:0,
  advanced:0,requests:0,token:0,host:0,merges:0});
});
test('D3-O02 idle sandbox returns without claiming or issuing a token',async()=>{
 const x=fixture({operationId:null});
 assert.deepEqual(await x.server.tick(),{
  progressed:false,reason:'NO_ELIGIBLE_OPERATION',canonicalLive:false,
 });
 assert.equal(x.calls.eligible,1);
 assert.equal(x.calls.claim,0);
 assert.equal(x.calls.requests,0);
});
test('D3-O03 only an Accepted record can advance without hosted-proof enablement',async()=>{
 const x=fixture();
 const value=await x.server.tick();
 assert.equal(value.state,'Validating');
 assert.equal(value.canonicalLive,false);
 assert.equal(x.state,'Validating');
 assert.equal(x.calls.claim,1);
 assert.equal(x.calls.advanced,1);
 assert.equal(x.calls.requests,0);
 assert.equal(x.calls.token,0);
});
test('D3-O04 no merge lease or write-ahead marker without hosted verifier gate',async()=>{
 for(const state of ['Merging','Deploying','Verifying']){
  const x=fixture({state,hosted:false});
  const result=await x.server.tick();
  assert.equal(result.reason,'AWAITING_HOST_PROOF_ENABLEMENT');
  assert.equal(result.canonicalLive,false);
  assert.equal(x.calls.claim,0);
  assert.equal(x.calls.merges,0);
  assert.equal(x.calls.requests,0);
  assert.equal(x.calls.host,0);
 }
});
test('D3-O05 foreign owner identity and unexpected D1 operation fail closed',async()=>{
 const foreign=fixture({owner:44});
 await assert.rejects(foreign.server.tick(),denied('RUNNER_DISABLED'));
 assert.equal(foreign.calls.eligible,0);
 const bad=fixture({operationId:'invalid'});
 await assert.rejects(bad.server.tick(),denied('INVALID_DURABLE_ID'));
 assert.equal(bad.calls.claim,0);
});
test('D3-O06 terminal D2 operation must not be resumed by D3',async()=>{
 const x=fixture({state:'Live'});
 await assert.rejects(x.server.tick(),denied('INVALID_OPERATION_STATE'));
 assert.equal(x.calls.claim,0);
 assert.equal(x.calls.requests,0);
});
