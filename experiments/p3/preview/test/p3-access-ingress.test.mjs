import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createP3AccessIngress} from '../src/p3-access-ingress.mjs';
import {createP3NativeAcceptanceService} from '../src/p3-native-acceptance-service.mjs';
import {signP3InternalCommand} from '../src/p3-internal-command-gate.mjs';
import {sandbox,sample} from './d1-fixture.mjs';
const owner=265665562,repo=1430581407,when=1800000000000;
const target='https://private-access.example.test/p3/internal/accept';
const clientId='aabbccddeeff00112233445566778899.access';
const secret='unit-test-signing-key-sufficient-length-no-real-value';
const id='p3_00000001-1111-4111-8111-123456789abc';
const token='unit-test-access-jwt-'.repeat(5);
const noOp=()=>{};
function fixture({approved=false,authorized=true,enable=false}={}){
 const f=sandbox();f.sql.exec(readFileSync(new URL('../migrations/0004_command_nonce_ledger.sql',import.meta.url),'utf8'));
 const nativeEnv={APP_ORIGIN:'https://fishing-p3-sandbox-preview.ginosega.workers.dev',
  DB:f.DB,P3_OWNER_GITHUB_ID:String(owner),P3_WRITE_ENABLED:enable?'true':'false',
  P3_COMMAND_BRIDGE_ENABLED:enable?'true':'false',P3_BRIDGE_HMAC_SECRET:secret};
 const command=createP3NativeAcceptanceService({env:nativeEnv,operatorApproved:()=>enable,
  now:()=>when,makeId:()=>id});
 let verifications=0,forwards=0,sent;
 const env={P3_ACCESS_INGRESS_ORIGIN:'https://private-access.example.test',
  P3_ACCESS_SERVICE_CLIENT_ID:clientId,P3_INGRESS_ENABLED:enable?'true':'false',
  P3_WRITE_ENABLED:enable?'true':'false',P3_COMMAND_SERVICE:{fetch:async request=>{
   forwards++;sent=request.clone();return command.handle(request);
  }}};
 const ingress=createP3AccessIngress({env,operatorApproved:()=>approved||enable,
  verifyAccessJwt:async jwt=>{verifications++;
   if(jwt!==token||!authorized)throw Error('Access denied');
   return {serviceClientId:clientId};
  }});
 async function request({url=target,method='POST',headers={},body,nonce='nonce-verified-ingress-01234567890abc'}={}){
  const payload=body??JSON.stringify({action:'accept',idempotencyKey:'trusted-key-0123456789',
   snapshot:sample});
  // An oversized inbound body cannot be signed by the reviewed signer.
  // Sign an ordinary request, then independently send hostile oversize bytes
  // to exercise ingress streaming limits *before* the downstream HMAC gate.
  const toSign=new TextEncoder().encode(payload).length>8192?
   JSON.stringify({action:'accept',idempotencyKey:'trusted-key-0123456789',snapshot:sample}):payload;
  const sig=await signP3InternalCommand({secret,nonce,timestamp:when,body:toSign});
  return new Request(url,{method,headers:{'Content-Type':'application/json',
    'Cf-Access-Jwt-Assertion':token,'CF-Access-Client-Id':'do-not-forward',
    'CF-Access-Client-Secret':'do-not-forward-secret',
    ...sig,...headers},body:method==='POST'?payload:undefined});
 }
 const count=table=>f.sql.prepare('SELECT COUNT(*) AS n FROM '+table).get().n;
 return {env,f,ingress,request,count,get forwards(){return forwards},get verifications(){return verifications},get sent(){return sent}};
}
test('P3-I01 disabled ingress never reads auth, service binding, or D1',async()=>{
 const x=fixture();
 assert.equal((await x.ingress.fetch(await x.request())).status,503);
 assert.equal(x.verifications,0);assert.equal(x.forwards,0);
 assert.equal(x.count('p3_operations'),0);x.f.sql.close();
});
test('P3-I02 enabled ingress forwards only sanitized signed command to native D1 service',async()=>{
 const x=fixture({enable:true});
 const response=await x.ingress.fetch(await x.request());
 assert.deepEqual(await response.json(),{ok:true,operationId:id,state:'Accepted'});
 assert.equal(response.status,202);assert.equal(x.verifications,1);assert.equal(x.forwards,1);
 assert.equal(x.sent.url,'https://fishing-p3-sandbox-preview.ginosega.workers.dev/_p3/internal/command');
 assert.equal(x.sent.headers.has('Cf-Access-Jwt-Assertion'),false);
 assert.equal(x.sent.headers.has('CF-Access-Client-Id'),false);
 assert.equal(x.sent.headers.has('CF-Access-Client-Secret'),false);
 for(const table of ['p3_command_nonces','p3_operations','p3_requests','p3_events'])
  assert.equal(x.count(table),1,table);
 x.f.sql.close();
});
test('P3-I03 invalid Access proof fails before private forwarding',async()=>{
 const x=fixture({enable:true,authorized:false});
 const r=await x.ingress.fetch(await x.request());
 assert.equal(r.status,503);assert.equal(x.forwards,0);
 assert.equal(x.count('p3_command_nonces'),0);x.f.sql.close();
});
test('P3-I04 absent Access assertion is rejected even with valid HMAC',async()=>{
 const x=fixture({enable:true});
 const r=await x.ingress.fetch(await x.request({headers:{'Cf-Access-Jwt-Assertion':''}}));
 assert.equal(r.status,403);assert.equal(x.verifications,0);assert.equal(x.forwards,0);x.f.sql.close();
});
test('P3-I05 unknown origin, route or method never touch protected backend',async()=>{
 const x=fixture({enable:true});
 for(const params of [
  {url:'https://other.example.test/p3/internal/accept'},
  {url:target+'?override=true'},
  {url:'https://private-access.example.test/_p3/internal/command'},
  {method:'GET'},
 ]){
  const r=await x.ingress.fetch(await x.request(params));
  assert.equal(r.status,404);
 }
 assert.equal(x.verifications,0);assert.equal(x.forwards,0);x.f.sql.close();
});
test('P3-I06 bounded body and missing HMAC cannot forward',async()=>{
 const x=fixture({enable:true});
 const payload=JSON.stringify({action:'accept',idempotencyKey:'a'.repeat(9000),snapshot:sample});
 const oversized=await x.ingress.fetch(await x.request({body:payload}));
 assert.equal(oversized.status,413);
 const missing=await x.ingress.fetch(await x.request({headers:{'X-P3-Signature':''}}));
 assert.equal(missing.status,503);
 assert.equal(x.forwards,0);assert.equal(x.count('p3_command_nonces'),0);
 x.f.sql.close();
});
test('P3-I07 ingress never propagates unexpected downstream response bodies',async()=>{
 const x=fixture({enable:true});
 x.env.P3_COMMAND_SERVICE={fetch:async()=>new Response('PRIVATE PROVIDER SECRET',{status:500})};
 const result=await x.ingress.fetch(await x.request());
 assert.equal(result.status,503);
 assert.doesNotMatch(await result.text(),/PRIVATE PROVIDER SECRET/);
 x.f.sql.close();
});
test('P3-I08 ingress has no global fetch or Worker deployment path, deployed sentinel unchanged',()=>{
 const ingress=readFileSync(new URL('../src/p3-access-ingress.mjs',import.meta.url),'utf8');
 const sentinel=readFileSync(new URL('../src/p3-disabled-bridge-worker.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(ingress,/\bglobalThis\.fetch|\bfetch\(LEGACY_LOGICAL/);
 assert.doesNotMatch(sentinel,/p3-access-ingress|p3-access-jwt-verifier|p3-native-acceptance-service/);
});
