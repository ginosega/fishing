/**
 * FISH-TODO-118 — source-only, NOT ROUTED shared media publication + read.
 *
 * Private staged R2 bytes become readable only after one revision-guarded
 * D1.batch transaction commits both the content record and media metadata.
 * Existing frozen Worker-asset paths remain untouched. Uploads are OFF and
 * no Worker import/config binding is provided in this milestone.
 */
import Ajv2020 from 'ajv/dist/2020.js';
import schema from '../contracts/schema.json' with {type:'json'};
import {ID_PATTERN,encodedPath,safePath} from '../src/shared.mjs';
import {isD6NotesImageLinked} from '../src/d6-notes-image-link.mjs';
export {isD6NotesImageLinked} from '../src/d6-notes-image-link.mjs';
import {saveD6ContentRevision} from './d6-content-save-transaction.mjs';
import {d6ReadableMediaRole,d6HistoricalMime}
 from '../src/d6-historical-media-link.mjs';

import {validateD6MediaPath,D6_MEDIA_LIMIT_BYTES}
 from './d6-shared-media-stage.mjs';
import {publishedD6MediaRole,d6ValidKnotSequence}
 from '../src/d6-content-media-contract.mjs';
import {createD2UnifiedOwnerSession}
 from '../../experiments/p3/preview/src/d2-unified-owner-session.mjs';

const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA=/^[a-f0-9]{64}$/;
const MIME=new Set(['image/jpeg','image/png','image/webp','image/gif']);
const ORIGIN_PATH='/api/v3/media/';
const READ_PREFIX=ORIGIN_PATH+'live/';
const THUMB_PREFIX=ORIGIN_PATH+'thumb/';
const MAX_BODY=192*1024,MAX_NOTES=128*1024;
const DOMAINS=Object.freeze({
 gear:{table:'d6_gear_records',field:'notes_text',fieldInRecord:'notes',
  jsField:'notes',csrfIntent:'save-gear',schema:'gearItem'},
 kb:{table:'d6_kb_records',field:'content_text',fieldInRecord:'content',
  jsField:'markdown',csrfIntent:'save-kb',schema:'kbEntity'},
 catches:{table:'d6_catch_records',field:'notes_text',fieldInRecord:'notes',
  jsField:'notes',csrfIntent:'save-catch',schema:'catch'},
});
const ajv=new Ajv2020({strict:true});
const validators=Object.fromEntries(Object.entries(DOMAINS).map(([key,item])=>
 [key,ajv.compile({$ref:'#/$defs/'+item.schema,$defs:schema.$defs})]));
const jsonHeaders={
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer','Vary':'Cookie',
};
const response=(status,body)=>new Response(JSON.stringify(body),{
 status,headers:jsonHeaders,
});
const fail=(status,code)=>response(status,{ok:false,error:code});
const bytes=t=>new TextEncoder().encode(t).length;
const entryKey=sha=>'staged/v1/sha256/'+sha;
const idValid=id=>typeof id==='string'&&id.length<=160&&ID.test(id);
const acceptedDomain=domain=>Object.hasOwn(DOMAINS,domain);
const selectSql=d=>`SELECT id,revision,record_json,${d.field} FROM ${d.table} WHERE id=?`;

