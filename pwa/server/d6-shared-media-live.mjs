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
import MarkdownIt from 'markdown-it';
import {ID_PATTERN,encodedPath,safePath} from '../src/shared.mjs';
import {noteImageReference} from '../src/notes-markdown-editor.mjs';
import {validateD6MediaPath,D6_MEDIA_LIMIT_BYTES}
 from './d6-shared-media-stage.mjs';
import {createD2UnifiedOwnerSession}
 from '../../experiments/p3/preview/src/d2-unified-owner-session.mjs';

const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA=/^[a-f0-9]{64}$/;
const MIME=new Set(['image/jpeg','image/png','image/webp','image/gif']);
const ORIGIN_PATH='/api/v3/media/';
const READ_PREFIX=ORIGIN_PATH+'live/';
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
const parser=new MarkdownIt({html:false,linkify:false,typographer:false});
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

/** Parse actual Markdown image tokens; a comment/link/plain substring
 * never qualifies an R2 object as linked user content. */
export function isD6NotesImageLinked(markdown,logicalPath){
 if(typeof markdown!=='string'||typeof logicalPath!=='string')return false;
 let wanted;
 try{wanted=noteImageReference(safePath(logicalPath));}
 catch{return false;}
 try{
  const tokens=parser.parse(markdown,{});
  const stack=[...tokens];
  while(stack.length){
   const token=stack.pop();
   if(token.children)stack.push(...token.children);
   if(token.type==='image'&&token.attrGet('src')===wanted&&
      token.content?.trim())return true;
  }
 }catch{return false;}
 return false;
}
function decodeLivePath(pathname){
 if(!pathname.startsWith(READ_PREFIX))return null;
 const encoded=pathname.slice(READ_PREFIX.length);
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
 if(!Array.isArray(media)||media.length<1||media.length>32)
  throw Error('MEDIA_MANIFEST_INVALID');
 const seen=new Set(),validated=[];
 for(const item of media){
  if(!item||typeof item!=='object'||Array.isArray(item)||
     Object.keys(item).sort().join(',')!=='bytes,contentType,logicalPath,sha256'||
     !SHA.test(item.sha256??'')||
     !Number.isSafeInteger(item.bytes)||item.bytes<1||
     item.bytes>D6_MEDIA_LIMIT_BYTES||!MIME.has(item.contentType))
   throw Error('MEDIA_MANIFEST_INVALID');
  const path=validateD6MediaPath({domain,record,
   logicalPath:item.logicalPath});
  if(path.mime!==item.contentType||seen.has(path.logicalPath)||
     !isD6NotesImageLinked(markdown,path.logicalPath))
   throw Error('MEDIA_REFERENCE_INVALID');
  seen.add(path.logicalPath);
  const head=await R2.head(entryKey(item.sha256));
  if(!storedObjectOK(head,item.sha256,item.bytes,item.contentType))
   throw Error('MEDIA_NOT_STAGED');
  validated.push({logicalPath:path.logicalPath,
   sha256:item.sha256,bytes:item.bytes,mime:item.contentType,
   storageKey:entryKey(item.sha256)});
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
    expectedRevision<0||
    (domain!=='catches'&&expectedRevision===0))return false;
 const path=record[DOMAINS[domain].fieldInRecord];
 if(typeof path!=='string'||!path.trim()||!markdown.trim())return false;
 if(domain==='catches'&&path!=='Catches/content/'+record.id+'.md')
  return false;
 return true;
}
/** Throws on stale revision during the SAME batch, so no refs or row
 * updates can commit if concurrent editing has changed the record. */
