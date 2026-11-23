/**
 * O01 — source-only, coherent current-content snapshot for V3.
 *
 * This module is deliberately NOT imported by the private Worker, routed,
 * scheduled or used by the current service worker. O02 will validate actual
 * private R2 bytes and stage complete cache generations before selection.
 *
 * A single read-only D1.batch provides one transactionally consistent view
 * of mutable content and the media registry. Historical/unlinked R2 objects
 * and media associations are retained in storage, but never advertised as
 * currently readable content.
 */
import MarkdownIt from 'markdown-it';
import {canonical,safePath,sha256} from '../src/shared.mjs';
import {validateRecords,validateLibraryPaths}
 from '../src/validation.mjs';
import {verifyD6OriginalIds} from '../src/d6-original-id-ledger.mjs';
import {resolveMarkdownTarget} from '../src/markdown.mjs';
import {d6ReadableMediaRole,d6HistoricalMime}
 from '../src/d6-historical-media-link.mjs';

const md = new MarkdownIt({html:false,linkify:false,typographer:false});
const SPECS = Object.freeze([
 {domain:'gear',table:'d6_gear_records',text:'notes_text',bundle:'items',path:'notes'},
 {domain:'kb',table:'d6_kb_records',text:'content_text',bundle:'entities',path:'content'},
 {domain:'catches',table:'d6_catch_records',text:'notes_text',bundle:'catches',path:'notes'},
]);
const SHA = /^[a-f0-9]{64}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIME = new Set(['image/jpeg','image/png','image/webp','image/gif']);
const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
const UTF8 = new TextEncoder();
const fail = why => {throw Error('O01_SNAPSHOT_UNVERIFIED: '+why);};
const ownerKey = (domain,id) => domain+'/'+id;
const refKey = (domain,id,path) => JSON.stringify([domain,id,path]);
const byteLength = text => UTF8.encode(text).byteLength;
const ordered = (a,b) => a < b ? -1 : a > b ? 1 : 0;
export const D6_CONTENT_READER_VERSION=1;
export function isD6CurrentContentSnapshotCompatible(snapshot,
 readerVersion=D6_CONTENT_READER_VERSION){
 const range=snapshot?.readerCompatibility,schemas=snapshot?.schemaVersions;
 return snapshot?.format==='fishing-content-snapshot-v1'&&
  Number.isSafeInteger(readerVersion)&&readerVersion>0&&
  Number.isSafeInteger(range?.min)&&Number.isSafeInteger(range?.max)&&
  range.min<=readerVersion&&readerVersion<=range.max&&
  schemas?.gear===2&&schemas?.kb===2&&schemas?.catches===2;
}

