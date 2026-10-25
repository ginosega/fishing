/**
 * FISH118 P3-33 — SOURCE-ONLY atomic D1 acceptance design proof.
 * NOT a route or deployable receiver. No live migration, service binding,
 * GitHub credential, JWT, or automatic retry. Requires separately approved
 * isolated D1 with design schema AND existing R1-R4 tables.
 *
 * CRITICAL: verifyAuthorization is a privileged, injected pure cryptographic
 * verification adapter (OIDC, App, operator signature AND command HMAC).
 * Local tests use a fixture, NOT a real provider. Never trust a client supplied
 * "verified" object or wire this module before independently reviewed adapter.
 */
export class P3AtomicAcceptanceError extends Error {
 constructor(code){super('P3 atomic acceptance refused');this.name='P3AtomicAcceptanceError';this.code=code;}
}
const fail=c=>{throw new P3AtomicAcceptanceError(c);};
const need=(condition,code)=>{if(!condition)fail(code);};
const REPO=1430581407,OWNER=265665562;
const key=/^[A-Za-z0-9_-]{12,96}$/,nonce=/^[A-Za-z0-9_-]{22,64}$/;
const sha=/^[a-f0-9]{64}$/,commit=/^[a-f0-9]{40}$/;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const op=/^p3_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const positive=x=>Number.isSafeInteger(x)&&x>0;
const enc=new TextEncoder();
async function hash(body){
 const digest=await crypto.subtle.digest('SHA-256',enc.encode(body));
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function canonical(x){
 if(x===null||typeof x==='string'||typeof x==='boolean')return JSON.stringify(x);
 if(typeof x==='number'){need(Number.isFinite(x),'INVALID_SNAPSHOT');return JSON.stringify(x);}
 if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';
 need(x&&Object.getPrototypeOf(x)===Object.prototype,'INVALID_SNAPSHOT');
 const names=Object.keys(x).sort();
 need(names.every(k=>!['__proto__','constructor','prototype'].includes(k)
  &&x[k]!==undefined),'INVALID_SNAPSHOT');
 return '{'+names.map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
}
export function createP3AtomicAcceptanceProof({
 DB,env,verifyAuthorization,operatorApproved=()=>false,
 nowMs=()=>Date.now(),makeOperationId=()=> 'p3_'+crypto.randomUUID(),
}={}){
 need(typeof DB?.prepare==='function'&&typeof DB?.batch==='function'&&
  env&&typeof env==='object'&&typeof verifyAuthorization==='function'&&
  typeof operatorApproved==='function'&&typeof nowMs==='function'&&
  typeof makeOperationId==='function','INVALID_ATOMIC_CONFIG');
 const enabled=()=>env.P3_WRITE_ENABLED==='true'&&
  env.P3_ATOMIC_ACCEPTANCE_ENABLED==='true'&&operatorApproved()===true;
 const statusEnabled=()=>env.P3_ATOMIC_STATUS_ENABLED==='true'&&
  operatorApproved()===true;
 async function accept({body,authorization,nonceValue,timestampMs}={}){
  need(enabled(),'ATOMIC_DISABLED');
  need(typeof body==='string'&&enc.encode(body).byteLength>0&&
   enc.encode(body).byteLength<=8192&&nonce.test(nonceValue??'')&&
   positive(timestampMs),'INVALID_COMMAND');
  const atMs=nowMs(),at=Math.floor(atMs/1000);
  need(positive(atMs)&&Math.abs(atMs-timestampMs)<=60000,'COMMAND_EXPIRED');
  // This injected verifier must fully verify identity, signatures and the
  // exact raw command body; no source proof bypasses runtime cryptography.
  let proof;
  try{proof=await verifyAuthorization({body,authorization,nonceValue,timestampMs});}
  catch{fail('AUTHORIZATION_DENIED');}
  need(proof?.verified===true&&proof.action==='accept'&&
   proof.repositoryId===REPO&&proof.operatorGithubId===OWNER&&
   uuid.test(proof.approvalId??'')&&sha.test(proof.approvalSha256??'')&&
   sha.test(proof.bodySha256??'')&&commit.test(proof.workflowSha??'')&&
   positive(proof.runId)&&positive(proof.runAttempt)&&proof.runAttempt<=100&&
   positive(proof.issuedAt)&&positive(proof.expiresAt)&&
   proof.issuedAt<=at+30&&proof.issuedAt>=at-300&&
   proof.expiresAt>at&&proof.expiresAt>proof.issuedAt&&
   proof.expiresAt-proof.issuedAt<=300,'AUTHORIZATION_DENIED');
  need(await hash(body)===proof.bodySha256,'AUTHORIZATION_DENIED');
  let command;
  try{command=JSON.parse(body);}catch{fail('INVALID_COMMAND');}
  need(command&&Object.getPrototypeOf(command)===Object.prototype&&
   Object.keys(command).sort().join(',')==='action,idempotencyKey,snapshot'&&
   command.action==='accept'&&key.test(command.idempotencyKey)&&
   proof.idempotencyKey===command.idempotencyKey,'INVALID_COMMAND');
  const snap=command.snapshot;
  need(snap&&Object.getPrototypeOf(snap)===Object.prototype&&
   Object.keys(snap).sort().join(',')==='media,package'&&
   snap.package&&Object.getPrototypeOf(snap.package)===Object.prototype&&
   snap.package.format==='fishing-companion-change-v2'&&
   ['gear','kb'].includes(snap.package.domain)&&
   ['add','edit'].includes(snap.package.operation)&&
   Array.isArray(snap.media)&&snap.media.length===0,'INVALID_SNAPSHOT');
  const payload=canonical(snap);
  need(enc.encode(payload).byteLength<=128*1024,'INVALID_SNAPSHOT');
  const payloadHash=await hash(payload);
  const keyHash=await hash(OWNER+':'+REPO+':'+command.idempotencyKey);
  const nonceHash=await hash(nonceValue);
  const operationId=makeOperationId();
  need(op.test(operationId),'INVALID_OPERATION_ID');
  // All four inserts + operation-triggered Accepted audit MUST succeed
  // together. No ON CONFLICT DO NOTHING on these critical writes:
  // a duplicate approval, nonce or idempotency key rolls EVERYTHING back.
  const queries=[
   DB.prepare('INSERT INTO p3_operations '+
    '(operation_id,github_id,repo_id,idempotency_key_hash,payload_sha256,state,created_at,updated_at) '+
    'VALUES(?,?,?,?,?,?,?,?)').bind(
     operationId,OWNER,REPO,keyHash,payloadHash,'Accepted',at,at),
   DB.prepare('INSERT INTO p3_requests '+
    '(operation_id,request_json,payload_sha256,created_at) VALUES(?,?,?,?)').bind(
     operationId,payload,payloadHash,at),
   DB.prepare('INSERT INTO p3_atomic_approvals '+
    '(approval_id,approval_sha256,operation_id,operator_github_id,repository_id,'+
    'run_id,run_attempt,workflow_sha,idempotency_key_hash,body_sha256,'+
    'issued_at_sec,expires_at_sec,consumed_at_sec) '+
    'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(
     proof.approvalId,proof.approvalSha256,operationId,OWNER,REPO,
     proof.runId,proof.runAttempt,proof.workflowSha,keyHash,proof.bodySha256,
     proof.issuedAt,proof.expiresAt,at),
   DB.prepare('INSERT INTO p3_command_nonces '+
    '(nonce_sha256,github_id,repo_id,issued_at_ms,consumed_at_ms) VALUES(?,?,?,?,?)').bind(
     nonceHash,OWNER,REPO,timestampMs,atMs),
  ];
  try{
   const done=await DB.batch(queries);
   need(Array.isArray(done)&&done.length===4&&
    done.every(x=>x?.success===true),'ATOMIC_OUTCOME_UNKNOWN');
  }catch{fail('ATOMIC_OUTCOME_UNKNOWN');}
  return Object.freeze({operationId,state:'Accepted'});
 }
 async function readStatus({approvalId,approvalSha256}={}){
  need(statusEnabled(),'STATUS_DISABLED');
  need(uuid.test(approvalId??'')&&sha.test(approvalSha256??''),'INVALID_STATUS');
  let row;
  try{row=await DB.prepare(
   'SELECT a.operation_id,o.state FROM p3_atomic_approvals a '+
   'JOIN p3_operations o ON o.operation_id=a.operation_id '+
   'WHERE a.approval_id=? AND a.approval_sha256=? '+
   'AND a.operator_github_id=? AND a.repository_id=? '+
   'AND o.github_id=? AND o.repo_id=?'
  ).bind(approvalId,approvalSha256,OWNER,REPO,OWNER,REPO).first();}
  catch{fail('STATUS_UNAVAILABLE');}
  // Unknown is NOT SafeToRetry. Even if an approval is absent, a response
  // may have been lost before the read and must be reconciled by human.
  return row?
   Object.freeze({state:'Found',operationId:row.operation_id,operationState:row.state}):
   Object.freeze({state:'Unknown'});
 }
 return Object.freeze({accept,readStatus});
}
