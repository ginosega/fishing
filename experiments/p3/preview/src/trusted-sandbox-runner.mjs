/**
 * FISH118 P3-13 — source-only trusted Node composition root.
 *
 * Routes NONE of these methods from Cloudflare or HTTP. No deployment or cron.
 * Importing/constructing the runner never calls GitHub or creates D1 rows.
 *
 * A future *trusted* Node scheduler may call observeCheck only after explicit
 * operator enablement. It cannot merge, deploy, update a PR or advance to
 * Merging. The optional createDraftStep is independently disabled by default
 * and requires both env.P3_WRITE_ENABLED=true and trusted operator opt-in.
 */
import {createD1OperationStore} from './d1-operation-store.mjs';
import {createD1CheckObservationStore} from './d1-check-observation-store.mjs';
import {createSandboxDispatcher} from './sandbox-dispatcher.mjs';
import {createSandboxCheckCoordinator} from './sandbox-check-coordinator.mjs';
import {createSandboxCheckObserver} from './sandbox-check-observer.mjs';
import {createSandboxCheckReadTokenIssuer} from './sandbox-check-read-token.mjs';

const ID=1430581407;
const isInt=n=>Number.isSafeInteger(n)&&n>0;
const fail=()=>{throw Error('INVALID_TRUSTED_RUNNER_CONFIGURATION');};
export function createTrustedSandboxRunner({
 env,DB,ownerGitHubId,guard,
 trustedCheckout,releaseCheckout,sourceAware,readMainSha,
 issueWriteToken,writeRequest,
 readRequest=writeRequest,issueCheckReadToken,
 allowSandboxWrites=()=>false,allowCheckObservation=()=>false,
 now=()=>Math.floor(Date.now()/1000),
 makeId=()=> 'p3_'+crypto.randomUUID(),
 makeDraftLease=()=> 'p3-draft-'+crypto.randomUUID(),
 makeCheckLease=()=> 'p3-check-'+crypto.randomUUID(),
}={}){
 if(!env||typeof env!=='object'||!DB?.prepare||!DB?.batch||
  !isInt(ownerGitHubId)||typeof guard?.authorize!=='function'||
  typeof trustedCheckout!=='function'||typeof releaseCheckout!=='function'||
  typeof sourceAware?.promote!=='function'||typeof readMainSha!=='function'||
  typeof issueWriteToken!=='function'||typeof writeRequest!=='function'||
  typeof readRequest!=='function'||typeof allowSandboxWrites!=='function'||
  typeof allowCheckObservation!=='function'||typeof now!=='function'||
  typeof makeId!=='function'||typeof makeDraftLease!=='function'||
  typeof makeCheckLease!=='function'||(issueCheckReadToken!==undefined&&
  typeof issueCheckReadToken!=='function'))fail();

 const publishAllowed=()=>env.P3_WRITE_ENABLED==='true'&&
  allowSandboxWrites()===true;
 const observeAllowed=()=>env.P3_WRITE_ENABLED==='false'&&
  env.P3_CHECK_OBSERVATION_ENABLED==='true'&&
  allowCheckObservation()===true;

 const store=createD1OperationStore({
  DB,ownerGitHubId,repositoryId:ID,now,makeId,
 });
 const checkStore=createD1CheckObservationStore({
  DB,ownerGitHubId,repositoryId:ID,now,
 });
 const dispatcher=createSandboxDispatcher({
  guard,store,trustedCheckout,releaseCheckout,sourceAware,readMainSha,
  issueToken:issueWriteToken,githubFetch:writeRequest,
  publishingGate:publishAllowed,makeLease:makeDraftLease,
 });
 const tokenIssuer=issueCheckReadToken??createSandboxCheckReadTokenIssuer({
  env,request:readRequest,enabled:observeAllowed,
 }).issueCheckReadToken;
 const observer=createSandboxCheckObserver({
  request:readRequest,issueCheckReadToken:tokenIssuer,
  enabled:observeAllowed,
 });
 const coordinator=createSandboxCheckCoordinator({
  store,checkStore,observer,now,enabled:observeAllowed,
  makeLease:makeCheckLease,
 });
 async function observeCheck(operationId){
  // Not tied to the write-flag or publication entry point.
  // A disabled observation cannot request a token or claim a D1 lease.
  return coordinator.checkOnce(operationId);
 }
 return Object.freeze({
  accept:dispatcher.accept,
  createDraftStep:dispatcher.step,
  observeCheck,
  // Expose owner-scoped status only; never expose tokens, checkout,
  // unscoped D1 queries, branch mutation, merge or deployment interfaces.
  get:store.get,
  getCheck:checkStore.get,
  checkHistory:checkStore.history,
 });
}
