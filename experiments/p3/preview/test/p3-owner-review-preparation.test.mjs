import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {sample} from './d1-fixture.mjs';
import {createP3OwnerReviewPreparation,P3OwnerReviewError}
 from '../src/p3-owner-review-preparation.mjs';
import {canonicalP3Approval,createP3OperatorApprovalVerifier}
 from '../src/p3-operator-approval.mjs';
import {encodeP3ProofEnvelope,decodeP3ProofEnvelope}
 from '../src/p3-proof-envelope.mjs';
import {signP3InternalCommand} from '../src/p3-internal-command-gate.mjs';
import {createP3AtomicSignatureVerifier} from '../src/p3-atomic-signature-verifier.mjs';

const CLOCK=1800000000,OWNER=265665562,REPO=1430581407;
const RUN={verified:true,repositoryId:REPO,ownerGitHubId:OWNER,
 runId:441155,runAttempt:1,workflowSha:'a'.repeat(40)};
const OIDC='test-oidc-from-injected-verified-provenance-only.'.repeat(4);
const KEY='owner-review-operation-0123456789';
const BODY=JSON.stringify({action:'accept',idempotencyKey:KEY,snapshot:sample});
const approvalId='6b5234c8-3212-4123-8123-bcdef1234567';
const hash=x=>createHash('sha256').update(x).digest('hex');
const args={body:BODY,oidcJwt:OIDC,approvalId,issuedAt:CLOCK-10,expiresAt:CLOCK+120};
function fixture({verifyProvenance=async()=>RUN,now=()=>CLOCK}={}){
 let calls=0;
 const reader=createP3OwnerReviewPreparation({
  verifyProvenance:async jwt=>{calls++;assert.equal(jwt,OIDC);
   return verifyProvenance(jwt);},now,
 });
 return {reader,get calls(){return calls}};
}
const denial=code=>e=>e instanceof P3OwnerReviewError&&e.code===code&&
 e.message==='P3 unsigned owner review preparation denied';

test('P3-H01 exact canonical command and verified run produce UNSIGNED one-operation material',async()=>{
 const f=fixture();
 assert.equal(f.calls,0);
 const x=await f.reader.prepare(args);
 assert.equal(f.calls,1);
 assert.equal(x.unsigned,true);
 assert.equal(x.requiresExternalOwnerSignature,true);
 assert.equal(x.validForOneAcceptOnly,true);
 assert.equal(x.exactCommandForPrivateOwnerReview,BODY);
 assert.equal(x.packageDomain,'gear');
 assert.equal(x.packageOperation,'edit');
 assert.equal(x.packageId,'sample');
 assert.equal(x.bodySha256,hash(BODY));
 assert.equal(x.runId,441155);
 assert.equal(x.expiresAt,CLOCK+120);
 assert.equal(x.signingMessageSha256,hash(x.signingMessage));
 assert.equal(x.signingMessage,
  'p3-operator-approval-v1\n'+x.canonicalApproval);
 assert(!JSON.stringify(x).includes(OIDC));
 assert.deepEqual(Object.keys(JSON.parse(x.canonicalApproval)),[
  'action','approvalId','bodySha256','expiresAt','idempotencyKey',
  'issuedAt','operatorGithubId','repositoryId','runAttempt','runId','workflowSha',
 ]);
 assert.equal(JSON.parse(x.canonicalApproval).workflowSha,RUN.workflowSha);
 assert(Object.isFrozen(x));
});

