/**
 * FISH118 WP3-2 — independent atomic canonical Git-tree readback + D1 proof.
 *
 * SOURCE ONLY / DEFAULT OFF / NO ROUTE.
 *
 * Re-derives the same #471 immutable write descriptor from the currently
 * trusted Accepted owner operation and #470 atomic media/Markdown plan,
 * validates its durable Unknown-before-POST fence, then compares the
 * COMPLETE GitHub base and candidate trees against the exact intended
 * modifications. The candidate SHA is a HINT from trusted server-side
 * provider-response custody; HTTP 201 and that hint alone prove NOTHING.
 *
 * If the response SHA was lost, cannot be obtained from authenticated
 * server-side custody, or an independent Git Data GET cannot establish
 * exactly the intended tree, leave the fence Unknown. NEVER replay the
 * GitHub mutation or invent a result object identifier.
 *
 * A valid readback produces a distinct immutable VerifiedTree D1 receipt,
 * NOT a verified commit, source PR, merged main, hosted release or Live.
 * Schema/permissions/secrets/routes remain unprovisioned pending approval.
 */
import {pathKey} from '../../../../pwa/src/shared.mjs';
import {describeD6AtomicTreeStep}
 from './d6-production-atomic-tree-step.mjs';
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const BASE='https://api.github.com/repos/'+REPO.name;
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const MAX_JSON=12*1024*1024,MAX_TREE=6000;
const READ_SCOPE=Object.freeze({contents:'read'});
const readFence='SELECT operation_id,step_key,owner_github_id,'+
 'repository_id,request_sha256,state,created_at '+
 'FROM d6_provider_step_fences WHERE operation_id=? AND step_key=?';
const readProof='SELECT operation_id,owner_github_id,repository_id,'+
 'request_sha256,source_revision,base_tree_sha,result_tree_sha,'+
 'changed_paths,state,verified_at FROM d6_atomic_tree_verified '+
 'WHERE operation_id=?';
const insertProof='INSERT OR IGNORE INTO d6_atomic_tree_verified '+
 '(operation_id,owner_github_id,repository_id,request_sha256,'+
 'source_revision,base_tree_sha,result_tree_sha,changed_paths,'+
 "state,verified_at) VALUES (?,?,?,?,?,?,?,?, 'VerifiedTree',?)";
export const D6_ATOMIC_TREE_PROOF_SQL=[
 'CREATE TABLE IF NOT EXISTS d6_atomic_tree_verified (',
 'operation_id TEXT NOT NULL PRIMARY KEY,',
 'owner_github_id INTEGER NOT NULL,',
 'repository_id INTEGER NOT NULL,',
 'request_sha256 TEXT NOT NULL,',
 'source_revision TEXT NOT NULL,',
 'base_tree_sha TEXT NOT NULL,',
 'result_tree_sha TEXT NOT NULL,',
 'changed_paths INTEGER NOT NULL CHECK(changed_paths>=1 AND changed_paths<=32),',
 "state TEXT NOT NULL DEFAULT 'VerifiedTree' CHECK(state='VerifiedTree'),",
 'verified_at INTEGER NOT NULL',
 ');',
].join('\n');

export class D6AtomicTreeReconciliationError extends Error{
 constructor(code){
  super('D6 atomic Git tree outcome is not independently verified');
  this.name='D6AtomicTreeReconciliationError';this.code=code;
 }
}
const deny=code=>{throw new D6AtomicTreeReconciliationError(code);};
const need=(valid,code)=>{if(!valid)deny(code);};
const plain=x=>x!==null&&typeof x==='object'&&
 !Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
