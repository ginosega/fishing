/**
 * D6 GitHub content-PR creation fence — SOURCE ONLY / DEFAULT OFF.
 *
 * A durable D1 write-intent must be committed BEFORE any external provider
 * mutation. The deterministic operation branch and unique D1 operation ID
 * prevent duplicate PR creation on retry, restart or uncertain API outcome.
 *
 * This module provides NO Worker route, GitHub token, live write adapter,
 * D1 migration, provider activation, merge, publish or Live status.
 *
 * The injected createPr and inspectPr MUST be separately approved trusted
 * server adapters, never browser input. createPr must only create a scoped
 * content branch/PR whose exact source and changed paths are independently
 * checked by inspectPr before recording Created. Its own internal multi-step
 * GitHub writes must follow the same no-blind-retry rule.
 */
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const SHA=/^[a-f0-9]{40}$/,HASH=/^[a-f0-9]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const operationBranch=id=>'fish-v3/publish/'+id;

export const D6_PR_CREATE_FENCE_SQL=`
CREATE TABLE IF NOT EXISTS d6_pr_creation_fences (
 operation_id TEXT PRIMARY KEY,
 owner_github_id INTEGER NOT NULL,
 repository_id INTEGER NOT NULL,
 source_revision TEXT NOT NULL,
 candidate_sha256 TEXT NOT NULL,
 branch_name TEXT NOT NULL UNIQUE,
 state TEXT NOT NULL DEFAULT 'Unknown'
  CHECK(state IN ('Unknown','Created')),
 pr_number INTEGER,
 pr_head_sha TEXT,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 CHECK ((state='Unknown' AND pr_number IS NULL AND pr_head_sha IS NULL)
     OR (state='Created' AND pr_number IS NOT NULL AND pr_head_sha IS NOT NULL))
);
`;
const select=`SELECT operation_id,owner_github_id,repository_id,
 source_revision,candidate_sha256,branch_name,state,
 pr_number,pr_head_sha,created_at,updated_at
 FROM d6_pr_creation_fences WHERE operation_id=?`;
const insert=`INSERT OR IGNORE INTO d6_pr_creation_fences (
 operation_id,owner_github_id,repository_id,source_revision,
 candidate_sha256,branch_name,state,created_at,updated_at)
 VALUES (?,?,?,?,?,?,'Unknown',?,?)`;
const markCreated=`UPDATE d6_pr_creation_fences SET state='Created',
 pr_number=?,pr_head_sha=?,updated_at=?
 WHERE operation_id=? AND state='Unknown'
 AND source_revision=? AND candidate_sha256=?`;

export class D6PrCreationFenceError extends Error {
 constructor(code){super('D6 content PR creation is unverified');
  this.name='D6PrCreationFenceError';this.code=code;}
}
const deny=code=>{throw new D6PrCreationFenceError(code);};
const need=(condition,code)=>{if(!condition)deny(code);};
const verifiedOperation=(row,id)=>{
 need(row&&row.operationId===id&&UUID.test(id)&&
  row.ownerGitHubId===REPO.ownerGitHubId&&
  row.repositoryId===REPO.id&&row.ref===REPO.ref&&
  SHA.test(row.sourceRevision??'')&&HASH.test(row.candidateSha256??'')&&
  row.state==='Accepted'&&
  ['gear','kb'].includes(row.domain)&&
  ['add','edit'].includes(row.operation),
  'UNTRUSTED_OPERATION');
 return row;
};
const matching=(row,op)=>row&&row.operation_id===op.operationId&&
 row.owner_github_id===REPO.ownerGitHubId&&
 row.repository_id===REPO.id&&
 row.source_revision===op.sourceRevision&&
 row.candidate_sha256===op.candidateSha256&&
 row.branch_name===operationBranch(op.operationId)&&
 (row.state==='Created'||row.state==='Unknown');
