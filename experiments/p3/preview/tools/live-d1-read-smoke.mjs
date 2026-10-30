#!/usr/bin/env node
/**
 * P3-19 trusted GitHub Actions read-only transport smoke.
 * Runs ONLY from the private sandbox workflow. No persistence, GitHub write,
 * publishing Worker route, JWT mint, D1 migration or SQL statement supplied
 * from the environment or workflow_dispatch inputs.
 */
import {createP3ReadOnlyD1REST} from '../src/d1-rest-readonly.mjs';
import {createD1CheckLeaseReader} from '../src/d1-check-lease-reader.mjs';
import {createD1CheckObservationStore} from '../src/d1-check-observation-store.mjs';

const assert=(yes,reason)=>{if(!yes)throw Error(reason);};
async function main(){
 assert(process.env.GITHUB_REPOSITORY==='ginosega/fishing-p3-sandbox'&&
   process.env.GITHUB_REF==='refs/heads/main'&&
   ['push','workflow_dispatch'].includes(process.env.GITHUB_EVENT_NAME),
   'WRONG_TRUSTED_RUN_CONTEXT');
 const token=process.env.P3_D1_CLOUDFLARE_TOKEN;
 const accountId=process.env.P3_D1_CLOUDFLARE_ACCOUNT_ID;
 const databaseId=process.env.P3_D1_SANDBOX_UUID;
 const DB=await createP3ReadOnlyD1REST({apiToken:token,accountId,databaseId});
 const ownerGitHubId=265665562; // GitHub user ID, not a credential
 const operationId='p3_00000000-0000-4000-8000-000000000000'; // read-only absent sentinel
 const lease=createD1CheckLeaseReader({DB,ownerGitHubId});
 const observations=createD1CheckObservationStore({DB,ownerGitHubId});
 assert(await lease.get(operationId)===null,'UNEXPECTED_SENTINEL_OPERATION');
 assert(await observations.get(operationId)===null,'UNEXPECTED_SENTINEL_OBSERVATION');
 const history=await observations.history(operationId);
 assert(Array.isArray(history)&&history.length===0,'UNEXPECTED_SENTINEL_HISTORY');
 const origin='https://fishing-p3-sandbox-preview.ginosega.workers.dev';
 const [healthResponse,sessionResponse]=await Promise.all([
   fetch(origin+'/health'),fetch(origin+'/session'),
 ]);
 assert(healthResponse.ok&&sessionResponse.ok,'WORKER_PUBLIC_READ_FAILED');
 const [health,session]=await Promise.all([
   healthResponse.json(),sessionResponse.json(),
 ]);
 assert(health.ok===true&&health.ready===false&&
   health.mode==='preview-no-publishing'&&
   session.authenticated===false&&session.authorized===false,
   'SANDBOX_PUBLISHING_NOT_DISABLED');
 console.log('PASS: GitHub Actions trusted Node direct D1 read-only owner-scoped adapter executed three queries on isolated sandbox; all synthetic sentinel rows absent; preview Worker disabled/anonymous.');
}
main().catch(error=>{
 // Deliberately do not echo provider errors/credentials/headers/IDs.
 console.error('STOP: P3 trusted live read-only smoke failed; review action step (private details redacted).');
 process.exitCode=1;
});
