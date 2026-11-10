/**
 * D6 canonical publishing SOURCE REVIEW — no mutation, operation or route.
 *
 * Takes a fully authenticated, non-submitting #415 intake and independently
 * reloads the exact trusted GitHub main snapshot via the existing D6
 * read-only snapshot loader. A candidate is never Accepted or Live.
 *
 * All capabilities default OFF. The trustedMainSha argument MUST be
 * resolved server-side; never accept it from an HTTP field. The injected
 * loader MUST be createD6CanonicalSnapshotLoader.loadSnapshot, not a
 * browser-provided source object. No GitHub write, D1, Worker, or merge API.
 */
import {promoteChange,ChangeConflictError}
 from '../../../../pwa/src/handoff.mjs';
import {DOMAIN,fingerprint,safePath,equal}
 from '../../../../pwa/src/shared.mjs';
import {validateRecords,validateRecord,validateLibraryPaths,
 collectPaths,checkPathCollisions,validateMarkdown}
 from '../../../../pwa/src/validation.mjs';
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';
import {D6_SOURCE_REPOSITORY}
 from './d6-canonical-snapshot-loader.mjs';

const SHA=/^[a-f0-9]{40}$/;
export class D6SourceReviewError extends Error {
 constructor(code){super('D6 canonical publishing source review denied');
  this.name='D6SourceReviewError';this.code=code;}
}
const deny=code=>{throw new D6SourceReviewError(code);};
const need=(value,code)=>{if(!value)deny(code);};
const suffix=domain=>domain==='gear'?'notes':'content';
const correctSource=(source,sha)=>source?.repositoryId===
 D6_SOURCE_REPOSITORY.id&&
 source?.repositoryFullName===D6_SOURCE_REPOSITORY.fullName&&
 source?.ref===D6_SOURCE_REPOSITORY.ref&&
 source?.sourceRevision===sha&&SHA.test(source?.treeSha??'')&&
 source?.sourceOnly===true&&source?.canPublish===false&&
 source?.files?.constructor===Set&&source?.markdown?.constructor===Map&&
 source?.data?.gear&&source?.data?.kb&&source?.data?.catches;
const isNarrative=(path,domain)=>{
 try{return safePath(path)===path&&path.startsWith(
   domain==='gear'?'Gear/':'KB/')&&
   path.includes('/content/')&&path.endsWith('.md');}
 catch{return false;}
};

/** Review a TEXT-ONLY Gear/KB intent. Result stays server-internal, not a
 * public API response or permission to submit any operation. */
