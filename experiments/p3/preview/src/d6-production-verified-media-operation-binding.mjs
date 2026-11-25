/**
 * FISH-TODO-118 WP3 — request-bound VerifiedStage -> signed original-media
 * tickets -> independent Git-blob byte proof -> atomic-plan input.
 *
 * SOURCE ONLY / DEFAULT OFF / NO ROUTE / NO GITHUB MUTATION.
 * This is an integration adapter for existing #481 Accepted-operation reader,
 * #463 staging receipt + #469 signed-ticket issuer/verifier and #470 original
 * Git-blob verifier, NOT a second ticket/staging authority.
 *
 * A trusted host must bind its existing D2 owner POST/CSRF Request to a new
 * coordinator invocation via forRequest(authRequest). The resulting
 * loadAcceptedOperation({operationId,ownerGitHubId}) can be injected into the
 * existing publishing coordinators. Every call reauthorizes the original
 * request, reloads the immutable D1 operation, issues fresh original tickets
 * only after separate VerifiedStage+Unknown fence and current-source proof,
 * independently verifies HMAC/expiry and original Git bytes, and rereads the
 * D1 operation before exposing the complete ticket set.
 *
 * Never accept tickets or Git blob SHA hints from a browser. Missing one
 * required original, lost signed-ticket proof, uncertain D1/Git read, changed
 * source or invalid owner means no ready operation; no write retry or Live.
 */
import {expectedD6CanonicalMedia}
 from './d6-production-media-contract.mjs';
