/**
 * FISH-TODO-118 WP3 — durable custody of a candidate Git commit SHA.
 *
 * SOURCE ONLY / DEFAULT OFF / NO WORKER ROUTE / NO D1 MIGRATION.
 * A successful GitHub POST /git/commits response yields a CANDIDATE SHA,
 * never a VerifiedCommit. Bind that SHA to the immutable pre-write D1 Unknown
 * fence and Accepted operation; only the existing independent GitHub GET
 * reconciler may subsequently certify the commit.
 *
 * An absent or ambiguous provider response cannot be recovered by guessing
 * an unreferenced Git object SHA. Such an operation remains Unknown forever
 * until independent, trustworthy evidence becomes available. Do not retry POST.
 */
import {D6_PUBLISH_REPOSITORY as REPO}
 from './d6-production-publish-intake.mjs';

export const D6_PUBLISH_COMMIT_CANDIDATE_SQL=[
 'CREATE TABLE IF NOT EXISTS d6_publish_commit_candidates (',
 'operation_id TEXT PRIMARY KEY NOT NULL,',
 'owner_github_id INTEGER NOT NULL,',
 'repository_id INTEGER NOT NULL,',
 'ref_name TEXT NOT NULL,',
 'source_revision TEXT NOT NULL,',
 'request_sha256 TEXT NOT NULL,',
 'result_commit_sha TEXT NOT NULL,',
 "provenance TEXT NOT NULL CHECK(provenance='server-provider-result'),",
 'recorded_at INTEGER NOT NULL',
 ');',
].join('\n');

const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const FENCE='SELECT operation_id,step_key,owner_github_id,'+
 'repository_id,request_sha256,state,created_at '+
 'FROM d6_provider_step_fences WHERE operation_id=? AND step_key=?';
const GET='SELECT operation_id,owner_github_id,repository_id,ref_name,'+
 'source_revision,request_sha256,result_commit_sha,provenance,recorded_at '+
 'FROM d6_publish_commit_candidates WHERE operation_id=?';
const INSERT='INSERT OR IGNORE INTO d6_publish_commit_candidates '+
 '(operation_id,owner_github_id,repository_id,ref_name,source_revision,'+
 "request_sha256,result_commit_sha,provenance,recorded_at) "+
 "VALUES (?,?,?,?,?,?,?,'server-provider-result',?)";

export class D6CommitCandidateCustodyError extends Error{
 constructor(code){
  super('D6 publishing commit SHA custody unverified');
  this.name='D6CommitCandidateCustodyError';this.code=code;
 }
}
const deny=code=>{throw new D6CommitCandidateCustodyError(code);};
const need=(v,code)=>{if(!v)deny(code);};

function validate(args){
 need(args&&UUID.test(args.operationId??'')&&
  args.repositoryId===REPO.id&&args.ref===REPO.ref&&
  SHA.test(args.sourceRevision??'')&&
  DIGEST.test(args.requestSha256??''),'UNTRUSTED_CANDIDATE');
 if(Object.hasOwn(args,'resultCommitSha'))
  need(SHA.test(args.resultCommitSha??'')&&
   args.resultCommitSha!==args.sourceRevision,
   'UNTRUSTED_CANDIDATE');
}

export function createD6ProductionCommitCandidateCustody({
 DB,enabled=()=>false,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(DB?.prepare&&typeof enabled==='function'&&
  typeof now==='function','INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 const get=async(sql,...args)=>{
  try{return await DB.prepare(sql).bind(...args).first();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 const write=async(sql,...args)=>{
  try{return await DB.prepare(sql).bind(...args).run();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 async function inspectFence(args){
  const fence=await get(FENCE,args.operationId,'commit');
  need(fence?.operation_id===args.operationId&&
   fence.step_key==='commit'&&
   fence.owner_github_id===REPO.ownerGitHubId&&
   fence.repository_id===REPO.id&&
   fence.request_sha256===args.requestSha256&&
   fence.state==='Unknown'&&
   Number.isSafeInteger(fence.created_at)&&fence.created_at>0,
   'COMMIT_FENCE_UNVERIFIED');
  return fence;
 }
 function receipt(row,args,fence){
  need(row?.operation_id===args.operationId&&
   row.owner_github_id===REPO.ownerGitHubId&&
   row.repository_id===REPO.id&&
   row.ref_name===REPO.ref&&
   row.source_revision===args.sourceRevision&&
   row.request_sha256===args.requestSha256&&
   SHA.test(row.result_commit_sha??'')&&
   row.result_commit_sha!==args.sourceRevision&&
   row.provenance==='server-provider-result'&&
   Number.isSafeInteger(row.recorded_at)&&
   row.recorded_at>=fence.created_at,
   'CANDIDATE_CONFLICT');
  return Object.freeze({
   operationId:row.operation_id,repositoryId:REPO.id,ref:REPO.ref,
   sourceRevision:row.source_revision,
   requestSha256:row.request_sha256,
   resultCommitSha:row.result_commit_sha,
   provenance:'server-provider-result',
   sourceOnly:true,verifiedCommit:false,canPublish:false,isLive:false,
  });
 }
 async function storeCandidateCommitHint(args){
  active();validate(args);
  const fence=await inspectFence(args);
  const at=now();
  need(Number.isSafeInteger(at)&&at>=fence.created_at,
   'INVALID_CLOCK');
  await write(INSERT,args.operationId,REPO.ownerGitHubId,REPO.id,
   REPO.ref,args.sourceRevision,args.requestSha256,
   args.resultCommitSha,at);
  const row=await get(GET,args.operationId);
  const result=receipt(row,args,fence);
  need(result.resultCommitSha===args.resultCommitSha,
   'CANDIDATE_CONFLICT');
  active();
  return result;
 }
 async function loadCandidateCommitHint(args){
  active();validate(args);
  const fence=await inspectFence(args);
  const row=await get(GET,args.operationId);
  if(!row)return null;
  const result=receipt(row,args,fence);
  active();
  return result;
 }
 return Object.freeze({storeCandidateCommitHint,loadCandidateCommitHint});
}
