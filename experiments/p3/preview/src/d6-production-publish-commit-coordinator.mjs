/**
 * FISH-TODO-118 WP3-3 — durable commit step after VerifiedTree + VerifiedBranch.
 * SOURCE ONLY / DEFAULT OFF / NO WORKER ROUTE.
 *
 * One immutable D1 Unknown fence precedes at most one Git Data POST commit.
 * A response (including HTTP 201), timeout, lost D1 ack or repeat invocation
 * is never treated as a verified result and cannot authorize a replay.
 *
 * A server-held provisional result SHA can subsequently be checked via an
 * independent GitHub commit GET and an immutable VerifiedCommit D1 receipt.
 * No hint, no proof; Git commits cannot safely be guessed from an HTTP
 * result lost before trustworthy server custody records its object SHA.
 *
 * This module cannot advance branch refs, create PRs, merge or mark Live.
 * No D1 schema is installed and no real provider permissions are activated.
 */
import {sha256} from '../../../../pwa/src/shared.mjs';
import {readD6BoundedJson}
 from './d6-bounded-json-response.mjs';
import {describeD6AtomicTreeStep}
 from './d6-production-atomic-tree-step.mjs';
import {describeD6PublishBranchStep}
 from './d6-production-publish-branch-coordinator.mjs';
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const API='https://api.github.com/repos/'+REPO.name;
const SHA=/^[0-9a-f]{40}$/,DIGEST=/^[0-9a-f]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[a-f0-9]{12}$/i;
const WRITE=Object.freeze({contents:'write'}),READ=Object.freeze({contents:'read'});
const MAX_JSON=65536;
const sqlFence='SELECT operation_id,step_key,owner_github_id,'+
 'repository_id,request_sha256,state,created_at '+
 'FROM d6_provider_step_fences WHERE operation_id=? AND step_key=?';
const sqlTree='SELECT operation_id,owner_github_id,repository_id,'+
 'request_sha256,source_revision,base_tree_sha,result_tree_sha,'+
 'changed_paths,state,verified_at FROM d6_atomic_tree_verified '+
 'WHERE operation_id=?';
const sqlBranch='SELECT operation_id,owner_github_id,repository_id,'+
 'tree_request_sha256,request_sha256,source_revision,base_tree_sha,'+
 'result_tree_sha,ref_name,state,verified_at '+
 'FROM d6_publish_branch_verified WHERE operation_id=?';
const sqlCommit='SELECT operation_id,owner_github_id,repository_id,'+
 'tree_request_sha256,branch_request_sha256,request_sha256,'+
 'source_revision,result_tree_sha,result_commit_sha,ref_name,'+
 'state,verified_at FROM d6_publish_commit_verified WHERE operation_id=?';
const insertFence='INSERT OR IGNORE INTO d6_provider_step_fences '+
 '(operation_id,step_key,owner_github_id,repository_id,request_sha256,'+
 "state,created_at) VALUES (?,?,?,?,?,'Unknown',?)";
const insertProof='INSERT OR IGNORE INTO d6_publish_commit_verified '+
 '(operation_id,owner_github_id,repository_id,tree_request_sha256,'+
 'branch_request_sha256,request_sha256,source_revision,'+
 'result_tree_sha,result_commit_sha,ref_name,state,verified_at) '+
 "VALUES (?,?,?,?,?,?,?,?,?,?,'VerifiedCommit',?)";
export const D6_PUBLISH_COMMIT_PROOF_SQL=[
 'CREATE TABLE IF NOT EXISTS d6_publish_commit_verified (',
 'operation_id TEXT PRIMARY KEY NOT NULL,',
 'owner_github_id INTEGER NOT NULL,',
 'repository_id INTEGER NOT NULL,',
 'tree_request_sha256 TEXT NOT NULL,',
 'branch_request_sha256 TEXT NOT NULL,',
 'request_sha256 TEXT NOT NULL,',
 'source_revision TEXT NOT NULL,',
 'result_tree_sha TEXT NOT NULL,',
 'result_commit_sha TEXT NOT NULL,',
 'ref_name TEXT NOT NULL,',
 "state TEXT NOT NULL DEFAULT 'VerifiedCommit' CHECK(state='VerifiedCommit'),",
 'verified_at INTEGER NOT NULL',
 ');',
].join('\n');
export class D6PublishCommitError extends Error{
 constructor(code){super('D6 publication commit remains unverified');
  this.name='D6PublishCommitError';this.code=code;}
}
const deny=code=>{throw new D6PublishCommitError(code);};
const need=(value,code)=>{if(!value)deny(code);};
const plain=v=>v!==null&&typeof v==='object'&&
 !Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const branchName=id=>'refs/heads/fish-v3/publish/'+id;