import {verifyD6CanonicalStagedGitBlobs}
 from './d6-production-media-blob-proof.mjs';
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
export class D6VerifiedMediaBindingError extends Error{
 constructor(code){
  super('D6 publishing media set cannot be verified');
  this.name='D6VerifiedMediaBindingError';this.code=code;
 }
}
const deny=code=>{throw new D6VerifiedMediaBindingError(code);};
const need=(good,code)=>{if(!good)deny(code);};
const frozenCopy=x=>Object.freeze([...x]);
function trusted(stored,id){
 const op=stored?.operation,pkg=stored?.package;
 need(stored?.sourceOnly===true&&stored.canPublish===false&&
  stored.isLive===false&&
  op?.operationId===id&&UUID.test(id??'')&&
  op.ownerGitHubId===REPO.ownerGitHubId&&
  op.repositoryId===REPO.id&&op.ref===REPO.ref&&
  op.state==='Accepted'&&
  SHA.test(op.sourceRevision??'')&&
  DIGEST.test(op.snapshotSha256??'')&&
  ['gear','kb','catches'].includes(op.domain)&&
  ['add','edit'].includes(op.operation)&&
  op.recordId===pkg?.id&&op.domain===pkg?.domain&&
  op.operation===pkg?.operation&&
  op.sourceRevision===pkg?.base?.sourceRevision&&
  Array.isArray(stored.pendingOriginals)&&
  Array.isArray(stored.mediaTickets)&&
  stored.mediaTickets.length===0&&
  stored.requiresSignedStaging===(stored.pendingOriginals.length>0)&&
  stored.requiresIndependentBlobReadback===
   (stored.pendingOriginals.length>0),
  'UNTRUSTED_OPERATION');
 let expected;
 try{expected=expectedD6CanonicalMedia(pkg);}
 catch{deny('INVALID_PACKAGE');}
 need(JSON.stringify(expected)===JSON.stringify(stored.pendingOriginals),
  'MEDIA_METADATA_MISMATCH');
 return {op,pkg,expected};
}
function stable(first,second){
 need(first.op.operationId===second.op.operationId&&
  first.op.ownerGitHubId===second.op.ownerGitHubId&&
  first.op.repositoryId===second.op.repositoryId&&
  first.op.sourceRevision===second.op.sourceRevision&&
  first.op.snapshotSha256===second.op.snapshotSha256&&
  first.op.domain===second.op.domain&&
  first.op.operation===second.op.operation&&
  first.op.recordId===second.op.recordId&&
  JSON.stringify(first.pkg)===JSON.stringify(second.pkg)&&
  JSON.stringify(first.expected)===JSON.stringify(second.expected),
  'OPERATION_CHANGED');
}
export function createD6ProductionVerifiedMediaOperationBinding({
 session,loadAcceptedOperation,issuer,verifyTicket,readGitBlob,
 enabled=()=>false,
}={}){
 need(typeof session?.authorizeWrite==='function'&&
  typeof loadAcceptedOperation==='function'&&
  typeof issuer?.issue==='function'&&
  typeof verifyTicket==='function'&&
  typeof readGitBlob==='function'&&
  typeof enabled==='function','INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 function forRequest(authRequest){
  active();
  need(authRequest instanceof Request&&authRequest.method==='POST',
   'INVALID_AUTH_REQUEST');
  async function loadForPublishing({operationId,ownerGitHubId}={}){
   active();
   let actor;
   try{actor=await session.authorizeWrite(authRequest);}
   catch{deny('OWNER_DENIED');}
   need(actor?.authorized===true&&
    actor.ownerGitHubId===REPO.ownerGitHubId&&
    ownerGitHubId===REPO.ownerGitHubId&&
    UUID.test(operationId??''),'OWNER_DENIED');
   let stored;
   try{stored=await loadAcceptedOperation({
    operationId,ownerGitHubId:actor.ownerGitHubId,
   });}catch{deny('OPERATION_UNAVAILABLE');}
   const first=trusted(stored,operationId);
   const tickets=[];
   for(const wanted of first.expected){
    active();
    let signed;
    try{
     signed=await issuer.issue(authRequest,{
      operationId,path:wanted.path,
     });
    }catch{deny('STAGE_OR_TICKET_UNVERIFIED');}
    need(signed?.issuedFromVerifiedStage===true&&
     signed.sourceOnly===true&&signed.canPublish===false&&
     signed.isLive===false&&
     signed.requiresIndependentGitReadback===true&&
     signed.requiresAtomicTree===true&&
     signed.ticket&&typeof signed.ticket==='object',
     'TICKET_UNVERIFIED');
    // A valid signed ticket is still only a claim until the independent
    // verifier and Git blob GET confirm the original bytes below.
    tickets.push(signed.ticket);
   }
   if(tickets.length){
    let proof;
    try{
     proof=await verifyD6CanonicalStagedGitBlobs({
      package:first.pkg,operation:first.op,
      media:tickets,verifyTicket,readGitBlob,
     });
    }catch{deny('ORIGINAL_GIT_BLOB_UNVERIFIED');}
    need(proof?.verified===true&&
     proof.operationId===operationId&&
     proof.fileCount===first.expected.length&&
     proof.sourceOnly===true&&proof.canPublish===false&&
     proof.isLive===false&&Array.isArray(proof.files)&&
     JSON.stringify(proof.files.map(x=>({
      path:x.path,bytes:x.bytes,sha256:x.sha256,
     })))===JSON.stringify(first.expected),
     'ORIGINAL_GIT_BLOB_UNVERIFIED');
   }
   active();
   let latest;
   try{latest=await loadAcceptedOperation({
    operationId,ownerGitHubId:actor.ownerGitHubId,
   });}catch{deny('OPERATION_UNAVAILABLE');}
   const second=trusted(latest,operationId);
   stable(first,second);
   // Revalidate owner on the same D2 request after asynchronous issuer
   // signing/blob reads; an expired/revoked session cannot pass the handoff.
   let stillOwner;
   try{stillOwner=await session.authorizeWrite(authRequest);}
   catch{deny('OWNER_DENIED');}
   need(stillOwner?.authorized===true&&
    stillOwner.ownerGitHubId===REPO.ownerGitHubId,
    'OWNER_DENIED');
   active();
   return Object.freeze({
    operation:second.op,package:second.pkg,
    mediaTickets:frozenCopy(tickets),
    pendingOriginals:second.expected,
    verifiedOriginalCount:tickets.length,
    completeOriginals:true,
    sourceOnly:true,canPublish:false,isLive:false,
    requiresAtomicSourceReview:true,
    requiresIndependentTreeReadback:true,
   });
  }
  return Object.freeze({loadAcceptedOperation:loadForPublishing});
 }
 return Object.freeze({forRequest});
}
