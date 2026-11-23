/**
 * O03 — read-only current-content V3 cache reader.
 * No network, provider access, legacy release content or cache mutation.
 * Opening a generation independently re-verifies O02 records and R2 bytes.
 */
import {readVerifiedD6OfflineContent}
 from './d6-offline-content-preparation.mjs';
import {validateRecords,validateLibraryPaths} from './validation.mjs';
import {verifyD6OriginalIds} from './d6-original-id-ledger.mjs';
import {DOMAIN} from './shared.mjs';
import {parseMarkdown} from './markdown.mjs';

const unavailable=()=>Object.assign(
 new Error('The current offline content library is unavailable. Connect online and update the offline library.'),
 {code:'D6_V3_OFFLINE_CONTENT_UNAVAILABLE'});

export async function readD6OfflineContent({
 caches=globalThis.caches,scope,
}={}){
 let verified;
 try{verified=await readVerifiedD6OfflineContent({caches,scope});}
 catch{throw unavailable();}
 if(!verified)throw unavailable();
 const {snapshot}=verified,images=new Map(),markdown=new Map(),data={};
 for(const [domain,config] of Object.entries(DOMAIN)){
  const items=snapshot.records.filter(row=>row.domain===domain);
  const records=items.map(row=>row.record);
  if(!verifyD6OriginalIds(domain,records))throw unavailable();
  data[domain]={schemaVersion:2,[config.array]:records};
  for(const row of items){
   const key=row.record[domain==='kb'?'content':'notes'];
   if(key){
    if(markdown.has(key)&&markdown.get(key)!==row.markdown)
     throw unavailable();
    markdown.set(key,row.markdown);
   }else if(row.markdown)throw unavailable();
  }
 }
 let maps,routes;
 try{maps=validateRecords(data);routes=validateLibraryPaths(data);}
 catch{throw unavailable();}
 for(const image of snapshot.images){
  if(images.has(image.logicalPath))throw unavailable();
  images.set(image.logicalPath,image);
 }
 // A damaged or incomplete snapshot must never silently omit a visible
 // Cover, Knot sequence frame or Notes image while reporting offline ready.
 const exists=new Set([...images.keys(),...markdown.keys()]);
 for(const row of snapshot.records){
  const pic=row.record.picture?.src;
  if(pic&&!images.has(pic))throw unavailable();
  for(const path of row.record.pictureSequence??[])
   if(!images.has(path))throw unavailable();
  const owner=row.record[row.domain==='kb'?'content':'notes'];
  if(row.markdown){
   try{parseMarkdown(row.markdown,{
    owner,maps,pathRoutes:routes,exists,
    assetBase:scope,allowMissingImages:false,
   });}catch{throw unavailable();}
  }
 }
 const base=new URL(scope);
 const image=path=>{
  const ref=images.get(path);
  return ref?new URL('__fishing_v3_content_image__/'+ref.sha256,base).href:null;
 };
 return Object.freeze({
  source:'v3-content',contentId:verified.contentId,
  data,markdown,images,image,thumbnail:image,
 });
}
