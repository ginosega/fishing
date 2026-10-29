/**
 * FISH118 D3 — opt-in, SANDBOX-only elapsed-time span collector.
 *
 * Monotonic durations ONLY within a single Worker/request invocation.
 * Wall clock (UTC) marks boundaries for rough cross-service correlation
 * and MUST NOT be subtracted from a GitHub server clock as precise elapsed.
 *
 * No headers, payloads, URLs, cookies, secrets, error stacks or user identity.
 * No public route or D1 schema migration. Disabled unless explicitly injected.
 */
const PHASES=new Set([
 'owner_submission','owner_authorization','canonical_source_validation',
 'idempotent_accept','dispatch_wait','lease_claim','snapshot_validation',
 'github_prepare_pr','check_observation','github_protected_merge',
 'host_delivery','public_byte_release_proof','state_to_live','owner_ui_refresh'
]);
const ID=/^p3_[0-9a-f-]{36}$/;
const outcome=s=>['ok','refused','unavailable','unknown'].includes(s);
const validNumber=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
const noop=Object.freeze({enabled:false,measure:async(_phase,fn)=>fn()});
export function createD3PublishingSpanRecorder({
 operationId,monotonic=()=>performance.now(),utc=()=>Date.now(),
 sink=async()=>{},enabled=false,
}={}){
 if(!enabled)return noop;
 if(!ID.test(operationId??'')||
  typeof monotonic!=='function'||typeof utc!=='function'||
  typeof sink!=='function')throw Error('Invalid D3 timing configuration');
 let spans=0,missing=0;
 async function measure(phase,fn){
  if(!PHASES.has(phase)||typeof fn!=='function'||spans>=80)
   throw Error('Invalid D3 stage span');
  const start=monotonic(),at=utc();
  if(!validNumber(start)||!validNumber(at))throw Error('Invalid D3 clock');
  let status='unknown';
  try{
   const result=await fn();
   status='ok';
   return result;
  }catch(err){
   // Fixed, non-sensitive status only. Never copy exception text.
   status='refused';throw err;
  }finally{
   const finish=monotonic(),end=utc();
   const duration=finish-start;
   const event=Object.freeze({
    schema:'fish-d3-publishing-timing-v1',operationId,phase,
    outcome:outcome(status)?status:'unknown',
    durationMs:validNumber(duration)?Math.round(duration*10)/10:null,
    startedAt:validNumber(at)?new Date(at).toISOString():null,
    finishedAt:validNumber(end)?new Date(end).toISOString():null,
    clockScope:'single-invocation-monotonic',
   });
   spans++;
   try{await sink(event);}catch{missing++;}
  }
 }
 function summary(){return Object.freeze({enabled:true,spans,droppedSinkEvents:missing});}
 return Object.freeze({enabled:true,measure,summary});
}
