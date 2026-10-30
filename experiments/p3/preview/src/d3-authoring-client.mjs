/**
 * FISH118 D3 SOURCE-ONLY browser/service contract, default OFF.
 * This is NOT wired to public PWA, does not authorize generic Gear/KB writes,
 * and does not change the D2 sandbox's one-fixture write allowlist.
 * Never stores or sends a GitHub credential. A session-bound CSRF header is
 * confined to one exact same-origin operation POST. No offline queue/retry.
 */
import {expectedD4Media} from './d4-media-tickets.mjs';
const OP=/^p3_[a-f0-9-]{36}$/;
const KEY=/^[A-Za-z0-9_-]{12,96}$/;
const CSRF=/^[A-Za-z0-9_-]{43}$/;
const STATES=new Set(['Accepted','Validating','Checking','Merging','Deploying',
 'Verifying','Live','Conflict','Failed']);
const messages=Object.freeze({
 SOURCE_CONFLICT:'The sandbox source changed or the edit conflicts. No publication was accepted.',
 UNVERIFIED_SOURCE:'The server could not verify the sandbox source. No publication was accepted.',
 SUBMISSION_CONFLICT:'The server rejected this publication as a conflict. No acceptance receipt was returned.',
});
export class D3ClientError extends Error{
 constructor(code,diagnostic=null){
  super((messages[code]??'Fishing owner publication unavailable')+
   (code==='UNVERIFIED_SOURCE'&&typeof diagnostic==='string'&&
    /^[A-Z][A-Z0-9_]{2,63}$/.test(diagnostic)?
    ' ('+diagnostic+')':''));
  this.name='D3ClientError';this.code=code;
 }
}
const deny=code=>{throw new D3ClientError(code);};
const need=(v,code)=>{if(!v)deny(code);};
const validOrigin=value=>{
 try{const u=new URL(value);return u.protocol==='https:'&&u.origin===value&&
  !u.username&&!u.password&&u.pathname==='/'&&u.search===''&&u.hash==='';}
 catch{return false;}
};
const reqOpts=Object.freeze({credentials:'same-origin',cache:'no-store',
 redirect:'manual'});
