/**
 * FISH118 D3 -- SOURCE-ONLY, sandbox-only Gear/KB text candidate planner.
 * Can be called ONLY by a future trusted Worker after authenticating the
 * numeric owner; it has NO GitHub request, token, PR, D1 or deployment path.
 * Uses the actual canonical schema, source-aware promoter, Markdown resolver
 * and tree inventory semantics. The trusted loadSnapshot adapter must verify
 * immutable GitHub blob SHAs and ref before AND after using this candidate.
 */
import {promoteChange,validatePackage,ChangeConflictError,narrativePath}
 from '../../../../pwa/src/handoff.mjs';
import {validateRecords,validateRecord,collectPaths,checkPathCollisions}
 from '../../../../pwa/src/validation.mjs';
import {parseMarkdown,markdownRouteMap} from '../../../../pwa/src/markdown.mjs';
import {DOMAIN,fingerprint,safePath} from '../../../../pwa/src/shared.mjs';

const REPO_ID=1430581407,OWNER=265665562;
const SHA=/^[a-f0-9]{40}$/,HASH=/^[a-f0-9]{64}$/;
const MAX=128*1024;
const location=Object.freeze({
 gear:'pwa/Gear/gear.json',
 kb:'pwa/KB/kb.json',
});
const enc=new TextEncoder();
export class D3CandidateError extends Error{
 constructor(code){super('D3 trusted sandbox candidate denied');this.name='D3CandidateError';this.code=code;}
}
const deny=code=>{throw new D3CandidateError(code);};
const check=(v,code)=>{if(!v)deny(code);};
const object=x=>x&&Object.getPrototypeOf(x)===Object.prototype;
const own=(record,domain)=>record?.[domain==='gear'?'notes':'content']??null;
const textPath=(path)=>{try{return safePath(path);}catch{deny('UNSAFE_NARRATIVE_PATH');}};

