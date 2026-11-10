import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD6ProductionReadTokenIssuer,D6ProductionReadTokenError}
 from '../../experiments/p3/preview/src/d6-production-read-token.mjs';

const REPO=1350909744,NAME='ginosega/fishing',SANDBOX=1430581407;
const API='https://api.github.com';
const INSTALL=API+'/app/installations/42';
const TARGET=API+'/repos/'+NAME+'/installation';
const MINT=INSTALL+'/access_tokens';
const AT=1800000000;
const JWT='eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiI3NyJ9.signature';
const TOKEN='production-test-token-no-real-access-abcdef';
const scope={contents:'read'};
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{
 status,headers:{'Content-Type':'application/json',...headers},
});
const validInstallation=()=>({
 id:42,app_id:77,account:{login:'ginosega'},
 repository_selection:'selected',suspended_at:null,
 permissions:{contents:'write',metadata:'read',pull_requests:'write'},
});
const validTarget=()=>({
 id:42,app_id:77,account:{login:'ginosega'},suspended_at:null,
});
const validToken=()=>({
 token:TOKEN,permissions:{contents:'read',metadata:'read'},
 repositories:[{id:REPO,full_name:NAME}],
 expires_at:new Date((AT+3600)*1000).toISOString(),
});
const env=()=>({
 D6_GITHUB_APP_ID:'77',
 D6_GITHUB_INSTALLATION_ID:'42',
 D6_GITHUB_APP_PRIVATE_KEY:'SERVER_KEY_PLACEHOLDER_NOT_REAL_1234567890',
});
function harness({
 credentials=env(),installation=validInstallation(),
 target=validTarget(),issued=validToken(),active=true,
 signer,transport,at=AT,
}={}){
 const state={active,calls:[],signs:[]};
 const request=async (url,options)=>{
  state.calls.push({url,options});
  if(transport)return transport(url,options);
  if(url===INSTALL)return json(installation);
  if(url===TARGET)return json(target);
  if(url===MINT)return json(issued,201);
  throw Error('unexpected URL');
 };
 const issue=createD6ProductionReadTokenIssuer({
  env:credentials,request,enabled:()=>state.active,now:()=>at,
  signAppJwt:async args=>{
   state.signs.push(args);
   return signer?signer(args):JWT;
  },
 });
 const grant=()=>issue.issueReadToken({repositoryId:REPO,permissions:scope});
 return {issue,grant,state};
}
async function denied(p,code){
 await assert.rejects(p,e=>e instanceof D6ProductionReadTokenError&&
  e.code===code&&e.message==='D6 production read grant unavailable');
}

test('D6-TOKEN01 off by default, no App JWT, network or token',async()=>{
 const x=harness({active:false});
 await denied(x.grant(),'DISABLED');
 assert.equal(x.state.calls.length,0);
 assert.equal(x.state.signs.length,0);
 assert.deepEqual(Object.keys(x.issue),['issueReadToken']);
 assert(Object.isFrozen(x.issue));
 const fresh=createD6ProductionReadTokenIssuer({
  env:env(),request:async()=>{throw Error('called');},
  signAppJwt:async()=>{throw Error('called');},
 });
 await denied(fresh.issueReadToken({repositoryId:REPO,permissions:scope}),
  'DISABLED');
});

test('D6-TOKEN02 canonical repository and contents:read only',async()=>{
 const x=harness();
 for(const params of [
  {repositoryId:SANDBOX,permissions:scope},
  {repositoryId:REPO,permissions:{contents:'write'}},
  {repositoryId:REPO,permissions:{contents:'read',pull_requests:'read'}},
  {repositoryId:REPO,permissions:{checks:'read'}},
  {repositoryId:REPO,permissions:['contents:read']},
  {repositoryId:NAME,permissions:scope},
  {},
 ]){
  await denied(x.issue.issueReadToken(params),'READ_SCOPE_DENIED');
 }
 assert.equal(x.state.calls.length,0);
 assert.equal(x.state.signs.length,0);
});

test('D6-TOKEN03 exact App/installation/repository + narrowed grant',async()=>{
 const x=harness();
 const result=await x.grant();
 assert.deepEqual(result,{repositoryId:REPO,permissions:scope,token:TOKEN});
 assert(Object.isFrozen(result));
 assert(Object.isFrozen(result.permissions));
 assert.equal(x.state.signs.length,1);
 assert.deepEqual(x.state.signs[0],{
  appId:'77',privateKey:env().D6_GITHUB_APP_PRIVATE_KEY,now:AT,
 });
 assert.deepEqual(x.state.calls.map(x=>x.url),[INSTALL,TARGET,MINT]);
 for(const {url,options} of x.state.calls){
  assert.equal(options.headers.Authorization,'Bearer '+JWT);
  assert.equal(options.headers.Accept,'application/vnd.github+json');
  assert.equal(options.redirect,'manual');
  assert.equal(options.credentials,'omit');
  assert.equal(options.cache,'no-store');
  assert.equal(options.method,url===MINT?'POST':'GET');
 }
 assert.deepEqual(JSON.parse(x.state.calls[2].options.body),{
  repository_ids:[REPO],permissions:{contents:'read'},
 });
 assert.equal(Object.hasOwn(x.state.calls[0].options,'body'),false);
 assert.equal(Object.hasOwn(x.state.calls[1].options,'body'),false);
});

