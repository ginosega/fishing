import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sandbox,sample} from './d1-fixture.mjs';
import {createP3AtomicAcceptanceProof,P3AtomicAcceptanceError}
 from '../src/p3-atomic-acceptance-proof.mjs';

const at=1800000000000;
const idem='trusted-key-0123456789',nonce='source-only-nonce-012345678901234';
const sha=x=>createHash('sha256').update(x).digest('hex');
const data=JSON.stringify({action:'accept',idempotencyKey:idem,snapshot:sample});
const approvalId='6b5234c8-3212-4123-8123-bcdef1234567';
const proof={
 verified:true,action:'accept',operatorGithubId:265665562,repositoryId:1430581407,
 approvalId,approvalSha256:'a'.repeat(64),bodySha256:sha(data),
 idempotencyKey:idem,workflowSha:'b'.repeat(40),runId:441155,runAttempt:1,
 issuedAt:at/1000-15,expiresAt:at/1000+180,
};
const args={body:data,authorization:{testFixtureOnly:true},nonceValue:nonce,timestampMs:at};
function fixture({verifyAuthorization=async()=>proof,brokenBatch}={}){
 const f=sandbox();
 f.sql.exec(readFileSync(new URL('../migrations/0004_command_nonce_ledger.sql',import.meta.url),'utf8'));
 f.sql.exec(readFileSync(new URL('../design/p3_atomic_approval_acceptance.schema.sql',import.meta.url),'utf8'));
 const env={P3_WRITE_ENABLED:'false',P3_ATOMIC_ACCEPTANCE_ENABLED:'false',
  P3_ATOMIC_STATUS_ENABLED:'false'};
 let allow=false,seq=0,calls=0;
 const DB=brokenBatch??f.DB;
 const service=createP3AtomicAcceptanceProof({DB,env,
  operatorApproved:()=>allow,nowMs:()=>at,
  makeOperationId:()=> 'p3_'+String(++seq).padStart(8,'0')+'-1111-4111-8111-123456789abc',
  verifyAuthorization:async p=>{calls++;return verifyAuthorization(p);}});
 const enable=()=>{allow=true;env.P3_WRITE_ENABLED='true';
  env.P3_ATOMIC_ACCEPTANCE_ENABLED='true';env.P3_ATOMIC_STATUS_ENABLED='true'};
 const counts=()=>Object.fromEntries(
  ['p3_operations','p3_requests','p3_events','p3_atomic_approvals','p3_command_nonces']
  .map(t=>[t,f.sql.prepare('SELECT COUNT(*) n FROM '+t).get().n]));
 return {f,env,service,enable,counts,get calls(){return calls}};
}
const zero={p3_operations:0,p3_requests:0,p3_events:0,
 p3_atomic_approvals:0,p3_command_nonces:0};
const one={p3_operations:1,p3_requests:1,p3_events:1,
 p3_atomic_approvals:1,p3_command_nonces:1};

