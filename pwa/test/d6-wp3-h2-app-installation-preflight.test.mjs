import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD6Wp3H2AppInstallationPreflight,D6Wp3H2AppGrantError}
 from '../server/d6-wp3-h2-app-installation-preflight.mjs';

const ID=12345678,OWNER=265665562,REPO_ID=1350909744;
const REPO='ginosega/fishing',API='https://api.github.com';
const JWT='a'.repeat(30)+'.'+'b'.repeat(50)+'.'+'c'.repeat(50);
const TOKEN='ghs_'+'x'.repeat(48);
const env={
 D6_OWNER_GITHUB_ID:String(OWNER),D6_REPOSITORY_ID:String(REPO_ID),
 D6_GITHUB_APP_ID:String(ID),D6_GITHUB_INSTALLATION_ID:'98765432',
 D6_GITHUB_APP_PRIVATE_KEY:'x'.repeat(750),
};
const perms={contents:'write',metadata:'read',pull_requests:'write'};
const installation=()=>({
 id:98765432,app_id:ID,target_id:OWNER,target_type:'User',
 account:{id:OWNER,login:'ginosega'},
 repository_selection:'selected',suspended_at:null,
 permissions:{...perms},
});
const obj=(data,status=200)=>new Response(JSON.stringify(data),{
 status,headers:{'content-type':'application/json'},
});
const rejected=async(p,code)=>assert.rejects(p,e=>
 e instanceof D6Wp3H2AppGrantError&&e.code===code);

function fixture({updates={},mutateResponse,enabled=()=>true,appEnv=env}={}){
 const requests=[];
 const app={id:ID,slug:'fishing-h2-test'};
 const installation1=installation(),installation2=installation();
 const minted={token:TOKEN,permissions:{metadata:'read'}};
 const list={total_count:1,repositories:[{
  id:REPO_ID,full_name:REPO,owner:{id:OWNER,login:'ginosega'},
 }]};
 Object.assign(app,updates.app);
 Object.assign(installation1,updates.installation);
 Object.assign(installation2,updates.repoInstallation);
 Object.assign(minted,updates.minted);
 Object.assign(list,updates.list);
 const path1='/app/installations/98765432';
 const path2='/repos/'+REPO+'/installation';
 const path3=path1+'/access_tokens';
 const network=async(url,options)=>{
  requests.push({url,options});
  assert.equal(options.redirect,'manual');
  assert.equal(options.cache,'no-store');
  assert.equal(options.credentials,'omit');
  assert.equal(options.headers['X-GitHub-Api-Version'],'2026-03-10');
  let res;
  if(url===API+'/app')res=obj(app);
  else if(url===API+path1)res=obj(installation1);
  else if(url===API+path2)res=obj(installation2);
  else if(url===API+path3){
   assert.equal(options.method,'POST');
   assert.deepEqual(JSON.parse(options.body),{
    permissions:{metadata:'read'},
   });
   res=obj(minted,201);
  }else if(url===API+'/installation/repositories?per_page=100'){
   assert.equal(options.method,'GET');
   assert.equal(options.headers.Authorization,'Bearer '+TOKEN);
   res=obj(list);
  }else throw Error('Unexpected GitHub API route');
  return mutateResponse?.({url,options,res})??res;
 };
 const inspector=createD6Wp3H2AppInstallationPreflight({
  env:appEnv,network,now:()=>2000000000,
  enabled,
  signAppJwt:async()=>JWT,
 });
 return {inspector,requests};
}

test('WP3-APP01 exact Worker App, single selected repository, narrow grant PASS',async()=>{
 const f=fixture();
 const value=await f.inspector.inspect();
 assert.equal(value.verified,true);
 assert.equal(value.workerAppApiGrantVerified,true);
 assert.equal(value.appId,ID);
 assert.equal(value.installationId,98765432);
 assert.equal(value.repositoryId,REPO_ID);
 assert.equal(value.installedRepositoryCount,1);
 assert.equal(value.repositorySelection,'selected');
 assert.equal(value.exactPermissionsVerified,true);
 assert.equal(value.canPublish,false);
 assert.equal(value.isLive,false);
 assert(Object.isFrozen(value));
 assert.equal(f.requests.length,5);
 assert.deepEqual(f.requests.map(r=>r.url),[
  API+'/app',API+'/app/installations/98765432',
  API+'/repos/ginosega/fishing/installation',
  API+'/app/installations/98765432/access_tokens',
  API+'/installation/repositories?per_page=100',
 ]);
 for(const r of f.requests)if(!r.url.endsWith('/installation/repositories?per_page=100'))
  assert.equal(r.options.headers.Authorization,'Bearer '+JWT);
 assert(!JSON.stringify(value).includes(TOKEN));
 assert(!JSON.stringify(value).includes('x'.repeat(200)));
});

