import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD6ProductionReadWithApp}
 from '../../experiments/p3/preview/src/d6-production-read-with-app.mjs';

const ORIGIN='https://fishing.ginosega.workers.dev';
const PAGES='https://ginosega.github.io/fishing/';
const OWNER=265665562,NOW=2000000000,COOKIE='A'.repeat(43);
const req=(path,opt={})=>new Request(ORIGIN+path,opt);
const owner=(path,opt={})=>req(path,{...opt,headers:{
 Cookie:'__Host-fish_p0_session='+COOKIE,
 'Sec-Fetch-Site':'same-origin',...opt.headers,
}});
function database({id=OWNER,expires=NOW+3600}={}){
 let reads=0;
 return {get reads(){return reads;},prepare(sql){
  assert.match(sql,/SELECT github_id,expires_at FROM sessions/);
  return {bind(){reads++;return {
   first:async()=>({github_id:id,expires_at:expires}),
  }}};
 }};
}
function make(flags={}){
 const state={calls:[],appCalls:[],signs:[]};
 const db=database();
 const candidate=createD6ProductionReadWithApp({
  AUTH_DB:db,csrfKey:'simulation-only-csrf-key-xxxxxxxxxxxxxxxxxxxxxxxx',
  now:()=>NOW,appEnv:{
   D6_GITHUB_APP_ID:'77',D6_GITHUB_INSTALLATION_ID:'42',
   D6_GITHUB_APP_PRIVATE_KEY:'simulation-only-key-not-a-real-private-key',
  },
  transport:async(url,opts)=>{
   state.calls.push({url,opts});
   throw Error('Unconfigured upstream');
  },
  requestAppGitHub:async(url,opts)=>{
   state.appCalls.push({url,opts});
   throw Error('Unconfigured App transport');
  },
  signAppJwt:async args=>{
   state.signs.push(args);
   throw Error('Unconfigured App signer');
  },
  ...flags,
 });
 return {candidate,state,db};
}

test('D6-APP01 all switches default OFF; no database or network',async()=>{
 const x=make();
 for(const path of ['/','/fishing/release.json','/session',
  '/api/v3/authoring-source']){
  assert.equal((await x.candidate.fetch(req(path))).status,503);
 }
 assert.equal(x.db.reads,0);
 assert.equal(x.state.calls.length,0);
 assert.equal(x.state.appCalls.length,0);
 assert.equal(x.state.signs.length,0);
 assert.deepEqual(Object.keys(x.candidate).sort(),[
  'fetch','verifyHostedBytes',
 ]);
 assert(Object.isFrozen(x.candidate));
});

test('D6-APP02 static-only public Pages proxy never invokes App',async()=>{
 const x=make({gatewayEnabled:true,staticEnabled:true,
  transport:async(url,opts)=>{
   x.state.calls.push({url,opts});
   return new Response('public-bytes',{status:200,headers:{
    'Content-Type':'text/plain','Set-Cookie':'untrusted=true',
   }});
  },
 });
 assert.equal((await x.candidate.fetch(req('/'))).status,302);
 const res=await x.candidate.fetch(req('/fishing/release.json'));
 assert.equal(res.status,200);
 assert.equal(await res.text(),'public-bytes');
 assert.equal(res.headers.get('Set-Cookie'),null);
 assert.equal(x.state.calls.length,1);
 assert.equal(x.state.calls[0].url,PAGES+'release.json');
 assert.equal(x.state.calls[0].opts.credentials,'omit');
 assert.equal(x.db.reads,0);
 assert.equal(x.state.appCalls.length,0);
});

test('D6-APP03 owner session visible only through redacted status',async()=>{
 const x=make({gatewayEnabled:true,sessionEnabled:true});
 const result=await x.candidate.fetch(owner('/session'));
 assert.equal(result.status,200);
 assert.deepEqual(await result.json(),{
  authenticated:true,authorized:true,ownerLogin:'ginosega',
 });
 assert.equal(result.headers.get('Set-Cookie'),null);
 assert.equal(x.db.reads,1);
 assert.equal(x.state.appCalls.length,0);
 assert.equal(x.state.signs.length,0);
});

