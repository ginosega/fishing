import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import stageEntry,{
 createD6StageAStaticWorker,planD6StageAStaticRequest,
 D6_STAGE_A_WORKER_ORIGIN,D6_STAGE_A_PAGES_HOST_PATTERN,
} from '../../experiments/p3/preview/src/d6-stage-a-static-worker.mjs';

const O=D6_STAGE_A_WORKER_ORIGIN;
const HOST='63a65b86.fishing-v3-d6-static-test.pages.dev';
const PAGE='https://'+HOST+'/fishing/';
const ID='0123456789abcdef0123456789abcdef';
const make=(overrides={})=>{
 const calls=[];
 const worker=createD6StageAStaticWorker({
  enabled:true,pagesDeploymentHost:HOST,
  fetchAsset:async(url,options)=>{
   calls.push({url,options});
   return new Response('asset bytes',{status:200,headers:{
    'Content-Type':'text/plain','Set-Cookie':'secret=x',
    'Location':'https://attacker.invalid','Access-Control-Allow-Origin':'*',
    'Cache-Control':'public, max-age=31536000',
   }});
  },...overrides,
 });
 return {worker,calls};
};
const req=(suffix,init)=>new Request(O+suffix,init);

test('D6-STAGEA-W01 default-off and missing/mutable host fail closed without fetching',async()=>{
 for(const opts of [
  {enabled:false,pagesDeploymentHost:HOST},
  {enabled:true,pagesDeploymentHost:'fishing-v3-d6-static-test.pages.dev'},
  {enabled:true,pagesDeploymentHost:'ginosega.github.io'},
  {enabled:true,pagesDeploymentHost:'63a65b86.fishing-v3-owner-d5-test.pages.dev'},
  {enabled:true,pagesDeploymentHost:'63a65b86.fishing-v3-d6-static-test.pages.dev.evil.test'},
  {enabled:'true',pagesDeploymentHost:HOST},
  {enabled:true,pagesDeploymentHost:undefined},
 ]){
  let calls=0;
  const w=createD6StageAStaticWorker({...opts,
   fetchAsset:async()=>{calls++;return new Response('unexpected');}});
  assert.equal((await w.fetch(req('/fishing/'))).status,503);
  assert.equal(calls,0);
 }
 assert(D6_STAGE_A_PAGES_HOST_PATTERN.test(HOST));
 assert.equal((await stageEntry.fetch(req('/fishing/'),{})).status,503);
});

test('D6-STAGEA-W02 root redirects and Pages shell aliases map to physical /fishing/',async()=>{
 const {worker,calls}=make();
 for(const r of ['/', '/fishing']){
  const res=await worker.fetch(req(r));
  assert.equal(res.status,302);
  assert.equal(res.headers.get('Location'),'/fishing/');
 }
 for(const r of ['/fishing/','/fishing/index.html']){
  const res=await worker.fetch(req(r));
  assert.equal(res.status,200);
  assert.equal(await res.text(),'asset bytes');
 }
 assert.equal(calls.length,2);
 assert(calls.every(x=>x.url===PAGE));
 assert(calls.every(x=>x.options.redirect==='manual'));
 assert(calls.every(x=>x.options.credentials==='omit'));
});

test('D6-STAGEA-W03 only release inventory paths can reach exact immutable Pages host',async()=>{
 const {worker,calls}=make();
 const paths=['/fishing/release.json','/fishing/sw.js',
  '/fishing/loader.js','/fishing/manifest.webmanifest',
  '/fishing/icon.png','/fishing/icon-maskable.png',
  '/fishing/releases/'+ID+'/manifest.json',
  '/fishing/releases/'+ID+'/app.js',
  '/fishing/releases/'+ID+'/content/KB/Lake%20Sammamish.jpg',
 ];
 for(const p of paths)assert.equal((await worker.fetch(req(p))).status,200,p);
 assert.deepEqual(calls.map(x=>x.url),paths.map(x=>'https://'+HOST+x));
});