test('WP3-APP02 disabled, wrong Worker bindings or absent signer never calls GitHub',async()=>{
 for(const v of [
  {...env,D6_OWNER_GITHUB_ID:'1'},
  {...env,D6_REPOSITORY_ID:'1'},
  {...env,D6_GITHUB_APP_ID:'no'},
  {...env,D6_GITHUB_INSTALLATION_ID:''},
  {...env,D6_GITHUB_APP_PRIVATE_KEY:'short'},
 ]){
  const f=fixture({appEnv:v});
  await rejected(f.inspector.inspect(),'BINDING_UNVERIFIED');
  assert.equal(f.requests.length,0);
 }
 const f=fixture({enabled:()=>false});
 await rejected(f.inspector.inspect(),'DISABLED');
 assert.equal(f.requests.length,0);
});

test('WP3-APP03 invalid app identity fails before installation token mint',async()=>{
 for(const value of [0,ID+1]){
  const f=fixture({updates:{app:{id:value}}});
  await rejected(f.inspector.inspect(),'APP_IDENTITY_UNVERIFIED');
  assert.equal(f.requests.length,1);
 }
});

test('WP3-APP04 wrong installation identity or account fails before token mint',async()=>{
 const bad=[
  {id:42},{app_id:123},{target_id:42},
  {target_type:'Organization'},
  {account:{id:OWNER,login:'another'}},
  {account:{id:10,login:'ginosega'}},
  {repository_selection:'all'},
  {suspended_at:'2026-11-18T20:00:00Z'},
 ];
 for(const v of bad){
  const f=fixture({updates:{installation:v}});
  await assert.rejects(f.inspector.inspect(),D6Wp3H2AppGrantError);
  assert.equal(f.requests.length,2);
 }
});

test('WP3-APP05 grant lacks exact write-only scope or adds unrelated permission',async()=>{
 const bad=[
  {contents:'read',metadata:'read',pull_requests:'write'},
  {contents:'write',metadata:'read',pull_requests:'read'},
  {contents:'write',metadata:'read',pull_requests:'write',workflows:'write'},
  {contents:'write',metadata:'read',pull_requests:'write',administration:'read'},
  {contents:'write',pull_requests:'write'},
 ];
 for(const permissions of bad){
  const f=fixture({updates:{installation:{permissions}}});
  await rejected(f.inspector.inspect(),'PERMISSION_SCOPE_UNVERIFIED');
  assert.equal(f.requests.length,2);
 }
});

test('WP3-APP06 installation readback for exact repo must match pinned App',async()=>{
 for(const v of [{id:999},{app_id:44},{repository_selection:'all'},
  {account:{id:OWNER,login:'other'}}]){
  const f=fixture({updates:{repoInstallation:v}});
  await assert.rejects(f.inspector.inspect(),D6Wp3H2AppGrantError);
  assert.equal(f.requests.length,3);
 }
});

test('WP3-APP07 metadata-only token and entire selected repository set required',async()=>{
 for(const minted of [
  {token:'short'},
  {permissions:{contents:'write',metadata:'read'}},
  {permissions:{contents:'read'}},
 ]){
  const f=fixture({updates:{minted}});
  await assert.rejects(f.inspector.inspect(),D6Wp3H2AppGrantError);
  assert.equal(f.requests.length,4);
 }
});

test('WP3-APP08 extra repository, mismatch, truncated list fail closed',async()=>{
 const cases=[
  {total_count:2},
  {repositories:[]},
  {repositories:[{id:42,full_name:REPO,owner:{id:OWNER,login:'ginosega'}}]},
  {repositories:[{id:REPO_ID,full_name:'foreign/repo',owner:{id:OWNER,login:'ginosega'}}]},
  {repositories:[{id:REPO_ID,full_name:REPO,owner:{id:OWNER,login:'someone'}}]},
 ];
 for(const list of cases){
  const f=fixture({updates:{list}});
  await rejected(f.inspector.inspect(),'REPOSITORY_SCOPE_UNVERIFIED');
  assert.equal(f.requests.length,5);
 }
});

test('WP3-APP09 provider 403, redirect and malformed response are never proof',async()=>{
 for(const mutateResponse of [
  ({url})=>url===API+'/app'?obj({message:'forbidden'},403):undefined,
  ({url})=>url===API+'/app'?new Response('redirect',{
   status:302,headers:{Location:'https://example.com'},
  }):undefined,
  ({url})=>url===API+'/app'?new Response('not-json',{
   status:200,headers:{'content-type':'application/json'},
  }):undefined,
 ]){
  const f=fixture({mutateResponse});
  await assert.rejects(f.inspector.inspect(),D6Wp3H2AppGrantError);
  assert.equal(f.requests.length,1);
 }
});

test('WP3-APP10 revocation during asynchronous API sequence stops token issuance',async()=>{
 let on=true,count=0;
 const f=fixture({
  enabled:()=>on,
  mutateResponse:({res})=>{
   count++;if(count===2)on=false;return res;
  },
 });
 await rejected(f.inspector.inspect(),'DISABLED');
 assert.equal(f.requests.length,2);
});

test('WP3-APP11 no credential export, no Git branch write in source',()=>{
 const src=readFileSync(new URL(
  '../server/d6-wp3-h2-app-installation-preflight.mjs',import.meta.url),
 'utf8');
 assert.doesNotMatch(src,/\/git\/refs|\/pulls|method:'PATCH'|method:'PUT'/);
 assert.doesNotMatch(src,/console\.|process\.env|wrangler/);
 assert.match(src,/metadata:'read'/);
});
