import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,generateKeyPairSync} from 'node:crypto';
import {sandbox} from './d1-fixture.mjs';
import {createP3ApprovalLedger,P3ApprovalLedgerError} from '../src/p3-approval-ledger.mjs';
import {createP3OperatorApproval,canonicalP3Approval} from '../src/p3-operator-approval.mjs';

const now=1800000000,OWNER=265665562,REPO=1430581407;
const approvalId='6b5234c8-3212-4123-8123-bcdef1234567';
const textBody='{"action":"accept","idempotencyKey":"owner-operation-key-0123456789"}';
const idem='owner-operation-key-0123456789';
const hash=s=>createHash('sha256').update(s).digest('hex');
const envelope={
 action:'accept',approvalId,bodySha256:hash(textBody),expiresAt:now+180,
 idempotencyKey:idem,issuedAt:now-10,operatorGithubId:OWNER,
 repositoryId:REPO,runAttempt:1,runId:441155,workflowSha:'a'.repeat(40),
};
const body=hash('p3-operator-approval-v1\n'+canonicalP3Approval(envelope));
const claim={approvalId,repositoryId:REPO,operatorGithubId:OWNER,
 runId:441155,runAttempt:1,workflowSha:'a'.repeat(40),
 idempotencyKey:idem,bodySha256:envelope.bodySha256,
 approvalSha256:body,issuedAt:now-10,expiresAt:now+180};
function setup(){
 const f=sandbox();
 f.sql.exec(readFileSync(new URL('../design/p3_operator_approval_ledger.schema.sql',import.meta.url),'utf8'));
 const env={P3_WRITE_ENABLED:'false',P3_APPROVAL_LEDGER_ENABLED:'false',
  P3_APPROVAL_STATUS_ENABLED:'false'};
 let approved=false,clock=now;
 const ledger=createP3ApprovalLedger({DB:f.DB,env,
  operatorApproved:()=>approved,now:()=>clock});
 const enable=()=>{approved=true;env.P3_WRITE_ENABLED='true';
  env.P3_APPROVAL_LEDGER_ENABLED='true';env.P3_APPROVAL_STATUS_ENABLED='true';};
 return {f,env,ledger,enable,setClock:x=>{clock=x}};
}
test('P3-D01 disabled ledgers do not perform D1 reads/writes',async()=>{
 const x=setup();
 await assert.rejects(x.ledger.consumeApproval(claim),e=>e.code==='LEDGER_DISABLED');
 await assert.rejects(x.ledger.readConsumption(claim),e=>e.code==='STATUS_DISABLED');
 assert.equal(x.f.sql.prepare('SELECT COUNT(*) n FROM p3_operator_approvals').get().n,0);
 x.f.sql.close();
});
test('P3-D02 one verified envelope has exactly one atomic durable consume',async()=>{
 const x=setup();x.enable();
 const results=await Promise.all(Array.from({length:8},()=>x.ledger.consumeApproval(claim)));
 assert.equal(results.filter(Boolean).length,1);
 assert.equal(x.f.sql.prepare('SELECT COUNT(*) n FROM p3_operator_approvals').get().n,1);
 assert.deepEqual(await x.ledger.readConsumption(claim),{state:'Consumed'});
 assert.deepEqual(await x.ledger.readConsumption({...claim,approvalSha256:'b'.repeat(64)}),
  {state:'Unknown'});
 assert.equal(await x.ledger.consumeApproval(claim),false);
 x.f.sql.close();
});
test('P3-D03 approval UUID cannot be reused with a different envelope',async()=>{
 const x=setup();x.enable();
 assert.equal(await x.ledger.consumeApproval(claim),true);
 assert.equal(await x.ledger.consumeApproval({...claim,
  approvalSha256:'c'.repeat(64)}),false);
 assert.deepEqual(await x.ledger.readConsumption({...claim,
  approvalSha256:'c'.repeat(64)}),{state:'Unknown'});
 x.f.sql.close();
});
test('P3-D04 wrong repo, owner, expiry, run and hash rejected before insertion',async()=>{
 const x=setup();x.enable();
 for(const changed of [
  {repositoryId:1},{operatorGithubId:1},{approvalId:'not-a-uuid'},
  {runId:0},{runAttempt:101},{workflowSha:'Z'.repeat(40)},
  {idempotencyKey:'bad'},{bodySha256:'no'},
  {issuedAt:now-600},{expiresAt:now},{expiresAt:now+301},
 ]){
  await assert.rejects(x.ledger.consumeApproval({...claim,...changed}),
   e=>e instanceof P3ApprovalLedgerError&&e.code==='LEDGER_CLAIM_DENIED');
 }
 assert.equal(x.f.sql.prepare('SELECT COUNT(*) n FROM p3_operator_approvals').get().n,0);
 x.f.sql.close();
});
test('P3-D05 lost acknowledgment is unknown, not permission to retry',async()=>{
 const x=setup();x.enable();
 const wrapped={
  prepare(sql){
   const p=x.f.DB.prepare(sql);
   return {bind(...args){
    const statement=p.bind(...args);
    return {async first(){
     const committed=await statement.first();
     if(sql.startsWith('INSERT')&&committed)throw Error('lost upstream receipt');
     return committed;
    }};
   }};
  },
 };
 const unreliable=createP3ApprovalLedger({DB:wrapped,env:x.env,
  operatorApproved:()=>true,now:()=>now});
 await assert.rejects(unreliable.consumeApproval(claim),
  e=>e.code==='LEDGER_UNAVAILABLE'&&!e.message.includes('lost upstream receipt'));
 assert.deepEqual(await x.ledger.readConsumption(claim),{state:'Consumed'});
 assert.equal(await x.ledger.consumeApproval(claim),false);
 x.f.sql.close();
});
test('P3-D06 unknown ledger record never claims it is safe to resend',async()=>{
 const x=setup();x.enable();
 assert.deepEqual(await x.ledger.readConsumption(claim),{state:'Unknown'});
 x.f.sql.close();
});
test('P3-D07 signed P-256 owner verifier integrates with one-use D1 fixture',async()=>{
 const x=setup();x.enable();
 const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 const signer=await crypto.subtle.importKey('jwk',
  privateKey.export({format:'jwk'}),{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const bytes=new TextEncoder().encode('p3-operator-approval-v1\n'+canonicalP3Approval(envelope));
 const signature=Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},signer,bytes))
  .toString('base64url');
 const verifier=createP3OperatorApproval({
  verifyProvenance:async()=>({verified:true,repositoryId:REPO,ownerGitHubId:OWNER,
   runId:441155,runAttempt:1,workflowSha:'a'.repeat(40)}),
  operatorPublicJwk:publicKey.export({format:'jwk'}),
  consumeApproval:x.ledger.consumeApproval,now:()=>now,
 });
 const args={oidcJwt:'mock-verified',approval:envelope,signature,
  body:textBody,idempotencyKey:idem};
 assert.equal((await verifier.authorize(args)).approved,true);
 await assert.rejects(verifier.authorize(args),e=>e.code==='APPROVAL_REPLAY_OR_LEDGER_DENIED');
 assert.equal(x.f.sql.prepare('SELECT COUNT(*) n FROM p3_operator_approvals').get().n,1);
 x.f.sql.close();
});
