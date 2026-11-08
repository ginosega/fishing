/**
 * D6 source-only, disabled-by-default static gateway.
 * Preserve the verified GitHub Pages /fishing/ release base and SW scope.
 * The new hostname root redirects to /fishing/; same-origin auth/API
 * endpoints live OUTSIDE that scope and are not handled by this proxy.
 * This is neither a deployable auth Worker nor a GitHub publishing service.
 */
export const D6_PUBLIC_ORIGIN='https://fishing.ginosega.workers.dev';
export const D6_GITHUB_PAGES_BASE='https://ginosega.github.io/fishing/';
const FILES=new Set(['index.html','release.json','loader.js','sw.js',
 'manifest.webmanifest','icon.png','icon-maskable.png']);
const RELEASE_FILE=/^releases\/[a-f0-9]{32}\/(?:[A-Za-z0-9._~!$&'()+,;=:@%-]+\/)*[A-Za-z0-9._~!$&'()+,;=:@%-]+$/;
const deny=(status=404)=>Object.freeze({kind:'deny',status});

export function planD6PublicRead({url,method='GET'}={}){
 // Do not normalize encoded separators/traversal into an apparently safe URL.
 if(/%(?:2f|5c|00|2e)|\/\.\.?(?:\/|$)/i.test(url))return deny();
 let incoming;
 try{incoming=new URL(url);}catch{return deny(400);}
 if(incoming.origin!==D6_PUBLIC_ORIGIN||incoming.username||
   incoming.password||incoming.protocol!=='https:')return deny(421);
 if(method!=='GET'&&method!=='HEAD')return deny(405);
 if(incoming.pathname==='/'||incoming.pathname==='/fishing')
  return Object.freeze({kind:'redirect',status:302,location:'/fishing/'});
 if(!incoming.pathname.startsWith('/fishing/'))return deny();
 const path=incoming.pathname.slice('/fishing/'.length)||'index.html';
 if(path.includes('\\')||path.includes('//')||
   !FILES.has(path)&&!RELEASE_FILE.test(path))return deny();
 // GitHub Pages may canonicalize /fishing/index.html to /fishing/.
 // Fetch the canonical Pages directory URL for BOTH app-shell aliases.
 // The served file remains index.html in the release manifest/SW cache.
 const upstreamPath=path==='index.html'?'':path;
 const upstream=new URL(upstreamPath+incoming.search,D6_GITHUB_PAGES_BASE);
 if(upstream.origin!==new URL(D6_GITHUB_PAGES_BASE).origin||
    !upstream.pathname.startsWith('/fishing/'))return deny();
 return Object.freeze({kind:'static',method,upstreamUrl:upstream.href});
}

export function createD6PublicReadProxy({fetchAsset,enabled=false}={}){
 if(typeof fetchAsset!=='function')throw Error('An explicit asset fetcher is required');
 return async request=>{
  if(enabled!==true)return new Response('D6 public gateway is disabled',
   {status:503,headers:{'Cache-Control':'no-store'}});
  const plan=planD6PublicRead({url:request?.url,method:request?.method});
  if(plan.kind==='deny')return new Response('Unavailable',
   {status:plan.status,headers:{'Cache-Control':'no-store'}});
  if(plan.kind==='redirect')return new Response(null,{
   status:plan.status,headers:{'Location':plan.location,'Cache-Control':'no-store'}});
  let upstream;
  try{upstream=await fetchAsset(plan.upstreamUrl,{method:plan.method,redirect:'manual'});}catch{}
  if(upstream?.status!==200)return new Response('Static release unavailable',
   {status:503,headers:{'Cache-Control':'no-store'}});
  const headers=new Headers({'Cache-Control':'no-store',
   'X-Content-Type-Options':'nosniff'});
  const contentType=upstream.headers.get('Content-Type');
  if(contentType)headers.set('Content-Type',contentType);
  // Never relay upstream Set-Cookie, Location, authorization or other headers.
  return new Response(plan.method==='HEAD'?null:upstream.body,
   {status:200,headers});
 };
}