export function createD3TrustedGearKBCandidate({loadSnapshot,enabled=()=>false}={}){
 check(typeof loadSnapshot==='function'&&typeof enabled==='function','INVALID_CONFIGURATION');
 async function plan({package:pkg,repositoryId,ownerGitHubId,
  expectedMainSha,operationId}={}){
  check(enabled()===true,'DISABLED');
  check(repositoryId===REPO_ID&&ownerGitHubId===OWNER,
   'OWNER_OR_REPOSITORY_DENIED');
  check(expectedMainSha===undefined||SHA.test(expectedMainSha),'INVALID_MAIN');
  check(operationId===undefined||/^p3_[0-9a-f-]{36}$/.test(operationId),
   'INVALID_OPERATION');
  try{validatePackage(pkg);}catch{deny('INVALID_PACKAGE');}
  check(['gear','kb'].includes(pkg.domain)&&['add','edit'].includes(pkg.operation)&&
   SHA.test(pkg.base.sourceRevision)&&
   pkg.picture.action==='keep'&&
   (pkg.pictureSequence?.action??'keep')==='keep'&&
   ['keep','create','replace'].includes(pkg.notes.action),
   'TEXT_ONLY_D3');
  // A creation/replace only touches a canonical owned Markdown resource.
  const snapshot=await loadSnapshot({repositoryId:REPO_ID,
   expectedMainSha,operationId});
  check(snapshot?.repositoryId===REPO_ID&&SHA.test(snapshot.sourceRevision)&&
   (!expectedMainSha||snapshot.sourceRevision===expectedMainSha)&&
   object(snapshot.data)&&snapshot.files instanceof Set&&
   snapshot.markdown instanceof Map,'INVALID_SNAPSHOT');
  const data=structuredClone(snapshot.data);
  try{
   validateRecords(data);
   const owned=[...collectPaths(data)];
   checkPathCollisions(owned);
   for(const path of owned)check(snapshot.files.has(path),'MISSING_CANONICAL_FILE');
  }catch(e){if(e instanceof D3CandidateError)throw e;deny('INVALID_CANONICAL_SOURCE');}
  const array=DOMAIN[pkg.domain].array;
  const pos=data[pkg.domain][array].findIndex(r=>r.id===pkg.id);
  const current=pos>=0?data[pkg.domain][array][pos]:null;
  if(pkg.operation==='add'){
   check(current===null&&pkg.base.recordHash===null,'DUPLICATE_OR_INVALID_ADD');
   check(object(pkg.record)&&!['notes','content','picture','pictureSequence']
    .some(key=>Object.hasOwn(pkg.record,key)),'UNTRUSTED_ADD_FIELDS');
  }else{
   check(current!==null&&HASH.test(pkg.base.recordHash??''),'MISSING_BASE_RECORD');
   if(pkg.base.sourceRevision===snapshot.sourceRevision)
    check(await fingerprint(current)===pkg.base.recordHash,'SOURCE_CHANGED');
  }
  const currentPath=own(current,pkg.domain);
  check(currentPath===null||snapshot.files.has(textPath(currentPath)),
   'MISSING_CANONICAL_FILE');
  const currentText=currentPath?snapshot.markdown.get(currentPath):'';
  check(currentPath===null||typeof currentText==='string',
   'MISSING_CANONICAL_MARKDOWN');
  let candidate;
  try{
   candidate=await promoteChange({
    package:pkg,currentRecord:current,
    currentText:currentText??'',sourceRevision:snapshot.sourceRevision,
    conflictPolicy:'review',
    validate:r=>validateRecord(r,pkg.domain,data),
   });
  }catch(e){
   if(e instanceof ChangeConflictError)deny('SOURCE_CONFLICT');
   deny('INVALID_PROMOTION');
  }
  const next=data,items=next[pkg.domain][array];
  if(pkg.operation==='add')items.push(candidate.record);
  else items[pos]=candidate.record;
  try{validateRecords(next);}catch{deny('INVALID_RESULT');}
  const writes=[{action:'write',path:location[pkg.domain],
   body:JSON.stringify(next[pkg.domain],null,2)+'\n'}];
  // D3 accepts only additions/replacements, NOT source file deletion.
  check(candidate.writes.length<=1,'UNSAFE_MARKDOWN_WRITES');
  for(const change of candidate.writes){
   check(change.remove!==true&&typeof change.body==='string'&&
    change.body.length>0&&typeof change.path==='string',
    'UNSAFE_MARKDOWN_WRITES');
   const path=textPath(change.path);
   check(path===own(candidate.record,pkg.domain),'UNOWNED_MARKDOWN');
   check(pkg.notes.action==='replace'?path===currentPath:
    pkg.notes.action==='create'&&currentPath===null&&
    path===narrativePath(pkg.domain,candidate.record),
    'UNSAFE_NARRATIVE_PATH');
   check(pkg.notes.action==='create'?!snapshot.files.has(path):
    snapshot.files.has(path),'MARKDOWN_COLLISION');
   const exists=new Set(snapshot.files);exists.add(path);
   try{
    parseMarkdown(change.body,{owner:path,maps:validateRecords(next),
     exists,pathRoutes:markdownRouteMap(next)});
   }catch{deny('INVALID_MARKDOWN_LINKS');}
   writes.push({action:'write',path:'pwa/'+path,body:change.body});
  }
  check(writes.length>=1&&writes.length<=2,'TOO_MANY_WRITES');
  check(writes.every(w=>enc.encode(w.body).byteLength<=MAX) &&
   writes.reduce((n,w)=>n+enc.encode(w.body).byteLength,0)<=MAX,
   'CANDIDATE_TOO_LARGE');
  // All outputs are synthetic until independently recorded by GitHub PR +
  // exact-head CI + ordinary merge + actual hosted-identity verification.
  return Object.freeze({
   validated:true,repositoryId:REPO_ID,
   sourceRevision:snapshot.sourceRevision,operationId:operationId??null,
   domain:pkg.domain,operation:pkg.operation,
   changes:Object.freeze(writes.map(w=>Object.freeze(w))),
  });
 }
 return Object.freeze({plan});
}