function decodeLivePath(pathname,prefix=READ_PREFIX){
 if(!pathname.startsWith(prefix))return null;
 const encoded=pathname.slice(prefix.length);
 if(!encoded||encoded.includes('//'))return null;
 try{
  const local=encoded.split('/').map(decodeURIComponent).join('/');
  if(safePath(local)!==local||encodedPath(local)!==encoded)return null;
  return local;
 }catch{return null;}
}
function storedObjectOK(row,sha,bytesCount,mime){
 if(!row||row.key!==entryKey(sha)||row.size!==bytesCount||
    row.customMetadata?.sha256!==sha||
    row.httpMetadata?.contentType!==mime)return false;
 if(row.checksums?.sha256){
  const actual=[...new Uint8Array(row.checksums.sha256)]
   .map(n=>n.toString(16).padStart(2,'0')).join('');
  if(actual!==sha)return false;
 }
 return true;
}
async function validateStagedObjects(R2,domain,record,markdown,media){
 if(!Array.isArray(media)||media.length>32)
  throw Error('MEDIA_MANIFEST_INVALID');
 const seen=new Set(),validated=[];
 for(const item of media){
  if(!item||typeof item!=='object'||Array.isArray(item)||
     Object.keys(item).sort().join(',')!=='bytes,contentType,logicalPath,sha256'||
     !SHA.test(item.sha256??'')||
     !Number.isSafeInteger(item.bytes)||item.bytes<1||
     item.bytes>D6_MEDIA_LIMIT_BYTES||!MIME.has(item.contentType))
   throw Error('MEDIA_MANIFEST_INVALID');
  const role=publishedD6MediaRole({domain,record,
   logicalPath:item.logicalPath,
   notesLinked:isD6NotesImageLinked(markdown,item.logicalPath)});
  if(!role)throw Error('MEDIA_REFERENCE_INVALID');
  const path=validateD6MediaPath({domain,record,
   logicalPath:item.logicalPath,role});
  if(path.mime!==item.contentType||seen.has(path.logicalPath))
   throw Error('MEDIA_REFERENCE_INVALID');
  seen.add(path.logicalPath);
  const head=await R2.head(entryKey(item.sha256));
  if(!storedObjectOK(head,item.sha256,item.bytes,item.contentType))
   throw Error('MEDIA_NOT_STAGED');
  validated.push({logicalPath:path.logicalPath,
   sha256:item.sha256,bytes:item.bytes,mime:item.contentType,
   storageKey:entryKey(item.sha256),role});
 }
 if(validated.some(x=>x.role==='knot-step')){
  // All ordered Knot frames publish in one D1 transaction, never a subset.
  if(domain!=='kb'||!d6ValidKnotSequence(record)||
     !record.pictureSequence.every(p=>validated.some(x=>
      x.role==='knot-step'&&x.logicalPath===p))||
     validated.filter(x=>x.role==='knot-step').length!==
      record.pictureSequence.length)
   throw Error('KNOT_SEQUENCE_INCOMPLETE');
 }
 return validated;
}
async function validateCatchLinks(db,record){
 for(const [field,table,type] of [
  ['speciesId','d6_kb_records','species'],
  ['locationId','d6_kb_records','location'],
  ['lureOrBaitId','d6_gear_records','lure'],
 ]){
  if(!record[field])continue;
  const row=await db.prepare('SELECT record_json FROM '+table+' WHERE id=?')
   .bind(record[field]).first();
  let linked;
  try{linked=JSON.parse(row.record_json);}catch{return false;}
  if(linked?.id!==record[field]||
     (type==='lure'? !['lures','bait'].includes(linked.category):
      linked.type!==type))return false;
 }
 for(const [idField,nameField] of [
  ['speciesId','speciesName'],['locationId','locationName'],
  ['lureOrBaitId','lureOrBaitName'],
 ])if(record[idField]&&record[nameField])return false;
 return true;
}
function validRecord(domain,record,markdown,expectedRevision){
 if(!acceptedDomain(domain)||!idValid(record?.id)||
    !validators[domain](record)||typeof markdown!=='string'||
    bytes(markdown)>MAX_NOTES||!Number.isSafeInteger(expectedRevision)||
    expectedRevision<0)return false;
 const path=record[DOMAINS[domain].fieldInRecord];
 if(domain==='kb')return typeof path==='string'&&
  Boolean(path.trim())&&Boolean(markdown.trim());
 if(domain==='catches')return Boolean(path)===Boolean(markdown.trim())&&
  (!path||path==='Catches/content/'+record.id+'.md');
 // Gear Notes may be empty after deleting all embedded pictures.
 return (!markdown.trim()||typeof path==='string'&&Boolean(path.trim()))&&
  (path===undefined||typeof path==='string'&&Boolean(path.trim()));
}
/**
 * Called only from the source-only owner-authorized HTTP wrapper below.
 * Uses a single D1.batch transaction. Never performs an R2 write here.
 */
