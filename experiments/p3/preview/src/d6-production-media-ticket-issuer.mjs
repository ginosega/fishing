/**
 * FISH118 WP3-2 — operation-bound original media ticket ISSUANCE.
 *
 * SOURCE ONLY / DEFAULT OFF / NO ROUTE. Issues a short-lived signed ticket
 * only after the previously verified D1 staging proof, durable original
 * blob POST fence, current canonical operation and independent source
 * prerequisite all match. A trusted server keeps the HMAC secret; neither
 * DB receipts, browser inputs nor an HTTP 201 can trigger issuance alone.
 *
 * Does NOT stage an image, issue GitHub credentials, change D1, create a
 * Git tree/PR, publish content, or claim Live. Separate explicit owner
 * approval is required before provisioning any secrets/Worker routes.
 */
import {expectedD6CanonicalMedia}
 from './d6-production-media-contract.mjs';
import {describeD6CanonicalMediaStageMetadata}
 from './d6-production-media-stage-fence.mjs';
import {D6_PUBLISH_REPOSITORY,D6_PUBLISH_INTAKE_ORIGIN}
 from './d6-production-publish-intake.mjs';
import {D6_MEDIA_TICKET_VERSION,D6_MEDIA_TICKET_TTL_SECONDS,
 d6CanonicalMediaTicketPayload}
 from './d6-production-media-ticket-verify.mjs';
import {safePath} from '../../../../pwa/src/shared.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const SHA=/^[a-f0-9]{40}$/,HASH=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[a-f0-9]{12}$/i;
const TYPE=Object.freeze({jpg:'image/jpeg',jpeg:'image/jpeg',
 png:'image/png',webp:'image/webp',gif:'image/gif'});
const enc=new TextEncoder();
const fenceSql='SELECT operation_id,step_key,owner_github_id,'+
 'repository_id,request_sha256,state,created_at '+
 'FROM d6_provider_step_fences WHERE operation_id=? AND step_key=?';
const proofSql='SELECT operation_id,path,owner_github_id,repository_id,'+
 'request_sha256,blob_sha,sha256,bytes,mime,state,verified_at '+
 'FROM d6_media_stage_verified WHERE operation_id=? AND path=?';
