/**
 * O02 source-only: approved two-line V3 Offline Library presentation contract.
 *
 * The existing FISH091 release status remains unchanged until a separately
 * verified O02 bridge supplies contentPreparation events. No premature Ready
 * status may be inferred from an R2 registry or image count alone.
 */
const ACTIVE = new Set(['checking','images','verifying']);
const MESSAGES = Object.freeze({
 checking:'Checking for offline library updates…',
 images:'Reusing existing images and downloading changes…',
 verifying:'Verifying offline library integrity…',
});
const ISSUES = Object.freeze({
 network:{
  retained:'Connection lost. Previous offline library retained. Reconnect and try again.',
  first:'Connection lost. Reconnect and try preparing the offline library again.',
 },
 image:{
  retained:'An image could not be verified. Previous offline library retained. Try updating again.',
  first:'An image could not be verified. Try preparing the offline library again.',
 },
 storage:{
  retained:'Not enough storage to complete the update. Previous offline library retained.',
  first:'Not enough storage to prepare the offline library.',
 },
 content:{
  retained:'Offline library update could not be completed. Previous offline library retained.',
  first:'Offline library could not be prepared. Try again.',
 },
});
const validCount=n=>Number.isSafeInteger(n)&&n>=0;
const countLabel=(state,unit)=>{
 const completed=validCount(state?.completed)?state.completed:0;
 const total=validCount(state?.total)?state.total:null;
 return total!==null&&completed<=total?
  ` · ${completed}/${total} ${unit}`:'';
};
function legacyView(status,{online,currentReleaseId}){
 const ready=status?.state==='Ready';
 const needsUpdate=status?.state==='Incomplete'&&Boolean(status.message);
 const label=ready?(online?
  (status.releaseId===currentReleaseId?
   `Offline library ready · current · ${status.files||0} files`:
   `Offline library ready · update available · ${status.files||0} files`):
  `Offline library ready · ${status.files||0} files`):
  status?.state==='Downloading'?
   `Preparing offline library · ${status.completed||0}/${status.files||'?'} files`:
  needsUpdate?'Offline library needs update':'Offline library not prepared';
 return {label,message:status?.message||'',busy:status?.state==='Downloading'||
  status?.updating===true};
}
export function v3OfflineLibraryDisplay(status,options={}){
 const legacy=legacyView(status,options);
 const task=status?.contentPreparation;
 const phase=task?.phase;
 if(ACTIVE.has(phase)){
  const progress=phase==='checking'?'':countLabel(task,'images');
  return {label:'Preparing offline library'+progress,
   message:MESSAGES[phase],busy:true};
 }
 if(phase==='error'){
  // A verified previous release AND content generation are required to
  // describe the old offline library as usable; do not trust a prior count.
  const retained=status?.state==='Ready'&&task.previousVerified===true;
  const reason=Object.hasOwn(ISSUES,task.reason)?task.reason:'content';
  return {label:retained?legacy.label:'Offline library not prepared',
   message:ISSUES[reason][retained?'retained':'first'],
   busy:status.updating===true};
 }
 if(phase==='complete'||phase==='unchanged'){
  // The O02 source component alone does NOT prove that the existing
  // software release and current content are jointly usable offline.
  if(status?.state==='Ready'&&task.libraryReady===true){
   return {label:legacy.label,message:'',busy:status.updating===true};
  }
  return {label:'Preparing offline library'+countLabel(task,'images'),
   message:'Verifying offline library integrity…',busy:true};
 }
 return legacy;
}
