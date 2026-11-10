/**
 * D6 canonical Gear/KB candidate review — SOURCE ONLY, NO WRITE.
 *
 * Consume an already owner-authorized non-submitting D6 intake envelope and
 * an independently authenticated, exact-main D6 source snapshot. This pure
 * module never obtains either proof, mints a token, stores an operation,
 * merges a PR, or declares Live. Do not expose it as an HTTP endpoint.
 *
 * A future trusted orchestrator MUST acquire and recheck both server-side,
 * reconcile an immutable receipt, and separately authorize every provider
 * action. All capabilities default OFF.
 */
import {DOMAIN,sha256,pathKey} from '../../../../pwa/src/shared.mjs';
import {validatePackage,promoteChange,ChangeConflictError}
 from '../../../../pwa/src/handoff.mjs';
import {validateRecords,validateLibraryPaths,collectPaths,
 checkPathCollisions,validateMarkdown}
 from '../../../../pwa/src/validation.mjs';
import {D6_SOURCE_REPOSITORY}
 from './d6-canonical-snapshot-loader.mjs';
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';

const SHA=/^[a-f0-9]{40}$/;
const KEY=/^[A-Za-z0-9_-]{12,96}$/;
const MAX_FILES=1800,MAX_MARKDOWN=240,MAX_MD_BYTES=131072;
const encoder=new TextEncoder();
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export class D6CanonicalReviewError extends Error {
 constructor(code){super('D6 canonical candidate review denied');
  this.name='D6CanonicalReviewError';this.code=code;}
}
const deny=code=>{throw new D6CanonicalReviewError(code);};
const need=(v,code)=>{if(!v)deny(code);};
function freeze(value){
 if(value&&typeof value==='object'&&!Object.isFrozen(value)){
  for(const item of Object.values(value))freeze(item);
  Object.freeze(value);
 }
 return value;
}
function checkInputs(intake,source){
 need(isObject(intake)&&intake.sourceOnly===true&&
  intake.canPublish===false&&intake.requiresSourceReview===true&&
  intake.id===D6_PUBLISH_REPOSITORY.id&&
  intake.name===D6_PUBLISH_REPOSITORY.name&&
  intake.ref===D6_PUBLISH_REPOSITORY.ref&&
  intake.ownerGitHubId===D6_PUBLISH_REPOSITORY.ownerGitHubId&&
  KEY.test(intake.idempotencyKey??'')&&
  SHA.test(intake.trustedMainSha??'')&&
  SHA.test(intake.submittedSourceRevision??''),
  'UNVERIFIED_INTAKE');
 need(isObject(source)&&source.sourceOnly===true&&
  source.canPublish===false&&
  source.repositoryId===D6_SOURCE_REPOSITORY.id&&
  source.repositoryFullName===D6_SOURCE_REPOSITORY.fullName&&
  source.ref===D6_SOURCE_REPOSITORY.ref&&
  SHA.test(source.sourceRevision??'')&&
  SHA.test(source.treeSha??'')&&
  source.sourceRevision===intake.trustedMainSha&&
  isObject(source.data)&&source.files?.constructor===Set&&
  source.markdown?.constructor===Map&&
  source.files.size<=MAX_FILES&&source.markdown.size<=MAX_MARKDOWN,
  'UNVERIFIED_SOURCE');
 const pkg=intake.snapshot?.package;
 need(Array.isArray(intake.snapshot?.media)&&
  intake.snapshot.media.length===0&&isObject(pkg)&&
  ['gear','kb'].includes(pkg.domain)&&
  ['add','edit'].includes(pkg.operation)&&
  pkg.base?.sourceRevision===intake.submittedSourceRevision&&
  pkg.picture?.action==='keep'&&
  (pkg.pictureSequence?.action??'keep')==='keep'&&
  (!pkg.notes?.images||
   Array.isArray(pkg.notes.images)&&pkg.notes.images.length===0),
  'INVALID_INTENT');
 try{validatePackage(pkg);}
 catch{deny('INVALID_INTENT');}
 return pkg;
}

