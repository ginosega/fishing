import test from 'node:test';
import assert from 'node:assert/strict';
import {createD3LiveOwnerWorker}
 from '../src/d3-live-owner-worker.mjs';
const ID=1430581407,OWNER=265665562;
const origin='https://fishing.example';
const base={
 APP_ORIGIN:origin,OWNER_GITHUB_ID:String(OWNER),
 D3_SANDBOX_REPO_ID:String(ID),
 D3_WRITE_ENABLED:'false',D3_RUNNER_ENABLED:'false',
 D3_READ_TOKENS_ENABLED:'false',D3_TEST_HOST_ENABLED:'false',
 D2_CSRF_KEY:'a'.repeat(40),D2_HOST_PROBE_KEY:'b'.repeat(40),
 D2_GITHUB_APP_ID:'1',D3_GITHUB_APP_ID:'1',
 D2_GITHUB_INSTALLATION_ID:'2',D3_GITHUB_INSTALLATION_ID:'2',
 D2_GITHUB_APP_PRIVATE_KEY:'fake-test-key-'.repeat(6),
};
function fixture(){
 const calls={routes:0,github:0,hosted:0,db:0,cron:0};
 const worker=createD3LiveOwnerWorker({
  route:{fetch:async()=>{
   calls.routes++;return new Response('v2 readonly',{status:200});
  }},
  requestGitHub:async()=>{
   calls.github++;throw Error('No GitHub call authorized');
  },
  requestHosted:async()=>{
   calls.hosted++;throw Error('No host call authorized');
  },
 });
 const D1={
  prepare(sql){
   calls.db++;
   return {bind(){return {first:async()=>null};}};
  },
  batch:async()=>{throw Error('No write authorized')},
 };
 const DB={prepare(){}};
 const env={...base,DB,OPERATIONS_DB:D1};
 const tick=async settings=>{
  const tasks=[],ctx={waitUntil:promise=>{calls.cron++;tasks.push(promise);}};
  await worker.scheduled({},settings??env,ctx);
  await Promise.all(tasks);
 };
 return {worker,calls,env,tick};
}
test('D3-W01 parked/default OFF Cron never calls D1, GitHub or remote hosting',async()=>{
 const f=fixture();
 await f.tick();
 assert.equal(f.calls.cron,0);
 assert.equal(f.calls.db,0);
 assert.equal(f.calls.github,0);
 assert.equal(f.calls.hosted,0);
});
test('D3-W02 wrong immutable repo, owner or partial flags all hard-deny',async()=>{
 for(const delta of [
  {D3_SANDBOX_REPO_ID:'1350909744'},
  {OWNER_GITHUB_ID:'1'},
  {D3_WRITE_ENABLED:'false'},
  {D3_RUNNER_ENABLED:'false'},
  {D3_READ_TOKENS_ENABLED:'false'},
  {D3_TEST_HOST_ENABLED:'false'},
  {D2_HOST_PROBE_KEY:'too-short'},
  {D3_GITHUB_APP_ID:'9'},
  {D2_GITHUB_APP_PRIVATE_KEY:null},
 ]){
  const f=fixture(),env={...f.env,D3_WRITE_ENABLED:'true',
   D3_RUNNER_ENABLED:'true',D3_READ_TOKENS_ENABLED:'true',
   D3_TEST_HOST_ENABLED:'true',...delta};
  await f.tick(env);
  assert.equal(f.calls.cron,0);
  assert.equal(f.calls.db,0);
  assert.equal(f.calls.github,0);
 }
});
test('D3-W03 fully armed source contract with no eligible operations remains nonmutating',async()=>{
 const f=fixture(),env={...f.env,D3_WRITE_ENABLED:'true',
  D3_RUNNER_ENABLED:'true',D3_READ_TOKENS_ENABLED:'true',
  D3_TEST_HOST_ENABLED:'true'};
 await f.tick(env);
 assert.equal(f.calls.cron,1);
 // First query checks for an expired ambiguous-merge marker; second checks
 // for an ordinary eligible operation. Both are SELECT-only.
 assert.equal(f.calls.db,2);
 assert.equal(f.calls.github,0);
 assert.equal(f.calls.hosted,0);
});
test('D3-W04 fetch delegates unchanged to owner gateway even with publisher OFF',async()=>{
 const f=fixture();
 const res=await f.worker.fetch(new Request(origin+'/fishing/'),f.env,{});
 assert.equal(await res.text(),'v2 readonly');
 assert.equal(f.calls.routes,1);
 assert.equal(f.calls.github,0);
});

