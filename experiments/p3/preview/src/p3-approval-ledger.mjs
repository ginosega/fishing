/**
 * FISH118 P3-32 — SOURCE-ONLY proof of atomic one-use owner approvals.
 * Proposed schema lives under design/, deliberately NOT in migrations/.
 * No Worker import, network path, automatic retry, cleanup, publishing or
 * default enablement. A future isolated D1 binding needs separate approval.
 */
export class P3ApprovalLedgerError extends Error {
 constructor(code){super('P3 approval ledger unavailable or denied');this.name='P3ApprovalLedgerError';this.code=code;}
}
const refuse=code=>{throw new P3ApprovalLedgerError(code);};
const check=(ok,code)=>{if(!ok)refuse(code);};
const REPO=1430581407,OWNER=265665562;
const sha=/^[a-f0-9]{64}$/,gitSha=/^[a-f0-9]{40}$/;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const key=/^[A-Za-z0-9_-]{12,96}$/;
const positive=n=>Number.isSafeInteger(n)&&n>0;
export function createP3ApprovalLedger({
 DB,env,operatorApproved=()=>false,now=()=>Math.floor(Date.now()/1000),
}={}){
 check(typeof DB?.prepare==='function'&&env&&typeof env==='object'&&
  typeof operatorApproved==='function'&&typeof now==='function',
  'INVALID_LEDGER_CONFIG');
 const canConsume=()=>env.P3_WRITE_ENABLED==='true'&&
  env.P3_APPROVAL_LEDGER_ENABLED==='true'&&operatorApproved()===true;
 const canRead=()=>env.P3_APPROVAL_STATUS_ENABLED==='true'&&
  operatorApproved()===true;
 async function consumeApproval({
  approvalId,repositoryId,operatorGithubId,runId,runAttempt,
  workflowSha,idempotencyKey,bodySha256,approvalSha256,issuedAt,expiresAt,
 }={}){
  check(canConsume(),'LEDGER_DISABLED');
  const clock=now();
  check(repositoryId===REPO&&operatorGithubId===OWNER&&
   uuid.test(approvalId??'')&&positive(runId)&&positive(runAttempt)&&
   runAttempt<=100&&gitSha.test(workflowSha??'')&&
   key.test(idempotencyKey??'')&&sha.test(bodySha256??'')&&
   sha.test(approvalSha256??'')&&positive(issuedAt)&&positive(expiresAt)&&
   positive(clock)&&issuedAt<=clock+30&&issuedAt>=clock-300&&
   expiresAt>clock&&expiresAt>issuedAt&&expiresAt-issuedAt<=300,
   'LEDGER_CLAIM_DENIED');
  // SQLite primary/unique constraints make simultaneous submissions atomic.
  // A commit whose receipt is lost is permanently ambiguous until reconciled.
  // Neither failure nor 0 rows may cause blind automatic resubmission.
  let row;
  try{
   row=await DB.prepare(
    'INSERT INTO p3_operator_approvals '+
    '(approval_id,repository_id,operator_github_id,run_id,run_attempt,'+
    'workflow_sha,idempotency_key,body_sha256,approval_sha256,'+
    'issued_at_sec,expires_at_sec,consumed_at_sec) '+
    'VALUES(?,?,?,?,?,?,?,?,?,?,?,?) '+
    'ON CONFLICT DO NOTHING RETURNING approval_id'
   ).bind(approvalId,REPO,OWNER,runId,runAttempt,workflowSha,
    idempotencyKey,bodySha256,approvalSha256,issuedAt,expiresAt,clock).first();
  }catch{refuse('LEDGER_UNAVAILABLE');}
  return row?.approval_id===approvalId;
 }
 async function readConsumption({approvalId,approvalSha256}={}){
  check(canRead(),'STATUS_DISABLED');
  check(uuid.test(approvalId??'')&&sha.test(approvalSha256??''),
   'LEDGER_CLAIM_DENIED');
  let record;
  try{
   record=await DB.prepare(
    'SELECT approval_id FROM p3_operator_approvals '+
    'WHERE approval_id=? AND approval_sha256=? AND repository_id=? AND operator_github_id=?'
   ).bind(approvalId,approvalSha256,REPO,OWNER).first();
  }catch{refuse('LEDGER_UNAVAILABLE');}
  // Absent != safe to resend: it does not establish the downstream D1 state.
  return Object.freeze({state:record?.approval_id===approvalId?'Consumed':'Unknown'});
 }
 return Object.freeze({consumeApproval,readConsumption});
}
