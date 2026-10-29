import test from 'node:test';
import assert from 'node:assert/strict';
import {D3FastWakeAlarm} from '../src/d3-fast-wake-do.mjs';
const id='p3_5527208d-a67c-4a2c-876d-9edaee353bc8';
function fixture({enabled=true}={}){
 const changes=[];let alarm=null;
 const ctx={id:{name:id},storage:{
  getAlarm:async()=>alarm,
  setAlarm:async next=>{alarm=next;changes.push(next);},
 }};
 const env={
  D3_FAST_WATCHDOG_ENABLED:enabled?'true':'false',
  D3_SANDBOX_REPO_ID:'1430581407',OWNER_GITHUB_ID:'265665562',
  D3_WRITE_ENABLED:'true',D3_RUNNER_ENABLED:'true',
  D3_READ_TOKENS_ENABLED:'true',D3_TEST_HOST_ENABLED:'true',
  DB:{prepare(){}},OPERATIONS_DB:{prepare(){},batch(){}},
  APP_ORIGIN:'https://fishing-auth-p0-test.ginosega.workers.dev',
  D2_CSRF_KEY:'a'.repeat(32),D2_HOST_PROBE_KEY:'b'.repeat(32),
  D2_GITHUB_APP_ID:'5436811',D2_GITHUB_INSTALLATION_ID:'174361658',
  D3_GITHUB_APP_ID:'5436811',D3_GITHUB_INSTALLATION_ID:'174361658',
  D2_GITHUB_APP_PRIVATE_KEY:'c'.repeat(64),
 };
 const obj=new D3FastWakeAlarm(ctx,env);
 const send=(op=id,at=Date.now())=>obj.fetch(new Request('https://d3-fast.internal/arm',{
  method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({operationId:op,deadlineMs:at}),
 }));
 return {obj,send,changes,get alarm(){return alarm}};
}
test('DO-01 default OFF denies all alarm mutations',async()=>{
 const f=fixture({enabled:false});
 assert.equal((await f.send()).status,503);
 assert.deepEqual(f.changes,[]);
});
test('DO-02 valid internal arm creates one scoped future alarm',async()=>{
 const f=fixture(),now=Date.now();
 assert.equal((await f.send(id,now+3000)).status,200);
 assert.equal(f.changes.length,1);
 assert.ok(f.alarm>=now);
 assert.ok(f.alarm<=now+4000);
});
test('DO-03 duplicate later event cannot postpone earlier alarm',async()=>{
 const f=fixture(),now=Date.now();
 await f.send(id,now+2000);
 await f.send(id,now+10000);
 assert.equal(f.changes.length,1);
});
test('DO-04 earlier event accelerates alarm but never changes operation ID',async()=>{
 const f=fixture(),now=Date.now();
 await f.send(id,now+10000);
 await f.send(id,now+1000);
 assert.equal(f.changes.length,2);
 assert.ok(f.changes[1]<=f.changes[0]);
});
test('DO-05 mismatched operation ID is denied',async()=>{
 const f=fixture();
 assert.equal((await f.send('p3_'+'1'.repeat(36))).status,503);
 assert.deepEqual(f.changes,[]);
});
test('DO-06 invalid method and path cannot arm',async()=>{
 const f=fixture();
 assert.equal((await f.obj.fetch(new Request('https://d3-fast.internal/no'))).status,404);
 assert.equal((await f.obj.fetch(new Request('https://d3-fast.internal/arm',{
  method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'}))).status,404);
 assert.deepEqual(f.changes,[]);
});
