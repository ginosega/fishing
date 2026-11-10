import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,verify,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createD6ProductionAppSigner,D6ProductionAppSigningError}
 from '../../experiments/p3/preview/src/d6-production-app-signer.mjs';

const NOW=1800000000,APP='77';
const keys=generateKeyPairSync('rsa',{modulusLength:2048});
const pkcs8=keys.privateKey.export({type:'pkcs8',format:'pem'}).toString();
const pkcs1=keys.privateKey.export({type:'pkcs1',format:'pem'}).toString();
const make=enabled=>createD6ProductionAppSigner({
 enabled,cryptoApi:webcrypto,
});
const sign=(s,privateKey=pkcs8,opts={})=>
 s.signAppJwt({appId:APP,privateKey,now:NOW,...opts});
async function denied(task,code){
 await assert.rejects(task,e=>e instanceof D6ProductionAppSigningError&&
  e.code===code&&
  e.message==='D6 production App signing unavailable');
}
function verifyJwt(jwt){
 const parts=jwt.split('.');
 assert.equal(parts.length,3);
 const [header,claims]=parts.slice(0,2).map(part=>
  JSON.parse(Buffer.from(part,'base64url').toString('utf8')));
 assert.deepEqual(header,{alg:'RS256',typ:'JWT'});
 assert.deepEqual(claims,{iat:NOW-60,exp:NOW+480,iss:APP});
 assert.equal(verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),
  keys.publicKey,Buffer.from(parts[2],'base64url')),true);
}

test('D6-SIGN01 capability is default OFF; no JWT returned',async()=>{
 const s=make(()=>false);
 await denied(sign(s),'DISABLED');
 assert(Object.isFrozen(s));
 assert.deepEqual(Object.keys(s),['signAppJwt']);
 const defaultSigner=createD6ProductionAppSigner({cryptoApi:webcrypto});
 await denied(sign(defaultSigner),'DISABLED');
});
test('D6-SIGN02 PKCS#8 key produces a verified RS256 App JWT',async()=>{
 verifyJwt(await sign(make(()=>true)));
});
test('D6-SIGN03 GitHub RSA PRIVATE KEY PKCS#1 works without Node APIs',async()=>{
 verifyJwt(await sign(make(()=>true),pkcs1));
});
test('D6-SIGN04 escaped newlines are accepted, without leaking PEM',async()=>{
 const s=make(()=>true);
 const jwt=await sign(s,pkcs8.replace(/\n/g,'\\n'));
 verifyJwt(jwt);
 assert(!jwt.includes('PRIVATE KEY'));
});
test('D6-SIGN05 invalid owner App IDs and clocks are rejected',async()=>{
 const s=make(()=>true);
 for(const appId of ['',0,'0','01','12x','9007199254740999',
  '12345678901234567',null]){
  await denied(sign(s,pkcs8,{appId}),'INVALID_APP_ID');
 }
 for(const now of [0,60,2.5,NaN,'1800000000',Number.MAX_SAFE_INTEGER]){
  await denied(sign(s,pkcs8,{now}),'INVALID_CLOCK');
 }
});
test('D6-SIGN06 malformed PEM, fabricated key, and weak RSA deny',async()=>{
 const s=make(()=>true);
 for(const privateKey of ['',null,'not-a-pem',
  pkcs8.replace('PRIVATE KEY','PUBLIC KEY'),
  pkcs8.replace(/A/g,'*')]){
  await assert.rejects(sign(s,privateKey),
   e=>e instanceof D6ProductionAppSigningError);
 }
 const weak=generateKeyPairSync('rsa',{modulusLength:1024});
 const weakPem=weak.privateKey.export({type:'pkcs8',format:'pem'}).toString();
 await denied(sign(s,weakPem),'INVALID_KEY');
});
test('D6-SIGN07 capability can be revoked before the next use',async()=>{
 let active=true;
 const s=make(()=>active);
 verifyJwt(await sign(s));
 active=false;
 await denied(sign(s),'DISABLED');
});
test('D6-SIGN08 invalid runtime dependencies are rejected',()=>{
 for(const input of [{enabled:true},{enabled:()=>true,cryptoApi:{}},
  {enabled:()=>true,cryptoApi:{subtle:{importKey:async()=>{}}}}]){
  assert.throws(()=>createD6ProductionAppSigner(input),
   e=>e instanceof D6ProductionAppSigningError&&e.code==='INVALID_CONFIG');
 }
});
test('D6-SIGN09 no Worker entrypoint, network, issuer, or sandbox credentials',()=>{
 const code=readFileSync(new URL(
  '../../experiments/p3/preview/src/d6-production-app-signer.mjs',
  import.meta.url),'utf8');
 assert.doesNotMatch(code,/export default|addEventListener\(|fetch\(/);
 assert.doesNotMatch(code,/1430581407|fishing-p3-sandbox|D2_GITHUB_APP_PRIVATE_KEY/);
 assert.doesNotMatch(code,/access_tokens|issueReadToken|issueWriteToken|DB\.prepare/);
 assert.match(code,/enabled=\(\)=>false/);
 assert.match(code,/RSASSA-PKCS1-v1_5/);
});
