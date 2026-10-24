import {P3AccessError} from './p3-access-jwt-verifier.mjs';
/**
 * FISH118 P3-26 — SOURCE ONLY, no live route. Proposed Access ingress Worker.
 * Requires a separately reviewed Access policy+JWT config and private Worker
 * service binding. DO NOT deploy/enable under this source-only milestone.
 */
export class P3IngressError extends Error{
 constructor(code){super('P3 ingress refused request');this.name='P3IngressError';this.code=code;}
}
const nope=code=>{throw new P3IngressError(code);};
const assert=(v,code)=>{if(!v)nope(code);};
const LEGACY_LOGICAL='https://fishing-p3-sandbox-preview.ginosega.workers.dev/_p3/internal/command';
const INGRESS_PATH='/p3/internal/accept';
const MAX=8192;
const enc=new TextEncoder();
const json=(status,obj)=>new Response(JSON.stringify(obj),{status,headers:{
 'Content-Type':'application/json','Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
 'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",
}});
async function readLimited(req){
 const ct=req.headers.get('Content-Type');
 assert(ct==='application/json','CONTENT_TYPE_DENIED');
 const n=req.headers.get('Content-Length');
 assert(n===null||(/^\d+$/.test(n)&&Number(n)<=MAX),'PAYLOAD_TOO_LARGE');
 assert(req.body?.getReader,'EMPTY_REQUEST');
 const reader=req.body.getReader(),chunks=[];let size=0;
 try{
  for(;;){const {done,value}=await reader.read();if(done)break;
   size+=value.length;assert(size<=MAX,'PAYLOAD_TOO_LARGE');
   chunks.push(value);
  }
 }finally{reader.releaseLock();}
 assert(size>0,'EMPTY_REQUEST');
 const out=new Uint8Array(size);let off=0;
 for(const chunk of chunks){out.set(chunk,off);off+=chunk.length;}
 return out;
}
export function createP3AccessIngress({
 env,verifyAccessJwt,operatorApproved=()=>false,
}={}){
 assert(env&&typeof env==='object'&&typeof verifyAccessJwt==='function'&&
  typeof operatorApproved==='function','INVALID_INGRESS_CONFIG');
 const active=()=>env.P3_INGRESS_ENABLED==='true'&&
  env.P3_WRITE_ENABLED==='true'&&operatorApproved()===true;
 async function fetch(request){
  // Disabled before URL checks, body reads, credential handling or bound calls.
  if(!active())return json(503,{ok:false,code:'INGRESS_DISABLED'});
  try{
   assert(request instanceof Request,'INVALID_ROUTE');
   const u=new URL(request.url),configured=new URL(env.P3_ACCESS_INGRESS_ORIGIN);
   assert(configured.protocol==='https:'&&configured.origin===env.P3_ACCESS_INGRESS_ORIGIN&&
    configured.pathname==='/'&&configured.search===''&&configured.hash===''&&
    u.origin===configured.origin&&u.pathname===INGRESS_PATH&&
    !u.search&&request.method==='POST','INVALID_ROUTE');
   const proof=request.headers.get('Cf-Access-Jwt-Assertion');
   assert(typeof proof==='string'&&proof.length>=64&&proof.length<=8192,
    'ACCESS_REQUIRED');
   const identity=await verifyAccessJwt(proof);
   assert(identity?.serviceClientId===env.P3_ACCESS_SERVICE_CLIENT_ID,
    'ACCESS_REQUIRED');
   assert(typeof env.P3_COMMAND_SERVICE?.fetch==='function',
    'SERVICE_BINDING_MISSING');
   const bytes=await readLimited(request);
   // Access JWT/service-token credentials and arbitrary user headers MUST NOT
   // cross the private service boundary. HMAC signed payload is unchanged.
   const headers=new Headers({'Content-Type':'application/json'});
   for(const name of ['X-P3-Timestamp','X-P3-Nonce','X-P3-Signature']){
    const value=request.headers.get(name);
    assert(typeof value==='string'&&value.length<=256,'COMMAND_AUTH_MISSING');
    headers.set(name,value);
   }
   const internal=new Request(LEGACY_LOGICAL,{
    method:'POST',headers,body:bytes,redirect:'error',
   });
   const upstream=await env.P3_COMMAND_SERVICE.fetch(internal);
   assert(upstream instanceof Response,'UPSTREAM_UNAVAILABLE');
   if(upstream.status===202){
    const response=await upstream.text();
    assert(enc.encode(response).length<=1024,'UPSTREAM_UNAVAILABLE');
    let r;
    try{r=JSON.parse(response);}catch{nope('UPSTREAM_UNAVAILABLE');}
    assert(r&&Object.keys(r).sort().join(',')==='ok,operationId,state'&&
     r.ok===true&&typeof r.operationId==='string'&&
     /^p3_[0-9a-f-]{36}$/.test(r.operationId)&&
     ['Accepted','Validating','Checking'].includes(r.state),'UPSTREAM_UNAVAILABLE');
    return json(202,{ok:true,operationId:r.operationId,state:r.state});
   }
   // No downstream error bodies or internal exception text cross the ingress.
   return json(503,{ok:false,code:'COMMAND_NOT_ACCEPTED'});
  }catch(e){
   // Invalid signed Access identity is a denial. Unavailable/rotating JWKS
   // is an availability failure, never an authentication bypass.
   if(e instanceof P3AccessError){
    return json(e.code==='ACCESS_TOKEN_INVALID'||e.code==='ACCESS_IDENTITY_DENIED'?403:503,
     {ok:false,code:e.code==='ACCESS_TOKEN_INVALID'||e.code==='ACCESS_IDENTITY_DENIED'?
      'ACCESS_DENIED':'ACCESS_VERIFICATION_UNAVAILABLE'});
   }
   if(e instanceof P3IngressError){
    return json(e.code==='INVALID_ROUTE'?404:
     ['ACCESS_REQUIRED','INVALID_ACCESS_CONFIG','ACCESS_TOKEN_INVALID',
      'ACCESS_IDENTITY_DENIED'].includes(e.code)?403:
     ['PAYLOAD_TOO_LARGE'].includes(e.code)?413:503,{ok:false,
      code:['ACCESS_REQUIRED','ACCESS_IDENTITY_DENIED','ACCESS_TOKEN_INVALID'].includes(e.code)?
       'ACCESS_DENIED':e.code});
   }
   // Access verifier may use its own safe error class; always collapse.
   return json(503,{ok:false,code:'INGRESS_UNAVAILABLE'});
  }
 }
 return Object.freeze({fetch});
}
