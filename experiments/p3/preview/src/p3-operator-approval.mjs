/**
 * FISH118 P3-34 — SOURCE ONLY. Separate ECDSA/OIDC verification from ALL
 * persistence. Caller supplies a trusted cryptographic GitHub OIDC+App
 * provenance verifier. The returned claims are not a write authorization:
 * only an independent atomic isolated D1 receiver may consume them.
 */
export class P3ApprovalError extends Error {
 constructor(code){super('P3 operator approval denied');this.name='P3ApprovalError';this.code=code;}
}
const fail=c=>{throw new P3ApprovalError(c);};
const need=(v,c)=>{if(!v)fail(c);};
const validSha=s=>typeof s==='string'&&/^[0-9a-f]{40}$/.test(s);
const hex=s=>typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);
const b64=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{86}$/.test(s);
const id=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(s);
const REPO_ID=1430581407,OWNER_ID=265665562;
const enc=new TextEncoder();
const keys=['action','approvalId','bodySha256','expiresAt','idempotencyKey',
 'issuedAt','operatorGithubId','repositoryId','runAttempt','runId','workflowSha'];
const digestHex=async value=>{
 const h=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value)));
 return [...h].map(x=>x.toString(16).padStart(2,'0')).join('');
};
export function canonicalP3Approval(approval){
 need(approval&&Object.getPrototypeOf(approval)===Object.prototype&&
  JSON.stringify(Object.keys(approval).sort())===JSON.stringify([...keys].sort()),
  'APPROVAL_INVALID');
 return JSON.stringify(Object.fromEntries(keys.map(k=>[k,approval[k]])));
}
export function createP3OperatorApprovalVerifier({
 verifyProvenance,operatorPublicJwk,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(typeof verifyProvenance==='function'&&typeof now==='function'&&
  operatorPublicJwk?.kty==='EC'&&operatorPublicJwk.crv==='P-256'&&
  typeof operatorPublicJwk.x==='string'&&typeof operatorPublicJwk.y==='string'&&
  (operatorPublicJwk.alg===undefined||operatorPublicJwk.alg==='ES256')&&
  (operatorPublicJwk.use===undefined||operatorPublicJwk.use==='sig'),
  'INVALID_APPROVAL_CONFIG');
 let keyPromise;
 const loadKey=()=>{
  if(!keyPromise){
   keyPromise=crypto.subtle.importKey('jwk',operatorPublicJwk,
    {name:'ECDSA',namedCurve:'P-256'},false,['verify'])
    .catch(()=>fail('INVALID_APPROVAL_CONFIG'));
  }
  return keyPromise;
 };
 async function verify({oidcJwt,approval,signature,body,idempotencyKey}={}){
  need(typeof body==='string'&&enc.encode(body).byteLength>0&&
   enc.encode(body).byteLength<=8192&&
   typeof idempotencyKey==='string'&&/^[A-Za-z0-9_-]{12,96}$/.test(idempotencyKey),
   'OPERATION_INVALID');
  let run;
  try{run=await verifyProvenance(oidcJwt);}catch{fail('PROVENANCE_DENIED');}
  need(run?.verified===true&&run.repositoryId===REPO_ID&&
   run.ownerGitHubId===OWNER_ID&&Number.isSafeInteger(run.runId)&&
   run.runId>0&&Number.isSafeInteger(run.runAttempt)&&run.runAttempt>0&&
   validSha(run.workflowSha),'PROVENANCE_DENIED');
  const canon=canonicalP3Approval(approval);
  const clock=now();
  need(Number.isSafeInteger(clock)&&clock>0&&
   approval.action==='accept'&&id(approval.approvalId)&&
   approval.repositoryId===REPO_ID&&approval.operatorGithubId===OWNER_ID&&
   approval.runId===run.runId&&approval.runAttempt===run.runAttempt&&
   approval.workflowSha===run.workflowSha&&
   approval.idempotencyKey===idempotencyKey&&
   hex(approval.bodySha256)&&Number.isSafeInteger(approval.issuedAt)&&
   Number.isSafeInteger(approval.expiresAt)&&
   approval.issuedAt<=clock+30&&approval.issuedAt>=clock-300&&
   approval.expiresAt>clock&&approval.expiresAt>approval.issuedAt&&
   approval.expiresAt-approval.issuedAt<=300,
   'APPROVAL_SCOPE_DENIED');
  const bodySha256=await digestHex(body);
  need(bodySha256===approval.bodySha256,'APPROVAL_BODY_MISMATCH');
  need(b64(signature),'APPROVAL_SIGNATURE_INVALID');
  let bytes;
  try{
   bytes=Uint8Array.from(atob(signature.replace(/-/g,'+').replace(/_/g,'/')+'=='),
    x=>x.charCodeAt(0));
   need(bytes.length===64&&
    btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-')
     .replace(/\//g,'_').replace(/=+$/,'')===signature,
    'APPROVAL_SIGNATURE_INVALID');
  }catch{fail('APPROVAL_SIGNATURE_INVALID');}
  let valid=false;
  try{valid=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},
   await loadKey(),bytes,enc.encode('p3-operator-approval-v1\n'+canon));}
  catch{fail('APPROVAL_SIGNATURE_INVALID');}
  need(valid===true,'APPROVAL_SIGNATURE_INVALID');
  return Object.freeze({
   verified:true,action:'accept',repositoryId:REPO_ID,operatorGithubId:OWNER_ID,
   approvalId:approval.approvalId,approvalSha256:await digestHex('p3-operator-approval-v1\n'+canon),
   bodySha256,idempotencyKey,runId:run.runId,runAttempt:run.runAttempt,
   workflowSha:run.workflowSha,issuedAt:approval.issuedAt,expiresAt:approval.expiresAt,
  });
 }
 return Object.freeze({verify});
}
// Historical standalone consume-first API is retained for isolated P3-31 tests.
// It MUST NOT be used with the P3-33 atomic receiver: the receiver owns BOTH
// the approval ledger insertion and nonce insertion inside one D1 transaction.
export function createP3OperatorApproval({
 verifyProvenance,operatorPublicJwk,consumeApproval,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(typeof consumeApproval==='function','INVALID_APPROVAL_CONFIG');
 const verifier=createP3OperatorApprovalVerifier({verifyProvenance,operatorPublicJwk,now});
 async function authorize(input){
  const verified=await verifier.verify(input);
  let consumed=false;
  try{consumed=await consumeApproval(verified);}
  catch{fail('APPROVAL_LEDGER_UNAVAILABLE');}
  need(consumed===true,'APPROVAL_REPLAY_OR_LEDGER_DENIED');
  return Object.freeze({
   approved:true,action:'accept',repositoryId:REPO_ID,ownerGitHubId:OWNER_ID,
   idempotencyKey:verified.idempotencyKey,runId:verified.runId,
   runAttempt:verified.runAttempt,approvalId:verified.approvalId,
  });
 }
 return Object.freeze({authorize});
}
