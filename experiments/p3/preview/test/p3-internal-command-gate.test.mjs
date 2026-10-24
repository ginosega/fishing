import test from 'node:test';
import assert from 'node:assert/strict';
import {createP3InternalCommandGate,signP3InternalCommand} from '../src/p3-internal-command-gate.mjs';

const origin='https://fishing-p3-sandbox-preview.ginosega.workers.dev';
const path='/\_p3/internal/command'.replace('\\_','_');
const ownerGitHubId=265665562,repoId=1430581407,time=1792860000000;
const secret='unit-test-not-a-real-hmac-secret-0123456789';
const nonce='nonce-single-use-0123456789abcdefghijk';
const op='p3_00000000-0000-4000-8000-000000000001';
const payload={action:'accept',idempotencyKey:'unique-key-12345678',snapshot:{
 package:{format:'fishing-companion-change-v2',domain:'gear',operation:'edit',id:'sample'},media:[]}};
function fixture(){
 const env={P3_WRITE_ENABLED:'false',P3_COMMAND_BRIDGE_ENABLED:'false',
  P3_BRIDGE_HMAC_SECRET:secret};
 let approval=false,consumeCalls=0,acceptCalls=0;
 const used=new Set();
 const events=[];
 const consumeNonce=async(x)=>{
  consumeCalls++;events.push('nonce');assert.equal(x.ownerGitHubId,ownerGitHubId);
  assert.equal(x.repositoryId,repoId);assert.match(x.nonceSha256,/^[a-f0-9]{64}$/);
  if(used.has(x.nonceSha256))return false;used.add(x.nonceSha256);return true;
 };
 const acceptSnapshot=async(x)=>{
  acceptCalls++;events.push('accept');assert.equal(x.ownerGitHubId,ownerGitHubId);
  assert.equal(x.repositoryId,repoId);return {operationId:op,state:'Accepted'};
 };
 const gate=createP3InternalCommandGate({env,ownerGitHubId,consumeNonce,
  acceptSnapshot,now:()=>time,operatorApproved:()=>approval});
 async function request({body=JSON.stringify(payload),ts=time,n=nonce,
  signatureSecret=secret,url=origin+path,method='POST',additionalHeaders={}}={}){
  const h=await signP3InternalCommand({secret:signatureSecret,nonce:n,
   timestamp:ts,body});
  return new Request(url,{method,headers:{'Content-Type':'application/json',
   ...h,...additionalHeaders},body:method==='POST'?body:undefined});
 }
 return {gate,env,enable(){env.P3_WRITE_ENABLED='true';
  env.P3_COMMAND_BRIDGE_ENABLED='true';approval=true;},
  counts(){return {consumeCalls,acceptCalls,events}},request};
}
test('P3-G01 all three enablement controls deny any D1 call',async()=>{
 const f=fixture(),req=await f.request();
 assert.equal((await f.gate.handle(req)).status,503);
 f.env.P3_WRITE_ENABLED='true';
 assert.equal((await f.gate.handle(await f.request())).status,503);
 f.env.P3_COMMAND_BRIDGE_ENABLED='true';
 assert.equal((await f.gate.handle(await f.request())).status,503);
 assert.deepEqual(f.counts(),{consumeCalls:0,acceptCalls:0,events:[]});
});
test('P3-G02 signed owner-scoped accept consumes durable nonce before accept',async()=>{
 const f=fixture();f.enable();const res=await f.gate.handle(await f.request());
 assert.equal(res.status,202);
 assert.deepEqual(await res.json(),{ok:true,operationId:op,state:'Accepted'});
 assert.deepEqual(f.counts(),{consumeCalls:1,acceptCalls:1,events:['nonce','accept']});
});
test('P3-G03 exact replay denied without second accept',async()=>{
 const f=fixture();f.enable();
 assert.equal((await f.gate.handle(await f.request())).status,202);
 const replay=await f.gate.handle(await f.request());
 assert.equal(replay.status,409);
 assert.equal((await replay.json()).code,'REPLAY_OR_NONCE_STORE_FAILED');
 assert.deepEqual(f.counts(),{consumeCalls:2,acceptCalls:1,events:['nonce','accept','nonce']});
});
test('P3-G04 altered body, signature, timestamp, and origin all refused',async()=>{
 const f=fixture();f.enable();
 const altered=await f.request({body:JSON.stringify({...payload,action:'inspect'})});
 altered.headers.set('X-P3-Signature',(await f.request()).headers.get('X-P3-Signature'));
 assert.equal((await f.gate.handle(altered)).status,403);
 for(const change of [
  {signatureSecret:'deliberately-incorrect-signer-secret-00000'},
  {ts:time-100_000},
  {url:'https://evil.example/_p3/internal/command'},
 ]){
  assert.equal((await f.gate.handle(await f.request(change))).status,403);
 }
 assert.equal(f.counts().acceptCalls,0);
});
test('P3-G05 tampered validated envelope rejected before nonce or accept',async()=>{
 const f=fixture();f.enable();
 for(const obj of [
  {...payload,action:'merge'}, {...payload,snapshot:{...payload.snapshot,media:[{bad:true}]}},
  {...payload,snapshot:{...payload.snapshot,package:{...payload.snapshot.package,domain:'catch'}}},
  {...payload,ownerGitHubId:1},
 ]){
  const res=await f.gate.handle(await f.request({body:JSON.stringify(obj)}));
  assert.equal(res.status,403);
 }
 assert.equal(f.counts().consumeCalls,0);
});
test('P3-G06 nonce failure stops before business operation and secrets are hidden',async()=>{
 const f=fixture();f.enable();
 const broken=createP3InternalCommandGate({env:f.env,ownerGitHubId,
  now:()=>time,operatorApproved:()=>true,
  consumeNonce:async()=>{throw Error(secret)},
  acceptSnapshot:async()=>{throw Error('MUST_NOT_RUN')}});
 const out=await broken.handle(await f.request());
 assert.equal(out.status,503);
 assert(!JSON.stringify(await out.json()).includes(secret));
 assert.equal(f.counts().acceptCalls,0);
});
test('P3-G07 shape, path and size checks cannot trigger write callbacks',async()=>{
 const f=fixture();f.enable();
 const oversized=JSON.stringify({...payload, padding:'x'.repeat(9000)});
 const r=await f.gate.handle(await f.request({body:oversized}));
 assert.equal(r.status,403);
 const incorrect=await f.gate.handle(await f.request({url:origin+'/operations'}));
 assert.equal(incorrect.status,403);
 assert.equal(f.counts().consumeCalls,0);
});
test('P3-G08 no deployed Worker fetch route, GitHub tokens or merge capabilities',async()=>{
 const f=fixture();
 assert.deepEqual(Object.keys(f.gate),['handle']);
 assert.equal(typeof f.gate.merge,'undefined');
 assert.equal(typeof f.gate.deploy,'undefined');
 assert.equal(typeof f.gate.issueToken,'undefined');
});
