// V3 considers only a verified selected offline release prepared.
// An Incomplete library (even a prior corrupt cache) needs preparation.
export function v3OfflineLibraryActionLabel(status){
 const phase=status?.contentPreparation?.phase;
 if(['checking','images','verifying'].includes(phase)||
    ['complete','unchanged'].includes(phase)&&
     status.contentPreparation.libraryReady!==true)
  return 'Preparing…';
 if(status?.state==='Downloading'||status?.updating===true)return 'Preparing…';
 return status?.state==='Ready'?'Update':'Prepare';
}
