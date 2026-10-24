import test from 'node:test';
import assert from 'node:assert/strict';
import {createPrivateKey,createPublicKey,generateKeyPairSync,verify as verifySig} from 'node:crypto';
import {appJwt,verifyReadOnlySandboxInstallation,GitHubProbeError} from '../src/github-app-readonly.mjs';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const pemPkcs1=privateKey.export({type:'pkcs1',format:'pem'}).toString();
const pemPkcs8=privateKey.export({type:'pkcs8',format:'pem'}).toString();
const settings={P3_GITHUB_APP_ID:'1001',P3_GITHUB_INSTALLATION_ID:'2002',
 P3_GITHUB_PRIVATE_KEY:pemPkcs1,P3_WRITE_ENABLED:'false'};
const un64=s=>Buffer.from(s.replace(/-/g,'+').replace(/_/g,'/'),'base64');
const fakeFetch=({repo='ginosega/fishing-p3-sandbox',privateRepo=true,permission='read',
 granted=true,correctRepo=true,repoId=1430581407,lookupStatus=200,repoLookupStatus=200,
 actualAppId=1001,actualInstallationId=2002,account='ginosega',
 selected='selected',contents='write',pulls='write',suspended=null,
 repoInstallationId=2002}={})=>{
 const calls=[];
 const installation={id:actualInstallationId,app_id:actualAppId,account:{login:account},
  repository_selection:selected,permissions:{contents,pull_requests:pulls},
  suspended_at:suspended};
 const request=async(url,init)=>{
  // GitHub requires User-Agent; Cloudflare Workers do not guarantee a valid default.
  assert.equal(init.headers['User-Agent'],'fishing-p3-sandbox-publisher');
  assert.equal(init.headers['X-GitHub-Api-Version'],'2026-03-10');
  assert.equal(init.headers.Accept,'application/vnd.github+json');
  calls.push({url,init});
  if(url==='https://api.github.com/app/installations/2002' && init.method==='GET'){
   assert.match(init.headers.Authorization,/^Bearer \S+/);
   return {ok:lookupStatus===200,status:lookupStatus,json:async()=>installation};
  }
  if(url==='https://api.github.com/repos/ginosega/fishing-p3-sandbox/installation' && init.method==='GET'){
   assert.match(init.headers.Authorization,/^Bearer \S+/);
   return {ok:repoLookupStatus===200,status:repoLookupStatus,json:async()=>({
    ...installation,id:repoInstallationId,
   })};
  }
  if(url.endsWith('/access_tokens')){
   assert.equal(init.method,'POST');
   assert.match(init.headers.Authorization,/^Bearer \S+/);
   assert.deepEqual(JSON.parse(init.body),{repository_ids:[1430581407],permissions:{contents:'read'}});
   assert(!init.body.includes('ginosega/fishing"'));
   return {ok:granted,status:granted?201:403,
    json:async()=>({permissions:{contents:permission},token:'ghs_demo_opaque_token'})};
  }
  assert.equal(url,'https://api.github.com/repos/ginosega/fishing-p3-sandbox');
  assert.equal(init.headers.Authorization,'Bearer ghs_demo_opaque_token');
  return {ok:correctRepo,status:correctRepo?200:404,
   json:async()=>({full_name:repo,private:privateRepo,id:repoId})};
 };
 return {request,calls};
};
test('P3-G01 PKCS1 app key produces verifiable short-lived RS256 JWT',async()=>{
 const t=await appJwt({appId:'1001',privateKey:pemPkcs1,now:1234567});
 const [header,claims,sig]=t.split('.');
 assert.equal(JSON.parse(un64(header)).alg,'RS256');
 const c=JSON.parse(un64(claims));
 assert.deepEqual(c,{iat:1234507,exp:1235047,iss:'1001'});
 assert.equal(verifySig('RSA-SHA256',Buffer.from(header+'.'+claims),publicKey,un64(sig)),true);
});
test('P3-G02 PKCS8 app keys and escaped PEM newlines accepted',async()=>{
 const t=await appJwt({appId:'1001',privateKey:pemPkcs8.replace(/\n/g,'\\n'),now:1234567});
 const [h,p,s]=t.split('.');
 assert.equal(verifySig('RSA-SHA256',Buffer.from(h+'.'+p),publicKey,un64(s)),true);
});
test('P3-G03 narrowed installation token only, exact private sandbox read verified',async()=>{
 const f=fakeFetch();
 const result=await verifyReadOnlySandboxInstallation({env:settings,request:f.request,now:1234567});
 assert.deepEqual(result,{verified:true,repository:'ginosega/fishing-p3-sandbox',repositoryId:1430581407,private:true,tokenScope:'contents:read',publishingEnabled:false});
 assert.equal(f.calls.length,4);
 assert.equal(JSON.stringify(result).includes('ghs_'),false);
});
test('P3-G04 refuses incorrect repository, non-private repo, bad scope or installation failure',async()=>{
 for(const opts of [{repo:'ginosega/fishing'},{repoId:1350909744},{privateRepo:false},{permission:'write'},{granted:false},{correctRepo:false}]){
  const f=fakeFetch(opts);
  await assert.rejects(verifyReadOnlySandboxInstallation({env:settings,request:f.request,now:1234567}));
 }
});
test('P3-G05 never attempts an API call when publishing flag true, IDs missing or key missing',async()=>{
 for(const changes of [{P3_WRITE_ENABLED:'true'},{P3_GITHUB_APP_ID:'not-an-id'},{P3_GITHUB_INSTALLATION_ID:''},{P3_GITHUB_PRIVATE_KEY:''}]){
  const f=fakeFetch();
  await assert.rejects(verifyReadOnlySandboxInstallation({env:{...settings,...changes},request:f.request,now:1234567}));
  assert.equal(f.calls.length,0);
 }
});