export function createD6ProductionSourceReview({
 intake,loadSnapshot,enabled=()=>false,
}={}){
 need(typeof intake?.inspect==='function'&&
  typeof loadSnapshot==='function'&&typeof enabled==='function',
  'INVALID_CONFIG');

 async function review(request,{trustedMainSha}={}){
  need(enabled()===true,'DISABLED');
  need(typeof trustedMainSha==='string'&&SHA.test(trustedMainSha),
   'UNVERIFIED_MAIN');
  // Owner/session/Origin/CSRF validation precedes ALL canonical source reads.
  const intent=await intake.inspect(request,{trustedMainSha});
  need(intent?.sourceOnly===true&&intent?.canPublish===false&&
   intent?.requiresSourceReview===true&&
   intent?.id===D6_PUBLISH_REPOSITORY.id&&
   intent?.name===D6_PUBLISH_REPOSITORY.name&&
   intent?.ref===D6_PUBLISH_REPOSITORY.ref&&
   intent?.ownerGitHubId===D6_PUBLISH_REPOSITORY.ownerGitHubId&&
   intent?.trustedMainSha===trustedMainSha&&
   intent?.snapshot?.media?.length===0,'UNTRUSTED_INTENT');
  const pkg=intent.snapshot.package;
  need(['gear','kb'].includes(pkg?.domain)&&
   ['add','edit'].includes(pkg?.operation)&&
   pkg?.base?.sourceRevision===trustedMainSha,'STALE_SOURCE');

  let source;
  try{source=await loadSnapshot({
   expectedReleaseRevision:trustedMainSha,
  });}
  catch{deny('SOURCE_UNAVAILABLE');}
  need(correctSource(source,trustedMainSha),'SOURCE_UNVERIFIED');
  const domain=pkg.domain,array=DOMAIN[domain].array;
  let data,files,markdown,maps,routes;
  try{
   data=structuredClone(source.data);
   files=new Set(source.files);
   markdown=new Map(source.markdown);
   maps=validateRecords(data);
   routes=validateLibraryPaths(data);
   for(const path of collectPaths(data))
    need(files.has(path),'INVALID_CANONICAL_SOURCE');
  }catch{deny('INVALID_CANONICAL_SOURCE');}
  const records=data[domain][array];
  const currentRecord=records.find(x=>x.id===pkg.id);
  if(pkg.operation==='add'){
   need(!currentRecord&&pkg.base.recordHash===null,'CONFLICT');
  }else{
   need(currentRecord&&SHA.test(pkg.base.recordHash??'')===false,
    'INVALID_BASE_HASH');
   // base.recordHash is a SHA-256 fingerprint, not a Git object SHA.
   need(/^[a-f0-9]{64}$/.test(pkg.base.recordHash??''),
    'INVALID_BASE_HASH');
   need(await fingerprint(currentRecord)===pkg.base.recordHash,
    'CONFLICT');
  }
  const oldPath=currentRecord?.[suffix(domain)];
  need(!oldPath||markdown.has(oldPath),'INVALID_CANONICAL_SOURCE');
  let promoted;
  try{
   promoted=await promoteChange({
    package:pkg,currentRecord,currentText:oldPath?
     markdown.get(oldPath):'',
    sourceRevision:trustedMainSha,conflictPolicy:'review',
    validate:record=>validateRecord(record,domain,data),
   });
  }catch(e){
   if(e instanceof ChangeConflictError)deny('CONFLICT');
   deny('INVALID_CHANGE');
  }
  need(promoted?.record?.id===pkg.id&&
   promoted?.sourceRevision===trustedMainSha,'INVALID_CHANGE');
  // No picture, sequence, Catch or arbitrary media writes are authorized.
  need(equal(promoted.record.picture,currentRecord?.picture)&&
   equal(promoted.record.pictureSequence,currentRecord?.pictureSequence),
   'UNSUPPORTED_MEDIA');
  const fileOps=[];
  for(const write of promoted.writes){
   const path=write.path;
   need(isNarrative(path,domain),'UNSAFE_NARRATIVE_PATH');
   const existed=files.has(path);
   if(write.remove===true){
    need(existed&&markdown.has(path),'INVALID_CHANGE');
    markdown.delete(path);files.delete(path);
    fileOps.push(Object.freeze({path,action:'remove',
     baseSha256:write.baseSha256}));
   }else{
    need(typeof write.body==='string'&&write.body.length>0&&
     new TextEncoder().encode(write.body).length<=131072,
     'INVALID_CHANGE');
    need(write.baseSha256===null?!existed:
     existed&&markdown.has(path),'CONFLICT');
    markdown.set(path,write.body);files.add(path);
    fileOps.push(Object.freeze({path,
     action:existed?'replace':'create',body:write.body,
     baseSha256:write.baseSha256}));
   }
  }
  if(pkg.operation==='add')records.push(promoted.record);
  else records[records.findIndex(x=>x.id===pkg.id)]=promoted.record;
  try{
   maps=validateRecords(data);
   routes=validateLibraryPaths(data);
   const used=collectPaths(data);
   checkPathCollisions(used);
   for(const path of used)need(files.has(path),'INVALID_CANDIDATE');
   for(const path of used){
    if(path.endsWith('.md')){
     need(markdown.has(path),'INVALID_CANDIDATE');
     validateMarkdown(markdown.get(path),{
      owner:path,maps,exists:files,pathRoutes:routes,
     });
    }
   }
  }catch{deny('INVALID_CANDIDATE');}
  need(pkg.operation==='add'||fileOps.length>0||
   !equal(promoted.record,currentRecord),'NO_CHANGE');
  // Internal, non-durable candidate for a future independently approved
  // operation engine. No operation ID, receipt, CI/merge, or Live status.
  return Object.freeze({
   repositoryId:D6_SOURCE_REPOSITORY.id,
   ref:D6_SOURCE_REPOSITORY.ref,sourceRevision:trustedMainSha,
   treeSha:source.treeSha,idempotencyKey:intent.idempotencyKey,
   domain,operation:pkg.operation,recordId:pkg.id,
   candidateData:data,candidateFiles:files,candidateMarkdown:markdown,
   fileOps:Object.freeze(fileOps),
   sourceOnly:true,requiresDurableOperation:true,canPublish:false,
  });
 }
 return Object.freeze({review});
}
