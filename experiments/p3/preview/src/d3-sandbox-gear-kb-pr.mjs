/**
 * FISH118 D3: SOURCE-ONLY sandbox Gear/KB draft-PR adapter.
 *
 * No Worker route, signing key, D1 lease, enabled runtime flag or deployment
 * is supplied here. The live D2 fixture adapter remains untouched/parked.
 * A future trusted owner-session + leased runner must supply a previously
 * Accepted package, immutable D3 planner and durable branch receipt callbacks.
 *
 * Not a public-main publisher, CI proof, protected merge, or hosted receipt.
 */
import {safePath,sha256} from '../../../../pwa/src/shared.mjs';

const ID=1430581407,OWNER=265665562;
const REPO='ginosega/fishing-p3-sandbox';
const API='https://api.github.com/repos/'+REPO;
const SHA=/^[a-f0-9]{40}$/;
const OP=/^p3_[0-9a-f-]{36}$/;
const MAX_FILE=131072,MAX_TOTAL=262144,MAX_MEDIA=48*1024*1024;
const encoder=new TextEncoder();

export class D3SandboxPRError extends Error{
  constructor(code){
    super('D3 sandbox Gear/KB PR operation refused');
    this.name='D3SandboxPRError';this.code=code;
  }
}
const fail=code=>{throw new D3SandboxPRError(code);};
const need=(v,code)=>{if(!v)fail(code);};
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const branch=id=>'p3-test-'+id.slice(3);
const headers=token=>({
  Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
  'X-GitHub-Api-Version':'2026-03-10',
  'User-Agent':'fishing-d3-sandbox-writer',
});
const status=s=>[401,403,404,409,422].includes(s)?s:0;
const exactGrant=permissions=>obj(permissions)&&
  Object.keys(permissions).every(k=>
    ['contents','pull_requests','metadata'].includes(k))&&
  permissions.contents==='write'&&permissions.pull_requests==='write'&&
  (!Object.hasOwn(permissions,'metadata')||
   permissions.metadata==='read');
const fileLocation=domain=>domain==='gear'?'pwa/Gear/gear.json':
  domain==='kb'?'pwa/KB/kb.json':
  domain==='catches'?'pwa/Catches/catches.json':null;
