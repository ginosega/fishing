import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {sandbox,sample} from './d1-fixture.mjs';
import {canonicalP3Approval} from '../src/p3-operator-approval.mjs';
import {signP3InternalCommand} from '../src/p3-internal-command-gate.mjs';
import {createP3AtomicSignatureVerifier} from '../src/p3-atomic-signature-verifier.mjs';
import {createP3AtomicAcceptanceProof} from '../src/p3-atomic-acceptance-proof.mjs';
import {encodeP3ProofEnvelope,decodeP3ProofEnvelope,readP3ProofRequest,
 P3ProofEnvelopeError,P3_PROOF_MAX_OUTER_BYTES} from '../src/p3-proof-envelope.mjs';
import {createP3ProofSender,createP3ProofIngress,createP3ProofPrivateReceiver}
 from '../src/p3-proof-transport.mjs';

const WHEN=1800000000000,CLOCK=WHEN/1000,REPO=1430581407,OWNER=265665562;
const NONCE='proof-nonce-01234567890123456789';
const SECRET='p3-36-fixture-hmac-secret-outside-runtime-0123456789';
const OIDC=['a'.repeat(240),'b'.repeat(240),'c'.repeat(240)].join('.');
const ACCESS='locally-faked-Access-assertion-value-'.repeat(3);
const CLIENT='aabbccddeeff00112233445566778899.access';
const ORIGIN='https://private-access.example.test';
const PRIVATE='https://fishing-p3-sandbox-preview.ginosega.workers.dev/_p3/internal/command';
const ID='6b5234c8-3212-4123-8123-bcdef1234567';
const KEY='transport-source-key-0123456789';
const BODY=JSON.stringify({action:'accept',idempotencyKey:KEY,snapshot:sample});
const sha=s=>createHash('sha256').update(s).digest('hex');
const {privateKey:ownerPrivate,publicKey:ownerPublic}=
 generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const publicJwk=ownerPublic.export({format:'jwk'});
