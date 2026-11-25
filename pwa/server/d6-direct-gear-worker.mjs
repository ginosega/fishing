/**
 * Fishing Companion standalone V3 Worker.
 * Direct D1 content, private R2 media, offline snapshot and owner OAuth.
 * Cloudflare Assets serves the software. No GitHub content pipeline.
 */
import {createD6OwnerAuth} from './d6-owner-auth.mjs';
import {D6_WP2_STAGING_ORIGIN}
 from '../src/d6-public-reader.mjs';
import {createD6DirectGearService}
 from './d6-direct-gear-service.mjs';
import {createD6DirectKBService}
 from './d6-direct-kb-service.mjs';
import {createD6DirectCatchService}
 from './d6-direct-catch-service.mjs';
import {createD6SharedMediaStage} from './d6-shared-media-stage.mjs';
import {createD6SharedMediaLive} from './d6-shared-media-live.mjs';
import {createD6OfflineContentSnapshotRoute}
 from './d6-offline-content-snapshot-route.mjs';

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
// No new media binding or flag exists in the approved deployed Worker.
// Source route becomes reachable only after *separately approved* binding,
// private build opt-in, and deployment. Never expose a public R2 URL.
const mediaEnabled=env=>supported(env)&&
 env.D6_DIRECT_KB_ENABLED==='true'&&
 env.D6_DIRECT_CATCH_ENABLED==='true'&&
 env.D6_M02_MEDIA_ENABLED==='true'&&
 typeof env.WP3_DB?.batch==='function'&&
 typeof env.MEDIA_R2?.head==='function'&&
 typeof env.MEDIA_R2?.get==='function'&&
 typeof env.MEDIA_R2?.put==='function';

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
  // The existing owner-authenticated M02 handlers share this Worker.
  // All route/provider activation remains explicitly OFF in current config.
  if(url.pathname.startsWith('/api/v3/media/')){
   if(!mediaEnabled(env))return respond(503,'UNAVAILABLE');
   try{
    const options={AUTH_DB:env.AUTH_DB,CONTENT_DB:env.WP3_DB,
     R2:env.MEDIA_R2,IMAGES:env.IMAGES,
     csrfKey:env.D6_CSRF_KEY,origin:ORIGIN,
     enabled:()=>mediaEnabled(env),
     thumbnailEnabled:()=>env.D6_M03_THUMBNAILS_ENABLED==='true',now};
    if(url.pathname==='/api/v3/media/stage')
     return await createD6SharedMediaStage(options).handle(request);
    return await createD6SharedMediaLive(options).handle(request);
   }catch{return respond(503,'UNAVAILABLE');}
  }
  // Never let an unknown content operation fall through to static Pages.
  if(url.pathname.startsWith('/api/v3/content/')){
   if(!supported(env))return respond(503,'UNAVAILABLE');
   try{
    // Source-only O02 snapshot route: reuses the EXISTING authenticated
    // M02 D1/R2 bindings. A separate explicit opt-in prevents exposure
    // from code presence alone; no Cloudflare config enables this yet.
    if(url.pathname==='/api/v3/content/offline-snapshot'){
     if(!mediaEnabled(env)||env.D6_O02_OFFLINE_SNAPSHOT_ENABLED!=='true')
      return respond(503,'UNAVAILABLE');
     return await createD6OfflineContentSnapshotRoute({
      AUTH_DB:env.AUTH_DB,CONTENT_DB:env.WP3_DB,
      csrfKey:env.D6_CSRF_KEY,origin:ORIGIN,
      enabled:()=>mediaEnabled(env)&&
       env.D6_O02_OFFLINE_SNAPSHOT_ENABLED==='true',
      now,
     }).handle(request);
    }
    // Catches require their own one-time D1 import and deployment approval.
    if(url.pathname==='/api/v3/content/catches'||
       url.pathname==='/api/v3/content/catches-csrf'||
       url.pathname.startsWith('/api/v3/content/catches/')){
     if(env.D6_DIRECT_CATCH_ENABLED!=='true')return respond(503,'UNAVAILABLE');
     const catches=createD6DirectCatchService({
      AUTH_DB:env.AUTH_DB,CONTENT_DB:env.WP3_DB,
      csrfKey:env.D6_CSRF_KEY,origin:ORIGIN,
      enabled:()=>supported(env)&&env.D6_DIRECT_CATCH_ENABLED==='true',now,
     });
     return await catches.handle(request);
    }
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
  // Standalone V3 exposes only the retained owner OAuth/session routes.
  // Cloudflare Assets handles the software; no Pages proxy or GitHub
  // content reader, App signing, installation-token or publishing route.
  try{
   return await createD6OwnerAuth({env,origin:ORIGIN,network,cryptoApi,now})
    .fetch(request);
  }catch{return respond(503,'UNAVAILABLE');}
 }
 return Object.freeze({fetch:fetchRequest});
}

const pilot=createD6DirectGearWorker();
export default Object.freeze({
 fetch(request,env){return pilot.fetch(request,env);},
});