async function parseJson(response){
 need(response instanceof Response&&!response.redirected,'UNTRUSTED_RESPONSE');
 need((response.headers.get('Content-Type')??'').toLowerCase().includes('application/json'),
  'UNTRUSTED_RESPONSE');
 let body;try{body=await response.json();}catch{deny('UNTRUSTED_RESPONSE');}
 need(body&&typeof body==='object'&&!Array.isArray(body),'UNTRUSTED_RESPONSE');
 return body;
}
// Optional owner-only status summary. Invalid/unavailable fields are
// discarded rather than treated as publication evidence.
function validPublicationSummary(value){
 return value&&typeof value==='object'&&!Array.isArray(value)&&
  ['gear','kb','catches'].includes(value.domain)&&
  ['add','edit'].includes(value.action)&&
  typeof value.itemName==='string'&&
  value.itemName.length>0&&value.itemName.length<=160&&
  (value.completedAt===null||(Number.isSafeInteger(value.completedAt)&&
   value.completedAt>0))&&
  (value.reasonCode===null||
   (typeof value.reasonCode==='string'&&
    /^[A-Z][A-Z0-9_]{1,63}$/.test(value.reasonCode)));
}
export function describeD3Operation(record,{canonicalLive=false}={}){
 need(record&&OP.test(record.operationId)&&STATES.has(record.state),
  'INVALID_OPERATION_STATUS');
 need(canonicalLive===true||canonicalLive===false,'INVALID_OPERATION_STATUS');
 const terminal=['Live','Conflict','Failed'].includes(record.state);
 // Sandbox "Live" means only verified sandbox test bytes, NEVER a public
 // canonical publication. This distinction is mandatory in every D3 UI.
 return Object.freeze({
  operationId:record.operationId,state:record.state,terminal,
  publicLive:record.state==='Live'&&canonicalLive===true,
  sandboxVerified:record.state==='Live'&&canonicalLive===false,
  needsAttention:['Conflict','Failed'].includes(record.state),
  summary:validPublicationSummary(record.summary)?record.summary:null,
 });
}
export function createD3AuthoringClient({
 origin,request,enabled=()=>false,online=()=>true,
}={}){
 need(validOrigin(origin)&&typeof request==='function'&&
  typeof enabled==='function'&&typeof online==='function','INVALID_CONFIGURATION');
 let csrf=null,owner=false,mediaReady=false;
 const active=()=>{need(enabled()===true,'NOT_ENABLED');need(online()===true,'OFFLINE_DENIED');};
 const exact=(path)=>origin+path;
 async function session(){
  active();
  const res=await request(exact('/session'),{...reqOpts,method:'GET'});
  need(res?.status===200,'SESSION_UNAVAILABLE');
  const body=await parseJson(res);
  const authorized=body.authenticated===true&&body.authorized===true&&
   CSRF.test(body.csrfToken??'');
  owner=authorized;csrf=authorized?body.csrfToken:null;
  mediaReady=authorized&&body.sandboxMediaReady===true;
  return Object.freeze({authenticated:body.authenticated===true,authorized,
   ownerLogin:authorized&&typeof body.ownerLogin==='string'&&
    /^[a-zA-Z0-9-]{1,39}$/.test(body.ownerLogin)?body.ownerLogin:null,
   sandboxPublishingReady:authorized&&body.sandboxPublishingReady===true,
   sandboxMediaReady:mediaReady});
 }
 async function signOut(){
  active();
  need(owner,'OWNER_SESSION_REQUIRED');
  // Immediately invalidate in-memory authority even if the network's
  // outcome is unknown; the server session is the only source of truth.
  owner=false;csrf=null;mediaReady=false;
  const res=await request(exact('/session/signout'),{
   ...reqOpts,method:'POST',
   headers:{'X-Fish-P0-Intent':'signout'},
  });
  need(res?.status===200,'SIGNOUT_UNCONFIRMED');
  const body=await parseJson(res);
  need(body.signedOut===true,'SIGNOUT_UNCONFIRMED');
  return true;
 }
 async function stageMedia({path,file}={}){
  active();need(owner&&mediaReady&&CSRF.test(csrf??''),
   'MEDIA_UNAVAILABLE');
  need(typeof path==='string'&&path.length>0&&path.length<=240&&
   file&&typeof file.arrayBuffer==='function'&&
   Number.isSafeInteger(file.size)&&file.size>0&&
   file.size<=10*1024*1024,
   'INVALID_MEDIA_INPUT');
  need(['image/jpeg','image/png','image/webp','image/gif'].includes(file.type),
   'INVALID_MEDIA_INPUT');
  // The full source picture validator is already run by the editor.
  // The Worker independently checks original content length, magic and
  // SHA-256 before sending bytes to the private GitHub sandbox.
  const res=await request(exact('/api/v3/media'),{
   ...reqOpts,method:'POST',headers:{
    'Content-Type':file.type,'X-Fish-V3-Intent':'stage-media',
    'X-Fish-V3-CSRF':csrf,
    'X-Fish-D4-Path':encodeURIComponent(path),
   },body:file,
  });
  if(res?.status===401||res?.status===403){
   owner=false;mediaReady=false;csrf=null;deny('SESSION_EXPIRED');
  }
  need(res?.status===201,'MEDIA_STAGE_UNCONFIRMED');
  const body=await parseJson(res),ticket=body.ticket;
  need(body.ok===true&&body.staged===true&&
   ticket?.path===path&&ticket.bytes===file.size&&
   /^[a-f0-9]{40}$/.test(ticket.blobSha??'')&&
   /^[a-f0-9]{64}$/.test(ticket.sha256??'')&&
   /^[A-Za-z0-9_-]{43}$/.test(ticket.signature??'')&&
   Number.isSafeInteger(ticket.expiresAt),'UNTRUSTED_MEDIA_TICKET');
  return Object.freeze({...ticket});
 }
 async function publish({package:pkg,idempotencyKey,media=[]}={}){
  active();
  need(owner&&CSRF.test(csrf??''),'OWNER_SESSION_REQUIRED');
  need(KEY.test(idempotencyKey??''),'INVALID_IDEMPOTENCY_KEY');
  need(pkg&&pkg.format==='fishing-companion-change-v2'&&
   ['gear','kb','catches'].includes(pkg.domain)&&['add','edit'].includes(pkg.operation),
   'INVALID_CHANGE');
  need(Array.isArray(media)&&media.length<=24,'INVALID_MEDIA_RECEIPTS');
  const needsMedia=pkg.picture?.action!=='keep'||
   (pkg.pictureSequence?.action??'keep')!=='keep'||media.length>0;
  need(!needsMedia||mediaReady,'MEDIA_UNAVAILABLE');
  let expected;
  try{expected=expectedD4Media(pkg);}
  catch{deny('INVALID_MEDIA_RECEIPTS');}
  need(expected.length===media.length&&
   expected.every(x=>media.some(y=>y?.path===x.path&&
    y.bytes===x.bytes&&y.sha256===x.sha256)),
   'INVALID_MEDIA_RECEIPTS');
  const res=await request(exact('/api/v3/operations'),{
   ...reqOpts,method:'POST',headers:{
    'Content-Type':'application/json',
    'X-Fish-V3-Intent':'publish',
    'X-Fish-V3-CSRF':csrf,
   },
   body:JSON.stringify({idempotencyKey,snapshot:{package:pkg,media}}),
  });
  if(res?.status===401||res?.status===403){owner=false;csrf=null;deny('SESSION_EXPIRED');}
  if(res?.status===409){
   // 409 is a rejected, non-accepted submission; carry only a bounded,
   // server-enumerated reason. Never resubmit automatically or persist key.
   const response=await parseJson(res);
   const code=response.error==='SOURCE_CONFLICT'?'SOURCE_CONFLICT':
    response.error==='UNVERIFIED_SOURCE'?'UNVERIFIED_SOURCE':
    'SUBMISSION_CONFLICT';
   throw new D3ClientError(code,response.diagnostic);
  }
  need(res?.status===202||res?.status===200,'SUBMISSION_NOT_ACCEPTED');
  const body=await parseJson(res);
  need(body.ok===true&&OP.test(body.operationId??'')&&
   body.statusPath==='/api/v3/operations/'+body.operationId&&
   STATES.has(body.state)&&
   typeof body.duplicate==='boolean'&&body.canonicalLive===false,
   'UNTRUSTED_RECEIPT');
  // Caller may navigate away ONLY after a durable receipt, never on
  // fetch timeout or a response that merely says "ok".
  return Object.freeze({operationId:body.operationId,state:body.state,
   accepted:true,duplicate:body.duplicate,canonicalLive:false});
 }
 async function latest(){
  active();
  need(owner,'OWNER_SESSION_REQUIRED');
  const res=await request(exact('/api/v3/operations/latest'),
   {...reqOpts,method:'GET'});
  if(res?.status===401||res?.status===403){
   owner=false;csrf=null;deny('SESSION_EXPIRED');
  }
  need(res?.status===200,'STATUS_UNAVAILABLE');
  const body=await parseJson(res);
  need(body.ok===true&&body.canonicalLive===false&&
   Object.prototype.hasOwnProperty.call(body,'operation'),
   'UNTRUSTED_RECEIPT');
  if(body.operation===null)return null;
  need(OP.test(body.operation?.operationId??''),'UNTRUSTED_RECEIPT');
  return describeD3Operation(body.operation,{canonicalLive:false});
 }
 async function status(operationId){
  active();
  need(owner,'OWNER_SESSION_REQUIRED');
  need(OP.test(operationId??''),'INVALID_OPERATION_ID');
  const res=await request(exact('/api/v3/operations/'+operationId),
   {...reqOpts,method:'GET'});
  if(res?.status===401||res?.status===403){owner=false;csrf=null;deny('SESSION_EXPIRED');}
  need(res?.status===200,'STATUS_UNAVAILABLE');
  const body=await parseJson(res);
  need(body.ok===true&&typeof body.canonicalLive==='boolean'&&
   body.operation?.operationId===operationId,'UNTRUSTED_RECEIPT');
  return describeD3Operation(body.operation,{canonicalLive:body.canonicalLive});
 }
 return Object.freeze({session,signOut,stageMedia,publish,status,latest});
}