function markdownLocation(path,domain){
  need(typeof path==='string'&&path.startsWith('pwa/'),
    'UNSAFE_CONTENT_PATH');
  let relative;
  try{relative=safePath(path.slice(4));}
  catch{fail('UNSAFE_CONTENT_PATH');}
  need(path==='pwa/'+relative&&
    relative.startsWith(domain==='gear'?'Gear/':
      domain==='kb'?'KB/':'Catches/content/')&&
    relative.includes('/content/')&&relative.endsWith('.md')&&
    (domain==='catches'?relative.split('/').length===3:
      relative.split('/').length>=4),'UNSAFE_CONTENT_PATH');
  return path;
}
function base64(bytes){
  let text='';
  for(const n of bytes)text+=String.fromCharCode(n);
  return btoa(text);
}
async function blobSha1(bytes){
  const prefix=encoder.encode('blob '+bytes.length+'\0');
  const tagged=new Uint8Array(prefix.length+bytes.length);
  tagged.set(prefix);tagged.set(bytes,prefix.length);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-1',tagged))]
    .map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function createD3SandboxGearKBPRAdapter({
  request,issueToken,trustedCandidate,
  enabled=()=>false,knownBranchReceipt=async()=>null,
  onBranchCreated=async()=>false,
}={}){
  need([request,issueToken,trustedCandidate,enabled,
    knownBranchReceipt,onBranchCreated].every(x=>typeof x==='function'),
    'INVALID_CONFIGURATION');
  async function api(token,method,url,body,allow404=false){
    need(url===API||url.startsWith(API+'/'),'REPOSITORY_DENIED');
    const init={method,redirect:'manual',headers:headers(token)};
    if(body!==undefined){
      init.headers['Content-Type']='application/json';
      init.body=JSON.stringify(body);
    }
    let response;
    try{response=await request(url,init);}
    catch{fail('GITHUB_OUTCOME_UNKNOWN');}
    if(allow404&&response?.status===404&&!response.redirected)return null;
    need(response?.ok===true&&!response.redirected,
      'GITHUB_HTTP_'+status(response?.status));
    try{return await response.json();}
    catch{fail('INVALID_GITHUB_RESPONSE');}
  }
  async function plan({operationId,domain,expectedMainSha,pkg,token}){
    // This callback is server-owned and MUST perform a fresh, immutable
    // GitHub source read using D3's read-only snapshot loader. Unvalidated
    // client-provided plans or file lists are never allowed into this adapter.
    const candidate=await trustedCandidate({
      package:pkg,operationId,repositoryId:ID,ownerGitHubId:OWNER,
      expectedMainSha,
    });
    need(candidate?.validated===true&&candidate.repositoryId===ID&&
      candidate.operationId===operationId&&
      candidate.sourceRevision===expectedMainSha&&
      candidate.domain===domain&&
      ['add','edit'].includes(candidate.operation)&&
      Array.isArray(candidate.changes)&&
      candidate.changes.length>=1&&candidate.changes.length<=26,
      'CANDIDATE_UNVERIFIED');
    const seen=new Set(),writes=[];let total=0,mediaTotal=0;
    let stagedStarted=false;
    for(let i=0;i<candidate.changes.length;i++){
      const item=candidate.changes[i];
      // Staged originals must be AFTER the one/two canonical text blobs.
      // The source planner and signed receipt established ownership; the
      // PR builder re-reads exact original bytes using its own scoped token.
      if(item?.action==='staged'){
        stagedStarted=true;
        need(['gear','kb'].includes(domain)&&typeof item.path==='string'&&
         item.path.startsWith('pwa/'+(domain==='gear'?'Gear/':'KB/'))&&
         item.path.includes('/assets/')&&
         /\.(jpe?g|png|webp|gif)$/i.test(item.path)&&
         SHA.test(item.blobSha??'')&&
         /^[a-f0-9]{64}$/.test(item.sha256??'')&&
         Number.isSafeInteger(item.bytes)&&item.bytes>0&&
         item.bytes<=10*1024*1024,'UNSAFE_STAGED_BLOB');
        const path='pwa/'+safePath(item.path.slice(4));
        need(path===item.path,'UNSAFE_STAGED_BLOB');
        const key=path.toLowerCase();
        need(!seen.has(key),'DUPLICATE_CANDIDATE_PATH');seen.add(key);
        mediaTotal+=item.bytes;
        need(mediaTotal<=MAX_MEDIA,'CANDIDATE_TOO_LARGE');
        const b=await api(token,'GET',API+'/git/blobs/'+item.blobSha);
        need(b?.sha===item.blobSha&&b.encoding==='base64'&&
         typeof b.content==='string'&&b.size===item.bytes,
         'UNVERIFIED_STAGED_GIT_BLOB');
        let bytes;
        try{
         const raw=atob(b.content.replace(/\s/g,''));
         bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
        }catch{fail('UNVERIFIED_STAGED_GIT_BLOB');}
        need(bytes.length===item.bytes&&
         await blobSha1(bytes)===item.blobSha&&
         await sha256(bytes)===item.sha256,
         'UNVERIFIED_STAGED_GIT_BLOB');
        writes.push({path,blobSha:item.blobSha});
        continue;
      }
      need(!stagedStarted&&item?.action==='write'&&
        typeof item.body==='string'&&typeof item.path==='string',
        'UNSAFE_CANDIDATE_WRITE');
      const path=i===0?fileLocation(domain):
        markdownLocation(item.path,domain);
      need(item.path===path,'UNSAFE_CANDIDATE_WRITE');
      const key=path.toLowerCase();
      need(!seen.has(key),'DUPLICATE_CANDIDATE_PATH');
      seen.add(key);
      const bytes=encoder.encode(item.body);
      total+=bytes.length;
      need(bytes.length>0&&bytes.length<=MAX_FILE&&total<=MAX_TOTAL,
        'CANDIDATE_TOO_LARGE');
      writes.push({path,body:item.body,bytes});
    }
    return writes;
  }
  async function onePR(token,ref){
    const found=await api(token,'GET',API+
      '/pulls?state=all&head=ginosega%3A'+
      encodeURIComponent(ref)+'&base=main&per_page=100');
    need(Array.isArray(found)&&found.length<=1,'AMBIGUOUS_PR');
    return found[0]??null;
  }
  function confirmPR(pr,ref,head){
    need(Number.isSafeInteger(pr?.number)&&pr.number>0&&
      pr.head?.ref===ref&&pr.head?.sha===head&&
      pr.base?.ref==='main'&&pr.head?.repo?.id===ID&&
      pr.base?.repo?.id===ID&&pr.state==='open'&&
      pr.merged_at==null,'PR_IDENTITY_DENIED');
    return {
      number:pr.number,headSha:head,branch:ref,
      state:'open',merged:false,
    };
  }
  async function createDraft({
    operationId,domain,expectedMainSha,package:pkg,
  }={}){
    need(enabled()===true,'WRITES_DISABLED');
    need(OP.test(operationId)&&['gear','kb','catches'].includes(domain)&&
      SHA.test(expectedMainSha)&&obj(pkg)&&pkg.domain===domain&&
      ['add','edit'].includes(pkg.operation),
      'INVALID_REQUEST');
    const grant=await issueToken({
      repositoryId:ID,
      permissions:{contents:'write',pull_requests:'write'},
    });
    need(grant?.repositoryId===ID&&exactGrant(grant.permissions)&&
      typeof grant.token==='string'&&grant.token.length>=12,
      'TOKEN_SCOPE_DENIED');
    const token=grant.token;
    const repo=await api(token,'GET',API);
    need(repo?.id===ID&&repo.full_name===REPO&&repo.private===true,
      'REPOSITORY_DENIED');
    const latest=await api(token,'GET',API+'/git/ref/heads/main');
    const base=latest?.object?.sha;
    need(SHA.test(base)&&base===expectedMainSha,'MAIN_MOVED');
    const ref=branch(operationId);
    const existing=await api(token,'GET',
      API+'/git/ref/heads/'+ref,undefined,true);
    if(existing){
      need(SHA.test(existing.object?.sha),'INVALID_BRANCH');
      const receipt=await knownBranchReceipt({
        repositoryId:ID,operationId,
      });
      need(receipt?.repositoryId===ID&&
        receipt.operationId===operationId&&
        receipt.baseSha===base&&
        receipt.headSha===existing.object.sha&&
        receipt.branch===ref,'BRANCH_RECONCILIATION_REQUIRED');
      const old=await api(token,'GET',API+'/git/commits/'+receipt.headSha);
      need(old?.sha===receipt.headSha&&old.parents?.length===1&&
        old.parents[0]?.sha===base,'BRANCH_RECONCILIATION_REQUIRED');
      const current=await onePR(token,ref);
      const pr=current??await api(token,'POST',API+'/pulls',{
        title:'FISH118 D3 sandbox '+operationId,
        head:ref,base:'main',draft:true,
        body:'Isolated Gear/KB authoring test. No public Fishing Companion release.',
      });
      return {...confirmPR(pr,ref,receipt.headSha),
        baseSha:base,reused:!!current};
    }
    const writes=await plan({
      operationId,domain,expectedMainSha:base,pkg,token,
    });
    const parent=await api(token,'GET',API+'/git/commits/'+base);
    need(parent?.sha===base&&SHA.test(parent.tree?.sha),
      'MAIN_COMMIT_UNVERIFIED');
    const tree=[];
    for(const write of writes){
      if(write.blobSha){
        tree.push({path:write.path,type:'blob',mode:'100644',
         sha:write.blobSha});
        continue;
      }
      const requestedSha=await blobSha1(write.bytes);
      const b=await api(token,'POST',API+'/git/blobs',{
        content:base64(write.bytes),encoding:'base64',
      });
      need(b?.sha===requestedSha,'GITHUB_BLOB_MISMATCH');
      tree.push({path:write.path,type:'blob',mode:'100644',sha:b.sha});
    }
    const result=await api(token,'POST',API+'/git/trees',{
      base_tree:parent.tree.sha,tree,
    });
    need(SHA.test(result?.sha),'TREE_CREATION_DENIED');
    const commit=await api(token,'POST',API+'/git/commits',{
      message:'FISH118 D3 sandbox content '+operationId,
      tree:result.sha,parents:[base],
    });
    need(SHA.test(commit?.sha)&&
      commit.tree?.sha===result.sha&&
      commit.parents?.length===1&&
      commit.parents[0]?.sha===base,'COMMIT_CREATION_DENIED');
    // Recheck before adding a Git ref. A moving base must be regenerated
    // from a NEW trusted source snapshot, not force-rebased or overwritten.
    const after=await api(token,'GET',API+'/git/ref/heads/main');
    need(after?.object?.sha===base,'MAIN_MOVED_AFTER_VALIDATION');
    const created=await api(token,'POST',API+'/git/refs',{
      ref:'refs/heads/'+ref,sha:commit.sha,
    });
    need(created?.ref==='refs/heads/'+ref&&
      created.object?.sha===commit.sha,'BRANCH_CREATE_UNCERTAIN');
    const durable=await onBranchCreated({
      repositoryId:ID,operationId,baseSha:base,
      headSha:commit.sha,branch:ref,
    });
    need(durable?.repositoryId===ID&&
      durable.operationId===operationId&&
      durable.baseSha===base&&durable.headSha===commit.sha&&
      durable.branch===ref,'BRANCH_RECEIPT_NOT_DURABLE');
    const existingPR=await onePR(token,ref);
    const pr=existingPR??await api(token,'POST',API+'/pulls',{
      title:'FISH118 D3 sandbox '+operationId,
      head:ref,base:'main',draft:true,
      body:'Isolated Gear/KB authoring test. No public Fishing Companion release.',
    });
    return {...confirmPR(pr,ref,commit.sha),
      baseSha:base,reused:!!existingPR};
  }
  return Object.freeze({createDraft});
}
