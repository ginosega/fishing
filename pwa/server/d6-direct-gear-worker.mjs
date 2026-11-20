/**
 * Fishing Companion V3 private Gear pilot.
 * Existing WP2 OAuth/read routes + one direct D1 Gear GET/POST.
 * Source-only until an explicitly approved isolated deployment.
 * No GitHub publisher, operation queue, watchdog, or release switch.
 */
import {createD6ProductionRuntimeBindingContract}
 from '../../experiments/p3/preview/src/d6-production-runtime-bindings.mjs';
import {D6_WP2_STAGING_ORIGIN}
 from '../src/d6-public-reader.mjs';
import {createD6DirectGearService}
 from './d6-direct-gear-service.mjs';
import {createD6DirectKBService}
 from './d6-direct-kb-service.mjs';

const ORIGIN=D6_WP2_STAGING_ORIGIN;
const respond=(status,error)=>new Response(JSON.stringify({ok:false,error}),{
 status,headers:{'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store, max-age=0',
  'X-Content-Type-Options':'nosniff'},
});
const supported=env=>env!==null&&typeof env==='object'&&
 env.D6_DIRECT_GEAR_ENABLED==='true'&&
 env.D6_PRODUCTION_ENABLED==='true'&&
 env.D6_GATEWAY_ENABLED==='true'&&
 env.D6_SESSION_ENABLED==='true'&&
 env.D6_WP2_STAGING_ENABLED==='true'&&
 env.D6_ISOLATED_PAGES_ENABLED==='true'&&
 env.D6_ORIGIN===ORIGIN&&
 env.D6_OWNER_GITHUB_ID==='265665562'&&
 env.D6_REPOSITORY_ID==='1350909744'&&
 typeof env.AUTH_DB?.prepare==='function'&&
 typeof env.WP3_DB?.prepare==='function'&&
 typeof env.D6_CSRF_KEY==='string';

export function createD6DirectGearWorker({
 network=globalThis.fetch,cryptoApi=globalThis.crypto,now,
}={}){
 if(typeof network!=='function'||(now!==undefined&&typeof now!=='function'))
  throw Error('Invalid direct Gear Worker transport');
 async function fetchRequest(request,env={}){
  if(!(request instanceof Request))return respond(404,'NOT_FOUND');
  let url;
  try{url=new URL(request.url);}catch{return respond(404,'NOT_FOUND');}
  if(url.origin!==ORIGIN||url.username||url.password||
     request.headers.has('Authorization'))return respond(404,'NOT_FOUND');
  // Never let an unknown content operation fall through to static Pages.
  if(url.pathname.startsWith('/api/v3/content/')){
   if(!supported(env))return respond(503,'UNAVAILABLE');
   try{
    // Explicitly opt in KB only after its one-time table/60-row import,
    // backup, and owner-authorized private deployment. No Gear regression.
    if(url.pathname==='/api/v3/content/kb'||
       url.pathname==='/api/v3/content/kb-csrf'||
       url.pathname.startsWith('/api/v3/content/kb/')){
     if(env.D6_DIRECT_KB_ENABLED!=='true')return respond(503,'UNAVAILABLE');
     const kb=createD6DirectKBService({
      AUTH_DB:env.AUTH_DB,CONTENT_DB:env.WP3_DB,
      csrfKey:env.D6_CSRF_KEY,origin:ORIGIN,
      enabled:()=>supported(env)&&env.D6_DIRECT_KB_ENABLED==='true',now,
     });
     return await kb.handle(request);
    }
    const service=createD6DirectGearService({
     AUTH_DB:env.AUTH_DB,CONTENT_DB:env.WP3_DB,
     csrfKey:env.D6_CSRF_KEY,origin:ORIGIN,enabled:()=>supported(env),now,
    });
    return await service.handle(request);
   }catch{return respond(503,'UNAVAILABLE');}
  }
  // All other routes delegate to the previously reviewed WP2 OAuth/read
  // runtime. No GitHub write authority is constructed or requested here.
  try{
   const read=createD6ProductionRuntimeBindingContract({
    env,network,cryptoApi,now,
   });
   return await read.fetch(request);
  }catch{return respond(503,'UNAVAILABLE');}
 }
 return Object.freeze({fetch:fetchRequest});
}

const pilot=createD6DirectGearWorker();
export default Object.freeze({
 fetch(request,env){return pilot.fetch(request,env);},
});
