/**
 * FISH118 D3 R2+D1 delivery latency pilot — synthetic data only.
 * This is NEVER a canonical GitHub content publisher or a Live proof.
 * The owner gateway must authenticate every request before invoking this.
 * D1 table is a separate, singleton, sandbox-only scope; R2 key namespace is
 * dedicated and must not be exposed through a public bucket endpoint.
 */
const SCOPE='d3-r2-d1-v1';
const VERSION=/^bench_[0-9a-f]{32}$/;
const DIGEST=/^[0-9a-f]{64}$/;
const MIN_BYTES=1024,MAX_BYTES=65536;
const utf8=new TextEncoder();
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
const digest=async bytes=>hex(await crypto.subtle.digest('SHA-256',bytes));
const fail=code=>{throw new D3StorageBenchmarkError(code)};
const need=(ok,code)=>{if(!ok)fail(code)};
const validVersion=s=>s===null||VERSION.test(s??'');
const key=v=>'d3-r2-d1-benchmark/versions/'+v+'/synthetic.bin';
export class D3StorageBenchmarkError extends Error{
 constructor(code){super('D3 isolated storage benchmark denied');this.name='D3StorageBenchmarkError';this.code=code;}
}
export function createD3StorageBenchmark({R2,D1,enabled=()=>false}={}){
 need(typeof R2?.put==='function'&&typeof R2?.get==='function'&&
  typeof D1?.prepare==='function'&&typeof enabled==='function',
  'INVALID_BINDINGS');
 const gate=()=>need(enabled()===true,'BENCHMARK_DISABLED');
 async function row(){
  // Never allow an unbookmarked stale read replica to supply the active
  // version. Start the read at the D1 primary when Sessions API exists.
  const primary=typeof D1.withSession==='function'?
   D1.withSession('first-primary'):D1;
  const value=await primary.prepare(
   'SELECT active_version,active_sha256,last_run_id FROM p3_delivery_benchmark_pointer WHERE scope=?'
  ).bind(SCOPE).first();
  need(value!==null&&validVersion(value.active_version)&&
   (value.active_sha256===null||DIGEST.test(value.active_sha256))&&
   (value.last_run_id===null||VERSION.test(value.last_run_id)),
   'BENCHMARK_SCHEMA_NOT_READY');
  return value;
 }
 async function readVersion(version,sha256){
  const obj=await R2.get(key(version));
  need(obj&&typeof obj.arrayBuffer==='function','R2_OBJECT_MISSING');
  const bytes=new Uint8Array(await obj.arrayBuffer());
  need(bytes.length>=MIN_BYTES&&bytes.length<=MAX_BYTES&&
   await digest(bytes)===sha256,'R2_BYTES_MISMATCH');
  return bytes;
 }
 async function current(){
  gate();
  const item=await row();
  if(item.active_version===null){
   need(item.active_sha256===null&&item.last_run_id===null,
    'BENCHMARK_SCHEMA_DRIFT');
   return Object.freeze({state:'Empty',testOnly:true,version:null,sha256:null});
  }
  need(item.last_run_id===item.active_version&&
   DIGEST.test(item.active_sha256),'BENCHMARK_SCHEMA_DRIFT');
  const bytes=await readVersion(item.active_version,item.active_sha256);
  return Object.freeze({state:'ActivatedTestOnly',testOnly:true,
   version:item.active_version,sha256:item.active_sha256,
   sizeBytes:bytes.length,bytes});
 }
 async function stageAndActivate({runId,expectedVersion,sizeBytes}={}){
  gate();
  need(VERSION.test(runId??'')&&validVersion(expectedVersion)&&
   Number.isSafeInteger(sizeBytes)&&sizeBytes>=MIN_BYTES&&
   sizeBytes<=MAX_BYTES,'INVALID_BENCHMARK_REQUEST');
  const existing=await row();
  if(existing.last_run_id===runId){
   // Do not rerun an ambiguous/acknowledged benchmark operation.
   fail('BENCHMARK_RUN_ALREADY_APPLIED');
  }
  need(existing.active_version===expectedVersion,'BENCHMARK_POINTER_CHANGED');
  const bytes=new Uint8Array(sizeBytes);
  for(let i=0;i<bytes.length;i++)bytes[i]=(i*31+17)&255;
  const sha256=await digest(bytes);
  const r2key=key(runId);
  let stored;
  try{
   stored=await R2.put(r2key,bytes,{
    onlyIf:new Headers({'If-None-Match':'*'}),
    httpMetadata:{contentType:'application/octet-stream'},
   });
  }catch{fail('R2_WRITE_OUTCOME_UNKNOWN');}
  // Conditional, create-once R2 PUT. A failed/missing ack is never retried.
  need(stored!==null,'R2_IMMUTABLE_OBJECT_EXISTS');
  await readVersion(runId,sha256);
  // CAS is atomic on the D1 PRIMARY. Ambiguous results must never be
  // rewritten. The caller can perform a read-only current() reconciliation.
  let updated;
  try{
   updated=await D1.prepare(
    'UPDATE p3_delivery_benchmark_pointer SET active_version=?,active_sha256=?,last_run_id=?,updated_at=? WHERE scope=? AND ((active_version IS NULL AND ? IS NULL) OR active_version=?) RETURNING active_version,active_sha256,last_run_id'
   ).bind(runId,sha256,runId,Math.floor(Date.now()/1000),
    SCOPE,expectedVersion,expectedVersion).first();
  }catch{fail('D1_ACTIVATION_OUTCOME_UNKNOWN');}
  need(updated?.active_version===runId&&
   updated?.active_sha256===sha256&&
   updated?.last_run_id===runId,'D1_POINTER_CAS_FAILED');
  // A Worker binding readback is NOT a publicly independent host proof.
  const final=await current();
  need(final.version===runId&&final.sha256===sha256,
   'D1_ACTIVATION_UNVERIFIED');
  return Object.freeze({state:'ActivatedTestOnly',testOnly:true,
   canonicalLive:false,runId,version:runId,sha256,sizeBytes});
 }
 return Object.freeze({current,stageAndActivate});
}
