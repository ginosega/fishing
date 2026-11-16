/**
 * FISH-TODO-118 WP3 / H2 — isolated candidate Worker, SOURCE ONLY.
 *
 * DISTINCT FROM THE OWNER-ACCEPTED H1 READ-ONLY WORKER. NOT DEPLOYED.
 * All write switches and the exact operation/step owner authorization are
 * independent and default OFF. No provider write, deploy, merge or public Live
 * is authorized by creation of this module or its accompanying configuration.
 */
import {createD6ProductionRuntimeBindingContract}
 from '../../experiments/p3/preview/src/d6-production-runtime-bindings.mjs';
import {createD6ProductionWp3TrustedHostCandidate}
 from '../../experiments/p3/preview/src/d6-production-wp3-trusted-host-candidate.mjs';
import {D6_WP3_STAGING_ORIGIN as ORIGIN}
 from '../src/d6-public-reader.mjs';
import {createD6Wp3H2OperatorApproval}
 from './d6-wp3-h2-operator-approval.mjs';
import {createD6Wp3H2OwnerCsrfHandoff,D6_WP3_H2_OWNER_CSRF_PATH}
 from './d6-wp3-h2-owner-csrf.mjs';

const readPins=Object.freeze([
 'D6_PRODUCTION_ENABLED','D6_GATEWAY_ENABLED',
 'D6_WP3_ISOLATED_READ_ENABLED','D6_WP3_ISOLATED_PAGES_ENABLED',
 'D6_WP3_READ_PROFILE_ENABLED','D6_STATIC_ENABLED',
 'D6_SESSION_ENABLED','D6_OAUTH_ENABLED','D6_SOURCE_ENABLED',
 'D6_READ_TOKEN_ENABLED','D6_SIGNER_ENABLED',
]);
const writePins=Object.freeze([
 'D6_WP3_RUNTIME_ENABLED','D6_WP3_WRITE_ENABLED',
 'D6_WP3_MOUNT_ENABLED','D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED',
]);
const WRITE=/^\/api\/v3\/(?:operations|media)(?:\/|$)/;
const headers=Object.freeze({
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'X-Content-Type-Options':'nosniff',
});
const error=(status,code)=>new Response(JSON.stringify({ok:false,error:code}),
 {status,headers});
const missing=()=>error(404,'NOT_FOUND');
const unavailable=()=>error(503,'TEMPORARILY_UNAVAILABLE');

function eligible(env){
 return env&&typeof env==='object'&&
  env.D6_WP3_H2_SOURCE_READY==='true'&&
  env.D6_WP3_H1_READ_ONLY_ENABLED!=='true'&&
  env.D6_ORIGIN===ORIGIN&&
  env.D6_OWNER_GITHUB_ID==='265665562'&&
  env.D6_REPOSITORY_ID==='1350909744'&&
  env.D6_WP2_STAGING_ENABLED!=='true'&&
  env.D6_ISOLATED_PAGES_ENABLED!=='true'&&
  readPins.every(k=>env[k]==='true');
}
const writerSwitches=env=>writePins.every(k=>env[k]==='true');

export function createD6Wp3H2Worker({
 network=globalThis.fetch,cryptoApi=globalThis.crypto,
 now=()=>Math.floor(Date.now()/1000),
}={}){
 if(typeof network!=='function'||typeof now!=='function'||
  typeof cryptoApi?.subtle?.digest!=='function')
  throw Error('Invalid WP3 H2 Worker dependencies');
 async function fetchRequest(request,env={}){
  if(!eligible(env))return unavailable();
  if(!(request instanceof Request))return missing();
  let url;
  try{url=new URL(request.url);}catch{return missing();}
  if(url.origin!==ORIGIN||url.username||url.password||
   request.headers.has('Authorization'))return missing();
  // An exact H2-only owner CSRF handoff. No fallback into read Pages or
  // general /session; nothing exists while writer/operator gates are OFF.
  if(url.pathname==='/api/v3/h2'||
   url.pathname.startsWith('/api/v3/h2/')){
   if(url.pathname!==D6_WP3_H2_OWNER_CSRF_PATH||
    !writerSwitches(env))return missing();
   const operator=createD6Wp3H2OperatorApproval({env,now,cryptoApi});
   const handoff=createD6Wp3H2OwnerCsrfHandoff({
    env,now,enabled:()=>writerSwitches(env)&&operator.approved(),
   });
   return handoff.serve(request);
  }
  if(WRITE.test(url.pathname)){
   // A URL in the write namespace must never fall through to Pages or the
   // read gateway, even if its path, method or host is malformed.
   if(request.method!=='POST'||url.search||url.hash||
    !writerSwitches(env))return missing();
   const operator=createD6Wp3H2OperatorApproval({env,now,cryptoApi});
   if(!operator.approved()||!await operator.permit(request))return missing();
   try{
    const host=createD6ProductionWp3TrustedHostCandidate({
     env,network,cryptoApi,now,
     ownerApproval:operator.approved,
     authorizeStep:operator.authorizeStep,
    });
    // The existing host verifies owner session/CSRF, exact schema, and a
    // fresh D1 Unknown fence BEFORE requesting provider write authority.
    return await host.fetch(request);
   }catch{return unavailable();}
  }
  try{
   // Unchanged read-side OAuth/session/Pages behavior; no WP3 publisher
   // dependency is instantiated on a read request.
   const read=createD6ProductionRuntimeBindingContract({
    env,network,cryptoApi,now,
   });
   return await read.fetch(request);
  }catch{return unavailable();}
 }
 return Object.freeze({fetch:fetchRequest});
}

const worker=createD6Wp3H2Worker();
export default Object.freeze({
 fetch(request,env){return worker.fetch(request,env);},
});
