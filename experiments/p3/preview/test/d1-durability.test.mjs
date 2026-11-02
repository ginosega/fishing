import test from 'node:test';
import assert from 'node:assert/strict';
import {sandbox,sample} from './d1-fixture.mjs';
import {DurableStoreError,createD1OperationStore} from '../src/d1-operation-store.mjs';
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

test('P3-D06 read-only lost-202 receipt lookup is exact-key/payload and has no audit mutation',async()=>{
 const e=sandbox(),a=e.store(),b=e.store();
 assert.equal(await a.lookupReceipt({idempotencyKey:e.key,snapshot:sample}),null);
 const first=await a.accept({idempotencyKey:e.key,snapshot:sample});
 const before=(await a.events(first.operationId)).length;
 const recovered=await b.lookupReceipt({idempotencyKey:e.key,
  snapshot:structuredClone(sample)});
 assert.equal(recovered.operationId,first.operationId);
 assert.equal(recovered.state,'Accepted');
 assert.equal(recovered.inserted,false);
 assert.equal((await a.events(first.operationId)).length,before);
 assert.equal(e.sql.prepare('SELECT count(*) AS n FROM p3_operations').get().n,1);
 assert.equal(e.sql.prepare('SELECT count(*) AS n FROM p3_requests').get().n,1);
});
test('P3-D07 receipt recovery rejects changed payload and owner/key mismatch',async()=>{
 const e=sandbox(),s=e.store();
 const first=await s.accept({idempotencyKey:e.key,snapshot:sample});
 const tampered=structuredClone(sample);tampered.package.id='another';
 await assert.rejects(s.lookupReceipt({idempotencyKey:e.key,snapshot:tampered}),
  errorCode('IDEMPOTENCY_CONFLICT'));
 assert.equal(await s.lookupReceipt({idempotencyKey:'different-key-987654',
  snapshot:sample}),null);
 const otherOwner=createStoreForOtherOwner(e.DB);
 assert.equal(await otherOwner.lookupReceipt({idempotencyKey:e.key,
  snapshot:sample}),null);
 assert.equal((await s.get(first.operationId)).state,'Accepted');
});
function createStoreForOtherOwner(DB){
 return createD1OperationStore({DB,ownerGitHubId:987654321});
}


test('P3-D latest receipt is read-only, owner scoped and most recently accepted',async()=>{
 const x=sandbox(),store=x.store();
 assert.equal(await store.latest(),null);
 const one=await store.accept({idempotencyKey:'first-owner-key-12345',
  snapshot:sample});
 x.clock(1);
 const other=structuredClone(sample);other.package.id='second';
 const two=await store.accept({idempotencyKey:'second-owner-key-12345',
  snapshot:other});
 const latest=await store.latest();
 assert.equal(latest.operationId,two.operationId);
 assert.equal(latest.state,'Accepted');
 assert.equal((await store.events(one.operationId)).length,1);
 assert.equal((await store.events(two.operationId)).length,1);
 const foreign=createD1OperationStore({DB:x.DB,ownerGitHubId:778800});
 assert.equal(await foreign.latest(),null);
 assert.equal(x.sql.prepare('SELECT count(*) AS n FROM p3_events').get().n,2);
});
const catchId='p3-test-catch-2026-11-01-synthetic-test-lake-synthetic-bass';
const catchImagePath='Catches/assets/'+catchId+'/notes/step-02.jpg';
function catchNotesSnapshot(){
 const image={path:catchImagePath,bytes:6145,sha256:'b'.repeat(64)};
 return {package:{
  format:'fishing-companion-change-v2',domain:'catches',operation:'add',
  id:catchId,base:{schemaVersion:2,sourceRevision:'a'.repeat(40),recordHash:null},
  record:{id:catchId,date:'2026-11-01',speciesName:'Synthetic bass'},
  picture:{action:'keep'},pictureSequence:{action:'keep'},
  notes:{action:'create',path:'Catches/content/'+catchId+'.md',
   body:'![step 02](../assets/'+catchId+'/notes/step-02.jpg)',
   baseSha256:null,images:[image]},
 },media:[{...image,blobSha:'c'.repeat(40),expiresAt:1800001000,
  mime:'image/jpeg',signature:'A'.repeat(43)}]};
}

test('P3-D08 Catch Notes media permits read-only recovery and one atomic acceptance',async()=>{
 const e=sandbox(),store=e.store(),snapshot=catchNotesSnapshot();
 // The former Gear/KB-only restriction threw MEDIA_STAGING_REQUIRED here,
 // surfaced as HTTP 503 before a durable operation could be created.
 assert.equal(await store.lookupReceipt({idempotencyKey:e.key,snapshot}),null);
 const accepted=await store.accept({idempotencyKey:e.key,snapshot});
 assert.equal(accepted.state,'Accepted');
 assert.deepEqual(await store.readSnapshot(accepted.operationId),snapshot);
 const recovered=await e.store().lookupReceipt({idempotencyKey:e.key,
  snapshot:structuredClone(snapshot)});
 assert.equal(recovered.operationId,accepted.operationId);
 assert.equal(recovered.inserted,false);
 assert.equal(e.sql.prepare('SELECT count(*) AS n FROM p3_operations').get().n,1);
 assert.equal(e.sql.prepare('SELECT count(*) AS n FROM p3_requests').get().n,1);
 assert.equal((await store.events(accepted.operationId)).length,1);
});

test('P3-D09 Catch cover, picture sequence and unlinked media still fail closed',async()=>{
 const e=sandbox(),store=e.store();
 const cases=[
  s=>{s.package.picture={action:'add',path:'Catches/assets/cover.jpg'};},
  s=>{s.package.pictureSequence={action:'set',paths:[catchImagePath]};},
  s=>{s.package.notes.action='keep';},
  s=>{s.package.notes.images=[];},
  s=>{s.package.notes.images[0].sha256='d'.repeat(64);},
  s=>{s.media.push({...s.media[0],path:catchImagePath+'-duplicate'});},
 ];
 for(const mutate of cases){
  const invalid=catchNotesSnapshot();mutate(invalid);
  await assert.rejects(store.lookupReceipt({idempotencyKey:e.key,
   snapshot:invalid}),errorCode('MEDIA_STAGING_REQUIRED'));
  await assert.rejects(store.accept({idempotencyKey:e.key,
   snapshot:invalid}),errorCode('MEDIA_STAGING_REQUIRED'));
 }
 assert.equal(e.sql.prepare('SELECT count(*) AS n FROM p3_operations').get().n,0);
 assert.equal(e.sql.prepare('SELECT count(*) AS n FROM p3_events').get().n,0);
});
