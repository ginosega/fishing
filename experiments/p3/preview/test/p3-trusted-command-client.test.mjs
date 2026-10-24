import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sandbox,sample} from './d1-fixture.mjs';
import {createP3TrustedCommandClient,P3TrustedClientError} from '../src/p3-trusted-command-client.mjs';
import {createP3NativeAcceptanceService} from '../src/p3-native-acceptance-service.mjs';

const owner=778899,repo=1430581407,time=1800000000000;
const secret='unit-test-hmac-bridge-password-not-a-real-secret-0123456789';
const nonce='some-secure-random-nonce-0123456789abc';
const op='p3_00000001-1111-4111-8111-123456789abc';
const key='owner-operation-key-0123456789';
function context(){
 const env={P3_OWNER_GITHUB_ID:String(owner),P3_WRITE_ENABLED:'false',
  P3_COMMAND_CLIENT_ENABLED:'false',P3_COMMAND_BRIDGE_ENABLED:'false',
  APP_ORIGIN:'https://fishing-p3-sandbox-preview.ginosega.workers.dev',
  P3_BRIDGE_HMAC_SECRET:secret};
 const f=sandbox();
 f.sql.exec(readFileSync(new URL('../migrations/0004_command_nonce_ledger.sql',import.meta.url),'utf8'));
 let approved=false,sends=0;
 const service=createP3NativeAcceptanceService({
  env,operatorApproved:()=>approved,now:()=>time,makeId:()=>op});
 const transport=async request=>{sends++;return service.handle(request);};
 const client=createP3TrustedCommandClient({env,ownerGitHubId:owner,
  transport,operatorApproved:()=>approved,now:()=>time,makeNonce:()=>nonce});
 const enable=()=>{approved=true;env.P3_WRITE_ENABLED='true';
  env.P3_COMMAND_CLIENT_ENABLED='true';env.P3_COMMAND_BRIDGE_ENABLED='true';};
 const count=table=>f.sql.prepare('SELECT COUNT(*) AS n FROM '+table).get().n;
 return {env,f,client,enable,count,get sends(){return sends}};
}
test('P3-T01 disabled defaults cause no transport or database access',async()=>{
 const x=context();
 await assert.rejects(x.client.accept({idempotencyKey:key,snapshot:sample}),
  e=>e instanceof P3TrustedClientError&&e.code==='CLIENT_DISABLED');
 assert.equal(x.sends,0);assert.equal(x.count('p3_command_nonces'),0);
 assert.deepEqual(Object.keys(x.client),['accept']);
 x.f.sql.close();
});
test('P3-T02 trusted signer through injected private transport accepts one D1 snapshot',async()=>{
 const x=context();x.enable();
 const receipt=await x.client.accept({idempotencyKey:key,snapshot:sample});
 assert.deepEqual(receipt,{operationId:op,state:'Accepted'});
 assert.equal(x.sends,1);
 for(const table of ['p3_command_nonces','p3_operations','p3_requests','p3_events'])
  assert.equal(x.count(table),1,table);
 x.f.sql.close();
});
test('P3-T03 replayed nonce is refused, no second operation or silent retry',async()=>{
 const x=context();x.enable();
 await x.client.accept({idempotencyKey:key,snapshot:sample});
 await assert.rejects(x.client.accept({idempotencyKey:key,snapshot:sample}),
  e=>e.code==='NONCE_ALREADY_CONSUMED');
 assert.equal(x.sends,2);assert.equal(x.count('p3_operations'),1);
 assert.equal(x.count('p3_command_nonces'),1);
 x.f.sql.close();
});
test('P3-T04 scope and payload wrong before transport call',async()=>{
 const x=context();x.enable();
 for(const cmd of [
  {idempotencyKey:key,snapshot:sample,repositoryId:1},
  {idempotencyKey:key,snapshot:sample,ownerId:2},
  {idempotencyKey:'bad',snapshot:sample},
  {idempotencyKey:key,snapshot:{...sample,media:[{path:'injected.png'}]}},
  {idempotencyKey:key,snapshot:{...sample,package:{...sample.package,domain:'catches'}}},
 ]){
  await assert.rejects(x.client.accept(cmd));
 }
 assert.equal(x.sends,0);assert.equal(x.count('p3_command_nonces'),0);
 x.f.sql.close();
});
test('P3-T05 ambiguous transport outcome does not retry or claim safe failure',async()=>{
 const x=context();x.enable();let calls=0;
 const client=createP3TrustedCommandClient({env:x.env,ownerGitHubId:owner,
  operatorApproved:()=>true,now:()=>time,makeNonce:()=>nonce,
  transport:async()=>{calls++;throw Error(secret)}});
 await assert.rejects(client.accept({idempotencyKey:key,snapshot:sample}),
  e=>e.code==='TRANSPORT_OUTCOME_UNKNOWN'&&!e.message.includes(secret));
 assert.equal(calls,1);assert.equal(x.sends,0);
 x.f.sql.close();
});
test('P3-T06 invalid receipt fails without echoing provider or secret data',async()=>{
 const x=context();x.enable();let calls=0;
 const client=createP3TrustedCommandClient({env:x.env,ownerGitHubId:owner,
  operatorApproved:()=>true,now:()=>time,makeNonce:()=>nonce,
  transport:async()=>{calls++;return new Response(JSON.stringify({ok:true,operationId:'not-an-id',
   state:'Live',secret}),{status:202,headers:{'Content-Type':'application/json'}})}});
 await assert.rejects(client.accept({idempotencyKey:key,snapshot:sample}),
  e=>e.code==='INVALID_ACCEPT_RECEIPT'&&!e.message.includes(secret));
 assert.equal(calls,1);x.f.sql.close();
});
test('P3-T07 local secret mismatches are rejected at receiver with zero D1 mutation',async()=>{
 const x=context();x.enable();const other={...x.env,P3_BRIDGE_HMAC_SECRET:'different-signing-secret-not-matching-server-0123456789'};
 const sender=createP3TrustedCommandClient({env:other,ownerGitHubId:owner,
  operatorApproved:()=>true,now:()=>time,makeNonce:()=>nonce,
  transport:req=>{ // receiver uses original environment, not forged signer env
    x.f.sql.prepare('SELECT 1').get();
    const service=createP3NativeAcceptanceService({env:x.env,
      operatorApproved:()=>true,now:()=>time,makeId:()=>op});
    return service.handle(req);
  }});
 await assert.rejects(sender.accept({idempotencyKey:key,snapshot:sample}),
  e=>e.code==='COMMAND_NOT_ACCEPTED');
 assert.equal(x.count('p3_operations'),0);assert.equal(x.count('p3_command_nonces'),0);
 x.f.sql.close();
});
test('P3-T08 no global fetch or public delivery route from source-only client',()=>{
 const text=readFileSync(new URL('../src/p3-trusted-command-client.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(text,/\bfetch\s*\(/);
 assert.doesNotMatch(text,/https:\/\/api\.github\.com/);
 assert.doesNotMatch(text,/createDraft|deployWorker|mergePullRequest/);
});
