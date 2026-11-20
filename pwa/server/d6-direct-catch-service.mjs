/**
 * FISH-TODO-118 — direct private Catch Log (12 frozen rows plus owner additions).
 * No GitHub content writer, queue, new storage, or public cutover.
 */
import Ajv2020 from 'ajv/dist/2020.js';
import schema from '../contracts/schema.json' with {type:'json'};
import {createD2UnifiedOwnerSession}
 from '../../experiments/p3/preview/src/d2-unified-owner-session.mjs';

const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_BODY=192*1024,MAX_NOTES=128*1024;
const HEADER=Object.freeze({
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY',
 'Referrer-Policy':'no-referrer','Vary':'Cookie',
});
const validate=new Ajv2020({strict:true}).compile({
 $ref:'#/$defs/catch',$defs:schema.$defs,
});
const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers:HEADER});
const fail=(status,code)=>reply(status,{ok:false,error:code});
const select=(db,id)=>db.prepare(
 'SELECT id,revision,record_json,notes_text FROM d6_catch_records WHERE id=?'
).bind(id).first();
function safeRow(row,id){
 if(!row||row.id!==id||!Number.isSafeInteger(row.revision)||
    row.revision<1||typeof row.record_json!=='string'||
    typeof row.notes_text!=='string')return null;
 let record;
 try{record=JSON.parse(row.record_json);}catch{return null;}
 if(!validate(record)||record.id!==id||
    new TextEncoder().encode(row.notes_text).length>MAX_NOTES)return null;
 if(Boolean(record.notes)!==Boolean(row.notes_text.trim())||
    (record.notes&&record.notes!=='Catches/content/'+id+'.md'))return null;
 return {record,notes:row.notes_text,revision:row.revision};
}
async function validReferences(db,record){
 for(const [field,table,type] of [
  ['speciesId','d6_kb_records','species'],
  ['locationId','d6_kb_records','location'],
  ['lureOrBaitId','d6_gear_records','lure'],
 ]){
  if(!record[field])continue;
  const data=await db.prepare(
   'SELECT record_json FROM '+table+' WHERE id=?'
  ).bind(record[field]).first();
  if(typeof data?.record_json!=='string')return false;
  let linked;
  try{linked=JSON.parse(data.record_json);}catch{return false;}
  if(linked.id!==record[field])return false;
  if(type==='lure'?!['lures','bait'].includes(linked.category):linked.type!==type)
   return false;
 }
 for(const [idField,nameField] of [
  ['speciesId','speciesName'],['locationId','locationName'],
  ['lureOrBaitId','lureOrBaitName'],
 ])if(record[idField]&&record[nameField])return false;
 return true;
}
export function createD6DirectCatchService({
 AUTH_DB,CONTENT_DB,csrfKey,origin,enabled=()=>false,
 now=()=>Math.floor(Date.now()/1000),
}={}){
 if(typeof origin!=='string'||!origin.startsWith('https://')||
    new URL(origin).origin!==origin||typeof enabled!=='function'||
    typeof now!=='function')throw Error('DIRECT_CATCH_CONFIG_DENIED');
 const ready=()=>enabled()===true&&
  typeof AUTH_DB?.prepare==='function'&&
  typeof CONTENT_DB?.prepare==='function'&&
  typeof csrfKey==='string'&&new TextEncoder().encode(csrfKey).length>=32;
 const session=()=>createD2UnifiedOwnerSession({
  AUTH_DB,ownerGitHubId:265665562,origin,csrfKey,now,
 });
 async function handle(request){
  if(!(request instanceof Request))return fail(404,'NOT_FOUND');
  let url;
  try{url=new URL(request.url);}catch{return fail(404,'NOT_FOUND');}
  if(url.origin!==origin||url.search||url.hash||
     request.headers.has('Authorization'))return fail(404,'NOT_FOUND');
  if(!ready())return fail(503,'UNAVAILABLE');
  if(url.pathname==='/api/v3/content/catches-csrf'){
   if(request.method!=='GET'||
      request.headers.get('Sec-Fetch-Site')!=='same-origin'||
      request.headers.get('X-Fish-V3-Intent')!=='catch-csrf'||
      (request.headers.has('Origin')&&
       request.headers.get('Origin')!==origin))return fail(404,'NOT_FOUND');
   try{
    const proof=await session().describe(request);
    if(proof?.authorized!==true||proof?.authenticated!==true||
       !/^[A-Za-z0-9_-]{43}$/.test(proof.csrfToken??''))
     return fail(401,'SIGN_IN_REQUIRED');
    return reply(200,{ok:true,csrfToken:proof.csrfToken});
   }catch{return fail(401,'SIGN_IN_REQUIRED');}
  }
  if(url.pathname==='/api/v3/content/catches'){
   if(request.method!=='GET')return fail(405,'METHOD_NOT_ALLOWED');
   try{
    const result=await CONTENT_DB.prepare(
     'SELECT id,revision,record_json,notes_text FROM d6_catch_records ORDER BY id'
    ).all();
    // At least the 12 frozen rows must exist; later owner-added catches
    // are permitted. Client additionally verifies all original IDs remain.
    if(!Array.isArray(result?.results)||result.results.length<12)
     return fail(503,'CATCH_MIGRATION_INCOMPLETE');
    const ids=new Set(),items=[];
    for(const row of result.results){
     const safe=safeRow(row,row?.id);
     if(!safe||ids.has(row.id))return fail(503,'CATCH_DATA_UNAVAILABLE');
     ids.add(row.id);items.push(safe.record);
    }
    return reply(200,{ok:true,count:items.length,items});
   }catch{return fail(503,'CATCH_DATA_UNAVAILABLE');}
  }
  const match=/^\/api\/v3\/content\/catches\/([a-z0-9-]+)$/.exec(url.pathname);
  if(!match||!ID.test(match[1])||match[1].length>160)
   return fail(404,'NOT_FOUND');
  const id=match[1];
  if(request.method==='GET'){
   try{
    const row=await select(CONTENT_DB,id);
    if(!row)return fail(404,'NOT_FOUND');
    const safe=safeRow(row,id);
    return safe?reply(200,{ok:true,...safe}):fail(503,'DATA_UNAVAILABLE');
   }catch{return fail(503,'DATA_UNAVAILABLE');}
  }
  if(request.method!=='POST')return fail(405,'METHOD_NOT_ALLOWED');
  try{await session().authorizeDirectCatchSave(request);}
  catch{return fail(403,'SAVE_NOT_AUTHORIZED');}
  const length=Number(request.headers.get('Content-Length')??0);
  if(!Number.isFinite(length)||length>MAX_BODY)return fail(413,'RECORD_TOO_LARGE');
  let input;
  try{
   const text=await request.text();
   if(new TextEncoder().encode(text).length>MAX_BODY)
    return fail(413,'RECORD_TOO_LARGE');
   input=JSON.parse(text);
  }catch{return fail(400,'INVALID_RECORD');}
  if(!input||typeof input!=='object'||Array.isArray(input)||
     Object.keys(input).sort().join(',')!=='expectedRevision,notes,record'||
     !Number.isSafeInteger(input.expectedRevision)||
     input.expectedRevision<0||typeof input.notes!=='string'||
     new TextEncoder().encode(input.notes).length>MAX_NOTES||
     !validate(input.record)||input.record.id!==id||
     Boolean(input.record.notes)!==Boolean(input.notes.trim())||
     (input.record.notes&&
      input.record.notes!=='Catches/content/'+id+'.md'))
   return fail(400,'INVALID_RECORD');
  try{
   if(!(await validReferences(CONTENT_DB,input.record)))
    return fail(400,'INVALID_REFERENCE');
   const json=JSON.stringify(input.record),time=now();
   let result;
   if(input.expectedRevision===0){
    result=await CONTENT_DB.prepare(
     'INSERT INTO d6_catch_records(id,revision,record_json,notes_text,updated_at) VALUES(?,1,?,?,?) ON CONFLICT(id) DO NOTHING'
    ).bind(id,json,input.notes,time).run();
   }else{
    const previous=safeRow(await select(CONTENT_DB,id),id);
    if(!previous)return fail(409,'RECORD_CHANGED');
    if(previous.record.notes&&!input.record.notes)
     return fail(400,'CANNOT_REMOVE_EXISTING_NOTES');
    result=await CONTENT_DB.prepare(
     'UPDATE d6_catch_records SET record_json=?,notes_text=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?'
    ).bind(json,input.notes,time,id,input.expectedRevision).run();
   }
   if(result?.success!==true)return fail(503,'SAVE_UNCONFIRMED');
   if(result.meta?.changes===0)return fail(409,'RECORD_CHANGED');
   if(result.meta?.changes!==1)return fail(503,'SAVE_UNCONFIRMED');
   const saved=safeRow(await select(CONTENT_DB,id),id);
   if(!saved||saved.revision!==input.expectedRevision+1)
    return fail(503,'SAVE_UNCONFIRMED');
   return reply(200,{ok:true,...saved});
  }catch{return fail(503,'SAVE_UNCONFIRMED');}
 }
 return Object.freeze({handle});
}
