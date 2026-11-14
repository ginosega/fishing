/**
 * FISH-TODO-118 WP3 — owner original-image media HTTP route candidate.
 *
 * SOURCE ONLY / DEFAULT OFF / UNMOUNTED.
 * The existing WP2 production same-origin gateway is READ ONLY and is NOT
 * modified here. A separately approved trusted host would have to mount this
 * adapter, bind D2 AUTH/CSRF, provision D1, and authorize the narrowly scoped
 * Github provider writer. This file contains no host entrypoint or token.
 *
 * POST /api/v3/media: existing bounded authenticated upload preflight +
 * durable one-time Git blob Unknown fence. Never a success confirmation.
 * POST /api/v3/media/reconcile: existing owner-authenticated independent
 * Git GET + durable VerifiedStage proof. Never another POST /git/blobs.
 *
 * A 202 Unknown tells the caller ONLY that stage outcome needs independent
 * readback. VerifiedStage is still not a signed ticket, tree, PR or Live.
 */
import {safePath} from '../../../../pwa/src/shared.mjs';
import {D6_PUBLISH_INTAKE_ORIGIN as ORIGIN}
 from './d6-production-publish-intake.mjs';

const STAGE='/api/v3/media',READBACK=STAGE+'/reconcile';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const SHA=/^[a-f0-9]{40}$/;
const MAX_JSON=2048;
const HEADERS=Object.freeze({
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'Vary':'Cookie',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'X-Robots-Tag':'noindex, nofollow',
 'Cross-Origin-Resource-Policy':'same-origin',
});
const result=(status,payload)=>new Response(JSON.stringify(payload),{
 status,headers:HEADERS,
});
const missing=()=>result(404,{ok:false,error:'NOT_FOUND'});
const denied=()=>result(403,{ok:false,error:'OWNER_DENIED'});
const unavailable=()=>result(503,{
 ok:false,error:'TEMPORARILY_UNAVAILABLE',
});
const plain=value=>value!==null&&typeof value==='object'&&
 !Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
const mime=new Set(['image/png','image/jpeg','image/webp','image/gif']);

async function boundedJson(request){
 const length=request.headers.get('Content-Length');
 if(length!==null&&(!/^[0-9]+$/.test(length)||
  Number(length)>MAX_JSON))throw Error('body denied');
 if(!request.body)throw Error('missing body');
 const reader=request.body.getReader();
 let n=0;const parts=[];
 try{
  for(;;){
   const {done,value}=await reader.read();
   if(done)break;
   if(!(value instanceof Uint8Array))throw Error('invalid');
   n+=value.length;
   if(n>MAX_JSON)throw Error('too large');
   parts.push(value);
  }
 }finally{try{await reader.cancel();}catch{}}
 if(n<1)throw Error('empty');
 const all=new Uint8Array(n);let i=0;
 for(const v of parts){all.set(v,i);i+=v.length;}
 const raw=new TextDecoder('utf-8',{fatal:true}).decode(all);
 const data=JSON.parse(raw);
 if(!plain(data)||Object.keys(data).join(',')!==
  'operationId,path,blobSha'||JSON.stringify(data)!==raw||
  !UUID.test(data.operationId??'')||!SHA.test(data.blobSha??'')||
  typeof data.path!=='string'||data.path.length>1000||
  safePath(data.path)!==data.path||
  !/^(?:Gear|KB|Catches)\//.test(data.path)||
  !data.path.includes('/assets/'))throw Error('untrusted');
 return data;
}

