import test from 'node:test';
import assert from 'node:assert/strict';
import {sandbox,sample} from './d1-fixture.mjs';
import {DurableStoreError} from '../src/d1-operation-store.mjs';
const A='a'.repeat(40),B='b'.repeat(40),C='c'.repeat(40),D='d'.repeat(40);
const LEASE='known-merge-recovery-lease-123';
async function knownReceipt(){
 const f=sandbox(),store=f.store();
 const op=await store.accept({idempotencyKey:f.key,snapshot:sample});
 const id=op.operationId;
 async function step(from,to,details={}){
  await store.claim({operationId:id,leaseOwner:LEASE});
  await store.advance({operationId:id,leaseOwner:LEASE,from,to,details});
 }
 await step('Accepted','Validating');
 await step('Validating','Checking',{prNumber:17,mainBaseSha:A,prHeadSha:B});
 await step('Checking','Merging',{workflowRunId:123});
 await store.claim({operationId:id,leaseOwner:LEASE});
 assert.equal(await store.markMergeAttempt({operationId:id,leaseOwner:LEASE}),true);
 assert.deepEqual(await store.saveMergeReceipt({operationId:id,leaseOwner:LEASE,
  mergeSha:C,prNumber:17}),{repositoryId:1430581407,mergeSha:C,prNumber:17});
 return {f,store,id};
}
test('MERGE-ACK-01 known write-ahead merge receipt can be reconciled read-only',async()=>{
 const {f,store,id}=await knownReceipt();
 assert.equal(await store.nextRecoverableMerge(),null);
 f.clock(31);
 assert.equal(await store.nextRecoverableMerge(),id);
 const r=await store.reconcileVerifiedMerge({verified:true,repositoryId:1430581407,
  operationId:id,prNumber:17,prHeadSha:B,mainBaseSha:A,
  mergeSha:C,workflowRunId:123,canonicalLive:false});
 assert.equal(r.state,'Deploying');
 assert.equal(r.mergeSha,C);
 assert.equal(r.reasonCode,null);
 assert.equal((await store.get(id)).state,'Deploying');
});
test('MERGE-ACK-02 known durable SHA mismatch cannot be overwritten or reconstructed',async()=>{
 const {f,store,id}=await knownReceipt();
 f.clock(31);
 const data={verified:true,repositoryId:1430581407,operationId:id,
  prNumber:17,prHeadSha:B,mainBaseSha:A,workflowRunId:123,
  canonicalLive:false};
 await assert.rejects(store.reconcileVerifiedMerge({...data,mergeSha:D}),
  e=>e instanceof DurableStoreError&&e.code==='RECONCILIATION_CAS_DENIED');
 assert.equal((await store.get(id)).mergeSha,C);
 assert.equal((await store.get(id)).reasonCode,'merge_attempted');
 assert.equal((await store.get(id)).state,'Merging');
});
