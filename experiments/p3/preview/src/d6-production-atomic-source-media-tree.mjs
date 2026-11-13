/**
 * FISH118 WP3-2 — atomic canonical source/Markdown/original-media Git tree PLAN.
 *
 * SOURCE ONLY / DEFAULT OFF. Derives one immutable, bounded Git tree write-set
 * from trusted, current main source and a canonical Accepted owner operation.
 * Re-runs source promotion, conflict/record/Markdown validation, canonical
 * media ownership, conditional signed-ticket verification and independent Git
 * blob reads. Verifies that each needed JSON/Markdown Git blob already exists
 * with exactly the expected bytes BEFORE listing any complete tree entries.
 *
 * No GitHub write, D1 lifecycle transition, staged-media issuer, Worker route,
 * credential provisioning, merge, deployment or Live acknowledgment.
 *
 * All entries belong to ONE future Git Data tree against the exact immutable
 * base tree; never apply separate "image then Markdown" ref updates. The
 * separately authorized durable Git writer/readback still must fence and
 * independently verify tree/commit/PR and handle changed main safely.
 */
import {DOMAIN,fingerprint,safePath,pathKey}
 from '../../../../pwa/src/shared.mjs';
import {promoteChange,equal} from '../../../../pwa/src/handoff.mjs';
import {validateRecords,validateRecord,validateLibraryPaths,
 collectPaths,checkPathCollisions,validateMarkdown}
 from '../../../../pwa/src/validation.mjs';
import {expectedD6CanonicalMedia}
 from './d6-production-media-contract.mjs';
import {reviewD6CanonicalMediaOwnership}
 from './d6-production-media-ownership.mjs';
import {verifyD6CanonicalStagedGitBlobs}
 from './d6-production-media-blob-proof.mjs';
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const TEXT_MAX=1024*1024,MAX_ENTRIES=32,enc=new TextEncoder();
export class D6AtomicMediaTreeError extends Error{
 constructor(code){super('D6 atomic canonical tree plan denied');
  this.name='D6AtomicMediaTreeError';this.code=code;}
}
const deny=code=>{throw new D6AtomicMediaTreeError(code);};
const need=(v,code)=>{if(!v)deny(code);};
const digest=async(bytes,algo)=>[...new Uint8Array(
 await crypto.subtle.digest(algo,bytes))]
 .map(x=>x.toString(16).padStart(2,'0')).join('');
const gitBlobSha=async bytes=>{
 const prefix=enc.encode('blob '+bytes.length+'\0');
 const data=new Uint8Array(prefix.length+bytes.length);
 data.set(prefix);data.set(bytes,prefix.length);
 return digest(data,'SHA-1');
};
const plain=v=>v!==null&&typeof v==='object'&&
 !Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
