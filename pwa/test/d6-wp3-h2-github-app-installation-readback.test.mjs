import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6H2AppInstallationReadback,
 verifyD6H2AppInstallationEvidence,D6H2AppReadError}
 from '../tools/d6-wp3-h2-github-app-installation-readback.mjs';

const APP_ID=557700,INSTALLATION_ID=886600;
const JWT='eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOjU1NzcwMH0.signature';
const TOKEN='ghs_installed_1234567890';
const ACCOUNT=265665562,REPO_ID=1350909744;
const installation=()=>({
 id:INSTALLATION_ID,app_id:APP_ID,
 account:{id:ACCOUNT,login:'ginosega'},
 target_id:ACCOUNT,target_type:'User',
 repository_selection:'selected',
 permissions:{contents:'write',pull_requests:'write',metadata:'read'},
 suspended_at:null,
});
const repositories=()=>({
 total_count:1,repositories:[{
  id:REPO_ID,name:'fishing',full_name:'ginosega/fishing',
  owner:{id:ACCOUNT,login:'ginosega'},
  private:true,default_branch:'main',archived:false,disabled:false,
 }],
});
const json=x=>new Response(JSON.stringify(x),{
 status:200,headers:{'Content-Type':'application/json'},
});
const cleanProof=()=>({verified:true,appId:APP_ID,
 installationId:INSTALLATION_ID,repositoriesRestricted:false,
});
function adapter({app=installation(),repos=repositories(),
 scope=cleanProof(),token=TOKEN,jwt=JWT,throwNetwork=false,
}={}){
 const calls=[];
 const reader=createD6H2AppInstallationReadback({
  appId:APP_ID,installationId:INSTALLATION_ID,
  getAppJwt:async()=>jwt,
  getInstallationToken:async()=>token,
  assertUnrestrictedInstallationToken:async()=>scope,
  network:async(url,opts)=>{
   calls.push({url,opts});
   if(throwNetwork)throw Error('no secrets to print');
   if(url.endsWith('/app/installations/'+INSTALLATION_ID))return json(app);
   if(url.endsWith('/installation/repositories?per_page=100'))
    return json(repos);
   throw Error('unexpected URL');
  },
 });
 return {reader,calls};
}
const denied=(fn,code)=>assert.rejects(fn,e=>
 e instanceof D6H2AppReadError&&e.code===code);

