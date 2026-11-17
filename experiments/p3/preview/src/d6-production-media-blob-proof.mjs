/**
 * WP3-2 original Git-blob / signed-ticket proof — SOURCE ONLY / NO ROUTE.
 *
 * This pure server-side verifier expects an authenticated, durable canonical
 * operation, a separately signature-and-expiry-verified staging ticket, and
 * a read-only GitHub blob fetch. No browser token, token issuance, staging
 * write, Git tree mutation, operation transition or public Live status.
 *
 * The future coordinator must bind verifyTicket and readGitBlob to trusted
 * server implementations and run source/media ownership validation before
 * calling this helper. A failed or unknown provider read is NEVER a write
 * acknowledgment or permission for blind retry.
 */
import {sha256} from '../../../../pwa/src/shared.mjs';
import {expectedD6CanonicalMedia,d6ImageMime}
 from './d6-production-media-contract.mjs';
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';

const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const MAX=10*1024*1024;
const encoder=new TextEncoder();
const allowed=Object.freeze({
 jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',
 webp:'image/webp',gif:'image/gif',
});
export class D6MediaBlobProofError extends Error{
 constructor(code){
  super('D6 staged original Git blob proof denied');
  this.name='D6MediaBlobProofError';this.code=code;
 }
}
const deny=code=>{throw new D6MediaBlobProofError(code);};
const need=(value,code)=>{if(!value)deny(code);};
const hex=bytes=>Array.from(new Uint8Array(bytes),
 x=>x.toString(16).padStart(2,'0')).join('');
function authenticatedOperation(op,pkg){
 need(op&&UUID.test(op.operationId??'')&&
  op.ownerGitHubId===D6_PUBLISH_REPOSITORY.ownerGitHubId&&
  op.repositoryId===D6_PUBLISH_REPOSITORY.id&&
  op.ref===D6_PUBLISH_REPOSITORY.ref&&
  op.state==='Accepted'&&
  SHA.test(op.sourceRevision??'')&&
  DIGEST.test(op.snapshotSha256??'')&&
  op.domain===pkg.domain&&op.recordId===pkg.id&&
  op.sourceRevision===pkg.base?.sourceRevision,
  'UNTRUSTED_OPERATION');
 return op;
}
function decodeBlob(blob,proof){
 need(blob&&blob.sha===proof.blobSha&&
  blob.encoding==='base64'&&blob.size===proof.bytes&&
  Number.isSafeInteger(blob.size)&&blob.size>0&&blob.size<=MAX&&
  typeof blob.content==='string'&&
  blob.content.length>0&&blob.content.length<=15*1024*1024,
  'BLOB_UNVERIFIED');
 const raw=blob.content.replace(/[\r\n]/g,'');
 need(raw.length%4===0&&/^[A-Za-z0-9+/]+={0,2}$/.test(raw)&&
  raw.length<=Math.ceil(proof.bytes/3)*4+4,
  'BLOB_UNVERIFIED');
 let bytes;
 try{
  const binary=atob(raw);
  need(binary.length===proof.bytes,'BLOB_UNVERIFIED');
  bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 }catch{deny('BLOB_UNVERIFIED');}
 return bytes;
}
async function gitBlobSha(bytes){
 const header=encoder.encode('blob '+bytes.length+'\0');
 const block=new Uint8Array(header.length+bytes.length);
 block.set(header);block.set(bytes,header.length);
 return hex(await crypto.subtle.digest('SHA-1',block));
}
/**
 * Both callbacks are trusted server dependencies, never browser functions:
 * verifyTicket(raw,{operation,allowExpired:false}) must independently check
 * a cryptographic signature AND expiration and return verified bound fields.
 * readGitBlob({repositoryId,repositoryFullName,blobSha}) must GET GitHub Git
 * Data /blobs/{sha} using an appropriate server-only credential.
 */
export async function verifyD6CanonicalStagedGitBlobs({
 package:pkg,operation,media=[],verifyTicket,readGitBlob,
}={}){
 const expected=expectedD6CanonicalMedia(pkg);
 const op=authenticatedOperation(operation,pkg);
 need(expected.length>0&&Array.isArray(media)&&
  media.length===expected.length&&
  typeof verifyTicket==='function'&&
  typeof readGitBlob==='function',
  'INVALID_MEDIA_REQUEST');
 const byPath=new Map();
 for(const item of media){
  let proof;
  try{proof=await verifyTicket(item,{
   operation:op,allowExpired:false,
  });}catch{deny('TICKET_UNVERIFIED');}
  need(proof&&typeof proof.path==='string'&&
   SHA.test(proof.blobSha??'')&&
   DIGEST.test(proof.sha256??'')&&
   Number.isSafeInteger(proof.bytes)&&
   proof.bytes>0&&proof.bytes<=MAX&&
   proof.operationId===op.operationId&&
   proof.repositoryId===op.repositoryId&&
   proof.ownerGitHubId===op.ownerGitHubId&&
   proof.sourceRevision===op.sourceRevision&&
   proof.snapshotSha256===op.snapshotSha256,
   'TICKET_NOT_BOUND');
  need(!byPath.has(proof.path),'DUPLICATE_MEDIA_TICKET');
  byPath.set(proof.path,proof);
 }
 const results=[];
 for(const target of expected){
  const proof=byPath.get(target.path);
  const kind=allowed[target.path.split('.').at(-1).toLowerCase()];
  need(proof&&proof.sha256===target.sha256&&
   proof.bytes===target.bytes&&proof.mime===kind,
   'MEDIA_TICKET_MISMATCH');
  let blob;
  try{
   blob=await readGitBlob({
    repositoryId:D6_PUBLISH_REPOSITORY.id,
    repositoryFullName:D6_PUBLISH_REPOSITORY.name,
    blobSha:proof.blobSha,
   });
  }catch{deny('BLOB_READ_UNKNOWN');}
  const bytes=decodeBlob(blob,proof);
  need(await gitBlobSha(bytes)===proof.blobSha&&
   await sha256(bytes)===proof.sha256&&
   d6ImageMime(bytes)===kind,
   'BLOB_DIGEST_MISMATCH');
  results.push(Object.freeze({path:target.path,
   blobSha:proof.blobSha,sha256:proof.sha256,
   bytes:proof.bytes,mime:kind}));
 }
 return Object.freeze({
  verified:true,sourceOnly:true,canPublish:false,isLive:false,
  requiresSourceOwnership:true,requiresAtomicTree:true,
  requiresDurableReconciliation:true,
  operationId:op.operationId,
  fileCount:results.length,
  files:Object.freeze(results),
 });
}