function validSource(source,op){
 need(source?.repositoryId===REPO.id&&
  source.repositoryFullName===REPO.name&&
  source.ref===REPO.ref&&
  source.sourceRevision===op.sourceRevision&&
  SHA.test(source.treeSha??'')&&
  source.sourceOnly===true&&source.canPublish===false&&
  source.files instanceof Set&&source.markdown instanceof Map&&
  plain(source.data)&&source.data.gear&&source.data.kb&&
  source.data.catches,'UNVERIFIED_MAIN');
}
function validOperation(op,pkg){
 need(op&&pkg&&op.state==='Accepted'&&
  UUID.test(op.operationId??'')&&
  op.ownerGitHubId===REPO.ownerGitHubId&&
  op.repositoryId===REPO.id&&op.ref===REPO.ref&&
  SHA.test(op.sourceRevision??'')&&
  DIGEST.test(op.snapshotSha256??'')&&
  ['gear','kb','catches'].includes(op.domain)&&
  ['add','edit'].includes(op.operation)&&
  op.domain===pkg.domain&&op.operation===pkg.operation&&
  op.recordId===pkg.id&&
  op.sourceRevision===pkg.base?.sourceRevision,
  'UNTRUSTED_OPERATION');
}
async function verifyTextBlob(readGitBlob,path,body){
 need(typeof body==='string'&&
  enc.encode(body).length>0&&enc.encode(body).length<=TEXT_MAX,
  'TEXT_TOO_LARGE');
 const bytes=enc.encode(body),sha=await gitBlobSha(bytes);
 let blob;
 try{blob=await readGitBlob({
  repositoryId:REPO.id,repositoryFullName:REPO.name,blobSha:sha,
 });}catch{deny('TEXT_BLOB_READ_UNKNOWN');}
 need(plain(blob)&&blob.sha===sha&&
  blob.encoding==='base64'&&blob.size===bytes.length&&
  typeof blob.content==='string'&&
  blob.content.length>0&&blob.content.length<=2*TEXT_MAX,
  'TEXT_BLOB_UNVERIFIED');
 const content=blob.content.replace(/[\r\n]/g,'');
 need(content.length%4===0&&
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
   .test(content),'TEXT_BLOB_UNVERIFIED');
 let decoded;
 try{decoded=Uint8Array.from(atob(content),x=>x.charCodeAt(0));}
 catch{deny('TEXT_BLOB_UNVERIFIED');}
 need(decoded.length===bytes.length&&decoded.every((v,i)=>v===bytes[i])&&
  await gitBlobSha(decoded)===sha,'TEXT_BLOB_UNVERIFIED');
 return Object.freeze({path,sha,bytes:bytes.length});
}
function changedRecordOnly(sourceData,next,domain,id,action){
 const array=DOMAIN[domain].array;
 for(const d of Object.keys(DOMAIN)){
  if(d!==domain)need(equal(sourceData[d],next[d]),'UNRELATED_CHANGE');
 }
 const old=sourceData[domain],newer=next[domain];
 const oldRec=old[array].filter(r=>r.id===id);
 const nextRec=newer[array].filter(r=>r.id===id);
 need(oldRec.length===(action==='add'?0:1)&&nextRec.length===1,
  'RECORD_CONFLICT');
 const otherOld={...old,[array]:old[array].filter(r=>r.id!==id)};
 const otherNext={...newer,[array]:newer[array].filter(r=>r.id!==id)};
 need(equal(otherOld,otherNext),'UNRELATED_CHANGE');
}
const pathAllowed=(p,domain,id)=>{
 try{
  safePath(p);
  if(domain==='catches')return p==='Catches/content/'+id+'.md';
  const root=domain==='gear'?'Gear/':'KB/';
  return p.startsWith(root)&&p.includes('/content/')&&p.endsWith('.md');
 }catch{return false;}
};
function writeEntry(entries,path,sha){
 need(typeof path==='string'&&safePath(path)===path&&
  (sha===null||SHA.test(sha??'')),'INVALID_TREE_ENTRY');
 const k=pathKey(path);
 need(!entries.has(k),'DUPLICATE_TREE_PATH');
 entries.set(k,Object.freeze({path,mode:'100644',type:'blob',sha}));
}
/**
 * "readGitBlob" MUST be the trusted server-only immutable Git Data GET
 * provider, shared for original media and changed text. The resulting plan
 * can only be passed to a separately authorized, durable-fenced writer.
 */
