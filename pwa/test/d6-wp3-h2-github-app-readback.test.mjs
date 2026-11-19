import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6H2GitHubAppReadback,
 verifyD6H2GitHubAppInstallation,D6H2AppReadbackError}
 from '../tools/d6-wp3-h2-github-app-readback.mjs';

const APP=765432,INSTALL=23456;
const JWT='eyJh'.repeat(5)+'.'+'eyJp'.repeat(5)+'.'+'QXJz'.repeat(15);
const response=()=>({
 id:INSTALL,app_id:APP,target_id:265665562,target_type:'User',
 account:{id:265665562,login:'ginosega'},
 repository_selection:'selected',suspended_at:null,
 permissions:{metadata:'read',contents:'write',pull_requests:'write'},
});
const deny=(f,code)=>assert.throws(f,e=>
 e instanceof D6H2AppReadbackError&&e.code===code);
const denyAsync=(f,code)=>assert.rejects(f,e=>
 e instanceof D6H2AppReadbackError&&e.code===code);

test('WP3-H2APP01 app JWT GitHub installation GET is read-only and source-bound',async()=>{
 const calls=[],r=createD6H2GitHubAppReadback({
  expectedAppId:APP,getAppJwt:async()=>JWT,
  network:async(uri,opts)=>{
   calls.push({uri,opts});
   return new Response(JSON.stringify(response()),{
    status:200,headers:{'Content-Type':'application/json'},
   });
  },
 });
 const value=await r.read();
 assert.equal(value.verified,true);
 assert.equal(value.installationId,INSTALL);
 assert.equal(value.appId,APP);
 assert.equal(value.ownerGitHubId,265665562);
 assert.equal(value.repositoryFullName,'ginosega/fishing');
 assert.equal(value.soleRepositoryProven,false);
 assert.equal(value.requiresIndependentRepositoryList,true);
 assert.equal(value.canPublish,false);
 assert.equal(calls.length,1);
 assert.equal(calls[0].uri,
  'https://api.github.com/repos/ginosega/fishing/installation');
 assert.equal(calls[0].opts.method,'GET');
 assert.equal(calls[0].opts.redirect,'error');
 assert.equal(calls[0].opts.credentials,'omit');
 assert.equal(calls[0].opts.headers.Authorization,'Bearer '+JWT);
 assert(!JSON.stringify(value).includes(JWT));
});

test('WP3-H2APP02 all foreign/suspended/broad permission installations denied',()=>{
 for(const bad of [
  {id:0},{app_id:APP+1},{target_id:1},
  {target_type:'Organization'},{account:{id:1,login:'ginosega'}},
  {account:{id:265665562,login:'foreign'}},
  {repository_selection:'all'},
  {suspended_at:'2026-11-18T00:00:00Z'},
  {permissions:{metadata:'read',contents:'read',pull_requests:'write'}},
  {permissions:{metadata:'read',contents:'write',pull_requests:'read'}},
  {permissions:{metadata:'read',contents:'write',pull_requests:'write',
   administration:'write'}},
  {permissions:{metadata:'read',contents:'write'}},
 ]){
  deny(()=>verifyD6H2GitHubAppInstallation({
   ...response(),...bad,
  },{expectedAppId:APP}),'INSTALLATION_NOT_APPROVED');
 }
});

test('WP3-H2APP03 no source app ID or provider evidence never yields proof',()=>{
 deny(()=>verifyD6H2GitHubAppInstallation(response(),{}),
  'APP_ID_UNPINNED');
 for(const raw of [{},null,[],{...response(),permissions:null}]){
  assert.throws(()=>verifyD6H2GitHubAppInstallation(raw,{
   expectedAppId:APP,
  }),D6H2AppReadbackError);
 }
});

test('WP3-H2APP04 reject user/installation token, no network on invalid JWT',async()=>{
 let calls=0;
 const r=createD6H2GitHubAppReadback({
  expectedAppId:APP,getAppJwt:async()=> 'ghs_12345678901234567',
  network:async()=>{calls++;throw Error('should not call');},
 });
 await denyAsync(()=>r.read(),'APP_JWT_UNAVAILABLE');
 assert.equal(calls,0);
});

test('WP3-H2APP05 deny redirects, HTML, unavailable provider, broad body',async()=>{
 for(const cfg of [
  {status:302},{status:503},
  {contentType:'text/html'},
  {contentType:'application/json',body:'not json'},
  {contentType:'application/json',body:'x'.repeat(65537)},
 ]){
  const r=createD6H2GitHubAppReadback({
   expectedAppId:APP,getAppJwt:async()=>JWT,
   network:async()=>new Response(
    cfg.body??JSON.stringify(response()),{
     status:cfg.status??200,
     headers:{'Content-Type':cfg.contentType??'application/json'},
    }),
  });
  await assert.rejects(r.read(),D6H2AppReadbackError);
 }
});

test('WP3-H2APP06 config invalid or unavailable provider never claims authority',async()=>{
 deny(()=>createD6H2GitHubAppReadback({expectedAppId:0,
  getAppJwt:()=>JWT}), 'INVALID_CONFIG');
 const r=createD6H2GitHubAppReadback({
  expectedAppId:APP,getAppJwt:async()=>JWT,
  network:async()=>{throw Error('network issue');},
 });
 await denyAsync(()=>r.read(),'NETWORK_UNAVAILABLE');
});