const approval={
 action:'accept',approvalId:ID,bodySha256:sha(BODY),expiresAt:CLOCK+120,
 idempotencyKey:KEY,issuedAt:CLOCK-10,operatorGithubId:OWNER,
 repositoryId:REPO,runAttempt:1,runId:441155,workflowSha:'a'.repeat(40),
};
async function fields(overrides={}){
 const signed=await crypto.subtle.importKey('jwk',ownerPrivate.export({format:'jwk'}),
  {name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const signature=Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},
  signed,new TextEncoder().encode(
   'p3-operator-approval-v1\n'+canonicalP3Approval(approval)))).toString('base64url');
 const hmac=await signP3InternalCommand({secret:SECRET,nonce:NONCE,
  timestamp:WHEN,body:BODY});
 return {body:BODY,oidcJwt:OIDC,approval,operatorSignature:signature,
  hmacSignature:hmac['X-P3-Signature'],nonceValue:NONCE,timestampMs:WHEN,
  ...overrides};
}
function setup(){
 const db=sandbox();
 db.sql.exec(readFileSync(new URL('../migrations/0004_command_nonce_ledger.sql',import.meta.url),'utf8'));
 db.sql.exec(readFileSync(new URL('../design/p3_atomic_approval_acceptance.schema.sql',import.meta.url),'utf8'));
 const enabled={yes:false};
 let accessCalls=0,oidcCalls=0,privateCalls=0,dbCalls=0;
 let forwarded;
 const verify=createP3AtomicSignatureVerifier({
  verifyProvenance:async jwt=>{
   oidcCalls++;
   if(jwt!==OIDC)throw Error('untrusted oidc assertion');
   // P3-34 separately proved actual RSA/JWKS/App cryptography in CI;
   // this focused P3-36 fixture verifies its exact byte transport only.
   return {verified:true,repositoryId:REPO,ownerGitHubId:OWNER,
    runId:441155,runAttempt:1,workflowSha:'a'.repeat(40)};
  },
  operatorPublicJwk:publicJwk,secret:SECRET,nowMs:()=>WHEN,
 });
 const atomicEnv={P3_WRITE_ENABLED:'false',
  P3_ATOMIC_ACCEPTANCE_ENABLED:'false',P3_ATOMIC_STATUS_ENABLED:'false'};
 let seq=0;
 const atomic=createP3AtomicAcceptanceProof({
  DB:{...db.DB,batch:async qs=>{dbCalls++;return db.DB.batch(qs);}},
  env:atomicEnv,operatorApproved:()=>enabled.yes,
  verifyAuthorization:verify.verifyAuthorization,nowMs:()=>WHEN,
  makeOperationId:()=> 'p3_'+String(++seq).padStart(8,'0')+
    '-1111-4111-8111-123456789abc',
 });
 const receiverEnv={P3_WRITE_ENABLED:'false',
  P3_COMMAND_BRIDGE_ENABLED:'false',P3_PROOF_RECEIVER_ENABLED:'false'};
 const receiver=createP3ProofPrivateReceiver({env:receiverEnv,
  atomicService:atomic,operatorApproved:()=>enabled.yes});
 const ingressEnv={
  P3_WRITE_ENABLED:'false',P3_INGRESS_ENABLED:'false',
  P3_PROOF_TRANSPORT_ENABLED:'false',
  P3_ACCESS_INGRESS_ORIGIN:ORIGIN,P3_ACCESS_SERVICE_CLIENT_ID:CLIENT,
  P3_COMMAND_SERVICE:{fetch:async req=>{
   privateCalls++;forwarded=req.clone();return receiver.handle(req);
  }},
 };
 const ingress=createP3ProofIngress({env:ingressEnv,
  operatorApproved:()=>enabled.yes,
  verifyAccessJwt:async jwt=>{
   accessCalls++;
   if(jwt!==ACCESS)throw Error('private Access verifier details');
   return {serviceClientId:CLIENT};
  }});
 const senderEnv={P3_WRITE_ENABLED:'false',P3_PROOF_CLIENT_ENABLED:'false',
  P3_ACCESS_INGRESS_ORIGIN:ORIGIN};
 let requests=0;
 const sender=createP3ProofSender({env:senderEnv,
  operatorApproved:()=>enabled.yes,
  transport:async req=>{
   requests++;
   assert.equal(req.headers.has('CF-Access-Client-Secret'),false);
   assert.equal(req.headers.has('Cf-Access-Jwt-Assertion'),false);
   const headers=new Headers(req.headers);
   headers.set('Cf-Access-Jwt-Assertion',ACCESS);
   headers.set('CF-Access-Client-Id','must-not-cross');
   headers.set('CF-Access-Client-Secret','secret-must-not-cross');
   headers.set('Authorization','must-not-cross');
   headers.set('Cookie','must-not-cross');
   headers.set('X-Client-Extra','must-not-cross');
   const atEdge=new Request(req,{headers});
   return ingress.handle(atEdge);
  },
 });
 const counts=()=>Object.fromEntries(
  ['p3_operations','p3_requests','p3_events','p3_atomic_approvals','p3_command_nonces']
   .map(n=>[n,db.sql.prepare('SELECT COUNT(*) n FROM '+n).get().n]));
 const enable=()=>{
  enabled.yes=true;
  for(const env of [atomicEnv,receiverEnv,ingressEnv,senderEnv])
   env.P3_WRITE_ENABLED='true';
  atomicEnv.P3_ATOMIC_ACCEPTANCE_ENABLED='true';
  receiverEnv.P3_COMMAND_BRIDGE_ENABLED='true';
  receiverEnv.P3_PROOF_RECEIVER_ENABLED='true';
  ingressEnv.P3_INGRESS_ENABLED='true';
  ingressEnv.P3_PROOF_TRANSPORT_ENABLED='true';
  senderEnv.P3_PROOF_CLIENT_ENABLED='true';
 };
 async function external(wire,{url=ORIGIN+'/p3/internal/accept',method='POST',
  access=ACCESS,extra={}}={}){
  return new Request(url,{method,headers:{
   'Content-Type':'application/json','Cf-Access-Jwt-Assertion':access,
   'CF-Access-Client-Secret':'must-not-cross',
   'Authorization':'must-not-cross',...extra,
  },body:method==='POST'?wire:undefined});
 }
 return {db,receiver,ingress,sender,atomic,counts,enable,external,ingressEnv,
  get accessCalls(){return accessCalls},get oidcCalls(){return oidcCalls},
  get privateCalls(){return privateCalls},get dbCalls(){return dbCalls},
  get requests(){return requests},get forwarded(){return forwarded}};
}
const none={p3_operations:0,p3_requests:0,p3_events:0,
 p3_atomic_approvals:0,p3_command_nonces:0};
