/**
 * FISH118 D3: default-OFF, authenticated test-only Gear/KB hosted bytes.
 * No public /fishing/ paths, no GitHub writes and no mutable media staging.
 * Reads a specific verified sandbox merge SHA and serves only the 1-2
 * canonical record/Markdown files owned by that durable operation.
 */
import {decodeD2GitBlob} from './d2-worker-source-candidate.mjs';
import {parseD3HostedTestPath,expectedD3HostedPaths}
 from './d3-sandbox-host-paths.mjs';
const ID=1430581407,REPO='ginosega/fishing-p3-sandbox';
const API='https://api.github.com/repos/'+REPO;
const SHA=/^[a-f0-9]{40}$/;
const te=new TextEncoder();
const hex=bytes=>[...new Uint8Array(bytes)]
 .map(b=>b.toString(16).padStart(2,'0')).join('');
export class D3HostedAssetError extends Error{
 constructor(code){
  super('D3 private hosted test bytes unavailable');
  this.name='D3HostedAssetError';this.code=code;
 }
}
const deny=code=>{throw new D3HostedAssetError(code);};
const need=(v,code)=>{if(!v)deny(code);};
const meta={
 'Cache-Control':'private, no-store, max-age=0',
 'Vary':'Cookie','X-Content-Type-Options':'nosniff',
 'X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer',
};
export function createD3PrivateHostedAsset({
 origin,ownerSession,store,issueReadToken,requestGitHub,
 authorizeProbe=async()=>false,enabled=()=>false,
}={}){
 need(typeof origin==='string'&&origin.startsWith('https://')&&
  new URL(origin).origin===origin&&
  typeof ownerSession?.authorizeStatus==='function'&&
  typeof store?.get==='function'&&typeof store?.readSnapshot==='function'&&
  [issueReadToken,requestGitHub,authorizeProbe,enabled]
   .every(x=>typeof x==='function'),'INVALID_CONFIGURATION');
 async function read(token,path){
  need(path===API||path.startsWith(API+'/'),'GITHUB_PATH_DENIED');
  let response;
  try{response=await requestGitHub(path,{
   method:'GET',redirect:'manual',
   headers:{Authorization:'Bearer '+token,
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2026-03-10',
    'User-Agent':'fishing-d3-sandbox-host-test'},
  });}catch{deny('GITHUB_UNAVAILABLE');}
  need(response?.ok===true&&response.status===200&&
   !response.redirected,'GITHUB_UNAVAILABLE');
  try{return await response.json();}catch{deny('GITHUB_UNAVAILABLE');}
 }
 async function serve(request){
  need(enabled()===true,'HOST_DISABLED');
  need(request instanceof Request&&request.method==='GET',
   'INVALID_REQUEST');
  let url;
  try{url=new URL(request.url);}catch{deny('INVALID_REQUEST');}
  need(url.origin===origin&&!url.search&&!url.hash&&
   !request.headers.has('Authorization'),'INVALID_REQUEST');
  const path=parseD3HostedTestPath(url.pathname);
  need(path!==null,'INVALID_REQUEST');
  const {operationId,file}=path;
  let authenticated=false;
  try{
   const identity=await ownerSession.authorizeStatus(request);
   authenticated=identity?.authorized===true&&
    identity.ownerGitHubId===265665562;
  }catch{}
  if(!authenticated){
   let probe=false;
   try{probe=await authorizeProbe(request,operationId,file);}
   catch{}
   need(probe===true,'HOST_AUTH_DENIED');
  }
  const receipt=await store.get(operationId);
  need(receipt?.operationId===operationId&&SHA.test(receipt.mergeSha??'')&&
   ['Deploying','Verifying','Live'].includes(receipt.state),
   'MERGE_RECEIPT_MISSING');
  const submitted=await store.readSnapshot(operationId);
  let paths;
  try{paths=expectedD3HostedPaths(submitted?.package);}
  catch{deny('INVALID_DURABLE_PACKAGE');}
  need(paths.includes(file)&&Array.isArray(submitted.media)&&
   submitted.media.length===0,'UNAUTHORIZED_FILE');
  const issued=await issueReadToken({repositoryId:ID,
   permissions:{contents:'read'}});
  need(issued?.repositoryId===ID&&
   issued.permissions?.contents==='read'&&
   Object.keys(issued.permissions).length===1&&
   typeof issued.token==='string'&&issued.token.length>=12,
   'READ_SCOPE_DENIED');
  const t=issued.token;
  const repo=await read(t,API);
  need(repo?.id===ID&&repo.full_name===REPO&&repo.private===true,
   'REPOSITORY_DENIED');
  const commit=await read(t,API+'/git/commits/'+receipt.mergeSha);
  need(commit?.sha===receipt.mergeSha&&SHA.test(commit.tree?.sha),
   'COMMIT_DENIED');
  const tree=await read(t,API+'/git/trees/'+commit.tree.sha+'?recursive=1');
  need(tree?.sha===commit.tree.sha&&tree.truncated===false&&
   Array.isArray(tree.tree)&&tree.tree.length<=1800,'TREE_DENIED');
  const entries=tree.tree.filter(x=>x.path===file);
  need(entries.length===1,'FILE_DENIED');
  const blob=await read(t,API+'/git/blobs/'+entries[0].sha);
  let bytes;
  try{bytes=await decodeD2GitBlob(entries[0],blob);}
  catch{deny('GITHUB_BLOB_MISMATCH');}
  need(bytes.length<=131072,'FILE_TOO_LARGE');
  const sha256=hex(await crypto.subtle.digest('SHA-256',bytes));
  return new Response(bytes,{status:200,headers:{
   ...meta,
   'Content-Type':file.endsWith('.md')?
    'text/markdown; charset=utf-8':'application/json; charset=utf-8',
   'X-D3-Sandbox-Merge-Sha':receipt.mergeSha,
   'X-D3-Sandbox-Blob-Sha256':sha256,
  }});
 }
 return Object.freeze({serve});
}
