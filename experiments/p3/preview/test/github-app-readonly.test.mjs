import test from 'node:test';
import assert from 'node:assert/strict';
import {createPrivateKey,createPublicKey,generateKeyPairSync,verify as verifySig} from 'node:crypto';
import {appJwt,verifyReadOnlySandboxInstallation} from '../src/github-app-readonly.mjs';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const pemPkcs1=privateKey.export({type:'pkcs1',format:'pem'}).toString();
const pemPkcs8=privateKey.export({type:'pkcs8',format:'pem'}).toString();
const settings={P3_GITHUB_APP_ID:'1001',P3_GITHUB_INSTALLATION_ID:'2002',
 P3_GITHUB_PRIVATE_KEY:pemPkcs1,P3_WRITE_ENABLED:'false'};
const un64=s=>Buffer.from(s.replace(/-/g,'+').replace(/_/g,'/'),'base64');
const fakeFetch=({repo='ginosega/fishing-p3-sandbox',privateRepo=true,permission='read',granted=true,correctRepo=true}={})=>{
 const calls=[];
 const request=async(url,init)=>{
  calls.push({url,init});
  if(url.endsWith('/access_tokens')){
   assert.equal(init.method,'POST');
   assert.match(init.headers.Authorization,/^Bearer \S+/);
   assert.deepEqual(JSON.parse(init.body),{repositories:['fishing-p3-sandbox'],permissions:{contents:'read'}});
   assert(!init.body.includes('ginosega/fishing"'));
   return {ok:granted,json:async()=>({permissions:{contents:permission},token:'ghs_demo_opaque_token'})};
  }
  assert.equal(url,'https://api.github.com/repos/ginosega/fishing-p3-sandbox');
  assert.equal(init.headers.Authorization,'Bearer ghs_demo_opaque_token');
  return {ok:correctRepo,json:async()=>({full_name:repo,private:privateRepo,id:4444})};
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
 assert.deepEqual(result,{verified:true,repository:'ginosega/fishing-p3-sandbox',repositoryId:4444,private:true,tokenScope:'contents:read',publishingEnabled:false});
 assert.equal(f.calls.length,2);
 assert.equal(JSON.stringify(result).includes('ghs_'),false);
});
test('P3-G04 refuses incorrect repository, non-private repo, bad scope or installation failure',async()=>{
 for(const opts of [{repo:'ginosega/fishing'},{privateRepo:false},{permission:'write'},{granted:false},{correctRepo:false}]){
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
