/**
 * FISH118 D3: trusted immutable GitHub snapshot loader for isolated Gear/KB
 * authoring. Server-side only. This module NEVER writes GitHub or D1.
 * Requires an injected repo-scoped contents:read App-token issuer and GET
 * transport, both explicitly gated. D2 remains parked and unchanged.
 */
import {decodeD2GitBlob} from './d2-worker-source-candidate.mjs';
import {validateRecords,collectPaths,checkPathCollisions}
  from '../../../../pwa/src/validation.mjs';

const ID=1430581407;
const REPO='ginosega/fishing-p3-sandbox';
const API='https://api.github.com/repos/'+REPO;
const SHA=/^[a-f0-9]{40}$/;
const OP=/^p3_[0-9a-f-]{36}$/;
const ROOT='pwa/';
const SOURCE=Object.freeze({
  gear:'pwa/Gear/gear.json',
  kb:'pwa/KB/kb.json',
  catches:'pwa/Catches/catches.json',
});
const MAX_ENTRIES=1800;
const MAX_SOURCE_BYTES=320000;
const MAX_MD_BYTES=131072;
const MAX_TOTAL_BYTES=1048576;
const MAX_MD_FILES=120;
const decoder=new TextDecoder('utf-8',{fatal:true});

export class D3SnapshotError extends Error{
  constructor(code){
    super('D3 immutable sandbox snapshot refused');
    this.name='D3SnapshotError';this.code=code;
  }
}
const deny=code=>{throw new D3SnapshotError(code);};
const need=(valid,code)=>{if(!valid)deny(code);};
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const normalPath=p=>typeof p==='string'&&p.startsWith(ROOT)&&
  !p.includes('\\')&&!p.includes('//')&&!p.includes('\0')&&
  !p.split('/').some(x=>x==='.'||x==='..')&&
  p.length<=512;
const headers=token=>({
  Authorization:'Bearer '+token,
  Accept:'application/vnd.github+json',
  'X-GitHub-Api-Version':'2026-03-10',
  'User-Agent':'fishing-d3-immutable-sandbox-reader',
});
const validEntry=e=>obj(e)&&normalPath(e.path)&&e.type==='blob'&&
  e.mode==='100644'&&SHA.test(e.sha)&&Number.isSafeInteger(e.size)&&
  e.size>0&&e.size<=20*1024*1024;

/**
 * Public interface: const {loadSnapshot}=createD3SandboxSnapshotLoader(...);
 * Inject loadSnapshot into createD3TrustedGearKBCandidate. The returned
 * snapshot contains ONLY source bytes/metadata; it never exposes the token.
 */
