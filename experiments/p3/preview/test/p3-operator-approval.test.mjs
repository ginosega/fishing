import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync} from 'node:crypto';
import {createP3OperatorApproval,canonicalP3Approval,P3ApprovalError}
 from '../src/p3-operator-approval.mjs';

const run={verified:true,repositoryId:1430581407,ownerGitHubId:265665562,
 runId:441155,runAttempt:1,workflowSha:'a'.repeat(40)};
const when=1800000000,body='{"action":"accept","idempotencyKey":"owner-operation-key-0123456789"}';
const idem='owner-operation-key-0123456789';
const uuid='6b5234c8-3212-4123-8123-bcdef1234567';
const keypair=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const pub=keypair.publicKey.export({format:'jwk'});
const privateJwk=keypair.privateKey.export({format:'jwk'});
const sha=s=>createHash('sha256').update(s).digest('hex');
const approvalBase={
 action:'accept',approvalId:uuid,bodySha256:sha(body),expiresAt:when+180,
 idempotencyKey:idem,issuedAt:when-10,operatorGithubId:265665562,
 repositoryId:1430581407,runAttempt:1,runId:441155,workflowSha:'a'.repeat(40),
};
async function signed(approval=approvalBase,otherKey=privateJwk){
 const key=await crypto.subtle.importKey('jwk',otherKey,
  {name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const bytes=new TextEncoder().encode('p3-operator-approval-v1\n'+canonicalP3Approval(approval));
 const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,bytes);
 return Buffer.from(signature).toString('base64url');
}
function fixture({verifyProvenance=async()=>run,now=()=>when,ledger}={}){
 const used=new Set();let consumed=0,verified=0;
 const authorize=createP3OperatorApproval({
  verifyProvenance:async jwt=>{verified++;assert.equal(jwt,'synthetic-oidc-placeholder');
   return verifyProvenance(jwt);},
  operatorPublicJwk:pub,now,
  consumeApproval:ledger??(async receipt=>{
   consumed++;
   if(used.has(receipt.approvalId))return false;
   used.add(receipt.approvalId);return true;
  }),
 }).authorize;
 const request=async({approval=approvalBase,signature,requestBody=body,key=idem}={})=>
  authorize({oidcJwt:'synthetic-oidc-placeholder',approval,
   signature:signature??await signed(approval),body:requestBody,idempotencyKey:key});
 return {request,get consumed(){return consumed},get verified(){return verified}};
}
test('P3-O01 real ECDSA owner approval binds one exact signed run and command',async()=>{
 const x=fixture();
 assert.deepEqual(await x.request(),{
  approved:true,action:'accept',repositoryId:1430581407,
  ownerGitHubId:265665562,idempotencyKey:idem,
  runId:441155,runAttempt:1,approvalId:uuid});
 assert.equal(x.consumed,1);assert.equal(x.verified,1);
});
test('P3-O02 tampered body, idempotency key and author-scoped operation never consume',async()=>{
 const x=fixture();
 for(const args of [
  {requestBody:body+' '},{key:'different-key-0000000000'},
  {approval:{...approvalBase,action:'publish'}},
  {approval:{...approvalBase,repositoryId:2}},
  {approval:{...approvalBase,operatorGithubId:1}},
  {approval:{...approvalBase,workflowSha:'b'.repeat(40)}},
  {approval:{...approvalBase,runAttempt:2}},
  {approval:{...approvalBase,runId:555}},
  {approval:{...approvalBase,expiresAt:when-1}},
  {approval:{...approvalBase,expiresAt:when+1000}},
 ]){
  await assert.rejects(x.request(args),P3ApprovalError);
 }
 assert.equal(x.consumed,0);
});
test('P3-O03 counterfeit, malformed and unrelated signature reject before ledger',async()=>{
 const x=fixture();
 const other=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 const sig=await signed(approvalBase,other.privateKey.export({format:'jwk'}));
 await assert.rejects(x.request({signature:sig}),e=>e.code==='APPROVAL_SIGNATURE_INVALID');
 await assert.rejects(x.request({signature:'not-valid'}),e=>e.code==='APPROVAL_SIGNATURE_INVALID');
 assert.equal(x.consumed,0);
});
test('P3-O04 durable one-time approval consumption rejects replay',async()=>{
 const x=fixture();
 await x.request();
 await assert.rejects(x.request(),e=>e.code==='APPROVAL_REPLAY_OR_LEDGER_DENIED');
 assert.equal(x.consumed,2);
});
test('P3-O05 missing/broken persistent ledger fail closed without approval',async()=>{
 const missing=fixture({ledger:async()=>false});
 await assert.rejects(missing.request(),e=>e.code==='APPROVAL_REPLAY_OR_LEDGER_DENIED');
 const error=fixture({ledger:async()=>{throw Error('private ledger details');}});
 await assert.rejects(error.request(),e=>
  e.code==='APPROVAL_LEDGER_UNAVAILABLE'&&!e.message.includes('private ledger details'));
});
test('P3-O06 unverified or wrong repo runner is rejected before signature ledger',async()=>{
 for(const verifyProvenance of [
  async()=>({verified:false}),async()=>({...run,repositoryId:123}),
  async()=>({...run,ownerGitHubId:999}),async()=>{throw Error('untrusted runner');},
 ]){
  const x=fixture({verifyProvenance});
  await assert.rejects(x.request());
  assert.equal(x.consumed,0);
 }
});
test('P3-O07 extra unsigned approval properties or bad constructor denied',async()=>{
 const x=fixture();
 await assert.rejects(x.request({approval:{...approvalBase,extra:'untrusted'}}),
  P3ApprovalError);
 assert.throws(()=>createP3OperatorApproval({verifyProvenance:async()=>run}),
  e=>e.code==='INVALID_APPROVAL_CONFIG');
});