test('P3-H02 externally generated ECDSA signature of precise message passes independent verifier',async()=>{
 const f=fixture();
 const review=await f.reader.prepare(args);
 const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 const key=await crypto.subtle.importKey('jwk',privateKey.export({format:'jwk'}),
  {name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const signature=Buffer.from(await crypto.subtle.sign(
  {name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(review.signingMessage)))
  .toString('base64url');
 const verifier=createP3OperatorApprovalVerifier({
  verifyProvenance:async jwt=>{assert.equal(jwt,OIDC);return RUN;},
  operatorPublicJwk:publicKey.export({format:'jwk'}),now:()=>CLOCK,
 });
 const verified=await verifier.verify({
  oidcJwt:OIDC,approval:JSON.parse(review.canonicalApproval),signature,
  body:BODY,idempotencyKey:KEY,
 });
 assert.equal(verified.verified,true);
 assert.equal(verified.approvalId,approvalId);
 assert.equal(verified.bodySha256,review.bodySha256);
 assert.equal(verified.workflowSha,RUN.workflowSha);
 await assert.rejects(verifier.verify({
  oidcJwt:OIDC,approval:JSON.parse(review.canonicalApproval),signature,
  body:BODY+' ',idempotencyKey:KEY,
 }),e=>e.code==='APPROVAL_BODY_MISMATCH');
});

test('P3-H03 malformed/noncanonical/duplicate or changed command body rejected before provenance',async()=>{
 const bad=[
  BODY+' ',
  BODY.replace('"action":"accept"','"action":"accept","action":"accept"'),
  '{"action":"publish","idempotencyKey":"'+KEY+'","snapshot":'+JSON.stringify(sample)+'}',
  JSON.stringify({action:'accept',idempotencyKey:'bad',snapshot:sample}),
  JSON.stringify({action:'accept',idempotencyKey:KEY,snapshot:{...sample,media:[{url:'secret'}]}}),
  JSON.stringify({action:'accept',idempotencyKey:KEY,snapshot:{package:{...sample.package,domain:'other'},media:[]}}),
  JSON.stringify({action:'accept',idempotencyKey:KEY,snapshot:{package:{...sample.package,operation:'delete'},media:[]}}),
  JSON.stringify({action:'accept',idempotencyKey:KEY,snapshot:{package:{...sample.package,id:''},media:[]}}),
  JSON.stringify({action:'accept',idempotencyKey:KEY,snapshot:{package:sample.package,media:[],extra:true}}),
  JSON.stringify({action:'accept',idempotencyKey:KEY,snapshot:{package:{...sample.package,__secret:'no'},media:[]}}).replace(',"__secret":"no"',',"__proto__":"bad"'),
  '{"action":"accept","idempotencyKey":"'+KEY+'","snapshot":'+JSON.stringify(sample)+',"extra":true}',
  '{}','',
 ];
 const f=fixture();
 for(const body of bad)
  await assert.rejects(f.reader.prepare({...args,body}),P3OwnerReviewError);
 assert.equal(f.calls,0);
});

test('P3-H04 unsigned review never trusts wrong signed owner/repo/run status',async()=>{
 for(const run of [
  {...RUN,verified:false},{...RUN,repositoryId:33},
  {...RUN,ownerGitHubId:123},{...RUN,runId:0},
  {...RUN,runAttempt:101},{...RUN,workflowSha:'b'},
  {},null,
 ]){
  const f=fixture({verifyProvenance:async()=>run});
  await assert.rejects(f.reader.prepare(args),denial('RUN_PROVENANCE_DENIED'));
  assert.equal(f.calls,1);
 }
});

test('P3-H05 untrusted verifier exception is redacted and produces no review output',async()=>{
 const f=fixture({verifyProvenance:async()=>{throw Error('SENSITIVE-JWT-OR-KEY');}});
 await assert.rejects(f.reader.prepare(args),denial('RUN_PROVENANCE_DENIED'));
 assert.equal(f.calls,1);
});

test('P3-H06 missing, malformed or non-v4 approval ID refuses before contacting provenance',async()=>{
 const f=fixture();
 for(const id of ['', '123','6b5234c8-3212-3123-8123-bcdef1234567',
  '6b5234c8-3212-4123-1123-bcdef1234567'])
  await assert.rejects(f.reader.prepare({...args,approvalId:id}),
   denial('INVALID_REVIEW_INPUT'));
 await assert.rejects(f.reader.prepare({...args,oidcJwt:'not-a-token'}),
  denial('INVALID_REVIEW_INPUT'));
 assert.equal(f.calls,0);
});

test('P3-H07 issue/expiry bounds and wall clock deny; no signing occurs',async()=>{
 const f=fixture();
 for(const input of [
  {issuedAt:CLOCK-301},{issuedAt:CLOCK+31},{expiresAt:CLOCK-1},
  {expiresAt:CLOCK+301},{issuedAt:CLOCK-10,expiresAt:CLOCK+301},
  {issuedAt:CLOCK+20,expiresAt:CLOCK+10},
 ]){
  await assert.rejects(f.reader.prepare({...args,...input}),denial('REVIEW_EXPIRED'));
 }
 assert.equal(f.calls,6); // identity was independently verified each time
});

test('P3-H08 binding is exact: any command or run change changes signing request or denies',async()=>{
 const review=await fixture().reader.prepare(args);
 const otherBody=JSON.stringify({action:'accept',idempotencyKey:KEY,
  snapshot:{...sample,package:{...sample.package,id:'other-gear'}}});
 const other=await fixture().reader.prepare({...args,body:otherBody});
 assert.notEqual(other.signingMessageSha256,review.signingMessageSha256);
 const anotherRun=await fixture({verifyProvenance:async()=>({...RUN,runAttempt:2})})
  .reader.prepare(args);
 assert.notEqual(anotherRun.signingMessageSha256,review.signingMessageSha256);
 assert.notEqual(anotherRun.signingMessage,review.signingMessage);
});

test('P3-H09 no signing key, network default, owner-signature creation, or transport API in source',()=>{
 const src=readFileSync(new URL('../src/p3-owner-review-preparation.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(src,/crypto\.subtle\.sign\s*\(|\/access_tokens|\/merges|wrangler deploy/);
 assert.doesNotMatch(src,/fetch\s*\(|git push|\.batch\s*\(|\.prepare\s*\(/);
 assert.match(src,/requiresExternalOwnerSignature:true/);
 assert.match(src,/exactCommandForPrivateOwnerReview:body/);
});

test('P3-H10 explicit approval signing message matches existing canonical P3-34 protocol',async()=>{
 const review=await fixture().reader.prepare(args);
 const parsed=JSON.parse(review.canonicalApproval);
 assert.equal(review.canonicalApproval,canonicalP3Approval(parsed));
 assert.equal(parsed.repositoryId,REPO);
 assert.equal(parsed.operatorGithubId,OWNER);
 assert.equal(parsed.idempotencyKey,KEY);
 assert.equal(parsed.bodySha256,hash(BODY));
});

test('P3-H11 unsigned review + external ECDSA + HMAC survives canonical v1 envelope into verify-only P3-34',async()=>{
 const mockOidc=[
  'a'.repeat(180),'b'.repeat(180),'c'.repeat(180),
 ].join('.');
 const review=await createP3OwnerReviewPreparation({
  now:()=>CLOCK,
  verifyProvenance:async jwt=>{assert.equal(jwt,mockOidc);return RUN;},
 }).prepare({...args,oidcJwt:mockOidc});
 const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 const externalSigner=await crypto.subtle.importKey('jwk',privateKey.export({format:'jwk'}),
  {name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const ownerSignature=Buffer.from(await crypto.subtle.sign(
  {name:'ECDSA',hash:'SHA-256'},externalSigner,
  new TextEncoder().encode(review.signingMessage))).toString('base64url');
 const secret='P3-40-source-only-fixture-secret-01234567890123456789';
 const nonce='P340nonce-012345678901234567890';
 const timestampMs=CLOCK*1000;
 const signedHmac=await signP3InternalCommand({
  secret,nonce,timestamp:timestampMs,body:BODY,
 });
 const wire=encodeP3ProofEnvelope({
  body:BODY,oidcJwt:mockOidc,approval:JSON.parse(review.canonicalApproval),
  operatorSignature:ownerSignature,
  hmacSignature:signedHmac['X-P3-Signature'],
  nonceValue:nonce,timestampMs,
 });
 const proof=decodeP3ProofEnvelope(wire);
 assert.equal(proof.body,BODY);
 assert.equal(proof.authorization.operatorSignature,ownerSignature);
 assert.equal(proof.authorization.oidcJwt,mockOidc);
 const verifier=createP3AtomicSignatureVerifier({
  verifyProvenance:async jwt=>{assert.equal(jwt,mockOidc);return RUN;},
  operatorPublicJwk:publicKey.export({format:'jwk'}),secret,
  nowMs:()=>timestampMs,
 });
 const verified=await verifier.verifyAuthorization(proof);
 assert.equal(verified.verified,true);
 assert.equal(verified.action,'accept');
 assert.equal(verified.bodySha256,hash(BODY));
 assert.equal(verified.approvalId,approvalId);
 assert.equal(verified.workflowSha,RUN.workflowSha);
 // No D1 connection and no GitHub/Cloudflare/installation credentials exist.
});
