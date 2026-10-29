import test from 'node:test';
import assert from 'node:assert/strict';
import {sandbox,sample} from './d1-fixture.mjs';
import {DurableStoreError} from '../src/d1-operation-store.mjs';
const A='a'.repeat(40),B='b'.repeat(40),KEY='d3-fast-lookup-secure-123';
const WORKER='d3-fast-d1-lease-12345';
async function checking(f,idem){
 const store=f.store();
 const op=await store.accept({idempotencyKey:idem,snapshot:sample});
 await store.claim({operationId:op.operationId,leaseOwner:WORKER});
 await store.advance({operationId:op.operationId,leaseOwner:WORKER,
  from:'Accepted',to:'Validating'});
 await store.claim({operationId:op.operationId,leaseOwner:WORKER});
 await store.advance({operationId:op.operationId,leaseOwner:WORKER,
  from:'Validating',to:'Checking',
  details:{prNumber:29,prHeadSha:B,mainBaseSha:A}});
 return {store,op:op.operationId};
}
test('FAST-D1-01 only one exact checking SHA returns sandbox wake receipt',async()=>{
 const f=sandbox(),r=await checking(f,KEY);
 assert.deepEqual(await r.store.findCheckingByHead({
  repositoryId:1430581407,headSha:B,
 }),{operationId:r.op,repositoryId:1430581407,
  prHeadSha:B,state:'Checking'});
 assert.equal(await r.store.findCheckingByHead({
  repositoryId:1430581407,headSha:'c'.repeat(40)}),null);
});
test('FAST-D1-02 rejects wrong repo and malformed input without returning operation',async()=>{
 const f=sandbox(),r=await checking(f,KEY);
 for(const v of [{repositoryId:1,headSha:B},
  {repositoryId:1430581407,headSha:'bad'}]){
  await assert.rejects(r.store.findCheckingByHead(v),
   err=>err instanceof DurableStoreError&&err.code==='INVALID_CHECK_WAKE');
 }
});
test('FAST-D1-03 duplicate ambiguous checking SHA cannot route webhook',async()=>{
 const f=sandbox(),r=await checking(f,KEY);
 await checking(f,'other-unique-fast-lookup-123');
 await assert.rejects(r.store.findCheckingByHead({
  repositoryId:1430581407,headSha:B}),
  e=>e instanceof DurableStoreError&&e.code==='AMBIGUOUS_CHECK_WAKE');
});
test('FAST-D1-04 primary read selected when D1 replication sessions supported',async()=>{
 const f=sandbox(),r=await checking(f,KEY),prepare=f.DB.prepare.bind(f.DB);
 let uses=0;
 f.DB.withSession=mode=>{
  assert.equal(mode,'first-primary');uses++;return {prepare};
 };
 assert.equal((await r.store.findCheckingByHead({
  repositoryId:1430581407,headSha:B})).operationId,r.op);
 assert.equal(uses,1);
});
