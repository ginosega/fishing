/**
 * D6 independent GitHub Git-Data/PR read-back — SOURCE ONLY / DEFAULT OFF.
 *
 * Examines actual GitHub objects using an injected trusted server-only token
 * and fixed GET endpoints. Never issues a POST/PATCH, mutates D1, authorizes
 * merge, or declares a hosted Live release.
 *
 * This verifies an immutable UNKNOWN step fence against the SAME compiled
 * request fingerprint as the disabled D6 writer. A verified return is a
 * read-only evidence snapshot, NOT a durable reconciliation transition.
 *
 * Git object creation can yield unreachable objects. If a tree/commit SHA
 * cannot independently be determined, it MUST remain UNKNOWN: this module
 * never infers a result SHA from a missing provider acknowledgment and
 * never authorizes replay.
 */
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';
import {describeD6ProductionGitHubStep}
 from './d6-production-github-step-writer.mjs';
import {safePath}
 from '../../../../pwa/src/shared.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const BASE='https://api.github.com/repos/'+REPO.name;
const SHA=/^[a-f0-9]{40}$/;
const HASH=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const STEP=new Set(['branch','blob','tree','commit','advance','pr']);
const SCOPE=Object.freeze({contents:'write',pull_requests:'write'});
const MAX_JSON=6*1024*1024,MAX_ENTRIES=2500;
const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
const plain=value=>value!==null&&typeof value==='object'&&
 !Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
export class D6GitHubReadbackError extends Error {
 constructor(code){super('D6 external GitHub step remains unverified');
  this.name='D6GitHubReadbackError';this.code=code;}
}
const deny=code=>{throw new D6GitHubReadbackError(code);};
const need=(v,code)=>{if(!v)deny(code);};
function operation(row,id){
 need(row?.operationId===id&&UUID.test(id)&&
  row.ownerGitHubId===REPO.ownerGitHubId&&
  row.repositoryId===REPO.id&&row.ref===REPO.ref&&
  row.state==='Accepted'&&SHA.test(row.sourceRevision??'')&&
  HASH.test(row.candidateSha256??'')&&
  ['gear','kb'].includes(row.domain)&&
  ['add','edit'].includes(row.operation),'UNTRUSTED_OPERATION');
 return row;
}
const branch=id=>'fish-v3/publish/'+id;
const hex=async(bytes,algo)=>Array.from(new Uint8Array(
 await crypto.subtle.digest(algo,bytes)),
 x=>x.toString(16).padStart(2,'0')).join('');
