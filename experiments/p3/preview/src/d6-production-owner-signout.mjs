/**
 * D6 production owner sign-out — SOURCE ONLY, default OFF.
 *
 * Revokes precisely the caller's host-only session cookie in the AUTH-P0
 * D1 sessions table; never revokes anyone else's sessions, mints a token,
 * modifies GitHub, authorizes writes or installs a production route.
 *
 * This is required before the accepted D5 Connection Status "Sign out"
 * control can be wired into the D6 production owner UI.
 */
import {isD6GatewayOrigin}
 from '../../../../pwa/server/d6-pages-path-gateway.mjs';
export const D6_OWNER_SIGNOUT_ORIGIN='https://fishing.ginosega.workers.dev';
export const D6_OWNER_SIGNOUT_PATH='/session/signout';
const OWNER=265665562;
const COOKIE='__Host-fish_p0_session';
const VALUE=/^[A-Za-z0-9_-]{43}$/;
const enc=new TextEncoder();
const headers={
 'Cache-Control':'private, no-store, max-age=0',
 'Content-Type':'application/json; charset=utf-8',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'X-Frame-Options':'DENY',
 'Cross-Origin-Resource-Policy':'same-origin',
};
const response=(status,error)=>new Response(JSON.stringify({ok:false,error}),
 {status,headers});
function cookie(request){
 const input=request.headers.get('Cookie');
 if(typeof input!=='string'||input.length>4096)return null;
 const matches=[];
 for(const field of input.split(';')){
  const pos=field.indexOf('=');
  if(pos>0&&field.slice(0,pos).trim()===COOKIE)
   matches.push(field.slice(pos+1).trim());
 }
 return matches.length===1&&VALUE.test(matches[0])?matches[0]:null;
}
const clear=COOKIE+'=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax';
function b64(buffer){
 let s='';for(const v of new Uint8Array(buffer))s+=String.fromCharCode(v);
 return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');
}
function permitted(request,origin){
 if(!(request instanceof Request)||request.method!=='POST'||
    request.headers.has('Authorization')||request.body!==null)return false;
 let url;try{url=new URL(request.url);}catch{return false;}
 return url.origin===origin&&
   url.pathname===D6_OWNER_SIGNOUT_PATH&&!url.search&&!url.hash&&
   !url.username&&!url.password&&
   request.headers.get('Origin')===origin&&
   request.headers.get('Sec-Fetch-Site')==='same-origin'&&
   request.headers.get('X-Fish-P0-Intent')==='signout'&&
   !['navigate','websocket'].includes(
    request.headers.get('Sec-Fetch-Mode')??'');
}
export function createD6ProductionOwnerSignout({
 AUTH_DB,cryptoApi=globalThis.crypto,enabled=()=>false,
 origin=D6_OWNER_SIGNOUT_ORIGIN,
}={}){
 if(typeof enabled!=='function'||!isD6GatewayOrigin(origin))
  throw Error('Invalid D6 sign-out gate');
 async function signOut(request){
  if(enabled()!==true)return response(503,'TEMPORARILY_UNAVAILABLE');
  if(!permitted(request,origin))return response(403,'REQUEST_DENIED');
  const secret=cookie(request);
  if(!secret)return response(401,'SESSION_REQUIRED');
  if(typeof AUTH_DB?.prepare!=='function'||
    typeof cryptoApi?.subtle?.digest!=='function')
   return response(503,'TEMPORARILY_UNAVAILABLE');
  try{
   const digest=b64(await cryptoApi.subtle.digest('SHA-256',
    enc.encode(secret)));
   // Recheck at the write boundary. No broad ID-only revoke operation.
   if(enabled()!==true)return response(503,'TEMPORARILY_UNAVAILABLE');
   const result=await AUTH_DB.prepare(
    'DELETE FROM sessions WHERE token_hash = ? AND github_id = ?')
    .bind(digest,OWNER).run();
   if(result?.success!==true)
    return response(503,'TEMPORARILY_UNAVAILABLE');
   const done=new Response(JSON.stringify({signedOut:true}),{
    status:200,headers,
   });
   done.headers.append('Set-Cookie',clear);
   return done;
  }catch{return response(503,'TEMPORARILY_UNAVAILABLE');}
 }
 return Object.freeze({signOut});
}
