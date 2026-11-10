/**
 * D6 canonical-main publish INTAKE — SOURCE ONLY, not a publishing API.
 *
 * Deliberately not wired to the production Worker, a route, any GitHub
 * permission, D1 operation store, merge, deployment, or polling coordinator.
 * This validates a bounded TEXT-ONLY Gear/KB intent before a future trusted
 * candidate validator and durable idempotency/unknown-receipt store. A valid
 * intent is NEVER an accepted operation or evidence of public Live.
 *
 * Reuses the exact D2 owner session/CSRF verifier; no second login or
 * browser-provided owner/repository selection. The caller MUST supply a
 * freshly verified canonical main SHA from a trusted server-side reader,
 * never from an HTTP field. No publisher can call this module alone.
 */
import {createD2UnifiedOwnerSession}
 from './d2-unified-owner-session.mjs';
import {validatePackage} from '../../../../pwa/src/handoff.mjs';

export const D6_PUBLISH_REPOSITORY=Object.freeze({
 id:1350909744,name:'ginosega/fishing',ref:'refs/heads/main',
 ownerGitHubId:265665562,
});
export const D6_PUBLISH_INTAKE_ORIGIN='https://fishing.ginosega.workers.dev';
const PATH='/api/v3/operations';
const SHA=/^[a-f0-9]{40}$/;
const KEY=/^[A-Za-z0-9_-]{12,96}$/;
const MAX_BODY=128*1024;
const encoder=new TextEncoder();
const plain=value=>value!==null&&typeof value==='object'&&
 Object.getPrototypeOf(value)===Object.prototype;

export class D6PublishIntakeError extends Error {
 constructor(code){
  super('D6 publishing intent denied');
  this.name='D6PublishIntakeError';
  this.code=code;
 }
}
const deny=code=>{throw new D6PublishIntakeError(code);};
const need=(value,code)=>{if(!value)deny(code);};
function inspectTree(value,depth=0){
 need(depth<=18,'UNSAFE_SUBMISSION');
 if(value===null||typeof value==='boolean'||typeof value==='string')return;
 if(typeof value==='number'){
  need(Number.isFinite(value),'UNSAFE_SUBMISSION');return;
 }
 need(typeof value==='object','UNSAFE_SUBMISSION');
 if(Array.isArray(value)){
  need(value.length<=1024,'UNSAFE_SUBMISSION');
  for(const item of value)inspectTree(item,depth+1);
  return;
 }
 need(plain(value),'UNSAFE_SUBMISSION');
 const keys=Object.keys(value);
 need(keys.length<=200&&keys.every(key=>
  key!=='__proto__'&&key!=='prototype'&&key!=='constructor'),
  'UNSAFE_SUBMISSION');
 for(const key of keys)inspectTree(value[key],depth+1);
}
function freezeTree(value){
 if(value&&typeof value==='object'){
  for(const child of Object.values(value))freezeTree(child);
  Object.freeze(value);
 }
 return value;
}
function parseIntent(raw){
 need(typeof raw==='string'&&raw.length>0&&
  encoder.encode(raw).length<=MAX_BODY,'PAYLOAD_TOO_LARGE');
 let body;
 try{body=JSON.parse(raw);}catch{deny('INVALID_JSON');}
 inspectTree(body);
 need(plain(body)&&Object.keys(body).sort().join(',')===
  'idempotencyKey,snapshot'&&KEY.test(body.idempotencyKey)&&
  plain(body.snapshot)&&
  Object.keys(body.snapshot).sort().join(',')==='media,package'&&
  Array.isArray(body.snapshot.media)&&body.snapshot.media.length===0&&
  plain(body.snapshot.package)&&
  body.snapshot.package.format==='fishing-companion-change-v2'&&
  ['gear','kb'].includes(body.snapshot.package.domain)&&
  ['add','edit'].includes(body.snapshot.package.operation)&&
  SHA.test(body.snapshot.package.base?.sourceRevision??'')&&
  body.snapshot.package.picture?.action==='keep'&&
  (body.snapshot.package.pictureSequence?.action??'keep')==='keep'&&
  (!body.snapshot.package.notes?.images||
   Array.isArray(body.snapshot.package.notes.images)&&
   body.snapshot.package.notes.images.length===0)&&
  JSON.stringify(body)===raw,'INVALID_SUBMISSION');
 try{validatePackage(body.snapshot.package);}
 catch{deny('INVALID_SUBMISSION');}
 return freezeTree(body);
}

export function createD6ProductionPublishIntake({
 AUTH_DB,csrfKey,enabled=()=>false,now,
 sessionFactory=createD2UnifiedOwnerSession,
}={}){
 need(typeof enabled==='function'&&
  typeof sessionFactory==='function'&&
  (now===undefined||typeof now==='function'),'INVALID_CONFIG');
 let session;
 const requireSession=()=>{
  if(enabled()!==true)deny('DISABLED');
  if(!session){
   try{session=sessionFactory({
    AUTH_DB,csrfKey,
    ownerGitHubId:D6_PUBLISH_REPOSITORY.ownerGitHubId,
    origin:D6_PUBLISH_INTAKE_ORIGIN,now,
   });}
   catch{deny('SESSION_UNAVAILABLE');}
   need(typeof session?.authorizeWrite==='function',
    'SESSION_UNAVAILABLE');
  }
  return session;
 };
 async function inspect(request,{trustedMainSha}={}){
  if(enabled()!==true)deny('DISABLED');
  need(request instanceof Request,'INVALID_REQUEST');
  let url;
  try{url=new URL(request.url);}catch{deny('INVALID_REQUEST');}
  need(url.origin===D6_PUBLISH_INTAKE_ORIGIN&&
   url.pathname===PATH&&!url.search&&!url.hash&&
   !url.username&&!url.password&&request.method==='POST'&&
   !request.headers.has('Authorization'),'ROUTE_DENIED');
  need(SHA.test(trustedMainSha??''),'UNVERIFIED_MAIN');
  let actor;
  try{actor=await requireSession().authorizeWrite(request);}
  catch{deny('OWNER_DENIED');}
  need(actor?.authorized===true&&
   actor.ownerGitHubId===D6_PUBLISH_REPOSITORY.ownerGitHubId,
   'OWNER_DENIED');
  const length=request.headers.get('Content-Length');
  need(length===null||/^\d+$/.test(length)&&Number(length)<=MAX_BODY,
   'PAYLOAD_TOO_LARGE');
  let raw;
  try{raw=await request.text();}
  catch{deny('INVALID_REQUEST');}
  const body=parseIntent(raw);
  // This is a NON-SUBMITTING verified envelope. A future server must
  // independently validate current Git tree/media, record an immutable
  // idempotent operation, run guarded exact-head CI/merge and verify hosted
  // source/bytes before any public Live acknowledgment.
  return Object.freeze({
   ...D6_PUBLISH_REPOSITORY,
   trustedMainSha,
   submittedSourceRevision:body.snapshot.package.base.sourceRevision,
   idempotencyKey:body.idempotencyKey,
   snapshot:body.snapshot,
   requiresSourceReview:true,
   sourceOnly:true,
   canPublish:false,
  });
 }
 return Object.freeze({inspect});
}
