/**
 * FISH-TODO-118 WP3-3 — durable, operation-bound GitHub PR coordinator.
 * SOURCE ONLY / DEFAULT OFF / NO WORKER ROUTE / NO REAL MUTATIONS.
 *
 * Requires the accepted immutable canonical operation and independently
 * reconciled atomic tree, branch, commit, and branch-advance D1 proofs with
 * the exact four durable Unknown mutation fences. A single PR write claim
 * must be durably acknowledged BEFORE requesting a narrow pull_requests:write
 * GitHub credential. All responses, including 201/422 and lost HTTP acks,
 * remain Unknown. No replay is possible.
 *
 * Independent GitHub listing of the operation-owned head branch, a second
 * GET for its single PR identity, and fresh main/ref/commit readbacks produce
 * a distinct immutable VerifiedPr D1 receipt. Discovery is by exact head and
 * base, never a guessed PR number or an untrusted provider-response hint.
 * No merge, Live transition, hosted release or user-visible publication.
 * Schema below is proposed source, NOT deployed/provisioned.
 */
import {sha256} from '../../../../pwa/src/shared.mjs';
import {describeD6AtomicTreeStep}
 from './d6-production-atomic-tree-step.mjs';
import {describeD6PublishBranchStep}
 from './d6-production-publish-branch-coordinator.mjs';
import {describeD6PublishCommitStep}
 from './d6-production-publish-commit-coordinator.mjs';
import {describeD6PublishAdvanceStep}
 from './d6-production-publish-advance-coordinator.mjs';
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const ROOT='https://api.github.com/repos/'+REPO.name;
const SHA=/^[0-9a-f]{40}$/,DIGEST=/^[0-9a-f]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WRITE=Object.freeze({pull_requests:'write'});
const READ=Object.freeze({contents:'read',pull_requests:'read'});
const MAX_JSON=512*1024,MAX_SKEW=60;
const branch=id=>'fish-v3/publish/'+id;
const fullBranch=id=>'refs/heads/'+branch(id);
const message=id=>'Fishing Companion V3 content update '+id;
const fenceSql='SELECT operation_id,step_key,owner_github_id,'+
 'repository_id,request_sha256,state,created_at FROM '+
 'd6_provider_step_fences WHERE operation_id=? AND step_key=?';
const treeSql='SELECT operation_id,owner_github_id,repository_id,'+
 'request_sha256,source_revision,base_tree_sha,result_tree_sha,'+
 'changed_paths,state,verified_at FROM d6_atomic_tree_verified '+
 'WHERE operation_id=?';
const branchSql='SELECT operation_id,owner_github_id,repository_id,'+
 'tree_request_sha256,request_sha256,source_revision,base_tree_sha,'+
 'result_tree_sha,ref_name,state,verified_at FROM '+
 'd6_publish_branch_verified WHERE operation_id=?';
const commitSql='SELECT operation_id,owner_github_id,repository_id,'+
 'tree_request_sha256,branch_request_sha256,request_sha256,'+
 'source_revision,result_tree_sha,result_commit_sha,ref_name,'+
 'state,verified_at FROM d6_publish_commit_verified WHERE operation_id=?';
const advanceSql='SELECT operation_id,owner_github_id,repository_id,'+
 'tree_request_sha256,branch_request_sha256,commit_request_sha256,'+
 'request_sha256,source_revision,result_tree_sha,result_commit_sha,'+
 'ref_name,state,verified_at FROM d6_publish_advance_verified '+
 'WHERE operation_id=?';
const prSql='SELECT operation_id,owner_github_id,repository_id,'+
 'tree_request_sha256,branch_request_sha256,commit_request_sha256,'+
 'advance_request_sha256,request_sha256,source_revision,'+
 'result_commit_sha,ref_name,pr_number,pr_id,state,verified_at '+
 'FROM d6_publish_pr_verified WHERE operation_id=?';