function imagePaths(text,owner,maps,pathRoutes){
 if(!text)return [];
 if(!owner)return fail('Markdown has no owning path');
 const found=new Set(),stack=md.parse(text,{}).slice();
 while(stack.length){
  const token=stack.pop();
  if(token.children)stack.push(...token.children);
  if(token.type!=='image'&&token.type!=='link_open')continue;
  const image=token.type==='image';
  if(image&&!token.content?.trim())fail('Image missing alternative text');
  const value=token.attrGet(image?'src':'href');
  if(typeof value!=='string'||image&&/[?#]/.test(value))
   fail(image?'Unsafe Markdown image URL':'Invalid Markdown link');
  let resolved;
  try{resolved=resolveMarkdownTarget(value,{owner,maps,pathRoutes,
   assetBase:'https://example.invalid/fishing/'});}
  catch{fail(image?'Unsafe Markdown image URL':'Invalid Markdown link');}
  if(!image){
   // Every local link must resolve to a current record route; a stale file
   // link cannot be advertised as usable in the independently cached graph.
   if(resolved.kind==='local')fail('Unresolved Markdown link resource');
   continue;
  }
  if(resolved.kind!=='local'||!d6HistoricalMime(resolved.local))
   fail('Nonlocal or unsupported Markdown image');
  found.add(resolved.local);
 }
 return [...found];
}

function readRows(batches,index){
 const batch=batches[index];
 if(!batch||batch.success===false||!Array.isArray(batch.results))
  fail('D1 batch read failed at index '+index);
 return batch.results;
}

/**
 * Metadata is read from ONE D1 batch, not independent GET requests that can
 * mix two successful owner Saves. No R2 or provider writes are performed.
 * The resulting snapshot identity never includes a software release SHA.
 */
export async function createD6CurrentContentSnapshot({CONTENT_DB}={}){
 if(typeof CONTENT_DB?.prepare!=='function'||
    typeof CONTENT_DB?.batch!=='function')
  fail('D1 read-only batch unavailable');
 const statements = [
  ...SPECS.map(spec => CONTENT_DB.prepare(
   'SELECT id,revision,record_json,'+spec.text+
   ' AS markdown FROM '+spec.table+' ORDER BY id'
  )),
  CONTENT_DB.prepare(
   'SELECT logical_path,domain,record_id,sha256,historical FROM d6_media_refs ORDER BY logical_path,domain,record_id'
  ),
  CONTENT_DB.prepare(
   'SELECT sha256,storage_key,mime,bytes FROM d6_media_objects ORDER BY sha256'
  ),
 ];
 let batches;
 try{batches=await CONTENT_DB.batch(statements);}
 catch{fail('Consistent D1 transaction unavailable');}
 if(!Array.isArray(batches)||batches.length!==statements.length)
  fail('Incomplete D1 transaction');

 const records=[],data={},ownerRows=new Map();
 for(let i=0;i<SPECS.length;i++){
  const spec=SPECS[i],rows=readRows(batches,i),items=[],ids=new Set();
  if(rows.length>10000)fail('Catalog exceeds bounded snapshot');
  for(const row of rows){
   if(!row||typeof row.id!=='string'||row.id.length>160||
      !ID.test(row.id)||ids.has(row.id)||
      !Number.isSafeInteger(row.revision)||row.revision<1||
      typeof row.record_json!=='string'||
      typeof row.markdown!=='string'||byteLength(row.markdown)>128*1024)
    fail('Invalid D1 '+spec.domain+' row');
   let record;
   try{record=JSON.parse(row.record_json);}
   catch{fail('Invalid D1 record JSON');}
   if(!record||record.id!==row.id)fail('Record ID mismatch');
   if(row.markdown.trim()&&!record[spec.path])
    fail('Markdown has no owning path');
   const source=canonical(record);
   const entry={domain:spec.domain,id:row.id,revision:row.revision,
    record,recordBytes:byteLength(source),recordSha256:await sha256(source),
    markdown:row.markdown,markdownBytes:byteLength(row.markdown),
    markdownSha256:await sha256(row.markdown)};
   records.push(entry);items.push(record);ids.add(row.id);
   ownerRows.set(ownerKey(spec.domain,row.id),entry);
  }
  if(!verifyD6OriginalIds(spec.domain,items))
   fail('Original '+spec.domain+' identities missing');
  data[spec.domain]={schemaVersion:2,[spec.bundle]:items};
 }
 let maps,pathRoutes;
 try{maps=validateRecords(data);pathRoutes=validateLibraryPaths(data);}
 catch{fail('Invalid cross-domain content graph');}

 const objectRows=readRows(batches,4),objects=new Map();
 if(objectRows.length>10000)fail('Media objects exceed bounded snapshot');
 for(const row of objectRows){
  if(!row||typeof row.sha256!=='string'||!SHA.test(row.sha256)||
     row.storage_key!=='staged/v1/sha256/'+row.sha256||
     !MIME.has(row.mime)||!Number.isSafeInteger(row.bytes)||
     row.bytes<1||row.bytes>MAX_MEDIA_BYTES||
     objects.has(row.sha256))fail('Invalid media object metadata');
  objects.set(row.sha256,row);
 }
 const associationRows=readRows(batches,3),refs=new Map();
 const pathsToSHA=new Map();
 if(associationRows.length>20000)fail('Media refs exceed bounded snapshot');
 for(const row of associationRows){
  let path;
  try{path=safePath(row?.logical_path);}
  catch{fail('Invalid media logical path');}
  if(!row||!['gear','kb','catches'].includes(row.domain)||
     typeof row.record_id!=='string'||row.record_id.length>160||
     !ID.test(row.record_id)||!ownerRows.has(ownerKey(row.domain,row.record_id))||
     typeof row.sha256!=='string'||!SHA.test(row.sha256)||
     ![0,1].includes(row.historical)||
     !objects.has(row.sha256)||
     d6HistoricalMime(path)!==objects.get(row.sha256).mime)
   fail('Invalid D1 media association');
  const key=refKey(row.domain,row.record_id,path);
  if(refs.has(key))fail('Duplicate media association');
  if(pathsToSHA.has(path)&&pathsToSHA.get(path)!==row.sha256)
   fail('Conflicting bytes for shared media path');
  pathsToSHA.set(path,row.sha256);
  refs.set(key,row);
 }

 const linked=new Map(),usedRefs=new Set();
 for(const entry of records){
  const pathField=entry.domain==='kb'?'content':'notes';
  const owner=entry.record[pathField];
  const wanted=new Set();
  if(entry.record.picture?.src)wanted.add(entry.record.picture.src);
  for(const path of entry.record.pictureSequence||[])wanted.add(path);
  for(const path of imagePaths(entry.markdown,owner,maps,pathRoutes))
   wanted.add(path);
  for(const raw of wanted){
   let path;
   try{path=safePath(raw);}catch{fail('Invalid linked image path');}
   const key=refKey(entry.domain,entry.id,path),association=refs.get(key);
   if(!association)fail('Missing D1 association for linked image');
   const role=d6ReadableMediaRole({domain:entry.domain,
    record:entry.record,logicalPath:path,markdown:entry.markdown,
    allowLegacy:association.historical===1});
   if(!role)fail('Linked image has no verified owner role');
   const object=objects.get(association.sha256);
   if(!linked.has(path))linked.set(path,{
    logicalPath:path,sha256:association.sha256,bytes:object.bytes,
    mime:object.mime,storageKey:object.storage_key,owners:[]});
   const media=linked.get(path);
   if(media.sha256!==association.sha256)
    fail('Shared image points to mixed bytes');
   media.owners.push({domain:entry.domain,recordId:entry.id,role});
   usedRefs.add(key);
  }
 }
 for(const [key,ref] of refs)if(!usedRefs.has(key)&&ref.historical===0)
  fail('Unlinked current media association');
 const images=[...linked.values()].sort((a,b)=>ordered(a.logicalPath,b.logicalPath));
 for(const item of images)item.owners.sort((a,b)=>
  ordered(ownerKey(a.domain,a.recordId),ownerKey(b.domain,b.recordId)));
 const uniqueObjects=new Map(images.map(item=>[item.sha256,item.bytes]));
 const mediaBytes=[...uniqueObjects.values()].reduce((total,size)=>total+size,0);
 const markdownBytes=records.reduce((n,row)=>n+row.markdownBytes,0);
 const recordBytes=records.reduce((n,row)=>n+row.recordBytes,0);
 if(!Number.isSafeInteger(mediaBytes)||!Number.isSafeInteger(markdownBytes)||
    !Number.isSafeInteger(recordBytes))
  fail('Snapshot byte-count overflow');
 const payload={
  format:'fishing-content-snapshot-v1',
  readerCompatibility:{min:1,max:1},
  schemaVersions:{gear:2,kb:2,catches:2},
  counts:{gear:data.gear.items.length,kb:data.kb.entities.length,
   catches:data.catches.catches.length,imagePaths:images.length,
   imageObjects:uniqueObjects.size,retainedUnlinkedRefs:refs.size-usedRefs.size},
  bytes:{records:recordBytes,markdown:markdownBytes,images:mediaBytes},
  records,images,
 };
 return Object.freeze({
  contentId:await sha256(canonical(payload)),
  ...payload,
  // D1 registry SHA/size declarations are not R2 byte verification. O02
  // must fetch and hash each referenced original before selecting a cache.
  mediaVerification:'registry-only',
 });
}