test('D6-APP04 no source access without all gateway/session/source gates',async()=>{
 for(const flags of [
  {gatewayEnabled:true,tokenEnabled:true},
  {gatewayEnabled:true,sourceEnabled:true,tokenEnabled:true},
  {gatewayEnabled:true,sessionEnabled:true,tokenEnabled:true},
 ]){
  const x=make(flags);
  assert.equal((await x.candidate.fetch(
   owner('/api/v3/authoring-source'))).status,503);
  assert.equal(x.state.calls.length,0);
  assert.equal(x.state.appCalls.length,0);
  assert.equal(x.state.signs.length,0);
 }
});

test('D6-APP05 verified owner but hosted V2 rejects before token issuance',async()=>{
 const x=make({gatewayEnabled:true,sessionEnabled:true,
  sourceEnabled:true,tokenEnabled:true,
  transport:async(url,opts)=>{
   x.state.calls.push({url,opts});
   if(url!==PAGES+'release.json')throw Error('unexpected URL');
   return new Response(JSON.stringify({
    id:'b'.repeat(32),sourceRevision:'a'.repeat(40),
    manifest:'releases/'+('b'.repeat(32))+'/manifest.json',
    manifestSha256:'c'.repeat(64),
    schemaVersions:{gear:2,kb:2,catches:2},
    pendingMedia:false,
    // d6ReaderCandidate intentionally absent: public V2 is not V3.
   }),{status:200,headers:{'Content-Type':'application/json'}});
  },
 });
 const resp=await x.candidate.fetch(owner('/api/v3/authoring-source'));
 assert.equal(resp.status,503);
 assert.deepEqual(x.state.calls.map(c=>c.url),[PAGES+'release.json']);
 assert.equal(x.db.reads,1);
 assert.equal(x.state.appCalls.length,0);
 assert.equal(x.state.signs.length,0);
});

test('D6-APP06 invalid or foreign owner never reaches release or App',async()=>{
 for(const opts of [{id:OWNER+1},{expires:NOW-1}]){
  const db=database(opts);
  const x=make({gatewayEnabled:true,sessionEnabled:true,
   sourceEnabled:true,tokenEnabled:true,AUTH_DB:db});
  assert.equal((await x.candidate.fetch(
   owner('/api/v3/authoring-source'))).status,401);
  assert.equal(x.state.calls.length,0);
  assert.equal(x.state.appCalls.length,0);
 }
});

test('D6-APP07 off token gate has no public issuance or writer route',async()=>{
 const x=make({gatewayEnabled:true,sessionEnabled:true,
  sourceEnabled:true,tokenEnabled:false});
 for(const r of [
  owner('/api/v3/operations',{method:'POST'}),
  owner('/api/v3/media',{method:'POST'}),
  owner('/auth/callback'),
  owner('/session/signout'),
  req('/api/v3/authoring-source',{
   headers:{Origin:'https://foreign.invalid'},
  }),
 ]){
  assert([403,404,405].includes((await x.candidate.fetch(r)).status));
 }
 assert.equal(x.state.appCalls.length,0);
 assert.equal(x.state.signs.length,0);
});

test('D6-APP08 explicit preflight is OFF and does not call App',async()=>{
 const x=make();
 await assert.rejects(x.candidate.verifyHostedBytes({
  expectedSourceRevision:'a'.repeat(40),
 }),e=>e?.code==='DISABLED');
 assert.equal(x.state.calls.length,0);
 assert.equal(x.state.appCalls.length,0);
});

test('D6-APP09 invalid dependencies and switches fail at construction',()=>{
 for(const bad of [
  {gatewayEnabled:'true'},{tokenEnabled:()=>true},{now:123},
  {transport:null},{requestAppGitHub:null},{signAppJwt:null},
 ]){
  assert.throws(()=>make(bad));
 }
});

test('D6-APP10 exact issuer interface only; no sandbox or deploy surface',()=>{
 const content=readFileSync(new URL(
  '../../experiments/p3/preview/src/d6-production-read-with-app.mjs',
  import.meta.url),'utf8');
 assert.match(content,/createD6ProductionReadTokenIssuer/);
 assert.match(content,/tokenEnabled===true/);
 assert.match(content,/issueReadToken:issuer.issueReadToken/);
 assert.doesNotMatch(content,/export default|addEventListener\(/);
 assert.doesNotMatch(content,/1430581407|fishing-p3-sandbox/);
 assert.doesNotMatch(content,/issueWriteToken|authorizeWrite/);
 assert.doesNotMatch(content,/D2_GITHUB_APP_PRIVATE_KEY|D3_GITHUB_APP_ID/);
});
