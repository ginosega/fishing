import test from 'node:test';
import assert from 'node:assert/strict';
import {createD3StorageBenchmark,D3StorageBenchmarkError} from '../src/d3-r2-d1-storage-benchmark.mjs';
const version='bench_'+'1'.repeat(32),other='bench_'+'2'.repeat(32);
const denied=c=>e=>e instanceof D3StorageBenchmarkError&&e.code===c;
function fixture(options={}){
 let ptr={active_version:null,active_sha256:null,last_run_id:null};
 const objects=new Map(),trace=[],calls={get:0,put:0,select:0,update:0};
 const R2={
  put:async(key,bytes,opts)=>{
   calls.put++;trace.push('R2_PUT');
   assert.equal(opts.onlyIf.get('If-None-Match'),'*');
   if(options.unknownR2)throw Error('lost write ack');
   if(objects.has(key))return null;
   objects.set(key,new Uint8Array(bytes));
   return {key};
  },
  get:async key=>{
   calls.get++;trace.push('R2_GET');
   const data=objects.get(key);
   if(!data)return null;
   return {arrayBuffer:async()=>options.badRead?
    new Uint8Array(data.length).buffer:new Uint8Array(data).buffer};
  },
 };
 const D1={prepare(sql){
  if(sql.startsWith('SELECT ')){
   return {bind(scope){assert.equal(scope,'d3-r2-d1-v1');return {
    first:async()=>{calls.select++;trace.push('D1_SELECT');return {...ptr};},
   };}};
  }
  assert.ok(sql.startsWith('UPDATE p3_delivery_benchmark_pointer '));
  return {bind(next,digest,runId,now,scope,e1,e2){
   assert.equal(scope,'d3-r2-d1-v1');
   assert.equal(e1,e2);
   return {first:async()=>{
    calls.update++;trace.push('D1_CAS');
    if(options.unknownD1)throw Error('lost cas ack');
    if(ptr.active_version!==e1)return null;
    ptr={active_version:next,active_sha256:digest,last_run_id:runId};
    return {...ptr};
   }};
  }};
 }};
 if(options.sessions){
  D1.withSession=mode=>{
   assert.equal(mode,'first-primary');
   trace.push('D1_PRIMARY_SESSION');
   return {prepare:D1.prepare};
  };
 }
 const bench=createD3StorageBenchmark({R2,D1,
  enabled:()=>options.enabled!==false});
 return {bench,calls,trace,objects,get pointer(){return ptr},
  setPointer:v=>{ptr=v}};
}
test('BENCH-01 default OFF never calls R2 or D1',async()=>{
 const f=fixture({enabled:false});
 await assert.rejects(f.bench.stageAndActivate({
  runId:version,expectedVersion:null,sizeBytes:1024,
 }),denied('BENCHMARK_DISABLED'));
 assert.deepEqual(f.calls,{get:0,put:0,select:0,update:0});
});
test('BENCH-02 staging then strongly read-back then atomic pointer',async()=>{
 const f=fixture();
 const result=await f.bench.stageAndActivate({
  runId:version,expectedVersion:null,sizeBytes:1024,
 });
 assert.equal(result.canonicalLive,false);
 assert.equal(result.state,'ActivatedTestOnly');
 assert.equal(result.testOnly,true);
 assert.equal(result.sizeBytes,1024);
 assert.equal(f.pointer.active_version,version);
 assert.ok(f.trace.indexOf('D1_CAS')>f.trace.indexOf('R2_GET'));
 const current=await f.bench.current();
 assert.equal(current.version,version);
 assert.equal(current.bytes.length,1024);
});
test('BENCH-03 changing pointer causes CAS refusal with no R2 write',async()=>{
 const f=fixture();
 f.setPointer({active_version:other,active_sha256:'a'.repeat(64),last_run_id:other});
 await assert.rejects(f.bench.stageAndActivate({
  runId:version,expectedVersion:null,sizeBytes:1024,
 }),denied('BENCHMARK_POINTER_CHANGED'));
 assert.equal(f.calls.put,0);
});
test('BENCH-04 duplicate run refused without accidental second write',async()=>{
 const f=fixture();
 await f.bench.stageAndActivate({runId:version,expectedVersion:null,sizeBytes:1024});
 await assert.rejects(f.bench.stageAndActivate({
  runId:version,expectedVersion:version,sizeBytes:1024,
 }),denied('BENCHMARK_RUN_ALREADY_APPLIED'));
 assert.equal(f.calls.put,1);
});
test('BENCH-05 corrupted read fails before CAS',async()=>{
 const f=fixture({badRead:true});
 await assert.rejects(f.bench.stageAndActivate({
  runId:version,expectedVersion:null,sizeBytes:1024,
 }),denied('R2_BYTES_MISMATCH'));
 assert.equal(f.calls.update,0);
});
test('BENCH-06 lost R2 ack cannot trigger a blind repeat',async()=>{
 const f=fixture({unknownR2:true});
 await assert.rejects(f.bench.stageAndActivate({
  runId:version,expectedVersion:null,sizeBytes:1024,
 }),denied('R2_WRITE_OUTCOME_UNKNOWN'));
 assert.equal(f.calls.put,1);
 assert.equal(f.calls.update,0);
});
test('BENCH-07 ambiguous D1 activation has no repeated CAS',async()=>{
 const f=fixture({unknownD1:true});
 await assert.rejects(f.bench.stageAndActivate({
  runId:version,expectedVersion:null,sizeBytes:1024,
 }),denied('D1_ACTIVATION_OUTCOME_UNKNOWN'));
 assert.equal(f.calls.put,1);
 assert.equal(f.calls.update,1);
});
test('BENCH-08 bounded synthetic payload and identifier only',async()=>{
 const f=fixture();
 for(const sizeBytes of [0,1023,65537,2.2]){
  await assert.rejects(f.bench.stageAndActivate({
   runId:version,expectedVersion:null,sizeBytes,
  }),denied('INVALID_BENCHMARK_REQUEST'));
 }
 assert.equal(f.calls.put,0);
});
test('BENCH-09 sequential synthetic versions and readback',async()=>{
 const f=fixture();
 await f.bench.stageAndActivate({runId:version,expectedVersion:null,sizeBytes:1024});
 const r=await f.bench.stageAndActivate({
  runId:other,expectedVersion:version,sizeBytes:2048,
 });
 assert.equal(r.version,other);
 assert.equal((await f.bench.current()).bytes.length,2048);
 assert.equal(f.objects.size,2);
});

test('BENCH-10 primary D1 session reads never rely on unconstrained replicas',async()=>{
 const f=fixture({sessions:true});
 await f.bench.stageAndActivate({
  runId:version,expectedVersion:null,sizeBytes:1024,
 });
 assert.ok(f.trace.filter(x=>x==='D1_PRIMARY_SESSION').length>=2);
});
