import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {sample} from './d1-fixture.mjs';
import {createP3OwnerReviewPreparation} from '../src/p3-owner-review-preparation.mjs';
import {
 createP3IndependentOwnerReview,P3IndependentReviewError,
 P3_INDEPENDENT_ATTESTATION_DOMAIN,P3_INDEPENDENT_ATTESTATION_PURPOSE,
} from '../src/p3-independent-owner-review.mjs';
import {canonicalP3Approval} from '../src/p3-operator-approval.mjs';

const now=1800000000,repo=1430581407,owner=265665562;
const run={verified:true,repositoryId:repo,ownerGitHubId:owner,
 runId:441155,runAttempt:1,workflowSha:'a'.repeat(40)};
const jwt='fictional-source-only-runner-proof-not-a-real-JWT.'.repeat(4);
const id='6b5234c8-3212-4123-8123-bcdef1234567';
const key='independent-owner-gate-123456789';
const body=JSON.stringify({action:'accept',idempotencyKey:key,snapshot:sample});
const digest=text=>createHash('sha256').update(text).digest('hex');
const {privateKey:attestorKey,publicKey:attestorPublic}
 =generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const attestorJwk=attestorPublic.export({format:'jwk'});
const otherKey=generateKeyPairSync('ec',{namedCurve:'prime256v1'}).privateKey;
const signedFields=[
 'v','purpose','repositoryId','operatorGithubId','runId','runAttempt',
 'workflowSha','approvalId','idempotencyKey','bodySha256',
 'issuedAt','expiresAt',
];
const message=attestation=>P3_INDEPENDENT_ATTESTATION_DOMAIN+
 JSON.stringify(Object.fromEntries(signedFields.map(k=>[k,attestation[k]])));
async function sign(attestation,privateKey=attestorKey){
 const signer=await crypto.subtle.importKey('jwk',
  privateKey.export({format:'jwk'}),
  {name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 return Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},
  signer,new TextEncoder().encode(message(attestation)))).toString('base64url');
}
async function fixture({trustedRun=run,sourceBody=body,clock=now}={}){
 const prepare=createP3OwnerReviewPreparation({
  verifyProvenance:async value=>{assert.equal(value,jwt);return trustedRun;},
  now:()=>clock,
 });
 const proposed=await prepare.prepare({
  body,oidcJwt:jwt,approvalId:id,issuedAt:now-10,expiresAt:now+120,
 });
 const approval=JSON.parse(proposed.canonicalApproval);
 const attestation={
  v:1,purpose:P3_INDEPENDENT_ATTESTATION_PURPOSE,
  repositoryId:repo,operatorGithubId:owner,runId:approval.runId,
  runAttempt:approval.runAttempt,workflowSha:approval.workflowSha,
  approvalId:approval.approvalId,idempotencyKey:approval.idempotencyKey,
  bodySha256:digest(sourceBody),issuedAt:approval.issuedAt,
  expiresAt:approval.expiresAt,
 };
 return {
  proposed,independentBody:sourceBody,attestation,
  signature:await sign(attestation),
 };
}
const gate=()=>createP3IndependentOwnerReview({
 attestorPublicJwk:attestorJwk,now:()=>now,
});
const denied=code=>e=>e instanceof P3IndependentReviewError&&
 e.code===code&&e.message==='P3 independent owner review denied';

