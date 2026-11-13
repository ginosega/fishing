/**
 * FISH-TODO-118 WP3-3 — durable guarded publication-branch advance.
 * SOURCE ONLY / DEFAULT OFF / NO WORKER ROUTE.
 *
 * Requires original canonical operation, exact atomic tree plan and verified
 * Tree, Branch and Commit D1 receipts AND their sticky Unknown mutation fences.
 * The only potential mutation is one non-forced PATCH of the operation-owned
 * branch to the independently verified commit. A durable Unknown claim must
 * exist BEFORE issuing GitHub token and network mutation. No retry ever POSTs
 * or PATCHes a second time, even on HTTP success, timeout, or lost D1 ack.
 *
 * Only fresh GitHub GET ref + GET immutable commit + confirmed main and a
 * separate immutable VerifiedAdvance D1 receipt can reconcile success.
 * Does not create PR, merge, publish, or mark public Live. D1 schema below is
 * a source-only proposal, NOT installed or provisioned.
 */
import {sha256} from '../../../../pwa/src/shared.mjs';
import {describeD6AtomicTreeStep}
 from './d6-production-atomic-tree-step.mjs';
import {describeD6PublishBranchStep}
 from './d6-production-publish-branch-coordinator.mjs';
import {describeD6PublishCommitStep}
 from './d6-production-publish-commit-coordinator.mjs';
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const API='https://api.github.com/repos/'+REPO.name;
const SHA=/^[0-9a-f]{40}$/,DIGEST=/^[0-9a-f]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[a-f0-9]{12}$/i;
const WRITE=Object.freeze({contents:'write'}),READ=Object.freeze({contents:'read'});
const MAX_JSON=65536,WHEN_SKEW=60;
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
const sqlAdvance='SELECT operation_id,owner_github_id,repository_id,'+
 'tree_request_sha256,branch_request_sha256,commit_request_sha256,'+
 'request_sha256,source_revision,result_tree_sha,result_commit_sha,'+
 'ref_name,state,verified_at FROM d6_publish_advance_verified '+
 'WHERE operation_id=?';
const insertFence='INSERT OR IGNORE INTO d6_provider_step_fences '+
 '(operation_id,step_key,owner_github_id,repository_id,request_sha256,'+
 "state,created_at) VALUES (?,?,?,?,?,'Unknown',?)";
const insertProof='INSERT OR IGNORE INTO d6_publish_advance_verified '+
 '(operation_id,owner_github_id,repository_id,tree_request_sha256,'+
 'branch_request_sha256,commit_request_sha256,request_sha256,'+
 'source_revision,result_tree_sha,result_commit_sha,ref_name,'+
 "state,verified_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,'VerifiedAdvance',?)";
export const D6_PUBLISH_ADVANCE_PROOF_SQL=[
 'CREATE TABLE IF NOT EXISTS d6_publish_advance_verified (',
 'operation_id TEXT PRIMARY KEY NOT NULL,',
 'owner_github_id INTEGER NOT NULL,',
 'repository_id INTEGER NOT NULL,',
 'tree_request_sha256 TEXT NOT NULL,',
 'branch_request_sha256 TEXT NOT NULL,',
 'commit_request_sha256 TEXT NOT NULL,',
 'request_sha256 TEXT NOT NULL,',
 'source_revision TEXT NOT NULL,',
 'result_tree_sha TEXT NOT NULL,',
 'result_commit_sha TEXT NOT NULL,',
 'ref_name TEXT NOT NULL,',
 "state TEXT NOT NULL DEFAULT 'VerifiedAdvance' CHECK(state='VerifiedAdvance'),",
 'verified_at INTEGER NOT NULL',
 ');',
].join('\n');

export class D6PublishAdvanceError extends Error{
 constructor(code){super('D6 publication branch advancement unverified');
  this.name='D6PublishAdvanceError';this.code=code;}
}
const deny=code=>{throw new D6PublishAdvanceError(code);};
const need=(yes,code)=>{if(!yes)deny(code);};
const plain=x=>x!==null&&typeof x==='object'&&
 !Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const branch=id=>'refs/heads/fish-v3/publish/'+id;
