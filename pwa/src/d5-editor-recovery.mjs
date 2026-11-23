// Provisional D5 editor draft adapter. No background publishing or uploads.
export async function restoreD5EditorDraft({
 store,key,sourceRevision,baseHash=null,ask=globalThis.confirm,
}={}){
 if(!store)return {status:'disabled'};
 let result;
 try{result=await store.read(key,{sourceRevision,baseHash});}
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
 baseHash=null,record,notes,requiresMedia=false}={}){
 if(!store)return false;
 await store.save({key,domain,sourceRevision,baseHash,record,notes,requiresMedia});
 return true;
}