test('D6-STAGEA-W04 auth/API/publishing/admin/media and other hosts never fetch',async()=>{
 const {worker,calls}=make();
 const bad=['/session','/session/signout','/api','/api/v3/authoring-source',
  '/api/v3/publish','/api/v3/operations/latest','/auth/start',
  '/auth/callback','/oauth/callback','/media/upload','/admin',
  '/_internal/verify-sandbox','/fishing/api/v3/authoring-source',
  '/fishing/__v3_owner_candidate__/','/fishing/unknown',
  '/fishing/releases/bad/app.js',
  '/fishing/releases/'+ID+'/content/%2fsecret',
  '/fishing/releases/'+ID+'/content/%5csecret',
  '/fishing/releases/'+ID+'/content/%2e%2e/secret',
  '/fishing/releases/'+ID+'/content/%252fsecret',
  '/fishing/releases/'+ID+'/app.js?source=main',
  '/fishing/release.json?revision=123',
 ];
 for(const p of bad)assert.equal((await worker.fetch(req(p))).status,404,p);
 for(const badOrigin of [
  'https://fishing.ginosega.workers.dev/fishing/',
  'https://fishing-auth-p0-test.ginosega.workers.dev/fishing/',
  'https://fishing-v3-d6-static-test.pages.dev/fishing/',
  'https://fishing-d6-static-test.ginosega.workers.dev.evil.test/fishing/',
  'http://fishing-d6-static-test.ginosega.workers.dev/fishing/',
 ]){
  assert.equal((await worker.fetch(new Request(badOrigin))).status,404,badOrigin);
 }
 for(const p of ['/','/fishing/','/fishing/release.json','/api/v3/publish']){
  const response=await worker.fetch(req(p,{method:'POST'}));
  assert([404,405].includes(response.status),p);
 }
 assert.equal(calls.length,0);
});

test('D6-STAGEA-W05 no redirect-following, leakable headers, or false success',async()=>{
 const {worker,calls}=make();
 const ok=await worker.fetch(req('/fishing/release.json'));
 assert.equal(ok.status,200);
 assert.equal(ok.headers.get('Content-Type'),'text/plain');
 for(const h of ['Set-Cookie','Location','Access-Control-Allow-Origin','Server'])
  assert.equal(ok.headers.get(h),null);
 assert.equal(ok.headers.get('Cache-Control'),'no-store');
 assert.equal(ok.headers.get('X-Robots-Tag'),'noindex, nofollow');
 assert.equal(calls[0].options.redirect,'manual');
 for(const up of [
  async()=>new Response(null,{status:302,headers:{Location:'https://attacker.invalid'}}),
  async()=>new Response('missing',{status:404}),
  async()=>new Response('oops',{status:500}),
  async()=>{throw Error('offline');},
 ]){
  const w=make({fetchAsset:up}).worker;
  const res=await w.fetch(req('/fishing/release.json'));
  assert.equal(res.status,503);
  assert.equal(res.headers.get('Location'),null);
  assert.equal(res.headers.get('Set-Cookie'),null);
 }
});

test('D6-STAGEA-W06 HEAD is bodyless; unconfigured Worker exports no active route',async()=>{
 let method;
 const w=make({fetchAsset:async(_url,options)=>{
  method=options.method;
  return new Response('should not expose body',{status:200});
 }}).worker;
 const res=await w.fetch(req('/fishing/sw.js',{method:'HEAD'}));
 assert.equal(res.status,200);
 assert.equal(method,'HEAD');
 assert.equal(res.body,null);
 assert.equal((await stageEntry.fetch(req('/fishing/release.json'),{
  D6_STAGE_A_STATIC_ENABLED:'false',
  D6_STAGE_A_PAGES_DEPLOYMENT_HOST:HOST,
 })).status,503);
});

test('D6-STAGEA-W07 source has no auth/store/writer implementation or new CI deploy',()=>{
 const src=readFileSync(new URL(
  '../../experiments/p3/preview/src/d6-stage-a-static-worker.mjs',
  import.meta.url),'utf8');
 const workflow=readFileSync(new URL(
  '../../.github/workflows/fishing-production.yml',import.meta.url),'utf8');
 assert.doesNotMatch(src,/from\s+['"](?:node:|.*d6-same-origin-gateway|.*github-app)/);
 assert.doesNotMatch(src,/requestGitHub|issueReadToken|createD6OwnerSessionReadiness|D1Database|env\.P3_/);
 assert(src.includes("env?.D6_STAGE_A_STATIC_ENABLED==='true'"));
 assert(src.includes("redirect:'manual'"));
 assert(workflow.includes('Package and verify physical D6 Stage A Pages tree (no deploy)'));
 assert(!workflow.includes('deploy-d6-stage-a'));
});

test('D6-STAGEA-W08 planner refuses malformed configuration and unsupported paths',()=>{
 assert.equal(planD6StageAStaticRequest({url:O+'/fishing/',pagesHost:'invalid'}).kind,'deny');
 assert.equal(planD6StageAStaticRequest({url:'not a url',pagesHost:HOST}).kind,'deny');
 assert.equal(planD6StageAStaticRequest({url:O+'/fishing/favicon.ico',pagesHost:HOST}).kind,'deny');
 const p=planD6StageAStaticRequest({url:O+'/fishing/sw.js',pagesHost:HOST});
 assert.equal(p.kind,'static');
 assert.equal(p.upstreamUrl,PAGE+'sw.js');
});
