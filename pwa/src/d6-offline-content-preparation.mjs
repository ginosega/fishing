/**
 * O02 — source-only, EXPLICIT current-content offline preparation.
 * No production Worker, service worker or browser startup imports this module.
 * O01 supplies a consistent owner-authorized D1 registry snapshot; O02 checks
 * its declared hashes and actual fetched R2 originals before Cache selection.
 * Standalone V3 never reads or mutates an older V2/FISH091 cache.
 */
import {canonical,encodedPath,sha256} from './shared.mjs';
import {isD6CurrentContentSnapshotCompatible}
 from '../server/d6-current-content-snapshot.mjs';

const HASH=/^[a-f0-9]{64}$/;
const MAX_IMAGES=10000,MAX_IMAGE_BYTES=10*1024*1024;
const MAX_TOTAL_BYTES=1024*1024*1024;
const textBytes=value=>new TextEncoder().encode(value);
const fail=message=>{throw Error('O02_CONTENT_UNVERIFIED: '+message);};
const check=(ok,message)=>{if(!ok)fail(message);};
const response=bytes=>new Response(bytes,{headers:{
 'Content-Type':'application/octet-stream','Cache-Control':'private, no-store',
}});
const jsonResponse=value=>new Response(JSON.stringify(value),{headers:{
 'Content-Type':'application/json','Cache-Control':'private, no-store',
}});
const imageKey=(scope,sha)=>new URL('__fishing_v3_content_image__/'+sha,scope).href;
const manifestKey=scope=>new URL('__fishing_v3_content_manifest__',scope).href;
const markerKey=scope=>new URL('__fishing_v3_content_complete__',scope).href;
const selectionKey=scope=>new URL('__fishing_v3_content_selected__',scope).href;
const prefix=scope=>'fishing-v3-content:'+new URL(scope).pathname+':';
const imageIdentity=image=>image.sha256+':'+image.bytes;
const imageDescriptors=snapshot=>new Map(snapshot.images.map(x=>[x.sha256,x]));
function originScope(scope){
 let url;
 try{url=new URL(scope);}catch{fail('Invalid scope');}
 check(url.protocol==='https:'||url.protocol==='http:'&&
  ['localhost','127.0.0.1'].includes(url.hostname),'Unsafe scope');
 check(!url.username&&!url.password&&!url.search&&!url.hash&&
  url.pathname.endsWith('/'),'Invalid scope URL');
 return url.href;
}
async function verifyImage(bytes,image){
 check(bytes.byteLength===image.bytes,'R2 image size mismatch');
 check(await sha256(bytes)===image.sha256,'R2 image digest mismatch');
 return bytes;
}
function imageMap(snapshot){
 const images=new Map(),paths=new Set();
 check(Array.isArray(snapshot.images)&&snapshot.images.length<=MAX_IMAGES,
  'Image manifest too large');
 for(const x of snapshot.images){
  check(x&&typeof x.logicalPath==='string'&&typeof x.sha256==='string'&&
   HASH.test(x.sha256)&&Number.isSafeInteger(x.bytes)&&
   x.bytes>0&&x.bytes<=MAX_IMAGE_BYTES&&
   typeof x.storageKey==='string'&&
   x.storageKey==='staged/v1/sha256/'+x.sha256&&
   ['image/jpeg','image/png','image/webp','image/gif'].includes(x.mime)&&
   Array.isArray(x.owners)&&x.owners.length>0,
   'Invalid R2 registry entry');
  try{encodedPath(x.logicalPath);}catch{fail('Invalid R2 logical path');}
  check(!paths.has(x.logicalPath),'Duplicate R2 logical path');
  paths.add(x.logicalPath);
  if(images.has(x.sha256))
   check(imageIdentity(images.get(x.sha256))===imageIdentity(x),
    'Conflicting R2 image identity');
  else images.set(x.sha256,x);
 }
 return images;
}
/** Verify all metadata before any network/storage activity. */
export async function verifyD6OfflineContentManifest(snapshot){
 check(isD6CurrentContentSnapshotCompatible(snapshot),'Reader incompatible');
 check(snapshot?.mediaVerification==='registry-only',
  'Unexpected R2 verification claim');
 const {contentId,mediaVerification,...payload}=snapshot;
 check(typeof contentId==='string'&&HASH.test(contentId)&&
  await sha256(canonical(payload))===contentId,'Snapshot identity mismatch');
 check(Array.isArray(snapshot.records)&&snapshot.records.length<=30000,
  'Invalid record manifest');
 const ids=new Set(),counts={gear:0,kb:0,catches:0};
 let recordBytes=0,markdownBytes=0;
 for(const x of snapshot.records){
  check(x&&['gear','kb','catches'].includes(x.domain)&&
   typeof x.id==='string'&&x.id===x.record?.id&&
   Number.isSafeInteger(x.revision)&&x.revision>=1&&
   typeof x.markdown==='string'&&HASH.test(x.recordSha256??'')&&
   HASH.test(x.markdownSha256??''),'Invalid record entry');
  const key=x.domain+':'+x.id;
  check(!ids.has(key),'Duplicate record ID');ids.add(key);counts[x.domain]++;
  const rb=textBytes(canonical(x.record)),mb=textBytes(x.markdown);
  check(rb.byteLength===x.recordBytes&&mb.byteLength===x.markdownBytes&&
   await sha256(rb)===x.recordSha256&&
   await sha256(mb)===x.markdownSha256,'Record or Markdown digest mismatch');
  recordBytes+=rb.byteLength;markdownBytes+=mb.byteLength;
 }
 const images=imageMap(snapshot);
 let imageBytes=0;
 for(const image of images.values())imageBytes+=image.bytes;
 check(snapshot.counts?.gear===counts.gear&&
  snapshot.counts?.kb===counts.kb&&
  snapshot.counts?.catches===counts.catches&&
  snapshot.counts?.imagePaths===snapshot.images.length&&
  snapshot.counts?.imageObjects===images.size&&
  snapshot.bytes?.records===recordBytes&&
  snapshot.bytes?.markdown===markdownBytes&&
  snapshot.bytes?.images===imageBytes&&
  Number.isSafeInteger(imageBytes)&&imageBytes<=MAX_TOTAL_BYTES,
  'Snapshot totals mismatch');
 return images;
}
async function cachedBytes(cache,key,image){
 if(!cache)return null;
 const saved=await cache.match(key);
 if(!saved)return null;
 try{return await verifyImage(await saved.arrayBuffer(),image);}
 catch{return null;}
}
/** Re-read every cached byte and marker before accepting any generation. */
async function verifyGeneration({caches,scope,name}){
 const cache=await caches.open(name);
 const marker=await cache.match(markerKey(scope));
 const manifest=await cache.match(manifestKey(scope));
 if(!marker||!manifest)fail('Incomplete cached generation');
 let m,snapshot;
 try{m=await marker.json();snapshot=await manifest.json();}
 catch{fail('Malformed cached generation');}
 check(m?.complete===true&&m?.contentId===snapshot?.contentId,
  'Cache identity mismatch');
 const images=await verifyD6OfflineContentManifest(snapshot);
 for(const image of images.values()){
  const bytes=await cachedBytes(cache,imageKey(scope,image.sha256),image);
  check(bytes!==null,'Incomplete or corrupt cached image');
 }
 return {cache,name,snapshot,images};
}
async function selected({caches,scope}){
 const meta=await caches.open(prefix(scope)+'metadata');
 let selection;
 try{selection=await (await meta.match(selectionKey(scope)))?.json();}
 catch{return null;}
 if(!selection||typeof selection.cacheName!=='string'||
  !selection.cacheName.startsWith(prefix(scope)+'generation:')||
  !HASH.test(selection.contentId??''))return null;
 try{
  const entry=await verifyGeneration({caches,scope,name:selection.cacheName});
  return entry.snapshot.contentId===selection.contentId?entry:null;
 }catch{return null;}
}
// Keep only the selected complete V3 content generation after successful
// promotion. Never touch unrelated storage.
// A failed cache deletion is harmless: a later explicit update retries.
async function pruneRetiredContentGenerations(caches,scope,selectedName){
 if(typeof caches.keys!=='function')return;
 let names;
 try{names=await caches.keys();}catch{return;}
 for(const name of names)if(name.startsWith(prefix(scope)+'generation:')&&
    name!==selectedName)
  try{await caches.delete(name);}catch{/* keep last selected intact */}
}
/**
 * Explicit user action only. All writes are to a new private generation;
 * selection changes last, after complete cache byte readback. Errors remove
 * only the new stage; existing selection, cache and drafts are never touched.
 */
