import test from 'node:test';
import assert from 'node:assert/strict';
import {sandbox,sample} from './d1-fixture.mjs';
import {createD1OperationStore,DurableStoreError} from '../src/d1-operation-store.mjs';
const failed=code=>e=>(assert.equal(e instanceof DurableStoreError,true),assert.equal(e.code,code),true);
test('P3-D06 CAS transitions audit entire lifecycle with required evidence',async()=>{
 const e=sandbox(),s=e.store(),{operationId}=await s.accept({idempotencyKey:e.key,snapshot:sample});
 const owner='lease-owner-r-123456';
 const steps=[
  ['Accepted','Validating',{}],
  ['Validating','Checking',{prNumber:5,prHeadSha:'a'.repeat(40),mainBaseSha:'b'.repeat(40)}],
  ['Checking','Merging',{workflowRunId:876}],
  ['Merging','Deploying',{mergeSha:'c'.repeat(40)}],
  ['Deploying','Verifying',{workflowRunId:876}],
  ['Verifying','Live',{verifiedReleaseId:'d'.repeat(32),workflowRunId:876}],
 ];
 for(const [from,to,details] of steps){
  assert.equal((await s.claim({operationId,leaseOwner:owner})).state,from);
  if(from==='Merging')assert.equal(await s.markMergeAttempt({operationId,leaseOwner:owner}),true);
  assert.equal((await s.advance({operationId,leaseOwner:owner,from,to,details})).state,to);
 }
 assert.equal((await s.get(operationId)).verifiedReleaseId,'d'.repeat(32));
 assert.equal(await s.claim({operationId,leaseOwner:owner}),null);
 assert.deepEqual((await s.events(operationId)).map(v=>v.to),steps.map(v=>v[1]).toSpliced(0,0,'Accepted'));
});
test('P3-D07 illegal jumps and evidence gaps cannot bypass trigger',async()=>{
 const e=sandbox(),s=e.store(),{operationId}=await s.accept({idempotencyKey:e.key,snapshot:sample});
 const owner='lease-owner-z-123456';
 await s.claim({operationId,leaseOwner:owner});
 await assert.rejects(s.advance({operationId,leaseOwner:owner,from:'Accepted',to:'Live',details:{workflowRunId:1,verifiedReleaseId:'f'.repeat(32)}}),failed('INVALID_TRANSITION'));
 assert.equal((await s.advance({operationId,leaseOwner:owner,from:'Accepted',to:'Failed',details:{reasonCode:'invalid_content'}})).state,'Failed');
 assert.equal(await s.claim({operationId,leaseOwner:owner}),null);
 assert.throws(()=>e.sql.prepare("UPDATE p3_operations SET state='Live' WHERE operation_id=?").run(operationId),/invalid_p3_state_transition/);
 assert.equal((await s.events(operationId)).length,2);
});
test('P3-D08 rejects media, malformed envelope, oversized snapshot and wrong repo',async()=>{
 const e=sandbox(),s=e.store();
 await assert.rejects(s.accept({idempotencyKey:e.key,snapshot:{...sample,media:[{path:'Gear/assets/x.png'}]}}),failed('MEDIA_STAGING_REQUIRED'));
 const other=structuredClone(sample);other.package.domain='catches';
 await assert.rejects(s.accept({idempotencyKey:e.key,snapshot:other}),failed('INVALID_SNAPSHOT'));
 const large=structuredClone(sample);large.package.notes='x'.repeat(140000);
 await assert.rejects(s.accept({idempotencyKey:e.key,snapshot:large}),failed('SNAPSHOT_TOO_LARGE'));
 assert.throws(()=>createD1OperationStore({DB:e.DB,ownerGitHubId:778899,repositoryId:1350909744}),failed('INVALID_CONFIGURATION'));
 assert.equal(e.sql.prepare('SELECT count(*) AS n FROM p3_operations').get().n,0);
});
test('P3-D09 identity mismatch and corrupted snapshot reject resume',async()=>{
 const e=sandbox(),s=e.store(),{operationId}=await s.accept({idempotencyKey:e.key,snapshot:sample});
 const alien=createD1OperationStore({DB:e.DB,ownerGitHubId:12345});
 assert.equal(await alien.get(operationId),null);
 assert.equal(await alien.readSnapshot(operationId),null);
 assert.equal(await alien.claim({operationId,leaseOwner:'lease-alien-123456'}),null);
 e.sql.prepare('UPDATE p3_requests SET request_json=? WHERE operation_id=?').run('{}',operationId);
 await assert.rejects(s.readSnapshot(operationId),failed('CORRUPT_SNAPSHOT'));
});
