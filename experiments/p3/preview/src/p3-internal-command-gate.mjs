/**
 * FISH118 P3-20 — SOURCE ONLY trusted command-auth boundary.
 *
 * NOT imported by deployed Worker and does not export fetch/default handler.
 * An implementation MUST inject a persistent atomic nonce gate before activation.
 * Never use an in-memory nonce set, sequential D1 REST writes, or this helper
 * alone as authority to publish/merge/deploy.
 */
export class P3CommandGateError extends Error{
 constructor(code){super('P3 trusted command refused');this.name='P3CommandGateError';this.code=code;}
}
const reject=code=>{throw new P3CommandGateError(code);};
const demand=(v,code)=>{if(!v)reject(code);};
const enc=new TextEncoder();
const ORIGIN='https://fishing-p3-sandbox-preview.ginosega.workers.dev';
const PATH='/_p3/internal/command';
const REPO_ID=1430581407,WINDOW_MS=60_000,MAX_BYTES=8192;
const keyPattern=/^[A-Za-z0-9_-]{12,96}$/;
const noncePattern=/^[A-Za-z0-9_-]{22,64}$/;
const sigPattern=/^[A-Za-z0-9_-]{43}$/;
const validOwner=n=>Number.isSafeInteger(n)&&n>0;
const validTime=n=>Number.isSafeInteger(n)&&n>0;
const hex=bytes=>[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
const base64Url=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes)))
 .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const fromB64Url=value=>{
 demand(sigPattern.test(value),'INVALID_SIGNATURE');
 try{
  const encoded=value.replace(/-/g,'+').replace(/_/g,'/');
  const result=Uint8Array.from(atob(encoded+'='),c=>c.charCodeAt(0));
  demand(result.length===32&&base64Url(result)===value,'INVALID_SIGNATURE');
  return result;
 }catch(e){if(e instanceof P3CommandGateError)throw e;reject('INVALID_SIGNATURE');}
};
async function hmacKey(secret){
 demand(typeof secret==='string'&&secret.length>=32&&secret.length<=512,
  'INVALID_HMAC_CONFIGURATION');
 return crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
async function contentsHash(bytes){return hex(await crypto.subtle.digest('SHA-256',bytes));}
function signedMessage({method,path,at,nonce,bodyHash}){
 return enc.encode(['p3-command-v1',method,path,String(at),nonce,bodyHash].join('\n'));
}
function validateEnvelope(obj){
 demand(obj&&Object.getPrototypeOf(obj)===Object.prototype&&
  Object.keys(obj).sort().join(',')==='action,idempotencyKey,snapshot','INVALID_ENVELOPE');
 demand(obj.action==='accept'&&keyPattern.test(obj.idempotencyKey),'INVALID_ENVELOPE');
 const snap=obj.snapshot;
 demand(snap&&Object.getPrototypeOf(snap)===Object.prototype&&
  snap.package&&Object.getPrototypeOf(snap.package)===Object.prototype&&
  snap.package.format==='fishing-companion-change-v2'&&
  ['gear','kb'].includes(snap.package.domain)&&
  ['add','edit'].includes(snap.package.operation)&&
  Array.isArray(snap.media)&&snap.media.length===0,'INVALID_ENVELOPE');
 return {idempotencyKey:obj.idempotencyKey,snapshot:snap};
}
async function limitedBody(request){
 const contentType=request.headers.get('Content-Type');
 demand(contentType?.toLowerCase()==='application/json','INVALID_CONTENT_TYPE');
 const length=request.headers.get('Content-Length');
 if(length!==null)demand(/^\d+$/.test(length)&&Number(length)<=MAX_BYTES,'PAYLOAD_TOO_LARGE');
 demand(request.body?.getReader,'EMPTY_PAYLOAD');
 const reader=request.body.getReader();const chunks=[];let size=0;
 try{
  for(;;){
   const {value,done}=await reader.read();
   if(done)break;
   size+=value.byteLength;demand(size<=MAX_BYTES,'PAYLOAD_TOO_LARGE');
   chunks.push(value);
  }
 }finally{reader.releaseLock();}
 demand(size>0,'EMPTY_PAYLOAD');
 const bytes=new Uint8Array(size);let offset=0;
 for(const piece of chunks){bytes.set(piece,offset);offset+=piece.length;}
 return bytes;
}
const answer=(code,status)=>new Response(JSON.stringify({ok:false,code}),{
 status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff'},
});
export async function signP3InternalCommand({secret,nonce,timestamp,body}={}){
 demand(noncePattern.test(nonce)&&validTime(timestamp)&&typeof body==='string',
  'INVALID_SIGN_REQUEST');
 const bytes=enc.encode(body);demand(bytes.length>0&&bytes.length<=MAX_BYTES,'PAYLOAD_TOO_LARGE');
 const key=await hmacKey(secret);
 const digest=await contentsHash(bytes);
 const mac=await crypto.subtle.sign('HMAC',key,signedMessage({
  method:'POST',path:PATH,at:timestamp,nonce,bodyHash:digest}));
 return Object.freeze({'X-P3-Timestamp':String(timestamp),'X-P3-Nonce':nonce,
  'X-P3-Signature':base64Url(mac)});
}
/**
 * P3-34 verify-only HMAC authority. Uses EXACT P3-20 signing domain, path,
 * body bytes, timestamp and nonce. It has NO database, replay-store, network
 * or publishing effects. The atomic D1 batch must independently consume nonce.
 * Caller must validate the HTTP route/Access and only use this server-side.
 */
export async function verifyP3InternalCommandSignature({
 secret,nonce,timestamp,signature,body,now=()=>Date.now(),
}={}){
 demand(typeof now==='function'&&noncePattern.test(nonce)&&
  validTime(timestamp)&&Number.isSafeInteger(timestamp)&&
  /^\d{13}$/.test(String(timestamp))&&
  typeof body==='string'&&enc.encode(body).byteLength>0&&
  enc.encode(body).byteLength<=MAX_BYTES,'INVALID_AUTH_HEADERS');
 const clock=now();
 demand(validTime(clock)&&Math.abs(clock-timestamp)<=WINDOW_MS,'EXPIRED_COMMAND');
 const bytes=enc.encode(body);
 const key=await hmacKey(secret);
 const valid=await crypto.subtle.verify('HMAC',key,fromB64Url(signature),
  signedMessage({method:'POST',path:PATH,at:timestamp,nonce,
   bodyHash:await contentsHash(bytes)}));
 demand(valid===true,'INVALID_SIGNATURE');
 return Object.freeze({
  verified:true,nonceValue:nonce,timestampMs:timestamp,
  bodySha256:await contentsHash(bytes),
 });
}
export function createP3InternalCommandGate({
 env,ownerGitHubId,consumeNonce,acceptSnapshot,operatorApproved=()=>false,
 now=()=>Date.now(),
}={}){
 demand(env&&typeof env==='object'&&validOwner(ownerGitHubId)&&
  typeof consumeNonce==='function'&&typeof acceptSnapshot==='function'&&
  typeof operatorApproved==='function'&&typeof now==='function',
  'INVALID_GATE_CONFIGURATION');
 const enabled=()=>env.P3_WRITE_ENABLED==='true'&&
  env.P3_COMMAND_BRIDGE_ENABLED==='true'&&operatorApproved()===true;
 async function handle(request){
  // Fail closed before reading request body, minting a token or touching DB.
  if(!enabled())return answer('DISABLED',503);
  try{
   const u=new URL(request.url);
   demand(u.origin===ORIGIN&&u.pathname===PATH&&!u.search&&
    request.method==='POST','INVALID_ROUTE');
   const timestampText=request.headers.get('X-P3-Timestamp');
   const nonce=request.headers.get('X-P3-Nonce');
   const signature=request.headers.get('X-P3-Signature');
   demand(/^\d{13}$/.test(timestampText??'')&&noncePattern.test(nonce),
    'INVALID_AUTH_HEADERS');
   demand(typeof signature==='string'&&sigPattern.test(signature),
    'INVALID_SIGNATURE');
   const at=Number(timestampText),clock=now();
   demand(validTime(at)&&validTime(clock)&&Math.abs(clock-at)<=WINDOW_MS,'EXPIRED_COMMAND');
   const bytes=await limitedBody(request);
   const key=await hmacKey(env.P3_BRIDGE_HMAC_SECRET);
   const verified=await crypto.subtle.verify('HMAC',key,fromB64Url(signature),
    signedMessage({method:'POST',path:PATH,at,nonce,bodyHash:await contentsHash(bytes)}));
   demand(verified===true,'INVALID_SIGNATURE');
   let envelope;
   try{envelope=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
   catch{reject('MALFORMED_JSON');}
   const command=validateEnvelope(envelope);
   // This MUST be an atomic, durable INSERT-if-absent in the isolated D1,
   // including expiry handling. A replayed nonce MUST return false.
   const nonceHash=await contentsHash(enc.encode(nonce));
   const fresh=await consumeNonce({nonceSha256:nonceHash,issuedAt:at,
    ownerGitHubId,repositoryId:REPO_ID});
   demand(fresh===true,'REPLAY_OR_NONCE_STORE_FAILED');
   const record=await acceptSnapshot({...command,ownerGitHubId,repositoryId:REPO_ID});
   demand(typeof record?.operationId==='string'&&
    /^p3_[0-9a-f-]{36}$/.test(record.operationId)&&
    ['Accepted','Validating','Checking'].includes(record.state),'INVALID_ACCEPT_RECEIPT');
   return new Response(JSON.stringify({ok:true,operationId:record.operationId,state:record.state}),{
    status:202,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  }catch(e){
   // Exception text and raw Cloudflare/GitHub HTTP responses are never returned.
   if(e instanceof P3CommandGateError){
    const status=e.code==='REPLAY_OR_NONCE_STORE_FAILED'?409:403;
    return answer(e.code,status);
   }
   return answer('INTERNAL_COMMAND_FAILED',503);
  }
 }
 return Object.freeze({handle});
}
