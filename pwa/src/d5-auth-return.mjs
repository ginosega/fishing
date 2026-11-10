/**
 * Exact-scope, single-use, tab-local continuation for D5 owner OAuth.
 * The OAuth server still redirects only to an allowlisted canonical root;
 * URL fragments are never sent through OAuth or trusted as server redirects.
 */
import {parseRoute} from './shared.mjs';

export const D5_AUTH_RETURN_KEY='fishing-d5-owner-auth-return-v1';
export const D5_OWNER_SCOPE='/fishing/__v3_owner_candidate__/';
const TTL_MS=10*60*1000;
const READ_ONLY=new Set([
 'home','gear-root','gear-list','gear-detail',
 'kb-root','kb-list','kb-detail','catch-list','catch-detail',
]);

export function isD5ReadOnlyReturnHash(hash){
 if(typeof hash!=='string'||hash.length<2||hash.length>400||
  !/^#\/[a-z0-9\-/]+(?:\?section=[a-z0-9-]{1,80})?$/.test(hash))
  return false;
 try{
  const parsed=parseRoute(hash);
  if(!READ_ONLY.has(parsed.page))return false;
  const id=parsed.id;
  return id===undefined||
   (typeof id==='string'&&/^[a-z0-9][a-z0-9-]{0,159}$/.test(id));
 }catch{return false;}
}

export function rememberD5OwnerAuthReturn({
 pathname,hash,storage,now=Date.now(),
}={}){
 if(pathname!==D5_OWNER_SCOPE||!isD5ReadOnlyReturnHash(hash)||
  !storage||!Number.isFinite(now))return false;
 try{
  storage.setItem(D5_AUTH_RETURN_KEY,JSON.stringify({
   version:1,pathname,hash,createdAt:now,
  }));
  return true;
 }catch{return false;} // Storage can be disabled; OAuth is still usable.
}

export function restoreD5OwnerAuthReturn({
 pathname,hash,storage,history,now=Date.now(),
}={}){
 if(pathname!==D5_OWNER_SCOPE||!storage)return null;
 let marker;
 try{
  const raw=storage.getItem(D5_AUTH_RETURN_KEY);
  if(!raw)return null;
  // Single-use even on malformed state; never replay after failed startup.
  storage.removeItem(D5_AUTH_RETURN_KEY);
  marker=JSON.parse(raw);
 }catch{return null;}
 if(hash&&hash!=='#/'||
  !marker||marker.version!==1||
  marker.pathname!==D5_OWNER_SCOPE||
  !Number.isSafeInteger(marker.createdAt)||
  !Number.isFinite(now)||now<marker.createdAt||
  now-marker.createdAt>TTL_MS||
  !isD5ReadOnlyReturnHash(marker.hash)||
  typeof history?.replaceState!=='function')return null;
 try{
  history.replaceState(history.state??null,'',marker.hash);
  return marker.hash;
 }catch{return null;}
}
