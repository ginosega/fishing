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
 'merge_fast_independent_proof',
 'host_delivery','hosted_byte_release_proof','public_byte_release_proof','state_to_live','owner_ui_refresh',
 // Fixed path-free groups bound event count regardless of Markdown inventory.
 'source_snapshot_total','source_repository_get','source_main_initial_get',
 'source_commit_get','source_tree_get','source_canonical_blobs',
 'source_narrative_blobs','source_main_final_get',
 // Each phase is a path-free, payload-free label; no request metadata.
 'check_token_issue','check_repository_get','check_main_initial_get',
 'check_pr_initial_get','check_runs_get','check_main_final_get',
 'check_pr_final_get','merge_pr_evidence_get','merge_main_evidence_get'
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
  if(typeof fn!=='function')throw Error('Invalid D3 timing callback');
  // Observability must NEVER change publishing/recovery behavior. An
  // unknown label or a full span budget executes the trusted work without
  // emitting a record (and without allowing untrusted label text into logs).
  if(!PHASES.has(phase)||spans>=80)return fn();
  let start,at;
  try{start=monotonic();at=utc();}catch{return fn();}
  if(!validNumber(start)||!validNumber(at))return fn();
  let status='unknown';
  try{
   const result=await fn();
   status='ok';
   return result;
  }catch(err){
   // Fixed, non-sensitive status only. Never copy exception text.
   status='refused';throw err;
  }finally{
   try{
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
   await sink(event);
   }catch{missing++;} // Never allow failed timing to override a merge result.
  }
 }
 function summary(){return Object.freeze({enabled:true,spans,droppedSinkEvents:missing});}
 return Object.freeze({enabled:true,measure,summary});
}