export function createD6ProductionAtomicSourceMediaTree({
 loadSnapshot,readGitBlob,verifyTicket,
 enabled=()=>false,
}={}){
 need([loadSnapshot,readGitBlob,verifyTicket,enabled]
  .every(f=>typeof f==='function'),'INVALID_CONFIG');
 async function plan({operation,package:pkg,mediaTickets}={}){
  need(enabled()===true,'DISABLED');
  validOperation(operation,pkg);
  let source;
  try{source=await loadSnapshot({
   expectedReleaseRevision:operation.sourceRevision,
  });}catch{deny('SOURCE_UNAVAILABLE');}
  validSource(source,operation);
  let data,files,markdown,maps,routes;
  try{
   data=structuredClone(source.data);
   files=new Set(source.files);
   markdown=new Map(source.markdown);
   maps=validateRecords(data);
   routes=validateLibraryPaths(data);
   checkPathCollisions(files);
   for(const p of collectPaths(data))
    need(files.has(p),'INVALID_CANONICAL_SOURCE');
  }catch{deny('INVALID_CANONICAL_SOURCE');}
  const domain=pkg.domain,array=DOMAIN[domain].array;
  const old=data[domain][array].find(r=>r.id===pkg.id);
  if(pkg.operation==='add')need(!old&&pkg.base.recordHash===null,
   'RECORD_CONFLICT');
  else{
   need(old&&DIGEST.test(pkg.base.recordHash??''),
    'RECORD_CONFLICT');
   need(await fingerprint(old)===pkg.base.recordHash,
    'RECORD_CONFLICT');
  }
  const noteKey=domain==='kb'?'content':'notes';
  const originalPath=old?.[noteKey];
  need(!originalPath||markdown.has(originalPath),
   'INVALID_CANONICAL_SOURCE');
  let promoted;
  try{
   promoted=await promoteChange({
    package:pkg,currentRecord:old,
    currentText:originalPath?markdown.get(originalPath):'',
    sourceRevision:operation.sourceRevision,conflictPolicy:'review',
    validate:rec=>validateRecord(rec,domain,data),
   });
  }catch{deny('INVALID_CHANGE');}
  need(promoted.record?.id===pkg.id&&
   promoted.sourceRevision===operation.sourceRevision,
   'INVALID_CHANGE');
  // Reject no-op edits rather than creating an Unknown Git fence for
  // an empty tree. A Markdown-only edit can leave canonical JSON untouched.
  if(pkg.operation==='edit')
   need(!equal(old,promoted.record)||promoted.writes.length>0,
    'NO_CHANGE');
  const originals=expectedD6CanonicalMedia(pkg);
  // Zero new originals is a valid ordinary record/Markdown edit.
  // Existing source images are retained, never restaged or replaced.
  // Nonempty ticket input with no declared originals must fail closed.
  if(originals.length===0)
   need(Array.isArray(mediaTickets)&&mediaTickets.length===0,
    'UNEXPECTED_MEDIA_TICKETS');
  const narrativeOps=[];
  for(const write of promoted.writes){
   const path=write.path;
   need(pathAllowed(path,domain,pkg.id),'UNSAFE_NARRATIVE');
   const existed=files.has(path);
   if(write.remove===true){
    need(existed&&markdown.has(path),'INVALID_CHANGE');
    markdown.delete(path);files.delete(path);
    narrativeOps.push({path,remove:true});
   }else{
    need(typeof write.body==='string'&&
     enc.encode(write.body).length>0&&
     enc.encode(write.body).length<=131072&&
     (write.baseSha256===null?!existed:existed&&markdown.has(path)),
     'INVALID_CHANGE');
    markdown.set(path,write.body);files.add(path);
    narrativeOps.push({path,body:write.body});
   }
  }
  // All originals in this first media integration are new paths; same-path
  // media replacement requires separate preimage Git blob verification.
  for(const x of originals){
   need(!files.has(x.path),'EXISTING_MEDIA_COLLISION');
   files.add(x.path);
  }
  if(pkg.operation==='add')data[domain][array].push(promoted.record);
  else data[domain][array][data[domain][array].findIndex(r=>
   r.id===pkg.id)]=promoted.record;
  try{
   changedRecordOnly(source.data,data,domain,pkg.id,pkg.operation);
   maps=validateRecords(data);routes=validateLibraryPaths(data);
   checkPathCollisions([...source.files,...files]);
   for(const p of collectPaths(data))
    need(files.has(p),'INVALID_CANDIDATE');
   for(const p of collectPaths(data)){
    if(p.endsWith('.md')){
     need(markdown.has(p),'INVALID_CANDIDATE');
     validateMarkdown(markdown.get(p),{
      owner:p,maps,exists:files,pathRoutes:routes,
     });
    }
   }
  }catch(e){
   if(e instanceof D6AtomicMediaTreeError)throw e;
   deny('INVALID_CANDIDATE');
  }
  let ownership;
  try{ownership=reviewD6CanonicalMediaOwnership({
   package:pkg,sourceFiles:source.files,candidateFiles:files,
   candidateMarkdown:markdown,candidateData:data,
  });}catch{deny('MEDIA_OWNERSHIP_DENIED');}
  need(ownership.verified===true&&
   ownership.fileCount===originals.length,'MEDIA_OWNERSHIP_DENIED');
  let verified;
  if(originals.length===0){
   // No upload or media-ticket verification may be silently skipped for a
   // package that declares new original images. That case must use the
   // full signed-ticket and independent original-byte readback path below.
   verified={verified:true,operationId:operation.operationId,
    fileCount:0,files:[]};
  }else{
   try{
    verified=await verifyD6CanonicalStagedGitBlobs({
     package:pkg,operation,media:mediaTickets,
     verifyTicket,readGitBlob,
    });
   }catch{deny('SIGNED_MEDIA_UNVERIFIED');}
  }
  need(verified?.verified===true&&
   verified.operationId===operation.operationId&&
   verified.fileCount===originals.length&&
   verified.files.length===originals.length,
   'SIGNED_MEDIA_UNVERIFIED');
  // Construct ALL mutations up front; do not create a tree with only
  // confirmed image blobs and missing Markdown/record JSON.
  const entries=new Map(),textProofs=[];
  const jsonPath=DOMAIN[domain].file;
  const canonicalJsonUnchanged=equal(source.data[domain],data[domain]);
  const jsonBody=JSON.stringify(data[domain],null,2)+'\n';
  // Do not claim an unchanged JSON blob was a mutation: independent
  // Git-tree readback requires exact equality of the changed path set.
  // The pinned, validated canonical-source JSON remains untouched.
  const textWrites=[
   ...(canonicalJsonUnchanged?[]:[{path:jsonPath,body:jsonBody}]),
   ...narrativeOps.filter(x=>!x.remove)];
  for(const item of textWrites){
   const p=await verifyTextBlob(readGitBlob,item.path,item.body);
   textProofs.push(p);writeEntry(entries,p.path,p.sha);
  }
  for(const item of narrativeOps.filter(x=>x.remove))
   writeEntry(entries,item.path,null);
  const expectedPaths=new Set(originals.map(x=>x.path));
  for(const file of verified.files){
   need(expectedPaths.has(file.path),'UNEXPECTED_MEDIA_PROOF');
   writeEntry(entries,file.path,file.blobSha);
   expectedPaths.delete(file.path);
  }
  need(expectedPaths.size===0&&
   entries.size>0&&
   entries.size===textWrites.length+
    narrativeOps.filter(x=>x.remove).length+originals.length&&
   entries.size<=MAX_ENTRIES,'INCOMPLETE_ATOMIC_TREE');
  need(enabled()===true,'DISABLED');
  const tree=Object.freeze([...entries.values()].sort((a,b)=>
   a.path.localeCompare(b.path)));
  return Object.freeze({
   operationId:operation.operationId,
   repositoryId:REPO.id,ref:REPO.ref,
   sourceRevision:operation.sourceRevision,
   baseTreeSha:source.treeSha,
   domain,recordId:pkg.id,
   fileCount:tree.length,
   mediaCount:originals.length,textCount:textProofs.length,
   canonicalJsonUnchanged,
   entries:tree,verifiedText:Object.freeze(textProofs),
   sourceOnly:true,atomicTreeReady:true,
   canSubmitTree:false,canPublish:false,isLive:false,
   requiresDurableGitStepFence:true,
   requiresIndependentTreeReadback:true,
   requiresSourceConflictRecheck:true,
  });
 }
 return Object.freeze({plan});
}
