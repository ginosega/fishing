/**
 * FISH-TODO-118 / C04 — the SINGLE revision-safe D1 content mutation core.
 *
 * Both existing authenticated text endpoints and the separately disabled
 * media-publish route delegate here. Callers own AUTH/CSRF, record schema,
 * domain-specific path/link validation and (for media) R2 HEAD verification.
 *
 * NO R2 writes; NO Worker import/config/binding. Existing text-only saves
 * require only the existing D1 records tables and one conditional .run().
 * Saves with previously validated staged media require D1.batch and the
 * separately approval-gated metadata schema.
 */
const DOMAIN=Object.freeze({
 gear:Object.freeze({table:'d6_gear_records',field:'notes_text'}),
 kb:Object.freeze({table:'d6_kb_records',field:'content_text'}),
 catches:Object.freeze({table:'d6_catch_records',field:'notes_text'}),
});
const SHA=/^[a-f0-9]{64}$/;
const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const d6SelectSavedRow=(db,domain,id)=>{
 const spec=DOMAIN[domain];
 if(!spec||typeof db?.prepare!=='function')throw Error('SAVE_CONFIG_INVALID');
 return db.prepare(
  `SELECT id,revision,record_json,${spec.field} FROM ${spec.table} WHERE id=?`
 ).bind(id).first();
};
function contentWrite(db,spec,domain,record,markdown,rev,time){
 const json=JSON.stringify(record),id=record.id;
 if(rev!==0)return db.prepare(
  `UPDATE ${spec.table} SET record_json=?,${spec.field}=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?`
 ).bind(json,markdown,time,id,rev);
 // The original three domain paths remain unique on insert only;
 // new IDs cannot reuse another Gear/KB Markdown file as an alias.
 if(domain==='gear')return db.prepare(
  'INSERT INTO d6_gear_records (id,revision,record_json,notes_text,updated_at)'+
  ' SELECT ?,1,?,?,? WHERE (? IS NULL OR NOT EXISTS ('+
  "SELECT 1 FROM d6_gear_records WHERE json_extract(record_json,'$.notes')=?))"+
  ' ON CONFLICT(id) DO NOTHING'
 ).bind(id,json,markdown,time,record.notes??null,record.notes??null);
 if(domain==='kb')return db.prepare(
  'INSERT INTO d6_kb_records (id,revision,record_json,content_text,updated_at)'+
  ' SELECT ?,1,?,?,? WHERE NOT EXISTS ('+
  "SELECT 1 FROM d6_kb_records WHERE json_extract(record_json,'$.content')=?)"+
  ' ON CONFLICT(id) DO NOTHING'
 ).bind(id,json,markdown,time,record.content);
 return db.prepare(
  'INSERT INTO d6_catch_records(id,revision,record_json,notes_text,updated_at) VALUES(?,1,?,?,?) ON CONFLICT(id) DO NOTHING'
 ).bind(id,json,markdown,time);
}
function revisionGuard(db,spec,id,rev){
 // A failing constraint forces Cloudflare D1.batch to roll back every
 // statement. A simple zero-row UPDATE would NOT roll back media refs.
 const check=rev===0?
  `NOT EXISTS(SELECT 1 FROM ${spec.table} WHERE id=?)`:
  `EXISTS(SELECT 1 FROM ${spec.table} WHERE id=? AND revision=?)`;
 return db.prepare(
  `SELECT json_extract(CASE WHEN ${check} THEN '{"ok":1}' ELSE '[invalid' END,'$.ok') AS media_guard`
 ).bind(...(rev===0?[id]:[id,rev]));
}
function stagedOK(assets){
 if(!Array.isArray(assets)||assets.length>32)return false;
 const seen=new Set();
 for(const x of assets){
  if(!x||typeof x!=='object'||Array.isArray(x)||
     !SHA.test(x.sha256??'')||typeof x.logicalPath!=='string'||
     x.logicalPath.length>600||seen.has(x.logicalPath)||
     x.storageKey!=='staged/v1/sha256/'+x.sha256||
     !['image/jpeg','image/png','image/webp','image/gif'].includes(x.mime)||
     !Number.isSafeInteger(x.bytes)||x.bytes<1||x.bytes>10485760)return false;
  seen.add(x.logicalPath);
 }
 return true;
}
/**
 * Shared exact-revision record mutation. For media, staged assets were
 * independently verified by the disabled media service before entering.
 * Returns {status,error?,row?,revision?}; never promises publication when
 * D1.batch returns an unverifiable response.
 */