test('P3-X01 disabled source proof performs no DB operations or auth calls',async()=>{
 const f=fixture();
 await assert.rejects(f.service.accept(args),e=>e.code==='ATOMIC_DISABLED');
 assert.equal(f.calls,0);
 assert.deepEqual(f.counts(),zero);
 f.f.sql.close();
});
test('P3-X02 one batch commits operation, snapshot, owner approval, nonce and audit',async()=>{
 const f=fixture();f.enable();
 const receipt=await f.service.accept(args);
 assert.deepEqual(receipt,{
  operationId:'p3_00000001-1111-4111-8111-123456789abc',state:'Accepted'});
 assert.deepEqual(f.counts(),one);
 assert.equal(f.f.sql.prepare('SELECT event_type FROM p3_events').get().event_type,'accepted');
 const stored=f.f.sql.prepare('SELECT operation_id FROM p3_atomic_approvals').get();
 assert.equal(stored.operation_id,receipt.operationId);
 assert.deepEqual(await f.service.readStatus({
  approvalId,approvalSha256:proof.approvalSha256
 }),{state:'Found',operationId:receipt.operationId,operationState:'Accepted'});
 f.f.sql.close();
});
test('P3-X03 duplicate signed approval rolls back every new row including audit',async()=>{
 const f=fixture();f.enable();
 await f.service.accept(args);
 await assert.rejects(f.service.accept({...args,nonceValue:'another-source-only-nonce-12345678'}),
  e=>e.code==='ATOMIC_OUTCOME_UNKNOWN');
 assert.deepEqual(f.counts(),one);
 assert.equal(f.f.sql.prepare('SELECT COUNT(*) n FROM p3_operations').get().n,1);
 f.f.sql.close();
});
test('P3-X04 duplicate signed nonce with independently unique approval fails atomically',async()=>{
 const second=JSON.stringify({action:'accept',idempotencyKey:'second-key-01234567890',snapshot:sample});
 // Fresh approval and idempotency must not reuse an already consumed HMAC nonce.
 const g=fixture();g.enable();
 await g.service.accept(args);
 const oldProof={...proof,approvalId:'7b5234c8-3212-4123-8123-bcdef1234567',
  approvalSha256:'c'.repeat(64),idempotencyKey:'second-key-01234567890',
  bodySha256:sha(second)};
 const verified=createP3AtomicAcceptanceProof({DB:g.f.DB,env:g.env,
  operatorApproved:()=>true,nowMs:()=>at,
  makeOperationId:()=> 'p3_00000002-1111-4111-8111-123456789abc',
  verifyAuthorization:async()=>oldProof});
 await assert.rejects(verified.accept({...args,body:second}),
  e=>e.code==='ATOMIC_OUTCOME_UNKNOWN');
 assert.deepEqual(g.counts(),one);
 g.f.sql.close();
});
test('P3-X05 same idempotency key with new proof still cannot create second operation',async()=>{
 const f=fixture();f.enable();await f.service.accept(args);
 const second=createP3AtomicAcceptanceProof({DB:f.f.DB,env:f.env,
  operatorApproved:()=>true,nowMs:()=>at,
  makeOperationId:()=> 'p3_00000002-1111-4111-8111-123456789abc',
  verifyAuthorization:async()=>({...proof,
   approvalId:'7b5234c8-3212-4123-8123-bcdef1234567',
   approvalSha256:'c'.repeat(64)})});
 await assert.rejects(second.accept({...args,nonceValue:'new-source-only-nonce-1234567890'}),
  e=>e.code==='ATOMIC_OUTCOME_UNKNOWN');
 assert.deepEqual(f.counts(),one);
 f.f.sql.close();
});
test('P3-X06 wrong signed owner/body, expired approval and bad command abort before writes',async()=>{
 for(const bad of [
  {verified:false},{operatorGithubId:1},{repositoryId:1},{action:'publish'},
  {bodySha256:'a'.repeat(64)},{issuedAt:at/1000-900},{expiresAt:at/1000-1},
 ]){
  const f=fixture({verifyAuthorization:async()=>({...proof,...bad})});f.enable();
  await assert.rejects(f.service.accept(args),P3AtomicAcceptanceError);
  assert.deepEqual(f.counts(),zero);
  f.f.sql.close();
 }
 const f=fixture();f.enable();
 await assert.rejects(f.service.accept({...args,body:data+' '}),P3AtomicAcceptanceError);
 assert.deepEqual(f.counts(),zero);f.f.sql.close();
});
test('P3-X07 untrusted network timeout after committed batch reports unknown only',async()=>{
 const f=fixture();
 const wrapped={...f.f.DB,
  batch:async qs=>{await f.f.DB.batch(qs);throw Error('lost-receipt-private-data');}};
 const service=createP3AtomicAcceptanceProof({DB:wrapped,env:f.env,
  operatorApproved:()=>true,nowMs:()=>at,
  makeOperationId:()=> 'p3_00000001-1111-4111-8111-123456789abc',
  verifyAuthorization:async()=>proof});
 f.enable();
 await assert.rejects(service.accept(args),
  e=>e.code==='ATOMIC_OUTCOME_UNKNOWN'&&!e.message.includes('private-data'));
 assert.deepEqual(f.counts(),one);
 assert.deepEqual(await f.service.readStatus({approvalId,
  approvalSha256:proof.approvalSha256}),{state:'Found',
  operationId:'p3_00000001-1111-4111-8111-123456789abc',operationState:'Accepted'});
 f.f.sql.close();
});
test('P3-X08 unknown status never means safe to retry; read gate remains separate',async()=>{
 const f=fixture();f.enable();
 assert.deepEqual(await f.service.readStatus({approvalId,
  approvalSha256:proof.approvalSha256}),{state:'Unknown'});
 f.env.P3_ATOMIC_STATUS_ENABLED='false';
 await assert.rejects(f.service.readStatus({approvalId,
  approvalSha256:proof.approvalSha256}),e=>e.code==='STATUS_DISABLED');
 assert.deepEqual(f.counts(),zero);
 f.f.sql.close();
});
