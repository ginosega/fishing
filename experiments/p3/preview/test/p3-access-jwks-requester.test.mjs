import test from 'node:test';
import assert from 'node:assert/strict';
import {createSign,generateKeyPairSync} from 'node:crypto';
import {createP3AccessJwksRequester} from '../src/p3-access-jwks-requester.mjs';
import {createP3AccessJwtVerifier,P3AccessError} from '../src/p3-access-jwt-verifier.mjs';

const issuer='https://p3-test.cloudflareaccess.com';
const url=issuer+'/cdn-cgi/access/certs';
const audience='abcdef0123456789abcdef0123456789';
const serviceClientId='aabbccddeeff00112233445566778899.access';
const makeResponse=(keys,status=200)=>new Response(JSON.stringify({keys}),{
 status,headers:{'Content-Type':'application/json; charset=utf-8'},
});
const {privateKey:k1,publicKey:p1}=generateKeyPairSync('rsa',{modulusLength:2048});
const {privateKey:k2,publicKey:p2}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk1={...p1.export({format:'jwk'}),kid:'p3-access-key-one',alg:'RS256',use:'sig'};
const jwk2={...p2.export({format:'jwk'}),kid:'p3-access-key-two',alg:'RS256',use:'sig'};
const b64=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const nowSeconds=1_800_000_000;
function makeJwt(key,jwk){
 const header=b64({alg:'RS256',typ:'JWT',kid:jwk.kid});
 const claims=b64({iss:issuer,aud:[audience],type:'app',sub:'',
  common_name:serviceClientId,iat:nowSeconds-30,exp:nowSeconds+600});
 const signed=header+'.'+claims;
 return signed+'.'+createSign('RSA-SHA256').update(signed).end().sign(key).toString('base64url');
}
test('P3-J01 exact issuer URL, fetch options and positive cache are bounded',async()=>{
 let clock=1_800_000_000_000,reads=0;
 const requestJwks=createP3AccessJwksRequester({issuer,now:()=>clock,
  fetchImpl:async(u,options)=>{
   reads++;assert.equal(u,url);assert.equal(options.method,'GET');
   assert.equal(options.redirect,'manual');assert.equal(options.cache,'no-store');
   assert.equal(options.headers.Accept,'application/json');
   assert.ok(options.signal instanceof AbortSignal);
   return makeResponse([jwk1]);}});
 assert.deepEqual((await (await requestJwks(url)).json()).keys,[jwk1]);
 assert.deepEqual((await (await requestJwks(url)).json()).keys,[jwk1]);
 assert.equal(reads,1);
 clock+=300000;
 await requestJwks(url);
 assert.equal(reads,2);
});
test('P3-J02 other teams, arbitrary paths and invalid config never fetch',async()=>{
 let reads=0;
 const load=createP3AccessJwksRequester({issuer,fetchImpl:async()=>{
  reads++;return makeResponse([jwk1]);
 }});
 for(const u of [url+'?x=1',issuer+'/other','https://evil.example/certs',
  'https://p3-test.cloudflareaccess.com.evil.example/cdn-cgi/access/certs']){
  await assert.rejects(load(u),e=>e instanceof P3AccessError);
 }
 assert.equal(reads,0);
 assert.throws(()=>createP3AccessJwksRequester({issuer:'https://evil.example',
  fetchImpl:async()=>makeResponse([jwk1])}),e=>e.code==='INVALID_ACCESS_CONFIG');
 assert.throws(()=>createP3AccessJwksRequester({issuer}),e=>e.code==='INVALID_ACCESS_CONFIG');
});
test('P3-J03 a new key ID triggers one forced refresh and validates actual RS256 rotation',async()=>{
 let reads=0,active=[jwk1];
 const requestJwks=createP3AccessJwksRequester({issuer,fetchImpl:async()=>{
  reads++;return makeResponse(active);
 }});
 const verifier=createP3AccessJwtVerifier({issuer,audience,serviceClientId,
  now:()=>nowSeconds,requestJwks});
 assert.deepEqual(await verifier.verify(makeJwt(k1,jwk1)),{serviceClientId});
 assert.equal(reads,1);
 active=[jwk2];
 assert.deepEqual(await verifier.verify(makeJwt(k2,jwk2)),{serviceClientId});
 assert.equal(reads,2);
 await assert.rejects(verifier.verify(makeJwt(k1,jwk1)),e=>e.code==='ACCESS_KEYS_UNAVAILABLE');
 // Cooldown prevents an attacker forcing an outbound refresh per unknown kid.
 assert.equal(reads,2);
});
test('P3-J04 cold concurrent requests share one remote fetch',async()=>{
 let reads=0;let release;
 const barrier=new Promise(resolve=>{release=resolve;});
 const requester=createP3AccessJwksRequester({issuer,fetchImpl:async()=>{
  reads++;await barrier;return makeResponse([jwk1]);
 }});
 const first=requester(url),second=requester(url);
 release();
 const responses=await Promise.all([first,second]);
 assert.equal(reads,1);
 assert.equal((await responses[0].json()).keys[0].kid,jwk1.kid);
 assert.equal((await responses[1].json()).keys[0].kid,jwk1.kid);
});
test('P3-J05 forced refresh is cooldown-limited and never accepts stale unknown kid',async()=>{
 let clock=1_800_000_000_000,reads=0;
 const loader=createP3AccessJwksRequester({issuer,now:()=>clock,
  fetchImpl:async()=>{reads++;return makeResponse([jwk1]);}});
 await loader(url);
 await loader(url,{forceRefresh:true});
 await loader(url,{forceRefresh:true});
 assert.equal(reads,2);
 clock+=5_000;
 await loader(url,{forceRefresh:true});
 assert.equal(reads,3);
});
test('P3-J06 redirects, wrong final origin, non-JSON and server errors deny',async()=>{
 for(const outcome of [
  new Response(null,{status:302,headers:{Location:'https://evil.example'}}),
  new Response('down',{status:503}),
  new Response('not json',{status:200,headers:{'Content-Type':'text/plain'}}),
  new Response('malformed',{status:200,headers:{'Content-Type':'application/json'}}),
 ]){
  const loader=createP3AccessJwksRequester({issuer,fetchImpl:async()=>outcome.clone()});
  await assert.rejects(loader(url),e=>e.code==='ACCESS_KEYS_UNAVAILABLE');
 }
 const redirected=makeResponse([jwk1]);
 Object.defineProperty(redirected,'url',{value:'https://evil.example/certs'});
 const loader=createP3AccessJwksRequester({issuer,fetchImpl:async()=>redirected});
 await assert.rejects(loader(url),e=>e.code==='ACCESS_KEYS_UNAVAILABLE');
});
test('P3-J07 stream sizes and dishonest Content-Length reject without caching',async()=>{
 let calls=0;
 const loader=createP3AccessJwksRequester({issuer,fetchImpl:async()=>{
  calls++;
  if(calls===1)return new Response(new Uint8Array(32769),{
   headers:{'Content-Type':'application/json','Content-Length':'1'}});
  return makeResponse([jwk1]);
 }});
 await assert.rejects(loader(url),e=>e.code==='ACCESS_KEYS_UNAVAILABLE');
 await loader(url);
 assert.equal(calls,2);
});
test('P3-J08 expired cached keys and aborted provider cannot silently authenticate',async()=>{
 let clock=1_800_000_000_000,calls=0;
 const loader=createP3AccessJwksRequester({issuer,now:()=>clock,
  makeSignal:()=>AbortSignal.abort('test-abort'),
  fetchImpl:async(_u,{signal})=>{
   calls++;
   if(calls===1)return makeResponse([jwk1]);
   assert.ok(signal.aborted);throw Error('secret-provider-details');
  }});
 await loader(url);
 clock+=300_000;
 await assert.rejects(loader(url),e=>e.code==='ACCESS_KEYS_UNAVAILABLE'&&
  !e.message.includes('secret-provider-details'));
 assert.equal(calls,2);
});
