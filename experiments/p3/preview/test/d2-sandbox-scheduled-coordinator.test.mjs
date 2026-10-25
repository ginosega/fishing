import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createD2SandboxScheduledCoordinator,D2CoordinatorError,
 D2_SANDBOX_REPOSITORY,
} from '../src/d2-sandbox-scheduled-coordinator.mjs';

const ID='1430581407';
const full={D2_RUNNER_ENABLED:'true',D2_WRITE_ENABLED:'true',
 D2_READ_TOKENS_ENABLED:'true',D2_TEST_HOST_ENABLED:'true',
 D2_SANDBOX_REPO_ID:ID};
const keys=['nextEligible','claim','get','readSnapshot','advance','branchReceipt',
 'saveBranchReceipt','markMergeAttempt','saveMergeReceipt'];
const fixture=(patch={})=>{
 const hits=[];
 const store=Object.fromEntries(keys.map(k=>[k,async()=>{
  hits.push('d1:'+k);return null;
 }]));
 const env={...full,...patch};
 const obj=createD2SandboxScheduledCoordinator({
  env,store,
  requestGitHub:async()=>{hits.push('GITHUB');throw Error('forbidden');},
  issueReadToken:async()=>{hits.push('TOKEN_READ');throw Error('forbidden');},
  issueWriteToken:async()=>{hits.push('TOKEN_WRITE');throw Error('forbidden');},
  verifyHosted:async()=>{hits.push('HOSTED');throw Error('forbidden');},
 });
 return {obj,hits};
};
const denied=code=>e=>e instanceof D2CoordinatorError&&e.code===code;
test('D2-Q01 every independent environment gate defaults fail-closed before D1/token/GitHub',async()=>{
 for(const field of Object.keys(full)){
  for(const value of [undefined,'false','',field==='D2_SANDBOX_REPO_ID'?'1350909744':'true']){
   if(value===full[field])continue;
   const x=fixture({[field]:value});
   await assert.rejects(x.obj.tick(),denied('RUNNER_DISABLED'));
   assert.deepEqual(x.hits,[]);
  }
 }
});
test('D2-Q02 enabled idle tick executes one bounded D1 selection and no network',async()=>{
 const x=fixture();
 const res=await x.obj.tick();
 assert.deepEqual(res,{
  progressed:false,reason:'NO_ELIGIBLE_OPERATION',canonicalLive:false,
 });
 assert.deepEqual(x.hits,['d1:nextEligible']);
 assert.deepEqual(Object.keys(x.obj),['tick']);
 assert.equal(D2_SANDBOX_REPOSITORY,'ginosega/fishing-p3-sandbox');
});
test('D2-Q03 no rogue durable operation ID may proceed into a claim',async()=>{
 const hits=[];
 const store=Object.fromEntries(keys.map(k=>[k,async()=>{
  hits.push(k);return k==='nextEligible'?'bad-github-ref':null;
 }]));
 const x=createD2SandboxScheduledCoordinator({
  env:full,store,
  requestGitHub:async()=>{throw Error('network');},
  issueReadToken:async()=>{throw Error('token');},
  issueWriteToken:async()=>{throw Error('token');},
  verifyHosted:async()=>{throw Error('host');},
 });
 await assert.rejects(x.tick(),denied('INVALID_DURABLE_ID'));
 assert.deepEqual(hits,['nextEligible']);
});
test('D2-Q04 required trusted capabilities cannot be silently omitted',()=>{
 const x=fixture();
 assert(x.obj);
 for(const missing of ['nextEligible','markMergeAttempt','saveMergeReceipt']){
  const store=Object.fromEntries(keys.filter(k=>k!==missing)
   .map(k=>[k,async()=>null]));
  assert.throws(()=>createD2SandboxScheduledCoordinator({
   env:full,store,requestGitHub:async()=>{},
   issueReadToken:async()=>{},issueWriteToken:async()=>{},
   verifyHosted:async()=>{},
  }),denied('INVALID_CONFIGURATION'));
 }
});
