import test from 'node:test';
import assert from 'node:assert/strict';
import {createD3PublishingSpanRecorder} from '../src/d3-publishing-span-recorder.mjs';
const id='p3_5527208d-a67c-4a2c-876d-9edaee353bc8';
test('SPAN-01 disabled fast path executes without touching injected clocks',async()=>{
 const x=createD3PublishingSpanRecorder({enabled:false,monotonic:()=>{
  throw Error('clock should not be called');}});
 assert.equal(await x.measure('github_prepare_pr',async()=>12),12);
});
test('SPAN-02 fixed allowed names, same-clock elapsed and UTC markers',async()=>{
 let now=500,wall=1793210000000;
 const events=[];
 const x=createD3PublishingSpanRecorder({enabled:true,operationId:id,
  monotonic:()=>now,utc:()=>wall,sink:async e=>events.push(e)});
 const result=await x.measure('github_prepare_pr',async()=>{
  now+=13.47;wall+=14;return {ok:true};
 });
 assert.deepEqual(result,{ok:true});
 assert.equal(events[0].durationMs,13.5);
 assert.equal(events[0].clockScope,'single-invocation-monotonic');
 assert.equal(events[0].outcome,'ok');
 assert.equal(events[0].phase,'github_prepare_pr');
 assert.equal(x.summary().droppedSinkEvents,0);
 assert.deepEqual(Object.keys(events[0]).sort(),[
  'clockScope','durationMs','finishedAt','operationId',
  'outcome','phase','schema','startedAt'].sort());
});
test('SPAN-03 errors propagate, report redacted fixed status',async()=>{
 let count=0;const events=[];
 const x=createD3PublishingSpanRecorder({enabled:true,operationId:id,
  monotonic:()=>++count,utc:()=>1000000000000,
  sink:async e=>events.push(e)});
 await assert.rejects(x.measure('github_protected_merge',()=>{
  throw Error('SECRET-DO-NOT-LOG');
 }),/SECRET-DO-NOT-LOG/);
 assert.equal(events[0].outcome,'refused');
 assert.equal(JSON.stringify(events).includes('SECRET-DO-NOT-LOG'),false);
});
test('SPAN-04 telemetry sink failure does not affect publication correctness',async()=>{
 let c=0;
 const x=createD3PublishingSpanRecorder({enabled:true,operationId:id,
  monotonic:()=>++c,utc:()=>1000000000000,
  sink:async()=>{throw Error('storage down')}});
 assert.equal(await x.measure('state_to_live',async()=>true),true);
 assert.equal(x.summary().droppedSinkEvents,1);
});
test('SPAN-05 unknown phase and operation refused without sink',async()=>{
 const x=createD3PublishingSpanRecorder({enabled:true,operationId:id});
 await assert.rejects(x.measure('cookie',async()=>1),/Invalid D3 stage span/);
 assert.throws(()=>createD3PublishingSpanRecorder({
  enabled:true,operationId:'bad-id'}));
});
test('SPAN-06 nested spans cannot silently use mismatched cross-system wall time',async()=>{
 let monotonic=1000,utc=1793210000000;const events=[];
 const x=createD3PublishingSpanRecorder({enabled:true,operationId:id,
  monotonic:()=>monotonic,utc:()=>utc,sink:async e=>events.push(e)});
 await x.measure('check_observation',async()=>{
  monotonic+=22;utc-=10000;
 });
 assert.equal(events[0].durationMs,22);
 assert.notEqual(Date.parse(events[0].finishedAt)-Date.parse(events[0].startedAt),22);
});
