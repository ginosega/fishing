/* Verified online-current releases plus explicit complete offline-library generations. */
import {encodedPath} from './shared.mjs';
import {validatePointer,validateManifest,verifyBytes,decodeVerifiedJson,isReleaseId,isDigest} from './release.mjs';

const scope=self.registration.scope;
const base=new URL(scope).pathname;
const prefix='fishing-v2:'+base+':';
const metadataName=prefix+'metadata';
const marker=new URL('__fishing_complete__',scope).href;
const selectionKey=new URL('__fishing_selected__',scope).href;
const absolute=relative=>new URL(encodedPath(relative),scope).href;
const clientContexts=new Map();
let operation=null;

const mime=p=>p.endsWith('.json')?'application/json':p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.html')?'text/html; charset=utf-8':p.endsWith('.svg')?'image/svg+xml':p.endsWith('.png')?'image/png':p.endsWith('.webp')?'image/webp':p.endsWith('.gif')?'image/gif':p.endsWith('.jpg')||p.endsWith('.jpeg')?'image/jpeg':'application/octet-stream';
const responseFor=(bytes,path,status=200)=>new Response(bytes,{status,headers:{'Content-Type':mime(path),'Cache-Control':'no-store'}});
async function broadcast(type,status){for(const client of await self.clients.matchAll({includeUncontrolled:true,type:'window'}))client.postMessage({type,status});}
async function network(path){const response=await fetch(absolute(path),{cache:'no-store',redirect:'error'});if(!response.ok||response.type==='opaque')throw new Error(`Asset unavailable: ${path} (HTTP ${response.status})`);return response.arrayBuffer();}
async function loadOnlineContext(){
 const pointerBytes=await network('release.json');
 const pointer=validatePointer(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(pointerBytes)));
 const manifestBytes=await network(pointer.manifest);
 const manifest=await decodeVerifiedJson(manifestBytes,pointer.manifestSha256);
 const entries=validateManifest(manifest,pointer,base);
 return {source:'online',pointerBytes,manifestBytes,pointer,manifest,entries};
}
async function completed(){
 const result=[];
 for(const name of await caches.keys()){
  if(name===metadataName||!name.startsWith(prefix))continue;
  const cache=await caches.open(name),response=await cache.match(marker);
  if(!response)continue;
  try{
   const meta=await response.json();if(!meta.complete||!isReleaseId(meta.releaseId)||!isDigest(meta.manifestSha256)||!isDigest(meta.pointerSha256))continue;
   const pointerResponse=await cache.match(absolute('release.json'));if(!pointerResponse)continue;
   const pointerBytes=await pointerResponse.arrayBuffer();
   const pointer=validatePointer(await decodeVerifiedJson(pointerBytes,meta.pointerSha256));
   if(pointer.id!==meta.releaseId||pointer.manifestSha256!==meta.manifestSha256)continue;
   const manifestResponse=await cache.match(absolute(pointer.manifest));if(!manifestResponse)continue;
   const manifestBytes=await manifestResponse.arrayBuffer();
   const manifest=await decodeVerifiedJson(manifestBytes,meta.manifestSha256);
   const entries=validateManifest(manifest,pointer,base);
   if(meta.files!==entries.size||meta.bytes!==manifest.totalBytes)continue;
   result.push({source:'offline',name,cache,meta,pointerBytes,manifestBytes,pointer,manifest,entries});
  }catch{}
 }
 return result;
}
async function verifyCache(entry){
 for(const file of entry.entries.values()){
  const response=await entry.cache.match(absolute(file.path));if(!response)throw new Error('Missing cached asset: '+file.path);
  await verifyBytes(await response.arrayBuffer(),file);
 }
 return true;
}
async function selectedRecord(){
 try{const response=await (await caches.open(metadataName)).match(selectionKey);return response?await response.json():null;}catch{return null;}
}
async function writeSelection(entry){
 const cache=await caches.open(metadataName);
 if(!entry){await cache.delete(selectionKey);return;}
 await cache.put(selectionKey,new Response(JSON.stringify({cacheName:entry.name,releaseId:entry.meta.releaseId}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}));
}
async function resolveSelected({verify=false}={}){
 const entries=await completed();if(!entries.length)return {entry:null,error:null};
 const saved=await selectedRecord();const preferred=entries.find(x=>x.name===saved?.cacheName&&x.meta.releaseId===saved?.releaseId);
 const ordered=[...(preferred?[preferred]:[]),...entries.slice().reverse().filter(x=>x!==preferred)];let lastError=null;
 for(const entry of ordered){
  try{if(verify)await verifyCache(entry);if(entry!==preferred)await writeSelection(entry);return {entry,error:null};}
  catch(error){lastError=error;}
 }
 return {entry:null,error:lastError};
}
async function state(failure){
 const {entry,error}=await resolveSelected({verify:true});
 if(!entry)return {state:'Incomplete',releaseId:null,files:0,bytes:0,failed:failure?.failed||[],message:failure?.message||(error?'The prepared offline library needs to be updated. '+error.message:'')};
 return {state:'Ready',releaseId:entry.meta.releaseId,files:entry.meta.files,bytes:entry.meta.bytes,failed:failure?.failed||[],message:failure?.message||''};
}
async function prepareRelease(){
 if(operation)return operation;
 operation=(async()=>{
  let failed='release.json',stageName=null;
  try{
   const context=await loadOnlineContext(),{pointer,pointerBytes,manifest,manifestBytes,entries}=context;
   const existing=(await completed()).filter(x=>x.meta.releaseId===pointer.id).reverse();
   for(const entry of existing){try{await verifyCache(entry);await writeSelection(entry);await broadcast('FISHING_V2_STATUS',await state());return;}catch{}}
   stageName=prefix+'offline:'+crypto.randomUUID()+':'+pointer.id;const staging=await caches.open(stageName);
   let completedFiles=0,totalBytes=0;
   await broadcast('FISHING_V2_PROGRESS',{state:'Downloading',releaseId:pointer.id,files:entries.size,completed:0,bytes:0});
   for(const file of entries.values()){
    failed=file.path;const bytes=await network(file.path);await verifyBytes(bytes,file);
    await staging.put(absolute(file.path),responseFor(bytes,file.path));completedFiles++;totalBytes+=file.bytes;
    if(completedFiles%8===0||completedFiles===entries.size)await broadcast('FISHING_V2_PROGRESS',{state:'Downloading',releaseId:pointer.id,files:entries.size,completed:completedFiles,bytes:totalBytes});
   }
   await staging.put(absolute(pointer.manifest),responseFor(manifestBytes,pointer.manifest));
   await staging.put(absolute('release.json'),responseFor(pointerBytes,'release.json'));
   const pointerSha256=await crypto.subtle.digest('SHA-256',pointerBytes).then(b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''));
   const meta={releaseId:pointer.id,manifestSha256:pointer.manifestSha256,pointerSha256,files:entries.size,bytes:manifest.totalBytes,complete:true};
   await staging.put(marker,new Response(JSON.stringify(meta),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}));
   const entry={source:'offline',name:stageName,cache:staging,meta,pointerBytes,manifestBytes,pointer,manifest,entries};
   await writeSelection(entry);stageName=null;
   await broadcast('FISHING_V2_STATUS',await state());
  }catch(error){
   if(stageName)await caches.delete(stageName);
   const status=await state({message:'Update incomplete; any previous complete offline library is retained. '+error.message,failed:[failed]});
   await broadcast('FISHING_V2_STATUS',status);throw error;
  }
 })();
 try{return await operation;}finally{operation=null;}
}
async function cachedFile(entry,path){
 const file=entry.entries.get(path);if(!file)return null;
 const response=await entry.cache.match(absolute(path));if(!response)return null;
 return responseFor(await verifyBytes(await response.arrayBuffer(),file),file.path);
}
async function networkFile(context,path){const file=context.entries.get(path);if(!file)throw new Error('Resource is not part of the selected release: '+path);const bytes=await network(path);await verifyBytes(bytes,file);return responseFor(bytes,file.path);}
function remember(event,context){for(const key of [event.clientId,event.resultingClientId])if(key)clientContexts.set(key,context);return context;}
async function fallbackContext(){const {entry}=await resolveSelected();return entry;}
function offlineUnavailable(){return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fishing Companion · Offline</title><style>body{font:16px system-ui,sans-serif;background:#101b18;color:#eef7f4;margin:0;padding:2rem}main{max-width:42rem;margin:auto}h1{font-size:1.5rem}p{line-height:1.5}</style><main><h1>Fishing Companion is not prepared for offline use</h1><p>Reconnect to the internet, open Fishing Companion, then choose <strong>Connection Status → Update offline library</strong> before going offline.</p></main>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});}
async function contextFor(event){
 const key=event.clientId||event.resultingClientId;if(key&&clientContexts.has(key))return clientContexts.get(key);
 try{return remember(event,await loadOnlineContext());}catch{const fallback=await fallbackContext();return fallback?remember(event,fallback):null;}
}
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{await self.clients.claim();await broadcast('FISHING_V2_STATUS',await state());})()));
self.addEventListener('message',event=>{
 const message=event.data||{};
 if(message.type==='HELLO')event.ports[0]?.postMessage({protocol:'fishing-companion-v2',base,capabilities:{onlineDefault:true,explicitOffline:true}});
 if(message.type==='STATUS')event.waitUntil(state().then(status=>event.ports[0]?.postMessage({type:'FISHING_V2_STATUS',status})));
 if(message.type==='PREPARE'||message.type==='REPAIR')event.waitUntil(prepareRelease().then(()=>state(),error=>state({message:error.message,failed:[]})).then(status=>event.ports[0]?.postMessage({type:'FISHING_V2_STATUS',status})));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url),scopeUrl=new URL(scope);
 if(request.method!=='GET'||url.origin!==scopeUrl.origin||!url.pathname.startsWith(scopeUrl.pathname))return;
 event.respondWith((async()=>{
  let relative;try{relative=decodeURIComponent(url.pathname.slice(scopeUrl.pathname.length));}catch{return new Response('Invalid resource path',{status:400});}
  if(relative==='__fishing_complete__'||relative==='__fishing_selected__')return new Response('Not found',{status:404});
  const target=request.mode==='navigate'&&(!relative||relative==='index.html')?'index.html':relative;
  if(request.mode==='navigate'){
   try{const context=remember(event,await loadOnlineContext());return await networkFile(context,'index.html');}
   catch{const fallback=await fallbackContext();if(!fallback)return offlineUnavailable();remember(event,fallback);try{return await cachedFile(fallback,'index.html')||offlineUnavailable();}catch{return offlineUnavailable();}}
  }
  const context=await contextFor(event);
  if(!context)return new Response('Fishing Companion is not prepared for offline use',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  if(target==='release.json')return responseFor(context.pointerBytes,'release.json');
  if(target===context.pointer.manifest)return responseFor(context.manifestBytes,context.pointer.manifest);
  const pinned=/^releases\/([a-f0-9]{32})\//.exec(target);
  if(pinned){
   if(context.pointer.id!==pinned[1]){
    const fallback=await fallbackContext();if(fallback?.pointer.id===pinned[1])try{return await cachedFile(fallback,target)||new Response('Release asset unavailable',{status:503});}catch{return new Response('Release asset unavailable',{status:503});}
    return new Response('Release unavailable for this session',{status:503});
   }
   if(context.source==='offline')try{return await cachedFile(context,target)||new Response('Verified offline asset unavailable',{status:503});}catch{return new Response('Verified offline asset unavailable',{status:503});}
   try{return await networkFile(context,target);}catch{
    const fallback=await fallbackContext();if(fallback?.pointer.id===context.pointer.id)try{return await cachedFile(fallback,target)||new Response('Verified release asset unavailable',{status:503});}catch{}
    return new Response('Verified release asset unavailable',{status:503});
   }
  }
  if(context.entries.has(target)){
   if(context.source==='offline')try{return await cachedFile(context,target)||new Response('Verified offline asset unavailable',{status:503});}catch{return new Response('Verified offline asset unavailable',{status:503});}
   try{return await networkFile(context,target);}catch{
    const fallback=await fallbackContext();if(fallback?.pointer.id===context.pointer.id)try{return await cachedFile(fallback,target)||new Response('Verified release asset unavailable',{status:503});}catch{}
    return new Response('Verified release asset unavailable',{status:503});
   }
  }
  return new Response('Resource unavailable in the selected verified release',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 })().catch(async error=>{await broadcast('FISHING_V2_STATUS',await state({message:'A release asset failed integrity verification. Update the offline library before relying on offline access.',failed:[event.request.url]}));return new Response('Verified release asset unavailable: '+error.message,{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}));
});
