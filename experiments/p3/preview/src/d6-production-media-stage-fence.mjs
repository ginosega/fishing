/**
 * FISH118 WP3-2 — canonical original-media Git blob STAGING FENCE.
 *
 * SOURCE ONLY / DEFAULT OFF / NOT A ROUTE. Reuses the existing D6
 * d6_provider_step_fences D1 table (D6_PROVIDER_STEP_SQL): one sticky Unknown
 * claim per immutable operation + media path, BEFORE any GitHub POST. Never
 * retries an already claimed operation/path even if a response was lost.
 *
 * A GitHub blob can be unreachable from any tree. HTTP 201, a predicted
 * SHA-1, or an existing Unknown fence is NOT a verified stage, ticket,
 * publication, or authorization to repeat a mutation. Independent Git
 * blob GET, durable reconciliation and server-held ticket signing are
 * separate work. No schema deployment, Worker binding, credential/route
 * activation, or GitHub mutation is performed by importing this module.
 *
 * The host MUST supply an already trusted D2-owner-authenticated bounded
 * preflight and a trusted operation/source prerequisite verifier.
 */
import {sha256,safePath} from '../../../../pwa/src/shared.mjs';
import {d6ImageMime} from './d6-production-media-contract.mjs';
import {D6_PUBLISH_REPOSITORY} from './d6-production-publish-intake.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const URL='https://api.github.com/repos/'+REPO.name+'/git/blobs';
const MAX=10*1024*1024,SHA=/^[a-f0-9]{40}$/,HASH=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const enc=new TextEncoder();
const SCOPE=Object.freeze({contents:'write'});
const readSql='SELECT operation_id,step_key,owner_github_id,repository_id,'+
 'request_sha256,state,created_at FROM d6_provider_step_fences '+
 'WHERE operation_id=? AND step_key=?';
const writeSql='INSERT OR IGNORE INTO d6_provider_step_fences '+
 '(operation_id,step_key,owner_github_id,repository_id,request_sha256,'+
 "state,created_at) VALUES (?,?,?,?,?,'Unknown',?)";
export class D6MediaStageFenceError extends Error{
 constructor(code){
  super('D6 media provider staging outcome is not confirmed');
  this.name='D6MediaStageFenceError';this.code=code;
 }
}
const deny=code=>{throw new D6MediaStageFenceError(code);};
const need=(v,code)=>{if(!v)deny(code);};
const blobSha=async bytes=>{
 const prefix=enc.encode('blob '+bytes.length+'\0');
 const data=new Uint8Array(prefix.length+bytes.length);
 data.set(prefix);data.set(bytes,prefix.length);
 return [...new Uint8Array(await crypto.subtle.digest('SHA-1',data))]
  .map(v=>v.toString(16).padStart(2,'0')).join('');
};
const base64=bytes=>{
 const parts=[];
 for(let i=0;i<bytes.length;i+=32768)
  parts.push(String.fromCharCode(...bytes.subarray(i,i+32768)));
 return btoa(parts.join(''));
};
function checked(preflight){
 const value=preflight?.originalBytes;
 let path;
 try{path=safePath(preflight.path);}
 catch{deny('UNTRUSTED_PREFLIGHT');}
 need(preflight.verifiedOriginal===true&&
  preflight.sourceOnly===true&&preflight.canPublish===false&&
  UUID.test(preflight.operationId??'')&&
  preflight.repositoryId===REPO.id&&
  SHA.test(preflight.sourceRevision??'')&&
  HASH.test(preflight.snapshotSha256??'')&&
  path===preflight.path&&path.includes('/assets/')&&
  /^(Gear|KB|Catches)\//.test(path)&&
  value instanceof Uint8Array&&value.length>0&&value.length<=MAX&&
  preflight.bytes===value.length&&
  HASH.test(preflight.sha256??'')&&
  d6ImageMime(value)===preflight.mime&&
  preflight.requiresDurableWriteFence===true&&
  preflight.requiresIndependentGitReadback===true,
  'UNTRUSTED_PREFLIGHT');
 return {path,bytes:value};
}
/**
 * Immutable, non-authorizing request descriptor shared by the original
 * provider fence and independently re-fetched Git blob readback. The
 * source/owner authorization and durable fence must be checked separately.
 */
export async function describeD6CanonicalMediaStageClaim({
 operationId,sourceRevision,snapshotSha256,path,originalBytes,
 mime,sha256:expectedDigest,
}={}){
 let canonical;
 try{canonical=safePath(path);}catch{deny('UNTRUSTED_MEDIA_BYTES');}
 need(UUID.test(operationId??'')&&SHA.test(sourceRevision??'')&&
  HASH.test(snapshotSha256??'')&&
  canonical===path&&path.includes('/assets/')&&
  /^(Gear|KB|Catches)\//.test(path)&&
  originalBytes instanceof Uint8Array&&
  originalBytes.length>0&&originalBytes.length<=MAX&&
  HASH.test(expectedDigest??'')&&
  d6ImageMime(originalBytes)===mime,
  'UNTRUSTED_MEDIA_BYTES');
 need(await sha256(originalBytes)===expectedDigest,
  'MEDIA_DIGEST_MISMATCH');
 const expectedBlobSha=await blobSha(originalBytes);
 const stepKey='media:'+path;
 const requestSha256=await sha256(JSON.stringify({
  operationId,ownerGitHubId:REPO.ownerGitHubId,
  repositoryId:REPO.id,ref:REPO.ref,
  sourceRevision,snapshotSha256,
  stepKey,path,bytes:originalBytes.length,sha256:expectedDigest,
  mime,expectedBlobSha,endpoint:URL,method:'POST',encoding:'base64',
 }));
 return Object.freeze({
  operationId,stepKey,requestSha256,expectedBlobSha,
 });
}

