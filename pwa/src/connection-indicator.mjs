// FISH118 V3 Connection Status: publishing overrides effective connection state.
const ACTIVE=new Set(['Submitting','Accepted','Validating','Checking',
 'Merging','Deploying','Verifying']);
const FAILED=new Set(['Failed','Conflict']);
// Null is the ordinary V2/private pilot (no optional reading preference).
// An unverified V3 preference ('Checking') fails closed to Offline.
export function effectiveConnectionOnline({online,readingMode=null}={}){
 return online===true&&(readingMode===null||readingMode==='Automatic');
}
export function connectionIndicator({online,authorized=false,publication='None',
 statusReadError=false,readingMode=null}={}){
 if(authorized===true&&FAILED.has(publication)){
  return Object.freeze({tone:'error',
   title:'Publishing failed',label:'Publishing failed'});
 }
 if(authorized===true&&ACTIVE.has(publication)){
  return Object.freeze({tone:'publishing',
   title:'Publishing: '+publication,label:'Publishing: '+publication});
 }
 // A pending reading-mode check is not a confirmed physical outage.
 const state=online===true&&readingMode==='Checking'?'Checking':
  effectiveConnectionOnline({online,readingMode})?'Online':'Offline';
 return Object.freeze({tone:'network',title:'Connection status: '+state,
  label:'Connection status: '+state});
}
