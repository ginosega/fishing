/**
 * FISH118 D3 -- default-off owner gateway composition for Gear/KB authoring.
 * SOURCE ONLY. It does not deploy, enable a Worker, bind secrets or schedule
 * a GitHub publisher. Completed D2 fixture route/worker remains unchanged.
 *
 * Reuses AUTH-P0 owner session and same-origin Pages proxy. The only target
 * for proposed GitHub source reads/operations is private sandbox ID 1430581407.
 */
import authWorker from './d2-auth-owner-worker.mjs';
import {gatewayResponse} from './d2-auth-static-gateway.mjs';
import {createD2UnifiedOwnerSession} from './d2-unified-owner-session.mjs';
import {createD1OperationStore} from './d1-operation-store.mjs';
import {createD2SandboxReadTokenIssuer} from './d2-sandbox-read-token.mjs';
import {createD3SandboxSnapshotLoader} from './d3-sandbox-snapshot-loader.mjs';
import {createD3TrustedGearKBCandidate} from './d3-trusted-gear-kb-candidate.mjs';
import {createD3GuardedOperationsApi} from './d3-guarded-operations-api.mjs';

const ID=1430581407,OWNER=265665562;
const authPaths=new Set(['/','/test-client.js','/test.css',
  '/auth/start','/auth/callback','/session/signout','/session/revoke-all']);
const operations=path=>path==='/api/v3/operations'||
  /^\/api\/v3\/operations\/[^/]+$/.test(path);
const no=(status=404)=>new Response(JSON.stringify({
  ok:false,error:status===503?'TEMPORARILY_UNAVAILABLE':'NOT_FOUND',
}),{status,headers:{'Cache-Control':'no-store',
  'Content-Type':'application/json; charset=utf-8',
  'X-Content-Type-Options':'nosniff'}});
export function createD3GatedAuthGateway({
  auth=authWorker,proxy=gatewayResponse,
  requestGitHub,issueReadToken,
  sessionFactory=createD2UnifiedOwnerSession,
  storeFactory=createD1OperationStore,
  apiFactory=createD3GuardedOperationsApi,
}={}){
  if(typeof auth?.fetch!=='function'||typeof proxy!=='function'||
    [sessionFactory,storeFactory,apiFactory].some(x=>typeof x!=='function'))
    throw Error('D3 gateway requires trusted AUTH-P0 dependencies');
  async function fetchRequest(request,env,context){
    let url;
    try{url=new URL(request.url);}catch{return no();}
    if(!env?.APP_ORIGIN||url.protocol!=='https:'||
      url.origin!==env.APP_ORIGIN||url.username||url.password)
      return no();
    if(url.pathname==='/fishing'||url.pathname.startsWith('/fishing/')){
      try{return await proxy(request)??no();}
      catch{return no(503);}
    }
    if(authPaths.has(url.pathname)&&!url.searchParams.has('unknown'))
      return auth.fetch(request,env,context);
    if(url.pathname!=='/session'&&!operations(url.pathname))return no();
    // A disabled D3 writer does not create a second secret/token ingress.
    // Owner status GET remains available when real D1 bindings are present.
    if(request.method==='POST'&&url.pathname==='/api/v3/operations'&&
      env.D3_WRITE_ENABLED!=='true')return no(503);
    if(url.pathname==='/session'&&request.method==='GET'&&
      env.D3_WRITE_ENABLED!=='true'&&
      (!env.OPERATIONS_DB||typeof env.D2_CSRF_KEY!=='string'))
      return auth.fetch(request,env,context);
    if(!env.DB?.prepare||!env.OPERATIONS_DB?.prepare||
      !env.OPERATIONS_DB?.batch||
      typeof env.D2_CSRF_KEY!=='string'||env.D2_CSRF_KEY.length<32||
      !/^[1-9]\d*$/.test(String(env.OWNER_GITHUB_ID))||
      Number(env.OWNER_GITHUB_ID)!==OWNER)
      return no(503);
    try{
      const session=sessionFactory({
        AUTH_DB:env.DB,ownerGitHubId:OWNER,
        origin:env.APP_ORIGIN,csrfKey:env.D2_CSRF_KEY,
      });
      const store=storeFactory({
        DB:env.OPERATIONS_DB,ownerGitHubId:OWNER,repositoryId:ID,
      });
      const transport=requestGitHub??fetch;
      const grant=issueReadToken??createD2SandboxReadTokenIssuer({
        env,request:transport,
        enabled:()=>env.D3_READ_TOKENS_ENABLED==='true'&&
          env.D3_SANDBOX_REPO_ID===String(ID),
      }).issueReadToken;
      const source=createD3SandboxSnapshotLoader({
        request:transport,issueReadToken:grant,
        enabled:()=>env.D3_READ_TOKENS_ENABLED==='true'&&
          env.D3_SANDBOX_REPO_ID===String(ID),
      });
      const planner=createD3TrustedGearKBCandidate({
        loadSnapshot:source.loadSnapshot,
        enabled:()=>env.D3_READ_TOKENS_ENABLED==='true'&&
          env.D3_SANDBOX_REPO_ID===String(ID),
      });
      const api=apiFactory({
        session,store,
        validateCandidate:async({package:pkg,repositoryId,ownerGitHubId})=>
          planner.plan({package:pkg,repositoryId,ownerGitHubId}),
        enabled:()=>env.D3_WRITE_ENABLED==='true'&&
          env.D3_READ_TOKENS_ENABLED==='true'&&
          env.D3_SANDBOX_REPO_ID===String(ID),
      });
      return await api.handle(request);
    }catch{return no(503);}
  }
  return Object.freeze({fetch:fetchRequest});
}
export default createD3GatedAuthGateway();
