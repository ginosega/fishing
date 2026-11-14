/**
 * FISH-TODO-118 WP3 — future production owner WRITE route candidate.
 *
 * SOURCE ONLY / DEFAULT OFF / NO WORKER ENTRY, GATEWAY MODIFICATION,
 * DEPLOYMENT, D1 MIGRATION, TOKEN OR GITHUB MUTATION.
 *
 * This adapter is deliberately NOT installed on the WP2 read-only
 * same-origin gateway. A separately authorized host would need to mount it,
 * provide its existing first-party D2 owner/CSRF session, independently
 * verified canonical main, durable D1 operation receipts, and the guarded
 * single-step dispatcher. Nothing in this module can enable the writer.
 *
 * Every action is a POST protected by the exact first-party D2 owner+CSRF
 * verifier. There is no browser-selected GitHub ref, provider URL, step,
 * repository or approval. No route reports deployed or Live.
 */
import {D6_PUBLISH_REPOSITORY as REPO,
 D6_PUBLISH_INTAKE_ORIGIN as ORIGIN}
 from './d6-production-publish-intake.mjs';

const API='/api/v3/operations';
const SHA=/^[a-f0-9]{40}$/;
const ID='[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const PATH=new RegExp('^'+API+'/('+ID+')/(status|begin|reconcile)$','i');
const HEADERS=Object.freeze({
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'Vary':'Cookie',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'X-Robots-Tag':'noindex, nofollow',
 'Cross-Origin-Resource-Policy':'same-origin',
});
const reply=(status,value)=>new Response(JSON.stringify(value),{
 status,headers:HEADERS,
});
const unavailable=()=>reply(503,{ok:false,error:'TEMPORARILY_UNAVAILABLE'});
const missing=()=>reply(404,{ok:false,error:'NOT_FOUND'});
const denied=()=>reply(403,{ok:false,error:'OWNER_DENIED'});

function operation(receipt){
 if(!receipt||!/^([0-9a-f-]{36})$/i.test(receipt.operationId??'')||
  !['Accepted','Unknown'].includes(receipt.status)||
  receipt.sourceOnly!==true||receipt.isLive!==false||
  receipt.canPublish!==false||
  !SHA.test(receipt.sourceRevision??''))
  throw Error('unverified receipt');
 return Object.freeze({
  ok:true,operationId:receipt.operationId,
  state:receipt.status,sourceRevision:receipt.sourceRevision,
  canPublish:false,isLive:false,
  requiresIndependentVerification:true,
 });
}
const STEPS=['tree','branch','commit','advance','pr'];
function state(data){
 if(!data||!/^([0-9a-f-]{36})$/i.test(data.operationId??'')||
  !['AwaitingAuthorizedWrite','ReconciliationRequired',
   'VerifiedPr'].includes(data.state)||
  !SHA.test(data.sourceRevision??'')||
  data.sourceOnly!==true||data.canPublish!==false||
  data.isLive!==false||
  !Array.isArray(data.verifiedSteps)||
  !data.verifiedSteps.every((x,i)=>STEPS[i]===x))
  throw Error('unverified lifecycle state');
 if(data.state==='VerifiedPr'){
  if(data.verifiedSteps.length!==5||data.step!==null||
   !Number.isSafeInteger(data.prNumber)||data.prNumber<=0)
   throw Error('unverified final PR');
 }else if(data.step!==STEPS[data.verifiedSteps.length]||
  data.verifiedSteps.length>=STEPS.length||
  data.safeToRetryWrite!==false)
  throw Error('unverified step');
 return Object.freeze({
  ok:true,operationId:data.operationId,sourceRevision:data.sourceRevision,
  state:data.state,step:data.step,
  verifiedSteps:[...data.verifiedSteps],
  ...(data.state==='VerifiedPr'?{prNumber:data.prNumber}:{}),
  canPublish:false,isLive:false,safeToRetryWrite:false,
  requiresHostedReleaseProof:true,
 });
}

export function createD6ProductionPublishWriteRouteCandidate({
 session,receipts,dispatcher,getTrustedCurrentMain,
 enabled=()=>false,writeEnabled=()=>false,
}={}){
 if(typeof session?.authorizeWrite!=='function'||
  typeof receipts?.accept!=='function'||
  !['current','beginOne','reconcileOne'].every(k=>
   typeof dispatcher?.[k]==='function')||
  typeof getTrustedCurrentMain!=='function'||
  typeof enabled!=='function'||typeof writeEnabled!=='function')
  throw Error('invalid WP3 write-route dependencies');

 async function serve(request){
  if(enabled()!==true)return missing();
  if(!(request instanceof Request))return missing();
  let url;
  try{url=new URL(request.url);}catch{return missing();}
  if(url.origin!==ORIGIN||url.username||url.password||
   url.search||url.hash||request.method!=='POST'||
   request.headers.has('Authorization'))return missing();
  const accepting=url.pathname===API;
  const match=accepting?null:PATH.exec(url.pathname);
  if(!accepting&&!match)return missing();
  if(request.headers.get('Origin')!==ORIGIN||
   request.headers.get('Sec-Fetch-Site')!=='same-origin')
   return denied();
  if(request.headers.get('X-Fish-V3-Intent')!=='publish'||
   !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
    request.headers.get('Content-Type')??''))return denied();
  // Authenticate before reading D1, source or even parsing the body.
  try{
   const actor=await session.authorizeWrite(request);
   if(actor?.authorized!==true||
    actor.ownerGitHubId!==REPO.ownerGitHubId)return denied();
  }catch{return denied();}
  if(enabled()!==true)return unavailable();
  if(accepting){
   if(writeEnabled()!==true)return unavailable();
   try{
    const main=await getTrustedCurrentMain({
     repositoryId:REPO.id,ref:REPO.ref,
    });
    if(main?.verified!==true||
     main.repositoryId!==REPO.id||main.ref!==REPO.ref||
     !SHA.test(main.sourceRevision??''))return unavailable();
    if(enabled()!==true||writeEnabled()!==true)
     return unavailable();
    const accepted=await receipts.accept(request.clone(),{
     trustedMainSha:main.sourceRevision,
    });
    return reply(202,operation(accepted));
   }catch{return unavailable();}
  }
  // All control calls accept only the empty, unambiguous JSON object.
  // The next step is D1-derived and server-approved, never client-selected.
  const length=request.headers.get('Content-Length');
  if(length!==null&&(!/^[0-9]+$/.test(length)||
   Number(length)>2))return missing();
  let raw;
  try{raw=await request.text();}catch{return missing();}
  if(raw!=='{}')return missing();
  const operationId=match[1].toLowerCase(),action=match[2];
  if(action==='begin'&&writeEnabled()!==true)return unavailable();
  if(enabled()!==true||action==='begin'&&writeEnabled()!==true)
   return unavailable();
  try{
   const value=action==='status'?
    await dispatcher.current(request,operationId):
    action==='begin'?
     await dispatcher.beginOne(request,operationId):
     await dispatcher.reconcileOne(request,operationId);
   return reply(action==='begin'?202:200,state(value));
  }catch{return unavailable();}
 }
 return Object.freeze({serve});
}
