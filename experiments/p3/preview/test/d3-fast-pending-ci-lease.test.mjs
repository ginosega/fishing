import test from 'node:test';
import assert from 'node:assert/strict';
import {sandbox,sample} from './d1-fixture.mjs';
const A='a'.repeat(40),B='b'.repeat(40);
const FIRST='owner-check-lease-worker-0001';
const SECOND='owner-check-lease-worker-0002';
async function fixture(){
 const f=sandbox(),store=f.store();
 const r=await store.accept({idempotencyKey:f.key,snapshot:sample});
 const id=r.operationId;
 await store.claim({operationId:id,leaseOwner:FIRST});
 await store.advance({operationId:id,leaseOwner:FIRST,
  from:'Accepted',to:'Validating'});
 await store.claim({operationId:id,leaseOwner:FIRST});
 await store.advance({operationId:id,leaseOwner:FIRST,
  from:'Validating',to:'Checking',
  details:{prNumber:17,prHeadSha:B,mainBaseSha:A}});
 await store.claim({operationId:id,leaseOwner:FIRST});
 return {f,store,id};
}
test('P1-CI-01 only matching held Checking lease can be released',async()=>{
 const x=await fixture();
 assert.equal(await x.store.releasePendingCheckLease({
  operationId:x.id,leaseOwner:SECOND}),false);
 assert.equal(await x.store.claim({operationId:x.id,leaseOwner:SECOND}),null);
 assert.equal(await x.store.releasePendingCheckLease({
  operationId:x.id,leaseOwner:FIRST}),true);
 assert.equal((await x.store.claim({operationId:x.id,leaseOwner:SECOND})).state,'Checking');
 assert.equal((await x.store.get(x.id)).state,'Checking');
});
test('P1-CI-02 no merge, release identity or audit state changes',async()=>{
 const x=await fixture();
 const before=await x.store.events(x.id);
 assert.equal(await x.store.releasePendingCheckLease({
  operationId:x.id,leaseOwner:FIRST}),true);
 const after=await x.store.events(x.id);
 assert.deepEqual(after,before);
 const rec=await x.store.get(x.id);
 assert.equal(rec.prHeadSha,B);
 assert.equal(rec.state,'Checking');
 assert.equal(rec.mergeSha,null);
 assert.equal(rec.verifiedReleaseId,null);
});
test('P1-CI-03 expired, terminal or previously released claim never released',async()=>{
 const x=await fixture();
 x.f.clock(31);
 assert.equal(await x.store.releasePendingCheckLease({
  operationId:x.id,leaseOwner:FIRST}),false);
 assert.equal((await x.store.claim({operationId:x.id,leaseOwner:SECOND})).state,'Checking');
 assert.equal(await x.store.releasePendingCheckLease({
  operationId:x.id,leaseOwner:FIRST}),false);
});
test('P1-CI-04 every pending recheck must acquire fresh D1 lease',async()=>{
 const x=await fixture();
 assert.equal(await x.store.releasePendingCheckLease({
  operationId:x.id,leaseOwner:FIRST}),true);
 assert.equal((await x.store.claim({operationId:x.id,leaseOwner:SECOND})).state,'Checking');
 assert.equal(await x.store.releasePendingCheckLease({
  operationId:x.id,leaseOwner:SECOND}),true);
 assert.equal((await x.store.claim({operationId:x.id,leaseOwner:FIRST})).state,'Checking');
});
