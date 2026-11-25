/**
 * FISH-TODO-118 WP3 — trusted GitHub main / publication-ref prerequisites.
 *
 * SOURCE ONLY / DEFAULT OFF. This is a read-only, server-injected adapter for
 * the existing atomic-tree, branch, commit, advance and PR coordinators'
 * verifyPrerequisite / verifyCurrentMain callbacks. It is not a Worker route,
 * token issuer, authoring API, GitHub writer, D1 migration or release grant.
 *
 * An immutable Accepted operation and its D1 proof chain are established by
 * the calling coordinator. This adapter independently checks the live GitHub
 * repository, main commit/tree and (when present) operation-bound branch.
 * Only verified source identity is echoed; it never reports public Live.
 */
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';
import {readD6BoundedJson}
 from './d6-bounded-json-response.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const API='https://api.github.com/repos/'+REPO.name;
const MAIN=API+'/git/ref/heads/main';
const SHA=/^[0-9a-f]{40}$/,DIGEST=/^[0-9a-f]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FINGERPRINTS=new Set(['requestSha256','treeRequestSha256',
 'branchRequestSha256','commitRequestSha256','advanceRequestSha256',
 'prRequestSha256']);
const SHA_KEYS=new Set(['baseTreeSha','resultTreeSha','resultCommitSha']);
const ALLOWED=new Set(['operationId','ownerGitHubId','repositoryId',
 'ref','sourceRevision','snapshotSha256','stepKey','branchRef',
 'branchHeadSha',...FINGERPRINTS,...SHA_KEYS]);
const plain=v=>v!==null&&typeof v==='object'&&
 !Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const branch=id=>'refs/heads/fish-v3/publish/'+id;

export class D6PublishSourcePreconditionError extends Error {
 constructor(code){
  super('D6 production publishing source prerequisite unverified');
  this.name='D6PublishSourcePreconditionError';this.code=code;
 }
}
const deny=code=>{throw new D6PublishSourcePreconditionError(code);};
const need=(v,code)=>{if(!v)deny(code);};

function inspect(claim){
 need(plain(claim)&&Object.keys(claim).every(k=>ALLOWED.has(k)),
  'INVALID_CLAIM');
 need(UUID.test(claim.operationId??'')&&
  claim.ownerGitHubId===REPO.ownerGitHubId&&
  claim.repositoryId===REPO.id&&claim.ref===REPO.ref&&
  SHA.test(claim.sourceRevision??'')&&
  DIGEST.test(claim.snapshotSha256??''),'INVALID_CLAIM');
 for(const k of FINGERPRINTS)if(Object.hasOwn(claim,k))
  need(DIGEST.test(claim[k]??''),'INVALID_CLAIM');
 for(const k of SHA_KEYS)if(Object.hasOwn(claim,k))
  need(SHA.test(claim[k]??''),'INVALID_CLAIM');
 if(Object.hasOwn(claim,'stepKey'))
  need(claim.stepKey==='tree','INVALID_CLAIM');
 const hasRef=Object.hasOwn(claim,'branchRef');
 const hasHead=Object.hasOwn(claim,'branchHeadSha');
 need(hasRef===hasHead,'INVALID_CLAIM');
 if(hasRef)need(claim.branchRef===branch(claim.operationId)&&
  SHA.test(claim.branchHeadSha??''),'INVALID_CLAIM');
}

export function createD6ProductionPublishSourcePrecondition({
 request,issueReadToken,enabled=()=>false,
}={}){
 need(typeof request==='function'&&typeof issueReadToken==='function'&&
  typeof enabled==='function','INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');

 async function get(token,url){
  active();
  let response;
  try{
   response=await request(url,{
    method:'GET',redirect:'manual',cache:'no-store',
    credentials:'omit',headers:{
     Authorization:'Bearer '+token,
     Accept:'application/vnd.github+json',
     'X-GitHub-Api-Version':'2026-03-10',
     'User-Agent':'fishing-wp3-publish-prerequisite-read-only',
    },
   });
  }catch{deny('GITHUB_READ_UNKNOWN');}
  need(response instanceof Response&&response.status===200&&
   response.redirected===false&&
   (!response.url||response.url===url)&&
   /\bapplication\/(?:vnd\.github\+)?json\b/i.test(
    response.headers.get('Content-Type')??''),
   'GITHUB_READ_UNKNOWN');
  try{
   const data=await readD6BoundedJson(response,65536);
   need(plain(data),'GITHUB_READ_UNKNOWN');
   return data;
  }catch{deny('GITHUB_READ_UNKNOWN');}
 }

 async function verify(claim){
  active();inspect(claim);
  let grant;
  try{grant=await issueReadToken({
   repositoryId:REPO.id,permissions:{contents:'read'},
  });}catch{deny('READ_TOKEN_DENIED');}
  need(grant?.repositoryId===REPO.id&&
   plain(grant.permissions)&&
   Object.keys(grant.permissions).length===1&&
   grant.permissions.contents==='read'&&
   typeof grant.token==='string'&&
   /^[^\s]{20,}$/.test(grant.token),'READ_TOKEN_DENIED');
  const token=grant.token;
  const repository=await get(token,API);
  need(repository.id===REPO.id&&repository.full_name===REPO.name&&
   repository.default_branch==='main','REPOSITORY_MISMATCH');
  const current=await get(token,MAIN);
  need(current.ref===REPO.ref&&current.object?.type==='commit'&&
   current.object.sha===claim.sourceRevision,'MAIN_MOVED');
  const commit=await get(token,API+'/git/commits/'+claim.sourceRevision);
  need(commit.sha===claim.sourceRevision&&
   SHA.test(commit.tree?.sha??'')&&
   (!claim.baseTreeSha||commit.tree.sha===claim.baseTreeSha),
   'BASE_COMMIT_MISMATCH');
  if(claim.branchRef){
   const currentBranch=await get(token,API+'/git/ref/heads/fish-v3/publish/'+claim.operationId);
   need(currentBranch.ref===claim.branchRef&&
    currentBranch.object?.type==='commit'&&
    currentBranch.object.sha===claim.branchHeadSha,'BRANCH_MOVED');
  }
  // A second main read detects drift that occurred during the other GETs.
  const finalMain=await get(token,MAIN);
  need(finalMain.ref===REPO.ref&&
   finalMain.object?.type==='commit'&&
   finalMain.object.sha===claim.sourceRevision,'MAIN_MOVED');
  active();
  return Object.freeze({...claim,verified:true,
   sourceOnly:true,canPublish:false,isLive:false});
 }
 return Object.freeze({verify,verifyCurrentMain:verify,
  verifyPrerequisite:verify});
}
