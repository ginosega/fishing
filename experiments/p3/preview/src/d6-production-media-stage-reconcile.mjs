/**
 * FISH118 WP3-2 — independent original Git-blob readback AND durable
 * staging proof. SOURCE ONLY / DEFAULT OFF / NOT A WORKER ROUTE.
 *
 * After a fenced, potentially unknown Git blob POST, GET the exact immutable
 * blob from the pinned production repository. Reconstruct the ORIGINAL
 * request fingerprint from independently decoded bytes and compare with the
 * durable Unknown fence before writing an immutable VerifiedStage receipt.
 *
 * This is not signed-ticket issuance, source-tree publication, Git merge or
 * evidence of public Live. 404, timeout, stale source, corrupted receipts,
 * missing D1 or lost acknowledgments NEVER authorize another blob POST.
 *
 * Separate infrastructure authorization is required for the proposed D1
 * schema and any hosted write permissions / runtime bindings.
 */
import {safePath,sha256} from '../../../../pwa/src/shared.mjs';
import {expectedD6CanonicalMedia,d6ImageMime}
 from './d6-production-media-contract.mjs';
import {describeD6CanonicalMediaStageClaim}
 from './d6-production-media-stage-fence.mjs';
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const API='https://api.github.com/repos/'+REPO.name+'/git/blobs/';
const SHA=/^[a-f0-9]{40}$/,HASH=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const MAX_FILE=10*1024*1024,MAX_RESPONSE=15*1024*1024;
const PERMISSIONS=Object.freeze({contents:'read'});
const IMAGE_TYPES=Object.freeze({
 jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',
 webp:'image/webp',gif:'image/gif',
});
export const D6_MEDIA_STAGE_PROOF_SQL=[
 'CREATE TABLE IF NOT EXISTS d6_media_stage_verified (',
 'operation_id TEXT NOT NULL,',
 'path TEXT NOT NULL,',
 'owner_github_id INTEGER NOT NULL,',
 'repository_id INTEGER NOT NULL,',
 'request_sha256 TEXT NOT NULL,',
 'blob_sha TEXT NOT NULL,',
 'sha256 TEXT NOT NULL,',
 'bytes INTEGER NOT NULL CHECK(bytes>0 AND bytes<=10485760),',
 'mime TEXT NOT NULL,',
 "state TEXT NOT NULL DEFAULT 'VerifiedStage' CHECK(state='VerifiedStage'),",
 'verified_at INTEGER NOT NULL,',
 'PRIMARY KEY(operation_id,path)',
 ');',
].join('\n');
const fenceSql='SELECT operation_id,step_key,owner_github_id,'+
 'repository_id,request_sha256,state,created_at '+
 'FROM d6_provider_step_fences WHERE operation_id=? AND step_key=?';
const receiptSql='SELECT operation_id,path,owner_github_id,repository_id,'+
 'request_sha256,blob_sha,sha256,bytes,mime,state,verified_at '+
 'FROM d6_media_stage_verified WHERE operation_id=? AND path=?';
const insertSql='INSERT OR IGNORE INTO d6_media_stage_verified '+
 '(operation_id,path,owner_github_id,repository_id,request_sha256,'+
 "blob_sha,sha256,bytes,mime,state,verified_at) VALUES (?,?,?,?,?,?,?,?,?,'VerifiedStage',?)";

export class D6MediaStageReconcileError extends Error{
 constructor(code){
  super('D6 original Git staging remains unverified');
  this.name='D6MediaStageReconcileError';this.code=code;
 }
}
const deny=code=>{throw new D6MediaStageReconcileError(code);};
const need=(value,code)=>{if(!value)deny(code);};
const plain=value=>value!==null&&typeof value==='object'&&
 !Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
