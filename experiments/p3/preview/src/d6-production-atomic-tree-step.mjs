/**
 * FISH118 WP3-2 — atomic canonical source/media Git TREE mutation fence.
 * SOURCE ONLY / DEFAULT OFF / NOT A WORKER ROUTE.
 *
 * Connects the actual #470 atomic canonical source + Markdown + original
 * media planner to the EXISTING d6_provider_step_fences D1 schema. A single
 * sticky Unknown claim is durable BEFORE any Git Data POST /git/trees.
 * Failed/lost D1 acknowledgment, provider timeout, HTTP 201, or concurrent
 * attempt never authorizes replay or publication. A later independent remote
 * tree/commit/PR readback and durable coordinator is mandatory.
 *
 * All new original-byte Git blobs must have been independently verified,
 * including signed staging tickets. Ordinary record-only/Markdown-only
 * changes have zero media entries and must reject undeclared tickets. No browser-selected paths, tree entries,
 * base revision, repository, Git token, or readiness boolean is trusted.
 * The host must inject the existing D2 owner session, trusted D1 operation
 * reader, #470 atomic planner, authoritative-main prerequisite checker and
 * narrowly scoped server-only write credential only after owner approval.
 */
import {DOMAIN,pathKey}
 from '../../../../pwa/src/shared.mjs';
import {readD6BoundedJson}
 from './d6-bounded-json-response.mjs';
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const URL='https://api.github.com/repos/'+REPO.name+'/git/trees';
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const SCOPE=Object.freeze({contents:'write'});
const readSql='SELECT operation_id,step_key,owner_github_id,repository_id,'+
 'request_sha256,state,created_at FROM d6_provider_step_fences '+
 'WHERE operation_id=? AND step_key=?';
const insertSql='INSERT OR IGNORE INTO d6_provider_step_fences '+
 '(operation_id,step_key,owner_github_id,repository_id,request_sha256,'+
 "state,created_at) VALUES (?,?,?,?,?,'Unknown',?)";
export class D6AtomicTreeStepError extends Error{
 constructor(code){
  super('D6 atomic Git tree provider step not confirmed');
  this.name='D6AtomicTreeStepError';this.code=code;
 }
}
const deny=code=>{throw new D6AtomicTreeStepError(code);};
const need=(value,code)=>{if(!value)deny(code);};
const hex=async bytes=>[...new Uint8Array(
 await crypto.subtle.digest('SHA-256',new TextEncoder().encode(bytes)))]
 .map(b=>b.toString(16).padStart(2,'0')).join('');
