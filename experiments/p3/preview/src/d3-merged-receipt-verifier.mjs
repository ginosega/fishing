/**
 * FISH118 D3 source-only: independently verify an already merged private
 * sandbox PR after the Merging write-ahead marker has blocked all retry.
 *
 * Read-only GitHub App token; NO GitHub write, no retry, no public repository.
 * Failure must leave D1 untouched; success is only a proposal for the
 * store's exact-receipt compare-and-swap transition to Deploying.
 */
const ID=1430581407,REPO='ginosega/fishing-p3-sandbox';
const API='https://api.github.com/repos/'+REPO;
const SHA=/^[0-9a-f]{40}$/;
const OP=/^p3_[0-9a-f-]{36}$/;
const READ=Object.freeze({contents:'read',pull_requests:'read'});
const success=x=>Number.isSafeInteger(x)&&x>0;
export class D3MergeVerificationError extends Error{
 constructor(code){
  super('D3 sandbox completed-merge evidence refused');
  this.name='D3MergeVerificationError';this.code=code;
 }
}
const fail=code=>{throw new D3MergeVerificationError(code);};
const need=(yes,code)=>{if(!yes)fail(code);};
export function createD3MergedReceiptVerifier({request,issueReadToken,
 enabled=()=>false}={}){
 need([request,issueReadToken,enabled].every(f=>typeof f==='function'),
  'INVALID_CONFIGURATION');
 async function read(token,path){
  need(path===API||path.startsWith(API+'/'),'URL_DENIED');
  let response;
  try{response=await request(path,{method:'GET',redirect:'manual',
   headers:{Authorization:'Bearer '+token,
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2026-03-10',
    'User-Agent':'fishing-d3-merged-receipt-observer'}});}
  catch{fail('GITHUB_UNAVAILABLE');}
  need(response?.status===200&&response.ok===true&&
   response.redirected!==true,'GITHUB_UNAVAILABLE');
  try{return await response.json();}
  catch{fail('INVALID_GITHUB_RESPONSE');}
 }
 async function verify({operationId,repositoryId,prNumber,prHeadSha,
   mainBaseSha,workflowRunId,expectedPaths}={}){
  need(enabled()===true,'RECOVERY_DISABLED');
  need(repositoryId===ID&&OP.test(operationId??'')&&
   success(prNumber)&&SHA.test(prHeadSha??'')&&
   SHA.test(mainBaseSha??'')&&prHeadSha!==mainBaseSha&&
   success(workflowRunId)&&
   Array.isArray(expectedPaths)&&[1,2].includes(expectedPaths.length)&&
   new Set(expectedPaths).size===expectedPaths.length&&
   expectedPaths.every(p=>p==='pwa/Gear/gear.json'||p==='pwa/KB/kb.json'||
    /^pwa\/(Gear|KB)\/[A-Za-z0-9 _./-]+\.md$/.test(p))&&
   expectedPaths.includes(expectedPaths.some(p=>p==='pwa/Gear/gear.json')?
    'pwa/Gear/gear.json':'pwa/KB/kb.json'),
   'INVALID_TRUSTED_RECEIPT');
  const granted=await issueReadToken({repositoryId:ID,
   permissions:{...READ}});
  need(granted?.repositoryId===ID&&
   granted?.permissions?.contents==='read'&&
   granted.permissions.pull_requests==='read'&&
   Object.keys(granted.permissions).length===2&&
   typeof granted.token==='string'&&granted.token.length>=12,
   'READ_SCOPE_DENIED');
  const token=granted.token;
  const repo=await read(token,API);
  need(repo?.id===ID&&repo.full_name===REPO&&repo.private===true,
   'REPOSITORY_DENIED');
  const prUrl=API+'/pulls/'+prNumber;
  const mainUrl=API+'/git/ref/heads/main';
  const pr=await read(token,prUrl);
  need(pr?.number===prNumber&&pr?.state==='closed'&&
   pr.merged===true&&typeof pr.merged_at==='string'&&
   SHA.test(pr.merge_commit_sha??'')&&
   pr.head?.repo?.id===ID&&pr.base?.repo?.id===ID&&
   pr.base.ref==='main'&&
   pr.head.ref==='p3-test-'+operationId.slice(3)&&
   pr.head.sha===prHeadSha&&
   pr.base.sha===mainBaseSha,'PR_NOT_EXACT_MERGED');
  const mergeSha=pr.merge_commit_sha;
  const main=await read(token,mainUrl);
  need(main?.object?.sha===mergeSha,'MERGE_NOT_CURRENT_MAIN');
  const commit=await read(token,API+'/commits/'+mergeSha+'?per_page=100');
  need(commit?.sha===mergeSha&&
   Array.isArray(commit.parents)&&commit.parents.length===1&&
   commit.parents[0]?.sha===mainBaseSha&&
   Array.isArray(commit.files)&&commit.files.length===expectedPaths.length&&
   commit.files.every(f=>f?.status==='modified'||f?.status==='added')&&
   new Set(commit.files.map(f=>f.filename)).size===commit.files.length&&
   expectedPaths.every(p=>commit.files.some(f=>f.filename===p))&&
   commit.commit?.message?.startsWith(
    'FISH118 D3 isolated sandbox Gear/KB publication'),
   'MERGE_COMMIT_NOT_EXACT');
  const finalPr=await read(token,prUrl);
  const last=await read(token,mainUrl);
  need(finalPr?.number===prNumber&&finalPr.merged===true&&
   finalPr.merge_commit_sha===mergeSha&&
   finalPr.head?.sha===prHeadSha&&finalPr.base?.sha===mainBaseSha&&
   last?.object?.sha===mergeSha,'MERGE_EVIDENCE_MOVED');
  return Object.freeze({verified:true,repositoryId:ID,operationId,
   prNumber,prHeadSha,mainBaseSha,mergeSha,workflowRunId,
   canonicalLive:false});
 }
 return Object.freeze({verify});
}
