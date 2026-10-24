/**
 * FISH118 P3-15 — observation-ONLY composition root.
 *
 * Intentionally DOES NOT IMPORT the dispatcher, Git checkout, source promoter,
 * write token, or combined P3-13 runner. This is a source-only module, not an
 * activated Worker, route, cron or deployable configuration.
 *
 * D1 writes are confined to Checking leases and durable CI observations.
 * GitHub HTTP is GET-only after ephemeral App token issuance (POST token mint
 * under the App's sandbox-restricted read grant).
 */
import {createD1CheckLeaseReader} from './d1-check-lease-reader.mjs';
import {createD1CheckObservationStore} from './d1-check-observation-store.mjs';
import {createSandboxCheckObserver} from './sandbox-check-observer.mjs';
import {createSandboxCheckCoordinator} from './sandbox-check-coordinator.mjs';
import {createSandboxCheckReadTokenIssuer} from './sandbox-check-read-token.mjs';

const ID=1430581407;
const validInt=x=>Number.isSafeInteger(x)&&x>0;
export function createReadOnlyP3CheckRunner({
 env,DB,ownerGitHubId,request=fetch,issueCheckReadToken,
 operatorApproved=()=>false,
 now=()=>Math.floor(Date.now()/1000),
 makeLease=()=> 'p3-check-'+crypto.randomUUID(),
 leaseSeconds=60,
}={}){
 if(!env||typeof env!=='object'||typeof DB?.prepare!=='function'||
  !validInt(ownerGitHubId)||typeof request!=='function'||
  (issueCheckReadToken!==undefined&&typeof issueCheckReadToken!=='function')||
  typeof operatorApproved!=='function'||typeof now!=='function'||
  typeof makeLease!=='function')
  throw Error('INVALID_READ_ONLY_RUNNER_CONFIGURATION');
 const enabled=()=>env.P3_WRITE_ENABLED==='false'&&
  env.P3_CHECK_OBSERVATION_ENABLED==='true'&&
  operatorApproved()===true;

 const store=createD1CheckLeaseReader({
  DB,ownerGitHubId,repositoryId:ID,now,leaseSeconds,
 });
 const checkStore=createD1CheckObservationStore({
  DB,ownerGitHubId,repositoryId:ID,now,
 });
 const tokenIssuer=issueCheckReadToken??createSandboxCheckReadTokenIssuer({
  env,request,enabled,
 }).issueCheckReadToken;
 const observer=createSandboxCheckObserver({
  request,issueCheckReadToken:tokenIssuer,enabled,
 });
 const coordinator=createSandboxCheckCoordinator({
  store,checkStore,observer,now,enabled,makeLease,
 });
 return Object.freeze({
  observeCheck:coordinator.checkOnce,
  get:store.get,
  getCheck:checkStore.get,
  checkHistory:checkStore.history,
 });
}