const branchEndpoint=id=>API+'/git/refs/heads/fish-v3/publish/'+id;
const message=id=>'Fishing Companion V3 content update '+id;
function trustedOperation(stored,id){
 const op=stored?.operation,pkg=stored?.package;
 need(UUID.test(id??'')&&op?.operationId===id&&
  op.state==='Accepted'&&op.repositoryId===REPO.id&&
  op.ownerGitHubId===REPO.ownerGitHubId&&op.ref===REPO.ref&&
  SHA.test(op.sourceRevision??'')&&DIGEST.test(op.snapshotSha256??'')&&
  ['gear','kb','catches'].includes(op.domain)&&
  ['add','edit'].includes(op.operation)&&
  op.domain===pkg?.domain&&op.operation===pkg?.operation&&
  op.recordId===pkg?.id&&pkg.base?.sourceRevision===op.sourceRevision&&
  Array.isArray(stored.mediaTickets),'UNTRUSTED_OPERATION');
 return op;
}
function fence(row,op,step,requestSha256){
 need(row?.operation_id===op.operationId&&
  row.step_key===step&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  row.request_sha256===requestSha256&&
  row.state==='Unknown'&&
  Number.isSafeInteger(row.created_at)&&row.created_at>0,
  'FENCE_UNVERIFIED');
}
function treeProof(row,op,action,f){
 need(row?.operation_id===op.operationId&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  row.request_sha256===action.requestSha256&&
  row.source_revision===op.sourceRevision&&
  row.base_tree_sha===action.baseTreeSha&&
  row.changed_paths===action.entryCount&&
  SHA.test(row.result_tree_sha??'')&&
  row.result_tree_sha!==action.baseTreeSha&&
  row.state==='VerifiedTree'&&
  Number.isSafeInteger(row.verified_at)&&row.verified_at>=f.created_at,
  'TREE_UNVERIFIED');
}
function branchProof(row,op,action,tree,f){
 need(row?.operation_id===op.operationId&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  row.tree_request_sha256===action.treeRequestSha256&&
  row.request_sha256===action.requestSha256&&
  row.source_revision===op.sourceRevision&&
  row.base_tree_sha===action.baseTreeSha&&
  row.result_tree_sha===tree.result_tree_sha&&
  row.ref_name===branch(op.operationId)&&
  row.state==='VerifiedBranch'&&
  Number.isSafeInteger(row.verified_at)&&row.verified_at>=f.created_at,
  'BRANCH_UNVERIFIED');
}
function commitProof(row,op,action,tree,f){
 need(row?.operation_id===op.operationId&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  row.tree_request_sha256===action.treeRequestSha256&&
  row.branch_request_sha256===action.branchRequestSha256&&
  row.request_sha256===action.requestSha256&&
  row.source_revision===op.sourceRevision&&
  row.result_tree_sha===tree.result_tree_sha&&
  SHA.test(row.result_commit_sha??'')&&
  row.result_commit_sha!==op.sourceRevision&&
  row.ref_name===branch(op.operationId)&&
  row.state==='VerifiedCommit'&&
  Number.isSafeInteger(row.verified_at)&&row.verified_at>=f.created_at,
  'COMMIT_UNVERIFIED');
}
export async function describeD6PublishAdvanceStep({
 operation,treeAction,branchAction,commitAction,commitReceipt,
}={}){
 const op=trustedOperation({operation,package:{
  id:operation?.recordId,domain:operation?.domain,
  operation:operation?.operation,base:{sourceRevision:operation?.sourceRevision},
 },mediaTickets:[]},operation?.operationId);
 need(commitAction?.operationId===op.operationId&&
  treeAction?.operationId===op.operationId&&
  branchAction?.operationId===op.operationId&&
  DIGEST.test(treeAction.requestSha256??'')&&
  DIGEST.test(branchAction.requestSha256??'')&&
  DIGEST.test(commitAction.requestSha256??'')&&
  commitAction.treeRequestSha256===treeAction.requestSha256&&
  commitAction.branchRequestSha256===branchAction.requestSha256&&
  commitAction.sourceRevision===op.sourceRevision&&
  commitAction.refName===branch(op.operationId)&&
  commitReceipt?.state==='VerifiedCommit'&&
  commitReceipt.request_sha256===commitAction.requestSha256&&
  commitReceipt.source_revision===op.sourceRevision&&
  commitReceipt.result_tree_sha===commitAction.resultTreeSha&&
  SHA.test(commitReceipt.result_commit_sha??'')&&
  commitReceipt.result_commit_sha!==op.sourceRevision,
  'UNVERIFIED_COMMIT');
 const body={sha:commitReceipt.result_commit_sha,force:false};
 const url=branchEndpoint(op.operationId);
 const requestSha256=await sha256(JSON.stringify({
  operationId:op.operationId,ownerGitHubId:REPO.ownerGitHubId,
  repositoryId:REPO.id,ref:REPO.ref,
  sourceRevision:op.sourceRevision,snapshotSha256:op.snapshotSha256,
  treeRequestSha256:treeAction.requestSha256,
  branchRequestSha256:branchAction.requestSha256,
  commitRequestSha256:commitAction.requestSha256,
  treeSha:commitAction.resultTreeSha,
  refName:branch(op.operationId),
  stepKey:'advance',url,method:'PATCH',body,
 }));
 return Object.freeze({operationId:op.operationId,stepKey:'advance',
  url,method:'PATCH',body,requestSha256,
  treeRequestSha256:treeAction.requestSha256,
  branchRequestSha256:branchAction.requestSha256,
  commitRequestSha256:commitAction.requestSha256,
  sourceRevision:op.sourceRevision,
  resultTreeSha:commitAction.resultTreeSha,
  resultCommitSha:body.sha,refName:branch(op.operationId)});
}
function unknown(action,attemptedNow=false){
 return Object.freeze({operationId:action.operationId,
  stepKey:'advance',requestSha256:action.requestSha256,
  state:'Unknown',attemptedNow,sourceOnly:true,
  canCreatePr:false,canPublish:false,isLive:false,
  requiresIndependentRefReadback:true,
  requiresDurableReconciliation:true});
}
function verified(row,action,f,now){
 need(row?.operation_id===action.operationId&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  row.tree_request_sha256===action.treeRequestSha256&&
  row.branch_request_sha256===action.branchRequestSha256&&
  row.commit_request_sha256===action.commitRequestSha256&&
  row.request_sha256===action.requestSha256&&
  row.source_revision===action.sourceRevision&&
  row.result_tree_sha===action.resultTreeSha&&
  row.result_commit_sha===action.resultCommitSha&&
  row.ref_name===action.refName&&row.state==='VerifiedAdvance'&&
  Number.isSafeInteger(row.verified_at)&&
  row.verified_at>=f.created_at&&row.verified_at<=now+WHEN_SKEW,
  'ADVANCE_PROOF_MISMATCH');
 return Object.freeze({operationId:action.operationId,
  state:'VerifiedAdvance',verifiedAdvance:true,
  resultCommitSha:action.resultCommitSha,
  refName:action.refName,originalRequestSha256:action.requestSha256,
  sourceOnly:true,canCreatePr:false,canPublish:false,isLive:false,
  requiresGuardedPr:true,requiresIndependentPrReadback:true});
}
async function json(response,url){
 need(response instanceof Response&&response.status===200&&
  response.redirected===false&&(!response.url||response.url===url)&&
  /\bapplication\/(?:vnd\.github\+)?json\b/i.test(
   response.headers.get('Content-Type')??''),
  'GITHUB_READ_UNKNOWN');
 const length=response.headers.get('Content-Length');
 if(length!==null)need(/^\d+$/.test(length)&&
  Number(length)<=MAX_JSON,'GITHUB_READ_UNKNOWN');
 const reader=response.body?.getReader();
 need(reader,'GITHUB_READ_UNKNOWN');
 const chunks=[];let size=0;
 try{
  for(;;){
   const {done,value}=await reader.read();if(done)break;
   need(value instanceof Uint8Array,'GITHUB_READ_UNKNOWN');
   size+=value.byteLength;need(size<=MAX_JSON,'GITHUB_READ_UNKNOWN');
   chunks.push(value);
  }
 }catch(e){
  try{await reader.cancel();}catch{}
  if(e instanceof D6PublishAdvanceError)throw e;
  deny('GITHUB_READ_UNKNOWN');
 }finally{try{reader.releaseLock();}catch{}}
 need(size>0,'GITHUB_READ_UNKNOWN');
 const bytes=new Uint8Array(size);let at=0;
 for(const part of chunks){bytes.set(part,at);at+=part.length;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
 catch{deny('GITHUB_READ_UNKNOWN');}
}
export function createD6ProductionPublishAdvanceCoordinator({
 DB,session,loadAcceptedOperation,atomicPlanner,verifyPrerequisite,
 issueWriteToken,issueReadToken,request,
 enabled=()=>false,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(DB?.prepare&&typeof session?.authorizeWrite==='function'&&
  typeof atomicPlanner?.plan==='function'&&
  [loadAcceptedOperation,verifyPrerequisite,issueWriteToken,
   issueReadToken,request,enabled,now].every(fn=>typeof fn==='function'),
  'INVALID_CONFIG');
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
  active();let owner;
  try{owner=await session.authorizeWrite(authRequest);}
  catch{deny('OWNER_DENIED');}
  need(owner?.authorized===true&&
   owner.ownerGitHubId===REPO.ownerGitHubId,'OWNER_DENIED');
  need(UUID.test(id??''),'INVALID_OPERATION');
  let stored;
  try{stored=await loadAcceptedOperation({
   operationId:id,ownerGitHubId:REPO.ownerGitHubId,
  });}catch{deny('OPERATION_UNAVAILABLE');}
  const op=trustedOperation(stored,id);
  let treeAction;
  try{
   const plan=await atomicPlanner.plan({
    operation:op,package:stored.package,
    mediaTickets:stored.mediaTickets,
   });
   treeAction=await describeD6AtomicTreeStep({operation:op,plan});
  }catch{deny('ATOMIC_PLAN_UNVERIFIED');}
  const [tf,tp,bf,bp,cf,cp]=await Promise.all([
   read(sqlFence,id,'tree'),read(sqlTree,id),
   read(sqlFence,id,'branch'),read(sqlBranch,id),
   read(sqlFence,id,'commit'),read(sqlCommit,id),
  ]);
  fence(tf,op,'tree',treeAction.requestSha256);
  treeProof(tp,op,treeAction,tf);
  let branchAction;
  try{branchAction=await describeD6PublishBranchStep({
   operation:op,treeAction,treeProof:tp});
  }catch{deny('BRANCH_UNVERIFIED');}
  fence(bf,op,'branch',branchAction.requestSha256);
  branchProof(bp,op,branchAction,tp,bf);
  let commitAction;
  try{commitAction=await describeD6PublishCommitStep({
   operation:op,treeAction,treeProof:tp,
   branchAction,branchProof:bp,
  });}catch{deny('COMMIT_UNVERIFIED');}
  fence(cf,op,'commit',commitAction.requestSha256);
  commitProof(cp,op,commitAction,tp,cf);
  const action=await describeD6PublishAdvanceStep({
   operation:op,treeAction,branchAction,commitAction,commitReceipt:cp});
  return {op,action};
 }
 async function prerequisite(op,action,branchHeadSha){
  let result;
  try{result=await verifyPrerequisite({
   operationId:op.operationId,repositoryId:REPO.id,
   ownerGitHubId:REPO.ownerGitHubId,ref:REPO.ref,
   sourceRevision:op.sourceRevision,snapshotSha256:op.snapshotSha256,
   treeRequestSha256:action.treeRequestSha256,
   branchRequestSha256:action.branchRequestSha256,
   commitRequestSha256:action.commitRequestSha256,
   advanceRequestSha256:action.requestSha256,
   resultTreeSha:action.resultTreeSha,
   resultCommitSha:action.resultCommitSha,
   branchRef:action.refName,branchHeadSha,
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
   result.commitRequestSha256===action.commitRequestSha256&&
   result.advanceRequestSha256===action.requestSha256&&
   result.resultTreeSha===action.resultTreeSha&&
   result.resultCommitSha===action.resultCommitSha&&
   result.branchRef===action.refName&&
   result.branchHeadSha===branchHeadSha,
   'SOURCE_OR_BRANCH_MOVED');
 }
 async function attempt(authRequest,operationId){
  const {op,action}=await prepare(authRequest,operationId);
  const prior=await read(sqlFence,operationId,'advance');
  if(prior){
   fence(prior,op,'advance',action.requestSha256);
   return unknown(action);
  }
  await prerequisite(op,action,op.sourceRevision);
  const at=now();need(Number.isSafeInteger(at)&&at>0,'INVALID_CLOCK');
  const claim=await insert(insertFence,operationId,'advance',
   REPO.ownerGitHubId,REPO.id,action.requestSha256,at);
  const row=await read(sqlFence,operationId,'advance');
  fence(row,op,'advance',action.requestSha256);
  if(claim?.meta?.changes!==1)return unknown(action);
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
  }catch{return unknown(action);}
  active();
  await prerequisite(op,action,op.sourceRevision);
  active();
  try{await request(action.url,{
   method:'PATCH',redirect:'manual',cache:'no-store',
   credentials:'omit',headers:{
    Authorization:'Bearer '+token,
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2026-03-10',
    'Content-Type':'application/json',
    'User-Agent':'fishing-d6-advance-source-only',
   },body:JSON.stringify(action.body),
  });}catch{return unknown(action,true);}
  return unknown(action,true);
 }
 async function reconcile(authRequest,operationId){
  const {op,action}=await prepare(authRequest,operationId);
  const row=await read(sqlFence,operationId,'advance');
  fence(row,op,'advance',action.requestSha256);
  // Advancing a branch changes its HEAD; do not require original HEAD here.
  await prerequisite(op,action,action.resultCommitSha);
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
  const github=async url=>{
   active();
   need(url.startsWith(API+'/git/'),'UNSAFE_GITHUB_URL');
   let response;
   try{response=await request(url,{
    method:'GET',redirect:'manual',cache:'no-store',credentials:'omit',
    headers:{
     Authorization:'Bearer '+token,
     Accept:'application/vnd.github+json',
     'X-GitHub-Api-Version':'2026-03-10',
     'User-Agent':'fishing-d6-advance-readback-source-only',
    },
   });}catch{deny('GITHUB_READ_UNKNOWN');}
   return json(response,url);
  };
  const pointer=await github(API+'/git/ref/heads/main');
  need(pointer?.ref===REPO.ref&&
   pointer.object?.type==='commit'&&
   pointer.object.sha===op.sourceRevision,
   'SOURCE_MOVED');
  const ref=await github(action.url);
  need(ref?.ref===action.refName&&
   ref.object?.type==='commit'&&
   ref.object.sha===action.resultCommitSha,
   'REF_UNVERIFIED');
  const commit=await github(API+'/git/commits/'+action.resultCommitSha);
  need(commit?.sha===action.resultCommitSha&&
   commit.message===message(op.operationId)&&
   commit.tree?.sha===action.resultTreeSha&&
   Array.isArray(commit.parents)&&commit.parents.length===1&&
   commit.parents[0]?.sha===op.sourceRevision,
   'COMMIT_UNVERIFIED');
  const pointerAfter=await github(API+'/git/ref/heads/main');
  need(pointerAfter?.ref===REPO.ref&&
   pointerAfter.object?.type==='commit'&&
   pointerAfter.object.sha===op.sourceRevision,
   'SOURCE_MOVED');
  await prerequisite(op,action,action.resultCommitSha);
  active();
  const at=now();need(Number.isSafeInteger(at)&&at>0,'INVALID_CLOCK');
  await insert(insertProof,operationId,REPO.ownerGitHubId,REPO.id,
   action.treeRequestSha256,action.branchRequestSha256,
   action.commitRequestSha256,action.requestSha256,
   op.sourceRevision,action.resultTreeSha,action.resultCommitSha,
   action.refName,at);
  const receipt=await read(sqlAdvance,operationId);
  return verified(receipt,action,row,at);
 }
 return Object.freeze({attempt,reconcile});
}
