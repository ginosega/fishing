import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD3GatedAuthGateway}
 from '../../experiments/p3/preview/src/d3-gated-auth-gateway.mjs';
import {createD5OwnerCandidateStaticHost,D5_OWNER_STATIC_PREFIX}
 from '../../experiments/p3/preview/src/d5-owner-candidate-static-host.mjs';

const origin='https://owner.example.test';
const pagesOrigin='https://fishing-v3-owner-test.pages.dev';
const url=origin+D5_OWNER_STATIC_PREFIX;
const make=(options={})=>createD5OwnerCandidateStaticHost({
 origin,pagesOrigin,enabled:()=>true,...options,
});
test('D5-H01 default OFF reserves exact owner asset scope and performs zero upstream reads',async()=>{
 let calls=0;
 const host=make({enabled:()=>false,requestPages:async()=>{calls++;throw Error('unexpected');}});
 assert.equal((await host.serve(new Request(url))).status,404);
 assert.equal(calls,0);
 const gateway=readFileSync(new URL('../../experiments/p3/preview/src/d3-gated-auth-gateway.mjs',import.meta.url),'utf8');
 assert.match(gateway,/ownerReserved/);
 assert.match(gateway,/D5_OWNER_CANDIDATE_ENABLED!=='true'/);
 assert(gateway.indexOf('if(ownerReserved)')<gateway.indexOf("url.pathname==='/fishing'"));
});
test('D5-H02 verified static origin is read-only and strips caller credentials',async()=>{
 let seen;
 const host=make({requestPages:async (url,options)=>{
  seen={url,options};
  return new Response('static-bytes',{status:200,
   headers:{'Content-Type':'application/javascript','Set-Cookie':'bad=1',
    'Access-Control-Allow-Origin':'*','Location':'https://unsafe.test'}});
 }});
 const response=await host.serve(new Request(url+'releases/abc/app.js',{
  headers:{Cookie:'owner-cookie',Authorization:'Bearer private','X-Forwarded-Host':'bad.test'}}));
 assert.equal(response.status,200);
 assert.equal(await response.text(),'static-bytes');
 assert.equal(seen.url,pagesOrigin+D5_OWNER_STATIC_PREFIX+'releases/abc/app.js');
 assert.equal(seen.options.method,'GET');
 assert.equal(seen.options.headers.Accept,'*/*');
 assert.equal(seen.options.headers['Accept-Encoding'],'identity');
 assert.equal(JSON.stringify(seen).includes('owner-cookie'),false);
 assert.equal(JSON.stringify(seen).includes('Bearer private'),false);
 assert.equal(response.headers.get('Set-Cookie'),null);
 assert.equal(response.headers.get('Location'),null);
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
 assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow, noarchive');
});
test('D5-H03 reject unknown host, method, query, encoded traversal and API paths',async()=>{
 const host=make({requestPages:async()=>new Response('ok')});
 for(const target of [origin+'/api/v3/operations',
  origin+'/fishing/',origin+'/fishing/__v3_owner_candidate__evil/',
  url+'?token=no',url+'a%2Fb',url+'a%5Cb',
  url+'a%00b','https://evil.example.test'+D5_OWNER_STATIC_PREFIX]){
  assert.notEqual((await host.serve(new Request(target))).status,200);
 }
 assert.equal((await host.serve(new Request(url,{method:'POST'}))).status,405);
});
test('D5-H04 fail closed for redirects, upstream denial and compressed content',async()=>{
 for(const response of [
  new Response(null,{status:302,headers:{Location:'https://evil.test'}}),
  new Response('error',{status:503}),
  new Response('gzip',{status:200,headers:{'Content-Encoding':'gzip'}}),
 ]){
  const host=make({requestPages:async()=>response});
  assert.equal((await host.serve(new Request(url))).status,503);
 }
 assert.equal((await make({requestPages:async()=>new Response(null,{status:404})})
  .serve(new Request(url))).status,404);
 assert.equal((await make({pagesOrigin:'https://pages.dev.evil.test'})
  .serve(new Request(url))).status,503);
});
test('D5-H05 HEAD returns no upstream body and no credentials',async()=>{
 const host=make({requestPages:async()=>new Response(null,{status:200,
  headers:{'Content-Type':'text/html'}})});
 const reply=await host.serve(new Request(url,{method:'HEAD'}));
 assert.equal(reply.status,200);
 assert.equal(reply.body,null);
});

test('D5-H06 existing gateway V2 forwarding is unchanged and owner route is gated',async()=>{
 let upstreamCalls=0,publicCalls=0;
 const proxy=async()=>{publicCalls++;return new Response('public V2',{status:200});};
 const gateway=createD3GatedAuthGateway({
  proxy,requestHosted:async()=>{upstreamCalls++;return new Response('owner candidate bytes',{
   status:200,headers:{'Content-Type':'text/html'}});},
 });
 const off={APP_ORIGIN:origin,D5_OWNER_CANDIDATE_ENABLED:'false',
  D5_OWNER_PAGES_ORIGIN:pagesOrigin};
 const reserved=await gateway.fetch(new Request(url),off,{});
 assert.equal(reserved.status,404);assert.equal(upstreamCalls,0);
 const legacy=await gateway.fetch(new Request(origin+'/fishing/release.json'),off,{});
 assert.equal(legacy.status,200);assert.equal(await legacy.text(),'public V2');
 assert.equal(publicCalls,1);
 const on={...off,D5_OWNER_CANDIDATE_ENABLED:'true'};
 const enabled=await gateway.fetch(new Request(url),on,{});
 assert.equal(enabled.status,200);
 assert.equal(await enabled.text(),'owner candidate bytes');
 assert.equal(upstreamCalls,1);assert.equal(publicCalls,1);
});