export class D6MediaTicketIssueError extends Error {
 constructor(code){
  super('D6 original media ticket cannot be issued');
  this.name='D6MediaTicketIssueError';this.code=code;
 }
}
const deny=code=>{throw new D6MediaTicketIssueError(code);};
const need=(yes,code)=>{if(!yes)deny(code);};
const plain=x=>x!==null&&typeof x==='object'&&
 !Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const web64=bytes=>{
 let raw='';
 for(const b of new Uint8Array(bytes))raw+=String.fromCharCode(b);
 return btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
function trustedOperation(stored,operationId,actor){
 const op=stored?.operation,pkg=stored?.package;
 need(op&&pkg&&op.operationId===operationId&&
  op.state==='Accepted'&&
  op.ownerGitHubId===actor&&
  actor===REPO.ownerGitHubId&&
  op.repositoryId===REPO.id&&op.ref===REPO.ref&&
  SHA.test(op.sourceRevision??'')&&
  HASH.test(op.snapshotSha256??'')&&
  op.domain===pkg.domain&&op.recordId===pkg.id&&
  op.sourceRevision===pkg.base?.sourceRevision&&
  ['gear','kb','catches'].includes(op.domain)&&
  /^[a-z0-9][a-z0-9-]*$/.test(op.recordId??''),
  'UNTRUSTED_OPERATION');
 return {op,pkg};
}
function targetPath(raw,wanted){
 let path;
 try{path=safePath(raw);}catch{deny('UNEXPECTED_MEDIA_PATH');}
 need(path===raw,'UNEXPECTED_MEDIA_PATH');
 const file=wanted.find(x=>x.path===path);
 need(file,'UNEXPECTED_MEDIA_PATH');
 const mime=TYPE[path.split('.').at(-1).toLowerCase()];
 need(mime,'UNEXPECTED_MEDIA_PATH');
 return {...file,mime};
}
function validFence(row,op,path){
 need(row?.operation_id===op.operationId&&
  row.step_key==='media:'+path&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  HASH.test(row.request_sha256??'')&&
  row.state==='Unknown'&&
  Number.isSafeInteger(row.created_at)&&row.created_at>0,
  'FENCE_UNVERIFIED');
}
function validProof(row,op,target,fence,now){
 need(row?.operation_id===op.operationId&&
  row.path===target.path&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  row.request_sha256===fence.request_sha256&&
  SHA.test(row.blob_sha??'')&&
  row.sha256===target.sha256&&
  row.bytes===target.bytes&&
  row.mime===target.mime&&
  row.state==='VerifiedStage'&&
  Number.isSafeInteger(row.verified_at)&&
  row.verified_at>=fence.created_at&&
  row.verified_at<=now+60,
  'PROOF_UNVERIFIED');
}
/**
 * Source-only signer. session.authorizeWrite is the existing owner POST,
 * Origin/Fetch-Site/session/CSRF verification, not a new auth scheme.
 *
 * verifyCanonicalSource must re-check authoritative canonical main and
 * exact operation ownership using trusted server data immediately before
 * signing. Never accept an arbitrary boolean from the browser.
 */
export function createD6ProductionVerifiedMediaTicketIssuer({
 DB,session,loadAcceptedOperation,verifyCanonicalSource,
 secret,origin=D6_PUBLISH_INTAKE_ORIGIN,
 enabled=()=>false,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(DB?.prepare&&typeof session?.authorizeWrite==='function'&&
  [loadAcceptedOperation,verifyCanonicalSource,enabled,now]
   .every(x=>typeof x==='function')&&
  origin===D6_PUBLISH_INTAKE_ORIGIN&&
  typeof secret==='string'&&enc.encode(secret).length>=32,
  'INVALID_CONFIG');
 const key=crypto.subtle.importKey('raw',enc.encode(secret),
  {name:'HMAC',hash:'SHA-256'},false,['sign']);
 const active=()=>need(enabled()===true,'DISABLED');
 const read=async(sql,...args)=>{
  try{return await DB.prepare(sql).bind(...args).first();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 async function issue(authRequest,{operationId,path}={}){
  active();
  // Owner authentication must precede any source or D1 reads.
  let actor;
  try{actor=await session.authorizeWrite(authRequest);}
  catch{deny('OWNER_DENIED');}
  need(actor?.authorized===true&&
   actor.ownerGitHubId===REPO.ownerGitHubId,'OWNER_DENIED');
  need(UUID.test(operationId??''),'INVALID_OPERATION_ID');
  let stored;
  try{stored=await loadAcceptedOperation({
   operationId,ownerGitHubId:actor.ownerGitHubId,
  });}catch{deny('OPERATION_UNAVAILABLE');}
  const {op,pkg}=trustedOperation(stored,operationId,actor.ownerGitHubId);
  let expected;
  try{expected=expectedD6CanonicalMedia(pkg);}
  catch{deny('UNTRUSTED_PACKAGE');}
  const target=targetPath(path,expected);
  const at=now();
  need(Number.isSafeInteger(at)&&at>0&&
   Number.isSafeInteger(at+D6_MEDIA_TICKET_TTL_SECONDS),
   'INVALID_CLOCK');
  const fence=await read(fenceSql,operationId,'media:'+target.path);
  validFence(fence,op,target.path);
  const receipt=await read(proofSql,operationId,target.path);
  validProof(receipt,op,target,fence,at);
  const claim=await describeD6CanonicalMediaStageMetadata({
   operationId,sourceRevision:op.sourceRevision,
   snapshotSha256:op.snapshotSha256,path:target.path,
   bytes:target.bytes,sha256:target.sha256,mime:target.mime,
   expectedBlobSha:receipt.blob_sha,
  });
  need(claim.requestSha256===receipt.request_sha256&&
   claim.requestSha256===fence.request_sha256,
   'FENCE_MISMATCH');
  active();
  let source;
  try{source=await verifyCanonicalSource({
   operationId,ownerGitHubId:REPO.ownerGitHubId,
   repositoryId:REPO.id,ref:REPO.ref,
   sourceRevision:op.sourceRevision,
   snapshotSha256:op.snapshotSha256,
   domain:op.domain,recordId:op.recordId,
   path:target.path,sha256:target.sha256,
   blobSha:receipt.blob_sha,requestSha256:claim.requestSha256,
  });}catch{deny('SOURCE_UNVERIFIED');}
  need(source?.verified===true&&
   source.operationId===operationId&&
   source.repositoryId===REPO.id&&
   source.ownerGitHubId===REPO.ownerGitHubId&&
   source.ref===REPO.ref&&
   source.sourceRevision===op.sourceRevision&&
   source.snapshotSha256===op.snapshotSha256&&
   source.requestSha256===claim.requestSha256,
   'SOURCE_UNVERIFIED');
  active();
  const ticket={
   version:D6_MEDIA_TICKET_VERSION,
   operationId,repositoryId:REPO.id,ownerGitHubId:REPO.ownerGitHubId,
   ref:REPO.ref,sourceRevision:op.sourceRevision,
   snapshotSha256:op.snapshotSha256,
   path:target.path,blobSha:receipt.blob_sha,
   sha256:target.sha256,bytes:target.bytes,mime:target.mime,
   issuedAt:at,expiresAt:at+D6_MEDIA_TICKET_TTL_SECONDS,
  };
  // Signing returns a ticket, never a publication acknowledgment.
  let signature;
  try{signature=web64(await crypto.subtle.sign('HMAC',await key,
   enc.encode(d6CanonicalMediaTicketPayload(origin,ticket))));}
  catch{deny('SIGNING_UNAVAILABLE');}
  need(/^[A-Za-z0-9_-]{43}$/.test(signature),'SIGNING_UNAVAILABLE');
  return Object.freeze({
   ticket:Object.freeze({...ticket,signature}),
   issuedFromVerifiedStage:true,sourceOnly:true,
   canPublish:false,isLive:false,
   requiresIndependentGitReadback:true,
   requiresAtomicTree:true,
  });
 }
 return Object.freeze({issue});
}
