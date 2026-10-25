/**
 * FISH118 D2 -- SOURCE ONLY: no enabled worker, secret, browser route or
 * actual GitHub write. Ordinary private-sandbox GitHub merge after genuine
 * exact-head checks. No ruleset bypass or production repository URL.
 *
 * The observer MUST be the separately reviewed GitHub App read-only
 * validate-sandbox-head observer. All credentials and D1 leases live in
 * trusted runtime. No automatic retries after an ambiguous PUT.
 */
const ID=1430581407,REPO='ginosega/fishing-p3-sandbox';
const API='https://api.github.com/repos/'+REPO;
const SHA=/^[a-f0-9]{40}$/;
const BRANCH=/^p3-test-[a-f0-9-]{36}$/;
const required={contents:'write',pull_requests:'write'};
export class D2MergeError extends Error{
 constructor(code){super('D2 sandbox merge denied');this.name='D2MergeError';this.code=code;}
}
const deny=code=>{throw new D2MergeError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
const safeNumber=x=>Number.isSafeInteger(x)&&x>0;
const hdr=t=>({
 Authorization:'Bearer '+t,Accept:'application/vnd.github+json',
 'X-GitHub-Api-Version':'2026-03-10','User-Agent':'fishing-d2-merge',
});
export function createD2SandboxNormalMerge({
 request,issueWriteToken,observeCheck,recordMerge,
 enabled=()=>false,
}={}){
 need(typeof request==='function'&&typeof issueWriteToken==='function'&&
  typeof observeCheck==='function'&&typeof recordMerge==='function'&&
  typeof enabled==='function','INVALID_CONFIG');
 async function api(token,method,path,body){
  need(path===API||path.startsWith(API+'/'),'URL_DENIED');
  let result;
  try{
   result=await request(path,{method,redirect:'manual',
    headers:{...hdr(token),...(body?{'Content-Type':'application/json'}:{})},
    ...(body?{body:JSON.stringify(body)}:{}),
   });
  }catch{deny(method==='GET'?'GITHUB_UNAVAILABLE':'WRITE_RESULT_UNKNOWN');}
  need(result?.ok===true&&!result.redirected,
   method==='GET'?'GITHUB_UNAVAILABLE':'WRITE_RESULT_UNKNOWN');
  try{return await result.json();}catch{
   deny(method==='GET'?'GITHUB_RESPONSE_DENIED':'WRITE_RESULT_UNKNOWN');
  }
 }
 const verifyPR=(pr,info,expectedDraft)=>{
  need(pr?.number===info.prNumber&&pr?.head?.repo?.id===ID&&
   pr?.base?.repo?.id===ID&&pr.head?.sha===info.expectedHeadSha&&
   pr.head?.ref===info.expectedBranch&&
   pr.base?.ref==='main'&&pr.base?.sha===info.expectedBaseSha&&
   pr.state==='open'&&pr.merged_at==null&&
   pr.draft===expectedDraft,'PR_CHANGED');
 };
 async function merge(info={}){
  need(enabled()===true,'MERGE_DISABLED');
  need(info.repositoryId===ID&&safeNumber(info.prNumber)&&
   SHA.test(info.expectedHeadSha)&&SHA.test(info.expectedBaseSha)&&
   info.expectedHeadSha!==info.expectedBaseSha&&
   BRANCH.test(info.expectedBranch),'INVALID_RECEIPT');
  let check;
  try{
   check=await observeCheck({...info});
  }catch{deny('CHECK_DENIED');}
  need(check?.repositoryId===ID&&check.prNumber===info.prNumber&&
   check.headSha===info.expectedHeadSha&&check.baseSha===info.expectedBaseSha&&
   check.actionsAppId===15368&&check.checkName==='validate-sandbox-head'&&
   safeNumber(check.checkRunId)&&check.checkObserved==='success'&&
   check.readyForManualReview===true,'CHECK_DENIED');
  // This observer does not grant merge authority; normal repo policy does.
  const issued=await issueWriteToken({repositoryId:ID,permissions:required});
  need(issued?.repositoryId===ID&&issued?.permissions?.contents==='write'&&
   issued?.permissions?.pull_requests==='write'&&
   Object.keys(issued.permissions).length===2&&
   typeof issued.token==='string'&&issued.token.length>=12,
   'WRITE_SCOPE_DENIED');
  const token=issued.token;
  const repo=await api(token,'GET',API);
  need(repo?.id===ID&&repo.full_name===REPO&&repo.private===true,
   'REPOSITORY_DENIED');
  const main=await api(token,'GET',API+'/git/ref/heads/main');
  need(main?.object?.sha===info.expectedBaseSha,'MAIN_MOVED');
  const pr=await api(token,'GET',API+'/pulls/'+info.prNumber);
  verifyPR(pr,info,true);
  // Transition draft PR to ready. GitHub itself enforces any branch rules.
  const ready=await api(token,'POST',
   API+'/pulls/'+info.prNumber+'/ready_for_review');
  verifyPR(ready,info,false);
  const afterMain=await api(token,'GET',API+'/git/ref/heads/main');
  need(afterMain?.object?.sha===info.expectedBaseSha,'MAIN_MOVED');
  const beforeMerge=await api(token,'GET',API+'/pulls/'+info.prNumber);
  verifyPR(beforeMerge,info,false);
  // The SHA precondition rejects a changed head; no force or bypass API.
  const result=await api(token,'PUT',API+'/pulls/'+info.prNumber+'/merge',{
   sha:info.expectedHeadSha,merge_method:'squash',
   commit_title:'FISH118 D2 isolated sandbox Gear verification',
   commit_message:'Single owned sandbox test operation; no public fishing content',
  });
  need(result?.merged===true&&SHA.test(result.sha),'WRITE_RESULT_UNKNOWN');
  const merged=await api(token,'GET',API+'/pulls/'+info.prNumber);
  need(merged?.merged_at!=null&&merged?.merge_commit_sha===result.sha&&
   merged.head?.sha===info.expectedHeadSha&&
   merged.base?.repo?.id===ID,'MERGE_EVIDENCE_DENIED');
  const finalMain=await api(token,'GET',API+'/git/ref/heads/main');
  need(finalMain?.object?.sha===result.sha,'MERGE_EVIDENCE_DENIED');
  let durable;
  try{
   durable=await recordMerge({...info,mergeSha:result.sha,
    checkRunId:check.checkRunId});
  }catch{deny('MERGE_RECEIPT_NOT_DURABLE');}
  need(durable?.repositoryId===ID&&durable?.mergeSha===result.sha&&
   durable?.prNumber===info.prNumber,'MERGE_RECEIPT_NOT_DURABLE');
  return Object.freeze({
   repositoryId:ID,prNumber:info.prNumber,
   headSha:info.expectedHeadSha,baseSha:info.expectedBaseSha,
   mergeSha:result.sha,checkRunId:check.checkRunId,
   sandboxMerged:true,canonicalLive:false,
  });
 }
 return Object.freeze({merge});
}
