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
const ID=1430581407,OWNER=265665562;
const on=v=>v==='true';
const runEnabled=env=>env?.D3_SANDBOX_REPO_ID===String(ID)&&
 on(env.D3_WRITE_ENABLED)&&on(env.D3_RUNNER_ENABLED)&&
 on(env.D3_READ_TOKENS_ENABLED)&&
 env.DB?.prepare&&env.OPERATIONS_DB?.prepare&&
 env.OPERATIONS_DB?.batch&&
 typeof env.APP_ORIGIN==='string'&&env.APP_ORIGIN.startsWith('https://')&&
 typeof env.D2_CSRF_KEY==='string'&&env.D2_CSRF_KEY.length>=32&&
 typeof env.D3_HOST_PROBE_KEY==='string'&&env.D3_HOST_PROBE_KEY.length>=32&&
 Number(env.OWNER_GITHUB_ID)===OWNER;
export function createD3LiveOwnerWorker({
 route=gateway,requestGitHub=fetch,requestHosted=fetch,
 onScheduledFailure=()=>{},
}={}){
 if(typeof route?.fetch!=='function'||typeof requestGitHub!=='function'||
  typeof requestHosted!=='function'||typeof onScheduledFailure!=='function')
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
   const proof=createD3PrivateHostProof({
    origin:env.APP_ORIGIN,key:env.D3_HOST_PROBE_KEY,
    store,issueReadToken,requestGitHub,requestHosted,
   });
   return createD3SandboxScheduledCoordinator({
    env,store,requestGitHub,issueReadToken,issueWriteToken,
    verifyHosted:info=>proof.verifyHosted(info),
   }).tick();
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
