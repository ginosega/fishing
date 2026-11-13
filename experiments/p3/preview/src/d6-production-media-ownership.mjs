/**
 * WP3-2 pre-publish source/media ownership fence — SOURCE ONLY.
 *
 * Inputs MUST come from an independently verified canonical snapshot and a
 * validated candidate, never untrusted browser claims. This pure helper does
 * not authorize writes, stage media, create D1 receipts, or report Live.
 * Source review, signed media tickets and exact Git blob readback must be
 * integrated before a production writer can use its result.
 */
import {DOMAIN} from '../../../../pwa/src/shared.mjs';
import {validateRecords,validateLibraryPaths,
 checkPathCollisions} from '../../../../pwa/src/validation.mjs';
import {parseMarkdown} from '../../../../pwa/src/markdown.mjs';
import {expectedD6CanonicalMedia}
 from './d6-production-media-contract.mjs';

export class D6MediaOwnershipError extends Error{
 constructor(code){
  super('D6 canonical original media ownership denied');
  this.name='D6MediaOwnershipError';this.code=code;
 }
}
const need=(condition,code)=>{
 if(!condition)throw new D6MediaOwnershipError(code);
};

/**
 * Review the proposed media paths against a server-verified source snapshot
 * and its fully source-validated candidate. No public route may call this
 * using client-provided Sets/Maps/data.
 *
 * Existing-path media replacement is intentionally refused until a separate
 * original-blob SHA/readback gate is integrated. Do not bypass on retry.
 */
export function reviewD6CanonicalMediaOwnership({
 package:pkg,sourceFiles,candidateFiles,candidateMarkdown,candidateData,
}={}){
 need(sourceFiles instanceof Set&&candidateFiles instanceof Set&&
  candidateMarkdown instanceof Map&&candidateData&&
  typeof candidateData==='object','UNVERIFIED_SOURCE');
 const expected=expectedD6CanonicalMedia(pkg);
 need(expected.length>0,'NO_MEDIA');
 let maps,routes;
 try{
  maps=validateRecords(candidateData);
  routes=validateLibraryPaths(candidateData);
  checkPathCollisions([...sourceFiles,...candidateFiles]);
 }catch{need(false,'INVALID_CANDIDATE');}
 const record=candidateData[pkg.domain]?.[DOMAIN[pkg.domain].array]
  ?.find(item=>item.id===pkg.id);
 need(record,'MISSING_OWNER_RECORD');
 const expectedPaths=new Set(expected.map(x=>x.path));
 for(const file of expected){
  need(candidateFiles.has(file.path),'MISSING_MEDIA_CANDIDATE');
  // Same-path replacement needs an exact preimage Git blob SHA check in the
  // future authenticated writer. A filename collision never overwrites.
  need(!sourceFiles.has(file.path),'EXISTING_MEDIA_COLLISION');
 }
 const picture=pkg.picture??{action:'keep'},
  sequence=pkg.pictureSequence??{action:'keep'};
 if(['add','replace'].includes(picture.action))
  need(record.picture?.src===picture.path&&
   expectedPaths.has(picture.path),'PICTURE_NOT_OWNED');
 if(sequence.action==='set'){
  need(pkg.domain==='kb'&&
   Array.isArray(record.pictureSequence)&&
   record.pictureSequence.length===sequence.paths.length&&
   record.pictureSequence.every((path,i)=>path===sequence.paths[i])&&
   sequence.paths.at(-1)===picture.path,'SEQUENCE_NOT_OWNED');
 }
 const notes=pkg.notes?.images??[];
 if(notes.length){
  const key=pkg.domain==='kb'?'content':'notes';
  need(['create','replace'].includes(pkg.notes.action)&&
   record[key]===pkg.notes.path&&
   candidateMarkdown.get(pkg.notes.path)===pkg.notes.body&&
   candidateFiles.has(pkg.notes.path),
   'NARRATIVE_NOT_OWNED');
  let references;
  try{
   references=parseMarkdown(pkg.notes.body,{
    owner:pkg.notes.path,maps,exists:candidateFiles,
    pathRoutes:routes,viewerImages:true,
   }).references;
  }catch{need(false,'INVALID_MARKDOWN');}
  // Markdown reference kind describes URL resolution (e.g. 'local'),
  // not image-vs-link. Use parser image metadata to reject link-only refs.
  const images=new Set(references.filter(r=>r.isImage===true&&
   r.local).map(r=>r.local));
  for(const image of notes)
   need(images.has(image.path),'UNREFERENCED_NOTE_IMAGE');
 }
 return Object.freeze({
  verified:true,sourceOnly:true,canPublish:false,
  requiresSignedStaging:true,requiresGitReadback:true,
  requiresAtomicTree:true,
  fileCount:expected.length,
  paths:Object.freeze(expected.map(x=>x.path)),
 });
}
