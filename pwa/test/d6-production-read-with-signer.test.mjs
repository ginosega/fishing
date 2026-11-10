import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD6ProductionReadWithSigner}
 from '../../experiments/p3/preview/src/d6-production-read-with-signer.mjs';

const ORIGIN='https://fishing.ginosega.workers.dev';
const PAGE='https://ginosega.github.io/fishing/release.json';
const OWNER=265665562,NOW=2000000000,COOKIE='A'.repeat(43);
const request=(path,opt={})=>new Request(ORIGIN+path,opt);
const owner=(path,opt={})=>request(path,{...opt,headers:{
 Cookie:'__Host-fish_p0_session='+COOKIE,
 'Sec-Fetch-Site':'same-origin',...opt.headers,
}});
function database({id=OWNER,expires=NOW+3600}={}){
 let reads=0;
 return {get reads(){return reads;},prepare(sql){
  assert.match(sql,/SELECT github_id,expires_at FROM sessions/);
  return {bind(){reads++;return {first:async()=>({
   github_id:id,expires_at:expires,
  })};}};
 }};
}
function make(override={}){
 const state={page:[],app:[],crypto:0};
 const db=database();
 const cryptoApi={subtle:{
  importKey:async()=>{state.crypto++;throw Error('should never sign');},
  sign:async()=>{state.crypto++;throw Error('should never sign');},
 }};
 const signer=createD6ProductionReadWithSigner({
  AUTH_DB:db,csrfKey:'source-only-test-csrf-key-xxxxxxxxxxxxxxxxxx',
  now:()=>NOW,cryptoApi,
  appEnv:{
   D6_GITHUB_APP_ID:'77',D6_GITHUB_INSTALLATION_ID:'42',
   D6_GITHUB_APP_PRIVATE_KEY:'test-only-not-a-real-key-0123456789012345',
  },
  transport:async(url,options)=>{
   state.page.push({url,options});
   throw Error('upstream blocked by test');
  },
  requestAppGitHub:async(url,options)=>{
   state.app.push({url,options});
   throw Error('App blocked by test');
  },
  ...override,
 });
 return {signer,state,db};
}

test('D6-SIGNED01 all capabilities default OFF, no DB or network',async()=>{
 const x=make();
 for(const path of ['/', '/session','/fishing/release.json',
  '/api/v3/authoring-source']){
  assert.equal((await x.signer.fetch(request(path))).status,503);
 }
 assert.deepEqual(Object.keys(x.signer).sort(),
  ['fetch','verifyHostedBytes']);
 assert(Object.isFrozen(x.signer));
 assert.equal(x.db.reads,0);
 assert.equal(x.state.page.length,0);
 assert.equal(x.state.app.length,0);
 assert.equal(x.state.crypto,0);
});

test('D6-SIGNED02 static anonymous reads cannot reach signer or App',async()=>{
 const x=make({gatewayEnabled:true,staticEnabled:true,
  transport:async(url,options)=>{
   x.state.page.push({url,options});
   return new Response('bytes',{status:200,headers:{
    'Content-Type':'text/plain','Set-Cookie':'untrusted=1',
   }});
  },
 });
 assert.equal((await x.signer.fetch(request('/'))).status,302);
 const response=await x.signer.fetch(request('/fishing/release.json'));
 assert.equal(response.status,200);
 assert.equal(await response.text(),'bytes');
 assert.equal(response.headers.get('Set-Cookie'),null);
 assert.equal(x.state.page[0].url,PAGE);
 assert.equal(x.state.page[0].options.credentials,'omit');
 assert.equal(x.state.app.length,0);
 assert.equal(x.state.crypto,0);
});

test('D6-SIGNED03 only authorized owner status is exposed',async()=>{
 const x=make({gatewayEnabled:true,sessionEnabled:true});
 const response=await x.signer.fetch(owner('/session'));
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),{
  authenticated:true,authorized:true,ownerLogin:'ginosega',
 });
 assert.equal(x.state.app.length,0);
 assert.equal(x.state.crypto,0);
});

