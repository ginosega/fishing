/**
 * WP3-2 canonical owner media upload PREFLIGHT — SOURCE ONLY / DEFAULT OFF.
 *
 * This is NOT a Worker route, blob stage, HMAC signer or GitHub writer.
 * The host must inject the existing trusted owner session/CSRF gate and a
 * canonical D1 operation/package reader, never browser-selected repository
 * or source. Returned original bytes are ephemeral and still require a
 * durable no-retry write fence, signed ticket, independent Git blob readback
 * and atomic source ownership verification before any publication.
 *
 * Read only the expected image's bytes, with a hard bounded stream rather
 * than an unbounded Request.arrayBuffer().
 */
import {sha256} from '../../../../pwa/src/shared.mjs';
import {expectedD6CanonicalMedia,d6ImageMime}
 from './d6-production-media-contract.mjs';
import {D6_PUBLISH_REPOSITORY,D6_PUBLISH_INTAKE_ORIGIN}
 from './d6-production-publish-intake.mjs';

const MAX_BYTES=10*1024*1024;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
const ROUTE='/api/v3/media';
const MIME=new Set(['image/jpeg','image/png','image/webp','image/gif']);
export class D6MediaPreflightError extends Error{
 constructor(code){
  super('D6 original media preflight denied');
  this.name='D6MediaPreflightError';this.code=code;
 }
}
const deny=code=>{throw new D6MediaPreflightError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
function validatedOperation(op,pkg,requestedId,owner){
 need(op&&pkg&&op.operationId===requestedId&&
  op.state==='Accepted'&&
  op.ownerGitHubId===owner&&
  owner===D6_PUBLISH_REPOSITORY.ownerGitHubId&&
  op.repositoryId===D6_PUBLISH_REPOSITORY.id&&
  op.ref===D6_PUBLISH_REPOSITORY.ref&&
  SHA.test(op.sourceRevision??'')&&
  DIGEST.test(op.snapshotSha256??'')&&
  op.domain===pkg.domain&&op.recordId===pkg.id&&
  op.sourceRevision===pkg.base?.sourceRevision&&
  ['gear','kb','catches'].includes(op.domain)&&
  /^[a-z0-9][a-z0-9-]*$/.test(op.recordId??''),
  'UNTRUSTED_OPERATION');
}
function requestedPath(raw){
 need(typeof raw==='string'&&raw.length>0&&raw.length<=1000,
  'INVALID_MEDIA_PATH');
 let path;
 try{
  path=decodeURIComponent(raw);
  need(encodeURIComponent(path)===raw,'INVALID_MEDIA_PATH');
 }catch{deny('INVALID_MEDIA_PATH');}
 return path;
}
async function boundedRead(request,expectedBytes){
 need(request.body&&typeof request.body.getReader==='function',
  'MISSING_MEDIA_BODY');
 const reader=request.body.getReader(),chunks=[];let total=0;
 try{
  for(;;){
   const next=await reader.read();
   if(next.done)break;
   need(next.value instanceof Uint8Array,'INVALID_MEDIA_BYTES');
   total+=next.value.byteLength;
   need(total<=MAX_BYTES,'MEDIA_TOO_LARGE');
   need(total<=expectedBytes,'MEDIA_LENGTH_MISMATCH');
   chunks.push(next.value);
  }
 }catch(e){
  try{await reader.cancel();}catch{}
  if(e instanceof D6MediaPreflightError)throw e;
  deny('MEDIA_READ_UNKNOWN');
 }finally{
  try{reader.releaseLock();}catch{}
 }
 need(total===expectedBytes,'MEDIA_LENGTH_MISMATCH');
 const bytes=new Uint8Array(total);let offset=0;
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 return bytes;
}

/**
 * A separate owner-authorized runtime must bind this helper behind the
 * existing same-origin gateway. No route/permissions provided by this file.
 */
export function createD6ProductionMediaUploadPreflight({
 session,loadAcceptedOperation,enabled=()=>false,
 origin=D6_PUBLISH_INTAKE_ORIGIN,
}={}){
 need(typeof session?.authorizeMedia==='function'&&
  typeof loadAcceptedOperation==='function'&&
  typeof enabled==='function'&&
  origin===D6_PUBLISH_INTAKE_ORIGIN,'INVALID_CONFIG');
 async function preflight(request){
  need(enabled()===true,'DISABLED');
  need(request instanceof Request,'INVALID_REQUEST');
  const url=new URL(request.url);
  need(url.origin===origin&&url.pathname===ROUTE&&
   !url.search&&!url.hash&&request.method==='POST','INVALID_REQUEST');
  // D2 validates exact owner session, Origin, same-origin Fetch-Site,
  // stage-media intent, binary Content-Type and session-bound CSRF.
  let actor;
  try{actor=await session.authorizeMedia(request);}
  catch{deny('OWNER_DENIED');}
  need(actor?.authorized===true&&
   actor.ownerGitHubId===D6_PUBLISH_REPOSITORY.ownerGitHubId,
   'OWNER_DENIED');
  const operationId=request.headers.get('X-Fish-V3-Operation');
  need(UUID.test(operationId??''),'INVALID_OPERATION_ID');
  const path=requestedPath(request.headers.get('X-Fish-V3-Media-Path'));
  let stored;
  try{stored=await loadAcceptedOperation({
   operationId,ownerGitHubId:actor.ownerGitHubId,
  });}catch{deny('OPERATION_READ_UNKNOWN');}
  need(stored&&typeof stored==='object','OPERATION_UNAVAILABLE');
  const op=stored.operation,pkg=stored.package;
  validatedOperation(op,pkg,operationId,actor.ownerGitHubId);
  let expected;
  try{expected=expectedD6CanonicalMedia(pkg);}
  catch{deny('INVALID_PACKAGE');}
  // Exact owned path and metadata must already appear in the immutable
  // accepted operation's source-derived package. A forged path cannot add
  // an image here. Subsequent source ownership remains an independent gate.
  const match=expected.find(x=>x.path===path);
  need(match,'UNEXPECTED_MEDIA_PATH');
  need(match.bytes<=MAX_BYTES,'MEDIA_TOO_LARGE');
  const mediaType=request.headers.get('Content-Type');
  need(MIME.has(mediaType)&&
   mediaType===({'jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png',
    'webp':'image/webp','gif':'image/gif'})[path.split('.').at(-1).toLowerCase()],
   'MEDIA_TYPE_MISMATCH');
  const length=request.headers.get('Content-Length');
  need(length===null||(/^[0-9]+$/.test(length)&&
   Number.isSafeInteger(Number(length))&&Number(length)<=MAX_BYTES),
   'MEDIA_TOO_LARGE');
  need(length===null||Number(length)===match.bytes,'MEDIA_LENGTH_MISMATCH');
  const bytes=await boundedRead(request,match.bytes);
  need(d6ImageMime(bytes)===mediaType,'MEDIA_SIGNATURE_MISMATCH');
  const digest=await sha256(bytes);
  need(digest===match.sha256,'MEDIA_DIGEST_MISMATCH');
  // This is a source-only preflight, not a signed or durable stage receipt.
  return Object.freeze({
   operationId,repositoryId:op.repositoryId,
   sourceRevision:op.sourceRevision,
   snapshotSha256:op.snapshotSha256,
   path,bytes:bytes.length,sha256:digest,mime:mediaType,
   originalBytes:bytes,
   verifiedOriginal:true,sourceOnly:true,canPublish:false,
   requiresDurableWriteFence:true,requiresSignedTicket:true,
   requiresIndependentGitReadback:true,
  });
 }
 return Object.freeze({preflight});
}
