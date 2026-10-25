/**
 * FISH118 P3-9 — trusted Node-only, read-only sandbox PR CI observer.
 *
 * Source-only: no Worker route, no live App scope expansion, no GitHub writes,
 * no branch update, no draft->ready transition, and NO MERGE authority.
 * The owner's isolated live P3-11 test confirmed Checks:read on the dedicated
 * App installation. This module remains unintegrated and disabled by default;
 * do not enable it without a separately reviewed trusted runtime/deployment.
 *
 * Caller fields must come from a server-owned immutable D1 branch receipt,
 * never a browser request or an untrusted PR body.
 */
const ID=1430581407;
const REPO='ginosega/fishing-p3-sandbox';
const API='https://api.github.com/repos/'+REPO;
const CHECK='validate-sandbox-head';
const ACTIONS_APP_ID=15368;
const SHA=/^[a-f0-9]{40}$/;
const isSha=value=>typeof value==='string'&&SHA.test(value);
const safeBranch=value=>typeof value==='string'&&value.length>0&&value.length<=128&&
 /^(?:p3-test-[a-f0-9-]{36}|experiment\/p3-7-ci-smoke)$/.test(value);
const READ_ONLY=Object.freeze({contents:'read',pull_requests:'read',checks:'read'});

export class SandboxCheckError extends Error{
 constructor(code){super('P3 sandbox CI evidence cannot be trusted');this.name='SandboxCheckError';this.code=code;}
}
const fail=code=>{throw new SandboxCheckError(code);};
const ensure=(ok,code)=>{if(!ok)fail(code);};
const goodNumber=n=>Number.isSafeInteger(n)&&n>0;
function validatePR(pr,{number,head,base,branch}){
 ensure(pr?.number===number&&pr?.state==='open'&&pr?.draft===true&&
  pr?.merged_at==null&&pr?.merged!==true,'PR_NOT_OPEN_DRAFT');
 ensure(pr?.head?.repo?.id===ID&&pr?.base?.repo?.id===ID&&
  pr?.base?.ref==='main'&&pr?.head?.ref===branch,'PR_REPOSITORY_OR_BRANCH_DENIED');
 ensure(pr?.head?.sha===head&&pr?.base?.sha===base,'PR_HEAD_OR_BASE_MOVED');
}
export function createSandboxCheckObserver({
 request=fetch,issueCheckReadToken,enabled=()=>false,
}={}){
 ensure(typeof request==='function'&&typeof issueCheckReadToken==='function'&&
  typeof enabled==='function','INVALID_CONFIGURATION');
 async function read(token,url){
  ensure(url===API||url.startsWith(API+'/'),'REPOSITORY_DENIED');
  let response;
  try{
   response=await request(url,{method:'GET',headers:{
    Authorization:'Bearer '+token,
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2026-03-10',
    'User-Agent':'fishing-p3-sandbox-publisher',
   }});
  }catch{fail('GITHUB_NETWORK_ERROR');}
  ensure(response?.ok===true,'GITHUB_READ_FAILED');
  try{return await response.json();}catch{fail('INVALID_GITHUB_JSON');}
 }
 async function observe({
  repositoryId,prNumber,expectedHeadSha,expectedBaseSha,expectedBranch,
 }={}){
  ensure(enabled()===true,'OBSERVER_DISABLED');
  ensure(repositoryId===ID&&goodNumber(prNumber)&&
   isSha(expectedHeadSha)&&isSha(expectedBaseSha)&&
   expectedHeadSha!==expectedBaseSha&&safeBranch(expectedBranch),
   'INVALID_TRUSTED_RECEIPT');
  const issued=await issueCheckReadToken({
   repositoryId:ID,permissions:{...READ_ONLY},
  });
  ensure(issued?.repositoryId===ID&&typeof issued?.token==='string'&&
   issued.token.length>=12&&issued?.permissions&&
   Object.keys(issued.permissions).sort().join(',')==='checks,contents,pull_requests'&&
   Object.entries(READ_ONLY).every(([key,value])=>issued.permissions[key]===value),
   'READ_TOKEN_SCOPE_DENIED');
  const token=issued.token;
  const repo=await read(token,API);
  ensure(repo?.id===ID&&repo?.full_name===REPO&&repo?.private===true,
   'REPOSITORY_DENIED');
  const mainUrl=API+'/git/ref/heads/main',prUrl=API+'/pulls/'+prNumber;
  const firstMain=await read(token,mainUrl);
  ensure(firstMain?.object?.sha===expectedBaseSha,'MAIN_MOVED');
  const firstPR=await read(token,prUrl);
  validatePR(firstPR,{number:prNumber,head:expectedHeadSha,
   base:expectedBaseSha,branch:expectedBranch});
  const checks=await read(token,API+'/commits/'+expectedHeadSha+
   '/check-runs?per_page=100&filter=latest');
  ensure(Number.isSafeInteger(checks?.total_count)&&
   checks.total_count>=0&&checks.total_count<=100&&
   Array.isArray(checks.check_runs)&&checks.check_runs.length===checks.total_count,
   'CHECK_RESULTS_INCOMPLETE');
  const matches=checks.check_runs.filter(check=>check?.name===CHECK);
  ensure(matches.length===1,'CHECK_MISSING_OR_AMBIGUOUS');
  const check=matches[0];
  ensure(goodNumber(check?.id)&&check?.app?.id===ACTIONS_APP_ID&&
   check?.head_sha===expectedHeadSha,'CHECK_IDENTITY_DENIED');
  ensure(check?.status==='completed','CHECK_PENDING');
  ensure(check?.conclusion==='success','CHECK_NOT_SUCCESSFUL');
  // Bind a real GitHub Actions workflow run identifier to this trusted,
  // exact-head GitHub Actions check. No synthetic workflow run IDs.
  const detail=typeof check.details_url==='string'?
   /^https:\/\/github\.com\/ginosega\/fishing-p3-sandbox\/actions\/runs\/([1-9]\d{0,15})(?:\/job\/\d+)?\/?$/.exec(check.details_url):null;
  const workflowRunId=detail?Number(detail[1]):null;
  // Legacy read-only P3 review accepts a GitHub check without a workflow
  // URL; D2's write-capable runner separately requires a valid workflowRunId.
  // If GitHub supplies a URL, malformed provenance is a hard denial.
  if(check.details_url!=null)
   ensure(Number.isSafeInteger(workflowRunId)&&workflowRunId>0,
    'WORKFLOW_PROVENANCE_DENIED');
  // Recheck both mutable objects after reading CI so an intervening push or
  // PR head/base movement never becomes an accepted snapshot.
  const lastMain=await read(token,mainUrl);
  ensure(lastMain?.object?.sha===expectedBaseSha,'MAIN_MOVED');
  const lastPR=await read(token,prUrl);
  validatePR(lastPR,{number:prNumber,head:expectedHeadSha,
   base:expectedBaseSha,branch:expectedBranch});
  return Object.freeze({
   repositoryId:ID,prNumber,headSha:expectedHeadSha,baseSha:expectedBaseSha,
   checkRunId:check.id,
   ...(workflowRunId?{workflowRunId}:{}),
   checkName:CHECK,actionsAppId:ACTIONS_APP_ID,
   checkObserved:'success',readyForManualReview:true,
   canMerge:false,canDeploy:false,
  });
 }
 return Object.freeze({observe});
}
