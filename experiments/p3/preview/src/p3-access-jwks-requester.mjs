/**
 * FISH118 P3-30 — SOURCE ONLY. Exact-origin Access JWKS loader.
 * The caller must inject a trusted fetch capability; there is NO default fetch,
 * no deployed handler, no secrets, and no client-derived network destination.
 */
import {P3AccessError} from './p3-access-jwt-verifier.mjs';
import {readP3BoundedResponseText} from './p3-bounded-response.mjs';

const team=/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.cloudflareaccess\.com$/;
const reject=code=>{throw new P3AccessError(code);};
const validMs=n=>Number.isSafeInteger(n)&&n>0;
export function createP3AccessJwksRequester({
 issuer,fetchImpl,now=()=>Date.now(),makeSignal=ms=>AbortSignal.timeout(ms),
 ttlMs=300_000,timeoutMs=2_000,refreshCooldownMs=5_000,
}={}){
 if(typeof issuer!=='string'||!team.test(issuer)||
    typeof fetchImpl!=='function'||typeof now!=='function'||
    typeof makeSignal!=='function'||!validMs(ttlMs)||ttlMs>300_000||
    !validMs(timeoutMs)||timeoutMs>5_000||
    !validMs(refreshCooldownMs)||refreshCooldownMs>60_000)
  reject('INVALID_ACCESS_CONFIG');

 const expected=issuer+'/cdn-cgi/access/certs';
 let cached=null,inFlight=null,lastForcedAt=-Infinity;
 const responseOf=text=>new Response(text,{status:200,headers:{
  'Content-Type':'application/json','Cache-Control':'no-store',
 }});
 async function retrieve(){
  let response,text,keys;
  try{
   const signal=makeSignal(timeoutMs);
   if(!(signal instanceof AbortSignal))reject('ACCESS_KEYS_UNAVAILABLE');
   response=await fetchImpl(expected,{method:'GET',redirect:'manual',cache:'no-store',
    signal,headers:{Accept:'application/json'}});
   if(!(response instanceof Response)||response.status!==200||
      response.redirected||(response.url&&response.url!==expected))
    reject('ACCESS_KEYS_UNAVAILABLE');
   const type=response.headers.get('Content-Type')??'';
   if(!/^application\/json(?:\s*;|\s*$)/i.test(type))
    reject('ACCESS_KEYS_UNAVAILABLE');
   text=await readP3BoundedResponseText(response,32768);
   keys=JSON.parse(text);
   if(!keys||!Array.isArray(keys.keys)||keys.keys.length<1||
      keys.keys.length>20)reject('ACCESS_KEYS_UNAVAILABLE');
   const stamp=now();
   if(!validMs(stamp))reject('ACCESS_KEYS_UNAVAILABLE');
   cached={text,expiresAt:stamp+ttlMs};
  }catch{
   // No unverified or expired fallback, redirect, exception detail or URL leak.
   reject('ACCESS_KEYS_UNAVAILABLE');
  }
  return cached.text;
 }
 async function requestJwks(url,{forceRefresh=false}={}){
  if(url!==expected||typeof forceRefresh!=='boolean')
   reject('ACCESS_KEYS_UNAVAILABLE');
  const at=now();
  if(!validMs(at))reject('ACCESS_KEYS_UNAVAILABLE');
  if(cached&&at<cached.expiresAt&&
     (!forceRefresh||at-lastForcedAt<refreshCooldownMs))
   return responseOf(cached.text);
  if(!inFlight){
   if(forceRefresh)lastForcedAt=at;
   const task=retrieve();
   inFlight=task;
   // Reset only after the same promise settles; don't erase a later request.
   void task.finally(()=>{if(inFlight===task)inFlight=null;}).catch(()=>{});
  }
  const text=await inFlight;
  return responseOf(text);
 }
 return requestJwks;
}
