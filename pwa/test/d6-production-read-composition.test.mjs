import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6ProductionReadComposition}
 from '../../experiments/p3/preview/src/d6-production-read-composition.mjs';

const ORIGIN='https://fishing.ginosega.workers.dev';
const PAGES='https://ginosega.github.io/fishing/';
const NOW=2000000000,OWNER=265665562,COOKIE='A'.repeat(43);
const req=(path,opt={})=>new Request(ORIGIN+path,opt);
const withOwner=(path='/session',opt={})=>req(path,{
 ...opt,headers:{Cookie:'__Host-fish_p0_session='+COOKIE,
  'Sec-Fetch-Site':'same-origin',...opt.headers},
});
function db({owner=OWNER,expiry=NOW+3600}={}){
 let reads=0;
 return {get reads(){return reads;},prepare(query){
  assert.match(query,/SELECT github_id,expires_at FROM sessions/);
  return {bind(hash){reads++;
   assert.match(hash,/^[A-Za-z0-9_-]{43}$/);
   return {first:async()=>({github_id:owner,expires_at:expiry})};
  }};
 }};
}
function make(flags={}){
 let fetched=0,issued=0;
 const state={
  transport:async()=>{fetched++;throw Error('unexpected upstream read');},
  issueReadToken:async()=>{issued++;throw Error('unexpected token issuance');},
  AUTH_DB:db(),csrfKey:'K'.repeat(64),now:()=>NOW,
  ...flags,
 };
 return {service:createD6ProductionReadComposition(state),
  get fetched(){return fetched;},get issued(){return issued;},
  database:state.AUTH_DB,
 };
}

test('D6-COMP01 global default OFF: no routes, DB or network',async()=>{
 const x=make();
 for(const path of ['/','/fishing/release.json','/session',
  '/api/v3/authoring-source']){
  assert.equal((await x.service.fetch(req(path))).status,503,path);
 }
 assert.equal(x.database.reads,0);
 assert.equal(x.fetched,0);
 assert.equal(x.issued,0);
 assert.deepEqual(Object.keys(x.service).sort(),['fetch','verifyHostedBytes']);
 assert(Object.isFrozen(x.service));
});

test('D6-COMP02 static-only proxies Pages bytes and strips cookies',async()=>{
 const urls=[];
 const x=make({gatewayEnabled:true,staticEnabled:true,
  transport:async(url,options)=>{
   urls.push({url,options});
   return new Response('static-bytes',{headers:{
    'Content-Type':'text/plain','Set-Cookie':'do-not-copy=1',
    'Access-Control-Allow-Origin':'*',
   }});
  },
 });
 assert.equal((await x.service.fetch(req('/'))).status,302);
 const res=await x.service.fetch(req('/fishing/release.json'));
 assert.equal(res.status,200);
 assert.equal(await res.text(),'static-bytes');
 assert.equal(res.headers.get('Set-Cookie'),null);
 assert.equal(res.headers.get('Access-Control-Allow-Origin'),null);
 assert.deepEqual(urls.map(x=>x.url),[PAGES+'release.json']);
 assert.equal(urls[0].options.credentials,'omit');
 assert.equal((await x.service.fetch(req('/session'))).status,503);
 assert.equal((await x.service.fetch(req('/api/v3/operations',{
  method:'POST'}))).status,404);
 assert.equal(x.database.reads,0);
 assert.equal(x.issued,0);
});

test('D6-COMP03 verified owner /session projects only read status',async()=>{
 const x=make({gatewayEnabled:true,sessionEnabled:true});
 const status=await x.service.fetch(withOwner());
 assert.equal(status.status,200);
 assert.deepEqual(await status.json(),{
  authenticated:true,authorized:true,ownerLogin:'ginosega',
 });
 for(const field of ['Set-Cookie','Access-Control-Allow-Origin'])
  assert.equal(status.headers.get(field),null);
 assert.equal(status.headers.get('Cache-Control'),
  'private, no-store, max-age=0');
 assert.equal(x.database.reads,1);
 assert.equal(x.issued,0);
 assert.equal(x.fetched,0);
 assert.equal((await x.service.fetch(req('/api/v3/authoring-source'))).status,503);
});

