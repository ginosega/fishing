/**
 * FISH118 P3-40 — SOURCE-ONLY preparation of a human-reviewable, UNSIGNED
 * one-operation owner approval. NO owner signing key or signing primitive,
 * NO default fetch, GitHub App/Cloudflare secrets, D1 or publish/submit path.
 *
 * CRITICAL: verifyProvenance MUST be a trusted independently pinned GitHub
 * OIDC + App verification adapter (P3-38/P3-39). Merely supplying an object
 * with verified:true is NOT a provider proof. This module does not expose
 * JWT bytes or perform trusted-runtime setup.
 *
 * The owner must review the COMPLETE exact command JSON through a separate
 * authenticated/private channel and sign outside all GitHub runners/Workers.
 * This source only constructs exact canonical bytes for that external step.
 */
import {canonicalP3Approval} from './p3-operator-approval.mjs';

export class P3OwnerReviewError extends Error {
 constructor(code) {
  super('P3 unsigned owner review preparation denied');
  this.name='P3OwnerReviewError';
  this.code=code;
 }
}
const stop=code=>{throw new P3OwnerReviewError(code);};
const need=(ok,code)=>{if(!ok)stop(code);};
const enc=new TextEncoder();
const hex=x=>[...new Uint8Array(x)].map(n=>n.toString(16).padStart(2,'0')).join('');
const sha256=async value=>hex(await crypto.subtle.digest('SHA-256',enc.encode(value)));
const exactObject=value=>value&&Object.getPrototypeOf(value)===Object.prototype;
const exactKeys=(value,keys)=>exactObject(value)&&
 Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k));
const uuidV4=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const workflowSha=/^[a-f0-9]{40}$/;
const key=/^[A-Za-z0-9_-]{12,96}$/;
const repoId=1430581407,ownerId=265665562;
const positive=n=>Number.isSafeInteger(n)&&n>0;

// This is a bounded JSON syntax and safety scan, NOT the application package
// schema validator. That separate source-aware content validation is mandatory
// before a future command can be issued.
function scan(value,depth=0){
 need(depth<=18,'UNSAFE_REVIEW_COMMAND');
 if(value===null||typeof value==='string'||typeof value==='boolean')return;
 if(typeof value==='number'){need(Number.isFinite(value),'UNSAFE_REVIEW_COMMAND');return;}
 need(value&&typeof value==='object','UNSAFE_REVIEW_COMMAND');
 if(Array.isArray(value)){
  need(value.length<=1024,'UNSAFE_REVIEW_COMMAND');
  for(const part of value)scan(part,depth+1);
  return;
 }
 need(exactObject(value),'UNSAFE_REVIEW_COMMAND');
 const names=Object.keys(value);
 need(names.length<=200&&!names.some(k=>
  ['__proto__','constructor','prototype'].includes(k)),
  'UNSAFE_REVIEW_COMMAND');
 for(const name of names)scan(value[name],depth+1);
}
function examineBody(body){
 need(typeof body==='string'&&enc.encode(body).length>0&&
  enc.encode(body).length<=8192,'INVALID_REVIEW_COMMAND');
 let command;
 try{command=JSON.parse(body);}catch{stop('INVALID_REVIEW_COMMAND');}
 need(exactKeys(command,['action','idempotencyKey','snapshot'])&&
  command.action==='accept'&&key.test(command.idempotencyKey)&&
  exactKeys(command.snapshot,['package','media'])&&
  Array.isArray(command.snapshot.media)&&
  command.snapshot.media.length===0&&
  exactObject(command.snapshot.package)&&
  command.snapshot.package.format==='fishing-companion-change-v2'&&
  ['gear','kb'].includes(command.snapshot.package.domain)&&
  ['add','edit'].includes(command.snapshot.package.operation)&&
  typeof command.snapshot.package.id==='string'&&
  command.snapshot.package.id.length>0&&
  JSON.stringify(command)===body,'INVALID_REVIEW_COMMAND');
 scan(command);
 return command;
}

/**
 * Intentionally accepts a signed runner OIDC token only as an input to a
 * caller-supplied VERIFY function. Never outputs or persists that token.
 * An approval ID must come from owner-controlled CSPRNG; no RNG is exposed.
 */
export function createP3OwnerReviewPreparation({
 verifyProvenance,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(typeof verifyProvenance==='function'&&typeof now==='function',
  'INVALID_REVIEW_CONFIG');
 async function prepare({body,oidcJwt,approvalId,issuedAt,expiresAt}={}){
  const command=examineBody(body);
  need(typeof oidcJwt==='string'&&oidcJwt.length>=120&&oidcJwt.length<=10000&&
   uuidV4.test(approvalId??''),'INVALID_REVIEW_INPUT');
  let verified;
  try{verified=await verifyProvenance(oidcJwt);}
  catch{stop('RUN_PROVENANCE_DENIED');}
  need(verified?.verified===true&&
   verified.repositoryId===repoId&&verified.ownerGitHubId===ownerId&&
   positive(verified.runId)&&positive(verified.runAttempt)&&
   verified.runAttempt<=100&&workflowSha.test(verified.workflowSha??''),
   'RUN_PROVENANCE_DENIED');
  const current=now();
  need(positive(current)&&positive(issuedAt)&&positive(expiresAt)&&
   issuedAt>=current-300&&issuedAt<=current+30&&
   expiresAt>current&&expiresAt>issuedAt&&expiresAt-issuedAt<=300,
   'REVIEW_EXPIRED');
  const bodySha256=await sha256(body);
  const approval=Object.freeze({
   action:'accept',approvalId,bodySha256,expiresAt,
   idempotencyKey:command.idempotencyKey,issuedAt,
   operatorGithubId:ownerId,repositoryId:repoId,
   runAttempt:verified.runAttempt,runId:verified.runId,
   workflowSha:verified.workflowSha,
  });
  let canonical;
  try{canonical=canonicalP3Approval(approval);}
  catch{stop('INVALID_REVIEW_INPUT');}
  const signingMessage='p3-operator-approval-v1\n'+canonical;
  // This digest is only a byte-review aid; it does not authenticate the UI
  // channel. Owner must independently examine full command and exact run.
  return Object.freeze({
   unsigned:true,validForOneAcceptOnly:true,
   requiresExternalOwnerSignature:true,
   // NEVER print or persist complete command/JWT in runner logs/artifacts.
   exactCommandForPrivateOwnerReview:body,
   packageDomain:command.snapshot.package.domain,
   packageOperation:command.snapshot.package.operation,
   packageId:command.snapshot.package.id,
   idempotencyKey:command.idempotencyKey,
   bodySha256,
   canonicalApproval:canonical,
   signingMessage,
   signingMessageSha256:await sha256(signingMessage),
   runId:verified.runId,runAttempt:verified.runAttempt,
   workflowSha:verified.workflowSha,expiresAt,
  });
 }
 return Object.freeze({prepare});
}
