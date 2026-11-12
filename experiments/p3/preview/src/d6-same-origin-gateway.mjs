/**
 * FISH118 D6 same-origin source-only composition; NO deployed Worker entry.
 * Deliberately independent of D2/D3 private sandbox auth and publishers.
 *
 * Routes:
 *   /, /fishing/*              allowlisted public static Pages bytes
 *   GET /session               safe projected owner session status only
 *   GET /api/v3/authoring-source  owner-authorized canonical source read
 *
 * ALL route gates default OFF. There is no OAuth callback, write API,
 * media endpoint, CSRF token disclosure, installed GitHub App, or secret
 * binding in this module. Deployment/credential activation is separate.
 */
import {createD6PublicReadProxy,planD6PublicRead,D6_PUBLIC_ORIGIN,
 D6_GITHUB_PAGES_BASE,isD6TrustedPagesBase}
 from '../../../../pwa/server/d6-pages-path-gateway.mjs';
import {createD6HostedRevisionReader}
 from './d6-hosted-revision-reader.mjs';
import {createD6CanonicalSnapshotLoader}
 from './d6-canonical-snapshot-loader.mjs';
import {createD6OwnerSourceRoute,D6_SOURCE_PATH}
 from './d6-owner-source-route.mjs';

const OWNER_LOGIN=/^[A-Za-z0-9-]{1,39}$/;
const ownerHeaders={
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'Vary':'Cookie',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'X-Robots-Tag':'noindex, nofollow',
 'Cross-Origin-Resource-Policy':'same-origin',
};
const fail=(status,error)=>new Response(JSON.stringify({ok:false,error}),{
 status,headers:ownerHeaders,
});
const enabled=(value)=>value()===true;

export function createD6SameOriginGateway({
 fetchStaticAsset,fetchHostedAsset,requestGitHub,issueReadToken,ownerSession,
 pagesBase=D6_GITHUB_PAGES_BASE,
 gatewayEnabled=()=>false,staticEnabled=()=>false,
 sessionEnabled=()=>false,sourceEnabled=()=>false,
}={}){
 if(typeof fetchStaticAsset!=='function'||
  typeof fetchHostedAsset!=='function'||
  typeof requestGitHub!=='function'||typeof issueReadToken!=='function'||
  typeof ownerSession?.describe!=='function'||
  typeof ownerSession?.authorizeStatus!=='function'||
  [gatewayEnabled,staticEnabled,sessionEnabled,sourceEnabled]
   .some(v=>typeof v!=='function')||!isD6TrustedPagesBase(pagesBase))
  throw Error('D6 same-origin gateway requires explicit trusted dependencies');

 const gate=()=>enabled(gatewayEnabled);
 const staticOn=()=>gate()&&enabled(staticEnabled);
 const sessionOn=()=>gate()&&enabled(sessionEnabled);
 // Do not expose source access until the same-origin session reader is
 // intentionally enabled. This is still only a read, never write authority.
 const sourceOn=()=>sessionOn()&&enabled(sourceEnabled);
 const staticProxy=createD6PublicReadProxy({
  fetchAsset:fetchStaticAsset,enabled:true,pagesBase,
 });
 const hosted=createD6HostedRevisionReader({
  fetchAsset:fetchHostedAsset,enabled:sourceOn,pagesBase,
 });
 const github=createD6CanonicalSnapshotLoader({
  request:requestGitHub,issueReadToken,enabled:sourceOn,
 });
 const source=createD6OwnerSourceRoute({
  ownerSession,readHostedRevision:hosted.readHostedRevision,
  loadSnapshot:github.loadSnapshot,enabled:sourceOn,
 });

 async function sessionStatus(request){
  if(!sessionOn())return fail(503,'TEMPORARILY_UNAVAILABLE');
  let identity;
  try{identity=await ownerSession.describe(request);}
  catch{return fail(503,'SESSION_UNAVAILABLE');}
  if(!identity||typeof identity.authenticated!=='boolean'||
   typeof identity.authorized!=='boolean'||
   (identity.authorized&&!identity.authenticated))
   return fail(503,'SESSION_UNAVAILABLE');
  // No owner ID or CSRF token leaves this endpoint. The authenticated
  // boolean is informational, NOT sufficient to authorize /authoring-source.
  const result={authenticated:identity.authenticated,
   authorized:identity.authorized};
  if(result.authenticated&&result.authorized&&
   typeof identity.ownerLogin==='string'&&
   OWNER_LOGIN.test(identity.ownerLogin))
   result.ownerLogin=identity.ownerLogin;
  return new Response(JSON.stringify(result),{status:200,headers:ownerHeaders});
 }

 async function fetchRequest(request){
  if(!gate())return fail(503,'TEMPORARILY_UNAVAILABLE');
  if(!(request instanceof Request))return fail(404,'NOT_FOUND');
  let url;
  try{url=new URL(request.url);}catch{return fail(404,'NOT_FOUND');}
  if(url.origin!==D6_PUBLIC_ORIGIN||url.username||url.password)
   return fail(404,'NOT_FOUND');
  // Never facilitate browser cross-origin cookie reads or respond with CORS.
  const origin=request.headers.get('Origin');
  if(origin&&origin!==D6_PUBLIC_ORIGIN)
   return fail(403,'ORIGIN_DENIED');
  if(request.headers.get('Sec-Fetch-Site')==='cross-site')
   return fail(403,'ORIGIN_DENIED');
  if(url.pathname==='/session'){
   if(request.method!=='GET'||url.search||url.hash||
     request.headers.has('Authorization'))
    return fail(404,'NOT_FOUND');
   return sessionStatus(request);
  }
  if(url.pathname===D6_SOURCE_PATH){
   // source.serve repeats exact URL, method, owner and capability checks.
   if(!sourceOn())return fail(503,'TEMPORARILY_UNAVAILABLE');
   return source.serve(request);
  }
  // No authentication start/callback, signout, POST, PATCH, media,
  // operations, admin, private pilot or GitHub write routes exist here.
  const plan=planD6PublicRead({url:request.url,method:request.method,
   pagesBase});
  if(plan.kind==='static'||plan.kind==='redirect'){
   if(!staticOn())return fail(503,'TEMPORARILY_UNAVAILABLE');
   return staticProxy(request);
  }
  return fail(404,'NOT_FOUND');
 }
 return Object.freeze({fetch:fetchRequest});
}
