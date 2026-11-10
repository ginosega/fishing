import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import workerDefault,{createD6DisabledProductionWorker,
 D6_WORKER_CANDIDATE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-disabled-worker.mjs';

const ORIGIN='https://fishing.ginosega.workers.dev';
const request=(path,init={})=>new Request(ORIGIN+path,init);
const enabled={
 D6_WORKER_ENTRY_ENABLED:'true',
 D6_PRODUCTION_ENABLED:'true',
 D6_GATEWAY_ENABLED:'true',
 D6_ORIGIN:ORIGIN,
 D6_OWNER_GITHUB_ID:'265665562',
 D6_REPOSITORY_ID:'1350909744',
};
const secure=(changes={})=>({...enabled,...changes});
function make(){
 const calls=[],worker=createD6DisabledProductionWorker({
  network:async(url,options)=>{
   calls.push({url,options});
   if(url.startsWith('https://ginosega.github.io/fishing/'))
    return new Response('verified-static-bytes',{status:200,headers:{
     'Content-Type':'application/json',
     'Set-Cookie':'upstream=unsafe',
     'Access-Control-Allow-Origin':'*',
    }});
   throw Error('Sensitive provider error: test-only-private-key');
  },
  now:()=>2000000000,
 });
 return {worker,calls};
}
test('D6-ENTRY01 import is disabled even with secrets present',async()=>{
 const {worker,calls}=make();
 const env=secure({
  D6_WORKER_ENTRY_ENABLED:undefined,
  D6_STATIC_ENABLED:'true',
  D6_SESSION_ENABLED:'true',
  D6_OAUTH_ENABLED:'true',
  D6_SOURCE_ENABLED:'true',
  D6_READ_TOKEN_ENABLED:'true',
  D6_SIGNER_ENABLED:'true',
  D6_GITHUB_APP_PRIVATE_KEY:'must-not-leak-test-secret',
  D6_OAUTH_CLIENT_SECRET:'must-not-leak-test-secret',
 });
 for(const url of ['/','/fishing/release.json','/session',
  '/auth/start','/auth/callback?code=test','/api/v3/authoring-source']){
  const result=await worker.fetch(request(url),env);
  assert.equal(result.status,503);
  assert.equal((await result.json()).error,'TEMPORARILY_UNAVAILABLE');
 }
 assert.equal(calls.length,0);
 assert(Object.isFrozen(worker));
 assert.deepEqual(Object.keys(worker),['fetch']);
 assert.equal(D6_WORKER_CANDIDATE_ORIGIN,ORIGIN);
});
test('D6-ENTRY02 default exported Worker stays disabled without environment',async()=>{
 assert.equal((await workerDefault.fetch(request('/fishing/'))).status,503);
 assert.equal((await workerDefault.fetch(request('/auth/start'),{})).status,503);
 assert(Object.isFrozen(workerDefault));
});
test('D6-ENTRY03 entry alone cannot override global production kill switch',async()=>{
 const {worker,calls}=make();
 const env=secure({
  D6_PRODUCTION_ENABLED:'false',D6_STATIC_ENABLED:'true',
 });
 assert.equal((await worker.fetch(request('/fishing/release.json'),env)).status,503);
 assert.equal(calls.length,0);
});
test('D6-ENTRY04 exact owner/repository/origin pins are required',async()=>{
 for(const config of [
  {D6_OWNER_GITHUB_ID:'265665563'},
  {D6_REPOSITORY_ID:'1430581407'},
  {D6_ORIGIN:'https://evil.invalid'},
  {D6_PRODUCTION_ENABLED:true},
 ]){
  const {worker,calls}=make();
  const env=secure({D6_STATIC_ENABLED:'true',...config});
  assert.equal((await worker.fetch(request('/fishing/release.json'),env)).status,503);
  assert.equal(calls.length,0);
 }
});
test('D6-ENTRY05 request-host or Origin mismatch cannot reach network or D1',async()=>{
 const {worker,calls}=make();
 const env=secure({D6_STATIC_ENABLED:'true'});
 for(const req of [
  new Request('https://evil.invalid/fishing/release.json'),
  request('/fishing/release.json',{headers:{Origin:'https://evil.invalid'}}),
  request('/fishing/release.json',{headers:{'Sec-Fetch-Site':'cross-site'}}),
 ]){
  const result=await worker.fetch(req,env);
  assert([403,404].includes(result.status));
 }
 assert.equal(calls.length,0);
});
test('D6-ENTRY06 allowlisted anonymous static reads only if BOTH gates enabled',async()=>{
 const {worker,calls}=make();
 assert.equal((await worker.fetch(request('/fishing/release.json'),
  secure())).status,503);
 assert.equal(calls.length,0);
 const result=await worker.fetch(request('/fishing/release.json'),
  secure({D6_STATIC_ENABLED:'true'}));
 assert.equal(result.status,200);
 assert.equal(await result.text(),'verified-static-bytes');
 assert.equal(result.headers.get('Set-Cookie'),null);
 assert.equal(result.headers.get('Access-Control-Allow-Origin'),null);
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,'https://ginosega.github.io/fishing/release.json');
 assert.equal(calls[0].options.credentials,'omit');
 assert.equal(calls[0].options.redirect,'manual');
});
test('D6-ENTRY07 OAuth/source and write remain denied in static-only mode',async()=>{
 const {worker,calls}=make();
 const env=secure({D6_STATIC_ENABLED:'true'});
 for(const path of ['/auth/start','/auth/callback','/session',
  '/api/v3/authoring-source']){
  assert.equal((await worker.fetch(request(path),env)).status,503);
 }
 for(const path of ['/api/v3/operations','/api/v3/media',
  '/session/signout','/session/revoke-all']){
  assert.equal((await worker.fetch(request(path,{method:'POST',
   headers:{Origin:ORIGIN,'Sec-Fetch-Site':'same-origin'}}),env)).status,404);
 }
 assert.equal(calls.length,0);
});
test('D6-ENTRY08 POST to static path cannot become a publisher',async()=>{
 const {worker,calls}=make();
 const result=await worker.fetch(request('/fishing/release.json',{
  method:'POST',headers:{Origin:ORIGIN,
   'Sec-Fetch-Site':'same-origin','Content-Type':'application/json'},
  body:'{"try":"write"}',
 }),secure({D6_STATIC_ENABLED:'true'}));
 assert.equal(result.status,404);
 assert.equal(calls.length,0);
});
test('D6-ENTRY09 network errors do not disclose credentials or error bodies',async()=>{
 const {worker,calls}=make();
 const result=await worker.fetch(request('/fishing/release.json'),
  secure({D6_STATIC_ENABLED:'true'}));
 // Our mock returns valid static bytes by default. Force rejected network
 // via a separate worker to verify the top-level error boundary.
 assert.equal(result.status,200);
 const bad=createD6DisabledProductionWorker({
  network:async()=>{throw Error('test-only-private-key');},
 });
 const failure=await bad.fetch(request('/fishing/release.json'),
  secure({D6_STATIC_ENABLED:'true'}));
 assert.equal(failure.status,503);
 const text=await failure.text();
 assert(!text.includes('test-only-private-key'));
 assert(!text.includes('stack'));
 assert.equal(calls.length,1);
});
test('D6-ENTRY10 invalid handler dependencies reject eagerly',()=>{
 assert.throws(()=>createD6DisabledProductionWorker({network:null}));
 assert.throws(()=>createD6DisabledProductionWorker({now:123}));
});
test('D6-ENTRY11 configuration remains explicitly inert and contains no secrets',()=>{
 const conf=readFileSync(new URL(
  '../../experiments/p3/preview/d6-production-disabled.example.toml',
  import.meta.url),'utf8');
 assert.match(conf,/workers_dev = false/);
 assert.match(conf,/routes = \[\]/);
 assert.match(conf,/D6_WORKER_ENTRY_ENABLED = "false"/);
 assert.match(conf,/D6_PRODUCTION_ENABLED = "false"/);
 assert.doesNotMatch(conf,/\[\[d1_databases\]\]|\[\[routes\]\]|client_secret|BEGIN PRIVATE KEY/);
});
test('D6-ENTRY12 source has no writer, cron or credential setup',()=>{
 const source=readFileSync(new URL(
  '../../experiments/p3/preview/src/d6-production-disabled-worker.mjs',
  import.meta.url),'utf8');
 assert.match(source,/D6_WORKER_ENTRY_ENABLED/);
 assert.match(source,/createD6ProductionRuntimeBindingContract/);
 assert.doesNotMatch(source,/issueWriteToken|authorizeWrite|stageMedia|scheduled\s*\(/);
 assert.doesNotMatch(source,/1430581407|fishing-p3-sandbox|D2_WRITE_ENABLED/);
});
