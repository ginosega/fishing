import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{createWorker} from '../src/worker.mjs';
import dashboardWorker from '../worker-dashboard-paste.mjs';
import {GitHubProbeError} from '../src/github-app-readonly.mjs';
const ORIGIN='https://fishing-p3-sandbox-preview.example.workers.dev';
const env=()=>({APP_ORIGIN:ORIGIN,DB:{prepare(sql){assert.equal(sql,'SELECT 1 AS alive');return {first:async()=>({alive:1})}}}});
const send=(path,config={})=>worker.fetch(new Request(ORIGIN+path,config),env());

test('P3-I01 health succeeds only with sandbox D1 and stays not ready for publishing',async()=>{
 const r=await send('/health');assert.equal(r.status,200);
 assert.deepEqual(await r.json(),{ok:true,ready:false,mode:'preview-no-publishing'});
 assert.equal(r.headers.get('Cache-Control'),'no-store');
});
test('P3-I02 anonymous session always returns no publishing authority',async()=>{
 const r=await send('/session',{headers:{Cookie:'__Host-fish_p0_session=fake',Authorization:'Bearer bad'}});
 assert.equal(r.status,200);assert.deepEqual(await r.json(),{authenticated:false,authorized:false});
});
test('P3-I03 publication, operation, auth and sign-out routes never permit use',async()=>{
 for(const path of ['/publications','/publications/123','/operations/123','/auth/start','/session/revoke-all']){
  const response=await send(path,{method:'POST',body:'{"repo":"ginosega/fishing"}'});
  assert.equal(response.status,503,path);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
 }
});
test('P3-I04 missing/misconfigured DB or origin fails closed',async()=>{
 for(const altered of [{...env(),DB:undefined},{...env(),APP_ORIGIN:'https://other.invalid'},{...env(),DB:{prepare(){throw Error('secret DB failure')}}}]){
  const r=await worker.fetch(new Request(ORIGIN+'/health'),altered);
  assert.equal(r.status,503);
  assert.doesNotMatch(await r.text(),/secret/);
 }
});
test('P3-I05 method and hostname restrictions',async()=>{
 assert.equal((await send('/health',{method:'POST'})).status,405);
 assert.equal((await worker.fetch(new Request('https://attacker.example/health'),env())).status,503);
 assert.equal((await send('/arbitrary')).status,404);
});


const KEY='test-only-locally-generated-diagnostic-key-123456789';
const probeEnv=()=>({...env(),P3_WRITE_ENABLED:'false',P3_DIAGNOSTIC_KEY:KEY});
const probeReq=(method='POST',key=KEY)=>new Request(ORIGIN+'/_internal/verify-sandbox',{
 method,headers:{'X-P3-Diagnostic-Key':key},
});
const confirmed={verified:true,repository:'ginosega/fishing-p3-sandbox',
 repositoryId:1430581407,tokenScope:'contents:read',publishingEnabled:false};
test('P3-I06 diagnostic remains disabled without temporary secret or with wrong method',async()=>{
 let invoked=0;
 const sentinel=createWorker({verify:async()=>{invoked++;return confirmed;}});
 assert.equal((await sentinel.fetch(probeReq(),{...probeEnv(),P3_DIAGNOSTIC_KEY:undefined})).status,403);
 assert.equal((await sentinel.fetch(probeReq('GET'),probeEnv())).status,404);
 assert.equal((await sentinel.fetch(probeReq('POST','incorrect-guess-not-the-secret-123456'),probeEnv())).status,403);
 assert.equal(invoked,0);
});
test('P3-I07 read-only proof reveals only fixed nonsecret repository metadata',async()=>{
 let calls=0;
 const sentinel=createWorker({verify:async()=>{calls++;return confirmed;}});
 const r=await sentinel.fetch(probeReq(),probeEnv());
 assert.equal(r.status,200);
 assert.deepEqual(await r.json(),{
  verified:true,repository:'ginosega/fishing-p3-sandbox',
  repositoryId:1430581407,tokenScope:'contents:read',publishingEnabled:false
 });
 assert.equal(calls,1);
 assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
 assert.equal(r.headers.get('Cache-Control'),'no-store');
});
test('P3-I08 requires exact disabled-publishing flag before any proof',async()=>{
 let calls=0;
 const sentinel=createWorker({verify:async()=>{calls++;return confirmed;}});
 for(const value of ['true','',undefined]){
  const vars={...probeEnv(),P3_WRITE_ENABLED:value};
  assert.equal((await sentinel.fetch(probeReq(),vars)).status,503);
 }
 assert.equal(calls,0);
});
test('P3-I09 failed GitHub request or mismatched repository identity fails closed',async()=>{
 for(const verifier of [
  async()=>{throw Error('secret private key must never appear in response');},
  async()=>({...confirmed,repository:'ginosega/fishing'}),
  async()=>({...confirmed,repositoryId:1350909744}),
  async()=>({...confirmed,tokenScope:'contents:write'}),
 ]){
  const sentinel=createWorker({verify:verifier});
  const r=await sentinel.fetch(probeReq(),probeEnv());
  assert.equal(r.status,503);
  assert.doesNotMatch(await r.text(),/secret private key|token|1350909744/);
 }
});
test('P3-I10 full publishing endpoints remain disabled even with correct diagnostic secret',async()=>{
 const sentinel=createWorker({verify:async()=>confirmed});
 for(const pathname of ['/publications','/operations/op123','/auth/start','/session/revoke-all']){
  const req=new Request(ORIGIN+pathname,{
   method:'POST',headers:{'X-P3-Diagnostic-Key':KEY},
  });
  assert.equal((await sentinel.fetch(req,probeEnv())).status,503);
 }
});

test('P3-I11 single-file dashboard worker preserves same deny-by-default behavior',async()=>{
 const health=await dashboardWorker.fetch(new Request(ORIGIN+'/health'),env());
 assert.equal(health.status,200);
 const anon=await dashboardWorker.fetch(new Request(ORIGIN+'/session'),env());
 assert.deepEqual(await anon.json(),{authenticated:false,authorized:false});
 const noProof=await dashboardWorker.fetch(probeReq(),probeEnv());
 assert.equal(noProof.status,503,'real App credentials absent in synthetic environment');
 const unauthorized=await dashboardWorker.fetch(probeReq('POST','wrong diagnostic value 123456789012345'),probeEnv());
 assert.equal(unauthorized.status,403);
 assert.equal((await dashboardWorker.fetch(new Request(ORIGIN+'/publications',{method:'POST'}),probeEnv())).status,503);
});

test('P3-I12 authorized diagnostics distinguish write flag and GitHub stage without leaking credentials',async()=>{
 const withWrongFlag={...probeEnv(),P3_WRITE_ENABLED:'TRUE'};
 const notVerified=createWorker({verify:async()=>{throw Error('must not enter network');}});
 const a=await notVerified.fetch(probeReq(),withWrongFlag);
 assert.equal(a.status,503);
 assert.equal((await a.json()).code,'write_flag_not_false');
 const broken=createWorker({verify:async()=>{throw new GitHubProbeError('installation_token_http_401');}});
 const b=await broken.fetch(probeReq(),probeEnv());
 assert.equal(b.status,503);
 assert.deepEqual(await b.json(),{ok:false,ready:false,code:'installation_token_http_401'});
 const missingSecret=await broken.fetch(probeReq(),{...probeEnv(),P3_DIAGNOSTIC_KEY:undefined});
 assert.equal(missingSecret.status,403);
 assert.deepEqual(await missingSecret.json(),{error:'Forbidden'});
});
