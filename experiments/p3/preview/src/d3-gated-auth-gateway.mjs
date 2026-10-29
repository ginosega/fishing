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
import {createD3SandboxTokenIssuers} from './d3-sandbox-token-issuers.mjs';
import {createD3PrivateHostedAsset} from './d3-private-hosted-asset.mjs';
import {createD3PrivateHostProof} from './d3-private-host-proof.mjs';
import {createD3SandboxSnapshotLoader} from './d3-sandbox-snapshot-loader.mjs';
import {createD3TrustedGearKBCandidate} from './d3-trusted-gear-kb-candidate.mjs';
import {createD3GuardedOperationsApi} from './d3-guarded-operations-api.mjs';
import {createD3OwnerSandboxSource} from './d3-owner-sandbox-source.mjs';
import {createD3OwnerPilotHost} from './d3-owner-pilot-host.mjs';
import {d3PublishingReady} from './d3-publishing-readiness.mjs';
import {createD3BenchmarkOwnerRoute} from './d3-benchmark-owner-route.mjs';
import {createD3CheckWebhookWake} from './d3-fast-check-webhook.mjs';
import {createD4GitBlobStage} from './d4-git-blob-stage.mjs';
import {validateD4MediaTickets} from './d4-media-tickets.mjs';

const ID=1430581407,OWNER=265665562;
const authPaths=new Set([
  '/auth/start','/auth/callback','/session/signout','/session/revoke-all',
]);
const operations=path=>path==='/api/v3/media'||
  path==='/api/v3/authoring-source'||
  path==='/api/v3/operations'||
  /^\/api\/v3\/operations\/[^/]+$/.test(path);
const no=(status=404)=>new Response(JSON.stringify({
  ok:false,error:status===503?'TEMPORARILY_UNAVAILABLE':'NOT_FOUND',
}),{status,headers:{'Cache-Control':'no-store',
  'Content-Type':'application/json; charset=utf-8',
  'X-Content-Type-Options':'nosniff'}});
