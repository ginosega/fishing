/**
 * FISH118 P1 — one-operation, durable-alarm-compatible progress and recovery.
 * Source-only. Each invocation does at most ONE trusted coordinator step,
 * then schedules a new wake. No long-lived waitUntil, busy loop, blind
 * GitHub merge repeat, new Worker route or new Cloudflare subscription.
 * D1 operation and merge write-ahead marker remain authoritative.
 */
const ID=/^p3_[0-9a-f-]{36}$/;
const pending=new Set(['Accepted','Validating','Checking','Merging','Deploying','Verifying']);
const terminal=new Set(['Live','Conflict','Failed']);
export class D3WakeError extends Error {
 constructor(code){super('D3 event-driven wake unavailable');this.name='D3WakeError';this.code=code;}
}
const deny=x=>{throw new D3WakeError(x)};
export function createD3FastWatchdog({
 getOperation,runOneStep,readOnlyRecoverMerge,arm,
 now=()=>Date.now(),enabled=()=>false,delayMs=8500,
}={}){
 if([getOperation,runOneStep,readOnlyRecoverMerge,arm,now,enabled].some(x=>typeof x!=='function')||
  !Number.isSafeInteger(delayMs)||delayMs<2000||delayMs>30000)
  deny('INVALID_CONFIG');
 const ready=()=>{if(enabled()!==true)deny('OFF')};
 const valid=id=>{if(!ID.test(id??''))deny('INVALID_OPERATION')};
 async function schedule(operationId,why,waitMs){
  const when=now()+waitMs;
  if(!Number.isSafeInteger(when)||when<0)deny('INVALID_CLOCK');
  // Alarm ack must be observed; on an ambiguous outcome the Cron scan
  // recovers from the existing D1 operation, never a new git write.
  await arm({operationId,deadlineMs:when,reason:why});
  return when;
 }
 async function notify(operationId,{reason='durable-accept'}={}){
  ready();valid(operationId);
  if(!['durable-accept','signed-check-notification','recovery'].includes(reason))
   deny('INVALID_WAKE_REASON');
  const record=await getOperation(operationId);
  if(!record||record.operationId!==operationId)deny('NOT_FOUND');
  if(terminal.has(record.state))return Object.freeze({terminal:true,scheduled:false});
  if(!pending.has(record.state))deny('BAD_STATE');
  // The notifier returns ONLY after an alarm is durably armed.
  const deadlineMs=await schedule(operationId,reason,0);
  return Object.freeze({terminal:false,scheduled:true,deadlineMs});
 }
 async function onAlarm(operationId,{stallCount=0}={}){
  if(!Number.isSafeInteger(stallCount)||stallCount<0||stallCount>1000)
   deny('INVALID_STALL_COUNT');
  ready();valid(operationId);
  const before=await getOperation(operationId);
  if(!before||before.operationId!==operationId)deny('NOT_FOUND');
  if(terminal.has(before.state))return Object.freeze({terminal:true,scheduled:false});
  if(!pending.has(before.state))deny('BAD_STATE');
  // The pending merge marker is an absolute no-repeat barrier.
  // Only independently verified read-only reconciliation may advance.
  if(before.state==='Merging'&&before.reasonCode==='merge_attempted'&&
     before.mergeSha===null){
   await readOnlyRecoverMerge({operationId});
  }else{
   try{await runOneStep({operationId});}
   catch(error){
    // Only known read-only CI-not-ready results are retriable. Failed CI,
    // lost GitHub write acknowledgments, invalid identity and all other
    // errors MUST surface; DO alarm redelivery + D1 guards handle recovery.
    const retryable=(before.state==='Checking'&&
     ['CHECK_PENDING','CHECK_MISSING_OR_AMBIGUOUS'].includes(error?.code))||
    (before.state==='Verifying'&&
     error?.code==='PRODUCTION_ORIGIN_UNAVAILABLE');
    if(!retryable)throw error;
   }
  }
  const after=await getOperation(operationId);
  if(!after||after.operationId!==operationId)deny('RECEIPT_CHANGED');
  if(terminal.has(after.state))
   return Object.freeze({terminal:true,scheduled:false,state:after.state});
  if(!pending.has(after.state))deny('BAD_STATE');
  const progressed=after.state!==before.state;
  // Immediately advance deterministic states, check pending CI at bounded
  // interval, wait for expired merge lease before read-only reconstruction.
  const stalledMs=stallCount>=20?60000:stallCount>=5?30000:delayMs;
  const nextMs=progressed?0:
   after.state==='Merging'&&after.reasonCode==='merge_attempted'?30000:
   stalledMs;
  const deadlineMs=await schedule(operationId,progressed?'progress':'retry',nextMs);
  return Object.freeze({terminal:false,scheduled:true,progressed,
   state:after.state,deadlineMs});
 }
 return Object.freeze({notify,onAlarm});
}
