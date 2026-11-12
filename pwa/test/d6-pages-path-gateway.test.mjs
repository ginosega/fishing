import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planD6PublicRead,createD6PublicReadProxy,D6_PUBLIC_ORIGIN,D6_GITHUB_PAGES_BASE,
 D6_ISOLATED_PAGES_BASE}
 from '../server/d6-pages-path-gateway.mjs';
const O=D6_PUBLIC_ORIGIN;
const ID='0123456789abcdef0123456789abcdef';

test('D6-P01 hostname root is an entry redirect, not a second build root',()=>{
 for(const path of ['/','/fishing']){
  const p=planD6PublicRead({url:O+path});
  assert.equal(p.kind,'redirect');
  assert.equal(p.location,'/fishing/');
  assert.equal(p.status,302);
 }
 const entry=planD6PublicRead({url:O+'/fishing/'});
 assert.equal(entry.kind,'static');
 assert.equal(entry.upstreamUrl,D6_GITHUB_PAGES_BASE);
 const explicit=planD6PublicRead({url:O+'/fishing/index.html'});
 assert.equal(explicit.kind,'static');
 assert.equal(explicit.upstreamUrl,D6_GITHUB_PAGES_BASE);
});

test('D6-P02 static release maps byte-path-for-byte-path under /fishing/',()=>{
 const items=['release.json','loader.js','sw.js','manifest.webmanifest',
  'icon.png','icon-maskable.png','index.html',
  'releases/'+ID+'/manifest.json',
  'releases/'+ID+'/app.js',
  'releases/'+ID+'/content/KB/Locations/assets/Lake%20Sammamish.jpg',
  'releases/'+ID+'/card-thumbnails/example.webp'];
 for(const item of items){
  const result=planD6PublicRead({url:O+'/fishing/'+item});
  assert.equal(result.kind,'static',item);
  assert.equal(result.upstreamUrl,
   item==='index.html'?D6_GITHUB_PAGES_BASE:D6_GITHUB_PAGES_BASE+item,item);
 }
 assert.equal(planD6PublicRead({url:O+'/fishing/release.json?revision=123'}).upstreamUrl,
  D6_GITHUB_PAGES_BASE+'release.json?revision=123');
});

test('D6-P03 exact HTTPS origin, static allowlist and raw paths fail closed',()=>{
 const bad=[
  {url:'https://attacker.invalid/fishing/release.json'},
  {url:'http://fishing.ginosega.workers.dev/fishing/release.json'},
  {url:O+'/api/v3/operations/latest'},
  {url:O+'/auth/start'},
  {url:O+'/session/signout'},
  {url:O+'/fishing/__v3_owner_candidate__/'},
  {url:O+'/fishing/__d3_pilot__/'},
  {url:O+'/fishing/nonexistent'},
  {url:O+'/fishing/releases/nope/app.js'},
  {url:O+'/fishing/releases/'+ID+'/content/%2e%2e/private'},
  {url:O+'/fishing/releases/'+ID+'/content/../private'},
  {url:O+'/fishing/releases/'+ID+'/content/%2fprivate'},
  {url:O+'/fishing/release.json',method:'POST'},
  {url:'not a URL'}
 ];
 for(const item of bad)
  assert.equal(planD6PublicRead(item).kind,'deny',JSON.stringify(item));
});

test('D6-P04 proxy defaults OFF, including for root redirect',async()=>{
 let calls=0;
 const proxy=createD6PublicReadProxy({fetchAsset:async()=>{calls++;return new Response('no');}});
 for(const path of ['/','/fishing/','/fishing/release.json']){
  const result=await proxy(new Request(O+path));
  assert.equal(result.status,503);
 }
 assert.equal(calls,0);
});

test('D6-P05 static proxy uses exact Pages path, strips upstream sensitive headers',async()=>{
 const calls=[];
 const proxy=createD6PublicReadProxy({enabled:true,fetchAsset:async(u,options)=>{
  calls.push({u,options});
  return new Response('{"id":"pinned"}',{status:200,headers:{
   'Content-Type':'application/json','Set-Cookie':'secret=leak',
   Location:'https://attacker.invalid','Access-Control-Allow-Origin':'*'}});
 }});
 const response=await proxy(new Request(O+'/fishing/release.json'));
 assert.equal(response.status,200);
 assert.equal(await response.text(),'{"id":"pinned"}');
 assert.equal(response.headers.get('Content-Type'),'application/json');
 assert.equal(response.headers.get('Set-Cookie'),null);
 assert.equal(response.headers.get('Location'),null);
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
 assert.equal(response.headers.get('Cache-Control'),'no-store');
 assert.deepEqual(calls,[{u:D6_GITHUB_PAGES_BASE+'release.json',
   options:{method:'GET',redirect:'manual'}}]);
 const denied=await proxy(new Request(O+'/api/v3/operations/latest'));
 assert.equal(denied.status,404);assert.equal(calls.length,1);
});

