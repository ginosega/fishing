/**
 * M02 — exact-origin private R2 live image resolver.
 *
 * Reads ONLY paths published by D1 and independently handed to the caller
 * after a verified catalog/snapshot read. Default OFF. Existing immutable
 * content remains with the release until a separately approved migration.
 * An unknown path is never assembled into a live R2 URL.
 */
import {encodedPath,safePath} from './shared.mjs';
export function createD6ContentImageResolver({
 root,enabled=()=>false,readingMode=()=> 'Checking',
 publishedPaths=new Set(),
}={}){
 let app;
 try{app=new URL(root);}catch{throw Error('MEDIA_RESOLVER_ORIGIN_INVALID');}
 const local=app.protocol==='http:'&&
  ['localhost','127.0.0.1','[::1]'].includes(app.hostname);
 if((app.protocol!=='https:'&&!local)||app.pathname!=='/fishing/'||
   app.username||app.password||app.search||app.hash||
   typeof enabled!=='function'||typeof readingMode!=='function'||
   !(publishedPaths instanceof Set))
  throw Error('MEDIA_RESOLVER_ORIGIN_INVALID');
 // A verified D1 manifest must be replaced as a unit after each fresh read.
 // Do not allow later mutations of the caller's Set to authorize new paths.
 const verifiedPaths=new Set(publishedPaths);
 function isReady(){return enabled()===true&&readingMode()==='Automatic';}
 function resolve(logicalPath){
  let path;
  try{path=safePath(logicalPath);}catch{return null;}
  if(!isReady()||!verifiedPaths.has(path)||
     !/^(?:Gear|KB|Catches)\//.test(path)||
     !/\.(?:jpe?g|png|webp|gif)$/i.test(path))return null;
  return app.origin+'/api/v3/media/live/'+encodedPath(path);
 }
 return Object.freeze({resolve,isReady});
}
/** UI composition contract: the V2/legacy release path remains unchanged.
 * Once authoritative online media reads are enabled, never silently replace
 * missing D1-published media with a stale historic release picture. */
export function d6ResolveImageForDisplay(path,{
 verifiedLive=null,frozenAsset,
}={}){
 let canonical;
 try{canonical=safePath(path);}catch{return null;}
 if(verifiedLive?.isReady?.()===true){
  // A ready authoritative R2 reader MUST NOT silently use an older release.
  return verifiedLive.resolve(canonical)??null;
 }
 return typeof frozenAsset==='function'?frozenAsset(canonical):null;
}
