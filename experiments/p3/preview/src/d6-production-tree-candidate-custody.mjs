/**
 * FISH-TODO-118 WP3 — immutable server-custodied Git tree result SHA.
 * SOURCE ONLY, DEFAULT OFF, NO MIGRATION OR ROUTE.
 *
 * A GitHub create-tree HTTP 201 is not proof of a tree. When and only when a
 * bounded, pinned provider response returns an SHA after an acknowledged
 * Unknown-before-POST D1 fence, keep the candidate SHA durably. The separate
 * existing #472 Git GET verifier must still independently prove all bytes.
 * Lost acknowledgement, conflicting candidates or missing data cannot retry
 * the original POST or infer an SHA from the proposed request.
 */
import {D6_PUBLISH_REPOSITORY as REPO}
 from './d6-production-publish-intake.mjs';

export const D6_PUBLISH_TREE_CANDIDATE_SQL=[
 'CREATE TABLE IF NOT EXISTS d6_publish_tree_candidates (',
 'operation_id TEXT PRIMARY KEY NOT NULL,',
 'owner_github_id INTEGER NOT NULL,',
 'repository_id INTEGER NOT NULL,',
 'ref_name TEXT NOT NULL,',
 'source_revision TEXT NOT NULL,',
 'request_sha256 TEXT NOT NULL,',
 'result_tree_sha TEXT NOT NULL,',
 "provenance TEXT NOT NULL CHECK(provenance='server-provider-result'),",
 'recorded_at INTEGER NOT NULL',
 ');',
].join('\n');
const SHA=/^[a-f0-9]{40}$/,HASH=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const FENCE='SELECT operation_id,step_key,owner_github_id,'+
 'repository_id,request_sha256,state,created_at '+
 'FROM d6_provider_step_fences WHERE operation_id=? AND step_key=?';
const GET='SELECT operation_id,owner_github_id,repository_id,'+
 'ref_name,source_revision,request_sha256,result_tree_sha,'+
 'provenance,recorded_at FROM d6_publish_tree_candidates '+
 'WHERE operation_id=?';
const INSERT='INSERT OR IGNORE INTO d6_publish_tree_candidates '+
 '(operation_id,owner_github_id,repository_id,ref_name,'+
 'source_revision,request_sha256,result_tree_sha,provenance,recorded_at) '+
 "VALUES (?,?,?,?,?,?,?,'server-provider-result',?)";
export class D6TreeCandidateCustodyError extends Error{
 constructor(code){
  super('D6 publishing tree candidate cannot be trusted');
  this.name='D6TreeCandidateCustodyError';this.code=code;
 }
}
const deny=code=>{throw new D6TreeCandidateCustodyError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
function validate(a){
 need(a&&UUID.test(a.operationId??'')&&a.repositoryId===REPO.id&&
  a.ref===REPO.ref&&SHA.test(a.sourceRevision??'')&&
  HASH.test(a.requestSha256??''),'UNTRUSTED_CANDIDATE');
 if(Object.hasOwn(a,'resultTreeSha'))
  need(SHA.test(a.resultTreeSha??'')&&
   a.resultTreeSha!==a.sourceRevision,'UNTRUSTED_CANDIDATE');
}
export function createD6ProductionTreeCandidateCustody({
 DB,enabled=()=>false,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(DB?.prepare&&typeof enabled==='function'&&
  typeof now==='function','INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 async function get(sql,...args){
  try{return await DB.prepare(sql).bind(...args).first();}
  catch{deny('STORE_UNAVAILABLE');}
 }
 async function write(sql,...args){
  try{return await DB.prepare(sql).bind(...args).run();}
  catch{deny('STORE_UNAVAILABLE');}
 }
 async function fence(a){
  const row=await get(FENCE,a.operationId,'tree');
  need(row?.operation_id===a.operationId&&
   row.step_key==='tree'&&row.owner_github_id===REPO.ownerGitHubId&&
   row.repository_id===REPO.id&&row.request_sha256===a.requestSha256&&
   row.state==='Unknown'&&Number.isSafeInteger(row.created_at)&&
   row.created_at>0,'TREE_FENCE_UNVERIFIED');
  return row;
 }
 function receipt(row,a,f){
  need(row?.operation_id===a.operationId&&
   row.owner_github_id===REPO.ownerGitHubId&&
   row.repository_id===REPO.id&&row.ref_name===REPO.ref&&
   row.source_revision===a.sourceRevision&&
   row.request_sha256===a.requestSha256&&
   SHA.test(row.result_tree_sha??'')&&
   row.result_tree_sha!==a.sourceRevision&&
   row.provenance==='server-provider-result'&&
   Number.isSafeInteger(row.recorded_at)&&
   row.recorded_at>=f.created_at,'CANDIDATE_CONFLICT');
  return Object.freeze({
   operationId:a.operationId,repositoryId:REPO.id,ref:REPO.ref,
   sourceRevision:a.sourceRevision,requestSha256:a.requestSha256,
   resultTreeSha:row.result_tree_sha,
   provenance:'server-provider-result',
   sourceOnly:true,verifiedTree:false,canPublish:false,isLive:false,
  });
 }
 async function storeCandidateTreeHint(a){
  active();validate(a);
  const row=await fence(a),at=now();
  need(Number.isSafeInteger(at)&&at>=row.created_at,
   'INVALID_CLOCK');
  await write(INSERT,a.operationId,REPO.ownerGitHubId,REPO.id,
   REPO.ref,a.sourceRevision,a.requestSha256,a.resultTreeSha,at);
  const result=receipt(await get(GET,a.operationId),a,row);
  need(result.resultTreeSha===a.resultTreeSha,'CANDIDATE_CONFLICT');
  active();return result;
 }
 async function loadCandidateTreeHint(a){
  active();validate(a);
  const row=await fence(a);
  const saved=await get(GET,a.operationId);
  if(!saved)return null;
  const result=receipt(saved,a,row);
  active();return result;
 }
 return Object.freeze({storeCandidateTreeHint,loadCandidateTreeHint});
}
