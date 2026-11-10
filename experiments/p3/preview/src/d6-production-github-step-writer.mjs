/**
 * D6 GitHub Git-Data / PR mutation adapter — SOURCE ONLY / DEFAULT OFF.
 *
 * Server-only, not a Worker entrypoint or GitHub permission grant.
 * Binds ONE explicitly scoped external mutation to a durable per-step D1
 * UNKNOWN claim BEFORE requesting GitHub. Even if an HTTP 201/200 arrives,
 * the result remains UNKNOWN until an independent remote-read verifier
 * (future work) establishes the exact bytes, ref and PR identity.
 *
 * A retry NEVER performs the same mutation again. Missing/unconfirmed D1
 * acknowledgment or provider timeout also remains UNKNOWN, requiring
 * operator/remote reconciliation. Do not promote this adapter to a route.
 *
 * The step planner and prerequisite reader must run ONLY in trusted server
 * code and derive the plan from previously reviewed canonical source bytes
 * and a durable operation. Browser-supplied paths/SHAs are never trusted.
 */
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';
import {safePath} from '../../../../pwa/src/shared.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const ROOT='https://api.github.com/repos/'+REPO.name;
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const PERMISSIONS=Object.freeze({contents:'write',pull_requests:'write'});
const enc=new TextEncoder();
const steps=new Set(['branch','blob','tree','commit','advance','pr']);
const branch=id=>'fish-v3/publish/'+id;
const strongPath=(path,domain)=>{
 try{
  const root=domain==='gear'?'Gear':'KB';
  const json=root+'/'+(domain==='gear'?'gear':'kb')+'.json';
  return safePath(path)===path&&(path===json||
   path.startsWith(root+'/')&&path.includes('/content/')&&
   path.endsWith('.md'));
 }catch{return false;}
};
const sha256=async text=>Array.from(new Uint8Array(
 await crypto.subtle.digest('SHA-256',enc.encode(text))),
 v=>v.toString(16).padStart(2,'0')).join('');

export const D6_PROVIDER_STEP_SQL=[
 'CREATE TABLE IF NOT EXISTS d6_provider_step_fences (',
 'operation_id TEXT NOT NULL,',
 'step_key TEXT NOT NULL,',
 'owner_github_id INTEGER NOT NULL,',
 'repository_id INTEGER NOT NULL,',
 'request_sha256 TEXT NOT NULL,',
 "state TEXT NOT NULL DEFAULT 'Unknown' CHECK(state='Unknown'),",
 'created_at INTEGER NOT NULL,',
 'PRIMARY KEY(operation_id,step_key)',
 ');',
].join('\n');
const select='SELECT operation_id,step_key,owner_github_id,repository_id,'+
 'request_sha256,state,created_at FROM d6_provider_step_fences '+
 'WHERE operation_id=? AND step_key=?';
const insert='INSERT OR IGNORE INTO d6_provider_step_fences '+
 '(operation_id,step_key,owner_github_id,repository_id,request_sha256,'+
 "state,created_at) VALUES (?,?,?,?,?,'Unknown',?)";

