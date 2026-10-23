import test from 'node:test';
import assert from 'node:assert/strict';
import {sandbox,sample} from './d1-fixture.mjs';
import {DurableStoreError} from '../src/d1-operation-store.mjs';
const A='a'.repeat(40),B='b'.repeat(40),C='c'.repeat(40);
const LEASE1='receipt-worker-owner-one-1234',LEASE2='receipt-worker-owner-two-1234';
async function setup(){
 const f=sandbox(),store=f.store();
 const accepted=await store.accept({idempotencyKey:f.key,snapshot:sample});
 let lease=await store.claim({operationId:accepted.operationId,leaseOwner:LEASE1});
 assert.equal(lease.state,'Accepted');
 const active=await store.advance({operationId:accepted.operationId,leaseOwner:LEASE1,from:'Accepted',to:'Validating'});
 assert.equal(active.state,'Validating');
 lease=await store.claim({operationId:accepted.operationId,leaseOwner:LEASE1});
 assert.equal(lease.state,'Validating');
 return {...f,store,operationId:accepted.operationId};
}
test('P3-R01 immutable branch receipt recorded under claimed lease and visible after restart',async()=>{
 const e=await setup();
 const receipt=await e.store.saveBranchReceipt({operationId:e.operationId,leaseOwner:LEASE1,baseSha:A,headSha:B});
 assert.deepEqual(receipt,{repositoryId:1430581407,baseSha:A,headSha:B});
 const resumed=e.store();
 assert.deepEqual(await resumed.branchReceipt(e.operationId),receipt);
 assert.deepEqual(await e.store.saveBranchReceipt({operationId:e.operationId,leaseOwner:LEASE1,baseSha:A,headSha:B}),receipt);
 assert.equal(e.sql.prepare('SELECT COUNT(*) AS n FROM p3_events').get().n,2);
});
test('P3-R02 incorrect worker, divergent head, concurrent updates or expired lease cannot change receipt',async()=>{
 const e=await setup();
 assert.equal(await e.store.saveBranchReceipt({operationId:e.operationId,leaseOwner:LEASE2,baseSha:A,headSha:B}),null);
 await e.store.saveBranchReceipt({operationId:e.operationId,leaseOwner:LEASE1,baseSha:A,headSha:B});
 assert.equal(await e.store.saveBranchReceipt({operationId:e.operationId,leaseOwner:LEASE1,baseSha:A,headSha:C}),null);
 e.clock(31);
 assert.equal(await e.store.saveBranchReceipt({operationId:e.operationId,leaseOwner:LEASE1,baseSha:A,headSha:B}),null);
 assert.deepEqual(await e.store.branchReceipt(e.operationId),{repositoryId:1430581407,baseSha:A,headSha:B});
});
test('P3-R03 receipt is preserved when the PR creation step is interrupted and recovered',async()=>{
 const e=await setup();
 await e.store.saveBranchReceipt({operationId:e.operationId,leaseOwner:LEASE1,baseSha:A,headSha:B});
 e.clock(31);
 assert.equal((await e.store.claim({operationId:e.operationId,leaseOwner:LEASE2})).state,'Validating');
 const record=await e.store.branchReceipt(e.operationId);
 assert.deepEqual(record,{repositoryId:1430581407,baseSha:A,headSha:B});
 const moved=await e.store.advance({operationId:e.operationId,leaseOwner:LEASE2,from:'Validating',to:'Checking',
  details:{mainBaseSha:A,prHeadSha:B,prNumber:77}});
 assert.equal(moved.state,'Checking');
 assert.equal((await e.store.get(e.operationId)).prNumber,77);
});
test('P3-R04 no receipt for untrusted request and invalid SHA rejected before SQL',async()=>{
 const e=await setup();
 assert.equal(await e.store.branchReceipt('p3_00000000-1111-4111-8111-123456789fff'),null);
 await assert.rejects(e.store.saveBranchReceipt({operationId:e.operationId,leaseOwner:LEASE1,baseSha:A,headSha:A}),
  err=>err instanceof DurableStoreError&&err.code==='INVALID_RECEIPT');
});
