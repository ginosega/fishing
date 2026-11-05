/**
 * D5 authenticated owner: two independently authorized content sources in a
 * single *reading* view. This never combines GitHub publishing bases.
 * The immutable release stays read-only; only verified sandbox data can be
 * used by editor and publisher code.
 */
import {DOMAIN} from './shared.mjs';
const INDICES=new Set(['Gear/gear.json','KB/kb.json','Catches/catches.json']);
const folded=value=>value.normalize('NFC').toLowerCase();

export function composeD5OwnerOverlay({
 canonical,sandbox,canonicalFiles,sandboxFiles,
}={}){
 if(!canonical||!sandbox||
  !(canonicalFiles instanceof Set)||
  !(sandboxFiles instanceof Set))
  throw Error('D5 owner content provenance unavailable');
 const byCanonical={},bySandbox={},data={};
 for(const [domain,{array}] of Object.entries(DOMAIN)){
  const original=canonical[domain],privateSet=sandbox[domain];
  if(original?.schemaVersion!==2||privateSet?.schemaVersion!==2||
   !Array.isArray(original[array])||!Array.isArray(privateSet[array]))
    throw Error('D5 owner domain schema mismatch: '+domain);
  const realIds=new Set(),privateIds=new Set();
  for(const item of original[array]){
   if(typeof item?.id!=='string'||!item.id||realIds.has(item.id))
    throw Error('D5 duplicate real-library record: '+domain);
   realIds.add(item.id);
  }
  for(const item of privateSet[array]){
   if(typeof item?.id!=='string'||!item.id||
    privateIds.has(item.id)||realIds.has(item.id))
    throw Error('D5 sandbox ID collision: '+domain);
   privateIds.add(item.id);
  }
  byCanonical[domain]=realIds;
  bySandbox[domain]=privateIds;
  data[domain]={schemaVersion:2,[array]:[
   ...original[array],...privateSet[array],
  ]};
 }
 const seen=new Map();
 for(const file of canonicalFiles){
  if(typeof file!=='string'||!file)throw Error('Invalid real-library asset');
  const key=folded(file);
  if(seen.has(key))throw Error('Real-library path collision: '+file);
  seen.set(key,file);
 }
 for(const file of sandboxFiles){
  if(typeof file!=='string'||!file)throw Error('Invalid sandbox asset');
  const key=folded(file),overlap=seen.get(key);
  if(overlap&&(!INDICES.has(file)||overlap!==file))
   throw Error('D5 content path collision: '+file);
 }
 return Object.freeze({
  data,canonicalIds:byCanonical,sandboxIds:bySandbox,
  canonicalFiles,
  isSandbox:(domain,id)=>bySandbox[domain]?.has(id)===true,
  isCanonical:(domain,id)=>byCanonical[domain]?.has(id)===true,
  mayPublish:pkg=>{
   if(!pkg||!Object.hasOwn(bySandbox,pkg.domain)||
    typeof pkg.id!=='string'||typeof pkg.base?.sourceRevision!=='string')
    return false;
   if(pkg.operation==='edit')return bySandbox[pkg.domain].has(pkg.id);
   if(pkg.operation==='add')return !byCanonical[pkg.domain].has(pkg.id)&&
    !bySandbox[pkg.domain].has(pkg.id);
   return false;
  },
 });
}