test('WP3-H2APP01 two exact GitHub GET calls prove restricted App and one repository',async()=>{
 const x=adapter(),got=await x.reader.read();
 assert.equal(got.verified,true);
 assert.equal(got.repositoryFullName,'ginosega/fishing');
 assert.equal(got.repositorySelection,'selected');
 assert.equal(got.installedRepositoryCount,1);
 assert.equal(got.permissions.contents,'write');
 assert.equal(got.permissions.pull_requests,'write');
 assert.equal(got.canPublish,false);assert.equal(got.isLive,false);
 assert(Object.isFrozen(got));
 assert.equal(x.calls.length,2);
 assert.equal(x.calls[0].url,
  'https://api.github.com/app/installations/'+INSTALLATION_ID);
 assert.equal(x.calls[1].url,
  'https://api.github.com/installation/repositories?per_page=100');
 assert.deepEqual(x.calls.map(x=>x.opts.method),['GET','GET']);
 assert.deepEqual(x.calls.map(x=>x.opts.redirect),['error','error']);
 assert.equal(x.calls[0].opts.headers.Authorization,'Bearer '+JWT);
 assert.equal(x.calls[1].opts.headers.Authorization,'Bearer '+TOKEN);
 assert(!JSON.stringify(got).includes(TOKEN));
 assert(!JSON.stringify(got).includes(JWT));
});
test('WP3-H2APP02 only selected owner installation and exact App ID accepted',()=>{
 for(const bad of [
  {app_id:99},{id:100},{target_id:100},
  {target_type:'Organization'},
  {repository_selection:'all'},
  {account:{id:100,login:'other'}},
  {account:{id:ACCOUNT,login:'other'}},
  {suspended_at:'2026-11-18T12:00:00Z'},
 ]){
  assert.throws(()=>verifyD6H2AppInstallationEvidence({
   installation:{...installation(),...bad},
   repositories:repositories(),appId:APP_ID,installationId:INSTALLATION_ID,
  }),D6H2AppReadError);
 }
});
test('WP3-H2APP03 forbid extra permissions and missing Contents/PR write',()=>{
 for(const perms of [
  {...installation().permissions,administration:'write'},
  {...installation().permissions,workflows:'write'},
  {...installation().permissions,issues:'read'},
  {...installation().permissions,contents:'read'},
  {...installation().permissions,pull_requests:'read'},
  {contents:'write',metadata:'read'},
  {pull_requests:'write',metadata:'read'},
 ]){
  const bad={...installation(),permissions:perms};
  assert.throws(()=>verifyD6H2AppInstallationEvidence({
   installation:bad,repositories:repositories(),
   appId:APP_ID,installationId:INSTALLATION_ID,
  }),e=>e.code==='APP_PERMISSIONS_MISMATCH');
 }
});
test('WP3-H2APP04 extra or wrong repository always fails closed',()=>{
 for(const bad of [
  {total_count:2},{total_count:0},{repositories:[]},
  {repositories:[...repositories().repositories,{id:2}]},
  {repositories:[{...repositories().repositories[0],id:2}]},
  {repositories:[{...repositories().repositories[0],full_name:'other/fishing'}]},
  {repositories:[{...repositories().repositories[0],private:false}]},
  {repositories:[{...repositories().repositories[0],archived:true}]},
  {repositories:[{...repositories().repositories[0],default_branch:'develop'}]},
 ]){
  assert.throws(()=>verifyD6H2AppInstallationEvidence({
   installation:installation(),
   repositories:{...repositories(),...bad},
   appId:APP_ID,installationId:INSTALLATION_ID,
  }),D6H2AppReadError);
 }
});
test('WP3-H2APP05 provenance of unrestricted installation token mandatory',async()=>{
 for(const scope of [
  {verified:false,appId:APP_ID,installationId:INSTALLATION_ID,
   repositoriesRestricted:false},
  {verified:true,appId:APP_ID,installationId:INSTALLATION_ID,
   repositoriesRestricted:true},
  {verified:true,appId:9,installationId:INSTALLATION_ID,
   repositoriesRestricted:false},
  {verified:true,appId:APP_ID,installationId:9,
   repositoriesRestricted:false},null,
 ]){
  const x=adapter({scope});
  await denied(()=>x.reader.read(),'INSTALLATION_AUTH_UNAVAILABLE');
  assert.equal(x.calls.length,1,'do not request repo list with untrusted token');
 }
});
test('WP3-H2APP06 wrong JWT or short token never reaches repository GET',async()=>{
 for(const jwt of ['not.a.jwt.with.more','bad', '',null]){
  const x=adapter({jwt});
  await denied(()=>x.reader.read(),'APP_AUTH_UNAVAILABLE');
  assert.equal(x.calls.length,0);
 }
 for(const token of ['bad','abc\r\ndef',null]){
  const x=adapter({token});
  await denied(()=>x.reader.read(),'INSTALLATION_AUTH_UNAVAILABLE');
  assert.equal(x.calls.length,1);
 }
});
test('WP3-H2APP07 App installation API failure is not an approval',async()=>{
 const x=adapter({throwNetwork:true});
 await denied(()=>x.reader.read(),'NETWORK_UNAVAILABLE');
 assert.equal(x.calls.length,1);
});
test('WP3-H2APP08 installation/repository errors fail before any write',async()=>{
 for(const change of [
  {app:{...installation(),repository_selection:'all'}},
  {app:{...installation(),permissions:{contents:'read'}}},
  {repos:{...repositories(),total_count:2}},
 ]){
  const x=adapter(change);
  await assert.rejects(x.reader.read(),D6H2AppReadError);
  assert.equal(x.calls.every(x=>x.opts.method==='GET'),true);
 }
});
test('WP3-H2APP09 missing App identity or token factories never accepted',()=>{
 for(const change of [
  {appId:0},{installationId:0},
  {getAppJwt:null},{getInstallationToken:null},
  {assertUnrestrictedInstallationToken:null},
 ]){
  assert.throws(()=>createD6H2AppInstallationReadback({
   appId:APP_ID,installationId:INSTALLATION_ID,
   getAppJwt:()=>JWT,getInstallationToken:()=>TOKEN,
   assertUnrestrictedInstallationToken:()=>cleanProof(),...change,
  }),D6H2AppReadError);
 }
});