const once={p3_operations:1,p3_requests:1,p3_events:1,
 p3_atomic_approvals:1,p3_command_nonces:1};

test('P3-W01 three-hop exact canonical proof transport commits one atomic acceptance',async()=>{
 const f=setup();f.enable();
 const s=await fields();
 const result=await f.sender.send(s);
 assert.equal(result.state,'Accepted');
 assert.deepEqual(f.counts(),once);
 assert.equal(f.requests,1);assert.equal(f.accessCalls,1);
 assert.equal(f.oidcCalls,1);assert.equal(f.privateCalls,1);assert.equal(f.dbCalls,1);
 assert.equal(f.forwarded.url,PRIVATE);
 const wire=await f.forwarded.text();
 assert.equal(wire,encodeP3ProofEnvelope(s));
 assert.equal(decodeP3ProofEnvelope(wire).body,BODY);
 const rawHeaders=[...f.forwarded.headers.keys()];
 assert.deepEqual(rawHeaders.sort(),['content-type'].sort());
 for(const secret of ['must-not-cross',ACCESS,'Cf-Access-Jwt-Assertion'])
  assert(!wire.includes(secret));
 f.db.sql.close();
});
test('P3-W02 disabled sender/ingress/receiver refuse without Access, OIDC or DB',async()=>{
 const f=setup();
 await assert.rejects(f.sender.send(await fields()),e=>e.code==='CLIENT_DISABLED');
 const resp=await f.ingress.handle(await f.external(encodeP3ProofEnvelope(await fields())));
 assert.equal(resp.status,503);
 assert.equal(f.accessCalls,0);assert.equal(f.oidcCalls,0);
 assert.equal(f.privateCalls,0);assert.deepEqual(f.counts(),none);
 f.db.sql.close();
});
test('P3-W03 wire canonicalization rejects extra keys and top/deep duplicate JSON keys',async()=>{
 const s=await fields(),wire=encodeP3ProofEnvelope(s);
 for(const invalid of [
  wire.replace('"v":1','"v":1,"v":1'),
  wire.replace('"runId":441155','"runId":441155,"runId":441155'),
  wire.replace('"bodyB64":','"unknown":"unauthorized","bodyB64":'),
  wire.replace('"timestampMs":','"timestampMs":0,"timestampMs":'),
  wire+' ',
  '\n'+wire,
  wire.replace('"v":1','"v":1 '),
 ]){
  assert.throws(()=>decodeP3ProofEnvelope(invalid),P3ProofEnvelopeError);
 }
});
test('P3-W04 inner command requires exact bytes, no duplicate or whitespace ambiguity',async()=>{
 const s=await fields();
 for(const body of [
  BODY.replace('"action":"accept"','"action":"accept","action":"accept"'),
  BODY+' ',BODY.replace('{"action"','{ "action"'),
  BODY.replace('"snapshot":','"evil":true,"snapshot":'),
 ]){
  assert.throws(()=>encodeP3ProofEnvelope({...s,body}),P3ProofEnvelopeError);
 }
});
test('P3-W05 altered base64 inner command cannot bypass ECDSA or HMAC',async()=>{
 const f=setup();f.enable();const s=await fields();
 const changed=JSON.stringify({action:'accept',idempotencyKey:KEY,snapshot:{
  package:{...sample.package,id:'tampered'},media:[]}});
 const raw=encodeP3ProofEnvelope({...s,body:changed});
 const result=await f.ingress.handle(await f.external(raw));
 assert.equal(result.status,503);
 assert.equal(f.privateCalls,1);assert.equal(f.dbCalls,0);
 assert.deepEqual(f.counts(),none);f.db.sql.close();
});
test('P3-W06 Access missing/bad, wrong path/method and wrong content type never forward',async()=>{
 const f=setup();f.enable();
 const wire=encodeP3ProofEnvelope(await fields());
 for(const req of [
  f.external(wire,{access:''}),
  f.external(wire,{access:'bad-assertion'}),
  f.external(wire,{url:'https://attacker.invalid/p3/internal/accept'}),
  f.external(wire,{url:ORIGIN+'/p3/internal/accept?x=1'}),
  f.external(wire,{method:'GET'}),
  f.external(wire,{extra:{'Content-Type':'text/plain'}}),
 ]){
  const res=await f.ingress.handle(await req);
  assert.notEqual(res.status,202);
 }
 assert.equal(f.privateCalls,0);assert.equal(f.dbCalls,0);
 assert.deepEqual(f.counts(),none);f.db.sql.close();
});
test('P3-W07 hostile lengths and streaming overflow fail before private forwarding',async()=>{
 const f=setup();f.enable();
 const over='x'.repeat(P3_PROOF_MAX_OUTER_BYTES+1);
 const request=await f.external(over);
 assert.equal((await f.ingress.handle(request)).status,413);
 const wire=encodeP3ProofEnvelope(await fields());
 const forged=await f.external(wire);
 // A lying small Content-Length cannot defeat actual counted stream length.
 const veryLarge=await f.external(over,{extra:{'Content-Length':'1'}});
 assert.equal((await f.ingress.handle(veryLarge)).status,413);
 assert.equal(f.privateCalls,0);assert.deepEqual(f.counts(),none);
 await assert.rejects(readP3ProofRequest(new Request(ORIGIN+'/p3/internal/accept',{
  method:'POST',headers:{'Content-Type':'application/json'},
  body:new Uint8Array([0xff,0xfe,0xfd]),
 })),P3ProofEnvelopeError);
 assert.equal(f.privateCalls,0);
 void forged;f.db.sql.close();
});
test('P3-W08 invalid outer version, malformed Base64URL and signatures deny',async()=>{
 const s=await fields(),raw=encodeP3ProofEnvelope(s);
 for(const broken of [
  raw.replace('"v":1','"v":2'),
  raw.replace('"bodyB64":"','"bodyB64":"!'),
  raw.replace('"oidcJwt":"','"oidcJwt":"bad.'),
  raw.replace('"operatorSignature":"','"operatorSignature":"not-a-signature-'),
 ]){
  assert.throws(()=>decodeP3ProofEnvelope(broken),P3ProofEnvelopeError);
 }
});
test('P3-W09 signed replay is never retried or accepted twice',async()=>{
 const f=setup();f.enable();const s=await fields();
 const receipt=await f.sender.send(s);
 assert.equal(receipt.state,'Accepted');
 await assert.rejects(f.sender.send(s),e=>e.code==='TRANSPORT_OUTCOME_UNKNOWN');
 assert.deepEqual(f.counts(),once);assert.equal(f.dbCalls,2);
 f.db.sql.close();
});
test('P3-W10 a lost private acknowledgment returns unknown, not Live or retry',async()=>{
 const f=setup();f.enable();
 const original=f.ingressEnv.P3_COMMAND_SERVICE.fetch;
 f.ingressEnv.P3_COMMAND_SERVICE.fetch=async req=>{
  await original(req);
  throw Error('remote-secret-should-never-leak');
 };
 await assert.rejects(f.sender.send(await fields()),
  e=>e.code==='TRANSPORT_OUTCOME_UNKNOWN'&&!e.message.includes('remote-secret'));
 assert.deepEqual(f.counts(),once);
 f.db.sql.close();
});
test('P3-W11 Access header stripping and downstream bogus 202 receipt fail closed',async()=>{
 const f=setup();f.enable();
 f.ingressEnv.P3_COMMAND_SERVICE.fetch=async()=>new Response(JSON.stringify({
  ok:true,operationId:'not-an-operation',state:'Live',
 }),{status:202,headers:{'Content-Type':'application/json'}});
 const resp=await f.ingress.handle(await f.external(encodeP3ProofEnvelope(await fields())));
 assert.equal(resp.status,503);
 assert(!JSON.stringify(await resp.json()).includes('Live'));
 assert.deepEqual(f.counts(),none);f.db.sql.close();
});
test('P3-W12 private receiver refuses unauthorized direct request and external fetch',async()=>{
 const f=setup();f.enable();
 const wire=encodeP3ProofEnvelope(await fields());
 const r=await f.receiver.handle(new Request('https://attacker.invalid/_p3/internal/command',{
  method:'POST',headers:{'Content-Type':'application/json'},body:wire}));
 assert.equal(r.status,404);assert.deepEqual(f.counts(),none);
 const source=readFileSync(new URL('../src/p3-proof-transport.mjs',import.meta.url),'utf8');
 const sentinel=readFileSync(new URL('../src/p3-disabled-ingress-worker.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/\bglobalThis\.fetch\b|\bfetch\(PRIVATE\b/);
 assert.doesNotMatch(sentinel,/p3-proof-transport|p3-proof-envelope/);
 f.db.sql.close();
});
