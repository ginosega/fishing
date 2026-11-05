/**
 * D5 PREPARE-ONLY additive sandbox baseline. Never writes to GitHub.
 * Existing sandbox entries stay byte-for-byte unchanged as record objects.
 * Appending canonical items is allowed only when schema versions and IDs
 * do not collide; physical path integrity is independently checked by the
 * local prepare tool before any proposed sandbox PR.
 */
export const D5_DOMAINS=Object.freeze({
 gear:'items',kb:'entities',catches:'catches',
});
export function mergeD5SandboxBaseline(canonical,sandbox){
 if(!canonical||!sandbox)throw Error('Missing source data');
 const combined={},summary={};
 for(const [domain,array] of Object.entries(D5_DOMAINS)){
  const baseline=canonical[domain],existing=sandbox[domain];
  if(!baseline||!existing||
   baseline.schemaVersion!==2||existing.schemaVersion!==2||
   !Array.isArray(baseline[array])||!Array.isArray(existing[array])||
   Object.keys(baseline).sort().join(',')!==
    Object.keys(existing).sort().join(','))
    throw Error('Incompatible '+domain+' canonical/sandbox index');
  const ids=new Set();
  for(const item of baseline[array]){
   if(typeof item?.id!=='string'||!item.id||ids.has(item.id))
    throw Error('Invalid or duplicate canonical '+domain+' ID');
   ids.add(item.id);
  }
  const sandboxIds=[];
  for(const item of existing[array]){
   if(typeof item?.id!=='string'||!item.id||ids.has(item.id))
    throw Error('Sandbox '+domain+' ID collision: '+item?.id);
   ids.add(item.id);
   sandboxIds.push(item.id);
  }
  combined[domain]={schemaVersion:2,[array]:[
   ...baseline[array],...existing[array],
  ]};
  summary[domain]={canonical:baseline[array].length,
   sandboxPreserved:existing[array].length,
   combined:ids.size,
   // Retain an explicit synthetic-source identity ledger for eventual cleanup.
   sandboxIds};
 }
 return Object.freeze({data:combined,summary});
}