function operation(stored,id,owner){
 const op=stored?.operation,pkg=stored?.package;
 need(op&&pkg&&op.operationId===id&&UUID.test(id)&&
  op.state==='Accepted'&&
  op.ownerGitHubId===owner&&owner===REPO.ownerGitHubId&&
  op.repositoryId===REPO.id&&op.ref===REPO.ref&&
  SHA.test(op.sourceRevision??'')&&
  HASH.test(op.snapshotSha256??'')&&
  op.domain===pkg.domain&&op.recordId===pkg.id&&
  op.sourceRevision===pkg.base?.sourceRevision&&
  ['gear','kb','catches'].includes(op.domain),
  'UNTRUSTED_OPERATION');
 return {op,pkg};
}
function validPath(path,expected){
 let canonical;
 try{canonical=safePath(path);}catch{deny('INVALID_MEDIA_PATH');}
 need(path===canonical&&expected.some(x=>x.path===path),
  'UNEXPECTED_MEDIA_PATH');
 return expected.find(x=>x.path===path);
}
function fenced(row,op,path){
 need(row&&row.operation_id===op.operationId&&
  row.step_key==='media:'+path&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  HASH.test(row.request_sha256??'')&&
  row.state==='Unknown'&&
  Number.isSafeInteger(row.created_at)&&row.created_at>0,
  'FENCE_UNVERIFIED');
}
function proofResult(row,claim,target,when){
 need(row&&row.operation_id===claim.operationId&&
  row.path===target.path&&row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  row.request_sha256===claim.requestSha256&&
  row.blob_sha===claim.expectedBlobSha&&
  row.sha256===target.sha256&&row.bytes===target.bytes&&
  row.mime===target.mime&&row.state==='VerifiedStage'&&
  Number.isSafeInteger(row.verified_at)&&row.verified_at>0&&
  row.verified_at<=when+60,
  'PROOF_MISMATCH');
 return Object.freeze({
  state:'VerifiedStage',verifiedStage:true,sourceOnly:true,
  canPublish:false,isLive:false,
  operationId:claim.operationId,path:target.path,
  blobSha:claim.expectedBlobSha,sha256:target.sha256,
  bytes:target.bytes,mime:target.mime,
  requestSha256:claim.requestSha256,verifiedAt:row.verified_at,
  requiresSignedTicket:true,requiresAtomicTree:true,
  requiresSourceReview:true,
 });
}
async function boundedGitHubJson(response){
 need(response instanceof Response&&response.status===200&&
  response.redirected===false&&
  /\bapplication\/json\b/i.test(response.headers.get('Content-Type')??''),
  'BLOB_READ_UNKNOWN');
 const length=response.headers.get('Content-Length');
 if(length!==null)
  need(/^[0-9]+$/.test(length)&&Number(length)<=MAX_RESPONSE,
   'BLOB_READ_UNKNOWN');
 const reader=response.body?.getReader();
 need(reader,'BLOB_READ_UNKNOWN');
 const chunks=[];let total=0;
 try{
  for(;;){
   const {done,value}=await reader.read();
   if(done)break;
   need(value instanceof Uint8Array,'BLOB_READ_UNKNOWN');
   total+=value.byteLength;
   need(total<=MAX_RESPONSE,'BLOB_READ_UNKNOWN');
   chunks.push(value);
  }
 }catch(e){
  try{await reader.cancel();}catch{}
  if(e instanceof D6MediaStageReconcileError)throw e;
  deny('BLOB_READ_UNKNOWN');
 }finally{try{reader.releaseLock();}catch{}}
 need(total>0,'BLOB_READ_UNKNOWN');
 const data=new Uint8Array(total);let offset=0;
 for(const part of chunks){data.set(part,offset);offset+=part.length;}
 let obj;
 try{obj=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));}
 catch{deny('BLOB_READ_UNKNOWN');}
 return obj;
}
function originalBlob(blob,sha,target){
 need(plain(blob)&&blob.sha===sha&&
  blob.encoding==='base64'&&blob.size===target.bytes&&
  Number.isSafeInteger(blob.size)&&blob.size>0&&
  blob.size<=MAX_FILE&&typeof blob.content==='string'&&
  blob.content.length>0&&blob.content.length<=MAX_RESPONSE,
  'BLOB_UNVERIFIED');
 const raw=blob.content.replace(/[\r\n]/g,'');
 need(raw.length%4===0&&
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
   .test(raw)&&
  raw.length<=Math.ceil(target.bytes/3)*4+4,
  'BLOB_UNVERIFIED');
 let bytes;
 try{bytes=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));}
 catch{deny('BLOB_UNVERIFIED');}
 need(bytes.length===target.bytes&&
  d6ImageMime(bytes)===target.mime,'BLOB_UNVERIFIED');
 return bytes;
}

