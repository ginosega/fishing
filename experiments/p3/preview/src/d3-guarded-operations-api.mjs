/**
 * FISH118 D3: default-off owner-only Gear/KB text operation contract.
 * Source-only: not registered with the Cloudflare gateway or D2 scheduler.
 * D2's one-record test route remains untouched and safely parked.
 *
 * Trusted validation MUST be backed by createD3TrustedGearKBCandidate
 * with the immutable private-sandbox GitHub snapshot loader. This module
 * holds no GitHub credentials and cannot enable any publishing runner.
 */
import {D2SessionError} from './d2-unified-owner-session.mjs';
import {DurableStoreError} from './d1-operation-store.mjs';
import {validatePackage} from '../../../../pwa/src/handoff.mjs';

const ID=1430581407,OWNER=265665562,MAX_BODY=16*1024;
const keyPattern=/^[A-Za-z0-9_-]{12,96}$/;
const operationPattern=/^p3_[0-9a-f-]{36}$/;
const shaPattern=/^[a-f0-9]{40}$/;
const enc=new TextEncoder();
const plain=x=>x!==null&&typeof x==='object'&&
  Object.getPrototypeOf(x)===Object.prototype;

export class D3ApiError extends Error{
  constructor(code,diagnostic=null){
    super('D3 sandbox owner operation refused');
    this.name='D3ApiError';this.code=code;this.diagnostic=diagnostic;
  }
}
const deny=(code,diagnostic=null)=>{throw new D3ApiError(code,diagnostic);};
// Bounded reason codes only; do not serialize raw exceptions or credentials.
const safeDiagnostic=e=>typeof e?.code==='string'&&
 /^[A-Z][A-Z0-9_]{2,63}$/.test(e.code)?e.code:'INTERNAL_VALIDATION_ERROR';
const requireTrue=(v,c)=>{if(!v)deny(c);};
function scan(value,depth=0){
  requireTrue(depth<=18,'UNSAFE_SUBMISSION');
  if(value===null||typeof value==='boolean'||typeof value==='string')return;
  if(typeof value==='number'){
    requireTrue(Number.isFinite(value),'UNSAFE_SUBMISSION');return;
  }
  requireTrue(typeof value==='object','UNSAFE_SUBMISSION');
  if(Array.isArray(value)){
    requireTrue(value.length<=1024,'UNSAFE_SUBMISSION');
    for(const item of value)scan(item,depth+1);
    return;
  }
  requireTrue(plain(value),'UNSAFE_SUBMISSION');
  const keys=Object.keys(value);
  requireTrue(keys.length<=200&&!keys.some(x=>
    ['__proto__','constructor','prototype'].includes(x)),
    'UNSAFE_SUBMISSION');
  for(const k of keys)scan(value[k],depth+1);
}
function submission(raw){
  requireTrue(typeof raw==='string'&&enc.encode(raw).length>0&&
    enc.encode(raw).length<=MAX_BODY,'PAYLOAD_TOO_LARGE');
  let value;
  try{value=JSON.parse(raw);}catch{deny('INVALID_JSON');}
  requireTrue(plain(value)&&
    Object.keys(value).sort().join(',')==='idempotencyKey,snapshot'&&
    keyPattern.test(value.idempotencyKey??''),
    'INVALID_SUBMISSION');
  const snapshot=value.snapshot,pkg=snapshot?.package;
  requireTrue(plain(snapshot)&&
    Object.keys(snapshot).sort().join(',')==='media,package'&&
    Array.isArray(snapshot.media)&&snapshot.media.length===0&&
    plain(pkg)&&pkg.format==='fishing-companion-change-v2'&&
    ['gear','kb'].includes(pkg.domain)&&
    ['add','edit'].includes(pkg.operation)&&
    pkg.picture?.action==='keep'&&
    (pkg.pictureSequence?.action??'keep')==='keep'&&
    ['keep','create','replace'].includes(pkg.notes?.action)&&
    JSON.stringify(value)===raw,'INVALID_SUBMISSION');
  scan(value);
  try{validatePackage(pkg);}catch{deny('INVALID_SUBMISSION');}
  return value;
}
const responseHeaders={
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store, max-age=0','Vary':'Cookie',
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
};
const respond=(body,status=200)=>new Response(JSON.stringify(body),
  {status,headers:responseHeaders});
