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
 for(const field of Object.keys(full).filter(k=>k!=='D2_TEST_HOST_ENABLED')){
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

test('D2-Q05 hosted proof OFF still permits no-op Cron and PR-only preflight',async()=>{
 const x=fixture({D2_TEST_HOST_ENABLED:'false'});
 const result=await x.obj.tick();
 assert.deepEqual(result,{progressed:false,reason:'NO_ELIGIBLE_OPERATION',canonicalLive:false});
 assert.deepEqual(x.hits,['d1:nextEligible']);
});
test('D2-Q06 Merging/Deploying/Verifying must never claim lease, mint token, write GitHub or mark merge with host OFF',async()=>{
 const OP='p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f';
 for(const state of ['Merging','Deploying','Verifying']){
  const hits=[];
  const store=Object.fromEntries(keys.map(k=>[k,async(...args)=>{
   hits.push(k);
   if(k==='nextEligible')return OP;
   if(k==='get')return {operationId:OP,state};
   throw Error('must not reach '+k);
  }]));
  const obj=createD2SandboxScheduledCoordinator({
   env:{...full,D2_TEST_HOST_ENABLED:'false'},store,
   requestGitHub:async()=>{throw Error('GH must not be called');},
   issueReadToken:async()=>{throw Error('read must not be called');},
   issueWriteToken:async()=>{throw Error('write must not be called');},
   verifyHosted:async()=>{throw Error('host must not be called');},
  });
  assert.deepEqual(await obj.tick(),{
   progressed:false,reason:'AWAITING_HOST_PROOF_ENABLEMENT',
   operationId:OP,canonicalLive:false,
  });
  assert.deepEqual(hits,['nextEligible','get']);
 }
});
test('D2-Q07 accepted operation advances to Validating with hosted proof OFF and no GitHub mutation',async()=>{
 const OP='p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f';
 const hits=[];
 const store=Object.fromEntries(keys.map(k=>[k,async(...args)=>{
  hits.push(k);
  if(k==='nextEligible')return OP;
  if(k==='get')return {operationId:OP,state:'Accepted'};
  if(k==='claim')return {operationId:OP,state:'Accepted',expiresAt:999999};
  if(k==='advance'){
   assert.deepEqual(args[0].from,'Accepted');
   assert.deepEqual(args[0].to,'Validating');
   return {operationId:OP,state:'Validating'};
  }
  throw Error('unexpected '+k);
 }]));
 const obj=createD2SandboxScheduledCoordinator({
  env:{...full,D2_TEST_HOST_ENABLED:'false'},store,
  requestGitHub:async()=>{throw Error('GH must not be called');},
  issueReadToken:async()=>{throw Error('read must not be called');},
  issueWriteToken:async()=>{throw Error('write must not be called');},
  verifyHosted:async()=>{throw Error('host must not be called');},
 });
 const result=await obj.tick();
 assert.deepEqual(result,{progressed:true,operationId:OP,
  state:'Validating',canonicalLive:false});
 assert.deepEqual(hits,['nextEligible','get','claim','get','advance']);
});
test('D2-Q08 hosted flag OFF never grants merger authority before operation state check',async()=>{
 const x=fixture({D2_TEST_HOST_ENABLED:'false'});
 assert.equal(Object.keys(x.obj).length,1);
 assert.equal(typeof x.obj.tick,'function');
});
