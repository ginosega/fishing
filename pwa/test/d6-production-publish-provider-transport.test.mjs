import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6ProductionPublishProviderTransport,
 D6PublishProviderTransportError}
 from '../../experiments/p3/preview/src/d6-production-publish-provider-transport.mjs';

const API='https://api.github.com/repos/ginosega/fishing';
const ID='123e4567-e89b-42d3-a456-426614174000';
const SHA='a'.repeat(40),COMMIT='b'.repeat(40),TREE='c'.repeat(40);
const REF='fish-v3/publish/'+ID;
const TOKEN='server-only-token-123456789012345';
const headers=method=>({
 Authorization:'Bearer '+TOKEN,
 Accept:'application/vnd.github+json',
 'X-GitHub-Api-Version':'2026-03-10',
 'User-Agent':'fishing-d6-publish-stage-source-only',
 ...(method!=='GET'?{'Content-Type':'application/json'}:{}),
});
const opts=(method='GET',payload)=>({
 method,redirect:'manual',cache:'no-store',credentials:'omit',
 headers:headers(method),
 ...(method==='GET'?{}:{body:JSON.stringify(payload)}),
});
const payloads=[
 ['/git/blobs','POST',{encoding:'base64',content:'AQIDBA=='}],
 ['/git/trees','POST',{base_tree:SHA,tree:[
  {path:'Gear/gear.json',mode:'100644',type:'blob',sha:COMMIT}]}],
 ['/git/commits','POST',{message:'Fishing Companion V3 content update '+ID,
  tree:TREE,parents:[SHA]}],
 ['/git/refs','POST',{ref:'refs/heads/'+REF,sha:SHA}],
 ['/git/refs/heads/'+REF,'PATCH',{sha:COMMIT,force:false}],
 ['/pulls','POST',{head:REF,base:'main',draft:false,
  title:'Fishing Companion V3: gear '+ID,
  body:'Canonical gear add gear-1\nOperation: '+ID+'\nBase: '+SHA+'\nCommit: '+COMMIT}],
];
const reads=[
 API,
 API+'/git/ref/heads/main',
 API+'/git/ref/heads/'+REF,
 API+'/git/commits/'+COMMIT,
 API+'/git/trees/'+TREE,
 API+'/git/blobs/'+SHA,
 API+'/pulls/481',
 API+'/pulls?state=all&head='+encodeURIComponent('ginosega:'+REF)+
  '&base=main&per_page=2',
];
const denied=(promise,code)=>assert.rejects(promise,error=>
 error instanceof D6PublishProviderTransportError&&error.code===code);
function harness(enabled=true){
 const calls=[],response=new Response('{}',{status:200,
  headers:{'Content-Type':'application/json'}});
 const provider=createD6ProductionPublishProviderTransport({
  enabled:()=>enabled,
  upstream:async(url,options)=>{
   calls.push({url,options});
   return response;
  },
 });
 return {provider,calls,response};
}

test('WP3-TRAN01: all five publication mutations plus original media stay exact and unmodified',async()=>{
 const h=harness();
 for(const [path,method,payload] of payloads){
  const request=opts(method,payload);
  assert.equal(await h.provider.request(API+path,request),h.response);
  const observed=h.calls.at(-1);
  assert.equal(observed.url,API+path);
  assert.deepEqual(observed.options,request);
  assert.equal(observed.options.redirect,'manual');
  assert.equal(observed.options.credentials,'omit');
 }
 assert.equal(h.calls.length,payloads.length);
});

test('WP3-TRAN02: all independent GET readbacks and main ref checks stay GET-only',async()=>{
 const h=harness();
 for(const url of reads){
  const request=opts();
  assert.equal(await h.provider.request(url,request),h.response);
  assert.deepEqual(h.calls.at(-1),{url,options:request});
 }
 assert.equal(h.calls.length,reads.length);
});

