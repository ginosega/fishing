// Provisional D5 editor draft adapter. No background publishing or uploads.
export async function restoreD5EditorDraft({
 store,key,sourceRevision,baseHash=null,baseRevision=null,
 ask=globalThis.confirm,
}={}){
 if(!store)return {status:'disabled'};
 let result;
 try{result=await store.read(key,{sourceRevision,baseHash,baseRevision});}
 catch{return {status:'unavailable',message:'Device draft storage is unavailable; your editor remains usable.'};}
 if(result?.status==='ready'){
  let approved=false;
  try{approved=ask('An unsent draft is saved on this device. Restore it? Select Cancel to discard this draft.')===true;}
  catch{return {status:'unavailable',message:'Draft confirmation unavailable; the saved draft was preserved.'};}
  if(approved)return {status:'restored',record:result.draft.record,
   notes:result.draft.notes,requiresMedia:result.draft.requiresMedia,
   message:result.draft.requiresMedia?
    'Draft restored. Local pictures were not stored; reattach them before publishing.':
    'Unsent device draft restored. Nothing was published.'};
  try{await store.discard(key);return {status:'discarded'};}
  catch{return {status:'unavailable',message:'Draft could not be discarded. No new changes were made.'};}
 }
 // Changed D1 row or old v1 draft without an auditable row revision.
 // Explicitly allow copying the locally saved text, but never permit a
 // publishing Save or automatic rewrite on top of the newer server record.
 if(['conflict','legacy'].includes(result?.status)&&result?.draft){
  let approved=false;
  try{approved=ask('This device draft is not verified against the current record revision. Restore it for copying only? Save will remain blocked. Select Cancel to keep the draft untouched.')===true;}
  catch{return {status:result.status,
   message:'The existing device draft was retained. No changes were made.'};}
  if(approved)return {status:'review',record:result.draft.record,
   notes:result.draft.notes,requiresMedia:result.draft.requiresMedia,
   reviewOnly:true,message:'Draft restored for copying only. The server record may have changed; Save is blocked. Copy your edits to a fresh editor, or explicitly discard this saved draft.'};
  return {status:result.status,
   message:'The existing device draft was retained. Automatic draft writes are paused to avoid overwriting it.'};
 }
 if(['stale','corrupt'].includes(result?.status)){
  const incompatible=result.status==='stale'?'based on different source content':'invalid';
  let discard=false;
  try{discard=ask('An existing device draft is '+incompatible+'. It cannot be restored safely. Discard this old draft and begin a new one?')===true;}
  catch{return {status:result.status,message:'The saved draft is retained; automatic draft writes are paused.'};}
  if(discard){
   try{await store.discard(key);return {status:'discarded',
    message:'The incompatible saved draft was explicitly discarded.'};}
   catch{return {status:'unavailable',message:'Draft discard failed; automatic draft writes are paused.'};}
  }
  return {status:result.status,message:'The incompatible saved draft was preserved. Automatic draft writes are paused to avoid overwriting it.'};
 }
 if(result?.status==='unavailable')return {status:'unavailable',
  message:'Device draft storage could not be read. The online editor remains available.'};
 return {status:'missing'};
}
export async function saveD5EditorDraft({store,key,domain,sourceRevision,
 baseHash=null,baseRevision=null,record,notes,requiresMedia=false}={}){
 if(!store)return false;
 await store.save({key,domain,sourceRevision,baseHash,baseRevision,
  record,notes,requiresMedia});
 return true;
}
