/**
 * FISH118 D2 -- source-only, NOT ROUTED / NOT DEPLOYED.
 * Integration contract for the AUTH-P0 owner-session and an isolated D1
 * operation store. No GitHub, Worker route, Apps, D1 schema change, checkout,
 * auto merge or publish functionality. POST is DENIED by default.
 *
 * The required trusted validator is an injection seam for the real canonical
 * source-aware Gear validator, which is NOT wired yet. Mocks in tests do NOT
 * constitute live canonical validation or authorize any GitHub write.
 */
import {D2SessionError} from './d2-unified-owner-session.mjs';
import {DurableStoreError} from './d1-operation-store.mjs';
import {validatePackage} from '../../../pwa/src/handoff.mjs';
const ORIGIN_ID=1430581407,MAX=16*1024;
const utf8=new TextEncoder();
const token=/^[A-Za-z0-9_-]{12,96}$/;
const operation=/^p3_[0-9a-f-]{36}$/;
const object=x=>x&&Object.getPrototypeOf(x)===Object.prototype;
export class D2ApiError extends Error{
 constructor(code){super('D2 operation request denied');this.name='D2ApiError';this.code=code;}
}
const no=code=>{throw new D2ApiError(code);};
const need=(ok,code)=>{if(!ok)no(code);};
function walk(v,depth=0){
 need(depth<=18,'UNSAFE_COMMAND');
 if(v===null||typeof v==='string'||typeof v==='boolean')return;
 if(typeof v==='number'){need(Number.isFinite(v),'UNSAFE_COMMAND');return;}
 need(typeof v==='object','UNSAFE_COMMAND');
 if(Array.isArray(v)){
  need(v.length<=1024,'UNSAFE_COMMAND');
  for(const item of v)walk(item,depth+1);
 }else{
  need(object(v),'UNSAFE_COMMAND');
  const keys=Object.keys(v);
  need(keys.length<=200&&!keys.some(k=>
   ['__proto__','constructor','prototype'].includes(k)),'UNSAFE_COMMAND');
  for(const k of keys)walk(v[k],depth+1);
 }
}
function parseSubmission(raw){
 need(typeof raw==='string'&&utf8.encode(raw).length>0&&
  utf8.encode(raw).length<=MAX,'PAYLOAD_TOO_LARGE');
 let body;try{body=JSON.parse(raw);}catch{no('INVALID_JSON');}
 need(object(body)&&Object.keys(body).sort().join(',')==='idempotencyKey,snapshot'&&
  token.test(body.idempotencyKey??''),'INVALID_COMMAND');
 const s=body.snapshot,p=s?.package;
 need(object(s)&&Object.keys(s).sort().join(',')==='media,package'&&
  Array.isArray(s.media)&&s.media.length===0&&
  object(p)&&p.format==='fishing-companion-change-v2'&&
  p.domain==='gear'&&p.operation==='edit'&&
  typeof p.id==='string'&&p.id.length>0&&p.id.length<=96&&
  !Object.hasOwn(body,'repositoryId')&&
  JSON.stringify(body)===raw,'INVALID_COMMAND');
 walk(body);
 // Keep the already-approved V3 canonical content contract, not an ad-hoc
 // Gear envelope that would allow editing an ID or bypassing base hashes.
 // Full fresh-source semantics are still rechecked by trusted server adapter.
 try{validatePackage(p);}catch{no('INVALID_COMMAND');}
 need(p.changes&&object(p.changes.set)&&
  Array.isArray(p.changes.unset)&&object(p.changes.baseFields)&&
  p.picture.action==='keep'&&
  (p.pictureSequence?.action??'keep')==='keep'&&
  p.notes.action==='keep','INVALID_COMMAND');
 return body;
}
const HEADERS={
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'Vary':'Cookie',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
};
const result=(data,status=200)=>new Response(JSON.stringify(data),
 {status,headers:HEADERS});
