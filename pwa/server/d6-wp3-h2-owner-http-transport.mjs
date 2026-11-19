/**
 * FISH-TODO-118 / WP3 H2 — first-party owner HTTP transport, SOURCE ONLY.
 *
 * Intended to run ONLY inside an authenticated top-level Edge page on the
 * isolated H2 origin (not a Node CLI, extension, iframe, or cross-origin
 * script). There is no automatic start, retry, background polling, token
 * logging, or publisher. The server independently authorizes the owner,
 * CSRF, current phase and one D1-derived next step on every POST.
 *
 * Caller supplies one exact source-pinned synthetic JSON envelope to send
 * once; it must NOT be reconstructed or selected by browser input.
 */
const ORIGIN='https://fishing-v3-wp3-test.ginosega.workers.dev';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CSRF=/^[A-Za-z0-9_-]{43}$/;
const SHA=/^[a-f0-9]{64}$/;
const STAGES=new Set([
 'MAIN_LOOKUP','MAIN_UNVERIFIED','GATE_REVOKED',
 'RECEIPT_ACCEPT','RECEIPT_INTAKE','RECEIPT_LOOKUP',
 'RECEIPT_SOURCE_REVIEW','RECEIPT_CANDIDATE',
 'RECEIPT_INSERT','RECEIPT_READBACK','RECEIPT_FORMAT',
]);
const MAX_JSON=4096;

export class D6H2OwnerTransportError extends Error{
 constructor(code){
  super('H2 first-party owner request denied or uncertain');
  this.name='D6H2OwnerTransportError';this.code=code;
 }
}
const deny=code=>{throw new D6H2OwnerTransportError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
const validPath=(mode,id)=>{
 if(mode==='intake')return '/api/v3/operations';
 need(UUID.test(id??''),'INVALID_OPERATION');
 const action=mode==='step'?'begin':
  mode==='reconcile'?'reconcile':mode==='status'?'status':null;
 need(action!==null,'INVALID_ACTION');
 return '/api/v3/operations/'+id+'/'+action;
};

export function createD6H2FirstPartyOwnerTransport({
 pageOrigin,topLevel,network=globalThis.fetch,
 expectedEnvelopeSha256,sha256,
}={}){
 need(pageOrigin===ORIGIN&&topLevel===true&&
  typeof network==='function'&&
  SHA.test(expectedEnvelopeSha256??'')&&typeof sha256==='function',
  'INVALID_BROWSER_CONTEXT');
 let token=null;
 async function csrf(){
  if(token)return token;
  let response;
  try{
   response=await network(ORIGIN+'/api/v3/h2/owner-csrf',{
    method:'GET',mode:'same-origin',credentials:'include',
    cache:'no-store',redirect:'error',
    headers:{Accept:'application/json',
     'X-Fish-V3-H2-Intent':'WP3-H2-SYNTH-KB-001-CSRF'},
   });
  }catch{deny('CSRF_UNAVAILABLE');}
  need(response?.status===200,'CSRF_UNAVAILABLE');
  let value;
  try{value=await response.json();}catch{deny('CSRF_UNAVAILABLE');}
  need(value?.ok===true&&value.test==='WP3-H2-SYNTH-KB-001'&&
   CSRF.test(value.csrfToken??''),'CSRF_UNAVAILABLE');
  token=value.csrfToken;
  return token;
 }
 async function one({mode,operationId,body}={}){
  need(['intake','status','step','reconcile'].includes(mode),
   'INVALID_ACTION');
  const path=validPath(mode,operationId);
  let raw;
  if(mode==='intake'){
   need(operationId===undefined&&typeof body==='string'&&
    body.length>0&&body.length<=128*1024,
    'INVALID_ENVELOPE');
   let digest;
   try{digest=await sha256(body);}catch{deny('INVALID_ENVELOPE');}
   need(digest===expectedEnvelopeSha256,'INVALID_ENVELOPE');
   raw=body;
  }else{
   need(body===undefined,'INVALID_BODY');
   raw='{}';
  }
  const csrfToken=await csrf();
  let response;
  // Exactly one HTTP attempt: network ambiguity is NOT a replay grant.
  try{
   response=await network(ORIGIN+path,{
    method:'POST',mode:'same-origin',credentials:'include',
    cache:'no-store',redirect:'error',
    headers:{
     'Content-Type':'application/json; charset=utf-8',
     'X-Fish-V3-Intent':'publish',
     'X-Fish-V3-CSRF':csrfToken,
    },body:raw,
   });
  }catch{deny('HTTP_OUTCOME_UNKNOWN');}
  need(response?.status>=100&&response.status<=599,
   'HTTP_OUTCOME_UNKNOWN');
  // Never return raw error details, cookie, token, request body, or headers.
  const phase=response.headers?.get?.('X-Fish-V3-H2-Failure-Stage');
  const stage=STAGES.has(phase)?phase:null;
  if(response.status!==200&&response.status!==202)
   return Object.freeze({httpStatus:response.status,
    failureStage:stage,ok:false});
  const type=response.headers?.get?.('Content-Type')??'';
  need(/^application\/json(?:;|$)/i.test(type),
   'HTTP_OUTCOME_UNKNOWN');
  let rawResult;
  try{
   rawResult=await response.text();
   need(typeof rawResult==='string'&&rawResult.length<=MAX_JSON,
    'HTTP_OUTCOME_UNKNOWN');
   const result=JSON.parse(rawResult);
   need(result?.ok===true&&
    result.canPublish===false&&result.isLive===false,
    'HTTP_OUTCOME_UNKNOWN');
   if(mode==='intake'){
    need(response.status===202&&UUID.test(result.operationId??'')&&
     /^[a-f0-9]{40}$/.test(result.sourceRevision??''),
     'HTTP_OUTCOME_UNKNOWN');
    return Object.freeze({httpStatus:202,
     operationId:result.operationId,
     sourceRevision:result.sourceRevision,ok:true});
   }
   need(response.status===(mode==='step'?202:200)&&
    result.operationId===operationId&&
    /^[a-f0-9]{40}$/.test(result.sourceRevision??'')&&
    ['AwaitingAuthorizedWrite','ReconciliationRequired',
     'VerifiedPr'].includes(result.state)&&
    Array.isArray(result.verifiedSteps)&&
    result.requiresHostedReleaseProof===true&&
    result.safeToRetryWrite===false,
    'HTTP_OUTCOME_UNKNOWN');
   return Object.freeze({
    httpStatus:response.status,ok:true,
    operationId:result.operationId,
    sourceRevision:result.sourceRevision,
    state:result.state,step:result.step??null,
    verifiedSteps:Object.freeze([...result.verifiedSteps]),
    ...(result.prNumber?{prNumber:result.prNumber}:{}),
    sourceOnly:true,canPublish:false,isLive:false,
    requiresHostedReleaseProof:true,safeToRetryWrite:false,
   });
  }catch(e){
   if(e instanceof D6H2OwnerTransportError)throw e;
   deny('HTTP_OUTCOME_UNKNOWN');
  }
 }
 return Object.freeze({one});
}
