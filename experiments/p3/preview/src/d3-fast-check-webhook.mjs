/**
 * FISH118 D3 P1 — authenticated GitHub check_run event wake-up, SOURCE ONLY.
 * A webhook is NEVER proof of CI or merge eligibility. It may only wake
 * a preexisting, exact-head CHECKING operation in the private sandbox.
 * No exposed route, secret, D1 write, GitHub write or Cloudflare binding.
 */
const REPO_ID=1430581407,INSTALLATION_ID=174361658,ACTIONS_APP_ID=15368;
const REPO='ginosega/fishing-p3-sandbox',CHECK='validate-sandbox-head';
const SHA=/^[0-9a-f]{40}$/, GUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const enc=new TextEncoder();
const deny=code=>{throw new D3CheckWakeError(code);};
export class D3CheckWakeError extends Error{
 constructor(code){super('D3 check notification unavailable');this.name='D3CheckWakeError';this.code=code;}
}
const secureEqual=(a,b)=>{
 if(a.length!==b.length)return false;
 let value=0;
 for(let i=0;i<a.length;i++)value|=a[i]^b[i];
 return value===0;
};
export function createD3CheckWebhookWake({
 secret,lookupChecking,armWatchdog,enabled=()=>false,
}={}){
 if(typeof secret!=='string'||enc.encode(secret).length<32||
   typeof lookupChecking!=='function'||typeof armWatchdog!=='function'||
   typeof enabled!=='function')deny('INVALID_CONFIGURATION');
 const key=crypto.subtle.importKey('raw',enc.encode(secret),
  {name:'HMAC',hash:'SHA-256'},false,['sign']);
 async function handle(request){
  if(enabled()!==true)deny('DISABLED');
  if(!(request instanceof Request)||request.method!=='POST')
   deny('METHOD_DENIED');
  const header=request.headers.get('X-Hub-Signature-256');
  const delivery=request.headers.get('X-GitHub-Delivery');
  if(request.headers.get('X-GitHub-Event')!=='check_run'||
     !/^sha256=[0-9a-f]{64}$/.test(header??'')||
     !GUID.test(delivery??'')||
     request.headers.has('Cookie')||request.headers.has('Authorization'))
   deny('NOT_A_CHECK_EVENT');
  const declared=request.headers.get('Content-Length');
  if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>65536))
   deny('TOO_LARGE');
  const bytes=new Uint8Array(await request.arrayBuffer());
  if(bytes.length===0||bytes.length>65536)deny('TOO_LARGE');
  const signed=new Uint8Array(await crypto.subtle.sign('HMAC',await key,bytes));
  const presented=Uint8Array.from(header.slice(7).match(/../g).map(x=>parseInt(x,16)));
  if(!secureEqual(presented,signed))deny('SIGNATURE_DENIED');
  let payload;
  try{payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
  catch{deny('INVALID_PAYLOAD');}
  const check=payload?.check_run,repo=payload?.repository;
  if(payload?.action!=='completed'||repo?.id!==REPO_ID||
     repo.full_name!==REPO||repo.private!==true||
     payload?.installation?.id!==INSTALLATION_ID||
     check?.app?.id!==ACTIONS_APP_ID||check?.name!==CHECK||
     check?.status!=='completed'||check?.conclusion!=='success'||
     !SHA.test(check.head_sha??'')||
     !Number.isSafeInteger(check.id)||check.id<1)
   return Object.freeze({accepted:false,reason:'UNRELATED_CHECK'});
  // Repo ID + exact SHA are looked up in owner-scoped D1; PR identifiers
  // inside the webhook may be empty or untrusted. No writes based on event.
  const record=await lookupChecking({repositoryId:REPO_ID,headSha:check.head_sha});
  if(!record)return Object.freeze({accepted:false,reason:'NO_WAITING_OPERATION'});
  if(record.state!=='Checking'||record.repositoryId!==REPO_ID||
     record.prHeadSha!==check.head_sha||
     !/^p3_[0-9a-f-]{36}$/.test(record.operationId??''))
   deny('DURABLE_RECEIPT_DRIFT');
  // An alarm is an optimization; missing deliveries / lost acknowledgments
  // are reconciled from independent GitHub GETs by the recovery sweep.
  await armWatchdog({operationId:record.operationId,
   headSha:check.head_sha,reason:'signed-check-notification',delayMs:0});
  return Object.freeze({accepted:true,operationId:record.operationId,
   checkPassed:false,merged:false,canonicalLive:false});
 }
 return Object.freeze({handle});
}
