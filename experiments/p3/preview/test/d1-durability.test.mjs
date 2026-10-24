import test from 'node:test';
import assert from 'node:assert/strict';
import {sandbox,sample} from './d1-fixture.mjs';
import {DurableStoreError} from '../src/d1-operation-store.mjs';
const errorCode=code=>e=>(assert.equal(e instanceof DurableStoreError,true),assert.equal(e.code,code),true);
test('P3-D01 atomic accepted snapshot and one audit event',async()=>{
 const e=sandbox(),s=e.store(),op=await s.accept({idempotencyKey:e.key,snapshot:sample});
 assert.equal(op.state,'Accepted');assert.equal(op.inserted,true);
 assert.deepEqual(await s.readSnapshot(op.operationId),sample);
 assert.deepEqual((await s.events(op.operationId)).map(v=>v.to),['Accepted']);
 assert.equal(e.sql.prepare('SELECT count(*) AS n FROM p3_requests').get().n,1);
});
test('P3-D02 duplicate key reuses operation across restarted Workers',async()=>{
 const e=sandbox(),a=e.store(),b=e.store();
 const x=await a.accept({idempotencyKey:e.key,snapshot:sample});
 const y=await b.accept({idempotencyKey:e.key,snapshot:structuredClone(sample)});
 assert.equal(x.operationId,y.operationId);assert.equal(y.inserted,false);
 assert.equal((await b.events(x.operationId)).length,1);
});
test('P3-D03 same key different payload fails without overwriting original',async()=>{
 const e=sandbox(),s=e.store(),x=await s.accept({idempotencyKey:e.key,snapshot:sample});
 const changed=structuredClone(sample);changed.package.id='different';
 await assert.rejects(s.accept({idempotencyKey:e.key,snapshot:changed}),errorCode('IDEMPOTENCY_CONFLICT'));
 assert.deepEqual(await s.readSnapshot(x.operationId),sample);
});
test('P3-D04 lease CAS prevents concurrency and resumes after expiry',async()=>{
 const e=sandbox(),a=e.store(),b=e.store(),x=await a.accept({idempotencyKey:e.key,snapshot:sample});
 const op=x.operationId,A='lease-owner-a-123456',B='lease-owner-b-123456';
 assert.equal((await a.claim({operationId:op,leaseOwner:A})).state,'Accepted');
 assert.equal(await b.claim({operationId:op,leaseOwner:B}),null);
 assert.equal(await b.advance({operationId:op,leaseOwner:B,from:'Accepted',to:'Validating'}),null);
 e.clock(31);
 assert.equal((await b.claim({operationId:op,leaseOwner:B})).state,'Accepted');
 assert.equal(await a.advance({operationId:op,leaseOwner:A,from:'Accepted',to:'Validating'}),null);
 assert.equal((await b.advance({operationId:op,leaseOwner:B,from:'Accepted',to:'Validating'})).state,'Validating');
 assert.deepEqual((await b.events(op)).map(v=>v.to),['Accepted','Validating']);
});
test('P3-D05 rejected second batched insert rolls back accepted event too',async()=>{
 const e=sandbox(),s=e.store();
 e.sql.exec("CREATE TRIGGER reject_payload BEFORE INSERT ON p3_requests BEGIN SELECT RAISE(ABORT,'no_snapshot'); END;");
 await assert.rejects(s.accept({idempotencyKey:e.key,snapshot:sample}),/no_snapshot/);
 assert.equal(e.sql.prepare('SELECT count(*) AS n FROM p3_operations').get().n,0);
 assert.equal(e.sql.prepare('SELECT count(*) AS n FROM p3_events').get().n,0);
});