test('P3-G06 classification never exposes GitHub App private-key material or raw API body',async()=>{
 const malformed={...settings,P3_GITHUB_PRIVATE_KEY:'invalid-PEM-must-not-appear'};
 await assert.rejects(verifyReadOnlySandboxInstallation({env:malformed,now:1234567}),error=>{
  assert.equal(error instanceof GitHubProbeError,true);
  assert.equal(error.code,'app_key_signing_failed');
  assert.doesNotMatch(error.message,/invalid-PEM|private key|ghs_/);
  return true;
 });
 const failure=fakeFetch({granted:false});
 await assert.rejects(verifyReadOnlySandboxInstallation({env:settings,request:failure.request,now:1234567}),error=>{
  assert.equal(error.code,'installation_token_http_403');
  assert.doesNotMatch(error.message,/ghs_/);
  return true;
 });
 const mismatch=fakeFetch({repoId:1350909744});
 await assert.rejects(verifyReadOnlySandboxInstallation({env:settings,request:mismatch.request,now:1234567}),error=>{
  assert.equal(error.code,'sandbox_identity_mismatch');
  return true;
 });
});

test('P3-G07 JWT preflight refuses wrong installation/app, account, suspension or selected scope',async()=>{
 const attempts=[
  [{actualAppId:1010},'app_installation_id_mismatch'],
  [{actualInstallationId:2010},'app_installation_id_mismatch'],
  [{account:'stranger'},'app_installation_owner_mismatch'],
  [{selected:'all'},'app_installation_scope_not_selected'],
  [{suspended:'2026-10-22T23:00:00Z'},'app_installation_suspended'],
  [{contents:'none'},'app_installation_permissions_mismatch'],
  [{pulls:'read'},'app_installation_permissions_mismatch'],
  [{repoInstallationId:100},'sandbox_installation_mismatch'],
  [{lookupStatus:403},'app_installation_lookup_http_403'],
  [{repoLookupStatus:404},'sandbox_installation_lookup_http_404']
 ];
 for(const [options,code] of attempts){
  const f=fakeFetch(options);
  await assert.rejects(verifyReadOnlySandboxInstallation({env:settings,request:f.request,now:1234567}),error=>{
   assert.equal(error.code,code);
   return true;
  });
  assert.equal(f.calls.some(call=>call.url.endsWith('/access_tokens')),false,code);
 }
});
