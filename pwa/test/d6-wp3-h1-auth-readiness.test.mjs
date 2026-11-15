import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createD6Wp3H1ReadOnlyWorker}
 from '../server/d6-wp3-h1-read-only-worker.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const read=async name=>JSON.parse(await readFile(path.resolve(here,'..',name),'utf8'));
const origin='https://fishing-v3-wp3-test.ginosega.workers.dev';
const switched=Object.freeze([
 'D6_SESSION_ENABLED','D6_OAUTH_ENABLED','D6_SOURCE_ENABLED',
 'D6_READ_TOKEN_ENABLED','D6_SIGNER_ENABLED','D6_SIGNOUT_ENABLED',
]);
const blocked=Object.freeze([
 'D6_WP3_RUNTIME_ENABLED','D6_WP3_WRITE_ENABLED',
 'D6_WP3_MOUNT_ENABLED','D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED',
]);

test('WP3-H1AUTH01 candidate changes only six read/auth capability flags, not deployed config',async()=>{
 const deployed=await read('wrangler.wp3-h1.jsonc');
 const candidate=await read('wrangler.wp3-h1-auth-candidate.jsonc');
 const expected=JSON.parse(JSON.stringify(deployed));
 for(const k of switched){
  assert.equal(deployed.vars[k],'false','deployed H1 must stay off: '+k);
  expected.vars[k]='true';
 }
 assert.deepEqual(candidate,expected,'candidate must be an exact six-flag delta');
 assert.equal(candidate.name,'fishing-v3-wp3-test');
 assert.equal(candidate.main,'./server/d6-wp3-h1-read-only-worker.mjs');
 assert.equal(candidate.vars.D6_ORIGIN,origin);
 assert.equal(candidate.vars.D6_HOSTED_PREFLIGHT_ENABLED,'false');
 for(const k of blocked){
  assert.equal(deployed.vars[k],'false');
  assert.equal(candidate.vars[k],'false');
 }
 for(const [k,v] of Object.entries(candidate.vars)){
  assert.equal(typeof v,'string','only literal trusted Wrangler values: '+k);
  assert(!/PRIVATE_KEY|CLIENT_SECRET|CSRF_KEY|APP_ID|INSTALLATION_ID|MEDIA_TICKET_SECRET/.test(k),
   'provider credential must not be committed: '+k);
 }
 for(const k of ['routes','route','triggers','services','assets','kv_namespaces','r2_buckets']){
  assert.equal(candidate[k],undefined,'candidate must not add provider resource: '+k);
 }
});

test('WP3-H1AUTH02 candidate cannot unlock operation/media routes with or without credentials',async()=>{
 const c=await read('wrangler.wp3-h1-auth-candidate.jsonc');
 let outbound=0;
 const worker=createD6Wp3H1ReadOnlyWorker({
  network:async()=>{outbound++;throw Error('external provider must never be called');},
 });
 for(const p of ['/api/v3/operations','/api/v3/operations/test-id/begin',
  '/api/v3/media','/api/v3/media/reconcile']){
  for(const method of ['GET','POST','PATCH']){
   const response=await worker.fetch(new Request(origin+p,{method}),{...c.vars});
   assert.equal(response.status,404,p+' '+method);
  }
 }
 assert.equal(outbound,0);
 for(const name of blocked){
  const env={...c.vars,[name]:'true'};
  const response=await worker.fetch(new Request(origin+'/fishing/release.json'),env);
  assert.equal(response.status,503,'illegal writer flag must shut down: '+name);
 }
 assert.equal(outbound,0);
});

test('WP3-H1AUTH03 no secrets means OAuth start denies before D1 or provider use',async()=>{
 const c=await read('wrangler.wp3-h1-auth-candidate.jsonc');
 let providerCalls=0;
 const worker=createD6Wp3H1ReadOnlyWorker({
  network:async()=>{providerCalls++;throw Error('no provider grant');},
 });
 const request=new Request(origin+'/auth/start',{
  headers:{'Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document',
   'Sec-Fetch-Site':'same-origin'},
 });
 const response=await worker.fetch(request,{...c.vars});
 assert.equal(response.status,503);
 assert.equal(providerCalls,0);
});