function trustedOperation(op,id){
 need(op&&op.operationId===id&&UUID.test(id)&&
  op.state==='Accepted'&&op.repositoryId===REPO.id&&
  op.ownerGitHubId===REPO.ownerGitHubId&&op.ref===REPO.ref&&
  SHA.test(op.sourceRevision??'')&&
  DIGEST.test(op.snapshotSha256??'')&&
  ['gear','kb','catches'].includes(op.domain)&&
  ['add','edit'].includes(op.operation)&&
  /^[a-z0-9][a-z0-9-]*$/.test(op.recordId??''),
  'UNTRUSTED_OPERATION');
 return op;
}
export async function describeD6AtomicTreeStep({
 operation,plan,
}={}){
 const op=trustedOperation(operation,operation?.operationId);
 need(plan?.atomicTreeReady===true&&
  plan?.sourceOnly===true&&plan?.canSubmitTree===false&&
  plan?.canPublish===false&&plan?.isLive===false&&
  plan?.requiresDurableGitStepFence===true&&
  plan?.requiresIndependentTreeReadback===true&&
  plan?.requiresSourceConflictRecheck===true&&
  plan?.operationId===op.operationId&&
  plan?.repositoryId===REPO.id&&plan?.ref===REPO.ref&&
  plan?.sourceRevision===op.sourceRevision&&
  plan?.domain===op.domain&&plan?.recordId===op.recordId&&
  SHA.test(plan.baseTreeSha??'')&&
  Array.isArray(plan.entries)&&plan.entries.length>=1&&
  plan.entries.length<=32&&plan.fileCount===plan.entries.length&&
  Number.isSafeInteger(plan.textCount)&&plan.textCount>=1&&
  Number.isSafeInteger(plan.mediaCount)&&plan.mediaCount>=0&&
  Array.isArray(plan.verifiedText)&&
  plan.verifiedText.length===plan.textCount,
  'UNTRUSTED_ATOMIC_PLAN');
 const canonical=DOMAIN[op.domain].file;
 const entries=[],paths=new Set(),textPaths=new Map();
 for(const entry of plan.entries){
  let key;
  try{key=pathKey(entry?.path);}catch{deny('UNSAFE_TREE');}
  need(entry.mode==='100644'&&entry.type==='blob'&&
   (entry.sha===null||SHA.test(entry.sha??''))&&
   !paths.has(key)&&
   entry.path.startsWith(op.domain==='gear'?'Gear/':
    op.domain==='kb'?'KB/':'Catches/'),
   'UNSAFE_TREE');
  paths.add(key);
  entries.push({path:entry.path,mode:'100644',
   type:'blob',sha:entry.sha});
 }
 let deleted=0;
 for(const entry of entries)if(entry.sha===null)deleted++;
 const canonicalEntry=entries.find(x=>x.path===canonical);
 need((plan.canonicalJsonUnchanged===true?
   canonicalEntry===undefined:
   canonicalEntry&&SHA.test(canonicalEntry.sha??''))&&
  plan.mediaCount+plan.textCount+deleted===entries.length,
  'INCOMPLETE_ATOMIC_PLAN');
 for(const proof of plan.verifiedText){
  let key;
  try{key=pathKey(proof?.path);}catch{deny('UNVERIFIED_TEXT');}
  need(SHA.test(proof.sha??'')&&
   Number.isSafeInteger(proof.bytes)&&proof.bytes>0&&
   proof.bytes<=1024*1024&&
   !textPaths.has(key),'UNVERIFIED_TEXT');
  textPaths.set(key,proof.sha);
 }
 need(textPaths.size===plan.textCount&&
  (plan.canonicalJsonUnchanged===true?
   !textPaths.has(pathKey(canonical)):
   textPaths.get(pathKey(canonical))===canonicalEntry?.sha),
  'UNVERIFIED_TEXT');
 let mediaCount=0;
 for(const entry of entries){
  const txt=textPaths.get(pathKey(entry.path));
  if(txt!==undefined){
   need(entry.sha===txt,'UNVERIFIED_TEXT');
   continue;
  }
  if(entry.sha===null){
   need(entry.path.includes('/content/')&&
    entry.path.endsWith('.md'),'UNSAFE_DELETE');
   continue;
  }
  need(entry.path.includes('/assets/')&&SHA.test(entry.sha),
   'UNVERIFIED_MEDIA');
  mediaCount++;
 }
 need(mediaCount===plan.mediaCount,'INCOMPLETE_ATOMIC_PLAN');
 // The canonical source loader verifies an immutable *repository root*
 // commit tree, while authoring paths are relative to its pwa/ subtree.
 // Git Data create-tree operates on the repository root: every entry MUST
 // be prefixed exactly once before calculating the immutable fence digest.
 // No caller may write a root-level Gear/KB/Catches file.
 const body={base_tree:plan.baseTreeSha,
  tree:entries.map(item=>({...item,path:'pwa/'+item.path}))};
 const stepKey='tree',method='POST';
 const requestSha256=await hex(JSON.stringify({
  operationId:op.operationId,ownerGitHubId:REPO.ownerGitHubId,
  repositoryId:REPO.id,ref:REPO.ref,
  sourceRevision:op.sourceRevision,
  snapshotSha256:op.snapshotSha256,
  stepKey,method,url:URL,body,
 }));
 return Object.freeze({operationId:op.operationId,stepKey,
  requestSha256,method,url:URL,body,
  baseTreeSha:plan.baseTreeSha,entryCount:entries.length,
  mediaCount,textCount:plan.textCount});
}
function outcome(row,claim,attemptedNow=false){
 need(row?.operation_id===claim.operationId&&
  row.step_key===claim.stepKey&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  row.request_sha256===claim.requestSha256&&
  row.state==='Unknown'&&
  Number.isSafeInteger(row.created_at)&&row.created_at>0,
  'FENCE_MISMATCH');
 return Object.freeze({
  operationId:claim.operationId,stepKey:'tree',
  requestSha256:claim.requestSha256,
  baseTreeSha:claim.baseTreeSha,entryCount:claim.entryCount,
  state:'Unknown',attemptedNow,sourceOnly:true,
  canPublish:false,isLive:false,
  requiresIndependentTreeReadback:true,
  requiresDurableReconciliation:true,requiresSourceConflictRecheck:true,
 });
}
export function createD6ProductionAtomicTreeStep({
 DB,session,loadAcceptedOperation,atomicPlanner,verifyPrerequisite,
 issueWriteToken,request,
 storeCandidateTreeHint=async()=>{throw Error('TREE_CUSTODY_DISABLED');},
 enabled=()=>false,
 now=()=>Math.floor(Date.now()/1000),
}={}){
 need(DB?.prepare&&typeof session?.authorizeWrite==='function'&&
  typeof atomicPlanner?.plan==='function'&&
  [loadAcceptedOperation,verifyPrerequisite,issueWriteToken,
   request,storeCandidateTreeHint,enabled,now]
   .every(f=>typeof f==='function'),
  'INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 const read=async(id,key)=>{
  try{return await DB.prepare(readSql).bind(id,key).first();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 const insert=async(claim,at)=>{
  try{return await DB.prepare(insertSql).bind(
   claim.operationId,claim.stepKey,REPO.ownerGitHubId,REPO.id,
   claim.requestSha256,at).run();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 async function prepare(authRequest,operationId){
  active();
  let actor;
  try{actor=await session.authorizeWrite(authRequest);}
  catch{deny('OWNER_DENIED');}
  need(actor?.authorized===true&&
   actor.ownerGitHubId===REPO.ownerGitHubId,'OWNER_DENIED');
  need(UUID.test(operationId??''),'INVALID_OPERATION');
  let stored;
  try{stored=await loadAcceptedOperation({
   operationId,ownerGitHubId:REPO.ownerGitHubId,
  });}catch{deny('OPERATION_UNAVAILABLE');}
  const op=trustedOperation(stored?.operation,operationId);
  need(stored.package?.domain===op.domain&&
   stored.package?.operation===op.operation&&
   stored.package?.id===op.recordId&&
   stored.package?.base?.sourceRevision===op.sourceRevision&&
   Array.isArray(stored.mediaTickets),'UNTRUSTED_OPERATION');
  let plan;
  try{plan=await atomicPlanner.plan({
   operation:op,package:stored.package,
   mediaTickets:stored.mediaTickets,
  });}catch{deny('ATOMIC_PLAN_UNVERIFIED');}
  return {op,claim:await describeD6AtomicTreeStep({
   operation:op,plan,
  })};
 }
 async function attempt(authRequest,operationId){
  const {op,claim}=await prepare(authRequest,operationId);
  const existing=await read(operationId,'tree');
  if(existing)return outcome(existing,claim);
  const prerequisite=async()=>{
   let r;
   try{r=await verifyPrerequisite({
    operationId,ownerGitHubId:REPO.ownerGitHubId,
    repositoryId:REPO.id,ref:REPO.ref,
    sourceRevision:op.sourceRevision,
    snapshotSha256:op.snapshotSha256,
    baseTreeSha:claim.baseTreeSha,
    requestSha256:claim.requestSha256,
    stepKey:'tree',
   });}catch{deny('PRECONDITION_UNVERIFIED');}
   need(r?.verified===true&&
    r.operationId===operationId&&
    r.repositoryId===REPO.id&&
    r.ownerGitHubId===REPO.ownerGitHubId&&
    r.ref===REPO.ref&&
    r.sourceRevision===op.sourceRevision&&
    r.baseTreeSha===claim.baseTreeSha&&
    r.requestSha256===claim.requestSha256,
    'PRECONDITION_UNVERIFIED');
  };
  await prerequisite();
  const at=now();
  need(Number.isSafeInteger(at)&&at>0,'INVALID_CLOCK');
  const claimed=await insert(claim,at);
  const row=await read(operationId,'tree');
  outcome(row,claim);
  if(claimed?.meta?.changes!==1)return outcome(row,claim);
  active();
  let token;
  try{
   const t=await issueWriteToken({
    repositoryId:REPO.id,permissions:SCOPE,
   });
   need(t?.repositoryId===REPO.id&&
    t.permissions?.contents==='write'&&
    Object.keys(t.permissions).length===1&&
    typeof t.token==='string'&&t.token.length>=20,
    'TOKEN_SCOPE_DENIED');
   token=t.token;
  }catch{return outcome(row,claim);}
  active();
  // A fresh read protects against main/source drift during token minting.
  // Failure leaves Unknown; this operation/tree cannot be replayed.
  await prerequisite();
  active();
  try{
   const created=await request(URL,{
    method:'POST',redirect:'manual',cache:'no-store',
    credentials:'omit',headers:{
     Authorization:'Bearer '+token,
     Accept:'application/vnd.github+json',
     'X-GitHub-Api-Version':'2026-03-10',
     'Content-Type':'application/json',
     'User-Agent':'fishing-d6-atomic-tree-source',
    },body:JSON.stringify(claim.body),
   });
   // This is only a server-owned CANDIDATE, not VerifiedTree. An HTTP 201
   // without an intact, bounded response is still sticky Unknown.
   if(!(created instanceof Response)||created.status!==201||
    created.redirected!==false||
    (created.url&&created.url!==URL)||
    !/\bapplication\/(?:vnd\.github\+)?json\b/i.test(
     created.headers.get('Content-Type')??''))
    return outcome(row,claim,true);
   const candidate=await readD6BoundedJson(created,65536);
   if(!SHA.test(candidate?.sha??'')||
    candidate.sha===claim.baseTreeSha)
    return outcome(row,claim,true);
   await storeCandidateTreeHint({
    operationId,repositoryId:REPO.id,ref:REPO.ref,
    sourceRevision:op.sourceRevision,
    requestSha256:claim.requestSha256,
    resultTreeSha:candidate.sha,
   });
  }catch{return outcome(row,claim,true);}
  return outcome(row,claim,true);
 }
 return Object.freeze({attempt});
}
