/**
 * FISH118 D6 production-origin Worker CANDIDATE — SOURCE ONLY.
 *
 * Deployable handler shape but NOT installed, routed, published or enabled.
 * No production Wrangler configuration is active. Never point the existing
 * private D5 Worker here. Real provider bindings and deployment are separate
 * owner-approved actions.
 *
 * Independent emergency shutoff: D6_WORKER_ENTRY_ENABLED must be the exact
 * server-side string "true" IN ADDITION TO every D6 production/auth/source
 * gate inside createD6ProductionRuntimeBindingContract. The default is OFF.
 */
import {createD6ProductionRuntimeBindingContract}
 from './d6-production-runtime-bindings.mjs';
import {D6_WP2_STAGING_ORIGIN}
 from '../../../../pwa/src/d6-public-reader.mjs';

export const D6_WORKER_CANDIDATE_ORIGIN=
 'https://fishing.ginosega.workers.dev';

const response=(status,reason)=>new Response(JSON.stringify({
 ok:false,error:reason,
}),{status,headers:{
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'X-Frame-Options':'DENY',
 'X-Robots-Tag':'noindex, nofollow',
 'Cross-Origin-Resource-Policy':'same-origin',
}});
const unavailable=()=>response(503,'TEMPORARILY_UNAVAILABLE');
const denied=()=>response(404,'NOT_FOUND');

export function createD6DisabledProductionWorker({
 network=globalThis.fetch,cryptoApi=globalThis.crypto,now,
}={}){
 if(typeof network!=='function'||
    (now!==undefined&&typeof now!=='function'))
  throw Error('Invalid D6 Worker dependencies');
 async function fetchRequest(request,env){
  // Fail shut before constructing the runtime, touching D1 or issuing fetch.
  // This is a *separate* route activation gate; production settings alone
  // cannot make a source-only staged Worker serve authenticated traffic.
  if(env?.D6_WORKER_ENTRY_ENABLED!=='true')return unavailable();
  if(!(request instanceof Request))return denied();
  let url;
  try{url=new URL(request.url);}catch{return denied();}
  const pinnedOrigin=env?.D6_WP2_STAGING_ENABLED==='true'?
   D6_WP2_STAGING_ORIGIN:D6_WORKER_CANDIDATE_ORIGIN;
  if(url.origin!==pinnedOrigin||
     url.username||url.password)return denied();
  if(request.headers.get('Origin') &&
     request.headers.get('Origin')!==pinnedOrigin)
   return response(403,'ORIGIN_DENIED');
  try{
   const trusted=createD6ProductionRuntimeBindingContract({
    env,network,cryptoApi,now,
   });
   return await trusted.fetch(request);
  }catch{
   // Neither errors nor logs may contain cookies, OAuth codes, GitHub
   // installation tokens, App JWT, D1 records or a private key.
   return unavailable();
  }
 }
 return Object.freeze({fetch:fetchRequest});
}

// Intentionally no routes, triggers, cron, writer, media or publisher.
export default createD6DisabledProductionWorker();