const error=(status,code)=>result({ok:false,error:code},status);
const ruleCode=e=>{
 if(e instanceof D2SessionError)return {
  INVALID_CONFIG:503,INVALID_REQUEST:400,ORIGIN_DENIED:403,
  BEARER_DENIED:403,CROSS_SITE_DENIED:403,METHOD_DENIED:405,
  INTENT_DENIED:403,CONTENT_TYPE_DENIED:415,SESSION_DENIED:401,
  CSRF_DENIED:403,
 }[e.code]??403;
 if(e instanceof D2ApiError)return {
  INVALID_CONFIG:503,PAYLOAD_TOO_LARGE:413,INVALID_JSON:400,
  INVALID_COMMAND:400,UNSAFE_COMMAND:400,
  UNVERIFIED_SOURCE:409,STATUS_NOT_FOUND:404,
  DISABLED:503,
 }[e.code]??400;
 if(e instanceof DurableStoreError)return {
  IDEMPOTENCY_CONFLICT:409,INVALID_SNAPSHOT:400,
  INVALID_IDEMPOTENCY_KEY:400,SNAPSHOT_TOO_LARGE:413,
 }[e.code]??503;
 return 503;
};
const publicError=e=>{
 if(e instanceof D2SessionError||e instanceof D2ApiError||
  e instanceof DurableStoreError){
  const status=ruleCode(e);
  return error(status,status===503?'TEMPORARILY_UNAVAILABLE':e.code);
 }
 return error(503,'TEMPORARILY_UNAVAILABLE');
};
export function createD2GuardedOperationsApi({
 session,store,validateGearChange,writeEnabled=()=>false,
}={}){
 need(['describe','authorizeWrite','authorizeStatus'].every(k=>
  typeof session?.[k]==='function')&&
  typeof store?.accept==='function'&&typeof store?.get==='function'&&
  typeof validateGearChange==='function'&&typeof writeEnabled==='function',
 'INVALID_CONFIG');
 async function handle(request){
  try{
   need(request instanceof Request,'INVALID_CONFIG');
   const url=new URL(request.url);
   if(request.method==='GET'&&url.pathname==='/session'&&url.search===''){
    return result(await session.describe(request));
   }
   if(request.method==='POST'&&url.pathname==='/api/v3/operations'&&url.search===''){
    // The default is hard-off even for valid owner requests. No read of
    // body, source, tokens or D1 before the explicit server-side gate.
    need(writeEnabled()===true,'DISABLED');
    const owner=await session.authorizeWrite(request);
    const contentLength=request.headers.get('Content-Length');
    need(contentLength===null||
     /^\d+$/.test(contentLength)&&Number(contentLength)<=MAX,'PAYLOAD_TOO_LARGE');
    const raw=await request.text();
    const body=parseSubmission(raw);
    // Must use a separately reviewed trusted server-side canonical source
    // validator, never browser-provided "validated":true or a mocked source
    // revision. Real asynchronous worker MUST revalidate again before merge.
    let validation;try{
     validation=await validateGearChange({snapshot:body.snapshot,owner,
      repositoryId:ORIGIN_ID});
    }catch{no('UNVERIFIED_SOURCE');}
    need(validation?.valid===true&&validation.repositoryId===ORIGIN_ID&&
     typeof validation.sourceRevision==='string'&&
     /^[0-9a-f]{40}$/.test(validation.sourceRevision),
    'UNVERIFIED_SOURCE');
    const row=await store.accept(body);
    need(row&&operation.test(row.operationId??'')&&
     typeof row.state==='string'&&typeof row.inserted==='boolean',
    'UNVERIFIED_SOURCE');
    return result({ok:true,operationId:row.operationId,state:row.state,
      accepted:row.state==='Accepted',duplicate:!row.inserted,
      statusPath:'/api/v3/operations/'+row.operationId,
      canonicalLive:false},row.inserted?202:200);
   }
   if(request.method==='GET'&&
    /^\/api\/v3\/operations\/[^/]+$/.test(url.pathname)&&url.search===''){
    await session.authorizeStatus(request);
    const id=url.pathname.slice('/api/v3/operations/'.length);
    need(operation.test(id),'STATUS_NOT_FOUND');
    const current=await store.get(id);
    need(current?.operationId===id,'STATUS_NOT_FOUND');
    // status store binds query to configured exact owner/repo.
    return result({ok:true,operation:current,canonicalLive:false});
   }
   return error(404,'NOT_FOUND');
  }catch(e){return publicError(e);}
 }
 return Object.freeze({handle});
}
