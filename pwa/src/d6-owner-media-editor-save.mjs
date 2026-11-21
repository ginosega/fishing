/**
 * M02 — source-only bridge from the accepted Gear/KB/Catch editors to the
 * unmounted R2 stage + revision-conditional D1 publication coordinator.
 * No provider, Worker or build flag enables this path. Text-only Save stays
 * on the existing accepted D1 client; this bridge never uses GitHub writes.
 */
import {validateD6MediaOwnerPath,publishedD6MediaRole,d6ValidKnotSequence}
 from './d6-content-media-contract.mjs';
import {isD6NotesImageLinked} from './d6-notes-image-link.mjs';

const fail=(code,message)=>Object.assign(new Error(message),{code});
/**
 * uploads: [{path,file,role}] from selected original bytes, not a URL.
 * All local references are checked before the first possible R2 stage.
 * Ambiguous outcomes are left with the coordinator for explicit reconciliation:
 * no retries, no receipt removal and no fallback text-only Save.
 */
export async function saveD6OwnerEditorMedia({
 domain,record,markdown,expectedRevision,uploads,
 capabilities,coordinator,
}={}){
 if(capabilities?.canUploadNewImages!==true||
    typeof coordinator?.ready!=='function'||coordinator.ready()!==true||
    typeof coordinator.stage!=='function'||typeof coordinator.publish!=='function')
  throw fail('MEDIA_DISABLED','Owner media service is not verified as enabled');
 if(!['gear','kb','catches'].includes(domain)||
    !record||typeof record.id!=='string'||
    typeof markdown!=='string'||
    !Number.isSafeInteger(expectedRevision)||expectedRevision<0||
    !Array.isArray(uploads)||uploads.length<1||uploads.length>32)
  throw fail('MEDIA_INVALID','Invalid media Save request');
 const prepared=[],seen=new Set();
 for(const upload of uploads){
  if(!upload||!['notes','cover','knot-step'].includes(upload.role)||
     !upload.file||typeof upload.file.arrayBuffer!=='function')
   throw fail('MEDIA_INVALID','Selected original image is missing');
  const path=validateD6MediaOwnerPath({
   domain,record,logicalPath:upload.path,role:upload.role,
  }).logicalPath;
  if(seen.has(path))throw fail('MEDIA_INVALID','Duplicate image path');
  seen.add(path);
  if(publishedD6MediaRole({domain,record,logicalPath:path,
      notesLinked:upload.role==='notes'&&
      isD6NotesImageLinked(markdown,path)})!==upload.role)
   throw fail('MEDIA_INVALID','Image is not linked by the revised record');
  prepared.push({logicalPath:path,role:upload.role,file:upload.file});
 }
 const frames=prepared.filter(x=>x.role==='knot-step');
 if(frames.length){
  if(domain!=='kb'||!d6ValidKnotSequence(record)||
     frames.length!==record.pictureSequence.length||
     record.pictureSequence.some(path=>!frames.some(x=>x.logicalPath===path)))
   throw fail('MEDIA_INVALID','Knot sequence must include every ordered frame');
 }
 // Stage only after full batch preflight. A partial or unknown stage cannot be
 // retried automatically; the client retains its receipts/attempt fences.
 const staged=[];
 for(const item of prepared){
  staged.push(await coordinator.stage({
   domain,record,logicalPath:item.logicalPath,role:item.role,file:item.file,
  }));
 }
 const saved=await coordinator.publish({
  domain,record,markdown,expectedRevision,staged,
 });
 if(saved?.verified!==true||saved.record?.id!==record.id||
    saved.revision!==expectedRevision+1)
  throw fail('MEDIA_UNVERIFIED','D1 and R2 readback not verified');
 return saved;
}
