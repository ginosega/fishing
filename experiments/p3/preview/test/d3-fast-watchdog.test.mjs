import test from 'node:test';
import assert from 'node:assert/strict';
import {createD3FastWatchdog,D3WakeError} from '../src/d3-fast-watchdog.mjs';
const id='p3_5527208d-a67c-4a2c-876d-9edaee353bc8';
const code=c=>e=>e instanceof D3WakeError&&e.code===c;
function fixture({enabled=true,state='Accepted',marker=false}={}){
 let record={operationId:id,state,reasonCode:marker?'merge_attempted':null,mergeSha:null};
 const actions=[];
 const watch=createD3FastWatchdog({
  enabled:()=>enabled,now:()=>100000,delayMs:8500,
  getOperation:async()=>({...record}),
  runOneStep:async()=>{
   actions.push('run');
   record={...record,state:{
    Accepted:'Validating',Validating:'Checking',
    Checking:'Merging',Merging:'Deploying',Deploying:'Verifying',
    Verifying:'Live'}[record.state]??record.state};
  },
  readOnlyRecoverMerge:async()=>{
   actions.push('readOnlyRecover');
   record={...record,state:'Deploying',reasonCode:null,
    mergeSha:'f'.repeat(40)};
  },
  arm:async value=>actions.push(['arm',value]),
 });
 return {watch,actions,get record(){return record},setRecord:v=>{record=v}};
}
test('WD-01 disabled never touches operation',async()=>{
 const f=fixture({enabled:false});
 await assert.rejects(f.watch.notify(id),code('OFF'));
 assert.equal(f.actions.length,0);
});
test('WD-02 accept durably arms immediate alarm',async()=>{
 const f=fixture();
 const r=await f.watch.notify(id);
 assert.equal(r.scheduled,true);
 assert.equal(f.actions[0][1].deadlineMs,100000);
});
test('WD-03 deterministic steps continue immediately',async()=>{
 const f=fixture();
 await f.watch.onAlarm(id);
 assert.equal(f.record.state,'Validating');
 assert.equal(f.actions[0],'run');
 assert.equal(f.actions[1][1].deadlineMs,100000);
});
test('WD-04 checking never busy loops; recovery queries again in 8.5s',async()=>{
 const f=fixture({state:'Checking'});
 f.setRecord({operationId:id,state:'Checking',reasonCode:null,mergeSha:null});
 const r=await f.watch.onAlarm(id);
 assert.equal(r.state,'Merging');
 assert.equal(r.deadlineMs,100000);
 // If CI is not yet complete, runner can return no progress.
 const g=createD3FastWatchdog({enabled:()=>true,now:()=>100000,
  getOperation:async()=>({operationId:id,state:'Checking'}),
  runOneStep:async()=>{},readOnlyRecoverMerge:async()=>{},
  arm:async({deadlineMs})=>assert.equal(deadlineMs,108500)});
 await g.onAlarm(id);
});
test('WD-05 ambiguous merge never replays GitHub POST',async()=>{
 const f=fixture({state:'Merging',marker:true});
 await f.watch.onAlarm(id);
 assert.deepEqual(f.actions.slice(0,1),['readOnlyRecover']);
 assert.equal(f.record.state,'Deploying');
});
test('WD-06 completed operation causes no alarm or write',async()=>{
 const f=fixture({state:'Live'});
 assert.equal((await f.watch.notify(id)).terminal,true);
 assert.equal((await f.watch.onAlarm(id)).terminal,true);
 assert.deepEqual(f.actions,[]);
});
test('WD-07 stale or missing operation fails safely',async()=>{
 const f=fixture();
 await assert.rejects(f.watch.notify('p3_wrong'),code('INVALID_OPERATION'));
 f.setRecord(null);
 await assert.rejects(f.watch.onAlarm(id));
});
test('WD-08 alarm acknowledgment failure is visible and never reported success',async()=>{
 const f=createD3FastWatchdog({enabled:()=>true,now:()=>100000,
  getOperation:async()=>({operationId:id,state:'Accepted'}),
  runOneStep:async()=>{},readOnlyRecoverMerge:async()=>{},
  arm:async()=>{throw Error('alarm outage')}});
 await assert.rejects(f.notify(id),/alarm outage/);
});
