/**
 * O03 service-worker read: serve a referenced image from the selected
 * complete V3 content generation. No network, old release fallback, writes
 * or provider routes. Each response is byte-verified before display.
 */
import {canonical,sha256} from './shared.mjs';

const HASH=/^[a-f0-9]{64}$/;
const MIME=new Set(['image/jpeg','image/png','image/webp','image/gif']);
const unavailable=()=>new Response('Verified offline image unavailable',{
 status:503,headers:{'Content-Type':'text/plain; charset=utf-8',
  'Cache-Control':'no-store'},
});
export async function readD6OfflineImage({caches,scope,digest}={}){
 if(!HASH.test(digest??'')||!caches?.open||!scope)return unavailable();
 try{
  const base=new URL(scope),prefix='fishing-v3-content:'+base.pathname+':';
  const metadata=await caches.open(prefix+'metadata');
  const selectionResponse=await metadata.match(
   new URL('__fishing_v3_content_selected__',base).href);
  if(!selectionResponse)return unavailable();
  const selection=await selectionResponse.json();
  if(!HASH.test(selection?.contentId??'')||
     typeof selection?.cacheName!=='string'||
     !selection.cacheName.startsWith(prefix+'generation:'))
   return unavailable();
  const cache=await caches.open(selection.cacheName);
  const [complete,manifest]=await Promise.all([
   cache.match(new URL('__fishing_v3_content_complete__',base).href),
   cache.match(new URL('__fishing_v3_content_manifest__',base).href),
  ]);
  if(!complete||!manifest)return unavailable();
  const [marker,snapshot]=await Promise.all([
   complete.json(),manifest.json(),
  ]);
  if(marker?.complete!==true||
     marker.contentId!==selection.contentId||
     snapshot?.contentId!==selection.contentId||
     snapshot?.mediaVerification!=='registry-only')
   return unavailable();
  const {contentId,mediaVerification,...payload}=snapshot;
  if(await sha256(canonical(payload))!==contentId)return unavailable();
  const images=Array.isArray(snapshot.images)?snapshot.images:[];
  const image=images.find(x=>x.sha256===digest);
  if(!image||!MIME.has(image.mime)||!Number.isSafeInteger(image.bytes)||
     image.bytes<1||image.bytes>10*1024*1024)return unavailable();
  const saved=await cache.match(
   new URL('__fishing_v3_content_image__/'+digest,base).href);
  if(!saved)return unavailable();
  const bytes=await saved.arrayBuffer();
  if(bytes.byteLength!==image.bytes||await sha256(bytes)!==digest)
   return unavailable();
  return new Response(bytes,{status:200,headers:{
   'Content-Type':image.mime,'Content-Length':String(image.bytes),
   'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',
  }});
 }catch{return unavailable();}
}
