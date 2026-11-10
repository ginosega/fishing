import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD6ProductionWriteTokenIssuer,D6ProductionWriteTokenError}
 from '../../experiments/p3/preview/src/d6-production-write-token.mjs';

const REPO=1350909744,OWNER=265665562,SANDBOX=1430581407;
const API='https://api.github.com',MAIN='ginosega/fishing';
const INST=API+'/app/installations/42';
const TARGET=API+'/repos/'+MAIN+'/installation';
const MINT=INST+'/access_tokens';
const NOW=1800000000;
const JWT='eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiI3NyJ9.signature';
const TOKEN='source-only-not-an-authentic-token-1234567890';
const SCOPE={contents:'write',pull_requests:'write'};
const json=(value,status=200,headers={})=>new Response(
 JSON.stringify(value),{status,headers:{
  'Content-Type':'application/json',...headers,
 }});
const installation=()=>({
 id:42,app_id:77,account:{id:OWNER,login:'ginosega'},
 repository_selection:'selected',suspended_at:null,
 permissions:{contents:'write',pull_requests:'write',metadata:'read'},
});
const target=()=>({
 id:42,app_id:77,account:{id:OWNER,login:'ginosega'},
 suspended_at:null,
});
const grant=()=>({
 token:TOKEN,permissions:{...SCOPE,metadata:'read'},
 repositories:[{id:REPO,full_name:MAIN}],
 expires_at:new Date((NOW+3600)*1000).toISOString(),
});
const env=()=>({
 D6_GITHUB_APP_ID:'77',
 D6_GITHUB_INSTALLATION_ID:'42',
 D6_GITHUB_APP_PRIVATE_KEY:'NOT_REAL_PRIVATE_KEY_PLACEHOLDER_123456789',
});
function setup({
 active=true,credentials=env(),inst=installation(),
 repository=target(),issued=grant(),network,signer,clock=NOW,
}={}){
 const state={active,signs:[],calls:[]};
 const request=async(url,options)=>{
  state.calls.push({url,options});
  if(network)return network(url,options,state);
  if(url===INST)return json(inst);
  if(url===TARGET)return json(repository);
  if(url===MINT)return json(issued,201);
  throw Error('unexpected request');
 };
 const issuer=createD6ProductionWriteTokenIssuer({
  env:credentials,request,now:()=>clock,
  enabled:()=>state.active,
  signAppJwt:async params=>{
   state.signs.push(params);
   return signer?signer(params,state):JWT;
  },
 });
 return {issuer,state,mint:()=>issuer.issueWriteToken({
  repositoryId:REPO,permissions:SCOPE,
 })};
}
const denied=async(p,code)=>assert.rejects(p,e=>
 e instanceof D6ProductionWriteTokenError&&e.code===code&&
 e.message==='D6 production write grant unavailable');

test('D6-WTOKEN01 default OFF never signs, fetches or mints',async()=>{
 const x=setup({active:false});
 await denied(x.mint(),'DISABLED');
 assert.deepEqual(x.state.calls,[]);
 assert.deepEqual(x.state.signs,[]);
 const noFlag=createD6ProductionWriteTokenIssuer({
  env:env(),request:async()=>{throw Error('network');},
  signAppJwt:async()=>{throw Error('sign');},
 });
 await denied(noFlag.issueWriteToken({
  repositoryId:REPO,permissions:SCOPE,
 }),'DISABLED');
 assert.deepEqual(Object.keys(x.issuer),['issueWriteToken']);
});

test('D6-WTOKEN02 exact numeric repo and minimum write scope only',async()=>{
 const x=setup();
 for(const args of [
  {},{repositoryId:SANDBOX,permissions:SCOPE},
  {repositoryId:MAIN,permissions:SCOPE},
  {repositoryId:REPO,permissions:{contents:'write'}},
  {repositoryId:REPO,permissions:{contents:'read',pull_requests:'write'}},
  {repositoryId:REPO,permissions:{contents:'write',pull_requests:'read'}},
  {repositoryId:REPO,permissions:{...SCOPE,actions:'write'}},
  {repositoryId:REPO,permissions:['contents:write','pull_requests:write']},
 ]){
  await denied(x.issuer.issueWriteToken(args),'WRITE_SCOPE_DENIED');
 }
 assert.equal(x.state.calls.length,0);
 assert.equal(x.state.signs.length,0);
});