/**
 * Authenticated operation source and D1 must come from trusted server
 * code. session.authorizeWrite is the existing D2 same-origin CSRF gate,
 * not a new login layer. The operation, path and blob SHA are hints until
 * each is independently cross-checked against canonical source, fence,
 * fetched Git bytes and immutable D1 proof.
 */
export function createD6ProductionMediaStageReconciliation({
 DB,session,loadAcceptedOperation,issueReadToken,request,
 enabled=()=>false,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(DB?.prepare&&typeof session?.authorizeWrite==='function'&&
  [loadAcceptedOperation,issueReadToken,request,enabled,now]
   .every(x=>typeof x==='function'),'INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 const read=async(sql,...params)=>{
  try{return await DB.prepare(sql).bind(...params).first();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 const insert=async(...params)=>{
  try{return await DB.prepare(insertSql).bind(...params).run();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 async function reconcile(authRequest,{operationId,path,blobSha}={}){
  active();
  // A durable D1 proof is a state-changing action: use existing owner
  // POST + Origin/Fetch-Site/CSRF authorization, not an anonymous GET.
  let actor;
  try{actor=await session.authorizeWrite(authRequest);}
  catch{deny('OWNER_DENIED');}
  need(actor?.authorized===true&&
   actor.ownerGitHubId===REPO.ownerGitHubId,'OWNER_DENIED');
  need(UUID.test(operationId??'')&&SHA.test(blobSha??''),
   'INVALID_RECONCILIATION');
  let stored;
  try{stored=await loadAcceptedOperation({
   operationId,ownerGitHubId:actor.ownerGitHubId,
  });}catch{deny('OPERATION_UNAVAILABLE');}
  const {op,pkg}=operation(stored,operationId,actor.ownerGitHubId);
  let expected;
  try{expected=expectedD6CanonicalMedia(pkg);}
  catch{deny('UNTRUSTED_OPERATION');}
  const match=validPath(path,expected);
  const target={...match,mime:IMAGE_TYPES[path.split('.').at(-1).toLowerCase()]};
  need(target.mime,'INVALID_MEDIA_PATH');
  const fence=await read(fenceSql,operationId,'media:'+path);
  fenced(fence,op,path);
  let grant;
  try{grant=await issueReadToken({
   repositoryId:REPO.id,permissions:PERMISSIONS,
  });}catch{deny('TOKEN_UNAVAILABLE');}
  need(grant?.repositoryId===REPO.id&&
   plain(grant.permissions)&&
   grant.permissions.contents==='read'&&
   Object.keys(grant.permissions).length===1&&
   typeof grant.token==='string'&&grant.token.length>=20,
   'TOKEN_UNAVAILABLE');
  active();
  let response;
  try{response=await request(API+blobSha,{
   method:'GET',redirect:'manual',cache:'no-store',credentials:'omit',
   headers:{
    Authorization:'Bearer '+grant.token,
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2026-03-10',
    'User-Agent':'fishing-d6-media-readback-source',
   },
  });}catch{deny('BLOB_READ_UNKNOWN');}
  const remote=await boundedGitHubJson(response);
  const bytes=originalBlob(remote,blobSha,target);
  need(await sha256(bytes)===target.sha256,'BLOB_DIGEST_MISMATCH');
  const claim=await describeD6CanonicalMediaStageClaim({
   operationId,sourceRevision:op.sourceRevision,
   snapshotSha256:op.snapshotSha256,path,
   originalBytes:bytes,mime:target.mime,sha256:target.sha256,
  });
  need(claim.expectedBlobSha===blobSha&&
   claim.requestSha256===fence.request_sha256,
   'FENCE_MISMATCH');
  active();
  const at=now();
  need(Number.isSafeInteger(at)&&at>0,'INVALID_CLOCK');
  await insert(operationId,path,REPO.ownerGitHubId,REPO.id,
   claim.requestSha256,blobSha,target.sha256,target.bytes,
   target.mime,at);
  // If a simultaneous reconciliation inserted first, the immutable
  // receipt must still match exact canonical/Git object identity.
  const saved=await read(receiptSql,operationId,path);
  return proofResult(saved,claim,target,at);
 }
 return Object.freeze({reconcile});
}
