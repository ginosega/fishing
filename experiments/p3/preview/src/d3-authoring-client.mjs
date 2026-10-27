/**
 * FISH118 D3 SOURCE-ONLY browser/service contract, default OFF.
 * This is NOT wired to public PWA, does not authorize generic Gear/KB writes,
 * and does not change the D2 sandbox's one-fixture write allowlist.
 * Never stores or sends a GitHub credential. A session-bound CSRF header is
 * confined to one exact same-origin operation POST. No offline queue/retry.
 */
const OP=/^p3_[a-f0-9-]{36}$/;
const KEY=/^[A-Za-z0-9_-]{12,96}$/;
const CSRF=/^[A-Za-z0-9_-]{43}$/;
const STATES=new Set(['Accepted','Validating','Checking','Merging','Deploying',
 'Verifying','Live','Conflict','Failed']);
export class D3ClientError extends Error{
 constructor(code){super('Fishing owner publication unavailable');this.name='D3ClientError';this.code=code;}
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
 });
}
export function createD3AuthoringClient({
 origin,request,enabled=()=>false,online=()=>true,
}={}){
 need(validOrigin(origin)&&typeof request==='function'&&
  typeof enabled==='function'&&typeof online==='function','INVALID_CONFIGURATION');
 let csrf=null,owner=false;
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
  return Object.freeze({authenticated:body.authenticated===true,authorized,
   sandboxPublishingReady:authorized&&body.sandboxPublishingReady===true});
 }
 async function signOut(){
  active();
  need(owner,'OWNER_SESSION_REQUIRED');
  // Immediately invalidate in-memory authority even if the network's
  // outcome is unknown; the server session is the only source of truth.
  owner=false;csrf=null;
  const res=await request(exact('/session/signout'),{
   ...reqOpts,method:'POST',
   headers:{'X-Fish-P0-Intent':'signout'},
  });
  need(res?.status===200,'SIGNOUT_UNCONFIRMED');
  const body=await parseJson(res);
  need(body.signedOut===true,'SIGNOUT_UNCONFIRMED');
  return true;
 }
 async function publish({package:pkg,idempotencyKey}={}){
  active();
  need(owner&&CSRF.test(csrf??''),'OWNER_SESSION_REQUIRED');
  need(KEY.test(idempotencyKey??''),'INVALID_IDEMPOTENCY_KEY');
  need(pkg&&pkg.format==='fishing-companion-change-v2'&&
   ['gear','kb'].includes(pkg.domain)&&['add','edit'].includes(pkg.operation),
   'INVALID_CHANGE');
  // D3 is text-only. D4 adds binary media as a separately approved
  // atomic source-upload protocol; NEVER silently drop selected media.
  need(pkg.picture?.action==='keep'&&pkg.pictureSequence?.action==='keep',
   'MEDIA_REQUIRES_D4');
  const res=await request(exact('/api/v3/operations'),{
   ...reqOpts,method:'POST',headers:{
    'Content-Type':'application/json',
    'X-Fish-V3-Intent':'publish',
    'X-Fish-V3-CSRF':csrf,
   },
   body:JSON.stringify({idempotencyKey,snapshot:{package:pkg,media:[]}}),
  });
  if(res?.status===401||res?.status===403){owner=false;csrf=null;deny('SESSION_EXPIRED');}
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
 return Object.freeze({session,signOut,publish,status});
}
