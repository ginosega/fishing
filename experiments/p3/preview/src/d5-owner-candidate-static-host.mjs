/**
 * FISH118 D5: default-OFF, exact-scope, read-only static byte gateway for
 * the separately staged V3 owner candidate. SOURCE ONLY, never a deployment.
 * The candidate may use existing same-origin /auth and /api/v3 paths, but
 * those are NEVER forwarded to the static Pages host or authorized here.
 */
export const D5_OWNER_STATIC_PREFIX='/fishing/__v3_owner_candidate__/';
const GUARD={
 'Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'X-Frame-Options':'DENY',
 'X-Robots-Tag':'noindex, nofollow, noarchive',
 'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
 'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
};
const forbidden=url=>/%(?:2f|5c|00)/i.test(url.pathname)||
 url.pathname.includes('\\')||url.pathname.split('/').some(p=>p==='..'||p==='.');
const deny=(status=404)=>new Response('Not found',{status,headers:GUARD});
const validOrigin=(origin,internal=false)=>{
 try{
  const parsed=new URL(origin);
  return parsed.protocol==='https:'&&parsed.origin===origin&&
   parsed.pathname==='/'&&!parsed.search&&!parsed.hash&&
   !parsed.username&&!parsed.password&&
   (internal||/^[a-f0-9]{8,32}\.[a-z0-9-]+\.pages\.dev$/.test(parsed.hostname));
 }catch{return false;}
};
export function createD5OwnerCandidateStaticHost({
 origin,pagesOrigin,enabled=()=>false,requestPages=fetch,
}={}){
 if(!validOrigin(origin,true)||typeof enabled!=='function'||
  typeof requestPages!=='function')
  throw Error('D5 owner static host configuration invalid');
 const pagesReady=validOrigin(pagesOrigin)&&pagesOrigin!==origin;
 async function serve(request){
  if(!(request instanceof Request))return deny();
  let url;
  try{url=new URL(request.url);}catch{return deny();}
  if(url.origin!==origin||url.protocol!=='https:'||
   !url.pathname.startsWith(D5_OWNER_STATIC_PREFIX)||
   url.username||url.password||url.search||url.hash)return deny();
  if(enabled()!==true)return deny();
  if(!pagesReady)return deny(503);
  if(request.method!=='GET'&&request.method!=='HEAD')
   return new Response('Read-only',{status:405,headers:{...GUARD,Allow:'GET, HEAD'}});
  if(forbidden(url))return deny(400);
  // Pages is not trusted with owner cookies or any client-provided header.
  // Upstream is an owner-configured HTTPS *.pages.dev origin, never a URL
  // taken from a request, query, fragment or a client-controllable header.
  const upstream=new URL(pagesOrigin);
  upstream.pathname=url.pathname;
  let response;
  try{
   response=await requestPages(upstream.href,{
    method:request.method,
    headers:{Accept:'*/*','Accept-Encoding':'identity'},
    redirect:'manual',cache:'no-store',
    signal:AbortSignal.timeout(12000),
   });
  }catch{return deny(503);}
  if(!(response instanceof Response)||response.redirected||
   response.status>=300&&response.status<400||
   ![200,404].includes(response.status))return deny(503);
  if(response.status===404)return deny();
  const encoding=response.headers.get('Content-Encoding');
  if(encoding&&encoding.toLowerCase()!=='identity')return deny(503);
  const headers=new Headers(GUARD);
  const type=response.headers.get('Content-Type');
  if(type)headers.set('Content-Type',type);
  // No upstream cookies, CORS, redirects, validators or cache metadata.
  return new Response(request.method==='HEAD'?null:response.body,
   {status:200,headers});
 }
 return Object.freeze({serve});
}
