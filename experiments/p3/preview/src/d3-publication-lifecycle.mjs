/**
 * FISH118 D3 -- local publication lifecycle for the future owner-only UI.
 * SOURCE ONLY / not imported by production PWA. The D2 sandbox writer stays
 * hard OFF. The server is ALWAYS authoritative for acceptance and Live.
 *
 * Never persist a form/package, GitHub credential, CSRF token, owner ID, or
 * idempotency key. Only a validated public operation identifier is retained
 * for later authenticated status lookups. Uncertain submissions remain in
 * memory with their ORIGINAL key/package and may be manually resubmitted
 * only with those exact bytes; there is no background retry/outbox.
 */
const OP=/^p3_[0-9a-f-]{36}$/;
const KEY=/^[A-Za-z0-9_-]{12,96}$/;
const STORAGE='fishing-v3-owner-publication-receipt-v1';
const DISMISSED='fishing-v3-owner-dismissed-terminal-v1';
const MAX_PACKAGE_BYTES=12*1024; // leave room for operation envelope (16 KiB service cap)
const utf8=new TextEncoder();
export class D3LifecycleError extends Error{
 constructor(code){
  const messages={
   PREVIOUS_PUBLICATION_NOT_LIVE:'The previous publication is not Live. Open Connection Status and check its status. If it Failed or Conflict, select Dismiss failed publication before saving this edit.',
   UNRESOLVED_SUBMISSION:'A previous submission has an uncertain result. Check Connection Status and preserve the original submission before retrying.',
   ALREADY_ACCEPTED:'A previous publication is still being tracked. Check Connection Status before publishing another edit.',
  };
  super(messages[code]??'Fishing publication lifecycle is unavailable');
  this.name='D3LifecycleError';this.code=code;
 }
}
const deny=code=>{throw new D3LifecycleError(code);};
const need=(v,code)=>{if(!v)deny(code);};
const stateObject = state=>Object.freeze({...state});
const validReport=(r,id)=>r&&r.operationId===id&&
 typeof r.state==='string'&&typeof r.terminal==='boolean'&&
 typeof r.publicLive==='boolean'&&typeof r.sandboxVerified==='boolean'&&
 typeof r.needsAttention==='boolean';
const acceptedPackage=p=>p?.format==='fishing-companion-change-v2'&&
 ['gear','kb','catches'].includes(p.domain)&&['add','edit'].includes(p.operation)&&
 ['keep','add','replace','remove'].includes(p.picture?.action)&&
 ['keep','set','remove'].includes(p.pictureSequence?.action??'keep');
