/* Complete, verified, read-only releases. The service-worker scope is isolated. */
import {encodedPath} from './shared.mjs';
import {validatePointer,validateManifest,verifyBytes,decodeVerifiedJson,isReleaseId,isDigest,releasePath,manifestPath} from './release.mjs';
const RELEASE_ID=__RELEASE_ID__;
const scope=self.registration.scope;
const base=new URL(scope).pathname;
const prefix='fishing-v2:'+base+':';

const marker=new URL('__fishing_complete__',scope).href;
const absolute=relative=>new URL(encodedPath(relative),scope).href;
let operation=null;
const mime=p=>p.endsWith('.json')?'application/json':p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.html')?'text/html; charset=utf-8':p.endsWith('.svg')?'image/svg+xml':p.endsWith('.png')?'image/png':p.endsWith('.webp')?'image/webp':p.endsWith('.gif')?'image/gif':p.endsWith('.jpg')||p.endsWith('.jpeg')?'image/jpeg':'application/octet-stream';
const responseFor=(bytes,path)=>new Response(bytes,{status:200,headers:{'Content-Type':mime(path),'Cache-Control':'no-store'}});
async function broadcast(type,status){for(const client of await self.clients.matchAll({includeUncontrolled:true,type:'window'}))client.postMessage({type,status});}
async function network(path){const response=await fetch(absolute(path),{cache:'no-store',redirect:'error'});if(!response.ok||response.type==='opaque')throw new Error(`Asset unavailable: ${path} (HTTP ${response.status})`);return response.arrayBuffer();}
async function networkPointer(){return validatePointer(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await network('release.json'))));}
async function manifestFor(pointer){const bytes=await network(pointer.manifest);const manifest=await decodeVerifiedJson(bytes,pointer.manifestSha256);const entries=validateManifest(manifest,pointer,base);return {manifest,entries,bytes};}
async function completed(){
 const result=[];
 for(const name of await caches.keys()){
  if(!name.startsWith(prefix)||name.endsWith(':staging'))continue;
  const cache=await caches.open(name),response=await cache.match(marker);
  if(!response)continue;
  try{
   const meta=await response.json();if(!meta.complete||!isReleaseId(meta.releaseId)||!isDigest(meta.manifestSha256)||!isDigest(meta.pointerSha256))continue;
   const pointerResponse=await cache.match(absolute('release.json'));
   const pointerBytes=await pointerResponse.arrayBuffer();
   const pointer=validatePointer(await decodeVerifiedJson(pointerBytes,meta.pointerSha256));
   if(pointer.id!==meta.releaseId||pointer.manifestSha256!==meta.manifestSha256)continue;
   const manifestResponse=await cache.match(absolute(pointer.manifest));
   const manifest=await decodeVerifiedJson(await manifestResponse.arrayBuffer(),meta.manifestSha256);
   const entries=validateManifest(manifest,pointer,base);
   if(meta.files!==entries.size||meta.bytes!==manifest.totalBytes)continue;
   result.push({name,cache,meta,pointer,manifest,entries});
  }catch{}
 }
 return result;
}
async function state(failure){
 const entries=await completed(),current=entries.findLast(x=>x.meta.releaseId===RELEASE_ID)||entries.at(-1);
 return current?{state:'Ready',releaseId:current.meta.releaseId,files:current.meta.files,bytes:current.meta.bytes,failed:failure?.failed||[],message:failure?.message||''}:{state:'Incomplete',releaseId:null,files:0,bytes:0,failed:failure?.failed||[],message:failure?.message||''};
}
async function verifyCache(entry){
 for(const file of entry.entries.values()){
  const response=await entry.cache.match(absolute(file.path));if(!response)throw new Error('Missing cached asset: '+file.path);
  await verifyBytes(await response.arrayBuffer(),file);
 }
 return true;
}
async function ensureRelease(){
 if(operation)return operation;
 operation=(async()=>{
  let failed='release.json',stageName=null;
  try{
   const existing=(await completed()).findLast(x=>x.meta.releaseId===RELEASE_ID);
   if(existing){try{await verifyCache(existing);await broadcast('FISHING_V2_STATUS',await state());return;}catch{}}
   const pointerBytes=await network('release.json');const pointer=validatePointer(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(pointerBytes)));
   if(pointer.id!==RELEASE_ID)throw new Error('A newer release is available. Update the application before repairing this release.');
   failed=pointer.manifest;const {manifest,entries,bytes:manifestBytes}=await manifestFor(pointer);
   // Each attempt has its own generation. The verified marker commits it in one write.
   // Never copy over or delete a prior complete generation, even during repair.
   stageName=prefix+crypto.randomUUID()+':'+RELEASE_ID;const staging=await caches.open(stageName);
   let completedFiles=0,totalBytes=0;
   await broadcast('FISHING_V2_PROGRESS',{state:'Downloading',releaseId:RELEASE_ID,files:entries.size,completed:0,bytes:0});
   for(const file of entries.values()){
    failed=file.path;const bytes=await network(file.path);await verifyBytes(bytes,file);
    await staging.put(absolute(file.path),responseFor(bytes,file.path));completedFiles++;totalBytes+=file.bytes;
    if(completedFiles%8===0||completedFiles===entries.size)await broadcast('FISHING_V2_PROGRESS',{state:'Downloading',releaseId:RELEASE_ID,files:entries.size,completed:completedFiles,bytes:totalBytes});
   }
   await staging.put(absolute(pointer.manifest),responseFor(manifestBytes,pointer.manifest));
   await staging.put(absolute('release.json'),responseFor(pointerBytes,'release.json'));
   const pointerSha256=await crypto.subtle.digest('SHA-256',pointerBytes).then(b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''));
   const meta={releaseId:RELEASE_ID,manifestSha256:pointer.manifestSha256,pointerSha256,files:entries.size,bytes:totalBytes,complete:true};
   await staging.put(marker,new Response(JSON.stringify(meta),{headers:{'Content-Type':'application/json'}}));
   stageName=null;await broadcast('FISHING_V2_STATUS',await state());
  }catch(error){if(stageName)await caches.delete(stageName);await broadcast('FISHING_V2_STATUS',await state({message:'Update incomplete; any previous complete release is retained. '+error.message,failed:[failed]}));throw error;}
 })();
 try{return await operation;}finally{operation=null;}
}
self.addEventListener('install',event=>event.waitUntil(ensureRelease().then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{await self.clients.claim();await broadcast('FISHING_V2_STATUS',await state());})()));
self.addEventListener('message',event=>{
 const message=event.data||{};
 if(message.type==='STATUS')event.waitUntil(state().then(status=>event.ports[0]?.postMessage({type:'FISHING_V2_STATUS',status})));
 if(message.type==='REPAIR')event.waitUntil(ensureRelease().then(()=>state(),error=>state({message:error.message,failed:[]})).then(status=>event.ports[0]?.postMessage({type:'FISHING_V2_STATUS',status})));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url),scopeUrl=new URL(scope);
 if(request.method!=='GET'||url.origin!==scopeUrl.origin||!url.pathname.startsWith(scopeUrl.pathname))return;
 event.respondWith((async()=>{
  const entries=await completed(),current=entries.findLast(x=>x.meta.releaseId===RELEASE_ID)||entries.at(-1);
  let relative;try{relative=decodeURIComponent(url.pathname.slice(scopeUrl.pathname.length));}catch{return new Response('Invalid resource path',{status:400});}
  if(relative==='__fishing_complete__')return new Response('Not found',{status:404});
  const target=request.mode==='navigate'&&(!relative||relative==='index.html')?'index.html':relative;
  const pinned=/^releases\/([a-f0-9]{32})\//.exec(relative);
  const selected=pinned?entries.findLast(x=>x.meta.releaseId===pinned[1]):current;
  if(selected){
   let requested=target;
   const canonical=[...selected.entries.keys()].find(p=>absolute(p)===request.url);
   if(canonical)requested=canonical;
   const file=selected.entries.get(requested);
   if(file){
    const cached=await selected.cache.match(absolute(requested));
    if(cached){try{return responseFor(await verifyBytes(await cached.arrayBuffer(),file),file.path);}catch{}}
    try{
     const bytes=await network(file.path);await verifyBytes(bytes,file);
     await selected.cache.put(absolute(file.path),responseFor(bytes,file.path));
     await broadcast('FISHING_V2_STATUS',await state({message:'A cached asset was repaired from its verified original.'}));
     return responseFor(bytes,file.path);
    }catch{await broadcast('FISHING_V2_STATUS',await state({message:'A cached asset failed integrity verification. Retry the complete-library update.',failed:[relative]}));return new Response('Verified release asset unavailable',{status:503});}
   }
   if(requested==='release.json')return selected.cache.match(absolute('release.json'));
   if(requested===selected.pointer.manifest)return selected.cache.match(absolute(requested));
  }
  if(pinned)return new Response('Release unavailable. Retry the complete-library update.',{status:503});
  if(request.mode==='navigate'&&current){const response=await current.cache.match(absolute('index.html'));if(response){const file=current.entries.get('index.html');if(file)try{return responseFor(await verifyBytes(await response.arrayBuffer(),file),'index.html');}catch{}}}
  return new Response('Resource unavailable in the verified release',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 })());
});