test('D6-TOKEN04 missing credentials, invalid clock or signer denies',async()=>{
 for(const credentials of [
  {},{...env(),D6_GITHUB_APP_ID:'0'},
  {...env(),D6_GITHUB_INSTALLATION_ID:'42x'},
  {...env(),D6_GITHUB_APP_PRIVATE_KEY:''},
 ]){
  const x=harness({credentials});
  await denied(x.grant(),'MISSING_SERVER_CREDENTIALS');
  assert.equal(x.state.signs.length,0);
  assert.equal(x.state.calls.length,0);
 }
 const badClock=harness({at:-1});
 await denied(badClock.grant(),'INVALID_CLOCK');
 const signError=harness({signer:async()=>{throw Error('private key text');}});
 await denied(signError.grant(),'APP_SIGNING_DENIED');
 assert.equal(signError.state.calls.length,0);
 const badJwt=harness({signer:async()=>TOKEN});
 await denied(badJwt.grant(),'APP_SIGNING_DENIED');
 assert.equal(badJwt.state.calls.length,0);
});

test('D6-TOKEN05 installation must belong to selected owner/repo grant',async()=>{
 for(const installation of [
  {...validInstallation(),id:43},
  {...validInstallation(),app_id:78},
  {...validInstallation(),account:{login:'foreign-owner'}},
  {...validInstallation(),repository_selection:'all'},
  {...validInstallation(),suspended_at:'2026-11-09T00:00:00Z'},
  {...validInstallation(),permissions:{metadata:'read'}},
 ]){
  const x=harness({installation});
  await denied(x.grant(),'INSTALLATION_DENIED');
  assert.deepEqual(x.state.calls.map(c=>c.url),[INSTALL]);
 }
});

test('D6-TOKEN06 production repo installation must match exact App',async()=>{
 for(const target of [
  {...validTarget(),id:43},
  {...validTarget(),app_id:78},
  {...validTarget(),account:{login:'someone-else'}},
  {...validTarget(),suspended_at:'2026-11-09T00:00:00Z'},
 ]){
  const x=harness({target});
  await denied(x.grant(),'TARGET_DENIED');
  assert.deepEqual(x.state.calls.map(c=>c.url),[INSTALL,TARGET]);
 }
});

test('D6-TOKEN07 minted token never accepts write or extra permissions',async()=>{
 for(const permissions of [
  {contents:'write'},
  {contents:'read',checks:'read'},
  {contents:'read',pull_requests:'write'},
  {contents:'read',metadata:'write'},
  {},
 ]){
  const x=harness({issued:{...validToken(),permissions}});
  await denied(x.grant(),'TOKEN_SCOPE_DENIED');
 }
});

test('D6-TOKEN08 minted token must pin only production repo and time',async()=>{
 for(const issued of [
  {...validToken(),repositories:[{id:SANDBOX,full_name:'ginosega/fishing-p3-sandbox'}]},
  {...validToken(),repositories:[{id:REPO,full_name:'evil/fishing'}]},
  {...validToken(),repositories:[
   {id:REPO,full_name:NAME},{id:SANDBOX,full_name:'other/repo'}]},
  {...validToken(),token:'short'},
  {...validToken(),expires_at:new Date((AT+20)*1000).toISOString()},
  {...validToken(),expires_at:new Date((AT+8000)*1000).toISOString()},
  {...validToken(),expires_at:'not-a-date'},
 ]){
  const x=harness({issued});
  await denied(x.grant(),'TOKEN_SCOPE_DENIED');
 }
});

test('D6-TOKEN09 redirect, error, nonjson and too-large API response deny',async()=>{
 for(const transport of [
  async()=>Response.redirect('https://evil.invalid',302),
  async()=>new Response('fail',{status:403}),
  async()=>new Response('<html>wrong</html>',{
   headers:{'Content-Type':'text/html'},
  }),
  async()=>json(validInstallation(),200,{'Content-Length':'131073'}),
  async()=>json({junk:'x'.repeat(131073)}),
 ]){
  const x=harness({transport});
  const code=transport===null?'':'';
  await assert.rejects(x.grant(),e=>e instanceof D6ProductionReadTokenError);
  assert.equal(x.state.calls.length,1);
 }
});

test('D6-TOKEN10 malformed metadata does not mint a token',async()=>{
 const x=harness({transport:async()=>new Response('not-json',{
  status:200,headers:{'Content-Type':'application/json'},
 })});
 await denied(x.grant(),'INVALID_GITHUB_RESPONSE');
 assert.equal(x.state.calls.length,1);
});

test('D6-TOKEN11 runtime disables issuance after a successful grant',async()=>{
 const x=harness();
 await x.grant();
 x.state.active=false;
 await denied(x.grant(),'DISABLED');
 assert.equal(x.state.calls.length,3);
 assert.equal(x.state.signs.length,1);
});

test('D6-TOKEN12 source has no sandbox issuer, default Worker or HTTP route',()=>{
 const contents=readFileSync(new URL(
  '../../experiments/p3/preview/src/d6-production-read-token.mjs',
  import.meta.url),'utf8');
 assert.match(contents,/repository_ids:\[REPO.id\],permissions:SCOPE/);
 assert.match(contents,/const SCOPE=Object.freeze\(\{contents:'read'\}\)/);
 assert.doesNotMatch(contents,/1430581407|fishing-p3-sandbox/);
 assert.doesNotMatch(contents,/export default|addEventListener\(/);
 assert.doesNotMatch(contents,/issueWriteToken|createSandboxWriteTokenIssuer/);
 assert.doesNotMatch(contents,/D2_GITHUB_APP_PRIVATE_KEY|D3_GITHUB_APP_ID/);
});

test('D6-TOKEN13 invalid factory dependencies are rejected',()=>{
 for(const opts of [
  {request:null},{signAppJwt:null},{enabled:true},{now:123},
 ]){
  assert.throws(()=>createD6ProductionReadTokenIssuer({
   env:env(),request:async()=>{},
   signAppJwt:async()=>JWT,...opts,
  }),e=>e instanceof D6ProductionReadTokenError&&
   e.code==='INVALID_CONFIG');
 }
});