export async function prepareD6OfflineContent({
 snapshot,caches,scope,fetchImage,
 onProgress=()=>{},onStatus=()=>{},nonce=()=>crypto.randomUUID(),
}={}){
 let previous=null,stageName=null,selectedNew=false;
 let total=0,completed=0,step='checking',reused=0,downloaded=0;
 // The UI receives only bounded phase/number/error codes, not raw exception
 // details, user content, R2 keys or network response bodies.
 const emit=(phase,detail={})=>{
  try{onStatus({phase,completed,total,
   previousVerified:Boolean(previous),...detail});}
  catch{/* Presentation cannot affect content integrity. */}
 };
 const reason=error=>{
  if(error?.name==='QuotaExceededError')return 'storage';
  if(error?.code==='NETWORK_UNAVAILABLE'||
     globalThis.navigator?.onLine===false)return 'network';
  if(step==='images'&&
     (error?.code==='IMAGE_UNAVAILABLE'||
      String(error?.message||'').includes('R2 image')))
   return 'image';
  return 'content';
 };
 try{
  scope=originScope(scope);
  check(caches&&typeof caches.open==='function'&&
   typeof caches.delete==='function'&&typeof fetchImage==='function'&&
   typeof nonce==='function',
   'Preparation unavailable');
  emit('checking');
  const images=await verifyD6OfflineContentManifest(snapshot);
  total=images.size;
  previous=await selected({caches,scope});
  if(previous?.snapshot.contentId===snapshot.contentId){
   completed=total;
   emit('unchanged',{reused:total,downloaded:0});
   return {contentId:snapshot.contentId,changed:false,
    reused:total,downloaded:0};
  }
  stageName=prefix(scope)+'generation:'+snapshot.contentId+':'+nonce();
  check(stageName.length<320&&/:[0-9a-f-]{8,}$/.test(stageName),
   'Invalid stage identity');
  const stage=await caches.open(stageName);
  step='images';
  emit('images',{reused,downloaded});
  for(const image of images.values()){
   const key=imageKey(scope,image.sha256);
   let bytes=await cachedBytes(previous?.cache,key,image);
   if(bytes){reused++;}
   else{
    let raw;
    try{raw=await fetchImage(image);}
    catch(error){
     // A browser network failure differs from a fetched image with a
     // mismatched SHA/size; both retain the last complete generation.
     if(error?.name==='TypeError'){
      const networkError=Error('R2_IMAGE_NETWORK_UNAVAILABLE');
      networkError.code='NETWORK_UNAVAILABLE';
      throw networkError;
     }
     throw error;
    }
    check(raw instanceof Response&&raw.ok&&raw.type!=='opaque',
     'R2 image unavailable');
    bytes=await verifyImage(await raw.arrayBuffer(),image);
    downloaded++;
   }
   await stage.put(key,response(bytes));
   completed++;
   try{onProgress({completed,total,reused,downloaded});}
   catch{/* Progress cannot affect verified cache writes. */}
   emit('images',{reused,downloaded});
  }
  step='verifying';
  emit('verifying',{reused,downloaded});
  await stage.put(manifestKey(scope),jsonResponse(snapshot));
  await stage.put(markerKey(scope),jsonResponse({
   complete:true,contentId:snapshot.contentId,
  }));
  await verifyGeneration({caches,scope,name:stageName});
  const meta=await caches.open(prefix(scope)+'metadata');
  await meta.put(selectionKey(scope),jsonResponse({
   contentId:snapshot.contentId,cacheName:stageName,
  }));
  selectedNew=true;
  await pruneRetiredContentGenerations(caches,scope,stageName);
  emit('complete',{reused,downloaded});
  return {contentId:snapshot.contentId,changed:true,reused,downloaded};
 }catch(error){
  if(stageName&&!selectedNew)try{await caches.delete(stageName);}catch{}
  emit('error',{reason:reason(error),reused,downloaded});
  throw error;
 }
}

/** Never report ready on metadata alone: verify selected payload and images. */
export async function readVerifiedD6OfflineContent({caches,scope}={}){
 scope=originScope(scope);
 check(caches&&typeof caches.open==='function','Cache unavailable');
 const entry=await selected({caches,scope});
 return entry?{contentId:entry.snapshot.contentId,
  snapshot:entry.snapshot,cacheName:entry.name}:null;
}
