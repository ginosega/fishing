/**
 * FISH118 WP3-2: canonical staging-ticket HMAC verifier.
 *
 * SOURCE ONLY. No ticket issuer, new storage, GitHub write, Worker route,
 * browser secret, D1 migration, or publishing claim. A future trusted
 * owner-authorized stager issues tickets only after original-byte verification.
 * This verifier is the trusted-server callback for media-blob-proof.mjs.
 * It never accepts browser-supplied operation identity or unsigned claims.
 */
import {safePath} from '../../../../pwa/src/shared.mjs';
import {validInlineNoteImagePath}
 from '../../../../pwa/src/handoff.mjs';
import {D6_PUBLISH_INTAKE_ORIGIN,D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';

export const D6_MEDIA_TICKET_VERSION='fish-v3-media-ticket-v1';
const VERSION=D6_MEDIA_TICKET_VERSION;
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const SIG=/^[A-Za-z0-9_-]{43}$/;
export const D6_MEDIA_TICKET_TTL_SECONDS=4*60*60;
const MAX_FILE=10*1024*1024,TTL=D6_MEDIA_TICKET_TTL_SECONDS,SKEW=60;
const mime=Object.freeze({jpg:'image/jpeg',jpeg:'image/jpeg',
 png:'image/png',webp:'image/webp',gif:'image/gif'});
const fields=Object.freeze(['version','operationId','repositoryId',
 'ownerGitHubId','ref','sourceRevision','snapshotSha256','path',
 'blobSha','sha256','bytes','mime','issuedAt','expiresAt']);
const fieldSet=new Set([...fields,'signature']);
const enc=new TextEncoder();
export class D6MediaTicketError extends Error{
 constructor(code){
  super('D6 canonical media ticket verification denied');
  this.name='D6MediaTicketError';this.code=code;
 }
}
const need=(ok,code)=>{if(!ok)throw new D6MediaTicketError(code);};
const plain=x=>x!==null&&typeof x==='object'&&
 !Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
export const d6CanonicalMediaTicketPayload=(origin,ticket)=>
 JSON.stringify([origin,...fields.map(field=>ticket[field])]);
function claimedPath(path,operation){
 let p;
 try{p=safePath(path);}catch{need(false,'UNSAFE_MEDIA_PATH');}
 need(p===path,'UNSAFE_MEDIA_PATH');
 const parts=path.split('/'),ext=parts.at(-1).split('.').at(-1)?.toLowerCase();
 const domain=operation.domain;
 need(mime[ext]&&
  (domain==='gear'?'Gear':domain==='kb'?'KB':'Catches')===parts[0],
  'UNSAFE_MEDIA_PATH');
 if(domain==='catches'){
  need(validInlineNoteImagePath('catches',operation.recordId,path),
   'UNSAFE_MEDIA_PATH');
 }else{
  need(parts.length>=4&&parts[1].length>0&&parts[2]==='assets',
   'UNSAFE_MEDIA_PATH');
 }
 return mime[ext];
}
function claims(ticket,operation,now){
 need(plain(ticket)&&Object.keys(ticket).length===fieldSet.size&&
  Object.keys(ticket).every(x=>fieldSet.has(x)),'INVALID_TICKET');
 need(ticket.version===VERSION&&SIG.test(ticket.signature??'')&&
  UUID.test(ticket.operationId??'')&&SHA.test(ticket.blobSha??'')&&
  SHA.test(ticket.sourceRevision??'')&&
  DIGEST.test(ticket.snapshotSha256??'')&&
  DIGEST.test(ticket.sha256??'')&&
  Number.isSafeInteger(ticket.bytes)&&ticket.bytes>0&&
  ticket.bytes<=MAX_FILE&&
  Number.isSafeInteger(ticket.issuedAt)&&ticket.issuedAt>0&&
  Number.isSafeInteger(ticket.expiresAt)&&ticket.expiresAt>ticket.issuedAt&&
  ticket.expiresAt<=ticket.issuedAt+TTL,
  'INVALID_TICKET');
 need(operation&&operation.state==='Accepted'&&
  operation.ownerGitHubId===D6_PUBLISH_REPOSITORY.ownerGitHubId&&
  operation.repositoryId===D6_PUBLISH_REPOSITORY.id&&
  operation.ref===D6_PUBLISH_REPOSITORY.ref&&
  UUID.test(operation.operationId??'')&&
  SHA.test(operation.sourceRevision??'')&&
  DIGEST.test(operation.snapshotSha256??'')&&
  ['gear','kb','catches'].includes(operation.domain)&&
  /^[a-z0-9][a-z0-9-]*$/.test(operation.recordId??''),
  'UNTRUSTED_OPERATION');
 need(ticket.operationId===operation.operationId&&
  ticket.repositoryId===operation.repositoryId&&
  ticket.ownerGitHubId===operation.ownerGitHubId&&
  ticket.ref===operation.ref&&
  ticket.sourceRevision===operation.sourceRevision&&
  ticket.snapshotSha256===operation.snapshotSha256,
  'TICKET_NOT_BOUND');
 need(ticket.mime===claimedPath(ticket.path,operation),
  'MEDIA_TYPE_MISMATCH');
 need(ticket.issuedAt<=now+SKEW&&ticket.expiresAt>now,
  'EXPIRED_TICKET');
}
function signatureBytes(value){
 need(SIG.test(value),'INVALID_TICKET');
 const raw=value.replace(/-/g,'+').replace(/_/g,'/')+'=';
 try{
  const binary=atob(raw);
  need(binary.length===32,'INVALID_TICKET');
  return Uint8Array.from(binary,c=>c.charCodeAt(0));
 }catch{need(false,'INVALID_TICKET');}
}
/**
 * This verifier requires the existing same-origin gateway's secret custody.
 * No client or request body may set its origin, key or clock. Ticket signing
 * is isolated in the separate default-off durable-proof issuer; no route
 * or signing key is installed by importing this verifier.
 */
export function createD6ProductionMediaTicketVerifier({
 origin=D6_PUBLISH_INTAKE_ORIGIN,secret,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(origin===D6_PUBLISH_INTAKE_ORIGIN&&
  typeof secret==='string'&&enc.encode(secret).length>=32&&
  typeof now==='function','INVALID_CONFIG');
 const key=crypto.subtle.importKey('raw',enc.encode(secret),
  {name:'HMAC',hash:'SHA-256'},false,['verify']);
 async function verifyTicket(ticket,{operation,allowExpired=false}={}){
  need(allowExpired===false,'UNSAFE_EXPIRED_READ');
  const timestamp=now();
  need(Number.isSafeInteger(timestamp)&&timestamp>0,'INVALID_CLOCK');
  claims(ticket,operation,timestamp);
  let valid=false;
  try{
   valid=await crypto.subtle.verify('HMAC',await key,
    signatureBytes(ticket.signature),
    enc.encode(d6CanonicalMediaTicketPayload(origin,ticket)));
  }catch{need(false,'SIGNATURE_UNVERIFIED');}
  need(valid===true,'SIGNATURE_UNVERIFIED');
  return Object.freeze(Object.fromEntries(fields.filter(x=>x!=='version')
   .map(x=>[x,ticket[x]])));
 }
 return Object.freeze({verifyTicket});
}