const gitBlobSha=async bytes=>{
 const prefix=enc.encode('blob '+bytes.byteLength+'\0');
 const object=new Uint8Array(prefix.length+bytes.length);
 object.set(prefix);object.set(bytes,prefix.length);
 return hex(object,'SHA-1');
};
function sameBytes(a,b){
 if(a.length!==b.length)return false;
 let v=0;for(let i=0;i<a.length;i++)v|=a[i]^b[i];
 return v===0;
}
function blobContents(base64){
 need(typeof base64==='string'&&base64.length>0&&
  base64.length<=200000,'BLOB_UNVERIFIED');
 const compact=base64.replace(/\s/g,'');
 need(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
  .test(compact),'BLOB_UNVERIFIED');
 let bytes;
 try{bytes=Uint8Array.from(atob(compact),c=>c.charCodeAt(0));}
 catch{deny('BLOB_UNVERIFIED');}
 need(bytes.length<=131072,'BLOB_UNVERIFIED');
 return bytes;
}
function refResult(row,id,sha){
 need(plain(row)&&row.ref==='refs/heads/'+branch(id)&&
  row.object?.type==='commit'&&row.object.sha===sha,
  'REF_UNVERIFIED');
}
function commitResult(row,id,sha,treeSha,source){
 need(plain(row)&&row.sha===sha&&
  row.message==='Fishing Companion V3 content update '+id&&
  row.tree?.sha===treeSha&&
  Array.isArray(row.parents)&&row.parents.length===1&&
  row.parents[0]?.sha===source,'COMMIT_UNVERIFIED');
}
function treeMap(value){
 need(plain(value)&&SHA.test(value.sha??'')&&
  value.truncated===false&&Array.isArray(value.tree)&&
  value.tree.length<=MAX_ENTRIES,'TREE_UNVERIFIED');
 const result=new Map(),folded=new Set();
 for(const item of value.tree){
  let validPath=false;
  try{validPath=typeof item?.path==='string'&&
    safePath(item.path)===item.path;}catch{}
  need(validPath&&
   ['blob','tree'].includes(item.type)&&
   SHA.test(item.sha??'')&&
   (item.type==='tree'?item.mode==='040000':
    ['100644','100755','120000','160000'].includes(item.mode)),
   'TREE_UNVERIFIED');
  const key=item.path.normalize('NFKC').toLowerCase();
  need(!folded.has(key),'TREE_UNVERIFIED');folded.add(key);
  if(item.type==='blob')result.set(item.path,item);
 }
 return result;
}
function treeComparison(original,next,plan,domain){
 const before=treeMap(original),after=treeMap(next);
 const expected=new Map(plan.entries.map(e=>[e.path,e]));
 const all=new Set([...before.keys(),...after.keys()]);
 const changed=new Set();
 for(const path of all){
  const was=before.get(path),now=after.get(path);
  if(was?.sha!==now?.sha||was?.mode!==now?.mode||
   was?.type!==now?.type)changed.add(path);
 }
 const json=domain==='gear'?'Gear/gear.json':'KB/kb.json';
 need(expected.has(json)&&expected.get(json).sha!==null&&
  changed.has(json),'TREE_UNVERIFIED');
 need(changed.size>0&&changed.size<=20&&
  [...changed].every(path=>expected.has(path))&&
  [...expected.keys()].every(path=>changed.has(path)),
  'TREE_UNVERIFIED');
 for(const [path,item] of expected){
  const file=after.get(path);
  need(item.sha===null?!file:
   !!file&&file.sha===item.sha&&file.mode==='100644'&&
   file.type==='blob','TREE_UNVERIFIED');
 }
 return changed.size;
}
async function boundedJson(response,list=false){
 need(response instanceof Response&&response.status===200&&
  response.redirected===false&&
  /\bapplication\/json\b/i.test(response.headers.get('Content-Type')??''),
  'GITHUB_READ_UNAVAILABLE');
 const len=response.headers.get('Content-Length');
 if(len!==null)need(/^\d+$/.test(len)&&Number(len)<=MAX_JSON,
  'GITHUB_READ_UNAVAILABLE');
 if(list)need(!/\brel="next"/i.test(
  response.headers.get('Link')??''),'INCOMPLETE_PR_LIST');
 const reader=response.body?.getReader();
 need(reader,'GITHUB_READ_UNAVAILABLE');
 const chunks=[];let n=0;
 try{
  while(true){
   const {done,value}=await reader.read();if(done)break;
   n+=value.byteLength;
   if(n>MAX_JSON){await reader.cancel();deny('GITHUB_READ_UNAVAILABLE');}
   chunks.push(value);
  }
 }catch(e){if(e instanceof D6GitHubReadbackError)throw e;
  deny('GITHUB_READ_UNAVAILABLE');}
 need(n>0,'GITHUB_READ_UNAVAILABLE');
 const bytes=new Uint8Array(n);let offset=0;
 for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
 try{return JSON.parse(dec.decode(bytes));}
 catch{deny('GITHUB_READ_UNAVAILABLE');}
}

