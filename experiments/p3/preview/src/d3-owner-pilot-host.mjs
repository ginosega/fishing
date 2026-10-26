/**
 * FISH118 D3: PRIVATE owner-only pilot HTML / bundled JS host.
 * DEFAULT-OFF, SOURCE ONLY. Never mounted on current parked D2 Worker.
 * Standalone test route, NOT a proxy rewrite/injection into canonical
 * public /fishing/ release assets. Only a fresh AUTH-P0 owner cookie may
 * read this page or script. Never expose a server-side GitHub token.
 *
 * An approved future binding must supply actual bundled JS bytes and pin
 * their SHA-256. No anonymous/static fallback or arbitrary asset fetch.
 */
import {D3_OWNER_PILOT_HTML,D3_OWNER_PILOT_PATH,
 D3_OWNER_PILOT_SCRIPT} from './d3-owner-pilot-page.mjs';

const OWNER=265665562,MAX_BUNDLE=3*1024*1024;
const SHA=/^[0-9a-f]{64}$/;
const textEncoder=new TextEncoder();
const headers={
 'Cache-Control':'private, no-store, max-age=0',
 'Vary':'Cookie',
 'X-Content-Type-Options':'nosniff',
 'X-Frame-Options':'DENY',
 'Referrer-Policy':'no-referrer',
 'X-Robots-Tag':'noindex, nofollow, noarchive',
 'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
 'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
};
const response=(bytes,mime)=>new Response(bytes,{status:200,headers:{
 ...headers,'Content-Type':mime,
}});
const denied=(status=404)=>new Response('Not found',{status,headers:{
 'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
}});
const hex=bytes=>[...new Uint8Array(bytes)]
 .map(v=>v.toString(16).padStart(2,'0')).join('');
export function createD3OwnerPilotHost({
 origin,ownerSession,readBundle,
 expectedSha256=null,enabled=()=>false,
}={}){
 if(typeof origin!=='string'||!origin.startsWith('https://')||
  new URL(origin).origin!==origin||
  typeof ownerSession?.authorizeStatus!=='function'||
  typeof readBundle!=='function'||typeof enabled!=='function')
  throw Error('D3 pilot route requires trusted owner dependencies');
 async function serve(req){
  // Hide the pilot entirely until future separately authorized activation.
  if(enabled()!==true)return denied();
  if(!(req instanceof Request)||req.method!=='GET')return denied();
  let url;
  try{url=new URL(req.url);}catch{return denied();}
  if(url.origin!==origin||url.search||url.hash||
   req.headers.has('Authorization')||
   ![D3_OWNER_PILOT_PATH,D3_OWNER_PILOT_SCRIPT].includes(url.pathname))
   return denied();
  let owner;
  try{owner=await ownerSession.authorizeStatus(req);}
  catch{return denied(401);}
  if(owner?.authorized!==true||owner.ownerGitHubId!==OWNER)
   return denied(401);
  // An otherwise-authorized page MUST NOT be served without an actual,
  // independently pinned pilot bundle. Do not silently load public V2 JS.
  if(!SHA.test(expectedSha256??''))return denied(503);
  let bytes;
  try{bytes=await readBundle();}
  catch{return denied(503);}
  if(!(bytes instanceof Uint8Array)||bytes.length===0||
   bytes.length>MAX_BUNDLE)return denied(503);
  const digest=hex(await crypto.subtle.digest('SHA-256',bytes));
  if(digest!==expectedSha256)return denied(503);
  return url.pathname===D3_OWNER_PILOT_SCRIPT?
   response(bytes,'text/javascript; charset=utf-8'):
   response(textEncoder.encode(D3_OWNER_PILOT_HTML),
    'text/html; charset=utf-8');
 }
 return Object.freeze({serve});
}