test('D6-WTOKEN03 exact App, selected installation, repo and narrowed mint',async()=>{
 const x=setup();
 const r=await x.mint();
 assert.deepEqual(r,{
  repositoryId:REPO,permissions:SCOPE,token:TOKEN,
  expiresAt:NOW+3600,
 });
 assert.equal(Object.isFrozen(r),true);
 assert.deepEqual(x.state.signs,[{
  appId:'77',privateKey:env().D6_GITHUB_APP_PRIVATE_KEY,now:NOW,
 }]);
 assert.deepEqual(x.state.calls.map(x=>x.url),[INST,TARGET,MINT]);
 for(const {url,options} of x.state.calls){
  assert.equal(options.method,url===MINT?'POST':'GET');
  assert.equal(options.redirect,'manual');
  assert.equal(options.credentials,'omit');
  assert.equal(options.cache,'no-store');
  assert.equal(options.headers.Authorization,'Bearer '+JWT);
  assert.equal(options.headers.Accept,'application/vnd.github+json');
  assert.equal(Object.hasOwn(options,'body'),url===MINT);
 }
 assert.deepEqual(JSON.parse(x.state.calls[2].options.body),{
  repository_ids:[REPO],permissions:SCOPE,
 });
});

test('D6-WTOKEN04 missing secrets, invalid App ID or clock block mint',async()=>{
 for(const credentials of [
  {},{...env(),D6_GITHUB_APP_ID:'0'},
  {...env(),D6_GITHUB_INSTALLATION_ID:'42x'},
  {...env(),D6_GITHUB_APP_PRIVATE_KEY:'short'},
 ]){
  const x=setup({credentials});
  await denied(x.mint(),'MISSING_SERVER_CREDENTIALS');
  assert.equal(x.state.calls.length,0);
  assert.equal(x.state.signs.length,0);
 }
 const x=setup({clock:-1});
 await denied(x.mint(),'INVALID_CLOCK');
 assert.equal(x.state.calls.length,0);
});

test('D6-WTOKEN05 signer exception and malformed JWT never request network',async()=>{
 for(const signer of [
  async()=>{throw Error('secret information');},
  async()=>TOKEN,async()=>null,
 ]){
  const x=setup({signer});
  await denied(x.mint(),'APP_SIGNING_DENIED');
  assert.equal(x.state.calls.length,0);
 }
});

test('D6-WTOKEN06 selected installation must match exact owner and perms',async()=>{
 for(const bad of [
  {id:41},{app_id:78},{account:{id:0,login:'ginosega'}},
  {account:{id:OWNER,login:'other'}},
  {repository_selection:'all'},{suspended_at:'2026-11-09T00:00:00Z'},
  {permissions:{contents:'read',pull_requests:'write'}},
  {permissions:{contents:'write',pull_requests:'read'}},
 ]){
  const x=setup({inst:{...installation(),...bad}});
  await denied(x.mint(),'INSTALLATION_DENIED');
  assert.deepEqual(x.state.calls.map(x=>x.url),[INST]);
 }
});

test('D6-WTOKEN07 repository installation must belong to same owner/App',async()=>{
 for(const bad of [
  {id:0},{app_id:77.1},{account:{id:0,login:'ginosega'}},
  {account:{id:OWNER,login:'other'}},
  {suspended_at:'2026-11-09T00:00:00Z'},
 ]){
  const x=setup({repository:{...target(),...bad}});
  await denied(x.mint(),'REPOSITORY_DENIED');
  assert.deepEqual(x.state.calls.map(x=>x.url),[INST,TARGET]);
 }
});