function status(row,claim,attemptedNow=false){
 need(row?.operation_id===claim.operationId&&
  row.step_key===claim.stepKey&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  row.request_sha256===claim.requestSha256&&
  row.state==='Unknown'&&
  Number.isSafeInteger(row.created_at)&&row.created_at>0,
  'FENCE_MISMATCH');
 return Object.freeze({
  operationId:claim.operationId,stepKey:claim.stepKey,
  requestSha256:claim.requestSha256,
  expectedBlobSha:claim.expectedBlobSha,
  state:'Unknown',attemptedNow,
  requiresIndependentGitReadback:true,
  requiresDurableReconciliation:true,requiresSignedTicket:true,
  canPublish:false,isLive:false,sourceOnly:true,
 });
}
export function createD6ProductionMediaStageFence({
 DB,preflight,verifyPrerequisite,issueWriteToken,request,
 enabled=()=>false,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(DB?.prepare&&typeof preflight?.preflight==='function'&&
  [verifyPrerequisite,issueWriteToken,request,enabled,now]
   .every(fn=>typeof fn==='function'),'INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 const read=async(id,key)=>{
  try{return await DB.prepare(readSql).bind(id,key).first();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 const insert=async(c,at)=>{
  try{return await DB.prepare(writeSql).bind(
   c.operationId,c.stepKey,REPO.ownerGitHubId,REPO.id,
   c.requestSha256,at).run();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 async function attempt(uploadRequest){
  active();
  // D2 authorization and bounded original-byte verification precede
  // every database/provider access, even for an idempotent retry.
  const original=await preflight.preflight(uploadRequest);
  active();
  const {path,bytes}=checked(original);
  const claim=await describeD6CanonicalMediaStageClaim({
   operationId:original.operationId,
   sourceRevision:original.sourceRevision,
   snapshotSha256:original.snapshotSha256,
   path,originalBytes:bytes,
   mime:original.mime,sha256:original.sha256,
  });
  const {operationId,stepKey,requestSha256,expectedBlobSha}=claim;
  const prior=await read(operationId,stepKey);
  if(prior)return status(prior,claim);
  const prerequisite=async()=>{
   let proof;
   try{proof=await verifyPrerequisite({
    operationId,ownerGitHubId:REPO.ownerGitHubId,
    repositoryId:REPO.id,sourceRevision:original.sourceRevision,
    snapshotSha256:original.snapshotSha256,
    path,sha256:original.sha256,expectedBlobSha,
    requestSha256,
   });}catch{deny('PRECONDITION_UNVERIFIED');}
   need(proof?.verified===true&&
    proof.operationId===operationId&&
    proof.repositoryId===REPO.id&&
    proof.ownerGitHubId===REPO.ownerGitHubId&&
    proof.requestSha256===requestSha256&&
    proof.expectedBlobSha===expectedBlobSha,
    'PRECONDITION_UNVERIFIED');
  };
  await prerequisite();
  const at=now();
  need(Number.isSafeInteger(at)&&at>0,'INVALID_CLOCK');
  const written=await insert(claim,at);
  const row=await read(operationId,stepKey);
  status(row,claim);
  // Only one confirmed first INSERT may POST. Concurrent contenders,
  // lost D1 write acknowledgment and repeated requests never re-POST.
  if(written?.meta?.changes!==1)return status(row,claim);
  active();
  let token;
  try{
   const grant=await issueWriteToken({
    repositoryId:REPO.id,permissions:SCOPE,
   });
   need(grant?.repositoryId===REPO.id&&
    grant.permissions?.contents==='write'&&
    Object.keys(grant.permissions).length===1&&
    typeof grant.token==='string'&&grant.token.length>=20,
    'TOKEN_SCOPE_DENIED');
   token=grant.token;
  }catch{return status(row,claim);}
  active();
  // If main/operation authorization changed while minting token, UNKNOWN
  // remains sticky and no external POST is issued.
  await prerequisite();
  active();
  let result;
  try{
   result=await request(URL,{
    method:'POST',redirect:'manual',cache:'no-store',
    credentials:'omit',
    headers:{
     Authorization:'Bearer '+token,
     Accept:'application/vnd.github+json',
     'X-GitHub-Api-Version':'2026-03-10',
     'Content-Type':'application/json',
     'User-Agent':'fishing-d6-media-stage-source',
    },
    body:JSON.stringify({encoding:'base64',content:base64(bytes)}),
   });
  }catch{return status(row,claim,true);}
  // Any status (201/409/500) or lost/invalid response stays UNKNOWN.
  // Never return a signed ticket, verified stage, or "Live" here.
  void result;
  return status(row,claim,true);
 }
 return Object.freeze({attempt});
}
