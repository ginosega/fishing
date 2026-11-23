/**
 * D01 V3-only revision-aware Restore/Discard bridge.
 * Preserve the approved, byte-pinned D5 recovery helper unchanged.
 * Drafts never publish, stage media, queue retries, or overwrite server rows.
 */
import {restoreD5EditorDraft,saveD5EditorDraft}
 from './d5-editor-recovery.mjs';

export async function restoreD6RevisionAwareDraft({
 store,key,sourceRevision,baseHash=null,baseRevision=null,
 ask=globalThis.confirm,
}={}){
 if(baseRevision===null)
  return restoreD5EditorDraft({
   store,key,sourceRevision,baseHash,ask,
  });
 if(!Number.isSafeInteger(baseRevision)||baseRevision<0)
  return {status:'unavailable',
   message:'Current D1 record revision could not be verified. The saved draft remains untouched.'};
 if(!store)return {status:'disabled'};
 let result;
 try{result=await store.read(key,{sourceRevision,baseHash,baseRevision});}
 catch{return {status:'unavailable',
  message:'Device draft storage is unavailable; your editor remains usable.'};}
 if(['legacy','conflict'].includes(result?.status)&&result?.draft){
  let approved=false;
  try{
   approved=ask('This saved draft is not verified against the current record revision. Restore it for copying only? Save will remain blocked. Select Cancel to keep the draft untouched.')===true;
  }catch{return {status:result.status,
   message:'The existing device draft was retained. No changes were made.'};}
  if(approved)return {status:'review',record:result.draft.record,
   notes:result.draft.notes,requiresMedia:result.draft.requiresMedia,
   reviewOnly:true,
   message:'Draft restored for copying only. The server record may have changed; Save is blocked. Copy your edits to a fresh editor, or explicitly discard this saved draft.'};
  return {status:result.status,
   message:'The existing device draft was retained. Automatic draft writes are paused to avoid overwriting it.'};
 }
 // Reuse the accepted D5 Restore/Discard dialog for compatible V3 drafts.
 // The result has already been checked against the current D1 revision.
 return restoreD5EditorDraft({
  store:{read:async()=>result,discard:value=>store.discard(value)},
  key,sourceRevision,baseHash,ask,
 });
}

export async function saveD6RevisionAwareDraft({
 store,key,domain,sourceRevision,baseHash=null,baseRevision=null,
 record,notes,requiresMedia=false,
}={}){
 if(baseRevision===null)
  return saveD5EditorDraft({store,key,domain,sourceRevision,baseHash,
   record,notes,requiresMedia});
 if(!Number.isSafeInteger(baseRevision)||baseRevision<0)
  throw Error('INVALID_DEVICE_DRAFT');
 if(!store)return false;
 await store.save({key,domain,sourceRevision,baseHash,baseRevision,
  record,notes,requiresMedia});
 return true;
}
