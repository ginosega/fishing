import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,createSign,generateKeyPairSync} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {sandbox,sample} from './d1-fixture.mjs';
import {createP3RunnerProvenance} from '../src/p3-runner-provenance.mjs';
import {canonicalP3Approval,createP3OperatorApprovalVerifier} from '../src/p3-operator-approval.mjs';
import {createP3AtomicSignatureVerifier} from '../src/p3-atomic-signature-verifier.mjs';
import {createP3AtomicAcceptanceProof} from '../src/p3-atomic-acceptance-proof.mjs';
import {signP3InternalCommand,verifyP3InternalCommandSignature}
 from '../src/p3-internal-command-gate.mjs';

const CLOCK=1800000000,MS=CLOCK*1000,REPO_ID=1430581407,OWNER_ID=265665562;
const WORKFLOW_SHA='a'.repeat(40);
const REF='ginosega/fishing-p3-sandbox/.github/workflows/p3-trusted-command.yml@refs/heads/main';
const AUD='fishing-p3:trusted-runner:owner-accept';
const SECRET='source-only-hmac-test-key-never-provisioned-0123456789';
const ID='6b5234c8-3212-4123-8123-bcdef1234567';
const NONCE='source-test-nonce-0123456789abcdefghijk';
const KEY='p3-test-idempotency-12345678';
const BODY=JSON.stringify({action:'accept',idempotencyKey:KEY,snapshot:sample});
const digest=x=>createHash('sha256').update(x).digest('hex');
const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const {privateKey:oidcPrivate,publicKey:oidcPublic}=generateKeyPairSync('rsa',{modulusLength:2048});
const {privateKey:appPrivate}=generateKeyPairSync('rsa',{modulusLength:2048});
const {privateKey:ownerPrivate,publicKey:ownerPublic}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const appPem=appPrivate.export({type:'pkcs8',format:'pem'}).toString();
const ownerJwk=ownerPublic.export({format:'jwk'});
const OIDC_KEY={...oidcPublic.export({format:'jwk'}),kid:'P3-REAL-LOCAL-OIDC',alg:'RS256',use:'sig'};
const CLAIMS={
 iss:'https://token.actions.githubusercontent.com',aud:AUD,
 sub:'repo:ginosega@'+OWNER_ID+'/fishing-p3-sandbox@'+REPO_ID+':ref:refs/heads/main',
 repository:'ginosega/fishing-p3-sandbox',repository_id:String(REPO_ID),
 repository_owner:'ginosega',repository_owner_id:String(OWNER_ID),
 repository_visibility:'private',actor_id:String(OWNER_ID),ref_type:'branch',
 workflow_ref:REF,workflow_sha:WORKFLOW_SHA,ref:'refs/heads/main',
 event_name:'workflow_dispatch',runner_environment:'github-hosted',
 run_id:'441155',run_attempt:'1',iat:CLOCK-20,exp:CLOCK+100,
};
const APPCAPS={contents:'read',pull_requests:'read',checks:'read',metadata:'read'};
const install={id:99,app_id:42,account:{login:'ginosega',id:OWNER_ID},
 repository_selection:'selected',suspended_at:null,permissions:APPCAPS};
const installed={id:99,app_id:42,account:{login:'ginosega',id:OWNER_ID},
 repository_selection:'selected',suspended_at:null};
const envelope={action:'accept',approvalId:ID,bodySha256:digest(BODY),
 expiresAt:CLOCK+120,idempotencyKey:KEY,issuedAt:CLOCK-10,
 operatorGithubId:OWNER_ID,repositoryId:REPO_ID,runAttempt:1,runId:441155,
 workflowSha:WORKFLOW_SHA};

