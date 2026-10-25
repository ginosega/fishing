/**
 * FISH118 D2: bounded, Worker-compatible, SOURCE-ONLY Gear candidate.
 * No Node fs/git, no default fetch, no GitHub write, no credential custody.
 * Reads the immutable sandbox repository using an explicitly injected read-only
 * transport. GitHub is the authority for repo/main commit and tree. The
 * complete canonical content inventory still runs in trusted exact-head CI.
 *
 * Only one text-only Gear edit can be generated in D2. Full Markdown/media
 * changes and production repo writes remain disabled. Revalidate immediately
 * before the PR commit; a returned candidate is NOT a publication receipt.
 */
import {promoteChange,validatePackage,ChangeConflictError} from '../../../../pwa/src/handoff.mjs';
import {validateRecords,checkPathCollisions,collectPaths} from '../../../../pwa/src/validation.mjs';
import {fingerprint} from '../../../../pwa/src/shared.mjs';

const REPO='ginosega/fishing-p3-sandbox', ID=1430581407;
const API='https://api.github.com/repos/'+REPO;
const FILES=['pwa/Gear/gear.json','pwa/KB/kb.json','pwa/Catches/catches.json'];
const FILE_MAP=Object.freeze({gear:FILES[0],kb:FILES[1],catches:FILES[2]});
const SHA=/^[a-f0-9]{40}$/;
const MAX_TREE=1800,MAX_BYTES=320000;
const isObject=x=>x&&Object.getPrototypeOf(x)===Object.prototype;
const utf8=new TextEncoder();
const hex=bytes=>[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
const reject=code=>{throw new D2SourceError(code);};
const requireTrue=(x,c)=>{if(!x)reject(c);};
export class D2SourceError extends Error{
 constructor(code){super('D2 trusted sandbox source refused');this.name='D2SourceError';this.code=code;}
}
async function blobSha1(data){
 const tag=utf8.encode('blob '+data.length+'\0');
 const b=new Uint8Array(tag.length+data.length);
 b.set(tag);b.set(data,tag.length);
 return hex(await crypto.subtle.digest('SHA-1',b));
}
function fromBase64(value){
 requireTrue(typeof value==='string'&&value.length<=MAX_BYTES*2&&
  /^[A-Za-z0-9+/=\r\n]+$/.test(value),'BAD_BLOB_ENCODING');
 let bytes;
 try{
  const ascii=atob(value.replace(/\s/g,''));
  bytes=Uint8Array.from(ascii,x=>x.charCodeAt(0));
 }catch{reject('BAD_BLOB_ENCODING');}
 requireTrue(bytes.length<=MAX_BYTES,'CONTENT_TOO_LARGE');
 return bytes;
}
export async function decodeD2GitBlob(entry,value){
 requireTrue(entry?.type==='blob'&&entry?.mode==='100644'&&
  SHA.test(entry.sha)&&Number.isSafeInteger(entry.size)&&
  entry.size>0&&entry.size<=MAX_BYTES,'MISSING_MANIFEST');
 requireTrue(value?.sha===entry.sha&&value.encoding==='base64'&&
  value.size===entry.size,'INVALID_BLOB');
 const bytes=fromBase64(value.content);
 requireTrue(bytes.length===entry.size&&await blobSha1(bytes)===entry.sha,
  'BLOB_DIGEST_DENIED');
 return bytes;
}
const headers=token=>({
 Authorization:'Bearer '+token,
 Accept:'application/vnd.github+json',
 'X-GitHub-Api-Version':'2026-03-10',
 'User-Agent':'fishing-d2-trusted-source',
});
export function createD2WorkerGearCandidate({
 request,issueReadToken,sourceEnabled=()=>false,
}={}){
 requireTrue(typeof request==='function'&&typeof issueReadToken==='function'&&
  typeof sourceEnabled==='function','INVALID_CONFIG');
 async function read(token,path){
  requireTrue(path===API||path.startsWith(API+'/'),'URL_DENIED');
  let response;
  try{response=await request(path,{
   method:'GET',headers:headers(token),redirect:'manual',
  });}catch{reject('SOURCE_UNAVAILABLE');}
  requireTrue(response?.ok===true&&response.status===200&&
   !response.redirected,'SOURCE_UNAVAILABLE');
  let obj;try{obj=await response.json();}catch{reject('BAD_SOURCE_RESPONSE');}
  return obj;
 }
 async function manifest(token,tree,filename){
  const entry=tree.tree.find(e=>e?.path===filename);
  requireTrue(entry?.type==='blob'&&entry?.mode==='100644'&&
   SHA.test(entry.sha)&&Number.isSafeInteger(entry.size)&&
   entry.size>0&&entry.size<=MAX_BYTES,'MISSING_MANIFEST');
  const value=await read(token,API+'/git/blobs/'+entry.sha);
  const bytes=await decodeD2GitBlob(entry,value);
  let parsed;
  try{parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
  catch{reject('INVALID_MANIFEST');}
  requireTrue(isObject(parsed),'INVALID_MANIFEST');
  return parsed;
 }
 async function plan({package:pkg,expectedMainSha,operationId}={}){
  requireTrue(sourceEnabled()===true,'SOURCE_DISABLED');
  requireTrue((expectedMainSha===undefined||SHA.test(expectedMainSha))&&
   (operationId===undefined||typeof operationId==='string'&&
    /^p3_[0-9a-f-]{36}$/.test(operationId)),'INVALID_REQUEST');
  try{validatePackage(pkg);}catch{reject('INVALID_PACKAGE');}
  requireTrue(pkg.domain==='gear'&&pkg.operation==='edit'&&
   pkg.id==='p3-test-rod'&&pkg.picture.action==='keep'&&
   (pkg.pictureSequence?.action??'keep')==='keep'&&pkg.notes.action==='keep'&&
   SHA.test(pkg.base.sourceRevision)&&
   /^[a-f0-9]{64}$/.test(pkg.base.recordHash??'')&&
   isObject(pkg.changes?.set)&&
   Object.keys(pkg.changes.set).length>0&&
   Array.isArray(pkg.changes?.unset)&&
   pkg.changes.unset.length===0,
   'GEAR_TEXT_ONLY');
  const grant=await issueReadToken({repositoryId:ID,permissions:{contents:'read'}});
  requireTrue(grant?.repositoryId===ID&&
   typeof grant.token==='string'&&grant.token.length>=12&&
   isObject(grant.permissions)&&
   Object.keys(grant.permissions).length===1&&
   grant.permissions.contents==='read','READ_SCOPE_DENIED');
  const token=grant.token;
  const repo=await read(token,API);
  requireTrue(repo?.id===ID&&repo?.full_name===REPO&&repo?.private===true,
   'REPOSITORY_DENIED');
  const ref=await read(token,API+'/git/ref/heads/main');
  const base=ref?.object?.sha;
  requireTrue(SHA.test(base)&&
   (expectedMainSha===undefined||base===expectedMainSha),'MAIN_MOVED');
  const commit=await read(token,API+'/git/commits/'+base);
  requireTrue(commit?.sha===base&&SHA.test(commit.tree?.sha),'COMMIT_DENIED');
  const tree=await read(token,API+'/git/trees/'+commit.tree.sha+'?recursive=1');
  requireTrue(tree?.sha===commit.tree.sha&&tree?.truncated===false&&
   Array.isArray(tree.tree)&&tree.tree.length<=MAX_TREE,'TREE_UNAVAILABLE');
  const entries=tree.tree.filter(e=>FILES.includes(e.path));
  requireTrue(entries.length===FILES.length&&new Set(entries.map(e=>e.path)).size===FILES.length,
   'MANIFEST_AMBIGUOUS');
  const [gear,kb,catches]=await Promise.all(FILES.map(p=>manifest(token,tree,p)));
  const data={gear,kb,catches};
  try{
   validateRecords(data);
   // Existing referenced paths must exist in the immutable Git tree.
   const listed=new Set(tree.tree.filter(x=>x.type==='blob').map(x=>x.path));
   const inventory=[...collectPaths(data)];
   checkPathCollisions(inventory);
   for(const file of inventory)requireTrue(listed.has('pwa/'+file),'MISSING_REFERENCED_FILE');
  }catch(e){
   if(e instanceof D2SourceError)throw e;
   reject('INVALID_CANONICAL_SOURCE');
  }
  const position=gear.items.findIndex(r=>r.id===pkg.id);
  requireTrue(position>=0,'GEAR_MISSING');
  const current=gear.items[position];
  if(pkg.base.sourceRevision===base){
   requireTrue(await fingerprint(current)===pkg.base.recordHash,
    'BASE_HASH_DENIED');
  }
  let promoted;
  try{promoted=await promoteChange({
   package:pkg,currentRecord:current,currentText:'',sourceRevision:base,
   conflictPolicy:'review',
  });}catch(e){
   if(e instanceof ChangeConflictError)reject('SOURCE_CONFLICT');
   reject('INVALID_EDIT');
  }
  requireTrue(promoted.writes.length===0&&
   await fingerprint(current)!==await fingerprint(promoted.record),
   'NO_CHANGE_OR_UNSAFE_WRITE');
  const next=structuredClone(data);
  next.gear.items[position]=promoted.record;
  try{validateRecords(next);}catch{reject('INVALID_RESULT');}
  const changed=Object.freeze({
   action:'write',path:'pwa/Gear/gear.json',
   body:JSON.stringify(next.gear,null,2)+'\n',
  });
  requireTrue(utf8.encode(changed.body).length<=MAX_BYTES,'CONTENT_TOO_LARGE');
  const last=await read(token,API+'/git/ref/heads/main');
  requireTrue(last?.object?.sha===base,'MAIN_MOVED');
  return Object.freeze({
   validated:true,repositoryId:ID,sourceRevision:base,
   operationId:operationId??null,changes:Object.freeze([changed]),
  });
 }
 async function validate({snapshot,repositoryId}={}){
  requireTrue(repositoryId===ID&&snapshot?.media?.length===0,
   'INVALID_REQUEST');
  const result=await plan({package:snapshot.package});
  return Object.freeze({valid:true,repositoryId:ID,
   sourceRevision:result.sourceRevision});
 }
 return Object.freeze({plan,validate});
}