function accepted(stored,id){
 const op=stored?.operation,pkg=stored?.package;
 need(op&&UUID.test(id??'')&&op.operationId===id&&
  op.state==='Accepted'&&op.ownerGitHubId===REPO.ownerGitHubId&&
  op.repositoryId===REPO.id&&op.ref===REPO.ref&&
  SHA.test(op.sourceRevision??'')&&
  DIGEST.test(op.snapshotSha256??'')&&
  ['gear','kb','catches'].includes(op.domain)&&
  ['add','edit'].includes(op.operation)&&
  op.recordId===pkg?.id&&op.domain===pkg?.domain&&
  op.operation===pkg?.operation&&
  pkg.base?.sourceRevision===op.sourceRevision&&
  Array.isArray(stored.mediaTickets),
  'UNTRUSTED_OPERATION');
 return op;
}
function frozenStatus(row,op,action,resultTreeSha,at){
 need(row?.operation_id===op.operationId&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  row.request_sha256===action.requestSha256&&
  row.source_revision===op.sourceRevision&&
  row.base_tree_sha===action.baseTreeSha&&
  row.result_tree_sha===resultTreeSha&&
  row.changed_paths===action.entryCount&&
  row.state==='VerifiedTree'&&
  Number.isSafeInteger(row.verified_at)&&row.verified_at>0&&
  row.verified_at<=at+60,'PROOF_MISMATCH');
 return Object.freeze({
  operationId:op.operationId,state:'VerifiedTree',
  verifiedTree:true,baseTreeSha:action.baseTreeSha,
  resultTreeSha,changedPaths:row.changed_paths,
  originalRequestSha256:action.requestSha256,
  verifiedAt:row.verified_at,
  sourceOnly:true,canPublish:false,isLive:false,
  requiresDurableCommit:true,
  requiresIndependentCommitReadback:true,
  requiresSourceRecheck:true,
  requiresGuardedPr:true,
 });
}
function treeBlobs(obj,expectedSha){
 need(plain(obj)&&obj.sha===expectedSha&&
  obj.truncated===false&&Array.isArray(obj.tree)&&
  obj.tree.length<=MAX_TREE,'TREE_UNVERIFIED');
 const files=new Map(),seen=new Set();
 for(const file of obj.tree){
  let key;
  try{key=pathKey(file?.path);}
  catch{deny('TREE_UNVERIFIED');}
  need(!seen.has(key)&&SHA.test(file.sha??'')&&
   (file.type==='tree'&&file.mode==='040000'||
    file.type==='blob'&&
     ['100644','100755','120000','160000'].includes(file.mode)),
   'TREE_UNVERIFIED');
  seen.add(key);
  if(file.type==='blob')files.set(file.path,{
   sha:file.sha,mode:file.mode,
  });
 }
 // A file and an ancestor directory cannot occupy the same path.
 for(const path of files.keys()){
  const components=path.split('/');
  for(let i=1;i<components.length;i++)
   need(!files.has(components.slice(0,i).join('/')),
    'TREE_UNVERIFIED');
 }
 return files;
}
function compareTrees(previous,next,expected){
 const before=treeBlobs(previous,expected.base_tree);
 const after=treeBlobs(next,expected.target_sha);
 const wanted=new Map(),keys=new Set();
 for(const item of expected.entries){
  let key;
  try{key=pathKey(item.path);}catch{deny('TREE_UNVERIFIED');}
  need(!keys.has(key),'TREE_UNVERIFIED');
  keys.add(key);
  wanted.set(item.path,item);
 }
 const all=new Set([...before.keys(),...after.keys()]);
 const changed=[];
 for(const path of all){
  const old=before.get(path),current=after.get(path);
  if(old?.sha!==current?.sha||old?.mode!==current?.mode)
   changed.push(path);
 }
 need(changed.length===wanted.size&&changed.length>0&&
  changed.every(path=>wanted.has(path)),'UNEXPECTED_TREE_CHANGE');
 for(const [path,entry] of wanted){
  const was=before.get(path),now=after.get(path);
  if(entry.sha===null){
   need(was&&now===undefined,'TREE_CONTENT_MISMATCH');
  }else{
   need(now?.sha===entry.sha&&now.mode==='100644'&&
    (!was||was.sha!==now.sha||was.mode!==now.mode),
    'TREE_CONTENT_MISMATCH');
   // Original media is new-only until same-path image replacement
   // receives a separate preimage Git blob verification gate.
   if(path.includes('/assets/'))
    need(!was,'EXISTING_MEDIA_COLLISION');
  }
 }
 return changed.length;
}
async function json(response,url){
 need(response instanceof Response&&
  response.status===200&&response.redirected===false&&
  (!response.url||response.url===url)&&
  /\bapplication\/(?:vnd\.github\+)?json\b/i.test(
   response.headers.get('Content-Type')??''),
  'GITHUB_READ_UNAVAILABLE');
 const len=response.headers.get('Content-Length');
 if(len!==null)need(/^\d+$/.test(len)&&
  Number(len)<=MAX_JSON,'GITHUB_READ_UNAVAILABLE');
 const reader=response.body?.getReader();
 need(reader,'GITHUB_READ_UNAVAILABLE');
 const chunks=[];let n=0;
 try{
  while(true){
   const {done,value}=await reader.read();if(done)break;
   need(value instanceof Uint8Array,'GITHUB_READ_UNAVAILABLE');
   n+=value.byteLength;
   need(n<=MAX_JSON,'GITHUB_READ_UNAVAILABLE');
   chunks.push(value);
  }
 }catch(e){
  try{await reader.cancel();}catch{}
  if(e instanceof D6AtomicTreeReconciliationError)throw e;
  deny('GITHUB_READ_UNAVAILABLE');
 }finally{try{reader.releaseLock();}catch{}}
 need(n>0,'GITHUB_READ_UNAVAILABLE');
 const bytes=new Uint8Array(n);let offset=0;
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true})
  .decode(bytes));}
 catch{deny('GITHUB_READ_UNAVAILABLE');}
}
/**
 * Host callbacks are trusted server dependencies; none may be implemented
 * by returning browser-submitted plans, operation objects or provider SHAs.
 * loadCandidateTreeHint supplies a server-held PROVISIONAL candidate SHA
 * and its exact immutable request identity. A lost hint leaves Unknown.
 */