export async function saveD6ContentRevision({
 CONTENT_DB,domain,record,markdown,expectedRevision,
 now=()=>Math.floor(Date.now()/1000),media=[],
}={}){
 const spec=DOMAIN[domain];
 if(!spec||typeof CONTENT_DB?.prepare!=='function'||
    typeof now!=='function'||typeof record?.id!=='string'||
    !ID.test(record.id)||record.id.length>160||
    typeof markdown!=='string'||!Number.isSafeInteger(expectedRevision)||
    expectedRevision<0||!stagedOK(media))
  return {status:400,error:'INVALID_RECORD'};
 const isMedia=media.length>0;
 if(isMedia&&typeof CONTENT_DB.batch!=='function')
  return {status:503,error:'SAVE_UNCONFIRMED'};
 const id=record.id;
 try{
  const time=now();
  if(!Number.isSafeInteger(time)||time<0)
   return {status:503,error:'SAVE_UNCONFIRMED'};
  const write=contentWrite(CONTENT_DB,spec,domain,record,
   markdown,expectedRevision,time);
  if(isMedia){
   const guard=revisionGuard(CONTENT_DB,spec,id,expectedRevision);
   const batch=[guard,write];
   for(const item of media){
    batch.push(CONTENT_DB.prepare(
     'INSERT INTO d6_media_objects (sha256,storage_key,mime,bytes,created_at)'+
     ' VALUES(?,?,?,?,?) ON CONFLICT(sha256) DO NOTHING'
    ).bind(item.sha256,item.storageKey,item.mime,item.bytes,time));
    batch.push(CONTENT_DB.prepare(
     'INSERT INTO d6_media_refs (logical_path,domain,record_id,sha256,created_at)'+
     ' VALUES(?,?,?,?,?)'
    ).bind(item.logicalPath,domain,id,item.sha256,time));
   }
   let result;
   try{result=await CONTENT_DB.batch(batch);}
   catch{
    // Only return 409 if another revision is independently observed.
    try{
     const latest=await d6SelectSavedRow(CONTENT_DB,domain,id);
     if(expectedRevision===0?Boolean(latest):
        !latest||latest.revision!==expectedRevision)
      return {status:409,error:'RECORD_CHANGED'};
    }catch{/* Unknown is not a proven 409. */}
    return {status:503,error:'SAVE_UNCONFIRMED'};
   }
   if(!Array.isArray(result)||result.length!==batch.length||
      result.some(x=>x?.success!==true)||
      result[0]?.results?.[0]?.media_guard!==1||
      result[1]?.meta?.changes!==1||
      media.some((_,i)=>result[3+2*i]?.meta?.changes!==1))
    return {status:503,error:'SAVE_UNCONFIRMED'};
  }else{
   const result=await write.run();
   if(result?.success!==true||result.meta?.changes!==1){
    if(result?.success===true&&result.meta?.changes===0)
     return {status:409,error:'RECORD_CHANGED'};
    return {status:503,error:'SAVE_UNCONFIRMED'};
   }
  }
  const row=await d6SelectSavedRow(CONTENT_DB,domain,id);
  if(!row||row.id!==id||row.revision!==expectedRevision+1||
     row.record_json!==JSON.stringify(record)||row[spec.field]!==markdown)
   return {status:503,error:'SAVE_UNCONFIRMED'};
  return {status:200,row,revision:row.revision};
 }catch{return {status:503,error:'SAVE_UNCONFIRMED'};}
}