function oidc(overrides={}){
 const header=encode({alg:'RS256',typ:'JWT',kid:OIDC_KEY.kid});
 const payload=encode({...CLAIMS,...overrides});
 const message=header+'.'+payload;
 return message+'.'+createSign('RSA-SHA256').update(message).end().sign(oidcPrivate)
  .toString('base64url');
}
async function ownerSign(approval=envelope){
 const signer=await crypto.subtle.importKey('jwk',
  ownerPrivate.export({format:'jwk'}),{name:'ECDSA',namedCurve:'P-256'},
  false,['sign']);
 const bytes=new TextEncoder().encode('p3-operator-approval-v1\n'+canonicalP3Approval(approval));
 return Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},
  signer,bytes)).toString('base64url');
}
async function signed({body=BODY,nonce=NONCE,claims={},approval=envelope,
 timestamp=MS}={}){
 const hmac=await signP3InternalCommand({secret:SECRET,nonce,timestamp,body});
 return {
  body,nonceValue:nonce,timestampMs:timestamp,
  authorization:{oidcJwt:oidc(claims),approval,
   operatorSignature:await ownerSign(approval),hmacSignature:hmac['X-P3-Signature']},
 };
}
function fixture(){
 const f=sandbox();
 f.sql.exec(readFileSync(new URL('../migrations/0004_command_nonce_ledger.sql',import.meta.url),'utf8'));
 f.sql.exec(readFileSync(new URL('../design/p3_atomic_approval_acceptance.schema.sql',import.meta.url),'utf8'));
 let jwks=0,appGets=0,batches=0;
 const provenance=createP3RunnerProvenance({
  env:{P3_GITHUB_APP_ID:'42',P3_GITHUB_INSTALLATION_ID:'99',P3_GITHUB_PRIVATE_KEY:appPem},
  now:()=>CLOCK,expectedAudience:AUD,expectedWorkflowRef:REF,
  expectedWorkflowSha:WORKFLOW_SHA,expectedAppPermissions:APPCAPS,
  requestOidcKeys:async url=>{
   jwks++;assert.equal(url,'https://token.actions.githubusercontent.com/.well-known/jwks');
   return new Response(JSON.stringify({keys:[OIDC_KEY]}));
  },
  requestGitHub:async(url,opts)=>{
   appGets++;assert.equal(opts.method,'GET');assert.equal(opts.redirect,'manual');
   assert.match(opts.headers.Authorization,/^Bearer /);
   assert.ok([ 'https://api.github.com/app/installations/99',
    'https://api.github.com/repos/ginosega/fishing-p3-sandbox/installation'].includes(url));
   return new Response(JSON.stringify(url.endsWith('/installation')?installed:install));
  },
 });
 const verifier=createP3AtomicSignatureVerifier({
  verifyProvenance:provenance.verify,operatorPublicJwk:ownerJwk,
  secret:SECRET,nowMs:()=>MS,
 });
 const env={P3_WRITE_ENABLED:'false',P3_ATOMIC_ACCEPTANCE_ENABLED:'false',
  P3_ATOMIC_STATUS_ENABLED:'false'};
 let allow=false,sequence=0;
 const DB={...f.DB,batch:async queries=>{batches++;return f.DB.batch(queries);}};
 const atomic=createP3AtomicAcceptanceProof({
  DB,env,operatorApproved:()=>allow,nowMs:()=>MS,
  makeOperationId:()=> 'p3_'+String(++sequence).padStart(8,'0')+
   '-1111-4111-8111-123456789abc',
  verifyAuthorization:verifier.verifyAuthorization,
 });
 const counts=()=>Object.fromEntries(
  ['p3_operations','p3_requests','p3_events','p3_atomic_approvals','p3_command_nonces']
   .map(x=>[x,f.sql.prepare('SELECT COUNT(*) n FROM '+x).get().n]));
 return {f,atomic,verifier,env,
  enable(){allow=true;env.P3_WRITE_ENABLED='true';env.P3_ATOMIC_ACCEPTANCE_ENABLED='true';
   env.P3_ATOMIC_STATUS_ENABLED='true';},
  counts,get jwks(){return jwks},get appGets(){return appGets},get batches(){return batches}};
}
const empty={p3_operations:0,p3_requests:0,p3_events:0,
 p3_atomic_approvals:0,p3_command_nonces:0};
const full={p3_operations:1,p3_requests:1,p3_events:1,
 p3_atomic_approvals:1,p3_command_nonces:1};

