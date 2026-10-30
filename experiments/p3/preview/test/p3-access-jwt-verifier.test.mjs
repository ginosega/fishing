import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createSign} from 'node:crypto';
import {createP3AccessJwtVerifier,P3AccessError} from '../src/p3-access-jwt-verifier.mjs';
const issuer='https://p3-test.cloudflareaccess.com';
const audience='abcdef0123456789abcdef0123456789abcdef0123456789';
const serviceClientId='aabbccddeeff00112233445566778899.access';
const now=1800000000;
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'P3-SANDBOX-KID-ONLY',alg:'RS256',use:'sig'};
const b64=v=>Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64url');
function jwt({header={},claims={},signKey=privateKey}={}){
 const h=b64({alg:'RS256',typ:'JWT',kid:jwk.kid,...header});
 const p=b64({type:'app',sub:'',common_name:serviceClientId,
  iss:issuer,aud:[audience],iat:now-30,exp:now+3600,...claims});
 const input=h+'.'+p;
 return input+'.'+createSign('RSA-SHA256').update(input).end().sign(signKey).toString('base64url');
}
function verifier(overrides={}){
 let reads=0,urls=[];
 const verify=createP3AccessJwtVerifier({issuer,audience,serviceClientId,now:()=>now,
  requestJwks:async url=>{reads++;urls.push(url);
   return new Response(JSON.stringify({keys:[jwk]}),{status:200,headers:{'Content-Type':'application/json'}});},
  ...overrides}).verify;
 return {verify,get reads(){return reads},urls};
}
test('P3-A01 authentic RS256 service-token JWT verifies exact Access identity and pinned JWKS URL',async()=>{
 const v=verifier();
 assert.deepEqual(await v.verify(jwt()),{serviceClientId});
 assert.equal(v.reads,1);
 assert.deepEqual(v.urls,[issuer+'/cdn-cgi/access/certs']);
});
test('P3-A02 missing, malformed, tampered and alg-none tokens fail closed',async()=>{
 const v=verifier();
 for(const token of ['', 'nonsense',jwt().replace(/.$/,'X'),jwt({header:{alg:'none'}})]){
  await assert.rejects(v.verify(token),e=>e instanceof P3AccessError);
 }
});
test('P3-A03 wrong issuer, audience, service client, human identity or stale clock are rejected',async()=>{
 const v=verifier();
 for(const claims of [
  {iss:'https://not-the-team.cloudflareaccess.com'},
  {aud:['unexpected-audience']},{common_name:'other-client.access'},
  {sub:'user-sub-id',common_name:serviceClientId},
  {type:'org'},
  {exp:now-1},{iat:now+3600},{nbf:now+3600}
 ]){
  await assert.rejects(v.verify(jwt({claims})),e=>e instanceof P3AccessError);
 }
 assert.equal(v.reads,0);
});
test('P3-A04 valid claims but wrong RSA signing key cannot pass',async()=>{
 const other=generateKeyPairSync('rsa',{modulusLength:2048});
 const v=verifier();await assert.rejects(v.verify(jwt({signKey:other.privateKey})),e=>e.code==='ACCESS_TOKEN_INVALID');
});
test('P3-A05 unknown key ID, unavailable keys and oversized key-response deny',async()=>{
 const v=verifier();
 await assert.rejects(v.verify(jwt({header:{kid:'unknown-kid-00001'}})),e=>e.code==='ACCESS_KEYS_UNAVAILABLE');
 const unavailable=verifier({requestJwks:async()=>new Response('unavailable',{status:503})});
 await assert.rejects(unavailable.verify(jwt()),e=>e.code==='ACCESS_KEYS_UNAVAILABLE');
 const tooLarge=verifier({requestJwks:async()=>new Response(JSON.stringify({keys:Array(200).fill(jwk)}),{status:200})});
 await assert.rejects(tooLarge.verify(jwt()),e=>e.code==='ACCESS_KEYS_UNAVAILABLE');
});
test('P3-A06 rejects off-domain JWKS issuer or unknown service ID configuration',()=>{
 for(const e of ['https://example.com','http://p3-test.cloudflareaccess.com',
  'https://p3-test.cloudflareaccess.com.evil.com']){
  assert.throws(()=>verifier({issuer:e}),e=>e.code==='INVALID_ACCESS_CONFIG');
 }
 assert.throws(()=>verifier({serviceClientId:'visitor@example.com'}),e=>e.code==='INVALID_ACCESS_CONFIG');
});