test('WP3-TRAN03: wrong origin, repository, ref, path, PR list and query are denied before upstream',async()=>{
 const h=harness();
 const bad=[
  'https://evil.example/repos/ginosega/fishing/git/ref/heads/main',
  'http://api.github.com/repos/ginosega/fishing/git/ref/heads/main',
  'https://api.github.com.evil.example/repos/ginosega/fishing',
  'https://api.github.com/repos/other/fishing/git/ref/heads/main',
  API+'/git/ref/heads/other',
  API+'/git/ref/heads/fish-v3/publish/other',
  API+'/git/refs/heads/'+REF,
  API+'/git/commits/'+SHA+'?limit=1',
  API+'/pulls?state=open&head=ginosega%3A'+REF,
  API+'/pulls?state=all&head=another%3A'+encodeURIComponent(REF)+
   '&base=main&per_page=2',
  API+'/pulls?state=all&head='+encodeURIComponent('ginosega:'+REF)+
   '&base=main&per_page=100',
  API+'/contents/.github/workflows/fishing-production.yml',
  API+'/git/ref/heads/main#unexpected',
  'https://attacker@api.github.com/repos/ginosega/fishing',
 ];
 for(const url of bad)await denied(h.provider.request(url,opts()),
  'URL_DENIED');
 assert.equal(h.calls.length,0);
});

test('WP3-TRAN04: no arbitrary HTTP methods, routes, or body injection',async()=>{
 const h=harness();
 await denied(h.provider.request(API+'/git/commits',
  {...opts('POST',{message:'bad'}),method:'DELETE'}),'METHOD_DENIED');
 await denied(h.provider.request(API+'/git/commits',opts()),'URL_DENIED');
 await denied(h.provider.request(API+'/git/commits/'+SHA,
  opts('POST',{message:'bad'})),'URL_DENIED');
 await denied(h.provider.request(API+'/git/ref/heads/main',
  {...opts(),body:'{}'}),'BODY_DENIED');
 assert.equal(h.calls.length,0);
});

test('WP3-TRAN05: method-specific provider body checks fail closed',async()=>{
 const h=harness();
 for(const [path,method,value] of [
  ['/git/blobs','POST',{content:'test',encoding:'utf-8'}],
  ['/git/refs','POST',{ref:'refs/heads/main',sha:SHA}],
  ['/git/trees','POST',{base_tree:'x',tree:[]}],
  ['/git/commits','POST',{message:'other',tree:TREE,parents:[SHA]}],
  ['/git/refs/heads/'+REF,'PATCH',{sha:SHA,force:true}],
  ['/pulls','POST',{head:REF,base:'main',draft:true,
   title:'Fishing Companion V3: gear '+ID,body:'bad'}],
 ]){
  await denied(h.provider.request(API+path,opts(method,value)),
   'BODY_DENIED');
 }
 assert.equal(h.calls.length,0);
});

test('WP3-TRAN06: browser credentials, unauthorized headers, wrong token and redirects denied',async()=>{
 const h=harness(),url=API+'/git/commits/'+SHA;
 for(const modified of [
  {redirect:'follow'},
  {credentials:'include'},
  {cache:'default'},
  {extra:'smuggled'},
  {headers:{...headers('GET'),Authorization:'Bearer short'}},
  {headers:{...headers('GET'),'X-Other':'not allowed'}},
  {headers:{...headers('GET'),Cookie:'session=bad'}},
  {headers:{...headers('GET'),'Content-Type':'application/json'}},
 ]){
  await denied(h.provider.request(url,{...opts(),...modified}),
   'OPTIONS_DENIED');
 }
 assert.equal(h.calls.length,0);
});

test('WP3-TRAN07: default disabled and transport errors do not authorize a retry',async()=>{
 const h=harness(false);
 await denied(h.provider.request(API+'/git/refs',
  opts('POST',{ref:'refs/heads/'+REF,sha:SHA})),'DISABLED');
 assert.equal(h.calls.length,0);
 let attempts=0;
 const p=createD6ProductionPublishProviderTransport({
  enabled:()=>true,upstream:async()=>{attempts++;throw Error('lost ack');},
 });
 await assert.rejects(p.request(API+'/git/commits',
  opts('POST',{message:'Fishing Companion V3 content update '+ID,
   tree:TREE,parents:[SHA]})),/lost ack/);
 assert.equal(attempts,1);
 assert.deepEqual(Object.keys(p),['request']);
});