export async function publishD6MediaRevision({
 CONTENT_DB,R2,domain,record,markdown,expectedRevision,media,
 now=()=>Math.floor(Date.now()/1000),
}={}){
 if(!validRecord(domain,record,markdown,expectedRevision)||
    !CONTENT_DB?.prepare||typeof CONTENT_DB.batch!=='function'||
    typeof R2?.head!=='function'||typeof now!=='function')
  return {status:400,error:'INVALID_MEDIA_EDIT'};
 // C01 insert-only Add is supported for Gear and KB as well as Catches.
 // The shared D1 transaction core independently guards revision 0.
 const d=DOMAINS[domain],isNew=expectedRevision===0;
 try{
  if(domain==='catches'&&!(await validateCatchLinks(CONTENT_DB,record)))
   return {status:400,error:'INVALID_REFERENCE'};
  const staged=await validateStagedObjects(R2,domain,record,markdown,media);
  // The current record's D1 image references are authoritative. Remove only
  // paths that the revised record/Markdown no longer links; R2 bytes remain.
  const existing=await CONTENT_DB.prepare(
   'SELECT logical_path,historical FROM d6_media_refs WHERE domain=? AND record_id=?'
  ).bind(domain,record.id).all();
  if(!Array.isArray(existing?.results)||existing.results.length>10000||
     existing.results.some(x=>typeof x.logical_path!=='string'||
      ![0,1].includes(x.historical)))
   return {status:503,error:'MEDIA_REGISTRY_UNVERIFIED'};
  // M01 imported references have their own verified historical path rules.
  // A V3 text edit must not silently retire unchanged original Catch Notes,
  // old Knot frames, or shared KB→Gear pictures simply because they predate
  // the V3 upload-folder convention. New V3 refs remain strictly validated.
  const retiredPaths=existing.results.filter(x=>
   !d6ReadableMediaRole({domain,record,logicalPath:x.logical_path,
    markdown,allowLegacy:x.historical===1})).map(x=>x.logical_path);
  const current=await CONTENT_DB.prepare(selectSql(d)).bind(record.id).first();
  if(isNew?Boolean(current):!current||current.revision!==expectedRevision)
   return {status:409,error:'RECORD_CHANGED'};
  if(current&&current.record_json){
   let previous;
   try{previous=JSON.parse(current.record_json);}
   catch{return {status:503,error:'RECORD_UNVERIFIED'};}
   if(previous.id!==record.id||
      (domain==='catches'&&previous.notes&&!record.notes))
    return {status:400,error:'INVALID_MEDIA_EDIT'};
  }
  const saved=await saveD6ContentRevision({
   CONTENT_DB,domain,record,markdown,expectedRevision,media:staged,
   retiredPaths,syncMedia:true,now,
  });
  if(saved.status!==200)return {
   status:saved.status,
   error:saved.status===409?'RECORD_CHANGED':'MEDIA_PUBLISH_UNVERIFIED',
  };
  return {status:200,
   result:{record,revision:saved.revision,
    [d.jsField]:markdown,media:staged.map(asset=>({
     logicalPath:asset.logicalPath,role:asset.role,sha256:asset.sha256,
     bytes:asset.bytes,contentType:asset.mime,
    })),published:true}};
 }catch{
  return {status:503,error:'MEDIA_PUBLISH_UNVERIFIED'};
 }
}
export function createD6SharedMediaLive({
 AUTH_DB,CONTENT_DB,R2,IMAGES,csrfKey,origin,enabled=()=>false,
 thumbnailEnabled=()=>false,now=()=>Math.floor(Date.now()/1000),
}={}){
 if(typeof origin!=='string'||!origin.startsWith('https://')||
    new URL(origin).origin!==origin||
    typeof enabled!=='function'||typeof thumbnailEnabled!=='function'||
    typeof now!=='function')
  throw Error('Invalid live media configuration');
 const ready=()=>enabled()===true&&
  typeof AUTH_DB?.prepare==='function'&&
  typeof CONTENT_DB?.prepare==='function'&&
  typeof CONTENT_DB?.batch==='function'&&
  typeof R2?.head==='function'&&typeof R2?.get==='function'&&
  typeof csrfKey==='string'&&bytes(csrfKey)>=32;
 async function handle(request){
  if(!(request instanceof Request))return fail(404,'NOT_FOUND');
  let url;
  try{url=new URL(request.url);}
  catch{return fail(404,'NOT_FOUND');}
  if(url.origin!==origin||url.search||url.hash||url.username||
     url.password||request.headers.has('Authorization')||
     !url.pathname.startsWith(ORIGIN_PATH))
   return fail(404,'NOT_FOUND');
  if(!ready())return fail(503,'MEDIA_NOT_ENABLED');
  if(url.pathname===ORIGIN_PATH+'manifest'){
   if(request.method!=='GET')return fail(405,'METHOD_NOT_ALLOWED');
   // One existing owner-session gate; no second account or media service.
   try{
    const auth=createD2UnifiedOwnerSession({
     AUTH_DB,ownerGitHubId:265665562,origin,csrfKey,now,
    });
    await auth.authorizeStatus(request);
   }catch{return fail(403,'MEDIA_NOT_AUTHORIZED');}
   try{
    // Join current D1 records and published references in one read.
    // Stage-only R2 objects have no D1 reference and cannot enter the list.
    const query=await CONTENT_DB.prepare(`
     SELECT r.logical_path,r.domain,r.record_id,r.sha256,r.historical,
      o.storage_key,o.mime,o.bytes,
      COALESCE(g.record_json,k.record_json,c.record_json) AS record_json,
      CASE r.domain WHEN 'gear' THEN g.notes_text
       WHEN 'kb' THEN k.content_text ELSE c.notes_text END AS markdown
     FROM d6_media_refs r
     LEFT JOIN d6_media_objects o ON o.sha256=r.sha256
     LEFT JOIN d6_gear_records g
      ON r.domain='gear' AND g.id=r.record_id
     LEFT JOIN d6_kb_records k
      ON r.domain='kb' AND k.id=r.record_id
     LEFT JOIN d6_catch_records c
      ON r.domain='catches' AND c.id=r.record_id
     ORDER BY r.logical_path
    `).bind().all();
    if(!Array.isArray(query?.results)||query.results.length>10000)
     return fail(503,'MEDIA_REGISTRY_UNVERIFIED');
    const paths=new Set();
    for(const row of query.results){
     const d=DOMAINS[row.domain];
     if(!d||!idValid(row.record_id)||!SHA.test(row.sha256??'')||
        row.storage_key!==entryKey(row.sha256)||
        !MIME.has(row.mime)||!Number.isSafeInteger(row.bytes)||
        row.bytes<1||row.bytes>D6_MEDIA_LIMIT_BYTES)
      return fail(503,'MEDIA_REGISTRY_UNVERIFIED');
     let record;
     try{record=JSON.parse(row.record_json);}
     catch{return fail(503,'MEDIA_REGISTRY_UNVERIFIED');}
     if(!validators[row.domain](record)||record.id!==row.record_id)
      return fail(503,'MEDIA_REGISTRY_UNVERIFIED');
     const role=d6ReadableMediaRole({
      domain:row.domain,record,logicalPath:row.logical_path,
      markdown:row.markdown,allowLegacy:row.historical===1,
     });
     if(!role||d6HistoricalMime(row.logical_path)!==row.mime)
      return fail(503,'MEDIA_REGISTRY_UNVERIFIED');
     paths.add(row.logical_path);
    }
    return response(200,{ok:true,version:1,paths:[...paths]});
   }catch{return fail(503,'MEDIA_REGISTRY_UNVERIFIED');}
  }
  if(url.pathname===ORIGIN_PATH+'publish'){
   if(request.method!=='POST')return fail(405,'METHOD_NOT_ALLOWED');
   const domain=request.headers.get('X-Fish-V3-Media-Domain');
   if(!acceptedDomain(domain))return fail(400,'INVALID_MEDIA_DOMAIN');
   const auth=createD2UnifiedOwnerSession({
    AUTH_DB,ownerGitHubId:265665562,origin,csrfKey,now,
   });
   try{
    await auth[domain==='gear'?'authorizeDirectGearSave':
      domain==='kb'?'authorizeDirectKBSave':
      'authorizeDirectCatchSave'](request);
   }catch{return fail(403,'MEDIA_NOT_AUTHORIZED');}
   const len=request.headers.get('Content-Length');
   if(len!==null&&(!Number.isSafeInteger(Number(len))||
      Number(len)>MAX_BODY))return fail(413,'MEDIA_REQUEST_TOO_LARGE');
   let input;
   try{
    const body=await request.text();
    if(bytes(body)>MAX_BODY)return fail(413,'MEDIA_REQUEST_TOO_LARGE');
    input=JSON.parse(body);
   }catch{return fail(400,'INVALID_MEDIA_EDIT');}
   if(!input||typeof input!=='object'||Array.isArray(input)||
      Object.keys(input).sort().join(',')!==
      'domain,expectedRevision,markdown,media,record'||
      input.domain!==domain)return fail(400,'INVALID_MEDIA_EDIT');
   const result=await publishD6MediaRevision({
    CONTENT_DB,R2,domain,record:input.record,markdown:input.markdown,
    expectedRevision:input.expectedRevision,media:input.media,now,
   });
   return result.status===200?response(200,{ok:true,...result.result}):
    fail(result.status,result.error);
  }
  // Read only fully published D1 refs and real Markdown image tokens.
  const thumbnail=url.pathname.startsWith(THUMB_PREFIX);
  const path=decodeLivePath(url.pathname,thumbnail?THUMB_PREFIX:READ_PREFIX);
  if(!path)return fail(404,'NOT_FOUND');
  // Transformations stay disabled without separate owner approval.
  if(thumbnail&&(!thumbnailEnabled()||typeof IMAGES?.input!=='function'))
   return fail(503,'THUMBNAIL_NOT_ENABLED');
  if(request.method!=='GET'&&request.method!=='HEAD')
   return fail(405,'METHOD_NOT_ALLOWED');
  if(request.headers.has('Range'))return fail(416,'RANGE_NOT_SUPPORTED');
  // One existing owner-only session check protects both the manifest and
  // referenced R2 originals. No second media auth mechanism or public URL.
  try{
   const auth=createD2UnifiedOwnerSession({
    AUTH_DB,ownerGitHubId:265665562,origin,csrfKey,now,
   });
   // The existing session validator accepts GET; authenticate HEAD using
   // an equivalent read-only GET request, then return no response body.
   await auth.authorizeStatus(request.method==='HEAD'?
    new Request(request,{method:'GET'}):request);
  }catch{return fail(403,'MEDIA_NOT_AUTHORIZED');}
  try{
   // A historical photo can be referenced by several records. All rows
   // must identify the same immutable object; a currently linked owner must
   // exist before any bytes can be returned.
   const refs=await CONTENT_DB.prepare(
    'SELECT domain,record_id,sha256,historical FROM d6_media_refs WHERE logical_path=?'
   ).bind(path).all();
   if(!Array.isArray(refs?.results)||!refs.results.length||
      refs.results.length>172)return fail(404,'NOT_FOUND');
   let selected=null;
   for(const ref of refs.results){
    if(!acceptedDomain(ref.domain)||!idValid(ref.record_id)||
       !SHA.test(ref.sha256)||
       selected&&selected!==ref.sha256)return fail(503,'MEDIA_UNVERIFIED');
    selected=ref.sha256;
   }
   let linked=false;
   for(const ref of refs.results){
    const d=DOMAINS[ref.domain];
    const row=await CONTENT_DB.prepare(selectSql(d)).bind(ref.record_id).first();
    if(!row||row.id!==ref.record_id)continue;
    let record;
    try{record=JSON.parse(row.record_json);}catch{continue;}
    if(!validators[ref.domain](record)||record.id!==ref.record_id)continue;
    if(d6ReadableMediaRole({domain:ref.domain,record,
      logicalPath:path,markdown:row[d.field],
      allowLegacy:ref.historical===1})){
     linked=true;break;
    }
   }
   if(!linked)return fail(404,'NOT_FOUND');
   const stored=await CONTENT_DB.prepare(
    'SELECT storage_key,mime,bytes FROM d6_media_objects WHERE sha256=?'
   ).bind(selected).first();
   if(!stored||!MIME.has(stored.mime)||stored.bytes<1||
      stored.bytes>D6_MEDIA_LIMIT_BYTES||
      d6HistoricalMime(path)!==stored.mime||
      stored.storage_key!==entryKey(selected))
    return fail(503,'MEDIA_UNVERIFIED');
   const original=await R2.get(stored.storage_key);
   if(!original||!storedObjectOK(original,selected,
      stored.bytes,stored.mime)||!original.body)
    return fail(503,'MEDIA_UNVERIFIED');
   if(thumbnail){
    // Reuse private browser-cached bytes only after checking current D1/R2
    // identity; replacing an original changes the ETag and invalidates it.
    const thumbETag='"'+selected+'-card512x270-v1"';
    if(request.headers.get('If-None-Match')===thumbETag)
     return new Response(null,{status:304,headers:{
      'Cache-Control':'private, no-cache','ETag':thumbETag,
      'Vary':'Cookie','X-Content-Type-Options':'nosniff',
     }});
    // Existing D1/R2 proof above protects both full-size and card routes.
    // Only a fixed bounded first-frame WebP derivative is served.
    const transformed=IMAGES.input(original.body)
     .transform({width:512,height:270,fit:'scale-down'})
     .output({format:'image/webp',quality:80,anim:false})
     .response({headers:{
      'Cache-Control':'private, no-cache',
      'X-Content-Type-Options':'nosniff',
      'Content-Disposition':'inline',
      'Vary':'Cookie',
     }});
    if(!(transformed instanceof Response)||transformed.status!==200||
       !/^image\/webp\b/i.test(transformed.headers.get('Content-Type')??''))
     return fail(503,'THUMBNAIL_UNAVAILABLE');
    const headers=new Headers(transformed.headers);
    headers.set('Cache-Control','private, no-cache');
    headers.set('X-Content-Type-Options','nosniff');
    headers.set('Content-Disposition','inline');
    headers.set('Vary','Cookie');
    headers.set('ETag',thumbETag);
    return new Response(request.method==='HEAD'?null:transformed.body,{
     status:200,headers,
    });
   }
   const headers=new Headers({
    'Content-Type':stored.mime,
    'Content-Length':String(stored.bytes),
    'Cache-Control':'private, no-store',
    'X-Content-Type-Options':'nosniff',
    'Content-Disposition':'inline',
    'ETag':'"'+selected+'"',
    'Accept-Ranges':'none',
   });
   return new Response(request.method==='HEAD'?null:original.body,{
    status:200,headers,
   });
  }catch{return fail(503,'MEDIA_UNVERIFIED');}
 }
 return Object.freeze({handle});
}
