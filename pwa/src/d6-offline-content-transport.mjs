/**
 * O02 — read-only transport for explicit offline preparation.
 * Uses the same-origin read-only D1 snapshot endpoint
 * and private M02 original-image route. This file performs no work on import.
 * No public media URLs, new service, write requests or offline write queue.
 */
import {encodedPath} from './shared.mjs';
import {prepareD6OfflineContent,readVerifiedD6OfflineContent,
 verifyD6OfflineContentManifest} from './d6-offline-content-preparation.mjs';

const MAX_SNAPSHOT_BYTES=8*1024*1024;
const fail=(reason,code)=>Object.assign(new Error(reason),{code});
const goodJson=response=>
 response instanceof Response&&response.status===200&&
 response.redirected!==true&&
 /^application\/json\b/i.test(response.headers.get('Content-Type')||'');
const sameResponse=(response,url)=>!response.url||response.url===url;
function originFor(root){
 let app;
 try{app=new URL(root);}catch{throw fail('Invalid offline origin','CONFIG');}
 const local=app.protocol==='http:'&&
  ['localhost','127.0.0.1','[::1]'].includes(app.hostname);
 if((app.protocol!=='https:'&&!local)||app.pathname!=='/fishing/'||
    app.search||app.hash||app.username||app.password)
  throw fail('Invalid offline origin','CONFIG');
 return app.origin;
}
/**
 * Caller must explicitly invoke prepare from the existing Update action.
 * Read requests are available without a session and remain no-store.
 */
export function createD6OfflineContentTransport({
 root,request,enabled=()=>false,readingMode=()=> 'Checking',
}={}){
 const origin=originFor(root);
 if(typeof request!=='function'||typeof enabled!=='function'||
    typeof readingMode!=='function')
  throw fail('Offline transport unavailable','CONFIG');
 function ready(){
  if(enabled()!==true||readingMode()!=='Automatic')
   throw fail('Current offline preparation is unavailable',
    'NOT_ENABLED');
 }
 async function fetchSnapshot(){
  ready();
  const url=origin+'/api/v3/content/offline-snapshot';
  let reply;
  try{reply=await request(url,{
   method:'GET',credentials:'same-origin',cache:'no-store',
   redirect:'manual',headers:{Accept:'application/json'},
  });}catch{throw fail('Could not connect to the content service',
   'NETWORK_UNAVAILABLE');}
  if(!goodJson(reply)||!sameResponse(reply,url))
   throw fail('Current content snapshot unavailable','SNAPSHOT_UNAVAILABLE');
  const declared=reply.headers.get('Content-Length');
  if(declared!==null&&(!/^\d+$/.test(declared)||
     Number(declared)>MAX_SNAPSHOT_BYTES))
   throw fail('Content snapshot exceeds bounded size','SNAPSHOT_UNVERIFIED');
  let raw,body;
  try{
   raw=await reply.arrayBuffer();
   if(raw.byteLength>MAX_SNAPSHOT_BYTES)
    throw Error('Snapshot too large');
   body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
  }catch{throw fail('Malformed current content snapshot',
   'SNAPSHOT_UNVERIFIED');}
  if(body?.ok!==true||body.version!==1||
     !body.snapshot||typeof body.snapshot!=='object')
   throw fail('Unverified current content snapshot','SNAPSHOT_UNVERIFIED');
  try{await verifyD6OfflineContentManifest(body.snapshot);}
  catch{throw fail('Invalid current content snapshot','SNAPSHOT_UNVERIFIED');}
  return body.snapshot;
 }
 async function fetchOriginal(image,expected){
  ready();
  // Only O01-validated paths and SHA identities are permitted.
  if(expected.get(image.logicalPath)!==image.sha256)
   throw fail('Image is not in current content manifest','IMAGE_UNVERIFIED');
  const url=origin+'/api/v3/media/live/'+encodedPath(image.logicalPath);
  let reply;
  try{reply=await request(url,{
   method:'GET',credentials:'same-origin',cache:'no-store',
   redirect:'manual',headers:{Accept:image.mime},
  });}catch{throw fail('Image download unavailable',
   'NETWORK_UNAVAILABLE');}
  if(!(reply instanceof Response)||reply.status!==200||
     reply.redirected===true||!sameResponse(reply,url)||
     reply.headers.get('Content-Type')!==image.mime)
   throw fail('R2 image unavailable','IMAGE_UNAVAILABLE');
  const declared=reply.headers.get('Content-Length');
  if(declared!==null&&(!/^\d+$/.test(declared)||
     Number(declared)!==image.bytes))
   throw fail('R2 image size mismatch','IMAGE_UNAVAILABLE');
  return reply; // O02 independently hashes the actual response bytes.
 }
 async function prepare({caches,scope,onStatus=()=>{},onProgress=()=>{}}={}){
  ready();
  if(typeof onStatus!=='function'||typeof onProgress!=='function')
   throw fail('Offline progress unavailable','CONFIG');
  const emit=value=>{try{onStatus(value);}catch{}};
  let previous=null;
  try{
   previous=await readVerifiedD6OfflineContent({caches,scope});
   emit({phase:'checking',completed:0,total:0,
    previousVerified:Boolean(previous)});
   const snapshot=await fetchSnapshot();
   const expected=new Map(snapshot.images.map(x=>[x.logicalPath,x.sha256]));
   let finalStatus=null;
   const result=await prepareD6OfflineContent({
    snapshot,caches,scope,
    fetchImage:image=>fetchOriginal(image,expected),
    onProgress,
    onStatus:value=>{
     // Only signal completion once the selected generation has been
     // independently re-read, not from an in-flight staging callback.
     if(value.phase==='complete'||value.phase==='unchanged'){
      finalStatus=value;return;
     }
     emit(value);
    },
   });
   const verified=await readVerifiedD6OfflineContent({caches,scope});
   if(!verified||verified.contentId!==snapshot.contentId)
    throw fail('Selected offline content could not be verified',
     'SNAPSHOT_UNVERIFIED');
   emit({...finalStatus,phase:result.changed?'complete':'unchanged',
    completed:snapshot.counts.imageObjects,
    total:snapshot.counts.imageObjects,
    previousVerified:Boolean(previous)});
   return {...result,snapshot:verified.snapshot};
  }catch(error){
   // The engine emits its own error after staging failures. A second
   // bounded error event here also handles snapshot/transport failures.
   const reason=error?.code==='NETWORK_UNAVAILABLE'?'network':
    error?.name==='QuotaExceededError'?'storage':
    error?.code==='IMAGE_UNAVAILABLE'||error?.code==='IMAGE_UNVERIFIED'?
     'image':'content';
   emit({phase:'error',reason,previousVerified:Boolean(previous)});
   throw error;
  }
 }
 return Object.freeze({prepare,fetchSnapshot});
}
