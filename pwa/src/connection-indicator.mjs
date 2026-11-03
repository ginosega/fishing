// FISH118 V3-only Connection Status dot semantics.
// Trusted publication failures and active operations take priority. Otherwise,
// verified Work Offline must be distinguishable from network connectivity.
const ACTIVE=new Set(['Submitting','Accepted','Validating','Checking',
 'Merging','Deploying','Verifying']);
const FAILED=new Set(['Failed','Conflict']);
export function connectionNetworkText({online,readingMode=null}={}){
 if(readingMode==='Work Offline')return online===true?
  'Work Offline · network available':'Work Offline · network unavailable';
 return online===true?'Online':'Offline';
}
export function connectionIndicator({online,authorized=false,publication='None',
 statusReadError=false,readingMode=null}={}){
 const network=online===true?'Online':'Offline';
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
 if(readingMode==='Work Offline'){
  const status=connectionNetworkText({online,readingMode});
  return Object.freeze({tone:'work-offline',title:'Connection status: '+status,
   label:'Connection status: '+status});
 }
 return Object.freeze({tone:'network',title:'Connection status: '+network,
  label:'Connection status: '+network});
}