const message=id=>'Fishing Companion V3 content update '+id;
function accepted(stored,id){
 const op=stored?.operation,pkg=stored?.package;
 need(UUID.test(id??'')&&op?.operationId===id&&
  op.ownerGitHubId===REPO.ownerGitHubId&&op.repositoryId===REPO.id&&
  op.ref===REPO.ref&&op.state==='Accepted'&&
  SHA.test(op.sourceRevision??'')&&DIGEST.test(op.snapshotSha256??'')&&
  ['gear','kb','catches'].includes(op.domain)&&
  ['add','edit'].includes(op.operation)&&op.recordId===pkg?.id&&
  pkg?.domain===op.domain&&pkg.operation===op.operation&&
  pkg.base?.sourceRevision===op.sourceRevision&&
  Array.isArray(stored.mediaTickets),'UNTRUSTED_OPERATION');
 return op;
}
function checkFence(row,op,step,digest,code){
 need(row?.operation_id===op.operationId&&row.step_key===step&&
  row.repository_id===REPO.id&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.request_sha256===digest&&row.state==='Unknown'&&
  Number.isSafeInteger(row.created_at)&&row.created_at>0,code);
}
function checkTree(op,action,fence,proof){
 checkFence(fence,op,'tree',action.requestSha256,'TREE_FENCE_UNVERIFIED');
 need(proof?.operation_id===op.operationId&&
  proof.owner_github_id===REPO.ownerGitHubId&&
  proof.repository_id===REPO.id&&
  proof.request_sha256===action.requestSha256&&
  proof.source_revision===op.sourceRevision&&
  proof.base_tree_sha===action.baseTreeSha&&
  SHA.test(proof.result_tree_sha??'')&&
  proof.result_tree_sha!==action.baseTreeSha&&
  proof.changed_paths===action.entryCount&&
  proof.state==='VerifiedTree'&&
  Number.isSafeInteger(proof.verified_at)&&
  proof.verified_at>=fence.created_at,'TREE_UNVERIFIED');
}
function checkBranch(op,action,fence,proof,treeProof){
 checkFence(fence,op,'branch',action.requestSha256,'BRANCH_FENCE_UNVERIFIED');
 need(proof?.operation_id===op.operationId&&
  proof.owner_github_id===REPO.ownerGitHubId&&
  proof.repository_id===REPO.id&&
  proof.request_sha256===action.requestSha256&&
  proof.tree_request_sha256===action.treeRequestSha256&&
  proof.source_revision===op.sourceRevision&&
  proof.base_tree_sha===action.baseTreeSha&&
  proof.result_tree_sha===treeProof.result_tree_sha&&
  proof.ref_name===branchName(op.operationId)&&
  proof.state==='VerifiedBranch'&&
  Number.isSafeInteger(proof.verified_at)&&
  proof.verified_at>=fence.created_at,
  'BRANCH_UNVERIFIED');
}
export async function describeD6PublishCommitStep({
 operation,treeAction,treeProof,branchAction,branchProof,
}={}){
 const op=accepted({operation,package:{
  id:operation?.recordId,domain:operation?.domain,
  operation:operation?.operation,
  base:{sourceRevision:operation?.sourceRevision},
 },mediaTickets:[]},operation?.operationId);
 need(treeAction?.operationId===op.operationId&&
  DIGEST.test(treeAction.requestSha256??'')&&
  treeProof?.state==='VerifiedTree'&&
  treeProof.request_sha256===treeAction.requestSha256&&
  SHA.test(treeProof.result_tree_sha??'')&&
  branchAction?.operationId===op.operationId&&
  branchAction.treeRequestSha256===treeAction.requestSha256&&
  DIGEST.test(branchAction.requestSha256??'')&&
  branchProof?.state==='VerifiedBranch'&&
  branchProof.request_sha256===branchAction.requestSha256&&
  branchProof.result_tree_sha===treeProof.result_tree_sha&&
  branchProof.ref_name===branchName(op.operationId),
  'UNVERIFIED_PREREQUISITES');
 const body={message:message(op.operationId),
  tree:treeProof.result_tree_sha,parents:[op.sourceRevision]};
 const url=API+'/git/commits';
 const requestSha256=await sha256(JSON.stringify({
  operationId:op.operationId,repositoryId:REPO.id,
  ownerGitHubId:REPO.ownerGitHubId,ref:REPO.ref,
  sourceRevision:op.sourceRevision,snapshotSha256:op.snapshotSha256,
  treeRequestSha256:treeAction.requestSha256,
  branchRequestSha256:branchAction.requestSha256,
  treeSha:treeProof.result_tree_sha,
  stepKey:'commit',method:'POST',url,body,
 }));
 return Object.freeze({operationId:op.operationId,stepKey:'commit',
  url,method:'POST',body,requestSha256,
  treeRequestSha256:treeAction.requestSha256,
  branchRequestSha256:branchAction.requestSha256,
  sourceRevision:op.sourceRevision,resultTreeSha:treeProof.result_tree_sha,
  refName:branchName(op.operationId)});
}
function status(action,attemptedNow=false){
 return Object.freeze({operationId:action.operationId,
  stepKey:'commit',requestSha256:action.requestSha256,state:'Unknown',
  attemptedNow,sourceOnly:true,canPublish:false,isLive:false,
  requiresIndependentCommitReadback:true,
  requiresDurableReconciliation:true});
}
function verified(row,action,sha,fence,at){
 need(row?.operation_id===action.operationId&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  row.tree_request_sha256===action.treeRequestSha256&&
  row.branch_request_sha256===action.branchRequestSha256&&
  row.request_sha256===action.requestSha256&&
  row.source_revision===action.sourceRevision&&
  row.result_tree_sha===action.resultTreeSha&&
  row.result_commit_sha===sha&&row.ref_name===action.refName&&
  row.state==='VerifiedCommit'&&
  Number.isSafeInteger(row.verified_at)&&
  row.verified_at>=fence.created_at&&row.verified_at<=at+60,
  'COMMIT_PROOF_MISMATCH');
 return Object.freeze({operationId:action.operationId,
  state:'VerifiedCommit',verifiedCommit:true,resultCommitSha:sha,
  resultTreeSha:action.resultTreeSha,refName:action.refName,
  originalRequestSha256:action.requestSha256,
  sourceOnly:true,canPublish:false,isLive:false,
  requiresGuardedBranchAdvance:true,requiresIndependentRefReadback:true,
  requiresGuardedPr:true});
}
async function boundedJson(response,url){
 need(response instanceof Response&&
  response.status===200&&!response.redirected&&
  (!response.url||response.url===url)&&
  /\bapplication\/(?:vnd\.github\+)?json\b/i.test(
   response.headers.get('Content-Type')??''),
  'COMMIT_READ_UNKNOWN');
 const len=response.headers.get('Content-Length');
 if(len!==null)need(/^\d+$/.test(len)&&
  Number(len)<=MAX_JSON,'COMMIT_READ_UNKNOWN');
 const reader=response.body?.getReader();
 need(reader,'COMMIT_READ_UNKNOWN');
 const chunks=[];let size=0;
 try{
  for(;;){
   const {done,value}=await reader.read();if(done)break;
   need(value instanceof Uint8Array,'COMMIT_READ_UNKNOWN');
   size+=value.length;need(size<=MAX_JSON,'COMMIT_READ_UNKNOWN');
   chunks.push(value);
  }
 }catch(e){
  try{await reader.cancel();}catch{}
  if(e instanceof D6PublishCommitError)throw e;
  deny('COMMIT_READ_UNKNOWN');
 }finally{try{reader.releaseLock();}catch{}}
 need(size>0,'COMMIT_READ_UNKNOWN');
 const bytes=new Uint8Array(size);let offset=0;
 for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true})
  .decode(bytes));}
 catch{deny('COMMIT_READ_UNKNOWN');}
}
export function createD6ProductionPublishCommitCoordinator({
 DB,session,loadAcceptedOperation,atomicPlanner,verifyPrerequisite,
 issueWriteToken,issueReadToken,storeCandidateCommitHint,
 loadCandidateCommitHint,request,
 enabled=()=>false,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(DB?.prepare&&typeof session?.authorizeWrite==='function'&&
  typeof atomicPlanner?.plan==='function'&&
  [loadAcceptedOperation,verifyPrerequisite,issueWriteToken,
   issueReadToken,storeCandidateCommitHint,
   loadCandidateCommitHint,request,enabled,now]
   .every(f=>typeof f==='function'),'INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 const read=async(sql,...args)=>{
  try{return await DB.prepare(sql).bind(...args).first();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 const insert=async(sql,...args)=>{
  try{return await DB.prepare(sql).bind(...args).run();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 async function prepare(authRequest,id){
  active();
  let owner;
  try{owner=await session.authorizeWrite(authRequest);}
  catch{deny('OWNER_DENIED');}
  need(owner?.authorized===true&&
   owner.ownerGitHubId===REPO.ownerGitHubId,'OWNER_DENIED');
  need(UUID.test(id??''),'INVALID_OPERATION');
  let stored;
  try{stored=await loadAcceptedOperation({
   operationId:id,ownerGitHubId:REPO.ownerGitHubId,
  });}catch{deny('OPERATION_UNAVAILABLE');}
  const op=accepted(stored,id);
  let treeAction;
  try{
   const plan=await atomicPlanner.plan({
    operation:op,package:stored.package,
    mediaTickets:stored.mediaTickets,
   });
   treeAction=await describeD6AtomicTreeStep({operation:op,plan});
  }catch{deny('ATOMIC_PLAN_UNVERIFIED');}
  const [tf,tp,bf,bp]=await Promise.all([
   read(sqlFence,id,'tree'),read(sqlTree,id),
   read(sqlFence,id,'branch'),read(sqlBranch,id),
  ]);
  checkTree(op,treeAction,tf,tp);
  let branchAction;
  try{branchAction=await describeD6PublishBranchStep({
   operation:op,treeAction,treeProof:tp,
  });}catch{deny('BRANCH_UNVERIFIED');}
  checkBranch(op,branchAction,bf,bp,tp);
  return {op,action:await describeD6PublishCommitStep({
   operation:op,treeAction,treeProof:tp,
   branchAction,branchProof:bp,
  })};
 }
 async function prerequisite(op,action){
  let result;
  try{result=await verifyPrerequisite({
   operationId:op.operationId,repositoryId:REPO.id,
   ownerGitHubId:REPO.ownerGitHubId,ref:REPO.ref,
   sourceRevision:op.sourceRevision,
   snapshotSha256:op.snapshotSha256,
   treeRequestSha256:action.treeRequestSha256,
   branchRequestSha256:action.branchRequestSha256,
   commitRequestSha256:action.requestSha256,
   resultTreeSha:action.resultTreeSha,
   branchRef:action.refName,branchHeadSha:op.sourceRevision,
  });}catch{deny('SOURCE_OR_BRANCH_MOVED');}
  need(result?.verified===true&&
   result.operationId===op.operationId&&
   result.repositoryId===REPO.id&&
   result.ownerGitHubId===REPO.ownerGitHubId&&
   result.ref===REPO.ref&&
   result.sourceRevision===op.sourceRevision&&
   result.snapshotSha256===op.snapshotSha256&&
   result.treeRequestSha256===action.treeRequestSha256&&
   result.branchRequestSha256===action.branchRequestSha256&&
   result.commitRequestSha256===action.requestSha256&&
   result.resultTreeSha===action.resultTreeSha&&
   result.branchRef===action.refName&&
   result.branchHeadSha===op.sourceRevision,
   'SOURCE_OR_BRANCH_MOVED');
 }
 async function attempt(authRequest,operationId){
  const {op,action}=await prepare(authRequest,operationId);
  const old=await read(sqlFence,operationId,'commit');
  if(old){
   checkFence(old,op,'commit',action.requestSha256,'COMMIT_FENCE_MISMATCH');
   return status(action);
  }
  await prerequisite(op,action);
  const at=now();need(Number.isSafeInteger(at)&&at>0,'INVALID_CLOCK');
  const claim=await insert(sqlFenceInsert(),operationId,'commit',
   REPO.ownerGitHubId,REPO.id,action.requestSha256,at);
  const fence=await read(sqlFence,operationId,'commit');
  checkFence(fence,op,'commit',action.requestSha256,'COMMIT_FENCE_MISMATCH');
  if(claim?.meta?.changes!==1)return status(action);
  active();
  let token;
  try{
   const grant=await issueWriteToken({
    repositoryId:REPO.id,permissions:WRITE});
   need(grant?.repositoryId===REPO.id&&
    plain(grant.permissions)&&grant.permissions.contents==='write'&&
    Object.keys(grant.permissions).length===1&&
    typeof grant.token==='string'&&grant.token.length>=20,
    'TOKEN_UNAVAILABLE');
   token=grant.token;
  }catch{return status(action);}
  active();await prerequisite(op,action);active();
  // The durable Unknown fence MUST exist before this sole provider POST.
  // Even a valid 201 is only a candidate, never VerifiedCommit or Live.
  try{
   const created=await request(action.url,{
    method:'POST',redirect:'manual',credentials:'omit',
    cache:'no-store',headers:{
     Authorization:'Bearer '+token,
     Accept:'application/vnd.github+json',
     'X-GitHub-Api-Version':'2026-03-10',
     'Content-Type':'application/json',
     'User-Agent':'fishing-d6-commit-source-only',
    },body:JSON.stringify(action.body),
   });
   if(!(created instanceof Response)||created.status!==201||
    created.redirected!==false||
    (created.url&&created.url!==action.url)||
    !/\bapplication\/(?:vnd\.github\+)?json\b/i.test(
     created.headers.get('Content-Type')??''))
    return status(action,true);
   const result=await readD6BoundedJson(created,MAX_JSON);
   if(!SHA.test(result?.sha??'')||result.sha===op.sourceRevision||
    result.message!==action.body.message||
    result.tree?.sha!==action.resultTreeSha||
    !Array.isArray(result.parents)||result.parents.length!==1||
    result.parents[0]?.sha!==op.sourceRevision)
    return status(action,true);
   await storeCandidateCommitHint({
    operationId,repositoryId:REPO.id,ref:REPO.ref,
    sourceRevision:op.sourceRevision,
    requestSha256:action.requestSha256,
    resultCommitSha:result.sha,
   });
  }catch{
   // Lost/invalid provider response or lost D1 custody ack leaves Unknown.
   // Reconcile only from an independently persisted candidate; never POST again.
   return status(action,true);
  }
  return status(action,true);
 }
 async function reconcile(authRequest,operationId){
  const {op,action}=await prepare(authRequest,operationId);
  const fence=await read(sqlFence,operationId,'commit');
  checkFence(fence,op,'commit',action.requestSha256,'COMMIT_FENCE_UNVERIFIED');
  await prerequisite(op,action);
  let hint;
  try{hint=await loadCandidateCommitHint({
   operationId,repositoryId:REPO.id,ref:REPO.ref,
   sourceRevision:op.sourceRevision,
   requestSha256:action.requestSha256,
  });}catch{deny('COMMIT_SHA_UNKNOWN');}
  need(hint?.provenance==='server-provider-result'&&
   hint.operationId===operationId&&hint.repositoryId===REPO.id&&
   hint.ref===REPO.ref&&hint.sourceRevision===op.sourceRevision&&
   hint.requestSha256===action.requestSha256&&
   SHA.test(hint.resultCommitSha??'')&&
   hint.resultCommitSha!==op.sourceRevision,
   'COMMIT_SHA_UNKNOWN');
  const sha=hint.resultCommitSha;
  let token;
  try{
   const grant=await issueReadToken({
    repositoryId:REPO.id,permissions:READ});
   need(grant?.repositoryId===REPO.id&&plain(grant.permissions)&&
    grant.permissions.contents==='read'&&
    Object.keys(grant.permissions).length===1&&
    typeof grant.token==='string'&&grant.token.length>=20,
    'TOKEN_UNAVAILABLE');
   token=grant.token;
  }catch{deny('TOKEN_UNAVAILABLE');}
  active();
  const url=API+'/git/commits/'+sha;
  let response;
  try{response=await request(url,{
   method:'GET',redirect:'manual',credentials:'omit',cache:'no-store',
   headers:{
    Authorization:'Bearer '+token,
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2026-03-10',
    'User-Agent':'fishing-d6-commit-readback-source-only',
   },
  });}catch{deny('COMMIT_READ_UNKNOWN');}
  const remote=await boundedJson(response,url);
  need(remote?.sha===sha&&remote.message===action.body.message&&
   remote.tree?.sha===action.resultTreeSha&&
   Array.isArray(remote.parents)&&remote.parents.length===1&&
   remote.parents[0]?.sha===op.sourceRevision,
   'COMMIT_UNVERIFIED');
  await prerequisite(op,action);
  active();
  const at=now();need(Number.isSafeInteger(at)&&at>0,'INVALID_CLOCK');
  await insert(insertProof,operationId,REPO.ownerGitHubId,REPO.id,
   action.treeRequestSha256,action.branchRequestSha256,
   action.requestSha256,op.sourceRevision,
   action.resultTreeSha,sha,action.refName,at);
  const receipt=await read(sqlCommit,operationId);
  return verified(receipt,action,sha,fence,at);
 }
 return Object.freeze({attempt,reconcile});
}
function sqlFenceInsert(){return insertFence;}