test('P3-I01 independent attestor signature and exact full command bind one unsigned review',async()=>{
 const x=await fixture(),v=gate();
 const result=await v.inspect(x);
 assert.equal(result.independentAttestationVerified,true);
 assert.equal(result.unsigned,true);
 assert.equal(result.ownerSignaturePresent,false);
 assert.equal(result.mayExecute,false);
 assert.equal(result.requiresFullHumanReview,true);
 assert.equal(result.exactCommandForPrivateDisplay,body);
 assert.equal(result.bodySha256,digest(body));
 assert.equal(result.signingMessageForLaterExternalReview,x.proposed.signingMessage);
 assert.equal(result.signingMessageSha256,digest(x.proposed.signingMessage));
 assert.equal(result.approvalId,id);
 assert.equal(result.idempotencyKey,key);
 assert.equal(result.workflowSha,run.workflowSha);
 assert(!JSON.stringify(result).includes(jwt));
 assert(Object.isFrozen(result));
 assert.deepEqual(Object.keys(v),['inspect']);
});
test('P3-I02 an attestor key not controlled by runner is necessary; forged or changed signature denies',async()=>{
 const x=await fixture();
 await assert.rejects(gate().inspect({...x,signature:await sign(x.attestation,otherKey)}),
  denied('INVALID_ATTESTOR_SIGNATURE'));
 await assert.rejects(gate().inspect({...x,signature:'bad'}),
  denied('INVALID_ATTESTOR_SIGNATURE'));
 await assert.rejects(gate().inspect({...x,attestation:{...x.attestation,repositoryId:repo+1}}),
  denied('INVALID_INDEPENDENT_ATTESTATION'));
});
test('P3-I03 matching digest alone does not suffice: independent full bytes must match',async()=>{
 const x=await fixture();
 const changed=JSON.stringify({action:'accept',idempotencyKey:key,
  snapshot:{...sample,package:{...sample.package,id:'substituted'}}});
 const attestation={...x.attestation,bodySha256:digest(changed)};
 const payload={...x,independentBody:changed,attestation,signature:await sign(attestation)};
 await assert.rejects(gate().inspect(payload),denied('INDEPENDENT_CONTENT_MISMATCH'));
 const alternate=' '+body;
 const v=await fixture({sourceBody:alternate});
 await assert.rejects(gate().inspect(v),denied('INDEPENDENT_CONTENT_MISMATCH'));
});
test('P3-I04 independently signed wrong run, workflow, idempotency, or approval ID cannot substitute',async()=>{
 const x=await fixture();
 for(const [name,value] of [
  ['runId',556699],['runAttempt',2],
  ['workflowSha','b'.repeat(40)],
  ['idempotencyKey','another-review-idempotency-12345'],
  ['approvalId','f6a74ed0-48b7-4ef7-8191-123456789abc'],
 ]){
  const at={...x.attestation,[name]:value};
  await assert.rejects(gate().inspect({...x,attestation:at,signature:await sign(at)}),
   denied('INDEPENDENT_RUN_MISMATCH'));
 }
});
test('P3-I05 tampered original proposal, digest, action, signing message and forced signed flag deny',async()=>{
 const x=await fixture();
 const cases=[
  {...x.proposed,unsigned:false},
  {...x.proposed,requiresExternalOwnerSignature:false},
  {...x.proposed,bodySha256:'0'.repeat(64)},
  {...x.proposed,signingMessageSha256:'0'.repeat(64)},
  {...x.proposed,signingMessage:x.proposed.signingMessage+' '},
  {...x.proposed,packageId:'substituted'},
  {...x.proposed,exactCommandForPrivateOwnerReview:body+' '},
  {...x.proposed,workflowSha:'b'.repeat(40)},
 ];
 for(const proposed of cases){
  await assert.rejects(gate().inspect({...x,proposed}),P3IndependentReviewError);
 }
});
test('P3-I06 attestation must be fresh, canonical and domain separated',async()=>{
 const x=await fixture();
 const old={...x.attestation,issuedAt:now-500,expiresAt:now-200};
 await assert.rejects(gate().inspect({...x,attestation:old,signature:await sign(old)}),
  denied('INDEPENDENT_EVIDENCE_EXPIRED'));
 const unknown={...x.attestation,purpose:'p3-unrelated-signing-v1'};
 await assert.rejects(gate().inspect({...x,attestation:unknown,signature:await sign(unknown)}),
  denied('INVALID_INDEPENDENT_ATTESTATION'));
 const extra={...x.attestation,approvalOutsideRun:true};
 await assert.rejects(gate().inspect({...x,attestation:extra,signature:await sign(extra)}),
  denied('INVALID_INDEPENDENT_ATTESTATION'));
});
test('P3-I07 invalid key config and PRIVATE attestor signing material are refused',()=>{
 for(const jwk of [null,{},attestorKey.export({format:'jwk'}),
  {...attestorJwk,crv:'P-384'}, {...attestorJwk,alg:'HS256'}]){
  assert.throws(()=>createP3IndependentOwnerReview({
   attestorPublicJwk:jwk,now:()=>now,
  }),denied('INVALID_INDEPENDENT_CONFIG'));
 }
});
test('P3-I08 proposed signing message remains identical to original P3-40 approval protocol',async()=>{
 const x=await fixture(),review=await gate().inspect(x);
 const parsed=JSON.parse(x.proposed.canonicalApproval);
 assert.equal(x.proposed.canonicalApproval,canonicalP3Approval(parsed));
 assert.equal(review.signingMessageForLaterExternalReview,
  'p3-operator-approval-v1\n'+canonicalP3Approval(parsed));
 assert.equal(parsed.action,'accept');
 assert.equal(parsed.repositoryId,repo);
 assert.equal(parsed.operatorGithubId,owner);
 assert.equal(parsed.runId,run.runId);
 assert.equal(parsed.bodySha256,digest(body));
});
test('P3-I09 no owner signer, key issuance, implicit authority, network default, D1 or deployment source',()=>{
 const src=readFileSync(new URL('../src/p3-independent-owner-review.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(src,/crypto\.subtle\.sign\s*\(|\/access_tokens|\/merges|wrangler deploy/);
 assert.doesNotMatch(src,/fetch\s*\(|git push|\.batch\s*\(|\.prepare\s*\(/);
 assert.match(src,/requiresFullHumanReview:true/);
 assert.match(src,/ownerSignaturePresent:false,mayExecute:false/);
 assert.match(src,/independentAttestationVerified:true/);
});

async function signedMalformedReviewBody(forgedBody){
 const input=await fixture();
 const value=JSON.parse(forgedBody),approval=JSON.parse(input.proposed.canonicalApproval);
 approval.bodySha256=digest(forgedBody);
 const canonicalApproval=canonicalP3Approval(approval);
 const signingMessage='p3-operator-approval-v1\n'+canonicalApproval;
 const proposed={...input.proposed,
  exactCommandForPrivateOwnerReview:forgedBody,
  bodySha256:digest(forgedBody),
  canonicalApproval,signingMessage,
  signingMessageSha256:digest(signingMessage),
  packageDomain:value.snapshot.package.domain,
  packageOperation:value.snapshot.package.operation,
  packageId:value.snapshot.package.id,
 };
 const attestation={...input.attestation,bodySha256:digest(forgedBody)};
 return {proposed,independentBody:forgedBody,attestation,
  signature:await sign(attestation)};
}
test('P3-I10 independently signed prohibited domain/operation cannot bypass owner review schema',async()=>{
 for(const patch of [
  {domain:'production-secret'},
  {operation:'delete'},
  {id:''},
 ]){
  const proposedBody=JSON.stringify({action:'accept',idempotencyKey:key,
   snapshot:{package:{...sample.package,...patch},media:[]}});
  const pkt=await signedMalformedReviewBody(proposedBody);
  await assert.rejects(gate().inspect(pkt),denied('INVALID_UNSIGNED_PROPOSAL'));
 }
});
test('P3-I11 independently signed nested constructor, prototype or __proto__ key is refused',async()=>{
 for(const evil of ['constructor','prototype','__proto__']){
  const nested=JSON.parse(JSON.stringify(sample));
  nested.package[evil]='untrusted';
  // JS __proto__ assignment alters a prototype rather than adding an own
  // property; create an actual JSON key to test the wire-level attack.
  const payload=JSON.stringify({action:'accept',idempotencyKey:key,
   snapshot:nested});
  const bodyWithKey=evil==='__proto__'
   ?payload.replace('"id":"sample"','"id":"sample","__proto__":"untrusted"')
   :payload;
  const pkt=await signedMalformedReviewBody(bodyWithKey);
  await assert.rejects(gate().inspect(pkt),denied('INVALID_UNSIGNED_PROPOSAL'));
 }
});
