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
test('SPAN-05 unknown phase bypasses telemetry but never suppresses trusted work',async()=>{
 const events=[];
 const x=createD3PublishingSpanRecorder({enabled:true,operationId:id,
  sink:async e=>events.push(e)});
 let called=0;
 assert.equal(await x.measure('cookie',async()=>++called),1);
 assert.equal(called,1);
 assert.equal(events.length,0);
 await assert.rejects(x.measure('unknown_phase',async()=>{
  throw Error('original trusted error');
 }),/original trusted error/);
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

test('SPAN-07 allow fixed path-free source phases and deny arbitrary labels',async()=>{
 const events=[];
 const recorder=createD3PublishingSpanRecorder({enabled:true,operationId:id,
  sink:async e=>events.push(e)});
 for(const phase of ['source_repository_get','source_main_initial_get',
  'source_commit_get','source_tree_get','source_canonical_blobs',
  'source_narrative_blobs','source_main_final_get','source_snapshot_total']){
  await recorder.measure(phase,async()=>true);
 }
 assert.equal(events.length,8);
 assert(events.every(e=>e.outcome==='ok'));
 assert.equal(await recorder.measure('source_path_private',async()=>true),true);
 assert.equal(events.length,8,'unknown phase is not emitted');
});

test('SPAN-08 same-lease independent merge proof works with tracing ON',async()=>{
 const events=[];
 const recorder=createD3PublishingSpanRecorder({enabled:true,operationId:id,
  sink:async e=>events.push(e)});
 let proofs=0;
 const result=await recorder.measure('merge_fast_independent_proof',async()=>{
  proofs++;return {verified:true,sha:'a'.repeat(40)};
 });
 assert.equal(proofs,1);
 assert.equal(result.verified,true);
 assert.equal(events.length,1);
 assert.equal(events[0].phase,'merge_fast_independent_proof');
 assert.equal(events[0].outcome,'ok');
});

test('SPAN-09 exhausted telemetry and unavailable clock never fail publishing',async()=>{
 const recorder=createD3PublishingSpanRecorder({enabled:true,operationId:id,
  monotonic:()=>{throw Error('clock unavailable');}});
 assert.equal(await recorder.measure('github_protected_merge',async()=>29),29);
 const events=[];
 const capped=createD3PublishingSpanRecorder({enabled:true,operationId:id,
  sink:async e=>events.push(e)});
 for(let i=0;i<80;i++)await capped.measure('lease_claim',async()=>true);
 assert.equal(events.length,80);
 assert.equal(await capped.measure('merge_fast_independent_proof',async()=>42),42);
 assert.equal(events.length,80);
});

test('SPAN-10 all literal publisher phase names are recognized, no silent blind spots',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {fileURLToPath}=await import('node:url');
 const source=new URL('../src/d3-sandbox-operation-runner.mjs',import.meta.url);
 const code=await readFile(fileURLToPath(source),'utf8');
 const phaseNames=[...code.matchAll(/measure\(\s*['"]([^'"]+)['"]/g)].map(m=>m[1]);
 assert(phaseNames.includes('merge_fast_independent_proof'));
 const emitted=[];
 const recorder=createD3PublishingSpanRecorder({enabled:true,operationId:id,
  sink:async e=>emitted.push(e)});
 for(const phase of new Set(phaseNames)){
  await recorder.measure(phase,async()=>true);
 }
 assert.deepEqual(emitted.map(e=>e.phase),[...new Set(phaseNames)]);
});

test('SPAN-11 fixed CI/merge diagnostic phases are recognized and redacted',async()=>{
 const events=[];
 const recorder=createD3PublishingSpanRecorder({enabled:true,operationId:id,
  sink:async event=>events.push(event)});
 const phases=['check_token_issue','check_repository_get',
  'check_main_initial_get','check_pr_initial_get','check_runs_get',
  'check_main_final_get','check_pr_final_get',
  'merge_pr_evidence_get','merge_main_evidence_get'];
 for(const phase of phases)await recorder.measure(phase,async()=>true);
 assert.deepEqual(events.map(event=>event.phase),phases);
 assert(events.every(event=>event.outcome==='ok'));
 assert(!JSON.stringify(events).includes('github.com'));
 assert(events.every(event=>Object.keys(event).every(key=>
  ['schema','operationId','phase','outcome','durationMs',
   'startedAt','finishedAt','clockScope'].includes(key))));
});
