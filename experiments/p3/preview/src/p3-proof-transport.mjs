/**
 * FISH118 P3-36: SOURCE-ONLY experimental three-hop proof transport.
 * NO global fetch, no live Worker handler, no bindings, no provider settings,
 * no automatic retries, no GitHub mutation or deployment. Do not import from
 * deployed static-503 sentinels. Production wiring requires separate approval.
 */
import {P3AccessError} from './p3-access-jwt-verifier.mjs';
import {readP3BoundedResponseText} from './p3-bounded-response.mjs';
import {encodeP3ProofEnvelope,decodeP3ProofEnvelope,readP3ProofRequest,
 P3ProofEnvelopeError} from './p3-proof-envelope.mjs';

export class P3ProofTransportError extends Error {
 constructor(code){super('P3 signed-proof transport refused');this.name='P3ProofTransportError';this.code=code;}
}
const stop=code=>{throw new P3ProofTransportError(code);};
const check=(ok,code)=>{if(!ok)stop(code);};
const INGRESS='/p3/internal/accept';
const PRIVATE='https://fishing-p3-sandbox-preview.ginosega.workers.dev/_p3/internal/command';
const CLIENT_ID=/^[A-Za-z0-9._-]{12,200}\.access$/;
const OP=/^p3_[a-f0-9-]{36}$/;
const secureHeaders={
 'Content-Type':'application/json',
 'Cache-Control':'no-store',
};
const response=(status,code)=>new Response(JSON.stringify({ok:false,code}),{
 status,headers:{...secureHeaders,'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'"},
});
function ingressOrigin(origin){
 let u;
 try{u=new URL(origin);}catch{stop('INVALID_TRANSPORT_CONFIG');}
 check(u.protocol==='https:'&&u.origin===origin&&
  u.pathname==='/'&&!u.search&&!u.hash&&!u.username&&!u.password,
  'INVALID_TRANSPORT_CONFIG');
 return origin;
}
function accepted(record){
 check(record&&Object.getPrototypeOf(record)===Object.prototype&&
  Object.keys(record).sort().join(',')==='operationId,state'&&
  OP.test(record.operationId)&&record.state==='Accepted','ACCEPTANCE_OUTCOME_UNKNOWN');
 return Object.freeze({operationId:record.operationId,state:'Accepted'});
}
const enabled=(env,one,other,approved)=>env.P3_WRITE_ENABLED==='true'&&
 env[one]==='true'&&(!other||env[other]==='true')&&approved()===true;

/** The caller-injected transport handles Access service-token authentication;
 * this sender NEVER manufactures a Cloudflare Access JWT. */
export function createP3ProofSender({
 env,transport,operatorApproved=()=>false,
}={}){
 check(env&&typeof env==='object'&&typeof transport==='function'&&
  typeof operatorApproved==='function','INVALID_TRANSPORT_CONFIG');
 const send=async fields=>{
  check(enabled(env,'P3_PROOF_CLIENT_ENABLED',null,operatorApproved),
   'CLIENT_DISABLED');
  const origin=ingressOrigin(env.P3_ACCESS_INGRESS_ORIGIN);
  let wire;
  try{wire=encodeP3ProofEnvelope(fields);}catch{stop('INVALID_PROOF');}
  const request=new Request(origin+INGRESS,{
   method:'POST',headers:{'Content-Type':'application/json'},body:wire,
   redirect:'error',
  });
  let upstream;
  try{upstream=await transport(request);}
  catch{stop('TRANSPORT_OUTCOME_UNKNOWN');}
  if(!(upstream instanceof Response)||upstream.status!==202)
   stop('TRANSPORT_OUTCOME_UNKNOWN');
  let receipt;
  try{
   const value=await readP3BoundedResponseText(upstream,1024);
   receipt=JSON.parse(value);
  }catch{stop('TRANSPORT_OUTCOME_UNKNOWN');}
  check(receipt&&Object.getPrototypeOf(receipt)===Object.prototype&&
   Object.keys(receipt).sort().join(',')==='ok,operationId,state'&&
   receipt.ok===true,'TRANSPORT_OUTCOME_UNKNOWN');
  try{return accepted({operationId:receipt.operationId,state:receipt.state});}
  catch{stop('TRANSPORT_OUTCOME_UNKNOWN');}
 };
 return Object.freeze({send});
}
/** Access-only front door. It can check canonical structure, NOT authorize a
 * GitHub owner. It forwards exactly the same signed-proof bytes through an
 * injected Cloudflare private service binding, never global network fetch. */
export function createP3ProofIngress({
 env,verifyAccessJwt,operatorApproved=()=>false,
}={}){
 check(env&&typeof env==='object'&&typeof verifyAccessJwt==='function'&&
  typeof operatorApproved==='function','INVALID_TRANSPORT_CONFIG');
 async function handle(request){
  if(!enabled(env,'P3_INGRESS_ENABLED','P3_PROOF_TRANSPORT_ENABLED',
   operatorApproved))return response(503,'INGRESS_DISABLED');
  try{
   const origin=ingressOrigin(env.P3_ACCESS_INGRESS_ORIGIN);
   check(request instanceof Request,'INVALID_ROUTE');
   const url=new URL(request.url);
   check(request.method==='POST'&&url.origin===origin&&
    url.pathname===INGRESS&&!url.search&&!url.hash,'INVALID_ROUTE');
   const jwt=request.headers.get('Cf-Access-Jwt-Assertion');
   check(typeof jwt==='string'&&jwt.length>=64&&jwt.length<=8192,
    'ACCESS_DENIED');
   let verified;
   try{verified=await verifyAccessJwt(jwt);}
   catch{stop('ACCESS_DENIED');}
   check(CLIENT_ID.test(env.P3_ACCESS_SERVICE_CLIENT_ID??'')&&
    verified?.serviceClientId===env.P3_ACCESS_SERVICE_CLIENT_ID,
    'ACCESS_DENIED');
   check(typeof env.P3_COMMAND_SERVICE?.fetch==='function',
    'PRIVATE_BINDING_UNAVAILABLE');
   const wire=await readP3ProofRequest(request);
   // The only forwarded header is Content-Type. Access JWT, service client
   // ID/secret, cookies, Authorization and arbitrary client headers are dropped.
   // OIDC assertion and signed human approval are bounded *payload* proof.
   const internal=new Request(PRIVATE,{method:'POST',
    headers:{'Content-Type':'application/json'},body:wire,redirect:'error'});
   let upstream;
   try{upstream=await env.P3_COMMAND_SERVICE.fetch(internal);}
   catch{stop('PRIVATE_OUTCOME_UNKNOWN');}
   if(!(upstream instanceof Response)||upstream.status!==202)
    stop('PRIVATE_OUTCOME_UNKNOWN');
   let obj;
   try{obj=JSON.parse(await readP3BoundedResponseText(upstream,1024));}
   catch{stop('PRIVATE_OUTCOME_UNKNOWN');}
   check(obj&&Object.getPrototypeOf(obj)===Object.prototype&&
    Object.keys(obj).sort().join(',')==='ok,operationId,state'&&
    obj.ok===true,'PRIVATE_OUTCOME_UNKNOWN');
   const r=accepted({operationId:obj.operationId,state:obj.state});
   return new Response(JSON.stringify({ok:true,...r}),{
    status:202,headers:secureHeaders});
  }catch(e){
   if(e instanceof P3ProofEnvelopeError)
    return response(e.code==='PROOF_TOO_LARGE'?413:403,'INVALID_PROOF');
   if(e instanceof P3ProofTransportError)
    return response(e.code==='INVALID_ROUTE'?404:
     e.code==='ACCESS_DENIED'?403:503,
     e.code==='INVALID_ROUTE'?'INVALID_ROUTE':
     e.code==='ACCESS_DENIED'?'ACCESS_DENIED':'INGRESS_UNAVAILABLE');
   if(e instanceof P3AccessError)return response(403,'ACCESS_DENIED');
   return response(503,'INGRESS_UNAVAILABLE');
  }
 }
 return Object.freeze({handle});
}
/** Private receiver must be callable ONLY from the reviewed Service Binding.
 * Its injected atomicService MUST be constructed with P3-34 cryptographic
 * verifier and the P3-33 single-transaction D1 receiver; no client-provided
 * verified:true object is accepted as a transport proof. No DB fallback here. */
export function createP3ProofPrivateReceiver({
 env,atomicService,operatorApproved=()=>false,
}={}){
 check(env&&typeof env==='object'&&
  typeof atomicService?.accept==='function'&&
  typeof operatorApproved==='function','INVALID_TRANSPORT_CONFIG');
 async function handle(request){
  if(!enabled(env,'P3_COMMAND_BRIDGE_ENABLED','P3_PROOF_RECEIVER_ENABLED',
   operatorApproved))return response(503,'PRIVATE_DISABLED');
  try{
   check(request instanceof Request&&request.method==='POST'&&
    request.url===PRIVATE,'INVALID_ROUTE');
   const wire=await readP3ProofRequest(request);
   const proof=decodeP3ProofEnvelope(wire);
   let receipt;
   try{receipt=await atomicService.accept(proof);}
   catch{stop('ACCEPTANCE_OUTCOME_UNKNOWN');}
   const r=accepted(receipt);
   return new Response(JSON.stringify({ok:true,...r}),{
    status:202,headers:secureHeaders});
  }catch(e){
   if(e instanceof P3ProofEnvelopeError)
    return response(e.code==='PROOF_TOO_LARGE'?413:403,'INVALID_PROOF');
   if(e instanceof P3ProofTransportError)
    return response(e.code==='INVALID_ROUTE'?404:503,
     e.code==='INVALID_ROUTE'?'INVALID_ROUTE':'PRIVATE_OUTCOME_UNKNOWN');
   return response(503,'PRIVATE_OUTCOME_UNKNOWN');
  }
 }
 return Object.freeze({handle});
}