export function createD3SandboxSnapshotLoader({
  request,issueReadToken,enabled=()=>false,
}={}){
  need(typeof request==='function'&&typeof issueReadToken==='function'&&
    typeof enabled==='function','INVALID_CONFIGURATION');
  async function get(token,path){
    need(path===API||path.startsWith(API+'/'),'URL_DENIED');
    let response;
    try{
      response=await request(path,{
        method:'GET',headers:headers(token),redirect:'manual',
      });
    }catch{deny('SOURCE_UNAVAILABLE');}
    need(response?.ok===true&&response.status===200&&!response.redirected,
      'SOURCE_UNAVAILABLE');
    try{return await response.json();}
    catch{deny('INVALID_GITHUB_RESPONSE');}
  }
  async function loadSnapshot({repositoryId,expectedMainSha,operationId}={}){
    need(enabled()===true,'DISABLED');
    need(repositoryId===ID&&
      (expectedMainSha===undefined||SHA.test(expectedMainSha))&&
      (operationId===undefined||OP.test(operationId)),
      'INVALID_REQUEST');
    const grant=await issueReadToken({repositoryId:ID,
      permissions:{contents:'read'}});
    need(grant?.repositoryId===ID&&
      typeof grant.token==='string'&&grant.token.length>=12&&
      obj(grant.permissions)&&
      Object.keys(grant.permissions).length===1&&
      grant.permissions.contents==='read','READ_SCOPE_DENIED');
    const token=grant.token;
    const repo=await get(token,API);
    need(repo?.id===ID&&repo.full_name===REPO&&repo.private===true,
      'REPOSITORY_DENIED');
    const current=await get(token,API+'/git/ref/heads/main');
    const base=current?.object?.sha;
    need(SHA.test(base)&&(!expectedMainSha||base===expectedMainSha),
      'MAIN_MOVED');
    const commit=await get(token,API+'/git/commits/'+base);
    need(commit?.sha===base&&SHA.test(commit.tree?.sha),
      'INVALID_COMMIT');
    const tree=await get(token,API+'/git/trees/'+commit.tree.sha+'?recursive=1');
    need(tree?.sha===commit.tree.sha&&tree.truncated===false&&
      Array.isArray(tree.tree)&&tree.tree.length<=MAX_ENTRIES,
      'INVALID_TREE');
    // Enforce unambiguous complete inventory (including canonical and media).
    const entries=new Map();
    const caseKeys=new Set();
    for(const item of tree.tree){
      need(obj(item)&&typeof item.path==='string'&&
        item.path.length<=512,'INVALID_TREE_ENTRY');
      // Ignore unrelated repository files, which have no bearing on PWA data.
      if(item.type==='tree'||!item.path.startsWith(ROOT))continue;
      need(validEntry(item),'UNSAFE_TREE_ENTRY');
      const key=item.path.normalize('NFC').toLowerCase();
      need(!entries.has(item.path)&&!caseKeys.has(key),
        'AMBIGUOUS_TREE_ENTRY');
      entries.set(item.path,item);caseKeys.add(key);
    }
    let total=0;
    async function readFile(path,maxBytes){
      const entry=entries.get(path);
      need(validEntry(entry)&&entry.size<=maxBytes,'MISSING_OR_LARGE_FILE');
      total+=entry.size;
      need(total<=MAX_TOTAL_BYTES,'SOURCE_TOO_LARGE');
      const blob=await get(token,API+'/git/blobs/'+entry.sha);
      let bytes;
      try{bytes=await decodeD2GitBlob(entry,blob);}
      catch{deny('BLOB_DIGEST_DENIED');}
      let value;
      try{value=decoder.decode(bytes);}
      catch{deny('INVALID_UTF8');}
      return value;
    }
    const data={};
    for(const [domain,path] of Object.entries(SOURCE)){
      const raw=await readFile(path,MAX_SOURCE_BYTES);
      try{data[domain]=JSON.parse(raw);}
      catch{deny('INVALID_CANONICAL_JSON');}
      need(obj(data[domain]),'INVALID_CANONICAL_JSON');
    }
    let referenced;
    try{
      validateRecords(data);
      referenced=[...collectPaths(data)];
      checkPathCollisions(referenced);
    }catch{deny('INVALID_CANONICAL_SOURCE');}
    const files=new Set();
    for(const [path,entry] of entries){
      if(path.startsWith(ROOT)&&entry.type==='blob'){
        files.add(path.slice(ROOT.length));
      }
    }
    const markdown=new Map();
    const hashes=new Map();
    for(const path of Object.values(SOURCE))
      hashes.set(path,entries.get(path).sha);
    const narratives=new Set(referenced.filter(p=>p.toLowerCase().endsWith('.md')));
    need(narratives.length<=MAX_MD_FILES,'TOO_MANY_NARRATIVES');
    for(const relative of referenced){
      const path=ROOT+relative,entry=entries.get(path);
      need(validEntry(entry),'MISSING_REFERENCED_FILE');
      hashes.set(path,entry.sha);
      if(narratives.has(relative)){
        markdown.set(relative,await readFile(path,MAX_MD_BYTES));
      }
    }
    const last=await get(token,API+'/git/ref/heads/main');
    need(last?.object?.sha===base,'MAIN_MOVED');
    return {
      repositoryId:ID,sourceRevision:base,treeSha:commit.tree.sha,
      ref:'refs/heads/main',
      data,files,markdown,blobHashes:hashes,
      operationId:operationId??null,
    };
  }
  return Object.freeze({loadSnapshot});
}