export function createD6ProductionAtomicTreeReconciliation({
 DB,session,loadAcceptedOperation,atomicPlanner,
 loadCandidateTreeHint,issueReadToken,request,
 enabled=()=>false,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(DB?.prepare&&typeof session?.authorizeWrite==='function'&&
  typeof atomicPlanner?.plan==='function'&&
  [loadAcceptedOperation,loadCandidateTreeHint,issueReadToken,request,
   enabled,now].every(x=>typeof x==='function'),'INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 const read=async(sql,...args)=>{
  try{return await DB.prepare(sql).bind(...args).first();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 const insert=async(...args)=>{
  try{return await DB.prepare(insertProof).bind(...args).run();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 async function reconcile(authRequest,operationId){
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
  const op=accepted(stored,operationId);
  let plan,action;
  try{
   plan=await atomicPlanner.plan({
    operation:op,package:stored.package,
    mediaTickets:stored.mediaTickets,
   });
   action=await describeD6AtomicTreeStep({operation:op,plan});
  }catch{deny('ATOMIC_PLAN_UNVERIFIED');}
  const fence=await read(readFence,operationId,'tree');
  need(fence?.operation_id===operationId&&
   fence.step_key==='tree'&&
   fence.owner_github_id===REPO.ownerGitHubId&&
   fence.repository_id===REPO.id&&
   fence.request_sha256===action.requestSha256&&
   fence.state==='Unknown'&&
   Number.isSafeInteger(fence.created_at)&&fence.created_at>0,
   'FENCE_UNVERIFIED');
  let hint;
  try{hint=await loadCandidateTreeHint({
   operationId,repositoryId:REPO.id,ref:REPO.ref,
   sourceRevision:op.sourceRevision,
   requestSha256:action.requestSha256,
  });}catch{deny('RESULT_SHA_UNKNOWN');}
  need(hint?.provenance==='server-provider-result'&&
   hint.operationId===operationId&&
   hint.repositoryId===REPO.id&&hint.ref===REPO.ref&&
   hint.sourceRevision===op.sourceRevision&&
   hint.requestSha256===action.requestSha256&&
   SHA.test(hint.resultTreeSha??'')&&
   hint.resultTreeSha!==action.baseTreeSha,
   'RESULT_SHA_UNKNOWN');
  const resultTreeSha=hint.resultTreeSha;
  let token;
  try{const grant=await issueReadToken({
   repositoryId:REPO.id,permissions:READ_SCOPE,
  });
   need(grant?.repositoryId===REPO.id&&
    plain(grant.permissions)&&
    grant.permissions.contents==='read'&&
    Object.keys(grant.permissions).length===1&&
    typeof grant.token==='string'&&grant.token.length>=20,
    'TOKEN_UNAVAILABLE');
   token=grant.token;
  }catch{deny('TOKEN_UNAVAILABLE');}
  active();
  const github=async url=>{
   active();
   need(url.startsWith(BASE+'/'),'UNSAFE_GITHUB_URL');
   let response;
   try{response=await request(url,{
    method:'GET',redirect:'manual',cache:'no-store',
    credentials:'omit',headers:{
     Authorization:'Bearer '+token,
     Accept:'application/vnd.github+json',
     'X-GitHub-Api-Version':'2026-03-10',
     'User-Agent':'fishing-d6-atomic-tree-readback-source',
    },
   });}catch{deny('GITHUB_READ_UNAVAILABLE');}
   return json(response,url);
  };
  // Independently check that the reviewed source commit and base tree
  // really are the same GitHub main ref; no caller-provided "main is safe".
  const main=await github(BASE+'/git/ref/heads/main');
  need(main?.ref===REPO.ref&&
   main.object?.type==='commit'&&
   main.object.sha===op.sourceRevision,'SOURCE_MOVED');
  const commit=await github(BASE+'/git/commits/'+op.sourceRevision);
  need(commit?.sha===op.sourceRevision&&
   commit.tree?.sha===action.baseTreeSha,
   'BASE_TREE_UNVERIFIED');
  const original=await github(BASE+'/git/trees/'+
   action.baseTreeSha+'?recursive=1');
  const result=await github(BASE+'/git/trees/'+
   resultTreeSha+'?recursive=1');
  const changed=compareTrees(original,result,{
   base_tree:action.baseTreeSha,
   target_sha:resultTreeSha,entries:action.body.tree,
  });
  need(changed===action.entryCount,'UNEXPECTED_TREE_CHANGE');
  // Recheck main after potentially long remote/tree reads.
  const mainAfter=await github(BASE+'/git/ref/heads/main');
  need(mainAfter?.ref===REPO.ref&&
   mainAfter.object?.type==='commit'&&
   mainAfter.object.sha===op.sourceRevision,'SOURCE_MOVED');
  active();
  const at=now();
  need(Number.isSafeInteger(at)&&at>0,'INVALID_CLOCK');
  await insert(operationId,REPO.ownerGitHubId,REPO.id,
   action.requestSha256,op.sourceRevision,
   action.baseTreeSha,resultTreeSha,changed,at);
  const proof=await read(readProof,operationId);
  return frozenStatus(proof,op,action,resultTreeSha,at);
 }
 return Object.freeze({reconcile});
}
