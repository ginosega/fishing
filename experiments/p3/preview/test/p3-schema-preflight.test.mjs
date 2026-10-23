import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {auditP3SchemaPreflight,readP3SchemaMetadata}
 from '../src/p3-schema-preflight.mjs';

const DIR=new URL('../migrations/',import.meta.url);
const schema=()=>new DatabaseSync(':memory:');
const apply=(db,name)=>db.exec(readFileSync(new URL(name,DIR),'utf8'));
const INVENTORY_SQL="SELECT type,name,sql FROM sqlite_master WHERE sql IS NOT NULL AND name LIKE 'p3_%' ORDER BY name";
const schemaRows=db=>db.prepare(INVENTORY_SQL).all();
const UUID='12345678-1234-4123-8123-123456789abc';
const target={databaseName:'fishing-p3-sandbox',
 selectedDatabaseId:UUID,workerBindingDatabaseId:UUID};
const led=[{name:'0001_initial.sql'}];
function reference(){
 const db=schema();
 apply(db,'0001_initial.sql');
 return {db,source0001:schemaRows(db)};
}
const audit=(input={})=>{
 const ref=reference();
 const result=auditP3SchemaPreflight({
  target,source0001:ref.source0001,observedSchema:ref.source0001,
  wranglerLedger:led,...input,
 });
 ref.db.close();
 return result;
};
test('P3-M01 exact manually established 0001 plus tracked ledger is only owner-review ready, never approved to apply',()=>{
 const result=audit();
 assert.equal(result.status,'READY_FOR_OWNER_REVIEW');
 assert.equal(result.verified0001,true);
 assert.equal(result.safeToApply,false);
 assert.equal(result.needsOwnerReview,true);
 assert.deepEqual(result.blockers,[]);
});
test('P3-M02 manually initialized 0001 with NO Wrangler ledger is blocked',()=>{
 for(const ledger of [null,[],undefined]){
  const result=audit({wranglerLedger:ledger});
  assert.equal(result.status,'BLOCKED');
  assert(result.blockers.some(x=>['WRANGLER_LEDGER_MISSING','MANUAL_0001_UNTRACKED'].includes(x)));
  assert.equal(result.safeToApply,false);
 }
});
test('P3-M03 wrong or unverified account-selected D1 binding refuses approval',()=>{
 const edits=[
  {databaseName:'auth-p0'},
  {workerBindingDatabaseId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},
  {selectedDatabaseId:'NOT-A-UUID'},
  {workerBindingDatabaseId:null},
 ];
 for(const edit of edits){
  const result=audit({target:{...target,...edit}});
  assert.equal(result.status,'BLOCKED');
  assert(result.blockers.includes('WRONG_OR_UNVERIFIED_D1_TARGET'));
 }
});
test('P3-M04 incomplete or drifted manually applied 0001 can never be called verified',()=>{
 const source=reference();const rows=source.source0001;
 const missing=rows.filter(x=>x.name!=='p3_events');
 const changed=rows.map(x=>x.name==='p3_operations'?{...x,sql:x.sql.replace('created_at INTEGER','created_at TEXT')}:x);
 for(const current of [missing,changed,[],[...rows,{type:'table',name:'p3_surprise',sql:'CREATE TABLE p3_surprise(x)'}]]){
  const out=audit({observedSchema:current});
  assert.equal(out.status,'BLOCKED');
  assert.equal(out.verified0001,false);
 }
 source.db.close();
});
test('P3-M05 previously applied 0002/0003, duplicate ledger or unknown migrations stop review',()=>{
 for(const ledger of [
  [{name:'0001_initial.sql'},{name:'0002_durable_snapshot_and_audit.sql'}],
  [{name:'0001_initial.sql'},{name:'0003_ci_observation_recovery.sql'}],
  [{name:'0001_initial.sql'},{name:'0001_initial.sql'}],
  [{name:'0001_initial.sql'},{name:'unknown.sql'}],
  [{name:12}],
 ]){
  const out=audit({wranglerLedger:ledger});
  assert.equal(out.status,'BLOCKED');
  assert(out.blockers.length>0);
 }
});
test('P3-M06 partially applied 0002 or 0003 objects are detected as unexpected P3 schema',()=>{
 const r=reference();
 const db=schema();apply(db,'0001_initial.sql');
 apply(db,'0002_durable_snapshot_and_audit.sql');
 assert(audit({source0001:r.source0001,observedSchema:schemaRows(db)}).blockers.includes('UNEXPECTED_P3_OBJECT'));
 apply(db,'0003_ci_observation_recovery.sql');
 assert(audit({source0001:r.source0001,observedSchema:schemaRows(db)}).blockers.includes('UNEXPECTED_P3_OBJECT'));
 db.close();r.db.close();
});
test('P3-M07 no caller can replace pinned six-object 0001 reference with a manipulated remote schema',()=>{
 const r=reference();
 for(const malicious of [[],r.source0001.slice(0,5),
  [...r.source0001,{name:'p3_fake',type:'table',sql:'CREATE TABLE p3_fake(id)'}]]){
  const out=audit({source0001:malicious,observedSchema:malicious});
  assert.equal(out.status,'BLOCKED');
  assert(out.blockers.includes('UNTRUSTED_0001_REFERENCE'));
 }
 r.db.close();
});
test('P3-M08 metadata reader issues ONLY schema and migration SELECTs, no data reads or DDL',async()=>{
 const db=schema();apply(db,'0001_initial.sql');
 const sql=[];
 const DB={prepare(query){
  sql.push(query);
  return {all:async()=>({results:db.prepare(query).all()}),
   first:async()=>db.prepare(query).get()};
 }};
 const result=await readP3SchemaMetadata({DB});
 assert.equal(result.observedSchema.length,6);
 assert.equal(result.wranglerLedger,null);
 assert.equal(sql.length,2);
 assert(sql.every(query=>/^\s*SELECT\b/i.test(query)));
 assert(sql.every(query=>!/\bp3_operations\b|\bp3_requests\b/.test(query)));
 assert.equal(audit({observedSchema:result.observedSchema,
  wranglerLedger:result.wranglerLedger}).safeToApply,false);
 db.exec('CREATE TABLE d1_migrations(id INTEGER PRIMARY KEY,name TEXT NOT NULL);');
 db.prepare('INSERT INTO d1_migrations(name) VALUES(?)').run('0001_initial.sql');
 const second=await readP3SchemaMetadata({DB});
 assert.deepEqual(second.wranglerLedger,led);
 db.close();
});
test('P3-M09 malformed remote SQL, duplicate objects and impossible ledger shape fail closed',()=>{
 const base=reference();
 const rows=base.source0001;
 for(const malformed of [
  [...rows,{name:'p3_sessions',type:'table',sql:'CREATE TABLE p3_sessions(x)'}],
  [{name:'p3_$bad',type:'table',sql:'CREATE TABLE p3_$bad(x)'}],
  [{name:'p3_events',type:'view',sql:'CREATE VIEW p3_events AS SELECT 1'}],
  [{name:'p3_events',type:'table',sql:null}],
 ]){
  const a=audit({observedSchema:malformed});
  assert.equal(a.status,'BLOCKED');
  assert(a.blockers.length>0);
 }
 base.db.close();
});
test('P3-M10 no migration execution or remote Cloudflare access is exported',()=>{
 assert.equal(typeof auditP3SchemaPreflight,'function');
 assert.equal(typeof readP3SchemaMetadata,'function');
 const only=audit();
 assert.equal('apply' in only,false);
 assert.equal('execute' in only,false);
 assert.equal(only.safeToApply,false);
});
