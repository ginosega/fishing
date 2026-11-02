/**
 * FISH118 D3: candidate single-origin Cloudflare Worker entrypoint.
 * SOURCE ONLY: NOT DEPLOYED, NO CRON INSTALLED, ALL D3 FLAGS DEFAULT OFF.
 * Never changes or reactivates parked D2 Worker. No GitHub App secret is
 * embedded in this code, client assets, Actions or any browser response.
 *
 * One HTTPS origin serves immutable public V2 Pages proxy plus owner-only
 * isolated Gear/KB authoring; the private sandbox test host is not public
 * canonical content. Final V3 public cutover remains separately gated.
 */
import gateway from './d3-gated-auth-gateway.mjs';
import {createD1OperationStore} from './d1-operation-store.mjs';
import {createD3SandboxTokenIssuers} from './d3-sandbox-token-issuers.mjs';
import {createD3SandboxScheduledCoordinator}
 from './d3-sandbox-scheduled-coordinator.mjs';
import {createD3PrivateHostProof} from './d3-private-host-proof.mjs';
import {d3PublishingReady} from './d3-publishing-readiness.mjs';
import {createD3HostedMediaVerifier} from './d3-hosted-media-verifier.mjs';
const ID=1430581407,OWNER=265665562;
const OP=/^p3_[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
const pending=new Set(['Accepted','Validating','Checking','Merging','Deploying','Verifying']);
const runEnabled=d3PublishingReady;
export function createD3LiveOwnerWorker({
 route=gateway,requestGitHub=fetch,requestHosted=fetch,
 onScheduledFailure=()=>{},
 coordinatorFactory=createD3SandboxScheduledCoordinator,
}={}){
 if(typeof route?.fetch!=='function'||typeof requestGitHub!=='function'||
  typeof requestHosted!=='function'||typeof onScheduledFailure!=='function'||
 typeof coordinatorFactory!=='function')
  throw Error('D3 Worker dependencies invalid');
 async function scheduled(event,env,ctx){
  // Never start merely because a Cron was accidentally attached. Every
  // security feature flag, exact repo and owner D1 gate must be true.
  if(!runEnabled(env))return;
  const run=async()=>{
   const store=createD1OperationStore({
    DB:env.OPERATIONS_DB,ownerGitHubId:OWNER,repositoryId:ID,
   });
   const {issueReadToken,issueWriteToken}=createD3SandboxTokenIssuers({
    env,request:requestGitHub,
    enabled:()=>runEnabled(env),
   });
   const verifyMedia=createD3HostedMediaVerifier({
    origin:env.APP_ORIGIN,secret:env.D2_CSRF_KEY,
    enabled:()=>env.D4_MEDIA_ENABLED==='true',
   });
   const proof=createD3PrivateHostProof({
    origin:env.APP_ORIGIN,key:env.D2_HOST_PROBE_KEY,
    store,issueReadToken,requestGitHub,requestHosted,verifyMedia,
   });
   const result=await coordinatorFactory({
    env,store,requestGitHub,issueReadToken,issueWriteToken,
    verifyHosted:info=>proof.verifyHosted(info),
   }).tick();
   // Cron is the conservative fallback if a prior Durable Object alarm
   // failed (e.g. exact merged-receipt proof was temporarily rejected).
   // A successful Cron state transition must restart fast per-operation
   // progression rather than leaving each subsequent stage to the next
   // five-minute scan. The DO only wakes the existing D1 coordinator;
   // it never performs a separate GitHub merge or changes authority.
   if(env.D3_FAST_WATCHDOG_ENABLED==='true'&&result?.progressed===true&&
      result.state!=='Live'&&result.state!=='Conflict'&&result.state!=='Failed'){
    if(!OP.test(result.operationId??'')||!pending.has(result.state)||
       typeof env.D3_FAST_WAKE_DO?.getByName!=='function'){
     const error=Error('D3 Cron fast wake unavailable');
     error.code='D3_FAST_REARM_UNAVAILABLE';throw error;
    }
    const stub=env.D3_FAST_WAKE_DO.getByName(result.operationId);
    let response;
    try{
     response=await stub.fetch(new Request('https://d3-fast.internal/arm',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({operationId:result.operationId,deadlineMs:Date.now()}),
     }));
    }catch{}
    if(response?.status!==200){
     const error=Error('D3 Cron fast wake not acknowledged');
     error.code='D3_FAST_REARM_UNCERTAIN';throw error;
    }
   }
   return result;
  };
  const task=run().catch(error=>{
   const code=typeof error?.code==='string'&&
    /^[A-Z0-9_]{3,64}$/.test(error.code)?
    error.code:'INTERNAL_FAILURE';
   try{onScheduledFailure(code);}catch{}
   console.error('FISH118_D3_SCHEDULED_FAILURE',code);
   throw Error('D3_SCHEDULED_FAILURE');
  });
  if(typeof ctx?.waitUntil==='function')ctx.waitUntil(task);
  else await task;
 }
 return Object.freeze({
  fetch:(request,env,ctx)=>route.fetch(request,env,ctx),
  scheduled,
 });
}
export default createD3LiveOwnerWorker();
