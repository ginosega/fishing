import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sandbox,sample} from './d1-fixture.mjs';
import {createD1OperationStore} from '../src/d1-operation-store.mjs';
import {createP3D1CommandNonceStore,P3NonceError} from '../src/p3-command-nonce-store.mjs';
import {createP3InternalCommandGate,signP3InternalCommand} from '../src/p3-internal-command-gate.mjs';
const owner=265665562,repo=1430581407,now=1800000000000;
const nonce='nonce-will-never-be-in-the-db-as-raw-text';
const secret='unit-tests-private-only-bridge-secret-0123456789';
const op=/^p3_[0-9a-f-]{36}$/;
function db(){
 const f=sandbox();
 f.sql.exec(readFileSync(new URL('../migrations/0004_command_nonce_ledger.sql',import.meta.url),'utf8'));
 const store=createP3D1CommandNonceStore({DB:f.DB,ownerGitHubId:owner,now:()=>now});
 return {f,store};
}
test('P3-N01 single INSERT/RETURNING enforces durable nonce uniqueness',async()=>{
 const {f,store}=db();const hash='a'.repeat(64);
 const args={nonceSha256:hash,issuedAt:now,ownerGitHubId:owner,repositoryId:repo};
 assert.equal(await store.consumeNonce(args),true);
 assert.equal(await store.consumeNonce(args),false);
 const rows=f.sql.prepare('SELECT * FROM p3_command_nonces').all();
 assert.equal(rows.length,1);
 assert.equal(rows[0].nonce_sha256,hash);
 assert.equal(rows[0].github_id,owner);
 assert.equal(rows[0].repo_id,repo);
 f.sql.close();
});
test('P3-N02 invalid owner/repository/age and malformed nonce never insert',async()=>{
 const {f,store}=db();const h='b'.repeat(64);
 for(const input of [
  {nonceSha256:h,issuedAt:now,ownerGitHubId:owner+1,repositoryId:repo},
  {nonceSha256:h,issuedAt:now,ownerGitHubId:owner,repositoryId:1350909744},
  {nonceSha256:h,issuedAt:now-180000,ownerGitHubId:owner,repositoryId:repo},
  {nonceSha256:'abc',issuedAt:now,ownerGitHubId:owner,repositoryId:repo},
 ]){
  await assert.rejects(store.consumeNonce(input),e=>e instanceof P3NonceError);
 }
 assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM p3_command_nonces').get().n,0);
 f.sql.close();
});
test('P3-N03 racing exact duplicates yield only one consumption',async()=>{
 const {f,store}=db();const args={nonceSha256:'c'.repeat(64),issuedAt:now,
  ownerGitHubId:owner,repositoryId:repo};
 const outcomes=await Promise.all(Array.from({length:9},()=>store.consumeNonce(args)));
 assert.equal(outcomes.filter(Boolean).length,1);
 assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM p3_command_nonces').get().n,1);
 f.sql.close();
});
test('P3-N04 signed command uses native DB.batch for Accepted+snapshot audit and cannot replay',async()=>{
 const {f,store}=db();
 const env={P3_WRITE_ENABLED:'true',P3_COMMAND_BRIDGE_ENABLED:'true',
  P3_BRIDGE_HMAC_SECRET:secret};
 const acceptSnapshot=async({idempotencyKey,snapshot,
  ownerGitHubId,repositoryId})=>{
  assert.equal(ownerGitHubId,owner);assert.equal(repositoryId,repo);
  const owned=createD1OperationStore({DB:f.DB,ownerGitHubId:owner,
   now:()=>Math.floor(now/1000),
   makeId:()=> 'p3_00000001-1111-4111-8111-123456789abc'});
  return owned.accept({idempotencyKey,snapshot});
 };
 const gate=createP3InternalCommandGate({env,ownerGitHubId:owner,
  consumeNonce:store.consumeNonce,acceptSnapshot,operatorApproved:()=>true,
  now:()=>now});
 const json=JSON.stringify({action:'accept',idempotencyKey:f.key,snapshot:sample});
 const signed=await signP3InternalCommand({secret,nonce,timestamp:now,body:json});
 const make=()=>new Request('https://fishing-p3-sandbox-preview.ginosega.workers.dev/_p3/internal/command',{
  method:'POST',headers:{'Content-Type':'application/json',...signed},body:json,
 });
 const a=await gate.handle(make());assert.equal(a.status,202);
 assert.match((await a.json()).operationId,op);
 const b=await gate.handle(make());assert.equal(b.status,409);
 for(const table of ['p3_command_nonces','p3_operations','p3_requests','p3_events']){
  assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM '+table).get().n,1,table);
 }
 assert.equal(f.sql.prepare('SELECT github_id FROM p3_operations').get().github_id,owner);
 f.sql.close();
});
test('P3-N05 missing migration fails closed without accepting operations',async()=>{
 const f=sandbox();
 const store=createP3D1CommandNonceStore({DB:f.DB,ownerGitHubId:owner,now:()=>now});
 await assert.rejects(store.consumeNonce({nonceSha256:'d'.repeat(64),issuedAt:now,
  ownerGitHubId:owner,repositoryId:repo}));
 assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM p3_operations').get().n,0);
 f.sql.close();
});