test('D6-COMP04 wrong owner, expired or absent cookie is unauthorized',async()=>{
 for(const vars of [
  {AUTH_DB:db({owner:OWNER+1})},
  {AUTH_DB:db({expiry:NOW-1})},
 ]){
  const x=make({gatewayEnabled:true,sessionEnabled:true,
   sourceEnabled:true,...vars});
  const status=await x.service.fetch(withOwner());
  assert.equal(status.status,200);
  assert.deepEqual(await status.json(),{
   authenticated:false,authorized:false,
  });
  assert.equal((await x.service.fetch(
   withOwner('/api/v3/authoring-source'))).status,401);
  assert.equal(x.issued,0);
  assert.equal(x.fetched,0);
 }
 const x=make({gatewayEnabled:true,sessionEnabled:true,
  sourceEnabled:true});
 assert.deepEqual(await (await x.service.fetch(req('/session'))).json(),{
  authenticated:false,authorized:false,
 });
 assert.equal((await x.service.fetch(
  req('/api/v3/authoring-source'))).status,401);
 assert.equal(x.database.reads,0);
 assert.equal(x.issued,0);
});

test('D6-COMP05 missing production DB or CSRF secret fails closed',async()=>{
 for(const vars of [
  {AUTH_DB:null},
  {csrfKey:''},
 ]){
  const x=make({gatewayEnabled:true,sessionEnabled:true,
   sourceEnabled:true,...vars});
  assert.equal((await x.service.fetch(withOwner())).status,503);
  assert.equal((await x.service.fetch(
   withOwner('/api/v3/authoring-source'))).status,401);
  assert.equal(x.fetched,0);
  assert.equal(x.issued,0);
 }
});

test('D6-COMP06 rejects cross-site, foreign host, OAuth and writers',async()=>{
 const x=make({gatewayEnabled:true,sessionEnabled:true,
  sourceEnabled:true,staticEnabled:true});
 for(const request of [
  withOwner('/session',{headers:{'Sec-Fetch-Site':'cross-site'}}),
  withOwner('/session',{headers:{Origin:'https://evil.invalid'}}),
  new Request('https://evil.invalid/session'),
  withOwner('/session',{method:'POST'}),
  withOwner('/auth/callback'),
  withOwner('/session/signout'),
  withOwner('/api/v3/operations',{method:'POST'}),
  withOwner('/api/v3/media',{method:'PUT'}),
 ]){
  const result=await x.service.fetch(request);
  assert([403,404,405].includes(result.status),request.url);
 }
 assert.equal(x.issued,0);
 assert.equal(x.fetched,0);
});

test('D6-COMP07 source flag without session can never read GitHub',async()=>{
 const x=make({gatewayEnabled:true,sourceEnabled:true});
 assert.equal((await x.service.fetch(withOwner('/session'))).status,503);
 assert.equal((await x.service.fetch(
  withOwner('/api/v3/authoring-source'))).status,503);
 assert.equal(x.database.reads,0);
 assert.equal(x.fetched,0);
 assert.equal(x.issued,0);
});

test('D6-COMP08 hosted-byte preflight is operator-only and OFF',async()=>{
 const x=make();
 await assert.rejects(x.service.verifyHostedBytes({
  expectedSourceRevision:'a'.repeat(40),
 }),e=>e?.code==='DISABLED');
 assert.equal(x.fetched,0);
 assert.equal(x.issued,0);
});

test('D6-COMP09 invalid flags or missing trusted dependencies fail closed',()=>{
 for(const opts of [
  {gatewayEnabled:'true'},{sourceEnabled:()=>true},{now:123},
  {transport:null},{issueReadToken:null},
 ]){
  assert.throws(()=>createD6ProductionReadComposition(opts));
 }
});
