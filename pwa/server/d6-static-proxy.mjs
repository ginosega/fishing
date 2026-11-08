/**
 * D6 source-only public asset proxy seam. NOT a deployable production Worker.
 * Trusted owner auth/publishing routes require separate implementation/approval.
 * No repository writes, credential handling or release identity assertions here.
 */
export const D6_PUBLIC_ORIGIN='https://fishing.ginosega.workers.dev';
export const D6_PAGES_ROOT='https://ginosega.github.io/fishing/';
const STATIC_ROOT=new Set(['/','/index.html','/release.json','/loader.js',
 '/sw.js','/manifest.webmanifest','/icon.png','/icon-maskable.png']);
const RELEASE_ASSET=/^\/releases\/[a-f0-9]{32}\/(?:[A-Za-z0-9._~!$&'()+,;=:@%-]+\/)*[A-Za-z0-9._~!$&'()+,;=:@%-]+$/;
const deny=(status=404)=>Object.freeze({kind:'deny',status});

export function planD6StaticRequest({url,method='GET'}={}){
 let incoming;
 try{incoming=new URL(url);}catch{return deny(400);}
 if(incoming.origin!==D6_PUBLIC_ORIGIN||incoming.username||incoming.password)
  return deny(421);
 if(method!=='GET'&&method!=='HEAD')return deny(405);
 const path=incoming.pathname;
 if(/%(?:2f|5c|00|2e)/i.test(path)||path.includes('\\')||path.includes('//'))
  return deny();
 if(!STATIC_ROOT.has(path)&&!RELEASE_ASSET.test(path))return deny();
 const file=path==='/'?'index.html':path.slice(1);
 const upstream=new URL(file+incoming.search,D6_PAGES_ROOT);
 if(upstream.origin!==new URL(D6_PAGES_ROOT).origin||
    !upstream.pathname.startsWith('/fishing/'))return deny();
 return Object.freeze({kind:'static',method,upstreamUrl:upstream.href,
  cacheControl:'no-store'});
}

export function createD6StaticReadProxy({fetchAsset,enabled=false}={}){
 if(typeof fetchAsset!=='function')throw Error('Explicit static asset fetch required');
 return async request=>{
  // Disabled or unknown readiness must fail closed; private pilot never leaks.
  if(enabled!==true)return new Response('V3 public gateway not enabled',
   {status:503,headers:{'Cache-Control':'no-store'}});
  const plan=planD6StaticRequest({url:request?.url,method:request?.method});
  if(plan.kind!=='static')return new Response('Unavailable',
   {status:plan.status,headers:{'Cache-Control':'no-store'}});
  let upstream;
  try{upstream=await fetchAsset(plan.upstreamUrl,
   {method:plan.method,redirect:'manual'});}catch{}
  if(upstream?.status!==200)return new Response('Public static asset unavailable',
   {status:503,headers:{'Cache-Control':'no-store'}});
  const headers=new Headers({'Cache-Control':plan.cacheControl,
   'X-Content-Type-Options':'nosniff'});
  const contentType=upstream.headers.get('content-type');
  if(contentType)headers.set('Content-Type',contentType);
  // Never forward upstream Set-Cookie, Location, or authentication headers.
  return new Response(plan.method==='HEAD'?null:upstream.body,{status:200,headers});
 };
}