test('D6-WTOKEN08 returned grant cannot include extra write powers',async()=>{
 for(const permissions of [
  {contents:'read',pull_requests:'write'},
  {contents:'write',pull_requests:'read'},
  {...SCOPE,actions:'write'},
  {...SCOPE,checks:'read'},
  {...SCOPE,metadata:'write'},
  {...SCOPE,issues:'read'},
  {},
 ]){
  const x=setup({issued:{...grant(),permissions}});
  await denied(x.mint(),'TOKEN_SCOPE_DENIED');
  assert.equal(x.state.calls.length,3);
 }
});

test('D6-WTOKEN09 only correct repository and bounded expiry allowed',async()=>{
 for(const issued of [
  {...grant(),repositories:[{id:SANDBOX,full_name:'ginosega/sandbox'}]},
  {...grant(),repositories:[{id:REPO,full_name:'evil/fishing'}]},
  {...grant(),repositories:[{id:REPO,full_name:MAIN},
   {id:SANDBOX,full_name:'elsewhere/else'}]},
  {...grant(),token:'short'},
  {...grant(),expires_at:'not-date'},
  {...grant(),expires_at:new Date((NOW+10)*1000).toISOString()},
  {...grant(),expires_at:new Date((NOW+5000)*1000).toISOString()},
 ]){
  const x=setup({issued});
  await denied(x.mint(),'TOKEN_SCOPE_DENIED');
 }
});

test('D6-WTOKEN10 GitHub non-JSON, redirect and unavailable fail closed',async()=>{
 for(const network of [
  async()=>Response.redirect('https://evil.invalid',302),
  async()=>new Response('denied',{status:403}),
  async()=>new Response('<html>not-json</html>',{
   status:200,headers:{'Content-Type':'text/html'},
  }),
  async()=>{throw Error('private server credential');},
 ]){
  const x=setup({network});
  await denied(x.mint(),'GITHUB_UNAVAILABLE');
  assert.equal(x.state.calls.length,1);
 }
});

test('D6-WTOKEN11 malformed or oversized response does not mint token',async()=>{
 for(const network of [
  async()=>new Response('invalid',{headers:{
   'Content-Type':'application/json',
  }}),
  async()=>json({text:'x'.repeat(132000)}),
  async()=>json(installation(),200,{'Content-Length':'999999'}),
  async()=>new Response('',{status:200,headers:{
   'Content-Type':'application/json',
  }}),
 ]){
  const x=setup({network});
  await assert.rejects(x.mint(),e=>
   e instanceof D6ProductionWriteTokenError);
  assert.equal(x.state.calls.length,1);
 }
});

test('D6-WTOKEN12 revoke after App checks blocks returning newly minted token',async()=>{
 const x=setup({network:async(url,options,state)=>{
  if(url===INST)return json(installation());
  if(url===TARGET)return json(target());
  if(url===MINT){state.active=false;return json(grant(),201);}
  throw Error('unexpected URL');
 }});
 await denied(x.mint(),'DISABLED');
 assert.equal(x.state.calls.length,3);
});

test('D6-WTOKEN13 no production route, GitHub writer or sandbox App imported',()=>{
 const text=readFileSync(new URL(
  '../../experiments/p3/preview/src/d6-production-write-token.mjs',
  import.meta.url),'utf8');
 assert.match(text,/repository_ids:\[REPO.id\],permissions:SCOPE/);
 assert.match(text,/contents:'write',pull_requests:'write'/);
 assert.doesNotMatch(text,/export default|addEventListener\(/);
 assert.doesNotMatch(text,/1430581407|fishing-p3-sandbox/);
 assert.doesNotMatch(text,/D2_GITHUB_APP_PRIVATE_KEY|D3_GITHUB_APP_ID/);
 assert.doesNotMatch(text,/\/git\/refs\/|\/pulls\/|\/merges\//);
});

test('D6-WTOKEN14 invalid constructor dependencies deny safely',()=>{
 const baseline={env:env(),request:async()=>json(installation()),
  signAppJwt:async()=>JWT};
 for(const bad of [
  {request:null},{signAppJwt:null},{enabled:true},{now:123},
 ]){
  assert.throws(()=>createD6ProductionWriteTokenIssuer({
   ...baseline,...bad,
  }),e=>e instanceof D6ProductionWriteTokenError&&
   e.code==='INVALID_CONFIG');
 }
});
