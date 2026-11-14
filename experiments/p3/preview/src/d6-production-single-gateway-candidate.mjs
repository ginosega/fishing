/**
 * FISH-TODO-118 WP3 — single same-origin READ+WRITE gateway candidate.
 *
 * SOURCE ONLY / UNMOUNTED / DEFAULT OFF FOR EVERY WRITE.
 * Combines the *existing* WP2 public/owner read gateway with the already
 * tested #490 operation and #492 original-media route candidates. It is
 * NOT a second owner identity authority, provider writer, lifecycle, app
 * Worker default export, deployment, token issuer or hosted permission.
 *
 * Existing read routes continue through readGateway.fetch unmodified.
 * A separate server-only mount flag, overall write switch and per-family
 * switch must ALL opt in before the exact POST routes can be delegated.
 * No unknown API URL, GET, body, client header or query enables writes.
 * Write namespaces are never forwarded into the read gateway (or vice
 * versa), including while the gate is OFF.
 */
import {D6_PUBLISH_INTAKE_ORIGIN as ORIGIN}
 from './d6-production-publish-intake.mjs';

const UUID='[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}';
const OPERATIONS=new RegExp('^/api/v3/operations(?:/'+UUID+
 '/(?:status|begin|reconcile))?$');
const MEDIA=new Set(['/api/v3/media','/api/v3/media/reconcile']);
const ERROR_HEADERS=Object.freeze({
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'X-Robots-Tag':'noindex, nofollow',
});
const failure=(status,code)=>new Response(JSON.stringify({
 ok:false,error:code,
}),{status,headers:ERROR_HEADERS});
const notFound=()=>failure(404,'NOT_FOUND');
const unavailable=()=>failure(503,'TEMPORARILY_UNAVAILABLE');
const inFamily=(path,stem)=>path===stem||path.startsWith(stem+'/');
const validResponse=res=>res instanceof Response&&
 [200,202,403,404,503].includes(res.status)&&
 res.redirected===false&&
 /^application\/json(?:\s*;.*)?$/i.test(
  res.headers.get('Content-Type')??'')&&
 /(?:^|,)\s*(?:private|no-store)(?:,|$)/i.test(
  res.headers.get('Cache-Control')??'')&&
 !res.headers.has('Set-Cookie')&&
 !res.headers.has('Location')&&
 !res.headers.has('Access-Control-Allow-Origin');

export function createD6ProductionSingleGatewayCandidate({
 readGateway,operationRoute,mediaRoute,
 writeMountEnabled=()=>false,writeEnabled=()=>false,
 operationEnabled=()=>false,mediaEnabled=()=>false,
}={}){
 if(typeof readGateway?.fetch!=='function'||
  typeof operationRoute?.serve!=='function'||
  typeof mediaRoute?.serve!=='function'||
  [writeMountEnabled,writeEnabled,operationEnabled,mediaEnabled]
   .some(fn=>typeof fn!=='function'))
  throw Error('WP3 single-gateway composition unavailable');

 async function fetchRequest(request){
  if(!(request instanceof Request))return notFound();
  let u;
  try{u=new URL(request.url);}catch{return notFound();}
  const operation=inFamily(u.pathname,'/api/v3/operations');
  const media=inFamily(u.pathname,'/api/v3/media');
  // All other routes preserve the WP2 read-only gateway unchanged.
  if(!operation&&!media)return readGateway.fetch(request);
  // Never leak owner authoring paths to the static Pages proxy or
  // read-only fallback, even when this candidate is not mounted.
  if(writeMountEnabled()!==true||writeEnabled()!==true||
   (operation?operationEnabled():mediaEnabled())!==true)
   return notFound();
  if(u.origin!==ORIGIN||u.username||u.password||u.search||u.hash||
   request.method!=='POST'||request.headers.has('Authorization'))
   return notFound();
  if(operation&&!OPERATIONS.test(u.pathname)||
   media&&!MEDIA.has(u.pathname))return notFound();
  let res;
  try{
   res=await (operation?operationRoute:mediaRoute).serve(request);
  }catch{return unavailable();}
  if(!validResponse(res))return unavailable();
  // A wrapped route returning 202 is still only an Accepted/Unknown,
  // never a merge, hosted release or verified public Live receipt.
  return res;
 }
 return Object.freeze({fetch:fetchRequest});
}
