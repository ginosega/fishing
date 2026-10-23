/**
 * P3 source-only GitHub App sandbox draft-PR adapter. NOT CONNECTED TO WORKER.
 * No production repo, auto-merge, branch force update, or live API calls.
 * Trusted candidate is a SERVER-OWNED validator callback, never browser input.
 */
export class SandboxPRError extends Error{
 constructor(code){super('Sandbox PR operation refused');this.name='SandboxPRError';this.code=code;}
}
const fail=code=>{throw new SandboxPRError(code);};
const ok=(yes,code)=>{if(!yes)fail(code);};
const REPO='ginosega/fishing-p3-sandbox',ID=1430581407,API='https://api.github.com/repos/'+REPO;
const sha=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
const op=s=>typeof s==='string'&&/^p3_[0-9a-f-]{36}$/.test(s);
const headers=token=>({
 'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10',
 'User-Agent':'fishing-p3-sandbox-publisher','Authorization':'Bearer '+token,
});
const branchOf=id=>'p3-test-'+id.slice(3);
function safePath(path,domain){
 ok(typeof path==='string'&&path.length<=220&&path.startsWith(domain==='gear'?'Gear/':'KB/'),'INVALID_PATH');
 ok(!path.includes('\\')&&!path.includes('%')&&!/[\x00-\x1f]/.test(path)&&
  !path.split('/').some(x=>!x||x==='.'||x==='..'||x.toLowerCase()==='.git'),'INVALID_PATH');
 ok(/\.(json|md)$/.test(path),'TEXT_ONLY');
 return path;
}
function base64(s){
 const bytes=new TextEncoder().encode(s);let result='';
 for(const byte of bytes)result+=String.fromCharCode(byte);
 return btoa(result);
}
const statusCode=s=>[401,403,404,409,422].includes(s)?s:0;
export function createSandboxPRAdapter({request=fetch,issueToken,trustedCandidate,
 publishingGate=()=>false,knownReceipt=async()=>null,allowedRepoId=ID}={}){
 ok(typeof request==='function'&&typeof issueToken==='function'&&
  typeof trustedCandidate==='function'&&typeof publishingGate==='function'&&
  typeof knownReceipt==='function'&&
  allowedRepoId===ID,'INVALID_CONFIGURATION');
 async function api(token,method,path,body,allow404=false){
  ok(path===API||path.startsWith(API+'/'),'REPOSITORY_DENIED');
  const init={method,headers:headers(token)};
  if(body!==undefined){init.headers['Content-Type']='application/json';init.body=JSON.stringify(body);}
  let res;
  try{res=await request(path,init);}catch{fail('GITHUB_NETWORK_ERROR');}
  if(allow404&&res.status===404)return null;
  if(!res.ok)fail('GITHUB_HTTP_'+statusCode(res.status));
  try{return await res.json();}catch{fail('INVALID_GITHUB_RESPONSE');}
 }
 async function plan(baseSha,domain,operationId){
  const candidate=await trustedCandidate({baseSha,domain,operationId});
  ok(candidate?.validated===true&&candidate.sourceRevision===baseSha&&
   Array.isArray(candidate.changes)&&candidate.changes.length>0&&candidate.changes.length<=8,
   'CANDIDATE_NOT_VALIDATED');
  const entries=[];let total=0;const seen=new Set();
  for(const change of candidate.changes){
   ok(change?.action==='write'&&typeof change.body==='string','TEXT_ONLY');
   const path=safePath(change.path,domain);
   ok(!seen.has(path),'DUPLICATE_PATH');seen.add(path);
   const bytes=new TextEncoder().encode(change.body);
   total+=bytes.length;
   ok(bytes.length>0&&bytes.length<=100000&&total<=128000,'INVALID_CONTENT');
   entries.push({path,body:change.body});
  }
  return entries;
 }
 async function onePR(token,branch){
  const url=API+'/pulls?state=all&head=ginosega%3A'+encodeURIComponent(branch)+'&base=main&per_page=100';
  const matches=await api(token,'GET',url);
  ok(Array.isArray(matches)&&matches.length<=1,'AMBIGUOUS_PR');
  return matches[0]??null;
 }
 const checked=(pr,branch,commit)=>{
  ok(Number.isSafeInteger(pr?.number)&&pr.number>0&&pr.head?.ref===branch&&
   pr.head?.sha===commit&&pr.base?.ref==='main'&&pr.head?.repo?.id===ID&&
   pr.base?.repo?.id===ID,'PR_IDENTITY_MISMATCH');
  return {number:pr.number,branch,headSha:commit,state:pr.state,merged:pr.merged_at!=null};
 };
 async function createDraft({operationId,domain,expectedMainSha}={}){
  ok(publishingGate()===true,'WRITES_DISABLED');
  ok(op(operationId)&&['gear','kb'].includes(domain)&&sha(expectedMainSha),'INVALID_OPERATION');
  // Only a future authenticated/leased server dispatcher may enable gate.
  const grant=await issueToken({repositoryId:ID,permissions:{contents:'write',pull_requests:'write'}});
  ok(grant?.repositoryId===ID&&grant?.permissions?.contents==='write'&&
   grant?.permissions?.pull_requests==='write'&&
   typeof grant.token==='string'&&grant.token.length>=12,'TOKEN_SCOPE_DENIED');
  const t=grant.token;
  const repo=await api(t,'GET',API);
  ok(repo?.id===ID&&repo?.full_name===REPO&&repo?.private===true,'REPOSITORY_DENIED');
  const ref=await api(t,'GET',API+'/git/ref/heads/main');
  const base=ref?.object?.sha;
  ok(sha(base),'INVALID_MAIN_REF');
  ok(base===expectedMainSha,'MAIN_MOVED');
  const branch=branchOf(operationId);
  const existing=await api(t,'GET',API+'/git/ref/heads/'+branch,undefined,true);
  if(existing){
   ok(sha(existing.object?.sha),'INVALID_BRANCH');
   // An unknown existing branch is NOT an idempotency proof. Trust only an
   // exact receipt retrieved from durable, server-owned operation state.
   const receipt=await knownReceipt({operationId,repositoryId:ID});
   ok(receipt?.repositoryId===ID&&receipt?.baseSha===base&&
      receipt?.headSha===existing.object.sha,'BRANCH_RECONCILIATION_REQUIRED');
   const previousCommit=await api(t,'GET',API+'/git/commits/'+receipt.headSha);
   ok(previousCommit?.sha===receipt.headSha&&previousCommit.parents?.length===1&&
      previousCommit.parents[0]?.sha===base,'BRANCH_RECONCILIATION_REQUIRED');
   const current=await onePR(t,branch);
   ok(current,'BRANCH_RECONCILIATION_REQUIRED');
   const checkedPr=checked(current,branch,receipt.headSha);
   ok(!checkedPr.merged&&checkedPr.state==='open','PR_NOT_OPEN');
   return {...checkedPr,baseSha:base,reused:true};
  }
  const entries=await plan(base,domain,operationId);
  const parent=await api(t,'GET',API+'/git/commits/'+base);
  ok(parent?.sha===base&&sha(parent.tree?.sha),'INVALID_MAIN_COMMIT');
  const tree=[];
  for(const entry of entries){
   const blob=await api(t,'POST',API+'/git/blobs',{content:base64(entry.body),encoding:'base64'});
   ok(sha(blob?.sha),'INVALID_BLOB');
   tree.push({path:entry.path,mode:'100644',type:'blob',sha:blob.sha});
  }
  const next=await api(t,'POST',API+'/git/trees',{base_tree:parent.tree.sha,tree});
  ok(sha(next?.sha),'INVALID_TREE');
  const commit=await api(t,'POST',API+'/git/commits',{
   message:'FISH118 P3 sandbox sample '+operationId,tree:next.sha,parents:[base],
  });
  ok(sha(commit?.sha),'INVALID_NEW_COMMIT');
  // Prevent making a branch from a main SHA that moved during blob/tree
  // preparation. A moved main is a conflict, not an implicit rebase.
  const freshMain=await api(t,'GET',API+'/git/ref/heads/main');
  ok(freshMain?.object?.sha===base,'MAIN_MOVED_AFTER_VALIDATION');
  const created=await api(t,'POST',API+'/git/refs',{ref:'refs/heads/'+branch,sha:commit.sha});
  ok(created?.ref==='refs/heads/'+branch&&created?.object?.sha===commit.sha,'BRANCH_CREATE_FAILED');
  const present=await onePR(t,branch);
  const pr=present??await api(t,'POST',API+'/pulls',{
   title:'P3 sandbox test '+operationId,head:branch,base:'main',
   body:'Isolated publishing test: '+operationId+'. No production code and no automatic merge.',
   draft:true,
  });
  const proven=checked(pr,branch,commit.sha);
  ok(!proven.merged&&proven.state==='open','PR_NOT_OPEN');
  // Persist baseSha/headSha in D1 after this function returns. If a
  // crash occurred before receipt durability, manual reconciliation is
  // deliberately required instead of silently trusting branch metadata.
  return {...proven,baseSha:base,reused:!!present};
 }
 return Object.freeze({createDraft});
}
