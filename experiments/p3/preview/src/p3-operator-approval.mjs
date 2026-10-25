/**
 * FISH118 P3-30 — source-only operator signature + exact-run authorization.
 * Deliberately NO private approval key, no default ledger, no write/deploy method.
 * A future caller must supply a separately reviewed durable consumeApproval CAS.
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
export function canonicalP3Approval(approval){
 need(approval&&Object.getPrototypeOf(approval)===Object.prototype&&
  JSON.stringify(Object.keys(approval).sort())===JSON.stringify([...keys].sort()),
  'APPROVAL_INVALID');
 // JSON property-order independence, no extra signed fields.
 return JSON.stringify(Object.fromEntries(keys.map(k=>[k,approval[k]])));
}
export function createP3OperatorApproval({
 verifyProvenance,operatorPublicJwk,consumeApproval,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(typeof verifyProvenance==='function'&&typeof consumeApproval==='function'&&
  typeof now==='function'&&
  operatorPublicJwk?.kty==='EC'&&operatorPublicJwk.crv==='P-256'&&
  typeof operatorPublicJwk.x==='string'&&typeof operatorPublicJwk.y==='string'&&
  (operatorPublicJwk.alg===undefined||operatorPublicJwk.alg==='ES256')&&
  (operatorPublicJwk.use===undefined||operatorPublicJwk.use==='sig'),
  'INVALID_APPROVAL_CONFIG');
 // Operator private key must remain separate from the trusted runner and
 // GitHub Actions secrets: only this public key is provided to the verifier.
 let verifyKey;
 const loadKey=async()=>{
  if(!verifyKey){
   try{verifyKey=await crypto.subtle.importKey('jwk',operatorPublicJwk,
    {name:'ECDSA',namedCurve:'P-256'},false,['verify']);}
   catch{fail('INVALID_APPROVAL_CONFIG');}
  }
  return verifyKey;
 };
 async function authorize({oidcJwt,approval,signature,body,idempotencyKey}={}){
  // Source-only proof; no side effects until both signatures and scopes pass.
  need(typeof body==='string'&&enc.encode(body).byteLength>0&&
   enc.encode(body).byteLength<=8192&&
   typeof idempotencyKey==='string'&&/^[A-Za-z0-9_-]{12,96}$/.test(idempotencyKey),
   'OPERATION_INVALID');
  const run=await verifyProvenance(oidcJwt);
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
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(body)));
  const digestHex=[...digest].map(x=>x.toString(16).padStart(2,'0')).join('');
  need(digestHex===approval.bodySha256,'APPROVAL_BODY_MISMATCH');
  need(b64(signature),'APPROVAL_SIGNATURE_INVALID');
  let bytes;
  try{
   bytes=Uint8Array.from(atob(signature.replace(/-/g,'+').replace(/_/g,'/')+'=='),
    x=>x.charCodeAt(0));
  }catch{fail('APPROVAL_SIGNATURE_INVALID');}
  need(bytes.length===64,'APPROVAL_SIGNATURE_INVALID');
  let valid=false;
  try{valid=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},await loadKey(),
   bytes,enc.encode('p3-operator-approval-v1\n'+canon));}
  catch{fail('APPROVAL_SIGNATURE_INVALID');}
  need(valid===true,'APPROVAL_SIGNATURE_INVALID');
  // Ledger binds the exact approval envelope, not merely the request body.
  const approvalHash=new Uint8Array(await crypto.subtle.digest('SHA-256',
   enc.encode('p3-operator-approval-v1\n'+canon)));
  const approvalHex=[...approvalHash].map(x=>x.toString(16).padStart(2,'0')).join('');
  // One-time consumption MUST be persistent and atomic across runners.
  // A missing/failed ledger check denies; this module never uses memory fallback.
  let consumed=false;
  try{consumed=await consumeApproval({
   approvalId:approval.approvalId,repositoryId:REPO_ID,
   operatorGithubId:OWNER_ID,runId:run.runId,
   runAttempt:run.runAttempt,workflowSha:run.workflowSha,
   idempotencyKey,bodySha256:digestHex,issuedAt:approval.issuedAt,
   expiresAt:approval.expiresAt,approvalSha256:approvalHex,
  });}catch{fail('APPROVAL_LEDGER_UNAVAILABLE');}
  need(consumed===true,'APPROVAL_REPLAY_OR_LEDGER_DENIED');
  return Object.freeze({approved:true,action:'accept',repositoryId:REPO_ID,
   ownerGitHubId:OWNER_ID,idempotencyKey,runId:run.runId,
   runAttempt:run.runAttempt,approvalId:approval.approvalId});
 }
 return Object.freeze({authorize});
}