export class D6ProviderStepError extends Error {
 constructor(code){super('D6 GitHub provider mutation not confirmed');
  this.name='D6ProviderStepError';this.code=code;}
}
const deny=code=>{throw new D6ProviderStepError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
function trustedOperation(op,id){
 need(op&&op.operationId===id&&UUID.test(id)&&
  op.ownerGitHubId===REPO.ownerGitHubId&&
  op.repositoryId===REPO.id&&op.ref===REPO.ref&&
  op.state==='Accepted'&&SHA.test(op.sourceRevision??'')&&
  DIGEST.test(op.candidateSha256??'')&&
  ['gear','kb'].includes(op.domain)&&
  ['add','edit'].includes(op.operation),'UNTRUSTED_OPERATION');
 return op;
}
function compiled(op,step,plan){
 need(plan?.operationId===op.operationId&&
  plan?.ownerGitHubId===REPO.ownerGitHubId&&
  plan?.repositoryId===REPO.id&&
  plan?.sourceRevision===op.sourceRevision&&
  plan?.candidateSha256===op.candidateSha256&&
  plan?.step===step&&plan?.sourceOnly===true,
  'UNTRUSTED_STEP_PLAN');
 const b=branch(op.operationId);
 let url,method='POST',body,key=step;
 if(step==='branch'){
  url=ROOT+'/git/refs';
  body={ref:'refs/heads/'+b,sha:op.sourceRevision};
 }else if(step==='blob'){
  need(strongPath(plan.path,op.domain)&&
   typeof plan.content==='string'&&plan.content.length>0&&
   enc.encode(plan.content).length<=131072,
   'UNSAFE_BLOB');
  key='blob:'+plan.path;
  url=ROOT+'/git/blobs';
  body={content:plan.content,encoding:'utf-8'};
 }else if(step==='tree'){
  need(SHA.test(plan.baseTreeSha??'')&&
   Array.isArray(plan.entries)&&plan.entries.length>0&&
   plan.entries.length<=20,'UNSAFE_TREE');
  const paths=new Set(),tree=[];
  for(const entry of plan.entries){
   need(strongPath(entry?.path,op.domain)&&
    entry.mode==='100644'&&entry.type==='blob'&&
    (entry.sha===null||SHA.test(entry.sha??'')),
    'UNSAFE_TREE');
   const folded=entry.path.normalize('NFKC').toLowerCase();
   need(!paths.has(folded),'UNSAFE_TREE');paths.add(folded);
   tree.push({path:entry.path,mode:'100644',type:'blob',
    sha:entry.sha});
  }
  need(paths.has(op.domain==='gear'?'gear/gear.json':'kb/kb.json'),
   'UNSAFE_TREE');
  url=ROOT+'/git/trees';
  body={base_tree:plan.baseTreeSha,tree};
 }else if(step==='commit'){
  need(SHA.test(plan.treeSha??''),'UNSAFE_COMMIT');
  url=ROOT+'/git/commits';
  body={message:'Fishing Companion V3 content update '+op.operationId,
   tree:plan.treeSha,parents:[op.sourceRevision]};
 }else if(step==='advance'){
  need(SHA.test(plan.commitSha??'')&&
   plan.commitSha!==op.sourceRevision,'UNSAFE_ADVANCE');
  url=ROOT+'/git/refs/heads/'+b;
  method='PATCH';
  body={sha:plan.commitSha,force:false};
 }else if(step==='pr'){
  url=ROOT+'/pulls';
  body={head:b,base:'main',draft:false,
   title:'Fishing Companion V3: '+op.domain+' '+op.operationId,
   body:'Canonical Gear/KB text-only operation '+op.operationId+
    '\nBase: '+op.sourceRevision+
    '\nCandidate digest: '+op.candidateSha256};
 }else deny('INVALID_STEP');
 return Object.freeze({key,url,method,body});
}
function status(row,op,key,digest,attempted=false){
 need(row&&row.operation_id===op.operationId&&
  row.step_key===key&&row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  row.request_sha256===digest&&
  row.state==='Unknown'&&Number.isSafeInteger(row.created_at)&&
  row.created_at>0,'FENCE_MISMATCH');
 return Object.freeze({
  operationId:op.operationId,stepKey:key,state:'Unknown',
  attemptedNow:attempted,requiresRemoteReconciliation:true,
  canMerge:false,canPublish:false,isLive:false,sourceOnly:true,
 });
}
export function createD6ProductionGitHubStepWriter({
 DB,readOperation,planStep,verifyPrerequisite,issueWriteToken,
 request,enabled=()=>false,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(DB?.prepare&&[readOperation,planStep,verifyPrerequisite,
  issueWriteToken,request,enabled,now].every(f=>typeof f==='function'),
  'INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 const dbRead=async(id,key)=>{
  try{return await DB.prepare(select).bind(id,key).first();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 const dbInsert=async(id,key,digest,at)=>{
  try{return await DB.prepare(insert).bind(
   id,key,REPO.ownerGitHubId,REPO.id,digest,at).run();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 const load=async id=>{
  active();need(UUID.test(id??''),'INVALID_OPERATION');
  let op;
  try{op=await readOperation(id);}catch{deny('OPERATION_UNAVAILABLE');}
  return trustedOperation(op,id);
 };
 const plan=async(op,step)=>{
  need(steps.has(step),'INVALID_STEP');
  let p;
  try{p=await planStep({operationId:op.operationId,step});}
  catch{deny('STEP_PLAN_UNAVAILABLE');}
  return compiled(op,step,p);
 };
 async function attempt(operationId,step){
  const op=await load(operationId);
  const action=await plan(op,step);
  const hash=await sha256(JSON.stringify({
   operationId,stepKey:action.key,method:action.method,url:action.url,
   body:action.body,sourceRevision:op.sourceRevision,
   candidateSha256:op.candidateSha256,
  }));
  // Reuse never replays. Different immutable body with the same
  // operation/step key is a conflict, not a mutated original snapshot.
  const prior=await dbRead(operationId,action.key);
  if(prior)return status(prior,op,action.key,hash);
  // Prerequisite MUST validate earlier steps and canonical main using
  // trusted independent reads, not merely a D1 boolean or caller claim.
  let ready;
  try{ready=await verifyPrerequisite({
   operationId,step,requestSha256:hash,
   sourceRevision:op.sourceRevision,candidateSha256:op.candidateSha256,
  });}catch{deny('PRECONDITION_UNVERIFIED');}
  need(ready?.repositoryId===REPO.id&&
   ready.operationId===operationId&&ready.step===step&&
   ready.requestSha256===hash&&ready.verified===true,
   'PRECONDITION_UNVERIFIED');
  const at=now();
  need(Number.isSafeInteger(at)&&at>0,'INVALID_CLOCK');
  const claimed=await dbInsert(operationId,action.key,hash,at);
  const row=await dbRead(operationId,action.key);
  status(row,op,action.key,hash);
  // Only the first provably committed INSERT can emit this step.
  if(claimed?.meta?.changes!==1)return status(row,op,action.key,hash);
  active();
  let token;
  try{const grant=await issueWriteToken({
   repositoryId:REPO.id,permissions:PERMISSIONS,
  });
   need(grant?.repositoryId===REPO.id&&
    grant?.permissions?.contents==='write'&&
    grant?.permissions?.pull_requests==='write'&&
    Object.keys(grant.permissions).length===2&&
    typeof grant.token==='string'&&grant.token.length>=20,
    'TOKEN_SCOPE_DENIED');
   token=grant.token;
  }catch{return status(row,op,action.key,hash);}
  if(enabled()!==true)return status(row,op,action.key,hash);
  // The network result is NOT proof of remote mutation. In particular
  // 409, 422, timeout and an HTTP 201 with lost local ack all stay Unknown.
  let response;
  try{
   response=await request(action.url,{
    method:action.method,redirect:'manual',cache:'no-store',
    credentials:'omit',headers:{
     Authorization:'Bearer '+token,
     Accept:'application/vnd.github+json',
     'X-GitHub-Api-Version':'2026-03-10',
     'Content-Type':'application/json',
     'User-Agent':'fishing-d6-git-step-source',
    },body:JSON.stringify(action.body),
   });
  }catch{return status(row,op,action.key,hash,true);}
  // A status/response body cannot promote Unknown. Require a future
  // independently verified remote object/PR read and durable reconciliation.
  void response;
  return status(row,op,action.key,hash,true);
 }
 async function inspectFence(operationId,step){
  const op=await load(operationId),action=await plan(op,step);
  const hash=await sha256(JSON.stringify({
   operationId,stepKey:action.key,method:action.method,url:action.url,
   body:action.body,sourceRevision:op.sourceRevision,
   candidateSha256:op.candidateSha256,
  }));
  const row=await dbRead(operationId,action.key);
  if(!row)deny('FENCE_MISSING');
  return status(row,op,action.key,hash);
 }
 return Object.freeze({attempt,inspectFence});
}
