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
  {D2_HOST_PROBE_KEY:'too-short'},
 ]){
  const f=fixture(),env={...f.env,D3_WRITE_ENABLED:'true',
   D3_RUNNER_ENABLED:'true',D3_READ_TOKENS_ENABLED:'true',...delta};
  await f.tick(env);
  assert.equal(f.calls.cron,0);
  assert.equal(f.calls.db,0);
  assert.equal(f.calls.github,0);
 }
});
test('D3-W03 fully armed source contract with no eligible operations remains nonmutating',async()=>{
 const f=fixture(),env={...f.env,D3_WRITE_ENABLED:'true',
  D3_RUNNER_ENABLED:'true',D3_READ_TOKENS_ENABLED:'true'};
 await f.tick(env);
 assert.equal(f.calls.cron,1);
 assert.equal(f.calls.db,1);
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