function revisionGuardSQL(d,mode){
 const check=mode==='create'?
  `NOT EXISTS(SELECT 1 FROM ${d.table} WHERE id=?)`:
  `EXISTS(SELECT 1 FROM ${d.table} WHERE id=? AND revision=?)`;
 // SQLite json_extract('[invalid',...) always throws malformed JSON.
 // D1.batch guarantees rollback of the entire batch on any SQL failure.
 return `SELECT json_extract(CASE WHEN ${check}
 THEN '{"ok":1}' ELSE '[invalid' END,'$.ok') AS media_guard`;
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
 const d=DOMAINS[domain],isNew=domain==='catches'&&expectedRevision===0;
 try{
  if(domain==='catches'&&!(await validateCatchLinks(CONTENT_DB,record)))
   return {status:400,error:'INVALID_REFERENCE'};
  const staged=await validateStagedObjects(R2,domain,record,markdown,media);
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
  const timestamp=now();
  if(!Number.isSafeInteger(timestamp)||timestamp<0)
   return {status:503,error:'CLOCK_UNAVAILABLE'};
  const guard=CONTENT_DB.prepare(revisionGuardSQL(d,isNew?'create':'update'))
   .bind(...(isNew?[record.id]:[record.id,expectedRevision]));
  const content=isNew?
   CONTENT_DB.prepare(`INSERT INTO ${d.table}
    (id,revision,record_json,${d.field},updated_at)
    VALUES(?,1,?,?,?)`).bind(record.id,JSON.stringify(record),markdown,timestamp):
   CONTENT_DB.prepare(`UPDATE ${d.table}
    SET record_json=?,${d.field}=?,revision=revision+1,updated_at=?
    WHERE id=? AND revision=?`)
    .bind(JSON.stringify(record),markdown,timestamp,record.id,expectedRevision);
  const batch=[guard,content];
  for(const asset of staged){
   batch.push(CONTENT_DB.prepare(
    'INSERT INTO d6_media_objects (sha256,storage_key,mime,bytes,created_at)'+
    ' VALUES(?,?,?,?,?) ON CONFLICT(sha256) DO NOTHING'
   ).bind(asset.sha256,asset.storageKey,asset.mime,asset.bytes,timestamp));
   batch.push(CONTENT_DB.prepare(
    'INSERT INTO d6_media_refs (logical_path,domain,record_id,sha256,created_at)'+
    ' VALUES(?,?,?,?,?)'
   ).bind(asset.logicalPath,domain,record.id,asset.sha256,timestamp));
  }
  // Guarantees rollback of content Save + all media rows together.
  const outcome=await CONTENT_DB.batch(batch);
  if(!Array.isArray(outcome)||outcome.length!==batch.length||
     outcome.some(x=>x?.success!==true)||
     outcome[0].results?.[0]?.media_guard!==1||
     outcome[1].meta?.changes!==1||
     staged.some((_,i)=>outcome[3+2*i]?.meta?.changes!==1))
   return {status:503,error:'MEDIA_PUBLISH_UNVERIFIED'};
  const saved=await CONTENT_DB.prepare(selectSql(d)).bind(record.id).first();
  if(!saved||saved.revision!==expectedRevision+1||
     saved.record_json!==JSON.stringify(record)||
     saved[d.field]!==markdown)
   return {status:503,error:'MEDIA_PUBLISH_UNVERIFIED'};
  return {status:200,
   result:{record,revision:saved.revision,
    [d.jsField]:markdown,media:staged.map(asset=>({
     logicalPath:asset.logicalPath,sha256:asset.sha256,
     bytes:asset.bytes,contentType:asset.mime,
    })),published:true}};
 }catch{
  return {status:503,error:'MEDIA_PUBLISH_UNVERIFIED'};
 }
}
export function createD6SharedMediaLive({
 AUTH_DB,CONTENT_DB,R2,csrfKey,origin,enabled=()=>false,
 now=()=>Math.floor(Date.now()/1000),
}={}){
 if(typeof origin!=='string'||!origin.startsWith('https://')||
    new URL(origin).origin!==origin||
    typeof enabled!=='function'||typeof now!=='function')
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
  const path=decodeLivePath(url.pathname);
  if(!path)return fail(404,'NOT_FOUND');
  if(request.method!=='GET'&&request.method!=='HEAD')
   return fail(405,'METHOD_NOT_ALLOWED');
  if(request.headers.has('Range'))return fail(416,'RANGE_NOT_SUPPORTED');
  try{
   const ref=await CONTENT_DB.prepare(
    'SELECT domain,record_id,sha256 FROM d6_media_refs WHERE logical_path=?'
   ).bind(path).first();
   if(!ref||!acceptedDomain(ref.domain)||!idValid(ref.record_id)||
      !SHA.test(ref.sha256))return fail(404,'NOT_FOUND');
   const d=DOMAINS[ref.domain];
   const row=await CONTENT_DB.prepare(selectSql(d)).bind(ref.record_id).first();
   if(!row||row.id!==ref.record_id)return fail(404,'NOT_FOUND');
   let record;
   try{record=JSON.parse(row.record_json);}catch{return fail(503,'MEDIA_UNVERIFIED');}
   if(!validators[ref.domain](record)||record.id!==ref.record_id||
      !isD6NotesImageLinked(row[d.field],path))
    return fail(404,'NOT_FOUND');
   if(validateD6MediaPath({domain:ref.domain,record,
      logicalPath:path}).mime===undefined)return fail(404,'NOT_FOUND');
   const stored=await CONTENT_DB.prepare(
    'SELECT storage_key,mime,bytes FROM d6_media_objects WHERE sha256=?'
   ).bind(ref.sha256).first();
   if(!stored||!MIME.has(stored.mime)||stored.bytes<1||
      stored.bytes>D6_MEDIA_LIMIT_BYTES||
      stored.storage_key!==entryKey(ref.sha256))
    return fail(503,'MEDIA_UNVERIFIED');
   const original=await R2.get(stored.storage_key);
   if(!original||!storedObjectOK(original,ref.sha256,
      stored.bytes,stored.mime)||!original.body)
    return fail(503,'MEDIA_UNVERIFIED');
   const headers=new Headers({
    'Content-Type':stored.mime,
    'Content-Length':String(stored.bytes),
    'Cache-Control':'private, no-store',
    'X-Content-Type-Options':'nosniff',
    'Content-Disposition':'inline',
    'ETag':'"'+ref.sha256+'"',
    'Accept-Ranges':'none',
   });
   return new Response(request.method==='HEAD'?null:original.body,{
    status:200,headers,
   });
  }catch{return fail(503,'MEDIA_UNVERIFIED');}
 }
 return Object.freeze({handle});
}