export function createD6CanonicalCandidateReview({enabled=()=>false}={}){
 need(typeof enabled==='function','INVALID_CONFIG');
 async function review(intake,source){
  need(enabled()===true,'DISABLED');
  const pkg=checkInputs(intake,source),domain=pkg.domain;
  let data;
  try{
   data=structuredClone(source.data);
   validateRecords(data);
   validateLibraryPaths(data);
  }catch{deny('INVALID_SOURCE');}
  // Refuse incomplete snapshot material before reviewing any candidate.
  // The trusted loader guarantees this; keep the pure review seam fail-closed
  // if a future caller passes a truncated source projection.
  for(const p of collectPaths(data)){
   if(!source.files.has(p))deny('INVALID_SOURCE');
   if(p.endsWith('.md')&&
    (!source.markdown.has(p)||typeof source.markdown.get(p)!=='string'))
    deny('MISSING_SOURCE_NARRATIVE');
  }
  const key=DOMAIN[domain].array;
  const list=data[domain][key];
  const existing=list.find(r=>r.id===pkg.id);
  const narrative=domain==='gear'?'notes':'content';
  const path=existing?.[narrative];
  if(path&&(!source.files.has(path)||!source.markdown.has(path)))
   deny('MISSING_SOURCE_NARRATIVE');
  const currentText=path?source.markdown.get(path):'';
  let staged;
  try{
   staged=await promoteChange({
    package:pkg,currentRecord:existing,currentText,
    sourceRevision:source.sourceRevision,conflictPolicy:'review',
   });
  }catch(e){
   if(e instanceof ChangeConflictError)deny('CONFLICT_REVIEW_REQUIRED');
   deny('INVALID_CHANGE');
  }
  need(staged?.record?.id===pkg.id&&Array.isArray(staged.writes)&&
   staged.writes.length<=1&&staged.conflicts?.length===0,
   'INVALID_CHANGE');
  if(pkg.operation==='add')need(!existing,'CONFLICT_REVIEW_REQUIRED');
  else need(!!existing,'CONFLICT_REVIEW_REQUIRED');
  const stagedFiles=new Set(source.files);
  const md=new Map(source.markdown);
  for(const write of staged.writes){
   need(typeof write.path==='string'&&write.path.endsWith('.md')&&
    /^(?:Gear|KB)\//.test(write.path),'INVALID_NARRATIVE_WRITE');
   if(write.remove===true){
    need(stagedFiles.has(write.path)&&md.has(write.path),
     'MISSING_SOURCE_NARRATIVE');
    stagedFiles.delete(write.path);md.delete(write.path);
   }else{
    need(typeof write.body==='string'&&
     encoder.encode(write.body).byteLength<=MAX_MD_BYTES,
     'INVALID_NARRATIVE_WRITE');
    if(write.baseSha256===null){
     need(!stagedFiles.has(write.path)&&!md.has(write.path),
      'PATH_ALREADY_EXISTS');
    }else{
     need(stagedFiles.has(write.path)&&md.has(write.path)&&
      await sha256(md.get(write.path))===write.baseSha256,
      'CONFLICT_REVIEW_REQUIRED');
    }
    stagedFiles.add(write.path);md.set(write.path,write.body);
   }
  }
  if(pkg.operation==='add')list.push(staged.record);
  else list[list.findIndex(r=>r.id===pkg.id)]=staged.record;
  // Full-domain schema, cross-record references, links, and path ownership
  // are checked on the proposed data, not just on the changed record.
  let maps,routes;
  try{
   maps=validateRecords(data);
   routes=validateLibraryPaths(data);
   const refs=collectPaths(data);
   checkPathCollisions([...stagedFiles]);
   for(const p of refs)need(stagedFiles.has(p),'MISSING_REFERENCE');
   for(const [p,text] of md){
    need(stagedFiles.has(p)&&p.endsWith('.md')&&
     typeof text==='string'&&encoder.encode(text).byteLength<=MAX_MD_BYTES,
     'INVALID_NARRATIVE_WRITE');
    validateMarkdown(text,{owner:p,maps,exists:stagedFiles,pathRoutes:routes});
   }
  }catch{deny('CANDIDATE_VALIDATION_FAILED');}
  need(stagedFiles.size<=MAX_FILES&&md.size<=MAX_MARKDOWN,
   'CANDIDATE_TOO_LARGE');
  // Deliberate non-submitting output: only a proposed record/write set.
  // No operation ID, authorization token, check receipt, PR or release ID.
  return freeze({
   repositoryId:D6_PUBLISH_REPOSITORY.id,
   sourceRevision:source.sourceRevision,
   baseRevision:intake.submittedSourceRevision,
   idempotencyKey:intake.idempotencyKey,
   domain,id:pkg.id,operation:pkg.operation,
   record:staged.record,
   narrativeWrites:staged.writes.map(x=>({...x})),
   validatedForSourceReview:true,
   requiresDurableReceipt:true,
   sourceOnly:true,canPublish:false,
  });
 }
 return Object.freeze({review});
}
