/**
 * Fishing Companion V3: direct Gear GET and Save through an existing owner
 * session and one D1 table. SOURCE ONLY; not a deployed Worker entrypoint.
 * No GitHub content publisher, PR, scheduler, watchdog or media mutation.
 */
import Ajv2020 from 'ajv/dist/2020.js';
import schema from '../contracts/schema.json' with {type:'json'};
import {narrativePath} from '../src/handoff.mjs';
import {saveD6ContentRevision} from './d6-content-save-transaction.mjs';
import {createD2UnifiedOwnerSession}
 from '../../experiments/p3/preview/src/d2-unified-owner-session.mjs';

const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_REQUEST=192*1024;
const MAX_NOTES=128*1024;
const HEADER=Object.freeze({
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'X-Content-Type-Options':'nosniff',
 'X-Frame-Options':'DENY',
 'Referrer-Policy':'no-referrer',
 'Vary':'Cookie',
});
const validate=new Ajv2020({strict:true}).compile({
 $ref:'#/$defs/gearItem',$defs:schema.$defs,
});
const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers:HEADER});
const fail=(status,code)=>reply(status,{ok:false,error:code});
const getRow=(db,id)=>db.prepare(
 'SELECT id,revision,record_json,notes_text FROM d6_gear_records WHERE id=?'
).bind(id).first();
function safeRow(row,id){
 if(!row||row.id!==id||!Number.isSafeInteger(row.revision)||
    row.revision<1||typeof row.record_json!=='string'||
    typeof row.notes_text!=='string')return null;
 let record;
 try{record=JSON.parse(row.record_json);}catch{return null;}
 if(!validate(record)||record.id!==id||
    new TextEncoder().encode(row.notes_text).length>MAX_NOTES)return null;
 return {record,notes:row.notes_text,revision:row.revision};
}

export function createD6DirectGearService({
 AUTH_DB,CONTENT_DB,csrfKey,origin,enabled=()=>false,
 now=()=>Math.floor(Date.now()/1000),
}={}){
 if(typeof origin!=='string'||!origin.startsWith('https://')||
    new URL(origin).origin!==origin||typeof enabled!=='function'||
    typeof now!=='function')throw Error('DIRECT_GEAR_CONFIG_DENIED');
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
     request.headers.has('Authorization')||
     !url.pathname.startsWith('/api/v3/content/'))return fail(404,'NOT_FOUND');
  if(!ready())return fail(503,'UNAVAILABLE');
  if(url.pathname==='/api/v3/content/owner-csrf'){
   if(request.method!=='GET'||
      request.headers.get('Sec-Fetch-Site')!=='same-origin'||
      request.headers.get('X-Fish-V3-Intent')!=='gear-csrf'||
      (request.headers.has('Origin')&&
       request.headers.get('Origin')!==origin))
    return fail(404,'NOT_FOUND');
   try{
    const proof=await session().describe(request);
    if(proof?.authorized!==true||proof?.authenticated!==true||
       !/^[A-Za-z0-9_-]{43}$/.test(proof.csrfToken??''))
     return fail(401,'SIGN_IN_REQUIRED');
    return reply(200,{ok:true,csrfToken:proof.csrfToken});
   }catch{return fail(401,'SIGN_IN_REQUIRED');}
  }
  // Preserve the 100-row migration floor, while allowing owner-added rows.
  if(url.pathname==='/api/v3/content/gear'){
   if(request.method!=='GET')return fail(405,'METHOD_NOT_ALLOWED');
   try{
    const result=await CONTENT_DB.prepare(
     'SELECT id,revision,record_json,notes_text FROM d6_gear_records ORDER BY id'
    ).all();
    if(!Array.isArray(result?.results)||result.results.length<100)
     return fail(503,'GEAR_MIGRATION_INCOMPLETE');
    const items=[],ids=new Set();
    for(const row of result.results){
     const item=safeRow(row,row?.id);
     if(!item||ids.has(row.id))return fail(503,'GEAR_DATA_UNAVAILABLE');
     ids.add(row.id);items.push(item.record);
    }
    return reply(200,{ok:true,count:items.length,items});
   }catch{return fail(503,'GEAR_DATA_UNAVAILABLE');}
  }
  const match=/^\/api\/v3\/content\/gear\/([a-z0-9-]+)$/.exec(url.pathname);
  if(!match||!ID.test(match[1])||match[1].length>160)
   return fail(404,'NOT_FOUND');
  const id=match[1];
  if(request.method==='GET'){
   try{
    const row=await getRow(CONTENT_DB,id);
    if(!row)return fail(404,'NOT_FOUND');
    const safe=safeRow(row,id);
    return safe?reply(200,{ok:true,...safe}):fail(503,'DATA_UNAVAILABLE');
   }catch{return fail(503,'DATA_UNAVAILABLE');}
  }
  if(request.method!=='POST')return fail(405,'METHOD_NOT_ALLOWED');
  try{await session().authorizeDirectGearSave(request);}
  catch{return fail(403,'SAVE_NOT_AUTHORIZED');}
  const length=Number(request.headers.get('Content-Length')??0);
  if(length>MAX_REQUEST)return fail(413,'RECORD_TOO_LARGE');
  let input;
  try{
   const body=await request.text();
   if(new TextEncoder().encode(body).length>MAX_REQUEST)
    return fail(413,'RECORD_TOO_LARGE');
   input=JSON.parse(body);
  }catch{return fail(400,'INVALID_RECORD');}
  if(!input||typeof input!=='object'||Array.isArray(input)||
     Object.keys(input).sort().join(',')!=='expectedRevision,notes,record'||
     !Number.isSafeInteger(input.expectedRevision)||
     input.expectedRevision<0||
     typeof input.notes!=='string'||
     new TextEncoder().encode(input.notes).length>MAX_NOTES||
     !validate(input.record)||input.record.id!==id||
     (input.expectedRevision===0&&(
      Boolean(input.record.notes)!==Boolean(input.notes.trim())||
      (input.record.notes&&input.record.notes!==narrativePath('gear',input.record))||
      Boolean(input.record.picture))))
   return fail(400,'INVALID_RECORD');

  // Shared D1 mutation contract also used by the disabled media service.
  // Existing text-only saves still use one exact-revision conditional .run().
  const saved=await saveD6ContentRevision({
   CONTENT_DB,domain:'gear',record:input.record,markdown:input.notes,
   expectedRevision:input.expectedRevision,now,
  });
  if(saved.status!==200)return fail(saved.status,saved.error);
  const safe=safeRow(saved.row,id);
  return safe?reply(200,{ok:true,...safe}):fail(503,'SAVE_UNCONFIRMED');
 }
 return Object.freeze({handle});
}
