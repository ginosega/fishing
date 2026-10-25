import test from 'node:test';
import assert from 'node:assert/strict';
import {sandbox} from './d1-fixture.mjs';

const ID='test-runner-lease-012345',OPKEY='merge-barrier-test-request-12345';
const B='a'.repeat(40),H='b'.repeat(40),M='c'.repeat(40);
const snap={package:{format:'fishing-companion-change-v2',
 domain:'gear',operation:'edit',id:'p3-test-rod'},media:[]};

async function atMerge(){
 const x=sandbox(),store=x.store();
 const created=await store.accept({idempotencyKey:OPKEY,snapshot:snap});
 const operationId=created.operationId;
 const advance=async(from,to,details={})=>{
  const lease=await store.claim({operationId,leaseOwner:ID});
  assert.equal(lease.state,from);
  const r=await store.advance({operationId,leaseOwner:ID,from,to,details});
  assert.equal(r.state,to);
 };
 await advance('Accepted','Validating');
 await advance('Validating','Checking',{prNumber:1,mainBaseSha:B,prHeadSha:H});
 await advance('Checking','Merging');
 const lease=await store.claim({operationId,leaseOwner:ID});
 assert.equal(lease.state,'Merging');
 return {x,store,operationId};
}
test('D2-B01 real SQLite D1 records merge write-ahead state once under lease',async()=>{
 const {x,store,operationId}=await atMerge();
 assert.equal((await store.get(operationId)).reasonCode,null);
 assert.equal(await store.markMergeAttempt({operationId,leaseOwner:ID}),true);
 assert.equal((await store.get(operationId)).reasonCode,'merge_attempted');
 assert.equal(await store.markMergeAttempt({operationId,leaseOwner:ID}),false);
 assert.equal(await store.markMergeAttempt({operationId,leaseOwner:'wrong-lease-012345'}),false);
 x.clock(31);
 // The old lease has expired but the write-ahead marker persists.
 assert.equal((await store.get(operationId)).reasonCode,'merge_attempted');
 const retry=await store.claim({operationId,leaseOwner:'recovered-lease-012345'});
 assert.equal(retry.state,'Merging');
 assert.equal(await store.markMergeAttempt({
  operationId,leaseOwner:'recovered-lease-012345'}),false);
});
test('D2-B02 durable normal merge receipt under lease clears barrier only on Deploying',async()=>{
 const {store,operationId}=await atMerge();
 assert.equal(await store.markMergeAttempt({operationId,leaseOwner:ID}),true);
 const saved=await store.saveMergeReceipt({
  operationId,leaseOwner:ID,mergeSha:M,prNumber:1});
 assert.equal(saved.mergeSha,M);
 assert.equal((await store.get(operationId)).reasonCode,'merge_attempted');
 const done=await store.advance({
  operationId,leaseOwner:ID,from:'Merging',to:'Deploying',
  details:{mergeSha:M}});
 assert.equal(done.state,'Deploying');
 assert.equal((await store.get(operationId)).reasonCode,null);
 assert.equal((await store.get(operationId)).mergeSha,M);
});
test('D2-B03 wrong state and missing repo receipts cannot mark a remote write',async()=>{
 const x=sandbox(),store=x.store();
 const record=await store.accept({idempotencyKey:OPKEY,snapshot:snap});
 const claimed=await store.claim({operationId:record.operationId,leaseOwner:ID});
 assert.equal(claimed.state,'Accepted');
 assert.equal(await store.markMergeAttempt({
  operationId:record.operationId,leaseOwner:ID}),false);
 assert.equal((await store.get(record.operationId)).reasonCode,null);
});