function result(row,op){
 need(matching(row,op),'CORRUPT_FENCE');
 const created=row.state==='Created';
 need(Number.isSafeInteger(row.created_at)&&
  Number.isSafeInteger(row.updated_at)&&
  row.updated_at>=row.created_at&&
  (created?Number.isSafeInteger(row.pr_number)&&row.pr_number>0&&
   SHA.test(row.pr_head_sha??''):
   row.pr_number==null&&row.pr_head_sha==null),
  'CORRUPT_FENCE');
 return Object.freeze({
  operationId:op.operationId,state:row.state,
  branch:row.branch_name,sourceRevision:row.source_revision,
  prNumber:created?row.pr_number:null,
  headSha:created?row.pr_head_sha:null,
  outcomeKnown:created,requiresReconciliation:!created,
  canMerge:false,canPublish:false,isLive:false,sourceOnly:true,
 });
}
function checkProof(proof,op){
 const ok=proof?.repositoryId===REPO.id&&
  proof.ownerGitHubId===REPO.ownerGitHubId&&
  proof.operationId===op.operationId&&
  proof.branch===operationBranch(op.operationId)&&
  proof.baseRef==='main'&&proof.baseSha===op.sourceRevision&&
  proof.candidateSha256===op.candidateSha256&&
  proof.contentOnly===true&&
  proof.independentlyVerified===true&&
  Number.isSafeInteger(proof.prNumber)&&proof.prNumber>0&&
  SHA.test(proof.headSha??'');
 need(ok,'PR_NOT_VERIFIED');
}

export function createD6ProductionPrCreationFence({
 DB,readOperation,createPr,inspectPr,enabled=()=>false,
 now=()=>Math.floor(Date.now()/1000),
}={}){
 need(DB?.prepare&&typeof readOperation==='function'&&
  typeof createPr==='function'&&typeof inspectPr==='function'&&
  typeof enabled==='function'&&typeof now==='function',
  'INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 const one=async(id)=>{
  try{return await DB.prepare(select).bind(id).first();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 const run=async(sql,...args)=>{
  try{return await DB.prepare(sql).bind(...args).run();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 const opFor=async id=>{
  active();need(UUID.test(id??''),'INVALID_OPERATION');
  let op;
  try{op=await readOperation(id);}catch{deny('OPERATION_UNAVAILABLE');}
  return verifiedOperation(op,id);
 };
 async function reconcile(op){
  const existing=await one(op.operationId);
  need(existing,'FENCE_MISSING');
  if(existing.state==='Created')return result(existing,op);
  result(existing,op); // validate before the provider read
  let proof;
  try{proof=await inspectPr({
   operationId:op.operationId,
   branch:operationBranch(op.operationId),
   repositoryId:REPO.id,
  });}
  catch{return result(existing,op);} // unknown stays locked
  if(!proof)return result(existing,op);
  // A mismatching remote PR is not proof and NEVER permits new writes.
  checkProof(proof,op);
  const at=now();
  need(Number.isSafeInteger(at)&&at>=existing.created_at,
   'INVALID_CLOCK');
  await run(markCreated,proof.prNumber,proof.headSha,at,
   op.operationId,op.sourceRevision,op.candidateSha256);
  const persisted=await one(op.operationId);
  need(persisted,'FENCE_MISSING');
  return result(persisted,op);
 }
 async function begin(operationId){
  const op=await opFor(operationId);
  const prior=await one(operationId);
  if(prior)return result(prior,op);
  const at=now();
  need(Number.isSafeInteger(at)&&at>0,'INVALID_CLOCK');
  const ack=await run(insert,operationId,REPO.ownerGitHubId,REPO.id,
   op.sourceRevision,op.candidateSha256,
   operationBranch(operationId),at,at);
  const fence=await one(operationId);
  need(fence,'FENCE_MISSING');
  result(fence,op);
  // Only a genuinely inserted, durably visible fence may cause ONE write.
  // All duplicate calls, even simultaneous, return the same record.
  if(ack?.meta?.changes!==1)return result(fence,op);
  active();
  try{
   await createPr(Object.freeze({
    operationId,repositoryId:REPO.id,
    branch:operationBranch(operationId),
    sourceRevision:op.sourceRevision,
    candidateSha256:op.candidateSha256,
    sourceOnly:true,
   }));
  }catch{
   return result(await one(operationId),op);
  }
  // Revocation after an in-flight external write must not certify it.
  // The durable Unknown fence remains, requiring later reconciliation.
  if(enabled()!==true)return result(await one(operationId),op);
  // Never trust createPr's acknowledgment; read the remote PR separately.
  return reconcile(op);
 }
 async function check(operationId){
  const op=await opFor(operationId);
  const row=await one(operationId);
  if(!row)deny('FENCE_MISSING');
  result(row,op);
  return reconcile(op);
 }
 return Object.freeze({begin,check});
}
