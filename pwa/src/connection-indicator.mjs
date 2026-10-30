// FISH118 V3-only Connection Status dot semantics.
// Color follows publication receipt when a trusted owner operation exists;
// otherwise it follows physical browser connectivity, never reading mode.
const ACTIVE=new Set(['Submitting','Accepted','Validating','Checking',
 'Merging','Deploying','Verifying']);
const FAILED=new Set(['Failed','Conflict']);
export function connectionIndicator({online,authorized=false,publication='None',
 statusReadError=false,readingMode=null}={}){
 const network=online===true?'Online':'Offline';
 const suffix=readingMode?' · Reading mode: '+readingMode:'';
 if(authorized===true&&FAILED.has(publication)){
  return Object.freeze({tone:'error',
   title:'Publication '+publication+' · Open Connection Status to review and clear the failed publication',
   label:'Connection status, publication '+publication+', '+network.toLowerCase()});
 }
 if(authorized===true&&ACTIVE.has(publication)){
  return Object.freeze({tone:'publishing',
   title:'Publication: '+publication+
    (statusReadError?' · Latest status check unavailable; retry in Connection Status':''),
   label:'Connection status, publication '+publication+', '+network.toLowerCase()});
 }
 return Object.freeze({tone:'network',title:network+suffix,
  label:'Connection status, '+network.toLowerCase()+
   (readingMode?', reading mode '+readingMode:'')});
}