test('D6-P06 enabled root redirect and upstream errors never claim Live',async()=>{
 let count=0;
 const p=createD6PublicReadProxy({enabled:true,fetchAsset:async()=>{count++;return new Response('x');}});
 const r=await p(new Request(O+'/'));
 assert.equal(r.status,302);assert.equal(r.headers.get('Location'),'/fishing/');
 assert.equal(count,0);
 for(const fetchAsset of [
  async()=>new Response('',{status:302,headers:{Location:'https://attacker.invalid'}}),
  async()=>new Response('Not found',{status:404}),
  async()=>{throw Error('network unavailable');}
 ]){
  const proxy=createD6PublicReadProxy({enabled:true,fetchAsset});
  const response=await proxy(new Request(O+'/fishing/release.json'));
  assert.equal(response.status,503);
 }
});

test('D6-P07 HEAD proxy never returns a response body',async()=>{
 const proxy=createD6PublicReadProxy({enabled:true,fetchAsset:async()=>new Response('secret')});
 const response=await proxy(new Request(O+'/fishing/sw.js',{method:'HEAD'}));
 assert.equal(response.status,200);assert.equal(response.body,null);
});

test('D6-P08 original Pages build and loader require /fishing/ release base',()=>{
 const build=readFileSync(new URL('../tools/build.mjs',import.meta.url),'utf8');
 const loader=readFileSync(new URL('../src/loader.js',import.meta.url),'utf8');
 assert.match(build,/const base=option\('--base','\/fishing\/v2-preview\/'\)/);
 assert.match(loader,/manifest.base!==new URL\(root\).pathname/);
 assert.match(loader,/serviceWorker.register\(new URL\('sw.js',root\),\{scope:root\}\)/);
});

test('D6-P09 shell aliases fetch canonical Pages root and never follow upstream redirects',async()=>{
 const calls=[];
 const fixture='<html><head><script src="./loader.js"></script></head><body>D6</body></html>';
 const proxy=createD6PublicReadProxy({enabled:true,fetchAsset:async(u,options)=>{
  calls.push({url:u,options});
  // Simulate a Pages host which 308-redirects explicit /index.html.
  if(u.endsWith('/index.html'))
   return new Response(null,{status:308,headers:{Location:D6_GITHUB_PAGES_BASE}});
  return new Response(fixture,{status:200,headers:{'Content-Type':'text/html'}});
 }});
 const entries=['/fishing/','/fishing/index.html'];
 for(const entry of entries){
  const response=await proxy(new Request(O+entry));
  assert.equal(response.status,200,entry);
  assert.equal(response.headers.get('Content-Type'),'text/html');
  assert.equal(await response.text(),fixture);
 }
 assert.deepEqual(calls.map(x=>x.url),[
  D6_GITHUB_PAGES_BASE,D6_GITHUB_PAGES_BASE,
 ]);
 assert(calls.every(x=>x.options.redirect==='manual'));
 assert(calls.every(x=>x.options.method==='GET'));
});

test('D6-P10 canonical Pages shell origin failing or redirecting remains unavailable',async()=>{
 for(const response of [
  new Response(null,{status:308,headers:{Location:'https://attacker.invalid'}}),
  new Response('not found',{status:404}),
  new Response('temporarily down',{status:503}),
 ]){
  const proxy=createD6PublicReadProxy({enabled:true,fetchAsset:async u=>{
   assert.equal(u,D6_GITHUB_PAGES_BASE);
   return response.clone();
  }});
  const attempt=await proxy(new Request(O+'/fishing/'));
  assert.equal(attempt.status,503);
  assert.equal(attempt.headers.get('Location'),null);
 }
});

test('D6-P11 isolated Worker/static Pages origin pair is exact',async()=>{
 const staging='https://fishing-d6-wp2-test.ginosega.workers.dev';
 const req=new Request(staging+'/fishing/release.json');
 const plan=planD6PublicRead({url:req.url,
  origin:staging,pagesBase:D6_ISOLATED_PAGES_BASE});
 assert.equal(plan.kind,'static');
 assert.equal(plan.upstreamUrl,D6_ISOLATED_PAGES_BASE+'release.json');
 const calls=[];
 const proxy=createD6PublicReadProxy({
  enabled:true,origin:staging,pagesBase:D6_ISOLATED_PAGES_BASE,
  fetchAsset:async url=>{calls.push(url);return new Response('bytes');},
 });
 assert.equal((await proxy(req)).status,200);
 assert.deepEqual(calls,[plan.upstreamUrl]);
 assert.equal(planD6PublicRead({url:req.url}).kind,'deny');
 assert.equal(planD6PublicRead({url:req.url,
  origin:'https://evil.invalid',pagesBase:D6_ISOLATED_PAGES_BASE}).kind,'deny');
 assert.throws(()=>createD6PublicReadProxy({
  enabled:true,origin:'https://evil.invalid',fetchAsset:async()=>{},
 }));
});