const insertFence='INSERT OR IGNORE INTO d6_provider_step_fences '+
 '(operation_id,step_key,owner_github_id,repository_id,request_sha256,'+
 "state,created_at) VALUES (?,?,?,?,?,'Unknown',?)";
const insertPr='INSERT OR IGNORE INTO d6_publish_pr_verified '+
 '(operation_id,owner_github_id,repository_id,tree_request_sha256,'+
 'branch_request_sha256,commit_request_sha256,advance_request_sha256,'+
 'request_sha256,source_revision,result_commit_sha,ref_name,pr_number,'+
 "pr_id,state,verified_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'VerifiedPr',?)";
export const D6_PUBLISH_PR_PROOF_SQL=[
 'CREATE TABLE IF NOT EXISTS d6_publish_pr_verified (',
 'operation_id TEXT PRIMARY KEY NOT NULL,',
 'owner_github_id INTEGER NOT NULL,',
 'repository_id INTEGER NOT NULL,',
 'tree_request_sha256 TEXT NOT NULL,',
 'branch_request_sha256 TEXT NOT NULL,',
 'commit_request_sha256 TEXT NOT NULL,',
 'advance_request_sha256 TEXT NOT NULL,',
 'request_sha256 TEXT NOT NULL,',
 'source_revision TEXT NOT NULL,',
 'result_commit_sha TEXT NOT NULL,',
 'ref_name TEXT NOT NULL,',
 'pr_number INTEGER NOT NULL CHECK(pr_number>0),',
 'pr_id INTEGER NOT NULL CHECK(pr_id>0),',
 "state TEXT NOT NULL DEFAULT 'VerifiedPr' CHECK(state='VerifiedPr'),",
 'verified_at INTEGER NOT NULL',
 ');',
].join('\n');
export class D6PublishPrError extends Error {
 constructor(code){super('D6 publication PR remains unverified');
  this.name='D6PublishPrError';this.code=code;}
}
const deny=code=>{throw new D6PublishPrError(code);};
const need=(valid,code)=>{if(!valid)deny(code);};
const plain=x=>x!==null&&typeof x==='object'&&
 !Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
