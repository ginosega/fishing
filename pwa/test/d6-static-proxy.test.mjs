import test from 'node:test';
import assert from 'node:assert/strict';
import {planD6StaticRequest,createD6StaticReadProxy,D6_PUBLIC_ORIGIN}
 from '../server/d6-static-proxy.mjs';
const O=D6_PUBLIC_ORIGIN;
const id='0123456789abcdef0123456789abcdef';

test('D6-R01 root, release pointer and immutable release assets map to GitHub Pages',()=>{
 for(const [p,expected] of [['/','index.html'],['/release.json','release.json'],
   ['/sw.js','sw.js'],['/releases/'+id+'/content/KB/Locations/assets/Lake%20Sammamish.jpg',
    'releases/'+id+'/content/KB/Locations/assets/Lake%20Sammamish.jpg']]){
  const v=planD6StaticRequest({url:O+p});
  assert.equal(v.kind,'static');
  assert.equal(v.upstreamUrl,'https://ginosega.github.io/fishing/'+expected);
 }
});
test('D6-R02 exact public host, methods and static allowlist fail closed',()=>{
 const bad=[
  {url:'https://attacker.invalid/release.json'},
  {url:'http://fishing.ginosega.workers.dev/release.json'},
  {url:O+'/api/v3/operations/latest'},
  {url:O+'/auth/start'}, {url:O+'/session/signout'},
  {url:O+'/fishing/__v3_owner_candidate__/'},
  {url:O+'/__d3_pilot__/'},
  {url:O+'/releases/nope/app.js'},
  {url:O+'/releases/'+id+'/%2Fprivate'},
  {url:O+'/releases/'+id+'/%2e%2e/private'},
  {url:O+'/release.json',method:'POST'},
  {url:'not a url'},
 ];
 for(const item of bad)assert.equal(planD6StaticRequest(item).kind,'deny',JSON.stringify(item));
});
test('D6-R03 off-by-default proxy never fetches or serves public bytes',async()=>{
 let calls=0;
 const handler=createD6StaticReadProxy({fetchAsset:async()=>{calls++;return new Response('wrong');}});
 const r=await handler(new Request(O+'/release.json'));
 assert.equal(r.status,503);assert.equal(calls,0);
});
test('D6-R04 enabled static proxy serves only constrained upstream content',async()=>{
 const seen=[];
 const handler=createD6StaticReadProxy({enabled:true,fetchAsset:async(u,opts)=>{
  seen.push({u,opts});return new Response('{"id":"test"}',
   {headers:{'Content-Type':'application/json','Set-Cookie':'leaked=1','Location':'https://attacker.invalid'}});
 }});
 const r=await handler(new Request(O+'/release.json'));
 assert.equal(r.status,200);assert.equal(await r.text(),'{"id":"test"}');
 assert.equal(r.headers.get('Set-Cookie'),null);
 assert.equal(r.headers.get('Location'),null);
 assert.equal(r.headers.get('Cache-Control'),'no-store');
 assert.deepEqual(seen,[{u:'https://ginosega.github.io/fishing/release.json',opts:{method:'GET',redirect:'manual'}}]);
 const blocked=await handler(new Request(O+'/api/v3/operations/latest'));
 assert.equal(blocked.status,404);assert.equal(seen.length,1);
});
test('D6-R05 unknown upstream status/redirect/error does not claim success',async()=>{
 for(const fetchAsset of [async()=>new Response('',{status:302,headers:{Location:'https://evil.invalid'}}),
   async()=>new Response('Nope',{status:404}),async()=>{throw Error('offline');}]){
  const handler=createD6StaticReadProxy({enabled:true,fetchAsset});
  const result=await handler(new Request(O+'/release.json'));
  assert.equal(result.status,503);
 }
});
test('D6-R06 HEAD never returns a body',async()=>{
 const handler=createD6StaticReadProxy({enabled:true,fetchAsset:async()=>new Response('payload')});
 const resp=await handler(new Request(O+'/sw.js',{method:'HEAD'}));
 assert.equal(resp.status,200);assert.equal(resp.body,null);
});
