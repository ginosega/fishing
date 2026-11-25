/**
 * D6 Stage A isolated static-only Cloudflare Worker CANDIDATE.
 * SOURCE ONLY: NOT DEPLOYED. No owner sessions, APIs, storage, D1,
 * GitHub credentials, OAuth, media upload, or publishing routes.
 *
 * Required non-secret bindings, ONLY AFTER separate owner approval:
 *  D6_STAGE_A_STATIC_ENABLED = "true"
 *  D6_STAGE_A_PAGES_DEPLOYMENT_HOST =
 *    "<immutable-hex>.fishing-v3-d6-static-test.pages.dev"
 * Never configure a mutable Pages project alias, public V2 or D5 origin.
 */
export const D6_STAGE_A_WORKER_ORIGIN=
 'https://fishing-d6-static-test.ginosega.workers.dev';
export const D6_STAGE_A_PAGES_HOST_PATTERN=
 /^[a-f0-9]{8,32}\.fishing-v3-d6-static-test\.pages\.dev$/;
const BASE='/fishing/';
const TOP_LEVEL=new Set(['index.html','release.json','loader.js','sw.js',
 'manifest.webmanifest','icon.png','icon-maskable.png']);
const RELEASE_ASSET=/^releases\/[a-f0-9]{32}\/(?:[A-Za-z0-9._~!$&'()+,;=:@%-]+\/)*[A-Za-z0-9._~!$&'()+,;=:@%-]+$/;
const BAD_ENCODED=/%(?:2f|5c|00|2e|25(?:2f|5c|00|2e))/i;
const headers=()=>new Headers({
 'Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff',
 'X-Robots-Tag':'noindex, nofollow',
 'Referrer-Policy':'no-referrer',
 'Cross-Origin-Resource-Policy':'same-origin',
});
const unavailable=(status=404)=>new Response('Unavailable',{
 status,headers:headers(),
});
const enabledConfig=(enabled,host)=>enabled===true&&
 typeof host==='string'&&D6_STAGE_A_PAGES_HOST_PATTERN.test(host);

/** Trusted path mapping, with no user-chosen upstream destination. */
export function planD6StageAStaticRequest({url,method='GET',pagesHost}={}){
 if(typeof pagesHost!=='string'||!D6_STAGE_A_PAGES_HOST_PATTERN.test(pagesHost))
  return Object.freeze({kind:'deny',status:503});
 if(typeof url!=='string'||BAD_ENCODED.test(url)||url.includes('\\'))
  return Object.freeze({kind:'deny',status:404});
 let incoming;
 try{incoming=new URL(url);}catch{return Object.freeze({kind:'deny',status:400});}
 if(incoming.origin!==D6_STAGE_A_WORKER_ORIGIN||
    incoming.username||incoming.password||incoming.protocol!=='https:'||
    incoming.search||incoming.hash)
  return Object.freeze({kind:'deny',status:404});
 const rawPath=incoming.pathname;
 if(rawPath.includes('//')||rawPath.split('/').some(s=>s==='.'||s==='..'))
  return Object.freeze({kind:'deny',status:404});
 if(rawPath==='/'||rawPath==='/fishing'){
  if(method!=='GET'&&method!=='HEAD')
   return Object.freeze({kind:'deny',status:405});
  return Object.freeze({kind:'redirect',status:302,location:BASE});
 }
 if(!rawPath.startsWith(BASE))return Object.freeze({kind:'deny',status:404});
 if(method!=='GET'&&method!=='HEAD')
  return Object.freeze({kind:'deny',status:405});
 const relative=rawPath.slice(BASE.length)||'index.html';
 if(!TOP_LEVEL.has(relative)&&!RELEASE_ASSET.test(relative))
  return Object.freeze({kind:'deny',status:404});
 const upstreamPath=relative==='index.html'?'':relative;
 const pagesBase='https://'+pagesHost+BASE;
 const upstreamUrl=new URL(upstreamPath,pagesBase);
 if(upstreamUrl.origin!=='https://'+pagesHost||
    !upstreamUrl.pathname.startsWith(BASE)||
    upstreamUrl.search||upstreamUrl.hash)
  return Object.freeze({kind:'deny',status:404});
 return Object.freeze({kind:'static',method,upstreamUrl:upstreamUrl.href});
}

export function createD6StageAStaticWorker({
 enabled=false,pagesDeploymentHost,fetchAsset,
}={}){
 if(typeof fetchAsset!=='function')
  throw Error('D6 Stage A requires an explicit trusted fetch transport');
 return Object.freeze({
  async fetch(request){
   if(!enabledConfig(enabled,pagesDeploymentHost))return unavailable(503);
   if(!(request instanceof Request))return unavailable(404);
   const plan=planD6StageAStaticRequest({
    url:request.url,method:request.method,pagesHost:pagesDeploymentHost,
   });
   if(plan.kind==='deny')return unavailable(plan.status);
   if(plan.kind==='redirect'){
    const h=headers();h.set('Location',plan.location);
    return new Response(null,{status:plan.status,headers:h});
   }
   let result;
   try{result=await fetchAsset(plan.upstreamUrl,{
    method:plan.method,redirect:'manual',
    credentials:'omit',cache:'no-store',
   });}catch{return unavailable(503);}
   if(!(result instanceof Response)||result.status!==200||
      result.redirected===true||(result.url&&result.url!==plan.upstreamUrl))
    return unavailable(503);
   // Copy ONLY the content type. Never forward Set-Cookie, Location, CORS,
   // cache instructions, upstream credentials or response authorization.
   const h=headers();
   const contentType=result.headers.get('Content-Type');
   if(contentType)h.set('Content-Type',contentType);
   return new Response(plan.method==='HEAD'?null:result.body,{
    status:200,headers:h,
   });
  },
 });
}

// Deployable shape, deliberately disabled unless explicitly enabled after
// separate Cloudflare Stage A provisioning and owner approval.
export default {
 fetch(request,env){
  return createD6StageAStaticWorker({
   enabled:env?.D6_STAGE_A_STATIC_ENABLED==='true',
   pagesDeploymentHost:env?.D6_STAGE_A_PAGES_DEPLOYMENT_HOST,
   fetchAsset:(url,options)=>fetch(url,options),
  }).fetch(request);
 },
};
