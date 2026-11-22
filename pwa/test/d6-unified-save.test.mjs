import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {D6_MEDIA_SCHEMA_SQL} from '../tools/d6-media-schema.mjs';
import {saveD6ContentRevision} from '../server/d6-content-save-transaction.mjs';
const domainSpec={
 gear:['d6_gear_records','notes_text'],
 kb:['d6_kb_records','content_text'],
 catches:['d6_catch_records','notes_text'],
};
function fixture({schema=false}={}){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec('PRAGMA foreign_keys=ON');
 for(const [table,field] of Object.values(domainSpec))
  sqlite.exec(`CREATE TABLE ${table} (
   id TEXT PRIMARY KEY, revision INTEGER NOT NULL,
   record_json TEXT NOT NULL, ${field} TEXT NOT NULL, updated_at INTEGER NOT NULL)`);
 if(schema)sqlite.exec(D6_MEDIA_SCHEMA_SQL);
 let batches=0,runs=0;
 const CONTENT_DB={
  prepare(sql){return {bind(...args){return {sql,args,
   async first(){return sqlite.prepare(sql).get(...args)??null;},
   async run(){runs++;const result=sqlite.prepare(sql).run(...args);
    return {success:true,meta:{changes:Number(result.changes)}};},
  };}};},
  async batch(statements){batches++;
   sqlite.exec('BEGIN IMMEDIATE');
   const results=[];
   try{
    for(const x of statements){
     if(x.sql.trim().startsWith('SELECT'))
      results.push({success:true,results:sqlite.prepare(x.sql).all(...x.args),
       meta:{changes:0}});
     else{
      const v=sqlite.prepare(x.sql).run(...x.args);
      results.push({success:true,results:[],meta:{changes:Number(v.changes)}});
     }
    }
    sqlite.exec('COMMIT');return results;
   }catch(e){sqlite.exec('ROLLBACK');throw e;}
  },
 };
 const read=(domain,id)=>sqlite.prepare(
  'SELECT * FROM '+domainSpec[domain][0]+' WHERE id=?').get(id);
 const count=table=>sqlite.prepare('SELECT COUNT(*) AS n FROM '+table).get().n;
 const seed=(domain,record,markdown='Original')=>{
  const [table,field]=domainSpec[domain];
  sqlite.prepare(`INSERT INTO ${table}
   (id,revision,record_json,${field},updated_at) VALUES(?,1,?,?,?)`)
   .run(record.id,JSON.stringify(record),markdown,1);
 };
 const save=(domain,record,markdown,expectedRevision,media=[]) =>
  saveD6ContentRevision({CONTENT_DB,domain,record,markdown,
   expectedRevision,media,now:()=>1000});
 return {sqlite,CONTENT_DB,save,seed,read,count,
  batches:()=>batches,runs:()=>runs};
}
const records={
 gear:{id:'gear-unit',name:'Owner Gear',notes:'Gear/Lures/content/Owner Gear.md'},
 kb:{id:'kb-unit',name:'Owner KB',content:'KB/Species/content/Owner KB.md'},
 catches:{id:'catch-unit',notes:'Catches/content/catch-unit.md'},
};
test('V3-C04-01 text Add/Edit is shared across all three domains without media D1 schema',async()=>{
 const f=fixture();
 for(const domain of Object.keys(records)){
  const record=records[domain];
  const added=await f.save(domain,record,'Initial',0);
  assert.equal(added.status,200,domain+': '+added.error);
  assert.equal(added.revision,1);
  assert.equal(f.read(domain,record.id).revision,1);
  const stale=await f.save(domain,record,'Bad overwrite',0);
  assert.equal(stale.status,409);
  const update=await f.save(domain,{...record,name:'Updated'},
   'Revised',1);
  assert.equal(update.status,200);
  assert.equal(update.revision,2);
  const oldRevision=await f.save(domain,record,'Stale',1);
  assert.equal(oldRevision.status,409);
  assert.equal(f.read(domain,record.id).revision,2);
 }
 assert.equal(f.batches(),0,'ordinary text Save never depends on future media schema');
 assert.equal(f.runs(),12);
});
test('V3-C04-02 shared D1 batch atomically publishes several validated media references',async()=>{
 const f=fixture({schema:true}),record=records.gear;
 f.seed('gear',record,'Old notes');
 const key='staged/v1/sha256/'+'a'.repeat(64);
 const media=['first','second'].map(x=>({
  logicalPath:'Gear/Lures/assets/gear-unit/notes/'+x+'.png',
  sha256:'a'.repeat(64),storageKey:key,mime:'image/png',bytes:67,
 }));
 const saved=await f.save('gear',record,'New images',1,media);
 assert.equal(saved.status,200,saved.error);
 assert.equal(saved.revision,2);
 assert.equal(f.batches(),1);
 assert.equal(f.count('d6_media_objects'),1,'content-addressed R2 object deduplicated');
 assert.equal(f.count('d6_media_refs'),2,'both image refs committed');
 assert.equal(f.read('gear',record.id).notes_text,'New images');
 const stale=await f.save('gear',record,'Stale text',1,media);
 assert.equal(stale.status,409);
 assert.equal(f.count('d6_media_refs'),2);
 assert.equal(f.read('gear',record.id).revision,2);
});
test('V3-C04-03 cross-owner collision on second media ref aborts shared D1 transaction',async()=>{
 const f=fixture({schema:true}),record=records.gear;
 f.seed('gear',record,'Old notes');
 const sha='b'.repeat(64),key='staged/v1/sha256/'+sha;
 const refs=['safe','occupied'].map(x=>({
  logicalPath:'Gear/Lures/assets/gear-unit/notes/'+x+'.png',
  sha256:sha,storageKey:key,mime:'image/png',bytes:67,
 }));
 f.sqlite.prepare('INSERT INTO d6_media_objects'+
  ' (sha256,storage_key,mime,bytes,created_at) VALUES(?,?,?,?,?)')
  .run(sha,key,'image/png',67,1);
 f.sqlite.prepare('INSERT INTO d6_media_refs'+
  ' (logical_path,domain,record_id,sha256,created_at) VALUES(?,?,?,?,?)')
  .run(refs[1].logicalPath,'gear','different-gear-owner',sha,1);
 const result=await f.save('gear',record,'Should never save',1,refs);
 assert.equal(result.status,503);
 assert.equal(f.count('d6_media_refs'),1);
 assert.equal(f.read('gear',record.id).revision,1);
 assert.equal(f.read('gear',record.id).notes_text,'Old notes');
});
test('V3-C04-04 core refuses malformed media or missing D1 batch, no write',async()=>{
 const f=fixture(),record=records.gear;
 f.seed('gear',record);
 const broken={logicalPath:'x.png',sha256:'0'.repeat(64),
  storageKey:'not-a-staged-sha',mime:'image/png',bytes:2};
 assert.equal((await f.save('gear',record,'Attempt',1,[broken])).status,400);
 const valid={...broken,storageKey:'staged/v1/sha256/'+broken.sha256};
 const noBatch={prepare:f.CONTENT_DB.prepare};
 assert.equal((await saveD6ContentRevision({CONTENT_DB:noBatch,domain:'gear',
  record,markdown:'Attempt',expectedRevision:1,media:[valid]})).status,503);
 assert.equal(f.read('gear',record.id).revision,1);
});
test('V3-C04-05 all three owner endpoints and media publisher use SAME write core',()=>{
 for(const path of [
  '../server/d6-direct-gear-service.mjs',
  '../server/d6-direct-kb-service.mjs',
  '../server/d6-direct-catch-service.mjs',
  '../server/d6-shared-media-live.mjs',
 ]){
  const src=readFileSync(new URL(path,import.meta.url),'utf8');
  assert.match(src,/saveD6ContentRevision\(/,path);
  assert.match(src,/import \{saveD6ContentRevision\}/,path);
 }
 const live=readFileSync(new URL('../server/d6-direct-gear-worker.mjs',
  import.meta.url),'utf8');
 assert.match(live,/d6-shared-media-live/);
 assert.ok(live.includes("env.D6_M02_MEDIA_ENABLED==='true'"));
 const config=JSON.parse(readFileSync(new URL(
  '../wrangler.direct-gear-private.jsonc',import.meta.url),'utf8'));
 assert.notEqual(config.vars.D6_M02_MEDIA_ENABLED,'true');
 assert.equal(config.r2_buckets,undefined);
});


test('M02 obsolete reference guard rolls back if a D1 link vanished',async()=>{
 const f=fixture({schema:true}),record=records.gear;
 f.seed('gear',record,'Before');
 const before=f.read('gear',record.id);
 const result=await saveD6ContentRevision({
  CONTENT_DB:f.CONTENT_DB,domain:'gear',record,markdown:'After',
  expectedRevision:1,media:[],retiredPaths:[
   'Gear/Lures/assets/gear-unit/notes/not-published.png'],
  syncMedia:true,now:()=>1000,
 });
 assert.equal(result.status,503);
 assert.deepEqual(f.read('gear',record.id),before);
 assert.equal(f.count('d6_media_objects'),0);
 assert.equal(f.count('d6_media_refs'),0);
});
