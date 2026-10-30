/**
 * FISH118 P3-41 — SOURCE ONLY. Independent-content attestation gate for
 * owner-side review of a P3-40 UNSIGNED one-command proposal.
 *
 * Security boundaries:
 * - the independent attestor must live outside the GitHub runner and its
 *   publisher trust domain; source code alone cannot establish this custody.
 * - this module verifies only the *independent attestor's* ECDSA signature,
 *   NOT GitHub OIDC, App privileges, user presence or user intent.
 * - never treats a UI click, digest match or a review as an owner signature.
 * - no signing method, key generation, network, storage, D1 or publishing.
 * - no private command content may go to logs, GitHub or public artifacts.
 */
import {canonicalP3Approval} from './p3-operator-approval.mjs';

export class P3IndependentReviewError extends Error {
 constructor(code){
  super('P3 independent owner review denied');
  this.name='P3IndependentReviewError';
  this.code=code;
 }
}
const deny=code=>{throw new P3IndependentReviewError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
const text=new TextEncoder();
const REPO=1430581407,OWNER=265665562;
const sha=/^[a-f0-9]{40}$/, digest=/^[a-f0-9]{64}$/;
const idem=/^[A-Za-z0-9_-]{12,96}$/;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const sigPattern=/^[A-Za-z0-9_-]{86}$/;
const signedKeys=['v','purpose','repositoryId','operatorGithubId',
 'runId','runAttempt','workflowSha','approvalId','idempotencyKey',
 'bodySha256','issuedAt','expiresAt'];
const purpose='p3-independent-owner-content-v1';
const domain='p3-independent-owner-content-v1\n';
const positive=x=>Number.isSafeInteger(x)&&x>0;
const object=x=>x&&Object.getPrototypeOf(x)===Object.prototype;
const exact=(x,keys)=>object(x)&&Object.keys(x).length===keys.length&&
 keys.every(k=>Object.hasOwn(x,k));
const SHA256=async x=>{
 const result=await crypto.subtle.digest('SHA-256',text.encode(x));
 return [...new Uint8Array(result)].map(c=>c.toString(16).padStart(2,'0')).join('');
};
function canonicalAttestation(value){
 need(exact(value,signedKeys)&&value.v===1&&value.purpose===purpose&&
  value.repositoryId===REPO&&value.operatorGithubId===OWNER&&
  positive(value.runId)&&positive(value.runAttempt)&&value.runAttempt<=100&&
  sha.test(value.workflowSha)&&uuid.test(value.approvalId)&&
  idem.test(value.idempotencyKey)&&digest.test(value.bodySha256)&&
  positive(value.issuedAt)&&positive(value.expiresAt)&&
  value.expiresAt>value.issuedAt&&value.expiresAt-value.issuedAt<=300,
  'INVALID_INDEPENDENT_ATTESTATION');
 return JSON.stringify(Object.fromEntries(signedKeys.map(k=>[k,value[k]])));
}
function sigBytes(value){
 need(typeof value==='string'&&sigPattern.test(value),'INVALID_ATTESTOR_SIGNATURE');
 let raw;
 try{raw=Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')+'=='),
  x=>x.charCodeAt(0));}catch{deny('INVALID_ATTESTOR_SIGNATURE');}
 need(raw.length===64&&
  btoa(String.fromCharCode(...raw)).replace(/\+/g,'-')
   .replace(/\//g,'_').replace(/=+$/,'')===value,'INVALID_ATTESTOR_SIGNATURE');
 return raw;
}
function safeTree(value,depth=0){
 need(depth<=18,'INVALID_UNSIGNED_PROPOSAL');
 if(value===null||typeof value==='string'||typeof value==='boolean')return;
 if(typeof value==='number'){
  need(Number.isFinite(value),'INVALID_UNSIGNED_PROPOSAL');return;
 }
 need(typeof value==='object','INVALID_UNSIGNED_PROPOSAL');
 if(Array.isArray(value)){
  need(value.length<=1024,'INVALID_UNSIGNED_PROPOSAL');
  for(const item of value)safeTree(item,depth+1);
  return;
 }
 need(object(value),'INVALID_UNSIGNED_PROPOSAL');
 const fields=Object.keys(value);
 need(fields.length<=200&&!fields.some(k=>
  ['__proto__','constructor','prototype'].includes(k)),
  'INVALID_UNSIGNED_PROPOSAL');
 for(const key of fields)safeTree(value[key],depth+1);
}
function validProposal(value){
 need(object(value)&&value.unsigned===true&&
  value.requiresExternalOwnerSignature===true&&
  value.validForOneAcceptOnly===true&&
  typeof value.exactCommandForPrivateOwnerReview==='string'&&
  text.encode(value.exactCommandForPrivateOwnerReview).length>0&&
  text.encode(value.exactCommandForPrivateOwnerReview).length<=8192&&
  typeof value.canonicalApproval==='string'&&
  typeof value.signingMessage==='string'&&
  typeof value.signingMessageSha256==='string'&&
  digest.test(value.signingMessageSha256)&&digest.test(value.bodySha256)&&
  idem.test(value.idempotencyKey)&&
  positive(value.runId)&&positive(value.runAttempt)&&
  value.runAttempt<=100&&sha.test(value.workflowSha)&&
  positive(value.expiresAt),'INVALID_UNSIGNED_PROPOSAL');
 let command,approval;
 try{
  command=JSON.parse(value.exactCommandForPrivateOwnerReview);
  approval=JSON.parse(value.canonicalApproval);
  need(canonicalP3Approval(approval)===value.canonicalApproval,
   'INVALID_UNSIGNED_PROPOSAL');
 }catch{deny('INVALID_UNSIGNED_PROPOSAL');}
 need(exact(command,['action','idempotencyKey','snapshot'])&&
  command.action==='accept'&&command.idempotencyKey===value.idempotencyKey&&
  JSON.stringify(command)===value.exactCommandForPrivateOwnerReview&&
  object(command.snapshot)&&
  exact(command.snapshot,['package','media'])&&
  object(command.snapshot.package)&&
  Array.isArray(command.snapshot.media)&&command.snapshot.media.length===0&&
  command.snapshot.package.format==='fishing-companion-change-v2'&&
  ['gear','kb'].includes(command.snapshot.package.domain)&&
  ['add','edit'].includes(command.snapshot.package.operation)&&
  typeof command.snapshot.package.id==='string'&&
  command.snapshot.package.id.length>0&&
  command.snapshot.package.domain===value.packageDomain&&
  command.snapshot.package.operation===value.packageOperation&&
  command.snapshot.package.id===value.packageId&&
  approval.action==='accept'&&uuid.test(approval.approvalId)&&
  approval.idempotencyKey===value.idempotencyKey&&
  approval.bodySha256===value.bodySha256&&
  approval.repositoryId===REPO&&approval.operatorGithubId===OWNER&&
  approval.workflowSha===value.workflowSha&&
  approval.runId===value.runId&&approval.runAttempt===value.runAttempt&&
  approval.expiresAt===value.expiresAt&&
  value.signingMessage==='p3-operator-approval-v1\n'+value.canonicalApproval,
  'INVALID_UNSIGNED_PROPOSAL');
 safeTree(command);
 return approval;
}

/**
 * Does NOT obtain evidence on behalf of the user. A future, separately
 * reviewed owner-side trusted channel must supply:
 *   1. proposed: P3-40 review request from an authenticated runner;
 *   2. independentBody: exact bytes fetched/reconstructed independently
 *      of that runner; and
 *   3. attestation and signature from a PINNED independent attestor key.
 * The attestation is only strong if the private key is NOT controlled by
 * the candidate runner, GitHub App signer, Worker or publisher.
 */
export function createP3IndependentOwnerReview({
 attestorPublicJwk,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(object(attestorPublicJwk)&&
  attestorPublicJwk.kty==='EC'&&attestorPublicJwk.crv==='P-256'&&
  typeof attestorPublicJwk.x==='string'&&
  typeof attestorPublicJwk.y==='string'&&
  !Object.hasOwn(attestorPublicJwk,'d')&&
  (attestorPublicJwk.alg===undefined||attestorPublicJwk.alg==='ES256')&&
  (attestorPublicJwk.use===undefined||attestorPublicJwk.use==='sig')&&
  typeof now==='function','INVALID_INDEPENDENT_CONFIG');
 let keyPromise;
 const verifyKey=()=>{
  if(!keyPromise)keyPromise=crypto.subtle.importKey(
   'jwk',attestorPublicJwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify'])
    .catch(()=>deny('INVALID_INDEPENDENT_CONFIG'));
  return keyPromise;
 };
 async function inspect({proposed,independentBody,attestation,signature}={}){
  const approval=validProposal(proposed);
  need(typeof independentBody==='string'&&
   text.encode(independentBody).length>0&&
   text.encode(independentBody).length<=8192,
   'INVALID_INDEPENDENT_BODY');
  const expected=canonicalAttestation(attestation);
  const timestamp=now();
  need(positive(timestamp)&&approval.issuedAt>=timestamp-300&&
   approval.issuedAt<=timestamp+30&&approval.expiresAt>timestamp&&
   attestation.issuedAt>=timestamp-300&&
   attestation.issuedAt<=timestamp+30&&
   attestation.expiresAt>timestamp,'INDEPENDENT_EVIDENCE_EXPIRED');
  // Authenticity before authorizing any content equality as TRUSTED.
  let signed=false;
  try{
   signed=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},
    await verifyKey(),sigBytes(signature),text.encode(domain+expected));
  }catch{deny('INVALID_ATTESTOR_SIGNATURE');}
  need(signed===true,'INVALID_ATTESTOR_SIGNATURE');
  const commandDigest=await SHA256(independentBody);
  need(independentBody===proposed.exactCommandForPrivateOwnerReview&&
   commandDigest===proposed.bodySha256&&
   commandDigest===attestation.bodySha256,
   'INDEPENDENT_CONTENT_MISMATCH');
  need(await SHA256(proposed.signingMessage)===proposed.signingMessageSha256&&
   attestation.approvalId===approval.approvalId&&
   attestation.runId===approval.runId&&
   attestation.runAttempt===approval.runAttempt&&
   attestation.workflowSha===approval.workflowSha&&
   attestation.idempotencyKey===approval.idempotencyKey&&
   attestation.issuedAt===approval.issuedAt&&
   attestation.expiresAt===approval.expiresAt,
   'INDEPENDENT_RUN_MISMATCH');
  // The owner must still inspect FULL content in a private authenticated UI.
  // This response is NOT a signed approval and carries NO executable power.
  return Object.freeze({
   independentAttestationVerified:true,
   unsigned:true,requiresFullHumanReview:true,
   ownerSignaturePresent:false,mayExecute:false,
   exactCommandForPrivateDisplay:independentBody,
   bodySha256:commandDigest,
   signingMessageForLaterExternalReview:proposed.signingMessage,
   signingMessageSha256:proposed.signingMessageSha256,
   action:'accept',idempotencyKey:approval.idempotencyKey,
   approvalId:approval.approvalId,repositoryId:REPO,operatorGithubId:OWNER,
   runId:approval.runId,runAttempt:approval.runAttempt,
   workflowSha:approval.workflowSha,expiresAt:approval.expiresAt,
  });
 }
 return Object.freeze({inspect});
}
export const P3_INDEPENDENT_ATTESTATION_DOMAIN=domain;
export const P3_INDEPENDENT_ATTESTATION_PURPOSE=purpose;