test('P3-C01 actual RSA OIDC + App-JWT GET + ECDSA + HMAC verifies, WITHOUT writing',async()=>{
 const f=fixture(),request=await signed();
 const result=await f.verifier.verifyAuthorization(request);
 assert.equal(result.verified,true);assert.equal(result.approvalId,ID);
 assert.equal(result.approvalSha256,digest('p3-operator-approval-v1\n'+canonicalP3Approval(envelope)));
 assert.equal(f.jwks,1);assert.equal(f.appGets,2);
 assert.equal(f.batches,0);assert.deepEqual(f.counts(),empty);
 f.f.sql.close();
});
test('P3-C02 four real local cryptographic verifications precede ONE atomic D1 batch',async()=>{
 const f=fixture();f.enable();
 const record=await f.atomic.accept(await signed());
 assert.equal(record.state,'Accepted');assert.deepEqual(f.counts(),full);
 assert.equal(f.batches,1);
 assert.equal(f.f.sql.prepare('SELECT event_type FROM p3_events').get().event_type,'accepted');
 assert.deepEqual(await f.atomic.readStatus({
  approvalId:ID,
  approvalSha256:digest('p3-operator-approval-v1\n'+canonicalP3Approval(envelope)),
 }),{state:'Found',operationId:record.operationId,operationState:'Accepted'});
 f.f.sql.close();
});
test('P3-C03 forged or altered HMAC/body/nonce/timestamp never touches D1',async()=>{
 for(const change of [
  x=>({...x,body:x.body+' '}),
  x=>({...x,nonceValue:'tampered-nonce-01234567890abc'}),
  x=>({...x,timestampMs:x.timestampMs+1000}),
  x=>({...x,authorization:{...x.authorization,hmacSignature:'Z'.repeat(43)}}),
 ]){
  const f=fixture();f.enable();
  await assert.rejects(f.atomic.accept(change(await signed())),
   e=>e.code==='AUTHORIZATION_DENIED');
  assert.deepEqual(f.counts(),empty);assert.equal(f.batches,0);
  f.f.sql.close();
 }
});
test('P3-C04 forged ECDSA, unsigned extra field, wrong approval scope denied before writes',async()=>{
 for(const change of [
  x=>({...x,authorization:{...x.authorization,operatorSignature:'Z'.repeat(86)}}),
  x=>({...x,authorization:{...x.authorization,approval:{...envelope,runId:999}}}),
  x=>({...x,authorization:{...x.authorization,extra:true}}),
  x=>({...x,authorization:{...x.authorization,approval:{...envelope,action:'publish'}}}),
 ]){
  const f=fixture();f.enable();
  await assert.rejects(f.atomic.accept(change(await signed())),
   e=>e.code==='AUTHORIZATION_DENIED');
  assert.equal(f.batches,0);assert.deepEqual(f.counts(),empty);f.f.sql.close();
 }
});
test('P3-C05 signed wrong repo/owner actor/workflow SHA/OIDC claims rejected',async()=>{
 for(const claims of [
  {repository_id:'2'},{actor_id:'1'},{workflow_sha:'b'.repeat(40)},
  {event_name:'pull_request'},
 ]){
  const f=fixture();f.enable();
  await assert.rejects(f.atomic.accept(await signed({claims})),
   e=>e.code==='AUTHORIZATION_DENIED');
  assert.deepEqual(f.counts(),empty);assert.equal(f.batches,0);
  assert.equal(f.appGets,0);
  f.f.sql.close();
 }
});
test('P3-C06 signed replay reaches D1 but cannot duplicate operation, approval or nonce',async()=>{
 const f=fixture();f.enable();
 const x=await signed();await f.atomic.accept(x);
 await assert.rejects(f.atomic.accept(x),e=>e.code==='ATOMIC_OUTCOME_UNKNOWN');
 assert.deepEqual(f.counts(),full);assert.equal(f.batches,2);
 f.f.sql.close();
});
test('P3-C07 disabled atomic receiver refuses BEFORE expensive signature or DB checks',async()=>{
 const f=fixture();
 await assert.rejects(f.atomic.accept(await signed()),e=>e.code==='ATOMIC_DISABLED');
 assert.equal(f.jwks,0);assert.equal(f.appGets,0);assert.equal(f.batches,0);
 assert.deepEqual(f.counts(),empty);f.f.sql.close();
});
test('P3-C08 verifier-only HMAC and ECDSA exports never consume a ledger',async()=>{
 const f=fixture();
 const x=await signed();
 const hmac=await verifyP3InternalCommandSignature({secret:SECRET,nonce:NONCE,
  timestamp:MS,signature:x.authorization.hmacSignature,body:BODY,now:()=>MS});
 const owner=createP3OperatorApprovalVerifier({
  verifyProvenance:async()=>({verified:true,repositoryId:REPO_ID,ownerGitHubId:OWNER_ID,
   runId:441155,runAttempt:1,workflowSha:WORKFLOW_SHA}),
  operatorPublicJwk:ownerJwk,now:()=>CLOCK,
 });
 const allowed=await owner.verify({oidcJwt:x.authorization.oidcJwt,
  approval:envelope,signature:x.authorization.operatorSignature,
  body:BODY,idempotencyKey:KEY});
 assert.equal(hmac.verified,true);assert.equal(allowed.verified,true);
 assert.deepEqual(f.counts(),empty);assert.equal(f.batches,0);
 f.f.sql.close();
});