const error=(status,code)=>respond({ok:false,error:code},status);
function translate(e){
  if(e instanceof D2SessionError){
    const status={
      INVALID_CONFIG:503,INVALID_REQUEST:400,ORIGIN_DENIED:403,
      BEARER_DENIED:403,CROSS_SITE_DENIED:403,METHOD_DENIED:405,
      INTENT_DENIED:403,CONTENT_TYPE_DENIED:415,SESSION_DENIED:401,
      CSRF_DENIED:403,
    }[e.code]??403;
    return error(status,status===503?'TEMPORARILY_UNAVAILABLE':e.code);
  }
  if(e instanceof D3ApiError){
    const status={
      INVALID_CONFIG:503,DISABLED:503,PAYLOAD_TOO_LARGE:413,
      INVALID_JSON:400,INVALID_SUBMISSION:400,
      UNSAFE_SUBMISSION:400,UNVERIFIED_SOURCE:409,
      SOURCE_CONFLICT:409,STATUS_NOT_FOUND:404,
    }[e.code]??503;
    if(status===409&&e.code==='UNVERIFIED_SOURCE')
      return respond({ok:false,error:e.code,
       diagnostic:e.diagnostic??'INTERNAL_VALIDATION_ERROR'},status);
    return error(status,status===503?'TEMPORARILY_UNAVAILABLE':e.code);
  }
  if(e instanceof DurableStoreError){
    const status={
      IDEMPOTENCY_CONFLICT:409,INVALID_SNAPSHOT:400,
      INVALID_IDEMPOTENCY_KEY:400,SNAPSHOT_TOO_LARGE:413,
    }[e.code]??503;
    return error(status,status===503?'TEMPORARILY_UNAVAILABLE':e.code);
  }
  return error(503,'TEMPORARILY_UNAVAILABLE');
}
/**
 * validateCandidate({package,repositoryId,ownerGitHubId}) must be injected
 * by the trusted server and MUST make a fresh read of current immutable
 * GitHub source. A browser's claimed source hash is never a proof.
 */
