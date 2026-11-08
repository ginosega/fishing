/**
 * D6 trusted GitHub main snapshot reader. Source-only, DISABLED by default.
 * Not a Worker entrypoint, authenticated HTTP route, token issuer or writer.
 * The caller must supply a trusted, independently verified hosted source SHA.
 * Repository identity, commit/tree/blob bytes and the final main ref are
 * checked server-side through a scoped contents:read GitHub App token.
 */
import {decodeD2GitBlob} from './d2-worker-source-candidate.mjs';
import {validateRecords,validateLibraryPaths,collectPaths,
 checkPathCollisions,validateMarkdown}
 from '../../../../pwa/src/validation.mjs';

export const D6_SOURCE_REPOSITORY=Object.freeze({
 id:1350909744,fullName:'ginosega/fishing',ref:'refs/heads/main',
});
const API='https://api.github.com/repos/'+D6_SOURCE_REPOSITORY.fullName;
const MAIN=API+'/git/ref/heads/main';
const ROOT='pwa/';
const CANONICAL=Object.freeze({
 gear:'Gear/gear.json',kb:'KB/kb.json',catches:'Catches/catches.json',
});
const SHA=/^[a-f0-9]{40}$/;
const MAX_TREE_ENTRIES=1200;
const MAX_CONTENT_FILES=1800;
const MAX_MARKDOWN=240;
const MAX_SOURCE_BYTES=2*1024*1024;
const MAX_JSON_BYTES=320000;
const MAX_MD_BYTES=131072;
const MAX_GITHUB_JSON_BYTES=2*1024*1024;
const decoder=new TextDecoder('utf-8',{fatal:true});
const encoder=new TextEncoder();
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const safe=v=>typeof v==='string'&&v.length>0&&v.length<=512&&
 !v.startsWith('/')&&!v.includes('\\')&&!v.includes('//')&&
 !v.includes('\0')&&!/%(?:2e|2f|5c|00)/i.test(v)&&
 !v.split('/').some(x=>x==='.'||x==='..');
const content=v=>safe(v)&&/^(?:Gear|KB|Catches)\//.test(v);
export class D6TrustedSourceError extends Error{
 constructor(code){super('D6 canonical GitHub main source not verified');
  this.name='D6TrustedSourceError';this.code=code;}
}
const deny=code=>{throw new D6TrustedSourceError(code);};
const need=(v,code)=>{if(!v)deny(code);};
const gitHeaders=token=>({
 Authorization:'Bearer '+token,
 Accept:'application/vnd.github+json',
 'X-GitHub-Api-Version':'2026-03-10',
 'User-Agent':'fishing-d6-canonical-read-only',
});
const entryIsBlob=item=>obj(item)&&item.type==='blob'&&
 item.mode==='100644'&&SHA.test(item.sha)&&
 Number.isSafeInteger(item.size)&&item.size>=0&&
 item.size<=20*1024*1024;