export function createD6ProductionMediaWriteRouteCandidate({
 session,stage,reconciliation,
 enabled=()=>false,writeEnabled=()=>false,
 stageEnabled=()=>false,reconcileEnabled=()=>false,
}={}){
 if(typeof session?.authorizeWrite!=='function'||
  typeof session?.authorizeMedia!=='function'||
  typeof stage?.attempt!=='function'||
  typeof reconciliation?.reconcile!=='function'||
  [enabled,writeEnabled,stageEnabled,reconcileEnabled]
   .some(x=>typeof x!=='function'))
  throw Error('invalid WP3 original media route configuration');
 const on=()=>enabled()===true&&writeEnabled()===true;
 async function serve(request){
  if(enabled()!==true)return missing();
  if(!(request instanceof Request))return missing();
  let url;
  try{url=new URL(request.url);}catch{return missing();}
  if(url.origin!==ORIGIN||url.username||url.password||
   url.search||url.hash||request.method!=='POST'||
   request.headers.has('Authorization')||
   ![STAGE,READBACK].includes(url.pathname))return missing();
  if(request.headers.get('Origin')!==ORIGIN||
   request.headers.get('Sec-Fetch-Site')!=='same-origin')
   return denied();
  const staging=url.pathname===STAGE;
  if(!on()||(staging?stageEnabled():reconcileEnabled())!==true)
   return unavailable();
  if(staging){
   if(request.headers.get('X-Fish-V3-Intent')!=='stage-media'||
    !mime.has(request.headers.get('Content-Type')))
    return denied();
  }else if(request.headers.get('X-Fish-V3-Intent')!=='publish'||
   !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
    request.headers.get('Content-Type')??''))
   return denied();
  // Owner check happens BEFORE reading the media stream / JSON or D1.
  try{
   const actor=staging?
    await session.authorizeMedia(request):
    await session.authorizeWrite(request);
   if(actor?.authorized!==true||
    actor.ownerGitHubId!==265665562)return denied();
  }catch{return denied();}
  if(!on()||(staging?stageEnabled():reconcileEnabled())!==true)
   return unavailable();

  if(staging){
   try{
    // stage.attempt calls the existing original-byte preflight, D1 fence
    // insertion and at most one separately enabled GitHub POST.
    const x=await stage.attempt(request);
    if(x?.state!=='Unknown'||x.sourceOnly!==true||
     x.canPublish!==false||x.isLive!==false||
     !UUID.test(x.operationId??'')||
     typeof x.stepKey!=='string'||
     !x.stepKey.startsWith('media:')||
     x.operationId!==request.headers.get('X-Fish-V3-Operation')||
     x.stepKey.slice('media:'.length)!==
      decodeURIComponent(request.headers.get('X-Fish-V3-Media-Path')??'')||
     !SHA.test(x.expectedBlobSha??'')||
     x.requiresIndependentGitReadback!==true||
     x.requiresDurableReconciliation!==true)
     return unavailable();
    return result(202,{
     ok:true,operationId:x.operationId,
     path:x.stepKey.slice('media:'.length),
     candidateBlobSha:x.expectedBlobSha,state:'Unknown',
     safeToRetryWrite:false,verifiedStage:false,
     requiresIndependentGitReadback:true,
     requiresSignedTicket:true,
     isLive:false,canPublish:false,
    });
   }catch{return unavailable();}
  }
  let hint;
  try{hint=await boundedJson(request);}catch{return missing();}
  if(!on()||reconcileEnabled()!==true)return unavailable();
  try{
   // The SHA supplied here is a readback HINT only. The underlying D1
   // reconciler checks the exact operation, Unknown fence, Git blob bytes,
   // digest, SHA-1 and immutable VerifiedStage receipt before success.
   const x=await reconciliation.reconcile(request,{
    operationId:hint.operationId,path:hint.path,
    blobSha:hint.blobSha,
   });
   if(x?.operationId!==hint.operationId||
    x.path!==hint.path||x.blobSha!==hint.blobSha||
    x.state!=='VerifiedStage'||x.verifiedStage!==true||
    x.sourceOnly!==true||x.canPublish!==false||
    x.isLive!==false||x.requiresSignedTicket!==true)
    return unavailable();
   return result(200,{
    ok:true,operationId:hint.operationId,
    path:hint.path,blobSha:hint.blobSha,
    state:'VerifiedStage',verifiedStage:true,
    requiresSignedTicket:true,
    requiresAtomicTree:true,
    canPublish:false,isLive:false,
   });
  }catch{return unavailable();}
 }
 return Object.freeze({serve});
}