const portableJson=value=>{
 let string;
 try{string=JSON.stringify(value);}catch{deny('INVALID_PACKAGE');}
 need(typeof string==='string'&&utf8.encode(string).length<=MAX_PACKAGE_BYTES,
  'INVALID_PACKAGE');
 try{return JSON.parse(string);}catch{deny('INVALID_PACKAGE');}
};
const restore=storage=>{
 if(!storage)return null;
 try{
  const raw=storage.getItem(STORAGE);
  if(typeof raw!=='string'||raw.length>300)return null;
  const row=JSON.parse(raw);
  return row?.version===1&&OP.test(row.operationId??'')&&
   row.canonicalLive===false?row.operationId:null;
 }catch{return null;}
};
const makeReceipt=id=>JSON.stringify({version:1,operationId:id,canonicalLive:false});
// Only an authenticated status-verified Failed/Conflict can be dismissed.
// The marker is an operation ID, never a package or authorization credential.
const readDismissed=storage=>{
 if(!storage)return null;
 try{
  const raw=storage.getItem(DISMISSED);
  if(typeof raw!=='string'||raw.length>300)return null;
  const row=JSON.parse(raw);
  return row?.version===1&&OP.test(row.operationId??'')?
   row.operationId:null;
 }catch{return null;}
};
const dismissedReceipt=id=>JSON.stringify({version:1,operationId:id});
export function createD3PublicationLifecycle({
 client,storage=null,makeKey=()=>crypto.randomUUID(),enabled=()=>false,
 mediaEnabled=()=>false,
 measure=async(_stage,work)=>work(),
}={}){
 need(typeof client?.publish==='function'&&typeof client?.status==='function'&&
  typeof makeKey==='function'&&typeof enabled==='function'&&
  typeof mediaEnabled==='function'&&
  typeof measure==='function'&&
  (storage===null||(typeof storage?.getItem==='function'&&
    typeof storage?.setItem==='function'&&typeof storage?.removeItem==='function')),
  'INVALID_CONFIGURATION');
 let operationId=restore(storage),attempt=null,report=null,inflight=null;
 let dismissedTerminalId=readDismissed(storage);
 let phase=operationId?'NeedsStatusCheck':'Idle',trackingStored=Boolean(operationId);
 const active=()=>need(enabled()===true,'NOT_ENABLED');
 const tracking=()=>stateObject({
  phase,operationId:operationId??null,trackingStored,
  canLeaveEditor:Boolean(operationId)&&phase!=='Saving'&&phase!=='Unknown',
  needsReconciliation:phase==='Unknown',
  // Only an authenticated server status can confirm Verified/Live.
  publicLive:report?.publicLive===true,
  sandboxVerified:report?.sandboxVerified===true,
  state:report?.state??null,
  summary:report?.summary??null,
 });
 const storeReceipt=id=>{
  if(storage===null)return false;
  try{
   storage.setItem(STORAGE,makeReceipt(id));
   return true;
  }catch{return false;}
 };
 function initialize(pkg,media){
  active();
  need(!operationId,'ALREADY_ACCEPTED');
  // submit() serializes both the previous-operation check and new request.
  need(acceptedPackage(pkg)&&Array.isArray(media)&&media.length<=24,
   'INVALID_PACKAGE');
  const changed=pkg.picture.action!=='keep'||
   (pkg.pictureSequence?.action??'keep')!=='keep'||media.length>0;
  need(!changed||mediaEnabled()===true,'MEDIA_REQUIRES_D4');
  const frozen=portableJson(pkg),tickets=portableJson(media);
  const bytes=JSON.stringify({package:frozen,media:tickets});
  if(attempt){
   need(bytes===attempt.json,'PAYLOAD_CHANGED_AFTER_SUBMIT');
  }else{
   const key=makeKey();
   need(KEY.test(key??''),'INVALID_IDEMPOTENCY_KEY');
   attempt={pkg:frozen,media:tickets,json:bytes,key};
  }
  return attempt;
 }
 // A new owner edit may be submitted only once the *server*, not local
 // storage or a stale screen, verifies the preceding sandbox operation Live.
 // Guard this status check with the same in-flight mutex as the POST.
 async function prepareNextPublication(){
  if(!operationId)return;
  const prior=operationId;
  let latest;
  try{latest=await client.status(prior);}
  catch(error){phase='NeedsStatusCheck';report=null;throw error;}
  need(validReport(latest,prior),'UNTRUSTED_STATUS');
  report=latest;phase=latest.state;
  need(latest.state==='Live'&&latest.terminal===true&&
   latest.sandboxVerified===true&&latest.publicLive===false&&
   latest.needsAttention===false,'PREVIOUS_PUBLICATION_NOT_LIVE');
  need(attempt===null,'UNRESOLVED_SUBMISSION');
  clearCompletedReceipt();
 }
 async function submit(pkg,media=[]){
  active();
  if(inflight)return inflight;
  inflight=(async()=>{
   await prepareNextPublication();
   const current=initialize(pkg,media);
   phase='Saving';
   try{
    const receipt=await measure('owner_submission',()=>client.publish({
     package:current.pkg,media:current.media,
     idempotencyKey:current.key,
    }));
    need(receipt&&OP.test(receipt.operationId??'')&&
     receipt.accepted===true&&receipt.canonicalLive===false,
     'UNTRUSTED_RECEIPT');
    operationId=receipt.operationId;
    trackingStored=storeReceipt(operationId);
    // A newly accepted operation supersedes the previous dismissed one.
    dismissedTerminalId=null;
    if(storage){try{storage.removeItem(DISMISSED);}catch{} }
    phase='Accepted';
    attempt=null;report=null;
    return tracking();
   }catch(error){
    // Unknown acknowledgements retain the exact in-memory key and
    // package. Never create another request with changed bytes.
    phase=['MEDIA_REQUIRES_D4','INVALID_PACKAGE','INVALID_CHANGE','INVALID_IDEMPOTENCY_KEY',
     'OWNER_SESSION_REQUIRED','OFFLINE_DENIED','SESSION_EXPIRED',
     'NOT_ENABLED'].includes(error?.code)?'Blocked':'Unknown';
    throw error;
   }
  })();
  try{return await inflight;}finally{inflight=null;}
 }
 // A fresh Android/browser profile has no local receipt. Read the owner's
 // latest durable server receipt, but never replace an ambiguous submission
 // or an already tracked operation. GET only; no queue/retry/publish.
 async function discover(){
  active();
  need(!inflight,'SUBMISSION_IN_PROGRESS');
  need(!attempt,'UNRESOLVED_SUBMISSION');
  if(operationId)return refresh();
  need(typeof client.latest==='function','STATUS_LOOKUP_UNAVAILABLE');
  let recent;
  try{recent=await client.latest();}
  catch(error){phase='NeedsStatusCheck';report=null;throw error;}
  if(recent===null){
   phase='Idle';report=null;
   return tracking();
  }
  need(OP.test(recent?.operationId??'')&&validReport(recent,recent.operationId)&&
   recent.publicLive===false,'UNTRUSTED_STATUS');
  // The server's latest receipt may still be the very same failure the
  // owner explicitly acknowledged. Never resurrect it after a reload or
  // a new Connection Status lookup. Do not hide new/pending operations.
  if(recent.operationId===dismissedTerminalId&&recent.terminal===true&&
   ['Failed','Conflict'].includes(recent.state)&&
   recent.needsAttention===true){
   phase='Idle';report=null;
   return tracking();
  }
  operationId=recent.operationId;
  trackingStored=storeReceipt(operationId);
  report=recent;phase=recent.state;
  return tracking();
 }
 async function refresh(){
  active();
  need(!inflight,'SUBMISSION_IN_PROGRESS');
  need(OP.test(operationId??''),'NO_DURABLE_OPERATION');
  const id=operationId;
  try{
   const data=await measure('owner_ui_refresh',()=>client.status(id));
   need(validReport(data,id),'UNTRUSTED_STATUS');
   report=data;
   phase=data.state;
   return tracking();
  }catch(error){
   // A network/auth failure is NOT evidence the operation failed.
   phase='NeedsStatusCheck';report=null;
   throw error;
  }
 }
 function clearCompletedReceipt(){
  const old=operationId;
  const confirmedFailed=report?.operationId===old&&
   report.terminal===true&&report.publicLive===false&&
   report.needsAttention===true&&
   ['Failed','Conflict'].includes(report.state);
  if(confirmedFailed){
   dismissedTerminalId=old;
   // Persist acknowledgement across reload; only the bounded operation ID
   // is kept. Storage denial cannot grant publishing or falsify server state.
   if(storage){try{storage.setItem(DISMISSED,dismissedReceipt(old));}catch{} }
  }
  if(storage){try{if(restore(storage)===old)storage.removeItem(STORAGE);}catch{
   deny('STORAGE_UNAVAILABLE');
  }}
  operationId=null;trackingStored=false;report=null;phase='Idle';
  return tracking();
 }
 function forgetCompleted(){
  active();
  need(!inflight&&!attempt,'UNRESOLVED_SUBMISSION');
  need(report?.terminal===true,'UNVERIFIED_TERMINAL_STATUS');
  return clearCompletedReceipt();
 }
 return Object.freeze({tracking,submit,discover,refresh,forgetCompleted});
}
