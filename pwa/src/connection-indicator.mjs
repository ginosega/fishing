// FISH118 V3-only Connection Status dot semantics.
// Color follows publication receipt when a trusted owner operation exists;
// otherwise it follows physical browser connectivity, never reading mode.
const ACTIVE=new Set(['Submitting','Accepted','Validating','Checking',
 'Merging','Deploying','Verifying']);
const FAILED=new Set(['Failed','Conflict']);
export function connectionIndicator({online,authorized=false,publication='None',
 statusReadError=false,readingMode=null}={}){
 const network=online===true?'Online':'Offline';
 // Reading preference is deliberately absent from both tooltip and label.
 if(authorized===true&&FAILED.has(publication)){
  return Object.freeze({tone:'error',
   title:'Publishing failed',
   label:'Publishing failed'});
 }
 if(authorized===true&&ACTIVE.has(publication)){
  return Object.freeze({tone:'publishing',
   title:'Publishing: '+publication,
   label:'Publishing: '+publication});
 }
 return Object.freeze({tone:'network',title:'Connection status: '+network,
  label:'Connection status: '+network});
}
