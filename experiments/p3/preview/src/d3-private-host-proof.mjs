/**
 * FISH118 D3: HMAC-bound, production-origin, MULTI-FILE sandbox byte proof.
 * Default-off/server-side. A successful private GitHub merge is NOT Live.
 * Only real hosted responses matching every exact merged Git blob can
 * produce sandboxVerified and a synthetic sandbox release identity.
 * This does not prove public V3 or public canonical publication.
 */
import {decodeD2GitBlob} from './d2-worker-source-candidate.mjs';
import {decodeD4OriginalGitBlob} from './d4-git-blob-stage.mjs';
import {expectedD3HostedPaths,d3HostedTestPath}
 from './d3-sandbox-host-paths.mjs';
const ID=1430581407,REPO='ginosega/fishing-p3-sandbox';
const API='https://api.github.com/repos/'+REPO;
const SHA=/^[a-f0-9]{40}$/,OP=/^p3_[a-f0-9-]{36}$/;
const te=new TextEncoder();
const hex=a=>[...new Uint8Array(a)]
 .map(b=>b.toString(16).padStart(2,'0')).join('');
const b64=a=>{
 let s='';for(const byte of new Uint8Array(a))s+=String.fromCharCode(byte);
 return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
const equal=(a,b)=>{
 if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;
 let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);
 return n===0;
};
export class D3HostProofError extends Error{
 constructor(code){
  super('D3 sandbox multi-file hosted verification refused');
  this.name='D3HostProofError';this.code=code;
 }
}
const deny=code=>{throw new D3HostProofError(code);};
const need=(v,code)=>{if(!v)deny(code);};
export function createD3PrivateHostProof({
 origin,key,store,issueReadToken,requestGitHub,requestHosted,
 now=()=>Math.floor(Date.now()/1000),
 verifyMedia=async(_pkg,media)=>{
  need(media.length===0,'MEDIA_DISABLED');return [];
 },
}={}){
 need(typeof origin==='string'&&origin.startsWith('https://')&&
  new URL(origin).origin===origin&&
  typeof key==='string'&&te.encode(key).length>=32&&
  typeof store?.get==='function'&&typeof store?.readSnapshot==='function'&&
  [issueReadToken,requestGitHub,requestHosted,now,verifyMedia]
   .every(x=>typeof x==='function'),'INVALID_CONFIGURATION');
 const sign=async(path,expires)=>{
  const imported=await crypto.subtle.importKey('raw',te.encode(key),
   {name:'HMAC',hash:'SHA-256'},false,['sign']);
  return b64(await crypto.subtle.sign('HMAC',imported,
   te.encode('D3-test-only-host-GET\n'+origin+'\n'+path+'\n'+expires)));
 };
 async function authorizeProbe(request,operationId,file){
  if(!(request instanceof Request)||request.method!=='GET'||
   !OP.test(operationId))return false;
  const url=new URL(request.url);
  let canonical;
  try{canonical=d3HostedTestPath(operationId,file);}
  catch{return false;}
  if(url.origin!==origin||url.pathname!==canonical||
   url.search||url.hash||request.headers.has('Authorization'))return false;
  const header=request.headers.get('X-Fish-D3-Host-Probe');
  if(typeof header!=='string'||header.length>180)return false;
  const match=/^([1-9]\d{8,11})\.([A-Za-z0-9_-]{43})$/.exec(header);
  if(!match)return false;
  const at=now(),expires=Number(match[1]);
  if(!Number.isSafeInteger(at)||!Number.isSafeInteger(expires)||
   expires<at||expires>at+45)return false;
  return equal(match[2],await sign(canonical,expires));
 }
 async function gitRead(token,path){
  need(path===API||path.startsWith(API+'/'),'GITHUB_PATH_DENIED');
  let res;
  try{res=await requestGitHub(path,{
   method:'GET',redirect:'manual',
   headers:{Authorization:'Bearer '+token,
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2026-03-10',
    'User-Agent':'fishing-d3-sandbox-byte-proof'},
  });}catch{deny('GITHUB_UNAVAILABLE');}
  need(res?.ok===true&&res.status===200&&!res.redirected,
   'GITHUB_UNAVAILABLE');
  try{return await res.json();}catch{deny('GITHUB_UNAVAILABLE');}
 }
 async function verifyHosted(info={}){
  need(info.repositoryId===ID&&OP.test(info.operationId??'')&&
   SHA.test(info.mergeSha??'')&&
   Array.isArray(info.expectedPaths)&&
   info.expectedPaths.length>=1&&info.expectedPaths.length<=26&&
   info.canonicalLive===false,'INVALID_RECEIPT');
  const receipt=await store.get(info.operationId);
  need(receipt?.operationId===info.operationId&&
   receipt.state==='Verifying'&&receipt.mergeSha===info.mergeSha&&
   Number.isSafeInteger(receipt.workflowRunId)&&
   receipt.workflowRunId>0,'DURABLE_EVIDENCE_MISSING');
  const stored=await store.readSnapshot(info.operationId);
  let expected,media;
  try{
   need(Array.isArray(stored?.media),'INVALID_DURABLE_PACKAGE');
   media=await verifyMedia(stored.package,stored.media,{allowExpired:true});
   expected=expectedD3HostedPaths(stored.package,media);
  }catch{deny('INVALID_DURABLE_PACKAGE');}
  need(info.expectedPaths.length===expected.length&&
   expected.every((p,i)=>info.expectedPaths[i]===p),
   'PATHS_MISMATCH');
  const issued=await issueReadToken({repositoryId:ID,
   permissions:{contents:'read'}});
  need(issued?.repositoryId===ID&&
   issued.permissions?.contents==='read'&&
   Object.keys(issued.permissions).length===1&&
   typeof issued.token==='string'&&issued.token.length>=12,
   'READ_SCOPE_DENIED');
  const token=issued.token;
  const repo=await gitRead(token,API);
  need(repo?.id===ID&&repo.full_name===REPO&&repo.private===true,
   'REPOSITORY_DENIED');
  const current=await gitRead(token,API+'/git/ref/heads/main');
  need(current?.object?.sha===info.mergeSha,'MAIN_MOVED');
  const commit=await gitRead(token,API+'/git/commits/'+info.mergeSha);
  need(commit?.sha===info.mergeSha&&SHA.test(commit.tree?.sha),
   'COMMIT_DENIED');
  const tree=await gitRead(token,API+'/git/trees/'+commit.tree.sha+'?recursive=1');
  need(tree?.sha===commit.tree.sha&&tree.truncated===false&&
   Array.isArray(tree.tree)&&tree.tree.length<=1800,'TREE_DENIED');
  const verifiedPaths=[],digests=[];
  for(const file of expected){
   const entries=tree.tree.filter(x=>x.path===file);
   need(entries.length===1,'FILE_DENIED');
   const blob=await gitRead(token,API+'/git/blobs/'+entries[0].sha);
   const isImage=/\.(jpe?g|png|webp|gif)$/i.test(file);
   let bytes;
   try{bytes=isImage?(await decodeD4OriginalGitBlob(entries[0],blob)).bytes:
     await decodeD2GitBlob(entries[0],blob);}
   catch{deny('BLOB_DIGEST_DENIED');}
   need(bytes.length<=(isImage?10*1024*1024:131072),
    'FILE_TOO_LARGE');
   const expectedSha=hex(await crypto.subtle.digest('SHA-256',bytes));
   if(isImage){
    const receipt=media.find(m=>'pwa/'+m.path===file);
    need(receipt?.blobSha===entries[0].sha&&
     receipt.sha256===expectedSha&&receipt.bytes===bytes.length,
     'STAGED_ORIGINAL_MISMATCH');
   }
   const path=d3HostedTestPath(info.operationId,file);
   const expires=now()+30;
   let result;
   try{result=await requestHosted(origin+path,{
    method:'GET',redirect:'manual',cache:'no-store',
    headers:{
     'X-Fish-D3-Host-Probe':String(expires)+'.'+await sign(path,expires),
     'Cache-Control':'no-store',
     'Accept':isImage?'image/*':
      file.endsWith('.md')?'text/markdown':'application/json',
    },
   });}catch{deny('PRODUCTION_ORIGIN_UNAVAILABLE');}
   need(result?.ok===true&&result.status===200&&!result.redirected,
    'PRODUCTION_ORIGIN_UNAVAILABLE');
   need(result.headers?.get('X-D3-Sandbox-Merge-Sha')===info.mergeSha&&
    result.headers.get('X-D3-Sandbox-Blob-Sha256')===expectedSha&&
    /no-store/i.test(result.headers.get('Cache-Control')??''),
    'HOSTED_METADATA_MISMATCH');
   const delivered=new Uint8Array(await result.arrayBuffer());
   need(delivered.length===bytes.length&&
    hex(await crypto.subtle.digest('SHA-256',delivered))===expectedSha&&
    delivered.every((b,i)=>b===bytes[i]),
    'HOSTED_BYTES_MISMATCH');
   verifiedPaths.push(file);digests.push({file,sha256:expectedSha});
  }
  const latest=await gitRead(token,API+'/git/ref/heads/main');
  need(latest?.object?.sha===info.mergeSha,'MAIN_MOVED');
  // Synthetic sandbox identity derived from all verified hosted bytes,
  // not the actual public Pages/PWA release identity.
  const evidence=JSON.stringify({repositoryId:ID,
   mergeSha:info.mergeSha,digests});
  const release=hex(await crypto.subtle.digest('SHA-256',
   te.encode(evidence))).slice(0,32);
  return Object.freeze({
   verified:true,repositoryId:ID,mergeSha:info.mergeSha,
   canonicalLive:false,verifiedPaths:Object.freeze(verifiedPaths),
   verifiedReleaseId:release,workflowRunId:receipt.workflowRunId,
  });
 }
 return Object.freeze({authorizeProbe,verifyHosted});
}
