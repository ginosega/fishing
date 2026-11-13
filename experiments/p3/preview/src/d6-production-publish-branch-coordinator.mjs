/**
 * FISH118 WP3-3 — publication BRANCH coordination after verified atomic tree.
 *
 * SOURCE ONLY / DEFAULT OFF / NO ROUTE. The operation must have an accepted
 * canonical package, an independently verified #472 atomic Git tree D1 proof
 * and the exact immutable Unknown tree-step fence before a branch can be
 * attempted. The D1 Unknown branch fence is written BEFORE any GitHub POST.
 *
 * Independent Git GET /git/ref/heads/... and durable VerifiedBranch proof are
 * required before any future commit step. HTTP 201, timeouts, lost D1 acks,
 * concurrency and a foreign existing branch never authorize blind replay,
 * commit, PR, merge or public Live.
 *
 * No new permission, D1 schema deployment, secret, Worker route, GitHub
 * mutation, hosted provider activation or production release is performed
 * by importing this source-only adapter.
 */
import {sha256} from '../../../../pwa/src/shared.mjs';
import {describeD6AtomicTreeStep}
 from './d6-production-atomic-tree-step.mjs';
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const BASE='https://api.github.com/repos/'+REPO.name;
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const SCOPE_WRITE=Object.freeze({contents:'write'});
const SCOPE_READ=Object.freeze({contents:'read'});
const MAX_JSON=65536;
const selectFence='SELECT operation_id,step_key,owner_github_id,'+
 'repository_id,request_sha256,state,created_at '+
 'FROM d6_provider_step_fences WHERE operation_id=? AND step_key=?';
const selectTree='SELECT operation_id,owner_github_id,repository_id,'+
 'request_sha256,source_revision,base_tree_sha,result_tree_sha,'+
 'changed_paths,state,verified_at FROM d6_atomic_tree_verified '+
 'WHERE operation_id=?';
const selectBranch='SELECT operation_id,owner_github_id,repository_id,'+
 'tree_request_sha256,request_sha256,source_revision,base_tree_sha,'+
 'result_tree_sha,ref_name,state,verified_at '+
 'FROM d6_publish_branch_verified WHERE operation_id=?';
const insertFence='INSERT OR IGNORE INTO d6_provider_step_fences '+
 '(operation_id,step_key,owner_github_id,repository_id,request_sha256,'+
 "state,created_at) VALUES (?,?,?,?,?,'Unknown',?)";
const insertBranch='INSERT OR IGNORE INTO d6_publish_branch_verified '+
 '(operation_id,owner_github_id,repository_id,tree_request_sha256,'+
 'request_sha256,source_revision,base_tree_sha,result_tree_sha,'+
 "ref_name,state,verified_at) VALUES (?,?,?,?,?,?,?,?,?,'VerifiedBranch',?)";
export const D6_PUBLISH_BRANCH_PROOF_SQL=[
 'CREATE TABLE IF NOT EXISTS d6_publish_branch_verified (',
 'operation_id TEXT PRIMARY KEY NOT NULL,',
 'owner_github_id INTEGER NOT NULL,',
 'repository_id INTEGER NOT NULL,',
 'tree_request_sha256 TEXT NOT NULL,',
 'request_sha256 TEXT NOT NULL,',
 'source_revision TEXT NOT NULL,',
 'base_tree_sha TEXT NOT NULL,',
 'result_tree_sha TEXT NOT NULL,',
 'ref_name TEXT NOT NULL,',
 "state TEXT NOT NULL DEFAULT 'VerifiedBranch' CHECK(state='VerifiedBranch'),",
 'verified_at INTEGER NOT NULL',
 ');',
].join('\n');

export class D6PublishBranchError extends Error{
 constructor(code){super('D6 publication branch remains unverified');
  this.name='D6PublishBranchError';this.code=code;}
}
const deny=code=>{throw new D6PublishBranchError(code);};
const need=(v,code)=>{if(!v)deny(code);};
const plain=v=>v!==null&&typeof v==='object'&&
 !Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const branchName=id=>'fish-v3/publish/'+id;