function accepted(stored,id){
 const op=stored?.operation,pkg=stored?.package;
 need(UUID.test(id??'')&&op?.operationId===id&&
  op.ownerGitHubId===REPO.ownerGitHubId&&op.repositoryId===REPO.id&&
  op.ref===REPO.ref&&op.state==='Accepted'&&
  SHA.test(op.sourceRevision??'')&&DIGEST.test(op.snapshotSha256??'')&&
  ['gear','kb','catches'].includes(op.domain)&&
  ['add','edit'].includes(op.operation)&&
  op.domain===pkg?.domain&&op.operation===pkg?.operation&&
  op.recordId===pkg?.id&&pkg.base?.sourceRevision===op.sourceRevision&&
  Array.isArray(stored.mediaTickets),'UNTRUSTED_OPERATION');
 return op;
}
function checkedFence(row,op,step,hash){
 need(row?.operation_id===op.operationId&&row.step_key===step&&
  row.owner_github_id===REPO.ownerGitHubId&&row.repository_id===REPO.id&&
  row.request_sha256===hash&&row.state==='Unknown'&&
  Number.isSafeInteger(row.created_at)&&row.created_at>0,
  'FENCE_UNVERIFIED');
}
function checkedTree(row,op,action,first){
 need(row?.operation_id===op.operationId&&
  row.owner_github_id===REPO.ownerGitHubId&&row.repository_id===REPO.id&&
  row.request_sha256===action.requestSha256&&
  row.source_revision===op.sourceRevision&&
  row.base_tree_sha===action.baseTreeSha&&
  row.changed_paths===action.entryCount&&
  SHA.test(row.result_tree_sha??'')&&
  row.result_tree_sha!==action.baseTreeSha&&
  row.state==='VerifiedTree'&&
  Number.isSafeInteger(row.verified_at)&&row.verified_at>=first.created_at,
  'TREE_UNVERIFIED');
}
function checkedBranch(row,op,action,tree,first){
 need(row?.operation_id===op.operationId&&
  row.owner_github_id===REPO.ownerGitHubId&&row.repository_id===REPO.id&&
  row.tree_request_sha256===action.treeRequestSha256&&
  row.request_sha256===action.requestSha256&&
  row.source_revision===op.sourceRevision&&
  row.base_tree_sha===action.baseTreeSha&&
  row.result_tree_sha===tree.result_tree_sha&&
  row.ref_name===fullBranch(op.operationId)&&
  row.state==='VerifiedBranch'&&
  Number.isSafeInteger(row.verified_at)&&row.verified_at>=first.created_at,
  'BRANCH_UNVERIFIED');
}
function checkedCommit(row,op,action,tree,first){
 need(row?.operation_id===op.operationId&&
  row.owner_github_id===REPO.ownerGitHubId&&row.repository_id===REPO.id&&
  row.tree_request_sha256===action.treeRequestSha256&&
  row.branch_request_sha256===action.branchRequestSha256&&
  row.request_sha256===action.requestSha256&&
  row.source_revision===op.sourceRevision&&
  row.result_tree_sha===tree.result_tree_sha&&
  SHA.test(row.result_commit_sha??'')&&
  row.result_commit_sha!==op.sourceRevision&&
  row.ref_name===fullBranch(op.operationId)&&
  row.state==='VerifiedCommit'&&
  Number.isSafeInteger(row.verified_at)&&row.verified_at>=first.created_at,
  'COMMIT_UNVERIFIED');
}
function checkedAdvance(row,op,action,commit,first){
 need(row?.operation_id===op.operationId&&
  row.owner_github_id===REPO.ownerGitHubId&&row.repository_id===REPO.id&&
  row.tree_request_sha256===action.treeRequestSha256&&
  row.branch_request_sha256===action.branchRequestSha256&&
  row.commit_request_sha256===action.commitRequestSha256&&
  row.request_sha256===action.requestSha256&&
  row.source_revision===op.sourceRevision&&
  row.result_tree_sha===action.resultTreeSha&&
  row.result_commit_sha===commit.result_commit_sha&&
  row.ref_name===fullBranch(op.operationId)&&
  row.state==='VerifiedAdvance'&&
  Number.isSafeInteger(row.verified_at)&&row.verified_at>=first.created_at,
  'ADVANCE_UNVERIFIED');
}
export async function describeD6PublishPrStep({
 operation,treeAction,branchAction,commitAction,advanceAction,advanceReceipt,
}={}){
 const op=accepted({operation,package:{
  id:operation?.recordId,domain:operation?.domain,
  operation:operation?.operation,base:{sourceRevision:operation?.sourceRevision},
 },mediaTickets:[]},operation?.operationId);
 need(advanceAction?.operationId===op.operationId&&
  advanceAction.treeRequestSha256===treeAction?.requestSha256&&
  advanceAction.branchRequestSha256===branchAction?.requestSha256&&
  advanceAction.commitRequestSha256===commitAction?.requestSha256&&
  advanceAction.sourceRevision===op.sourceRevision&&
  DIGEST.test(advanceAction.requestSha256??'')&&
  advanceReceipt?.state==='VerifiedAdvance'&&
  advanceReceipt.request_sha256===advanceAction.requestSha256&&
  advanceReceipt.source_revision===op.sourceRevision&&
  advanceReceipt.result_commit_sha===advanceAction.resultCommitSha&&
  SHA.test(advanceReceipt.result_commit_sha??''),
  'UNVERIFIED_ADVANCE');
 const body={
  head:branch(op.operationId),base:'main',
  draft:false,
  title:'Fishing Companion V3: '+op.domain+' '+op.operationId,
  body:'Canonical '+op.domain+' '+op.operation+' '+op.recordId+
   '\nOperation: '+op.operationId+
   '\nBase: '+op.sourceRevision+
   '\nCommit: '+advanceReceipt.result_commit_sha,
 };
 const url=ROOT+'/pulls';
 const requestSha256=await sha256(JSON.stringify({
  operationId:op.operationId,repositoryId:REPO.id,
  ownerGitHubId:REPO.ownerGitHubId,ref:REPO.ref,
  sourceRevision:op.sourceRevision,snapshotSha256:op.snapshotSha256,
  treeRequestSha256:treeAction.requestSha256,
  branchRequestSha256:branchAction.requestSha256,
  commitRequestSha256:commitAction.requestSha256,
  advanceRequestSha256:advanceAction.requestSha256,
  resultCommitSha:advanceReceipt.result_commit_sha,
  stepKey:'pr',method:'POST',url,body,
 }));
 return Object.freeze({operationId:op.operationId,stepKey:'pr',
  url,method:'POST',body,requestSha256,refName:fullBranch(op.operationId),
  sourceRevision:op.sourceRevision,
  resultCommitSha:advanceReceipt.result_commit_sha,
  treeRequestSha256:treeAction.requestSha256,
  branchRequestSha256:branchAction.requestSha256,
  commitRequestSha256:commitAction.requestSha256,
  advanceRequestSha256:advanceAction.requestSha256});
}
function unknown(action,attemptedNow=false){
 return Object.freeze({operationId:action.operationId,
  stepKey:'pr',requestSha256:action.requestSha256,state:'Unknown',
  attemptedNow,sourceOnly:true,canMerge:false,
  canPublish:false,isLive:false,
  requiresIndependentPrReadback:true,requiresDurableReconciliation:true});
}
function verified(row,action,pr,fence,at){
 need(row?.operation_id===action.operationId&&
  row.owner_github_id===REPO.ownerGitHubId&&row.repository_id===REPO.id&&
  row.tree_request_sha256===action.treeRequestSha256&&
  row.branch_request_sha256===action.branchRequestSha256&&
  row.commit_request_sha256===action.commitRequestSha256&&
  row.advance_request_sha256===action.advanceRequestSha256&&
  row.request_sha256===action.requestSha256&&
  row.source_revision===action.sourceRevision&&
  row.result_commit_sha===action.resultCommitSha&&
  row.ref_name===action.refName&&
  row.pr_number===pr.number&&row.pr_id===pr.id&&
  row.state==='VerifiedPr'&&
  Number.isSafeInteger(row.verified_at)&&
  row.verified_at>=fence.created_at&&row.verified_at<=at+MAX_SKEW,
  'PR_PROOF_MISMATCH');
 return Object.freeze({
  operationId:action.operationId,prNumber:pr.number,
  prId:pr.id,prUrl:pr.html_url,
  state:'VerifiedPr',verifiedPr:true,
  resultCommitSha:action.resultCommitSha,headRef:action.refName,
  originalRequestSha256:action.requestSha256,
  sourceOnly:true,canMerge:false,canPublish:false,isLive:false,
  requiresGuardedMerge:true,requiresIndependentMergeReadback:true,
  requiresHostedReleaseProof:true,
 });
}
async function parseJson(response,url){
 need(response instanceof Response&&
  response.status===200&&response.redirected===false&&
  (!response.url||response.url===url)&&
  /\bapplication\/(?:vnd\.github\+)?json\b/i.test(
   response.headers.get('Content-Type')??''),
  'GITHUB_READ_UNKNOWN');
 const length=response.headers.get('Content-Length');
 if(length!==null)need(/^\d+$/.test(length)&&
  Number(length)<=MAX_JSON,'GITHUB_READ_UNKNOWN');
 const reader=response.body?.getReader();
 need(reader,'GITHUB_READ_UNKNOWN');
 const chunks=[];let n=0;
 try{
  for(;;){
   const {done,value}=await reader.read();if(done)break;
   need(value instanceof Uint8Array,'GITHUB_READ_UNKNOWN');
   n+=value.byteLength;need(n<=MAX_JSON,'GITHUB_READ_UNKNOWN');
   chunks.push(value);
  }
 }catch(e){
  try{await reader.cancel();}catch{}
  if(e instanceof D6PublishPrError)throw e;
  deny('GITHUB_READ_UNKNOWN');
 }finally{try{reader.releaseLock();}catch{}}
 need(n>0,'GITHUB_READ_UNKNOWN');
 const bytes=new Uint8Array(n);let off=0;
 for(const chunk of chunks){bytes.set(chunk,off);off+=chunk.length;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
 catch{deny('GITHUB_READ_UNKNOWN');}
}
function validPr(pr,action,fence,at){
 need(plain(pr)&&
  Number.isSafeInteger(pr.number)&&pr.number>0&&
  Number.isSafeInteger(pr.id)&&pr.id>0&&
  pr.html_url==='https://github.com/'+REPO.name+'/pull/'+pr.number&&
  pr.title===action.body.title&&pr.body===action.body.body&&
  pr.state==='open'&&pr.draft===action.body.draft&&
  pr.merged_at===null&&pr.closed_at===null&&
  pr.head?.ref===action.body.head&&
  pr.head?.sha===action.resultCommitSha&&
  pr.head?.repo?.id===REPO.id&&
  pr.head?.repo?.full_name===REPO.name&&
  pr.base?.ref===action.body.base&&
  pr.base?.sha===action.sourceRevision&&
  pr.base?.repo?.id===REPO.id&&
  pr.base?.repo?.full_name===REPO.name,
  'PR_UNVERIFIED');
 const created=Date.parse(pr.created_at??'');
 need(Number.isFinite(created)&&
  created>=fence.created_at*1000-MAX_SKEW*1000&&
  created<=at*1000+MAX_SKEW*1000,
  'PR_UNVERIFIED');
}
export function createD6ProductionPublishPrCoordinator({
 DB,session,loadAcceptedOperation,atomicPlanner,verifyPrerequisite,
 issueWriteToken,issueReadToken,request,enabled=()=>false,
 now=()=>Math.floor(Date.now()/1000),
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
  active();
  let actor;
  try{actor=await session.authorizeWrite(authRequest);}
  catch{deny('OWNER_DENIED');}
  need(actor?.authorized===true&&
   actor.ownerGitHubId===REPO.ownerGitHubId,'OWNER_DENIED');
  need(UUID.test(id??''),'INVALID_OPERATION');
  let stored;
  try{stored=await loadAcceptedOperation({
   operationId:id,ownerGitHubId:REPO.ownerGitHubId});
  }catch{deny('OPERATION_UNAVAILABLE');}
  const op=accepted(stored,id);
  let treeAction;
  try{
   const plan=await atomicPlanner.plan({operation:op,
    package:stored.package,mediaTickets:stored.mediaTickets});
   treeAction=await describeD6AtomicTreeStep({operation:op,plan});
  }catch{deny('ATOMIC_PLAN_UNVERIFIED');}
  const [tf,tp,bf,bp,cf,cp,af,ap]=await Promise.all([
   read(fenceSql,id,'tree'),read(treeSql,id),
   read(fenceSql,id,'branch'),read(branchSql,id),
   read(fenceSql,id,'commit'),read(commitSql,id),
   read(fenceSql,id,'advance'),read(advanceSql,id),
  ]);
  checkedFence(tf,op,'tree',treeAction.requestSha256);
  checkedTree(tp,op,treeAction,tf);
  let branchAction,commitAction,advanceAction;
  try{
   branchAction=await describeD6PublishBranchStep({
    operation:op,treeAction,treeProof:tp});
   checkedFence(bf,op,'branch',branchAction.requestSha256);
   checkedBranch(bp,op,branchAction,tp,bf);
   commitAction=await describeD6PublishCommitStep({
    operation:op,treeAction,treeProof:tp,
    branchAction,branchProof:bp});
   checkedFence(cf,op,'commit',commitAction.requestSha256);
   checkedCommit(cp,op,commitAction,tp,cf);
   advanceAction=await describeD6PublishAdvanceStep({
    operation:op,treeAction,branchAction,commitAction,commitReceipt:cp});
   checkedFence(af,op,'advance',advanceAction.requestSha256);
   checkedAdvance(ap,op,advanceAction,cp,af);
  }catch(e){
   if(e instanceof D6PublishPrError)throw e;
   deny('PREREQUISITES_UNVERIFIED');
  }
  const action=await describeD6PublishPrStep({
   operation:op,treeAction,branchAction,commitAction,
   advanceAction,advanceReceipt:ap,
  });
  return {op,action};
 }
 async function prerequisite(op,action){
  let checked;
  try{checked=await verifyPrerequisite({
   operationId:op.operationId,repositoryId:REPO.id,
   ownerGitHubId:REPO.ownerGitHubId,ref:REPO.ref,
   sourceRevision:op.sourceRevision,snapshotSha256:op.snapshotSha256,
   treeRequestSha256:action.treeRequestSha256,
   branchRequestSha256:action.branchRequestSha256,
   commitRequestSha256:action.commitRequestSha256,
   advanceRequestSha256:action.advanceRequestSha256,
   prRequestSha256:action.requestSha256,
   branchRef:action.refName,branchHeadSha:action.resultCommitSha,
  });}catch{deny('SOURCE_OR_BRANCH_MOVED');}
  need(checked?.verified===true&&
   checked.operationId===op.operationId&&
   checked.repositoryId===REPO.id&&
   checked.ownerGitHubId===REPO.ownerGitHubId&&
   checked.ref===REPO.ref&&
   checked.sourceRevision===op.sourceRevision&&
   checked.snapshotSha256===op.snapshotSha256&&
   checked.treeRequestSha256===action.treeRequestSha256&&
   checked.branchRequestSha256===action.branchRequestSha256&&
   checked.commitRequestSha256===action.commitRequestSha256&&
   checked.advanceRequestSha256===action.advanceRequestSha256&&
   checked.prRequestSha256===action.requestSha256&&
   checked.branchRef===action.refName&&
   checked.branchHeadSha===action.resultCommitSha,
   'SOURCE_OR_BRANCH_MOVED');
 }
 async function attempt(authRequest,operationId){
  const {op,action}=await prepare(authRequest,operationId);
  const existing=await read(fenceSql,operationId,'pr');
  if(existing){
   checkedFence(existing,op,'pr',action.requestSha256);
   return unknown(action);
  }
  await prerequisite(op,action);
  const at=now();
  need(Number.isSafeInteger(at)&&at>0,'INVALID_CLOCK');
  const claim=await insert(insertFence,operationId,'pr',
   REPO.ownerGitHubId,REPO.id,action.requestSha256,at);
  const fence=await read(fenceSql,operationId,'pr');
  checkedFence(fence,op,'pr',action.requestSha256);
  if(claim?.meta?.changes!==1)return unknown(action);
  active();
  let token;
  try{
   const grant=await issueWriteToken({
    repositoryId:REPO.id,permissions:WRITE});
   need(grant?.repositoryId===REPO.id&&
    plain(grant.permissions)&&grant.permissions.pull_requests==='write'&&
    Object.keys(grant.permissions).length===1&&
    typeof grant.token==='string'&&grant.token.length>=20,
    'TOKEN_UNAVAILABLE');
   token=grant.token;
  }catch{return unknown(action);}
  active();await prerequisite(op,action);active();
  try{await request(action.url,{
   method:'POST',redirect:'manual',cache:'no-store',credentials:'omit',
   headers:{
    Authorization:'Bearer '+token,
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2026-03-10',
    'Content-Type':'application/json',
    'User-Agent':'fishing-d6-pr-source-only',
   },body:JSON.stringify(action.body),
  });}catch{return unknown(action,true);}
  return unknown(action,true);
 }
 async function reconcile(authRequest,operationId){
  const {op,action}=await prepare(authRequest,operationId);
  const fence=await read(fenceSql,operationId,'pr');
  checkedFence(fence,op,'pr',action.requestSha256);
  await prerequisite(op,action);
  let token;
  try{
   const grant=await issueReadToken({
    repositoryId:REPO.id,permissions:READ});
   need(grant?.repositoryId===REPO.id&&
    plain(grant.permissions)&&
    grant.permissions.contents==='read'&&
    grant.permissions.pull_requests==='read'&&
    Object.keys(grant.permissions).length===2&&
    typeof grant.token==='string'&&grant.token.length>=20,
    'TOKEN_UNAVAILABLE');
   token=grant.token;
  }catch{deny('TOKEN_UNAVAILABLE');}
  const github=async url=>{
   active();
   need(url.startsWith(ROOT+'/'),'UNSAFE_GITHUB_URL');
   let res;
   try{res=await request(url,{method:'GET',redirect:'manual',
    credentials:'omit',cache:'no-store',headers:{
     Authorization:'Bearer '+token,
     Accept:'application/vnd.github+json',
     'X-GitHub-Api-Version':'2026-03-10',
     'User-Agent':'fishing-d6-pr-readback-source-only',
    },
   });}catch{deny('GITHUB_READ_UNKNOWN');}
   return parseJson(res,url);
  };
  const mainUrl=ROOT+'/git/ref/heads/main';
  const branchUrl=ROOT+'/git/ref/heads/'+branch(operationId);
  const source=await github(mainUrl);
  need(source?.ref===REPO.ref&&source.object?.type==='commit'&&
   source.object.sha===op.sourceRevision,'SOURCE_MOVED');
  const head=await github(branchUrl);
  need(head?.ref===action.refName&&head.object?.type==='commit'&&
   head.object.sha===action.resultCommitSha,'BRANCH_MOVED');
  const list=await github(ROOT+'/pulls?state=all&head='+
   encodeURIComponent('ginosega:'+branch(operationId))+
   '&base=main&per_page=2');
  need(Array.isArray(list)&&list.length===1,'PR_AMBIGUOUS');
  const found=list[0];
  const at=now();
  need(Number.isSafeInteger(at)&&at>0,'INVALID_CLOCK');
  validPr(found,action,fence,at);
  const pr=await github(ROOT+'/pulls/'+found.number);
  validPr(pr,action,fence,at);
  need(pr.number===found.number&&pr.id===found.id,'PR_ID_MISMATCH');
  const c=await github(ROOT+'/git/commits/'+action.resultCommitSha);
  need(c?.sha===action.resultCommitSha&&
   c.message===message(operationId),
   'COMMIT_UNVERIFIED');
  // Match the commit against the *verified* source tree SHA via the
  // independently persisted advance proof rather than a PR response.
  const advance=await read(advanceSql,operationId);
  need(advance?.request_sha256===action.advanceRequestSha256&&
   SHA.test(advance.result_tree_sha??'')&&
   c.tree?.sha===advance.result_tree_sha&&
   Array.isArray(c.parents)&&c.parents.length===1&&
   c.parents[0]?.sha===op.sourceRevision,'COMMIT_UNVERIFIED');
  const lastMain=await github(mainUrl);
  const lastBranch=await github(branchUrl);
  need(lastMain?.ref===REPO.ref&&
   lastMain.object?.type==='commit'&&
   lastMain.object.sha===op.sourceRevision,'SOURCE_MOVED');
  need(lastBranch?.ref===action.refName&&
   lastBranch.object?.type==='commit'&&
   lastBranch.object.sha===action.resultCommitSha,'BRANCH_MOVED');
  await prerequisite(op,action);active();
  await insert(insertPr,operationId,REPO.ownerGitHubId,REPO.id,
   action.treeRequestSha256,action.branchRequestSha256,
   action.commitRequestSha256,action.advanceRequestSha256,
   action.requestSha256,op.sourceRevision,
   action.resultCommitSha,action.refName,pr.number,pr.id,at);
  const saved=await read(prSql,operationId);
  return verified(saved,action,pr,fence,at);
 }
 return Object.freeze({attempt,reconcile});
}
