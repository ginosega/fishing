import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planD6PublicRead,createD6PublicReadProxy,D6_PUBLIC_ORIGIN,D6_GITHUB_PAGES_BASE}
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
 assert.equal(entry.upstreamUrl,D6_GITHUB_PAGES_BASE+'index.html');
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
  assert.equal(result.upstreamUrl,D6_GITHUB_PAGES_BASE+item,item);
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
