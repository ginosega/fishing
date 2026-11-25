/**
 * FISH-TODO-118 WP3 / H1 — dedicated isolated READ-ONLY Worker candidate.
 *
 * SOURCE ONLY. This module is not referenced from a deployed Wrangler
 * configuration or a release workflow. Its default export is suitable for
 * an explicit *later*, owner-approved isolated Worker bundle only.
 *
 * H1 deliberately does NOT import the WP3 publisher, operation D1 writer,
 * GitHub write-token issuer, media stage API or operator approval callbacks.
 * Advancing to H2 requires a separate reviewed code/permission change;
 * even an accidentally supplied WRITE_ENABLED=true makes H1 fail CLOSED.
 */
import {createD6ProductionRuntimeBindingContract}
 from '../../experiments/p3/preview/src/d6-production-runtime-bindings.mjs';
import {D6_WP3_STAGING_ORIGIN as WP3_ORIGIN}
 from '../src/d6-public-reader.mjs';

export const D6_WP3_H1_WORKER_ORIGIN=WP3_ORIGIN;
const OWNER='265665562',REPO='1350909744';
const writeFlags=Object.freeze([
 'D6_WP3_RUNTIME_ENABLED','D6_WP3_WRITE_ENABLED',
 'D6_WP3_MOUNT_ENABLED','D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED',
]);
const noStore=Object.freeze({
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'X-Content-Type-Options':'nosniff',
});
const fail=(code,status)=>new Response(JSON.stringify({
 ok:false,error:code,
}),{status,headers:noStore});
const unavailable=()=>fail('TEMPORARILY_UNAVAILABLE',503);
const missing=()=>fail('NOT_FOUND',404);

function eligible(env){
 return env!==null&&typeof env==='object'&&
  env.D6_WP3_H1_READ_ONLY_ENABLED==='true'&&
  env.D6_PRODUCTION_ENABLED==='true'&&
  env.D6_GATEWAY_ENABLED==='true'&&
  env.D6_ORIGIN===WP3_ORIGIN&&
  env.D6_OWNER_GITHUB_ID===OWNER&&
  env.D6_REPOSITORY_ID===REPO&&
  env.D6_WP3_ISOLATED_READ_ENABLED==='true'&&
  env.D6_WP3_ISOLATED_PAGES_ENABLED==='true'&&
  env.D6_WP3_READ_PROFILE_ENABLED==='true'&&
  env.D6_WP2_STAGING_ENABLED!=='true'&&
  env.D6_ISOLATED_PAGES_ENABLED!=='true'&&
  writeFlags.every(name=>env[name]!=='true');
}
const writePath=pathname=>/^\/api\/v3\/(?:operations|media)(?:\/|$)/.test(
 pathname);

export function createD6Wp3H1ReadOnlyWorker({
 network=globalThis.fetch,cryptoApi=globalThis.crypto,now,
}={}){
 if(typeof network!=='function'||
  (now!==undefined&&typeof now!=='function'))
  throw Error('Invalid WP3 H1 Worker transport');
 async function fetchRequest(request,env={}){
  // A trusted, explicit server-only H1 flag is required *even for reads*.
  // Checking this first avoids D1/provider use on unconfigured deployments.
  if(!eligible(env))return unavailable();
  if(!(request instanceof Request))return missing();
  let url;
  try{url=new URL(request.url);}catch{return missing();}
  if(url.origin!==WP3_ORIGIN||url.username||url.password||
   request.headers.has('Authorization'))return missing();
  // Even an incorrectly upgraded read runtime cannot expose an H1 writer.
  if(writePath(url.pathname))return missing();
  try{
   const read=createD6ProductionRuntimeBindingContract({
    env,network,cryptoApi,now,
   });
   return await read.fetch(request);
  }catch{
   return unavailable();
  }
 }
 return Object.freeze({fetch:fetchRequest});
}

// Explicit Cloudflare module-worker shape; NOT installed on any Worker.
// An approved H1 build may reference this file only with a dedicated script
// and reviewed D1/secret bindings, never a public or WP2 deployment config.
const worker=createD6Wp3H1ReadOnlyWorker();
export default Object.freeze({
 fetch(request,env){return worker.fetch(request,env);},
});