export function createD3GatedAuthGateway({
  auth=authWorker,proxy=gatewayResponse,
  requestGitHub,requestHosted,issueReadToken,readPilotBundle,
  sessionFactory=createD2UnifiedOwnerSession,
  storeFactory=createD1OperationStore,
  apiFactory=createD3GuardedOperationsApi,
  sourceReadFactory=createD3OwnerSandboxSource,
  pilotHostFactory=createD3OwnerPilotHost,
  hostAssetFactory=createD3PrivateHostedAsset,
  hostProofFactory=createD3PrivateHostProof,
  benchmarkRouteFactory=createD3BenchmarkOwnerRoute,
  checkWebhookFactory=createD3CheckWebhookWake,
  mediaStageFactory=createD4GitBlobStage,
}={}){
  if(typeof auth?.fetch!=='function'||typeof proxy!=='function'||
    [sessionFactory,storeFactory,apiFactory,sourceReadFactory,
     hostAssetFactory,hostProofFactory,pilotHostFactory,
     benchmarkRouteFactory,checkWebhookFactory,mediaStageFactory].some(x=>typeof x!=='function'))
    throw Error('D3 gateway requires trusted AUTH-P0 dependencies');
  async function fetchRequest(request,env,context){
    let url;
    try{url=new URL(request.url);}catch{return no();}
    if(!env?.APP_ORIGIN||url.protocol!=='https:'||
      url.origin!==env.APP_ORIGIN||url.username||url.password)
      return no();
    // The existing public /fishing/ gateway remains byte-for-byte proxied.
    // A separately armed exact owner-only path may be tested inside the
    // installed PWA scope; never allow a broad private prefix interception.
    const scopedPilot=url.pathname==='/fishing/__d3_pilot__/'||
      url.pathname==='/fishing/__d3_pilot__/pilot.js';
    const scopedOn=scopedPilot&&env.D3_PILOT_ENABLED==='true'&&
      env.D3_INTEGRATED_PWA_ENABLED==='true';
    if((url.pathname==='/fishing'||url.pathname.startsWith('/fishing/'))&&
       !scopedOn){
      try{return await proxy(request)??no();}
      catch{return no(503);}
    }
    if(authPaths.has(url.pathname)&&!url.searchParams.has('unknown'))
      return auth.fetch(request,env,context);
    const mediaRoute=url.pathname==='/api/v3/media';
    if(mediaRoute&&env.D4_MEDIA_ENABLED!=='true')return no();
    const fastCheck=url.pathname==='/__d3_fast__/github-check';
    if(fastCheck&&(env.D3_FAST_WATCHDOG_ENABLED!=='true'||
      env.D3_FAST_WEBHOOK_ENABLED!=='true'))return no();
    const benchmark=url.pathname.startsWith('/__d3_benchmark__/');
    if(benchmark&&env.D3_BENCHMARK_ENABLED!=='true')return no();
    const privateTest=url.pathname.startsWith('/__d3_test__/operations/');
    const pilot=url.pathname==='/__d3_pilot__/'||
      url.pathname==='/__d3_pilot__/pilot.js'||scopedOn;
    if(pilot&&env.D3_PILOT_ENABLED!=='true')return no();
    if(!privateTest&&!pilot&&!benchmark&&!fastCheck&&url.pathname!=='/session'&&
      !operations(url.pathname))return no();
    if(privateTest&&env.D3_TEST_HOST_ENABLED!=='true')
      return no(404);
    if(privateTest&&(
      typeof env.D2_HOST_PROBE_KEY!=='string'||
      env.D2_HOST_PROBE_KEY.length<32))return no(503);
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
      const armFast=async operationId=>{
        if(typeof env.D3_FAST_WAKE_DO?.getByName!=='function')
          throw Error('D3_FAST_WAKE_UNAVAILABLE');
        const stub=env.D3_FAST_WAKE_DO.getByName(operationId);
        const response=await stub.fetch(new Request('https://d3-fast.internal/arm',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({operationId,deadlineMs:Date.now()}),
        }));
        if(response?.status!==200)throw Error('D3_FAST_ALARM_UNCERTAIN');
      };
      if(fastCheck){
        // Dedicated GitHub ingress: no browser-cookie authentication.
        // HMAC SHA-256 covers the EXACT raw request bytes. A matching
        // webhook is only a hint to read the current D1 operation and
        // trigger independent exact-head GitHub GET verification.
        if(typeof env.D3_FAST_WEBHOOK_SECRET!=='string'||
          env.D3_FAST_WEBHOOK_SECRET.length<32||
          typeof env.D3_FAST_WAKE_DO?.getByName!=='function')return no(503);
        const receiver=checkWebhookFactory({
          secret:env.D3_FAST_WEBHOOK_SECRET,
          lookupChecking:args=>store.findCheckingByHead(args),
          armWatchdog:async args=>armFast(args.operationId),
          enabled:()=>env.D3_FAST_WEBHOOK_ENABLED==='true'&&
            d3PublishingReady(env),
        });
        try{
          const wake=await receiver.handle(request);
          return new Response(JSON.stringify({ok:true,accepted:wake.accepted}),{
            status:202,headers:{'Cache-Control':'no-store',
              'Content-Type':'application/json; charset=utf-8',
              'X-Content-Type-Options':'nosniff'},
          });
        }catch{return no(401);}
      }
      const transport=requestGitHub??fetch;
      const issuers=createD3SandboxTokenIssuers({
        env,request:transport,
        enabled:()=>env.D3_READ_TOKENS_ENABLED==='true'&&
          env.D3_SANDBOX_REPO_ID===String(ID),
      });
      const grant=issueReadToken??issuers.issueReadToken;
      const mediaEnabled=()=>env.D4_MEDIA_ENABLED==='true'&&
        d3PublishingReady(env);
      const mediaStage=mediaStageFactory({
        origin:env.APP_ORIGIN,session,
        requestGitHub:transport,issueWriteToken:issuers.issueWriteToken,
        secret:env.D2_CSRF_KEY,enabled:mediaEnabled,
      });
      if(mediaRoute)return await mediaStage.handle(request);
      const source=createD3SandboxSnapshotLoader({
        request:transport,issueReadToken:grant,
        enabled:()=>env.D3_READ_TOKENS_ENABLED==='true'&&
          env.D3_SANDBOX_REPO_ID===String(ID),
      });
      const planner=createD3TrustedGearKBCandidate({
        loadSnapshot:source.loadSnapshot,
        enabled:()=>env.D3_READ_TOKENS_ENABLED==='true'&&
          env.D3_SANDBOX_REPO_ID===String(ID),
        verifyMediaTickets:async(pkg,media,options)=>
          validateD4MediaTickets({package:pkg,media,
           verifyTicket:mediaStage.verifyTicket,...options}),
      });
      if(benchmark){
        if(!env.DELIVERY_BENCH_R2?.put||!env.DELIVERY_BENCH_R2?.get)
          return no(503);
        const route=benchmarkRouteFactory({
          origin:env.APP_ORIGIN,ownerSession:session,
          R2:env.DELIVERY_BENCH_R2,D1:env.OPERATIONS_DB,
          enabled:()=>env.D3_BENCHMARK_ENABLED==='true',
        });
        return await route.handle(request);
      }
      if(pilot){
        const route=pilotHostFactory({
          origin:env.APP_ORIGIN,ownerSession:session,
          readBundle:readPilotBundle??(async()=>null),
          expectedSha256:env.D3_PILOT_SHA256??null,
          enabled:()=>env.D3_PILOT_ENABLED==='true',
          integratedEnabled:()=>env.D3_INTEGRATED_PWA_ENABLED==='true',
        });
        return await route.serve(request);
      }
      if(privateTest){
        const proof=hostProofFactory({
          origin:env.APP_ORIGIN,key:env.D2_HOST_PROBE_KEY,
          store,issueReadToken:grant,requestGitHub:transport,
          requestHosted:requestHosted??fetch,
        });
        const asset=hostAssetFactory({
          origin:env.APP_ORIGIN,ownerSession:session,store,
          issueReadToken:grant,requestGitHub:transport,
          authorizeProbe:proof.authorizeProbe,
          enabled:()=>env.D3_TEST_HOST_ENABLED==='true'&&
            env.D3_READ_TOKENS_ENABLED==='true'&&
            env.D3_SANDBOX_REPO_ID===String(ID),
        });
        return await asset.serve(request);
      }
      if(url.pathname==='/api/v3/authoring-source'){
        const reader=sourceReadFactory({
          origin:env.APP_ORIGIN,ownerSession:session,
          loadSnapshot:source.loadSnapshot,
          enabled:()=>env.D3_READ_TOKENS_ENABLED==='true'&&
            env.D3_SANDBOX_REPO_ID===String(ID),
        });
        return await reader.serve(request);
      }
      const api=apiFactory({
        session,store,
        validateCandidate:async({package:pkg,media,repositoryId,ownerGitHubId})=>
          planner.plan({package:pkg,media,repositoryId,ownerGitHubId}),
        mediaEnabled,
        verifyMediaTickets:async(pkg,media,options)=>
          validateD4MediaTickets({package:pkg,media,
            verifyTicket:mediaStage.verifyTicket,...options}),
        // API and scheduler share the same strict readiness policy.
        // A flag-only or partially provisioned runtime never accepts a write.
        enabled:()=>d3PublishingReady(env),
        notifyAccepted:async operationId=>{
          if(env.D3_FAST_WATCHDOG_ENABLED!=='true')return;
          await armFast(operationId);
        },
      });
      return await api.handle(request);
    }catch{return no(503);}
  }
  return Object.freeze({fetch:fetchRequest});
}
export default createD3GatedAuthGateway();
