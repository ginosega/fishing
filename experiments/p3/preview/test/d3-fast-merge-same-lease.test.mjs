import test from 'node:test';
import assert from 'node:assert/strict';
import {sandbox,sample} from './d1-fixture.mjs';
const A='a'.repeat(40),B='b'.repeat(40),C='c'.repeat(40),D='d'.repeat(40);
const OWNER='same-lease-fast-merge-owner';
const OTHER='different-merge-lease-owner';
async function setup(){
 const f=sandbox(),store=f.store();
 const {operationId}=await store.accept({idempotencyKey:f.key,snapshot:sample});
 const advance=async(from,to,details={})=>{
  assert.equal((await store.claim({operationId,leaseOwner:OWNER})).state,from);
  assert.equal((await store.advance({operationId,leaseOwner:OWNER,from,to,details})).state,to);
 };
 await advance('Accepted','Validating');
 await advance('Validating','Checking',{prNumber:20,prHeadSha:B,mainBaseSha:A});
 await advance('Checking','Merging',{workflowRunId:40914738853});
 assert.equal((await store.claim({operationId,leaseOwner:OWNER})).state,'Merging');
 return {f,store,operationId};
}
const step=({store,operationId},leaseOwner=OWNER,mergeSha=C)=>store.advance({
 operationId,leaseOwner,from:'Merging',to:'Deploying',details:{mergeSha},
});
test('P1-MF-D1-01 same active lease plus marked exact merge moves to Deploying once',async()=>{
 const x=await setup();
 assert.equal(await x.store.markMergeAttempt({operationId:x.operationId,leaseOwner:OWNER}),true);
 const result=await step(x);
 assert.equal(result.state,'Deploying');
 assert.equal(result.mergeSha,C);
 assert.equal(result.reasonCode,null);
 assert.equal((await x.store.events(x.operationId)).at(-1).to,'Deploying');
 assert.equal(await step(x),null);
});
test('P1-MF-D1-02 cannot skip the write-ahead marker',async()=>{
 const x=await setup();
 assert.equal(await step(x),null);
 assert.equal((await x.store.get(x.operationId)).state,'Merging');
 assert.equal((await x.store.events(x.operationId)).at(-1).to,'Merging');
});
test('P1-MF-D1-03 stolen or expired lease blocks fast path and keeps recovery receipt',async()=>{
 const x=await setup();
 assert.equal(await x.store.markMergeAttempt({operationId:x.operationId,leaseOwner:OWNER}),true);
 assert.equal(await step(x,OTHER),null);
 x.f.clock(31);
 assert.equal(await step(x),null);
 assert.equal((await x.store.get(x.operationId)).reasonCode,'merge_attempted');
 assert.equal(await x.store.nextRecoverableMerge(),x.operationId);
});
test('P1-MF-D1-04 differing already recorded merge SHA cannot be overwritten',async()=>{
 const x=await setup();
 assert.equal(await x.store.markMergeAttempt({operationId:x.operationId,leaseOwner:OWNER}),true);
 assert.ok(await x.store.saveMergeReceipt({
  operationId:x.operationId,leaseOwner:OWNER,mergeSha:C,prNumber:20,
 }));
 assert.equal(await step(x,OWNER,D),null);
 assert.equal((await x.store.get(x.operationId)).state,'Merging');
 assert.equal((await x.store.get(x.operationId)).mergeSha,C);
 assert.equal((await step(x)).state,'Deploying');
});