test('D6-SIGNED04 wrong owner rejected before App or JWT',async()=>{
 const db=database({id:OWNER+1});
 const x=make({AUTH_DB:db,gatewayEnabled:true,sessionEnabled:true,
  sourceEnabled:true,tokenEnabled:true,signerEnabled:true});
 assert.equal((await x.signer.fetch(
  owner('/api/v3/authoring-source'))).status,401);
 assert.equal(x.state.app.length,0);
 assert.equal(x.state.page.length,0);
 assert.equal(x.state.crypto,0);
});

test('D6-SIGNED05 hosted V2 cannot activate production signer',async()=>{
 const x=make({gatewayEnabled:true,sessionEnabled:true,sourceEnabled:true,
  tokenEnabled:true,signerEnabled:true,
  transport:async(url,opts)=>{
   x.state.page.push({url,opts});
   if(url!==PAGE)throw Error('wrong route');
   return new Response(JSON.stringify({
    id:'b'.repeat(32),sourceRevision:'a'.repeat(40),
    manifest:'releases/'+('b'.repeat(32))+'/manifest.json',
    manifestSha256:'c'.repeat(64),
    schemaVersions:{gear:2,kb:2,catches:2},pendingMedia:false,
   }),{headers:{'Content-Type':'application/json'}});
  },
 });
 const result=await x.signer.fetch(owner('/api/v3/authoring-source'));
 assert.equal(result.status,503);
 assert.deepEqual(x.state.page.map(r=>r.url),[PAGE]);
 assert.equal(x.state.app.length,0);
 assert.equal(x.state.crypto,0);
});

test('D6-SIGNED06 signer enablement alone never grants token or source',async()=>{
 for(const flags of [
  {signerEnabled:true},
  {gatewayEnabled:true,signerEnabled:true},
  {gatewayEnabled:true,sessionEnabled:true,signerEnabled:true},
  {gatewayEnabled:true,sessionEnabled:true,sourceEnabled:true,
   signerEnabled:true},
  {gatewayEnabled:true,sessionEnabled:true,tokenEnabled:true,
   signerEnabled:true},
 ]){
  const x=make(flags);
  assert.equal((await x.signer.fetch(
   owner('/api/v3/authoring-source'))).status,503);
  assert.equal(x.state.app.length,0);
  assert.equal(x.state.crypto,0);
 }
});

test('D6-SIGNED07 publishing/OAuth and cross-origin requests denied',async()=>{
 const x=make({gatewayEnabled:true,sessionEnabled:true,sourceEnabled:true,
  tokenEnabled:true,signerEnabled:true});
 for(const req of [
  owner('/api/v3/operations',{method:'POST'}),
  owner('/api/v3/media',{method:'POST'}),
  owner('/auth/callback'),
  owner('/auth/start'),
  request('/api/v3/authoring-source',{headers:{
   'Sec-Fetch-Site':'cross-site',
  }}),
 ]){
  const response=await x.signer.fetch(req);
  assert([403,404,405].includes(response.status));
 }
 assert.equal(x.state.app.length,0);
 assert.equal(x.state.crypto,0);
});

test('D6-SIGNED08 invalid flags and crypto dependencies fail at creation',()=>{
 for(const opts of [
  {signerEnabled:'true'},{tokenEnabled:()=>true},{now:1},
  {cryptoApi:{}},{cryptoApi:{subtle:{importKey:async()=>{}}}},
  {requestAppGitHub:null},{transport:null},
 ]){
  assert.throws(()=>make(opts));
 }
});

test('D6-SIGNED09 no new Worker, sandbox, credential or write surface',()=>{
 const code=readFileSync(new URL(
  '../../experiments/p3/preview/src/d6-production-read-with-signer.mjs',
  import.meta.url),'utf8');
 assert.match(code,/createD6ProductionAppSigner/);
 assert.match(code,/signAppJwt:signer\.signAppJwt/);
 assert.match(code,/signerEnabled===true/);
 assert.match(code,/signerEnabled=false/);
 assert.doesNotMatch(code,/export default|addEventListener\(/);
 assert.doesNotMatch(code,/1430581407|fishing-p3-sandbox/);
 assert.doesNotMatch(code,/authorizeWrite|issueWriteToken|DB\.prepare/);
 assert.doesNotMatch(code,/D2_GITHUB_APP_PRIVATE_KEY|D3_GITHUB_APP_ID/);
});