const recoveryId='p3_4c5f68ec-aad0-4ee5-b33b-1ee812b9e970';
function cronRecovery({state='Deploying',progressed=true,fast=true,
  operationId=recoveryId,ack=200}={}){
 const calls={ticks:0,alarms:[],failures:[]};
 const worker=createD3LiveOwnerWorker({
  route:{fetch:async()=>new Response('unchanged')},
  requestGitHub:async()=>{throw Error('No GitHub writes or reads in this fixture');},
  requestHosted:async()=>{throw Error('No hosted request in this fixture');},
  coordinatorFactory:()=>({tick:async()=>{
   calls.ticks++;return {operationId,state,progressed,canonicalLive:false};
  }}),
  onScheduledFailure:code=>calls.failures.push(code),
 });
 const env={...base,D3_WRITE_ENABLED:'true',D3_RUNNER_ENABLED:'true',
  D3_READ_TOKENS_ENABLED:'true',D3_TEST_HOST_ENABLED:'true',
  D3_FAST_WATCHDOG_ENABLED:fast?'true':'false',
  DB:{prepare(){}},OPERATIONS_DB:{prepare(){},batch(){}},
  D3_FAST_WAKE_DO:{getByName:name=>{
   calls.alarms.push({name});
   return {fetch:async req=>{
    const body=JSON.parse(await req.text());
    calls.alarms.at(-1).body=body;
    calls.alarms.at(-1).path=new URL(req.url).pathname;
    return new Response(null,{status:ack});
   }};
  }},
 };
 const tick=async()=>{
  const tasks=[];
  await worker.scheduled({},env,{waitUntil:promise=>tasks.push(promise)});
  assert.equal(tasks.length,1);
  await Promise.all(tasks);
 };
 return {calls,env,tick};
}
test('D3-W05 Cron read-only reconciliation re-arms exact fast wake after merge',async()=>{
 const f=cronRecovery({state:'Deploying'});
 await f.tick();
 assert.equal(f.calls.ticks,1);
 assert.equal(f.calls.alarms.length,1);
 assert.equal(f.calls.alarms[0].name,recoveryId);
 assert.equal(f.calls.alarms[0].path,'/arm');
 assert.equal(f.calls.alarms[0].body.operationId,recoveryId);
 assert.ok(Math.abs(f.calls.alarms[0].body.deadlineMs-Date.now())<15000);
 assert.deepEqual(f.calls.failures,[]);
});
test('D3-W06 Cron also re-arms deterministic Deploying-to-Verifying recovery',async()=>{
 const f=cronRecovery({state:'Verifying'});
 await f.tick();
 assert.equal(f.calls.alarms.length,1);
 assert.equal(f.calls.alarms[0].name,recoveryId);
});
test('D3-W07 no fast wake for disabled, no progress, terminal state',async()=>{
 for(const settings of [
  {fast:false,state:'Deploying'},
  {progressed:false,state:'Deploying'},
  {state:'Live'},
  {state:'Failed'},
  {state:'Conflict'},
 ]){
  const f=cronRecovery(settings);
  await f.tick();
  assert.equal(f.calls.ticks,1);
  assert.equal(f.calls.alarms.length,0);
  assert.deepEqual(f.calls.failures,[]);
 }
});
test('D3-W08 invalid durable recovery receipt denied before DO signaling',async()=>{
 const f=cronRecovery({operationId:'p3_invalid'});
 await assert.rejects(f.tick(),/D3_SCHEDULED_FAILURE/);
 assert.equal(f.calls.ticks,1);
 assert.equal(f.calls.alarms.length,0);
 assert.deepEqual(f.calls.failures,['D3_FAST_REARM_UNAVAILABLE']);
});
test('D3-W09 unacknowledged DO arm surfaces uncertainty without repeating coordinator step',async()=>{
 const f=cronRecovery({ack:503});
 await assert.rejects(f.tick(),/D3_SCHEDULED_FAILURE/);
 assert.equal(f.calls.ticks,1);
 assert.equal(f.calls.alarms.length,1);
 assert.deepEqual(f.calls.failures,['D3_FAST_REARM_UNCERTAIN']);
});
test('D3-W10 missing fast DO binding is reported without changing D1 receipt',async()=>{
 const f=cronRecovery();
 delete f.env.D3_FAST_WAKE_DO;
 await assert.rejects(f.tick(),/D3_SCHEDULED_FAILURE/);
 assert.deepEqual(f.calls.failures,['D3_FAST_REARM_UNAVAILABLE']);
 assert.equal(f.calls.alarms.length,0);
 assert.equal(f.calls.ticks,1);
});
