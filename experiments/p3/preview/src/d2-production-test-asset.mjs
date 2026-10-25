/**
 * FISH118 D2, SOURCE ONLY: isolated private sandbox test bytes hosted at
 * the INTENDED production HTTPS origin, without a second preview website.
 * This is NOT a canonical public release and MUST NEVER be called Live.
 * No active Worker route, App key, GitHub write, or default fetch.
 */
import {decodeD2GitBlob} from './d2-worker-source-candidate.mjs';
const ID=1430581407,REPO='ginosega/fishing-p3-sandbox';
const API='https://api.github.com/repos/'+REPO;
const SHA=/^[a-f0-9]{40}$/;
const OP=/^p3_[0-9a-f-]{36}$/;
const FILE='pwa/Gear/gear.json';
const PREFIX='/__d2_test__/operations/';
export class D2HostError extends Error{
 constructor(code){super('D2 hosted sandbox test unavailable');this.name='D2HostError';this.code=code;}
}
const fail=code=>{throw new D2HostError(code);};
const ensure=(v,c)=>{if(!v)fail(c);};
const payload=async resp=>{
 ensure(resp?.ok===true&&resp.status===200&&!resp.redirected,'SOURCE_UNAVAILABLE');
 try{return await resp.json();}catch{fail('BAD_GITHUB_JSON');}
};
export function createD2ProductionTestAsset({
 origin,ownerSession,readReceipt,issueReadToken,request,
 authorizeProbe=async()=>false,enabled=()=>false,
}={}){
 ensure(typeof origin==='string'&&/^https:\/\/[^/]+$/.test(origin)&&
  ownerSession&&typeof ownerSession.authorizeStatus==='function'&&
  typeof readReceipt==='function'&&typeof issueReadToken==='function'&&
  typeof request==='function'&&typeof authorizeProbe==='function'&&
  typeof enabled==='function','INVALID_CONFIG');
 async function read(token,url){
  ensure(url===API||url.startsWith(API+'/'),'URL_DENIED');
  let response;
  try{response=await request(url,{method:'GET',redirect:'manual',
   headers:{Authorization:'Bearer '+token,
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2026-03-10',
    'User-Agent':'fishing-d2-hosted-sandbox-test',
   }});}catch{fail('SOURCE_UNAVAILABLE');}
  return payload(response);
 }
 async function serve(req){
  // Always refuse without feature gate, including before any D1/token call.
  ensure(enabled()===true,'TEST_HOST_DISABLED');
  ensure(req instanceof Request&&req.method==='GET','INVALID_REQUEST');
  const u=new URL(req.url);
  ensure(u.origin===origin&&!u.search&&!u.hash&&
   u.pathname.startsWith(PREFIX)&&
   u.pathname.endsWith('/Gear/gear.json'),'INVALID_REQUEST');
  const op=u.pathname.slice(PREFIX.length,-'/Gear/gear.json'.length);
  ensure(OP.test(op),'INVALID_REQUEST');
  // A normal owner cookie is always valid. A private scheduled verifier may
  // alternatively supply a short-lived, path-bound HMAC on THIS read-only
  // sandbox test route; it cannot authenticate any publishing API.
  let ownerAuthorized=false;
  try{await ownerSession.authorizeStatus(req);ownerAuthorized=true;}
  catch{}
  if(!ownerAuthorized){
   let proof=false;
   try{proof=await authorizeProbe(req,op);}catch{}
   ensure(proof===true,'HOST_AUTH_DENIED');
  }
  const receipt=await readReceipt({operationId:op,repositoryId:ID});
  ensure(receipt?.operationId===op&&receipt.repositoryId===ID&&
   SHA.test(receipt.mergeSha)&&
   ['Deploying','Verifying','Live'].includes(receipt.state),
   'MERGE_RECEIPT_REQUIRED');
  const issued=await issueReadToken({repositoryId:ID,permissions:{contents:'read'}});
  ensure(issued?.repositoryId===ID&&issued?.permissions?.contents==='read'&&
   Object.keys(issued.permissions).length===1&&
   typeof issued.token==='string'&&issued.token.length>=12,'READ_SCOPE_DENIED');
  const token=issued.token;
  const repo=await read(token,API);
  ensure(repo?.id===ID&&repo?.private===true&&repo.full_name===REPO,'REPO_DENIED');
  const commit=await read(token,API+'/git/commits/'+receipt.mergeSha);
  ensure(commit?.sha===receipt.mergeSha&&SHA.test(commit.tree?.sha),'COMMIT_DENIED');
  const tree=await read(token,API+'/git/trees/'+commit.tree.sha+'?recursive=1');
  ensure(tree?.sha===commit.tree.sha&&tree.truncated===false&&
   Array.isArray(tree.tree),'TREE_DENIED');
  const entries=tree.tree.filter(x=>x.path===FILE);
  ensure(entries.length===1,'MANIFEST_DENIED');
  const blob=await read(token,API+'/git/blobs/'+entries[0].sha);
  const bytes=await decodeD2GitBlob(entries[0],blob);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const sha256=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  // Only this sandbox-specific test path; do not poison /fishing/ SW cache.
  return new Response(bytes,{status:200,headers:{
   'Content-Type':'application/json; charset=utf-8',
   'Cache-Control':'private, no-store, max-age=0',
   'Vary':'Cookie',
   'X-Content-Type-Options':'nosniff',
   'X-Robots-Tag':'noindex, nofollow',
   'X-D2-Sandbox-Merge-Sha':receipt.mergeSha,
   'X-D2-Sandbox-Blob-Sha256':sha256,
  }});
 }
 return Object.freeze({serve});
}