export function createD6ProductionGitHubReadback({
 readOperation,readStepFence,planStep,issueWriteToken,
 request,enabled=()=>false,
}={}){
 need([readOperation,readStepFence,planStep,issueWriteToken,
  request,enabled].every(fn=>typeof fn==='function'),'INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 async function github(url,token,{list=false}={}){
  active();
  need(typeof url==='string'&&url.startsWith(BASE+'/')&&
   !url.includes('#'),'UNTRUSTED_URL');
  let response;
  try{response=await request(url,{
   method:'GET',redirect:'manual',cache:'no-store',
   credentials:'omit',headers:{
    Authorization:'Bearer '+token,
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2026-03-10',
    'User-Agent':'fishing-d6-independent-readback',
   },
  });}
  catch{deny('GITHUB_READ_UNAVAILABLE');}
  need(response instanceof Response&&
   (!response.url||response.url===url),'GITHUB_READ_UNAVAILABLE');
  return boundedJson(response,list);
 }
 async function inspect(operationId,step){
  active();need(UUID.test(operationId??''),'INVALID_OPERATION');
  need(STEP.has(step),'INVALID_STEP');
  let op,plan,fence;
  try{op=operation(await readOperation(operationId),operationId);
   plan=await planStep({operationId,step});}
  catch(e){if(e instanceof D6GitHubReadbackError)throw e;
   deny('LOCAL_EVIDENCE_UNAVAILABLE');}
  let action;
  try{action=await describeD6ProductionGitHubStep({
   operation:op,step,plan,
  });}
  catch{deny('UNTRUSTED_PLAN');}
  try{fence=await readStepFence({operationId,stepKey:action.key});}
  catch{deny('LOCAL_EVIDENCE_UNAVAILABLE');}
  need(fence?.operation_id===operationId&&
   fence.step_key===action.key&&
   fence.owner_github_id===REPO.ownerGitHubId&&
   fence.repository_id===REPO.id&&
   fence.request_sha256===action.requestSha256&&
   fence.state==='Unknown','FENCE_MISMATCH');
  let grant;
  try{grant=await issueWriteToken({
   repositoryId:REPO.id,permissions:SCOPE,
  });}
  catch{deny('TOKEN_UNAVAILABLE');}
  need(grant?.repositoryId===REPO.id&&
   plain(grant.permissions)&&
   grant.permissions?.contents==='write'&&
   grant.permissions?.pull_requests==='write'&&
   Object.keys(grant.permissions).length===2&&
   typeof grant.token==='string'&&grant.token.length>=20,
   'TOKEN_UNAVAILABLE');
  active();
  const token=grant.token,b=branch(operationId);
  let proof={};
  if(step==='branch'){
   const ref=await github(BASE+'/git/ref/heads/'+b,token);
   refResult(ref,operationId,op.sourceRevision);
   proof={remoteObjectSha:op.sourceRevision};
  }else if(step==='blob'){
   const bytes=enc.encode(action.body.content);
   const expected=await gitBlobSha(bytes);
   const blob=await github(BASE+'/git/blobs/'+expected,token);
   need(blob?.sha===expected&&blob.encoding==='base64'&&
    blob.size===bytes.length&&sameBytes(blobContents(blob.content),bytes),
    'BLOB_UNVERIFIED');
   proof={remoteObjectSha:expected,verifiedBytes:bytes.length};
  }else if(step==='tree'){
   need(SHA.test(plan.resultTreeSha??'')&&
    SHA.test(action.body.base_tree),'OBJECT_ID_UNKNOWN');
   const main=await github(BASE+'/git/commits/'+op.sourceRevision,token);
   need(main?.sha===op.sourceRevision&&
    main.tree?.sha===action.body.base_tree,'BASE_TREE_UNVERIFIED');
   const source=await github(BASE+'/git/trees/'+
    action.body.base_tree+'?recursive=1',token);
   const target=await github(BASE+'/git/trees/'+
    plan.resultTreeSha+'?recursive=1',token);
   need(source.sha===action.body.base_tree&&
    target.sha===plan.resultTreeSha,'TREE_UNVERIFIED');
   proof={remoteObjectSha:plan.resultTreeSha,
    changedPathsVerified:treeComparison(source,target,action.body,
     op.domain)};
  }else if(step==='commit'){
   need(SHA.test(plan.resultCommitSha??''),'OBJECT_ID_UNKNOWN');
   const commit=await github(BASE+'/git/commits/'+plan.resultCommitSha,
    token);
   commitResult(commit,operationId,plan.resultCommitSha,
    action.body.tree,op.sourceRevision);
   proof={remoteObjectSha:plan.resultCommitSha};
  }else if(step==='advance'){
   const ref=await github(BASE+'/git/ref/heads/'+b,token);
   refResult(ref,operationId,action.body.sha);
   const commit=await github(BASE+'/git/commits/'+action.body.sha,token);
   need(commit?.sha===action.body.sha&&
    commit.message==='Fishing Companion V3 content update '+operationId&&
    Array.isArray(commit.parents)&&commit.parents.length===1&&
    commit.parents[0]?.sha===op.sourceRevision&&
    SHA.test(commit.tree?.sha??''),'COMMIT_UNVERIFIED');
   proof={remoteObjectSha:action.body.sha,
    remoteTreeSha:commit.tree.sha};
  }else if(step==='pr'){
   const url=BASE+'/pulls?state=all&head='+
    encodeURIComponent('ginosega:'+b)+'&per_page=100';
   const list=await github(url,token,{list:true});
   need(Array.isArray(list)&&list.length===1,'PR_UNVERIFIED');
   const pr=list[0];
   need(Number.isSafeInteger(pr?.number)&&pr.number>0&&
    pr.state==='open'&&pr.draft===false&&pr.merged_at==null&&
    pr.head?.ref===b&&pr.head?.repo?.id===REPO.id&&
    SHA.test(pr.head?.sha??'')&&
    pr.base?.ref==='main'&&pr.base?.repo?.id===REPO.id,
    'PR_UNVERIFIED');
   const ref=await github(BASE+'/git/ref/heads/'+b,token);
   refResult(ref,operationId,pr.head.sha);
   const commit=await github(BASE+'/git/commits/'+pr.head.sha,token);
   need(commit?.sha===pr.head.sha&&
    commit.message==='Fishing Companion V3 content update '+operationId&&
    Array.isArray(commit.parents)&&commit.parents.length===1&&
    commit.parents[0]?.sha===op.sourceRevision&&
    SHA.test(commit.tree?.sha??''),'PR_UNVERIFIED');
   proof={prNumber:pr.number,remoteObjectSha:pr.head.sha,
    remoteTreeSha:commit.tree.sha};
  }
  active();
  return Object.freeze({
   operationId,step,stepKey:action.key,
   originalRequestSha256:action.requestSha256,
   ...proof,githubReadbackVerified:true,
   fenceStillUnknown:true,requiresDurableReconciliation:true,
   sourceOnly:true,canMerge:false,canPublish:false,isLive:false,
  });
 }
 return Object.freeze({inspect});
}
