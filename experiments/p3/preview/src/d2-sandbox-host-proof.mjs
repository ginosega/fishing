/**
 * FISH118 D2 isolated host proof. Only a sandbox-test GET can use the HMAC;
 * never the /session, OAuth, or /api/v3/operations write/status endpoints.
 * Server key remains a Cloudflare encrypted secret. No source or browser key.
 *
 * The verifier sends a short-lived HMAC probe to the REAL configured HTTPS
 * production origin and compares response bytes with an independently
 * fetched Git blob at the exact recorded private sandbox merge commit.
 * If Cloudflare disallows same-origin Worker fetches, this fails closed;
 * use an approved independent verifier rather than fabricating proof.
 */
import {decodeD2GitBlob} from './d2-worker-source-candidate.mjs';
const ID=1430581407;
const API='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const FILE='pwa/Gear/gear.json';
const SHA=/^[0-9a-f]{40}$/;
const OP=/^p3_[a-f0-9-]{36}$/;
const te=new TextEncoder();
export class D2HostProofError extends Error {
 constructor(code){super('D2 production-origin sandbox verification denied');this.code=code;this.name='D2HostProofError';}
}
const fail=code=>{throw new D2HostProofError(code);};
const need=(v,c)=>{if(!v)fail(c);};
const hex=a=>Array.from(new Uint8Array(a),b=>b.toString(16).padStart(2,'0')).join('');
const digest=async bytes=>hex(await crypto.subtle.digest('SHA-256',bytes));
const b64=a=>{
 let s='';for(const b of new Uint8Array(a))s+=String.fromCharCode(b);
 return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
const fixedEqual=(a,b)=>{
 if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;
 let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);
 return d===0;
};
export function createD2SandboxHostProof({
 origin,key,store,issueReadToken,requestGitHub,requestHosted,
 now=()=>Math.floor(Date.now()/1000),
}={}){
 need(typeof origin==='string'&&/^https:\/\/[^/]+$/.test(origin)&&
  typeof key==='string'&&te.encode(key).length>=32&&
  typeof store?.get==='function'&&typeof issueReadToken==='function'&&
  typeof requestGitHub==='function'&&typeof requestHosted==='function'&&
  typeof now==='function','INVALID_CONFIGURATION');
 const sign=async (path,expiry)=>{
  const k=await crypto.subtle.importKey('raw',te.encode(key),
   {name:'HMAC',hash:'SHA-256'},false,['sign']);
  return b64(await crypto.subtle.sign('HMAC',k,
   te.encode('D2-test-only-host-GET\n'+origin+'\n'+path+'\n'+expiry)));
 };
 const pathFor=op=>'/__d2_test__/operations/'+op+'/Gear/gear.json';
 async function authorizeProbe(req,operationId){
  if(!OP.test(operationId)||req.method!=='GET')return false;
  const url=new URL(req.url);
  if(url.origin!==origin||url.pathname!==pathFor(operationId)||
   url.search||url.hash||req.headers.has('Authorization'))return false;
  const header=req.headers.get('X-Fish-D2-Host-Probe');
  if(typeof header!=='string'||header.length>180)return false;
  const match=/^([1-9]\d{8,11})\.([A-Za-z0-9_-]{43})$/.exec(header);
  if(!match)return false;
  const at=now(),expiry=Number(match[1]);
  if(!Number.isSafeInteger(at)||!Number.isSafeInteger(expiry)||
   expiry<at||expiry>at+45)return false;
  return fixedEqual(match[2],await sign(url.pathname,expiry));
 }
 async function gitRead(token,path){
  need(path===API||path.startsWith(API+'/'),'GITHUB_PATH_DENIED');
  let response;
  try{response=await requestGitHub(path,{method:'GET',redirect:'manual',
   headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2026-03-10','User-Agent':'fishing-d2-sandbox-host-proof'}});}
  catch{fail('GITHUB_READ_UNAVAILABLE');}
  need(response?.ok===true&&response.status===200&&!response.redirected,
   'GITHUB_READ_UNAVAILABLE');
  try{return await response.json();}catch{fail('INVALID_GITHUB_RESPONSE');}
 }
 async function verifyHosted(info){
  need(info?.repositoryId===ID&&OP.test(info.operationId)&&
   SHA.test(info.mergeSha)&&info.expectedPath===FILE&&
   info.canonicalLive===false,'INVALID_RECEIPT');
  const receipt=await store.get(info.operationId);
  need(receipt?.operationId===info.operationId&&
   receipt.state==='Verifying'&&receipt.mergeSha===info.mergeSha&&
   Number.isSafeInteger(receipt.workflowRunId)&&receipt.workflowRunId>0,
   'DURABLE_EVIDENCE_MISSING');
  const issued=await issueReadToken({repositoryId:ID,permissions:{contents:'read'}});
  need(issued?.repositoryId===ID&&issued?.permissions?.contents==='read'&&
   Object.keys(issued.permissions).length===1&&
   typeof issued.token==='string'&&issued.token.length>=12,'READ_TOKEN_DENIED');
  const token=issued.token;
  const repo=await gitRead(token,API);
  need(repo?.id===ID&&repo.private===true&&
   repo.full_name==='ginosega/fishing-p3-sandbox','REPO_DENIED');
  const main=await gitRead(token,API+'/git/ref/heads/main');
  need(main?.object?.sha===info.mergeSha,'MAIN_MOVED');
  const commit=await gitRead(token,API+'/git/commits/'+info.mergeSha);
  need(commit?.sha===info.mergeSha&&SHA.test(commit?.tree?.sha),
   'COMMIT_DENIED');
  const tree=await gitRead(token,API+'/git/trees/'+commit.tree.sha+'?recursive=1');
  need(tree?.sha===commit.tree.sha&&tree.truncated===false&&
   Array.isArray(tree.tree),'TREE_DENIED');
  const entries=tree.tree.filter(item=>item.path===FILE);
  need(entries.length===1,'FILE_DENIED');
  const blob=await gitRead(token,API+'/git/blobs/'+entries[0].sha);
  const expected=await decodeD2GitBlob(entries[0],blob);
  const expectedSha=await digest(expected);
  const path=pathFor(info.operationId),expiry=now()+30;
  let result;
  try{
   result=await requestHosted(origin+path,{method:'GET',redirect:'manual',
    cache:'no-store',headers:{
     'X-Fish-D2-Host-Probe':String(expiry)+'.'+await sign(path,expiry),
     'Cache-Control':'no-store','Accept':'application/json',
    }});
  }catch{fail('PRODUCTION_ORIGIN_UNAVAILABLE');}
  need(result?.ok===true&&result.status===200&&!result.redirected,
   'PRODUCTION_ORIGIN_UNAVAILABLE');
  need(result.headers.get('X-D2-Sandbox-Merge-Sha')===info.mergeSha&&
   result.headers.get('X-D2-Sandbox-Blob-Sha256')===expectedSha&&
   /no-store/i.test(result.headers.get('Cache-Control')??''),
   'HOSTED_METADATA_MISMATCH');
  const delivered=new Uint8Array(await result.arrayBuffer());
  need(delivered.length===expected.length&&
   await digest(delivered)===expectedSha&&delivered.every((b,i)=>b===expected[i]),
   'HOSTED_BYTES_MISMATCH');
  // This is an isolated test-asset digest, NOT a public PWA release ID.
  return Object.freeze({verified:true,repositoryId:ID,mergeSha:info.mergeSha,
   canonicalLive:false,verifiedReleaseId:expectedSha.slice(0,32),
   workflowRunId:receipt.workflowRunId,hostedSha256:expectedSha,
   testPath:path});
 }
 return Object.freeze({authorizeProbe,verifyHosted});
}