export function createD3GuardedOperationsApi({
  session,store,validateCandidate,enabled=()=>false,
  measure=async(_stage,work)=>work(),
}={}){
  requireTrue(['describe','authorizeWrite','authorizeStatus'].every(x=>
    typeof session?.[x]==='function')&&
    ['accept','get','latest','lookupReceipt'].every(x=>typeof store?.[x]==='function')&&
    typeof validateCandidate==='function'&&typeof enabled==='function'&&
    typeof measure==='function',
    'INVALID_CONFIG');
  async function handle(request){
    try{
      requireTrue(request instanceof Request,'INVALID_CONFIG');
      const url=new URL(request.url);
      if(request.method==='GET'&&url.pathname==='/session'&&url.search===''){
        const owner=await session.describe(request);
        // Browser UI capability is advisory; every POST is separately
        // authorized and the coordinator still requires its own hard gates.
        return respond({...owner,sandboxPublishingReady:
          owner?.authenticated===true&&owner?.authorized===true&&
          enabled()===true});
      }
      if(request.method==='POST'&&
        url.pathname==='/api/v3/operations'&&url.search===''){
        requireTrue(enabled()===true,'DISABLED');
        const owner=await measure('owner_authorization',()=>session.authorizeWrite(request));
        requireTrue(owner?.authorized===true&&owner.ownerGitHubId===OWNER,
          'UNVERIFIED_SOURCE');
        const length=request.headers.get('Content-Length');
        requireTrue(length===null||
          /^\d+$/.test(length)&&Number(length)<=MAX_BODY,
          'PAYLOAD_TOO_LARGE');
        const body=submission(await request.text());
        // Recover the ORIGINAL durable receipt first. If its 202 response
        // was lost and the sandbox main has since moved, fresh validation
        // could misleadingly reject an operation that is already Accepted.
        // The D1 lookup is owner/repo scoped and proves same key + payload
        // against the original hashed, immutable stored request. Never
        // create another operation or silently retry an uncertain POST.
        const previous=await store.lookupReceipt(body);
        if(previous){
          requireTrue(operationPattern.test(previous.operationId??'')&&
            typeof previous.state==='string'&&previous.inserted===false,
            'UNVERIFIED_SOURCE');
          return respond({ok:true,operationId:previous.operationId,
            state:previous.state,accepted:true,duplicate:true,
            statusPath:'/api/v3/operations/'+previous.operationId,
            canonicalLive:false},200);
        }
        let candidate;
        try{
          candidate=await measure('canonical_source_validation',()=>validateCandidate({
            package:body.snapshot.package,
            repositoryId:ID,
            ownerGitHubId:owner.ownerGitHubId,
          }));
        }catch(e){
          if(['SOURCE_CONFLICT','SOURCE_CHANGED',
            'DUPLICATE_OR_INVALID_ADD','MAIN_MOVED','MARKDOWN_COLLISION'
          ].includes(e?.code))deny('SOURCE_CONFLICT');
          deny('UNVERIFIED_SOURCE',safeDiagnostic(e));
        }
        requireTrue(candidate?.validated===true&&
          candidate.repositoryId===ID&&
          candidate.domain===body.snapshot.package.domain&&
          candidate.operation===body.snapshot.package.operation&&
          shaPattern.test(candidate.sourceRevision)&&
          Array.isArray(candidate.changes)&&
          [1,2].includes(candidate.changes.length),
          'UNVERIFIED_SOURCE');
        // Store.accept itself enforces owner-scoped idempotency and
        // snapshot/content hash integrity. A 202 is durable, not Live.
        const row=await measure('idempotent_accept',()=>store.accept(body));
        requireTrue(operationPattern.test(row?.operationId)&&
          typeof row.state==='string'&&typeof row.inserted==='boolean',
          'UNVERIFIED_SOURCE');
        return respond({ok:true,operationId:row.operationId,
          state:row.state,accepted:row.state==='Accepted',
          duplicate:!row.inserted,
          statusPath:'/api/v3/operations/'+row.operationId,
          canonicalLive:false},row.inserted?202:200);
      }
      // The authenticated latest receipt is discoverable from any device.
      // Unlike a browser-local operation ID, it survives a new Chrome
      // profile or Android install without ever disclosing another owner's.
      if(request.method==='GET'&&
        url.pathname==='/api/v3/operations/latest'&&url.search===''){
        const owner=await session.authorizeStatus(request);
        requireTrue(owner?.authorized===true&&owner.ownerGitHubId===OWNER,
          'STATUS_NOT_FOUND');
        const found=await store.latest();
        requireTrue(found===null||
          (operationPattern.test(found?.operationId??'')&&
           typeof found.state==='string'),'UNVERIFIED_SOURCE');
        return respond({ok:true,operation:found,canonicalLive:false});
      }
      if(request.method==='GET'&&
        /^\/api\/v3\/operations\/[^/]+$/.test(url.pathname)&&
        url.search===''){
        const owner=await session.authorizeStatus(request);
        requireTrue(owner?.authorized===true&&owner.ownerGitHubId===OWNER,
          'STATUS_NOT_FOUND');
        const id=url.pathname.slice('/api/v3/operations/'.length);
        requireTrue(operationPattern.test(id),'STATUS_NOT_FOUND');
        const found=await store.get(id);
        requireTrue(found?.operationId===id,'STATUS_NOT_FOUND');
        return respond({ok:true,operation:found,canonicalLive:false});
      }
      return error(404,'NOT_FOUND');
    }catch(e){return translate(e);}
  }
  return Object.freeze({handle});
}