const fullRef=id=>'refs/heads/'+branchName(id);
function accepted(stored,id){
 const op=stored?.operation,pkg=stored?.package;
 need(op?.operationId===id&&UUID.test(id??'')&&
  op.ownerGitHubId===REPO.ownerGitHubId&&
  op.repositoryId===REPO.id&&op.ref===REPO.ref&&
  op.state==='Accepted'&&SHA.test(op.sourceRevision??'')&&
  DIGEST.test(op.snapshotSha256??'')&&
  ['gear','kb','catches'].includes(op.domain)&&
  ['add','edit'].includes(op.operation)&&
  op.recordId===pkg?.id&&op.domain===pkg?.domain&&
  op.operation===pkg?.operation&&
  pkg.base?.sourceRevision===op.sourceRevision&&
  Array.isArray(stored.mediaTickets),'UNTRUSTED_OPERATION');
 return op;
}
function checkedTree(op,treeAction,treeFence,treeProof){
 need(treeFence?.operation_id===op.operationId&&
  treeFence.step_key==='tree'&&
  treeFence.owner_github_id===REPO.ownerGitHubId&&
  treeFence.repository_id===REPO.id&&
  treeFence.state==='Unknown'&&
  treeFence.request_sha256===treeAction.requestSha256&&
  Number.isSafeInteger(treeFence.created_at)&&
  treeFence.created_at>0,'TREE_FENCE_UNVERIFIED');
 need(treeProof?.operation_id===op.operationId&&
  treeProof.owner_github_id===REPO.ownerGitHubId&&
  treeProof.repository_id===REPO.id&&
  treeProof.request_sha256===treeAction.requestSha256&&
  treeProof.source_revision===op.sourceRevision&&
  treeProof.base_tree_sha===treeAction.baseTreeSha&&
  SHA.test(treeProof.result_tree_sha??'')&&
  treeProof.result_tree_sha!==treeAction.baseTreeSha&&
  treeProof.changed_paths===treeAction.entryCount&&
  treeProof.state==='VerifiedTree'&&
  Number.isSafeInteger(treeProof.verified_at)&&
  treeProof.verified_at>=treeFence.created_at,
  'TREE_PROOF_UNVERIFIED');
}
export async function describeD6PublishBranchStep({
 operation,treeAction,treeProof,
}={}){
 const op=accepted({operation,package:{
  id:operation?.recordId,domain:operation?.domain,
  operation:operation?.operation,
  base:{sourceRevision:operation?.sourceRevision},
 },mediaTickets:[]},operation?.operationId);
 need(treeAction?.operationId===op.operationId&&
  DIGEST.test(treeAction.requestSha256??'')&&
  SHA.test(treeAction.baseTreeSha??'')&&
  treeProof?.state==='VerifiedTree'&&
  treeProof.request_sha256===treeAction.requestSha256&&
  treeProof.base_tree_sha===treeAction.baseTreeSha&&
  treeProof.source_revision===op.sourceRevision&&
  SHA.test(treeProof.result_tree_sha??''),
  'UNTRUSTED_TREE');
 const url=BASE+'/git/refs';
 const body={ref:fullRef(op.operationId),sha:op.sourceRevision};
 const requestSha256=await sha256(JSON.stringify({
  operationId:op.operationId,ownerGitHubId:REPO.ownerGitHubId,
  repositoryId:REPO.id,ref:REPO.ref,
  sourceRevision:op.sourceRevision,snapshotSha256:op.snapshotSha256,
  treeRequestSha256:treeAction.requestSha256,
  baseTreeSha:treeAction.baseTreeSha,
  resultTreeSha:treeProof.result_tree_sha,
  stepKey:'branch',method:'POST',url,body,
 }));
 return Object.freeze({
  operationId:op.operationId,stepKey:'branch',url,method:'POST',
  body,requestSha256,treeRequestSha256:treeAction.requestSha256,
  sourceRevision:op.sourceRevision,baseTreeSha:treeAction.baseTreeSha,
  resultTreeSha:treeProof.result_tree_sha,refName:body.ref,
 });
}
function checkedFence(row,claim){
 need(row?.operation_id===claim.operationId&&
  row.step_key==='branch'&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  row.request_sha256===claim.requestSha256&&
  row.state==='Unknown'&&
  Number.isSafeInteger(row.created_at)&&row.created_at>0,
  'BRANCH_FENCE_MISMATCH');
}
function proof(row,claim,now,fence){
 need(row?.operation_id===claim.operationId&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  row.tree_request_sha256===claim.treeRequestSha256&&
  row.request_sha256===claim.requestSha256&&
  row.source_revision===claim.sourceRevision&&
  row.base_tree_sha===claim.baseTreeSha&&
  row.result_tree_sha===claim.resultTreeSha&&
  row.ref_name===claim.refName&&
  row.state==='VerifiedBranch'&&
  Number.isSafeInteger(row.verified_at)&&
  row.verified_at>=fence.created_at&&
  row.verified_at<=now+60,'BRANCH_PROOF_MISMATCH');
 return Object.freeze({
  operationId:claim.operationId,refName:claim.refName,
  state:'VerifiedBranch',verifiedBranch:true,
  treeRequestSha256:claim.treeRequestSha256,
  originalRequestSha256:claim.requestSha256,
  baseTreeSha:claim.baseTreeSha,resultTreeSha:claim.resultTreeSha,
  verifiedAt:row.verified_at,sourceOnly:true,
  canCommit:false,canPublish:false,isLive:false,
  requiresDurableCommitFence:true,
  requiresIndependentCommitReadback:true,
 });
}
function status(claim,attemptedNow=false){
 return Object.freeze({
  operationId:claim.operationId,state:'Unknown',
  stepKey:'branch',requestSha256:claim.requestSha256,
  attemptedNow,sourceOnly:true,canPublish:false,isLive:false,
  requiresIndependentBranchReadback:true,
  requiresDurableReconciliation:true,
 });
}
async function boundedJson(response,url){
 need(response instanceof Response&&response.status===200&&
  response.redirected===false&&(!response.url||response.url===url)&&
  /\bapplication\/json\b/i.test(
   response.headers.get('Content-Type')??''),'BRANCH_READ_UNKNOWN');
 const length=response.headers.get('Content-Length');
 if(length!==null)need(/^[0-9]+$/.test(length)&&
  Number(length)<=MAX_JSON,'BRANCH_READ_UNKNOWN');
 const reader=response.body?.getReader();
 need(reader,'BRANCH_READ_UNKNOWN');
 const chunks=[];let size=0;
 try{
  for(;;){
   const {done,value}=await reader.read();if(done)break;
   need(value instanceof Uint8Array,'BRANCH_READ_UNKNOWN');
   size+=value.length;
   need(size<=MAX_JSON,'BRANCH_READ_UNKNOWN');
   chunks.push(value);
  }
 }catch(e){
  try{await reader.cancel();}catch{}
  if(e instanceof D6PublishBranchError)throw e;
  deny('BRANCH_READ_UNKNOWN');
 }finally{try{reader.releaseLock();}catch{}}
 need(size>0,'BRANCH_READ_UNKNOWN');
 let raw='';
 try{
  const data=new Uint8Array(size);let pos=0;
  for(const chunk of chunks){data.set(chunk,pos);pos+=chunk.length;}
  raw=new TextDecoder('utf-8',{fatal:true}).decode(data);
  return JSON.parse(raw);
 }catch{deny('BRANCH_READ_UNKNOWN');}
}
export function createD6ProductionPublishBranchCoordinator({
 DB,session,loadAcceptedOperation,atomicPlanner,
 verifyCurrentMain,issueWriteToken,issueReadToken,request,
 enabled=()=>false,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(DB?.prepare&&typeof session?.authorizeWrite==='function'&&
  typeof atomicPlanner?.plan==='function'&&
  [loadAcceptedOperation,verifyCurrentMain,issueWriteToken,
   issueReadToken,request,enabled,now].every(f=>typeof f==='function'),
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
  const [treeFence,treeProof]=await Promise.all([
   read(selectFence,id,'tree'),read(selectTree,id),
  ]);
  checkedTree(op,treeAction,treeFence,treeProof);
  return {op,claim:await describeD6PublishBranchStep({
   operation:op,treeAction,treeProof,
  })};
 }
 async function main(op,claim){
  let evidence;
  try{evidence=await verifyCurrentMain({
   operationId:op.operationId,repositoryId:REPO.id,
   ownerGitHubId:REPO.ownerGitHubId,ref:REPO.ref,
   sourceRevision:op.sourceRevision,
   snapshotSha256:op.snapshotSha256,
   baseTreeSha:claim.baseTreeSha,
   treeRequestSha256:claim.treeRequestSha256,
   branchRequestSha256:claim.requestSha256,
  });}catch{deny('SOURCE_MOVED');}
  need(evidence?.verified===true&&
   evidence.operationId===op.operationId&&
   evidence.repositoryId===REPO.id&&
   evidence.ownerGitHubId===REPO.ownerGitHubId&&
   evidence.ref===REPO.ref&&
   evidence.sourceRevision===op.sourceRevision&&
   evidence.snapshotSha256===op.snapshotSha256&&
   evidence.baseTreeSha===claim.baseTreeSha&&
   evidence.treeRequestSha256===claim.treeRequestSha256&&
   evidence.branchRequestSha256===claim.requestSha256,
   'SOURCE_MOVED');
 }
 async function attempt(authRequest,operationId){
  const {op,claim}=await prepare(authRequest,operationId);
  const prior=await read(selectFence,operationId,'branch');
  if(prior){
   checkedFence(prior,claim);
   return status(claim);
  }
  await main(op,claim);
  const at=now();
  need(Number.isSafeInteger(at)&&at>0,'INVALID_CLOCK');
  const inserted=await insert(insertFence,
   operationId,'branch',REPO.ownerGitHubId,REPO.id,
   claim.requestSha256,at);
  const fence=await read(selectFence,operationId,'branch');
  checkedFence(fence,claim);
  if(inserted?.meta?.changes!==1)return status(claim);
  active();
  let token;
  try{
   const grant=await issueWriteToken({
    repositoryId:REPO.id,permissions:SCOPE_WRITE,
   });
   need(grant?.repositoryId===REPO.id&&
    plain(grant.permissions)&&grant.permissions.contents==='write'&&
    Object.keys(grant.permissions).length===1&&
    typeof grant.token==='string'&&grant.token.length>=20,
    'TOKEN_UNAVAILABLE');
   token=grant.token;
  }catch{return status(claim);}
  active();
  await main(op,claim);
  active();
  try{
   await request(claim.url,{
    method:'POST',redirect:'manual',cache:'no-store',
    credentials:'omit',headers:{
     Authorization:'Bearer '+token,
     Accept:'application/vnd.github+json',
     'X-GitHub-Api-Version':'2026-03-10',
     'Content-Type':'application/json',
     'User-Agent':'fishing-d6-branch-source-only',
    },
    body:JSON.stringify(claim.body),
   });
  }catch{return status(claim,true);}
  // Every HTTP response, including 201, stays Unknown until GET proof.
  return status(claim,true);
 }
 async function reconcile(authRequest,operationId){
  const {op,claim}=await prepare(authRequest,operationId);
  const fence=await read(selectFence,operationId,'branch');
  checkedFence(fence,claim);
  await main(op,claim);
  let token;
  try{
   const grant=await issueReadToken({
    repositoryId:REPO.id,permissions:SCOPE_READ,
   });
   need(grant?.repositoryId===REPO.id&&plain(grant.permissions)&&
    grant.permissions.contents==='read'&&
    Object.keys(grant.permissions).length===1&&
    typeof grant.token==='string'&&grant.token.length>=20,
    'TOKEN_UNAVAILABLE');
   token=grant.token;
  }catch{deny('TOKEN_UNAVAILABLE');}
  active();
  const url=BASE+'/git/ref/heads/'+branchName(operationId);
  let response;
  try{
   response=await request(url,{
    method:'GET',redirect:'manual',cache:'no-store',
    credentials:'omit',headers:{
     Authorization:'Bearer '+token,
     Accept:'application/vnd.github+json',
     'X-GitHub-Api-Version':'2026-03-10',
     'User-Agent':'fishing-d6-branch-readback-source-only',
    },
   });
  }catch{deny('BRANCH_READ_UNKNOWN');}
  const ref=await boundedJson(response,url);
  need(ref?.ref===claim.refName&&
   ref.object?.type==='commit'&&
   ref.object.sha===op.sourceRevision,
   'BRANCH_UNVERIFIED');
  await main(op,claim);
  active();
  const at=now();
  need(Number.isSafeInteger(at)&&at>0,'INVALID_CLOCK');
  await insert(insertBranch,operationId,REPO.ownerGitHubId,REPO.id,
   claim.treeRequestSha256,claim.requestSha256,
   op.sourceRevision,claim.baseTreeSha,claim.resultTreeSha,
   claim.refName,at);
  const saved=await read(selectBranch,operationId);
  return proof(saved,claim,at,fence);
 }
 return Object.freeze({attempt,reconcile});
}
