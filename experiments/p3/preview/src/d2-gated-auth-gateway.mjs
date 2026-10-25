/**
 * FISH118 D2: SOURCE-ONLY one-origin AUTH-P0 + read-only Pages proxy
 * + sandbox-only guarded operation API.
 * NOT INSTALLED in production. Default operations WRITE gate is OFF.
 * Uses the preserved P1 OAuth backend instead of a second login system.
 * App PEM/installation access token cannot come from the browser.
 */
import authOwnerWorker from './d2-auth-owner-worker.mjs';
import {gatewayResponse} from './d2-auth-static-gateway.mjs';
import {createD2UnifiedOwnerSession} from './d2-unified-owner-session.mjs';
import {createD2GuardedOperationsApi} from './d2-guarded-operations-api.mjs';
import {createD1OperationStore} from './d1-operation-store.mjs';
import {createD2WorkerGearCandidate} from './d2-worker-source-candidate.mjs';

const ID=1430581407;
const deny=(status=404)=>new Response(JSON.stringify({
 ok:false,error:status===503?'TEMPORARILY_UNAVAILABLE':'NOT_FOUND',
}),{status,headers:{
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
}});
const authPaths=new Set(['/auth/start','/auth/callback',
 '/session/signout','/session/revoke-all']);
const routes=path=>path==='/session'||path==='/api/v3/operations'||
 /^\/api\/v3\/operations\/[^/]+$/.test(path);
export function createD2GatedAuthGateway({
 authWorker=authOwnerWorker,staticGateway=gatewayResponse,
 requestGitHub,issueReadToken,
}={}){
 if(typeof authWorker?.fetch!=='function'||typeof staticGateway!=='function')
  throw Error('D2 gateway requires trusted AUTH-P0 runtime');
 async function fetchRequest(request,env,context){
  let u;
  try{u=new URL(request.url);}catch{return deny(404);}
  if(!env?.APP_ORIGIN||u.origin!==env.APP_ORIGIN||
   u.protocol!=='https:'||u.username||u.password)return deny(404);
  if(u.pathname==='/fishing'||u.pathname.startsWith('/fishing/')){
   // Only the fixed P1 read-only proxy serves public Pages content.
   try{return (await staticGateway(request))??deny(404);}
   catch{return deny(503);}
  }
  if(authPaths.has(u.pathname)&&!u.searchParams.has('unknown')){
   // Only existing P1 auth/session lifecycle, no test HTML or test clients.
   return authWorker.fetch(request,env,context);
  }
  if(!routes(u.pathname))return deny(404);
  if(!env.DB||!env.OPERATIONS_DB||
   typeof env.D2_CSRF_KEY!=='string'||env.D2_CSRF_KEY.length<32||
   !/^[1-9]\d*$/.test(String(env.OWNER_GITHUB_ID)))return deny(503);
  const owner=Number(env.OWNER_GITHUB_ID);
  if(!Number.isSafeInteger(owner))return deny(503);
  let api;
  try{
   const session=createD2UnifiedOwnerSession({
    AUTH_DB:env.DB,ownerGitHubId:owner,
    origin:env.APP_ORIGIN,csrfKey:env.D2_CSRF_KEY,
   });
   const store=createD1OperationStore({
    DB:env.OPERATIONS_DB,ownerGitHubId:owner,repositoryId:ID,
   });
   const validator=createD2WorkerGearCandidate({
    request:requestGitHub??(async()=>{throw Error('No GitHub transport');}),
    issueReadToken:issueReadToken??(async()=>{throw Error('No source token');}),
    // Even a GET validator is not called when the operation writer is OFF.
    sourceEnabled:()=>env.D2_SANDBOX_REPO_ID===String(ID),
   });
   api=createD2GuardedOperationsApi({
    session,store,
    validateGearChange:async({snapshot,repositoryId})=>
     validator.validate({snapshot,repositoryId}),
    writeEnabled:()=>
     env.D2_WRITE_ENABLED==='true'&&
     env.D2_SANDBOX_REPO_ID===String(ID),
   });
  }catch{return deny(503);}
  return api.handle(request);
 }
 return Object.freeze({fetch:fetchRequest});
}
// Explicitly no default production activation or scheduled publisher.
export default createD2GatedAuthGateway();