export function createD6CanonicalSnapshotLoader({
 request,issueReadToken,enabled=()=>false,
}={}){
 need(typeof request==='function'&&typeof issueReadToken==='function'&&
  typeof enabled==='function','INVALID_CONFIG');

 async function githubGet(token,url){
  // Never send a repository token to caller-supplied URL or a redirect.
  need(url===API||url.startsWith(API+'/'),'URL_DENIED');
  let res;
  try{res=await request(url,{
   method:'GET',headers:gitHeaders(token),redirect:'manual',
  });}catch{deny('GITHUB_UNAVAILABLE');}
  need(res instanceof Response&&res.status===200&&res.redirected!==true&&
   (!res.url||res.url===url)&&
   /\bapplication\/json\b/i.test(res.headers.get('Content-Type')??''),
   'GITHUB_UNAVAILABLE');
  const claimed=Number(res.headers.get('Content-Length'));
  if(Number.isFinite(claimed)&&claimed>MAX_GITHUB_JSON_BYTES)
   deny('GITHUB_RESPONSE_TOO_LARGE');
  let raw;
  try{raw=await res.text();}catch{deny('INVALID_GITHUB_RESPONSE');}
  need(encoder.encode(raw).byteLength<=MAX_GITHUB_JSON_BYTES,
   'GITHUB_RESPONSE_TOO_LARGE');
  try{return JSON.parse(raw);}catch{deny('INVALID_GITHUB_RESPONSE');}
 }

 async function loadSnapshot({expectedReleaseRevision}={}){
  need(enabled()===true,'DISABLED');
  need(SHA.test(expectedReleaseRevision??''),'INVALID_REQUEST');
  const grant=await issueReadToken({
   repositoryId:D6_SOURCE_REPOSITORY.id,
   permissions:{contents:'read'},
  }).catch(()=>deny('READ_TOKEN_UNAVAILABLE'));
  need(grant?.repositoryId===D6_SOURCE_REPOSITORY.id&&
   typeof grant.token==='string'&&grant.token.length>=12&&
   obj(grant.permissions)&&Object.keys(grant.permissions).length===1&&
   grant.permissions.contents==='read','READ_SCOPE_DENIED');
  // Keep this short-lived token strictly inside the loader.
  const token=grant.token;
  const repository=await githubGet(token,API);
  need(repository?.id===D6_SOURCE_REPOSITORY.id&&
   repository.full_name===D6_SOURCE_REPOSITORY.fullName&&
   repository.default_branch==='main','REPOSITORY_DENIED');

  const first=await githubGet(token,MAIN);
  const head=first?.object?.sha;
  need(first?.ref===D6_SOURCE_REPOSITORY.ref&&
   first?.object?.type==='commit'&&SHA.test(head)&&
   head===expectedReleaseRevision,'MAIN_RELEASE_MISMATCH');

  const commit=await githubGet(token,API+'/git/commits/'+head);
  need(commit?.sha===head&&SHA.test(commit.tree?.sha),
   'INVALID_COMMIT');
  const baseTree=await githubGet(token,API+'/git/trees/'+commit.tree.sha);
  need(baseTree?.sha===commit.tree.sha&&
   baseTree.truncated===false&&Array.isArray(baseTree.tree)&&
   baseTree.tree.length<=100,'INVALID_ROOT_TREE');
  const roots=baseTree.tree.filter(x=>x?.path==='pwa');
  need(roots.length===1&&roots[0].mode==='040000'&&
   roots[0].type==='tree'&&SHA.test(roots[0].sha),
   'INVALID_PWA_ROOT');

  // Fetch only the pwa/ subtree, never the entire legacy repository.
  const tree=await githubGet(token,API+'/git/trees/'+roots[0].sha+'?recursive=1');
  need(tree?.sha===roots[0].sha&&tree.truncated===false&&
   Array.isArray(tree.tree)&&tree.tree.length<=MAX_TREE_ENTRIES,
   'INVALID_PWA_TREE');
  const entries=new Map(),folded=new Set();
  for(const item of tree.tree){
   need(obj(item)&&safe(item.path),'UNSAFE_PWA_TREE');
   if(item.type==='tree'){
    need(item.mode==='040000'&&SHA.test(item.sha),'UNSAFE_PWA_TREE');
    continue;
   }
   // Only content files are authoring inventory; runtime is out of scope.
   if(!content(item.path))continue;
   need(entryIsBlob(item),'UNSAFE_CONTENT_ENTRY');
   const key=item.path.normalize('NFC').toLowerCase();
   need(!entries.has(item.path)&&!folded.has(key),
    'AMBIGUOUS_CONTENT_PATH');
   entries.set(item.path,item);folded.add(key);
  }
  need(entries.size>=3&&entries.size<=MAX_CONTENT_FILES,
   'INVALID_CONTENT_INVENTORY');

  let bytesRead=0;
  async function loadText(relative,limit){
   const entry=entries.get(relative);
   need(entryIsBlob(entry)&&entry.size>0&&entry.size<=limit,
    'MISSING_OR_LARGE_SOURCE_FILE');
   bytesRead+=entry.size;
   need(bytesRead<=MAX_SOURCE_BYTES,'SOURCE_TOO_LARGE');
   const blob=await githubGet(token,API+'/git/blobs/'+entry.sha);
   let bytes;
   try{bytes=await decodeD2GitBlob(entry,blob);}
   catch{deny('GIT_BLOB_INTEGRITY_FAILED');}
   try{return decoder.decode(bytes);}
   catch{deny('INVALID_UTF8');}
  }

  const data={};
  for(const [domain,path] of Object.entries(CANONICAL)){
   let json;
   try{json=JSON.parse(await loadText(path,MAX_JSON_BYTES));}
   catch(e){if(e instanceof D6TrustedSourceError)throw e;
    deny('INVALID_CANONICAL_JSON');}
   need(obj(json),'INVALID_CANONICAL_JSON');
   data[domain]=json;
  }
  let maps,routes,referenced;
  try{
   maps=validateRecords(data);
   routes=validateLibraryPaths(data);
   referenced=[...collectPaths(data)];
   checkPathCollisions(referenced);
  }catch{deny('INVALID_CANONICAL_SOURCE');}
  const files=new Set(entries.keys());
  const markdown=new Map();
  const narrative=referenced.filter(p=>p.endsWith('.md'));
  need(narrative.length<=MAX_MARKDOWN,'TOO_MANY_NARRATIVES');
  for(const path of referenced){
   need(content(path)&&files.has(path),'MISSING_REFERENCED_CONTENT');
  }
  for(const path of narrative){
   markdown.set(path,await loadText(path,MAX_MD_BYTES));
  }
  // Verify links and inline image references in the same immutable Git tree.
  try{
   for(const [path,body] of markdown)
    validateMarkdown(body,{owner:path,maps,exists:files,pathRoutes:routes});
  }catch{deny('INVALID_MARKDOWN_REFERENCES');}

  const last=await githubGet(token,MAIN);
  need(last?.ref===D6_SOURCE_REPOSITORY.ref&&last?.object?.sha===head&&
   last?.object?.type==='commit','MAIN_MOVED');
  // Only read-only data and immutable object IDs are returned. No GitHub
  // token, publication receipt or authentication grant leaves this module.
  return Object.freeze({
   repositoryId:D6_SOURCE_REPOSITORY.id,
   repositoryFullName:D6_SOURCE_REPOSITORY.fullName,
   ref:D6_SOURCE_REPOSITORY.ref,sourceRevision:head,
   treeSha:commit.tree.sha,data,files,markdown,
   canPublish:false,sourceOnly:true,
  });
 }
 return Object.freeze({loadSnapshot});
}
