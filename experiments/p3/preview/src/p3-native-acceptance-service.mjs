/**
 * FISH118 P3-23 — SOURCE ONLY: native D1 atomic command acceptance composition.
 * Never import into the live Worker / route without a separate deployment gate.
 * No Git checkout, GitHub App credentials, PR write, merge or publish methods.
 */
import {createP3InternalCommandGate} from './p3-internal-command-gate.mjs';
import {createP3D1CommandNonceStore} from './p3-command-nonce-store.mjs';
import {createD1OperationStore} from './d1-operation-store.mjs';

const REPOSITORY_ID=1430581407;
const ORIGIN='https://fishing-p3-sandbox-preview.ginosega.workers.dev';
const ownerPattern=/^[1-9][0-9]{0,15}$/;
export function createP3NativeAcceptanceService({
 env,operatorApproved=()=>false,now=()=>Date.now(),
 makeId=()=> 'p3_'+crypto.randomUUID(),
}={}){
 if(!env||typeof env!=='object'||env.APP_ORIGIN!==ORIGIN||
   typeof env.DB?.prepare!=='function'||typeof env.DB?.batch!=='function'||
   typeof operatorApproved!=='function'||typeof now!=='function'||
   typeof makeId!=='function'||!ownerPattern.test(env.P3_OWNER_GITHUB_ID??''))
  throw Error('INVALID_NATIVE_ACCEPTANCE_CONFIGURATION');
 const ownerGitHubId=Number(env.P3_OWNER_GITHUB_ID);
 if(!Number.isSafeInteger(ownerGitHubId)||ownerGitHubId<=0)
  throw Error('INVALID_NATIVE_ACCEPTANCE_CONFIGURATION');
 // Both dependencies bind the same trusted owner and exact sandbox repo.
 const nonce=createP3D1CommandNonceStore({DB:env.DB,ownerGitHubId,now});
 const store=createD1OperationStore({
  DB:env.DB,ownerGitHubId,repositoryId:REPOSITORY_ID,
  now:()=>Math.floor(now()/1000),makeId,
 });
 const gate=createP3InternalCommandGate({
  env,ownerGitHubId,operatorApproved,now,
  consumeNonce:nonce.consumeNonce,
  acceptSnapshot:({idempotencyKey,snapshot,
   ownerGitHubId:claimedOwner,repositoryId})=>{
   if(claimedOwner!==ownerGitHubId||repositoryId!==REPOSITORY_ID)
    throw Error('INVALID_NATIVE_OWNER_CONTEXT');
   // Native Worker DB.batch() atomically inserts the Accepted operation and
   // exact canonical snapshot. Nonce consumption is individually durable and
   // intentionally occurs first; a failed acceptance needs a fresh nonce.
   return store.accept({idempotencyKey,snapshot});
  },
 });
 // No status/query/write-token/merge/deploy/PR constructor is reachable here.
 return Object.freeze({handle:gate.handle});
}
