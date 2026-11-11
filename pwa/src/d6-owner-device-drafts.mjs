/**
 * WP1 D6 owner-only local device drafts. Opt-in only after the verified owner
 * editor preview gate; never part of public V2 or anonymous D6 reading.
 * It stores structured editor fields and Markdown, NOT media bytes, upload
 * tickets, CSRF tokens, operations, credentials or a publishing outbox.
 */
import {D6_READER_BASE,D6_READER_ORIGIN} from './d6-public-reader.mjs';
const SHA=/^[a-f0-9]{40}$/;
const HASH=/^[a-f0-9]{64}$/;
const KEY=/^(gear|kb|catches):(edit:[a-z0-9-]+|add:[a-z0-9-]+)$/;
const MAX_BYTES=192*1024;
const OWNER_SCOPE=D6_READER_BASE;
const DOMAIN_FIELDS={
 gear:new Set(['id','name','category','type','description','manufacturer','model',
  'specifications','links','picture','pictureSequence','notes']),
 kb:new Set(['id','name','type','description','content','picture','pictureSequence',
  'links','category','manufacturer','model','specifications']),
 catches:new Set(['id','date','time','size','speciesId','speciesName','locationId',
  'locationName','lureOrBaitId','lureOrBaitName','notes']),
};
const clone=x=>JSON.parse(JSON.stringify(x));
const validRecord=(domain,record)=>record&&typeof record==='object'&&!Array.isArray(record)&&
 Object.keys(record).every(x=>DOMAIN_FIELDS[domain]?.has(x));
function normalized(row){
 if(!row||row.version!==1||!KEY.test(row.key??'')||
  !['gear','kb','catches'].includes(row.domain)||
  !row.key.startsWith(row.domain+':')||
  !SHA.test(row.sourceRevision??'')||
  !(row.baseHash===null||HASH.test(row.baseHash??''))||
  !validRecord(row.domain,row.record)||typeof row.notes!=='string'||
  typeof row.requiresMedia!=='boolean'||typeof row.updatedAt!=='number')
  throw Error('INVALID_DEVICE_DRAFT');
 const safe={version:1,key:row.key,domain:row.domain,
  sourceRevision:row.sourceRevision,baseHash:row.baseHash,
  record:clone(row.record),notes:row.notes,
  requiresMedia:row.requiresMedia,updatedAt:row.updatedAt};
 if(new TextEncoder().encode(JSON.stringify(safe)).length>MAX_BYTES)
  throw Error('DEVICE_DRAFT_TOO_LARGE');
 return safe;
}
function indexedDbIO(indexedDB){
 if(!indexedDB?.open)throw Error('DEVICE_DRAFT_STORAGE_UNAVAILABLE');
 const connection=new Promise((resolve,reject)=>{
  let request;
  try{request=indexedDB.open('fishing-v3-d6-owner-drafts-v1',1);}
  catch{reject(Error('DEVICE_DRAFT_STORAGE_UNAVAILABLE'));return;}
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('drafts'))
    request.result.createObjectStore('drafts',{keyPath:'key'});};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(Error('DEVICE_DRAFT_STORAGE_UNAVAILABLE'));
  request.onblocked=()=>reject(Error('DEVICE_DRAFT_STORAGE_UNAVAILABLE'));
 });
 async function run(mode,execute){
  const db=await connection;
  return new Promise((resolve,reject)=>{
   let value,tx;
   try{
    tx=db.transaction('drafts',mode);
    const request=execute(tx.objectStore('drafts'));
    request.onsuccess=()=>{value=request.result;};
    request.onerror=()=>reject(Error('DEVICE_DRAFT_STORAGE_UNAVAILABLE'));
    tx.oncomplete=()=>resolve(value);
    tx.onabort=()=>reject(Error('DEVICE_DRAFT_STORAGE_UNAVAILABLE'));
    tx.onerror=()=>reject(Error('DEVICE_DRAFT_STORAGE_UNAVAILABLE'));
   }catch{reject(Error('DEVICE_DRAFT_STORAGE_UNAVAILABLE'));}
  });
 }
 return {get:key=>run('readonly',s=>s.get(key)),
  put:row=>run('readwrite',s=>s.put(row)),
  delete:key=>run('readwrite',s=>s.delete(key))};
}
export function createD6OwnerDeviceDraftStore({
 enabled=false,root,io=null,indexedDB=globalThis.indexedDB,
}={}){
 if(enabled!==true)return null;
 let url;
 try{url=new URL(root);}catch{throw Error('DEVICE_DRAFT_SCOPE_DENIED');}
 const loopback=url.protocol==='http:'&&
  ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if((url.origin!==D6_READER_ORIGIN&&!loopback)||
  url.pathname!==OWNER_SCOPE||url.search||url.hash||
  url.username||url.password)
  throw Error('DEVICE_DRAFT_SCOPE_DENIED');
 // A separate IndexedDB object store, not a Service Worker or release cache.
 // Storage denial must never prevent ordinary online owner editing.
 let backend=io;
 if(!backend){
  try{backend=indexedDbIO(indexedDB);}
  catch{
   const unavailable=async()=>{throw Error('DEVICE_DRAFT_STORAGE_UNAVAILABLE');};
   backend={get:unavailable,put:unavailable,delete:unavailable};
  }
 }
 const scoped=key=>url.origin+OWNER_SCOPE+key;
 const queues=new Map();
 const enqueue=(key,operation)=>{
  const previous=queues.get(key)??Promise.resolve();
  const next=previous.catch(()=>{}).then(operation);
  queues.set(key,next);
  void next.finally(()=>{if(queues.get(key)===next)queues.delete(key);}).catch(()=>{});
  return next;
 };
 const checkKey=key=>{if(!KEY.test(key??''))throw Error('INVALID_DEVICE_DRAFT_KEY');};
 return Object.freeze({
  async read(key,{sourceRevision,baseHash=null}={}){
   checkKey(key);
   let row;
   try{await queues.get(key)?.catch(()=>{});row=await backend.get(scoped(key));}
   catch{return {status:'unavailable'};}
   if(row===undefined||row===null)return {status:'missing'};
   try{
    // Only this exact isolated app prefix may recover these records.
    if(row.key!==scoped(key))return {status:'corrupt'};
    const draft=normalized({...row,key});
    if(draft.sourceRevision!==sourceRevision||draft.baseHash!==baseHash)
     return {status:'stale'};
    return {status:'ready',draft};
   }catch{return {status:'corrupt'};}
  },
  async save({key,domain,sourceRevision,baseHash=null,record,notes,
   requiresMedia=false}={}){
   checkKey(key);
   const draft=normalized({version:1,key,domain,sourceRevision,
    baseHash,record,notes,requiresMedia,updatedAt:Date.now()});
   return enqueue(key,async()=>{
    try{await backend.put({...draft,key:scoped(key)});return true;}
    catch{throw Error('DEVICE_DRAFT_STORAGE_UNAVAILABLE');}
   });
  },
  async discard(key){
   checkKey(key);
   return enqueue(key,async()=>{
    try{await backend.delete(scoped(key));return true;}
    catch{throw Error('DEVICE_DRAFT_STORAGE_UNAVAILABLE');}
   });
  },
 });
}
