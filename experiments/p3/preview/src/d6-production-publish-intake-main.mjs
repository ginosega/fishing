/**
 * FISH-TODO-118 WP3 — trusted canonical main revision for NEW intake.
 *
 * SOURCE ONLY / DEFAULT OFF / NO HTTP ROUTE OR PROVIDER MUTATION.
 * Operation-bound verification (#486) cannot precede the first D1 operation.
 * Resolve the initial main revision only from the pinned GitHub repository
 * using the existing contents:read App-token interface, and re-read the ref.
 * The canonical snapshot reviewer will independently re-read pinned source
 * after D2 owner/CSRF intake; this lookup is NOT a publication attestor.
 */
import {D6_PUBLISH_REPOSITORY as REPO}
 from './d6-production-publish-intake.mjs';
import {readD6BoundedJson}
 from './d6-bounded-json-response.mjs';

const API='https://api.github.com/repos/'+REPO.name;
const MAIN=API+'/git/ref/heads/main';
const SHA=/^[a-f0-9]{40}$/;
const plain=v=>v!==null&&typeof v==='object'&&
 !Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;

export class D6PublishIntakeMainError extends Error{
 constructor(code){
  super('WP3 new publish operation canonical main unavailable');
  this.name='D6PublishIntakeMainError';this.code=code;
 }
}
const deny=code=>{throw new D6PublishIntakeMainError(code);};
const need=(test,code)=>{if(!test)deny(code);};

export function createD6ProductionPublishIntakeMain({
 request,issueReadToken,enabled=()=>false,
}={}){
 need(typeof request==='function'&&
  typeof issueReadToken==='function'&&
  typeof enabled==='function','INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 async function get(token,url){
  active();
  let res;
  try{
   res=await request(url,{
    method:'GET',redirect:'manual',credentials:'omit',
    cache:'no-store',
    headers:{
     Authorization:'Bearer '+token,
     Accept:'application/vnd.github+json',
     'X-GitHub-Api-Version':'2026-03-10',
     'User-Agent':'fishing-wp3-intake-main-read-only',
    },
   });
  }catch{deny('SOURCE_UNAVAILABLE');}
  need(res instanceof Response&&res.status===200&&
   res.redirected===false&&(!res.url||res.url===url)&&
   /\bapplication\/(?:vnd\.github\+)?json\b/i.test(
    res.headers.get('Content-Type')??''),
   'SOURCE_UNAVAILABLE');
  let data;
  try{data=await readD6BoundedJson(res,65536);}
  catch{deny('SOURCE_UNAVAILABLE');}
  need(plain(data),'SOURCE_UNAVAILABLE');
  return data;
 }
 async function getTrustedCurrentMain(query){
  active();
  need(plain(query)&&Object.keys(query).length===2&&
   query.repositoryId===REPO.id&&query.ref===REPO.ref,
   'UNTRUSTED_REPOSITORY');
  let grant;
  try{
   grant=await issueReadToken({
    repositoryId:REPO.id,permissions:{contents:'read'},
   });
  }catch{deny('TOKEN_DENIED');}
  need(grant?.repositoryId===REPO.id&&
   plain(grant.permissions)&&
   Object.keys(grant.permissions).length===1&&
   grant.permissions.contents==='read'&&
   typeof grant.token==='string'&&
   /^[^\s]{20,}$/.test(grant.token),'TOKEN_DENIED');
  const token=grant.token;
  const repository=await get(token,API);
  need(repository.id===REPO.id&&
   repository.full_name===REPO.name&&
   repository.default_branch==='main'&&
   repository.owner?.id===REPO.ownerGitHubId,
   'REPOSITORY_MISMATCH');
  const current=await get(token,MAIN);
  need(current.ref===REPO.ref&&
   current.object?.type==='commit'&&
   SHA.test(current.object.sha??''),
   'UNVERIFIED_MAIN');
  const sourceRevision=current.object.sha;
  const commit=await get(token,API+'/git/commits/'+sourceRevision);
  need(commit.sha===sourceRevision&&
   SHA.test(commit.tree?.sha??''),
   'COMMIT_MISMATCH');
  const finalMain=await get(token,MAIN);
  need(finalMain.ref===REPO.ref&&
   finalMain.object?.type==='commit'&&
   finalMain.object.sha===sourceRevision,'MAIN_MOVED');
  active();
  return Object.freeze({
   verified:true,repositoryId:REPO.id,ref:REPO.ref,
   sourceRevision,treeSha:commit.tree.sha,
   sourceOnly:true,canPublish:false,isLive:false,
  });
 }
 return Object.freeze({getTrustedCurrentMain});
}
