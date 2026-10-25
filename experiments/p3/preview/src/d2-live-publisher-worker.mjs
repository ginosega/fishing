/**
 * FISH118 D2 approved, private-sandbox ONLY Cloudflare entrypoint.
 * This file is not a deployment. Its fetch route uses the existing
 * AUTH-P0 same-origin gateway, and its scheduled() method advances at most
 * ONE accepted D1 operation. Both paths deny writes until explicit flags.
 *
 * Do not mount on the historical static-disabled P3 ingress/bridge Workers.
 * Do not give this Worker a GitHub App installation for public fishing main.
 * App PEM, OAuth client secret, CSRF and host proof key are encrypted bindings.
 */
import gateway from './d2-gated-auth-gateway.mjs';
import {createD1OperationStore} from './d1-operation-store.mjs';
import {createD2SandboxScheduledCoordinator} from './d2-sandbox-scheduled-coordinator.mjs';
import {createD2SandboxReadTokenIssuer} from './d2-sandbox-read-token.mjs';
import {createSandboxWriteTokenIssuer} from './sandbox-write-token.mjs';
import {createD2SandboxHostProof} from './d2-sandbox-host-proof.mjs';
const ID=1430581407;
const truth=v=>v==='true';
const active=env=>env?.D2_SANDBOX_REPO_ID===String(ID)&&
 truth(env.D2_RUNNER_ENABLED)&&truth(env.D2_WRITE_ENABLED)&&
 truth(env.D2_READ_TOKENS_ENABLED)&&truth(env.D2_TEST_HOST_ENABLED)&&
 env.DB?.prepare&&env.OPERATIONS_DB?.prepare&&env.OPERATIONS_DB?.batch&&
 typeof env.APP_ORIGIN==='string'&&
 typeof env.D2_CSRF_KEY==='string'&&env.D2_CSRF_KEY.length>=32&&
 typeof env.D2_HOST_PROBE_KEY==='string'&&env.D2_HOST_PROBE_KEY.length>=32&&
 /^[1-9]\d*$/.test(String(env.OWNER_GITHUB_ID))&&
 Number(env.OWNER_GITHUB_ID)===265665562;
/**
 * The GitHub App private key NEVER belongs to a client or GitHub Actions.
 * Keep this scope adapter server-local, not exposed over HTTP.
 */
function privateWriteIssuer(env,request){
 const issuer=createSandboxWriteTokenIssuer({
  env:{
   P3_GITHUB_APP_ID:env.D2_GITHUB_APP_ID,
   P3_GITHUB_INSTALLATION_ID:env.D2_GITHUB_INSTALLATION_ID,
   P3_GITHUB_PRIVATE_KEY:env.D2_GITHUB_APP_PRIVATE_KEY,
   P3_WRITE_ENABLED:env.D2_WRITE_ENABLED,
  },
  request,
  enabled:()=>active(env),
 });
 return issuer.issueToken;
}
export function createD2LivePublisherWorker({
 route=gateway,
 requestGitHub=fetch,
 requestHosted=fetch,
 onScheduledFailure=()=>{},
}={}){
 if(typeof route?.fetch!=='function'||typeof requestGitHub!=='function'||
  typeof requestHosted!=='function'||typeof onScheduledFailure!=='function')
  throw Error('D2 Worker dependencies invalid');
 async function scheduled(event,env,ctx){
  // The old static ingress and browser have NO scheduled/tick HTTP endpoint.
  if(!active(env))return;
  const run=async()=>{
   const store=createD1OperationStore({
    DB:env.OPERATIONS_DB,ownerGitHubId:265665562,repositoryId:ID,
   });
   const reads=createD2SandboxReadTokenIssuer({
    env,request:requestGitHub,
    enabled:()=>active(env),
   }).issueReadToken;
   const proof=createD2SandboxHostProof({
    origin:env.APP_ORIGIN,key:env.D2_HOST_PROBE_KEY,store,
    issueReadToken:reads,requestGitHub,requestHosted,
   });
   const c=createD2SandboxScheduledCoordinator({
    env,store,requestGitHub,issueReadToken:reads,
    issueWriteToken:privateWriteIssuer(env,requestGitHub),
    verifyHosted:info=>proof.verifyHosted(info),
   });
   return c.tick();
  };
  // Cron receives a synchronous waitUntil and cannot enqueue arbitrary work.
  // Failure keeps D1 in a recoverable/unknown state, never claims Live.
  const task=run().catch(e=>{
   onScheduledFailure(typeof e?.code==='string'?e.code:'INTERNAL_FAILURE');
  });
  if(typeof ctx?.waitUntil==='function')ctx.waitUntil(task);
  else await task;
 }
 return Object.freeze({
  fetch:(request,env,ctx)=>route.fetch(request,env,ctx),
  scheduled,
 });
}
export default createD2LivePublisherWorker();
