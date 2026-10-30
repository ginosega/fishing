import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {auditP3SchemaPreflight} from '../src/p3-schema-preflight.mjs';
import {assessP3Manual0001Reconciliation}
 from '../src/p3-migration-reconciliation.mjs';

const path=new URL('../migrations/',import.meta.url);
const read=name=>readFileSync(new URL(name,path),'utf8');
const ONE='0001_initial.sql',TWO='0002_durable_snapshot_and_audit.sql',
 THREE='0003_ci_observation_recovery.sql';
const UUID='12345678-1234-4123-8123-123456789abc';
const TARGET={databaseName:'fishing-p3-sandbox',selectedDatabaseId:UUID,
 workerBindingDatabaseId:UUID};
const sql=db=>db.prepare(
 "SELECT type,name,sql FROM sqlite_master WHERE name LIKE 'p3_%' AND sql IS NOT NULL ORDER BY name"
).all();
const count=(db,table)=>db.prepare('SELECT count(*) AS n FROM '+table).get().n;
const objectNames=db=>sql(db).map(row=>row.name);
const makeDb=()=>{
 const db=new DatabaseSync(':memory:');
 db.exec('PRAGMA foreign_keys=ON;');
 db.exec(read(ONE));return db;
};
const baseline=makeDb();
const EXPECTED=sql(baseline);
baseline.close();
const audit=(db,ledger=null)=>auditP3SchemaPreflight({
 target:TARGET,source0001:EXPECTED,
 observedSchema:sql(db),wranglerLedger:ledger,
});
const flags={databaseName:'fishing-p3-sandbox',dbBindingMatches:true,
 writeDisabled:true,hostedSentinelDisabled:true,foreignKeysClear:true,
 timeTravelBookmarkAvailable:true,
 tableCounts:{p3_sessions:0,p3_operations:0,p3_events:0}};
const check=(db,more={})=>assessP3Manual0001Reconciliation({
 preflight:audit(db),...flags,...more,
});
const accepted=(db,id='p3_00000001-1111-4111-8111-123456789abc')=>{
 db.prepare('INSERT INTO p3_operations (operation_id,github_id,repo_id,idempotency_key_hash,payload_sha256,state,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)')
 .run(id,778899,1430581407,'a'.repeat(64),'b'.repeat(64),'Accepted',1800000000,1800000000);
 return id;
};

test('P3-L01 actual manual 0001 without Wrangler ledger is reviewable only after empty-row proof',()=>{
 const db=makeDb();
 try{
  const pre=audit(db);
  assert.deepEqual(pre.blockers,['WRANGLER_LEDGER_MISSING']);
  assert.equal(pre.verified0001,true);
  assert.equal(check(db).status,'OPERATOR_REVIEW_ONLY');
  assert.equal(check(db).safeToApply,false);
  assert.equal(check(db).requiresSeparateOwnerApproval,true);
  assert.equal(check(db).canMerge,false);
  assert.equal(check(db).canDeploy,false);
 }finally{db.close();}
});

test('P3-L02 original 0001 replay is an idempotent SQLite no-op when exact schema already exists',()=>{
 const db=makeDb();
 try{
  const before=sql(db),tables=objectNames(db);
  db.exec(read(ONE));
  assert.deepEqual(sql(db),before);
  assert.deepEqual(objectNames(db),tables);
  assert.equal(audit(db).verified0001,true);
  assert.equal(count(db,'p3_events'),0);
 }finally{db.close();}
});

test('P3-L03 SQLite replay preserves already-present session and operation data (but planner refuses nonempty)',()=>{
 const db=makeDb();
 try{
  db.prepare('INSERT INTO p3_sessions(token_hash,github_id,csrf_hash,expires_at,created_at) VALUES(?,?,?,?,?)')
   .run('a'.repeat(64),778899,'b'.repeat(64),1800000200,1800000000);
  accepted(db);
  assert.equal(check(db,{tableCounts:{p3_sessions:1,p3_operations:1,p3_events:0}}).status,'HALT');
  assert(check(db,{tableCounts:{p3_sessions:1,p3_operations:1,p3_events:0}})
   .blockers.includes('DURABLE_ROWS_NOT_CONFIRMED_EMPTY'));
  const before=[db.prepare('SELECT * FROM p3_sessions').all(),db.prepare('SELECT * FROM p3_operations').all()];
  db.exec(read(ONE));
  assert.deepEqual(db.prepare('SELECT * FROM p3_sessions').all(),before[0]);
  assert.deepEqual(db.prepare('SELECT * FROM p3_operations').all(),before[1]);
 }finally{db.close();}
});

test('P3-L04 missing, stale or out-of-order owner safety proofs halt before any migration',()=>{
 const db=makeDb();
 try{
  const variants=[
   {dbBindingMatches:false},{writeDisabled:false},
   {hostedSentinelDisabled:false},{foreignKeysClear:false},
   {timeTravelBookmarkAvailable:false},{tableCounts:undefined},
   {tableCounts:{p3_sessions:0,p3_operations:1,p3_events:0}},
   {tableCounts:{p3_sessions:0,p3_operations:0,p3_events:0,unknown:0}},
   {databaseName:'auth-p0'},
  ];
  for(const v of variants){
   const outcome=check(db,v);
   assert.equal(outcome.status,'HALT',JSON.stringify(v));
   assert(outcome.blockers.length);
   assert.equal(outcome.safeToApply,false);
  }
 }finally{db.close();}
});

test('P3-L05 schema drift or partially applied migration halts, despite IF NOT EXISTS',()=>{
 const db=makeDb();
 try{
  db.exec('CREATE TABLE p3_accidental (n INTEGER);');
  assert.equal(check(db).status,'HALT');
  db.exec('DROP TABLE p3_accidental;');
  db.exec('DROP INDEX p3_events_operation;');
  assert.equal(check(db).status,'HALT');
  // No attempt to heal the wrong source schema by blind remote replay.
  db.exec('CREATE INDEX p3_events_operation ON p3_events(operation_id,event_at);');
  db.exec(read(TWO));
  assert.equal(check(db).status,'HALT');
 }finally{db.close();}
});

test('P3-L06 staged 0001 replay then true migration 0002/0003 yields expected constraints and audit',()=>{
 const db=makeDb();
 try{
  const empty=objectNames(db),initialSchema=sql(db);
  db.exec(read(ONE));
  assert.deepEqual(sql(db),initialSchema);
  // Test-only illustrative ledger; NOT claimed to be Wrangler's actual implementation.
  db.exec('CREATE TABLE fixture_migration_names(name TEXT PRIMARY KEY);');
  const record=name=>db.prepare('INSERT INTO fixture_migration_names(name) VALUES(?)').run(name);
  record(ONE);
  assert.deepEqual(objectNames(db),empty);
  assert.equal(audit(db,[{name:ONE}]).status,'READY_FOR_OWNER_REVIEW');

  db.exec(read(TWO));record(TWO);
  for(const name of ['p3_requests','p3_operation_accepted_audit',
   'p3_operation_transition_guard','p3_operation_transition_audit'])
   assert(objectNames(db).includes(name),name);
  const id=accepted(db);
  assert.equal(db.prepare('SELECT count(*) AS n FROM p3_events WHERE event_type=?').get('accepted').n,1);
  db.prepare('UPDATE p3_operations SET state=?,updated_at=? WHERE operation_id=?')
   .run('Validating',1800000001,id);
  assert.equal(db.prepare('SELECT count(*) AS n FROM p3_events WHERE event_type=?').get('transition').n,1);
  assert.throws(()=>db.prepare('UPDATE p3_operations SET state=? WHERE operation_id=?')
   .run('Live',id),/invalid_p3_state_transition/);
  db.exec(read(THREE));record(THREE);
  for(const name of ['p3_ci_observations','p3_ci_observation_audit',
   'p3_ci_observation_insert_audit','p3_ci_observation_update_audit'])
   assert(objectNames(db).includes(name),name);
  db.prepare('INSERT INTO p3_ci_observations (operation_id,repo_id,pr_number,head_sha,base_sha,branch,state,check_run_id,attempts,observed_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
   .run(id,1430581407,17,'c'.repeat(40),'d'.repeat(40),
    'p3-test-'+id.slice(3),'passed',101,1,1800000002);
  assert.equal(count(db,'p3_ci_observation_audit'),1);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  assert.deepEqual(db.prepare('SELECT name FROM fixture_migration_names ORDER BY name').all()
   .map(v=>v.name),[ONE,TWO,THREE]);
 }finally{db.close();}
});

test('P3-L07 a failed staged SQL transaction restores prior schema; do not infer remote success',()=>{
 const db=makeDb();
 try{
  const before=sql(db);
  db.exec('BEGIN IMMEDIATE;');
  try{
   db.exec(read(TWO));
   db.exec('INSERT INTO table_that_does_not_exist(x) VALUES(1);');
   assert.fail('expected failure');
  }catch(error){
   assert.match(error.message,/no such table/);
   db.exec('ROLLBACK;');
  }
  assert.deepEqual(sql(db),before);
  assert(!objectNames(db).includes('p3_requests'));
  assert.equal(check(db).status,'OPERATOR_REVIEW_ONLY');
 }finally{db.close();}
});

test('P3-L08 rejection of any irregular migration ledger or reconciled-without-schema state',()=>{
 const db=makeDb();
 try{
  for(const ledger of [
   [],[{name:ONE}],[{name:ONE},{name:TWO}],
   [{name:THREE}],[{name:'unknown.sql'}],
  ]){
   const pre=audit(db,ledger);
   assert.equal(assessP3Manual0001Reconciliation({...flags,preflight:pre}).status,'HALT',
    JSON.stringify(ledger));
  }
 }finally{db.close();}
});

test('P3-L09 reconciliation plan has no remote action method or SQL/GitHub credentials',()=>{
 const db=makeDb();
 try{
  const out=check(db);
  assert.deepEqual(Object.keys(out),[
   'status','blockers','stages','safeToApply',
   'requiresSeparateOwnerApproval','canDeploy','canMerge',
  ]);
  assert.equal(out.stages.length,8);
  assert.equal(typeof out.apply,'undefined');
  assert.equal(typeof out.deploy,'undefined');
  assert.equal(out.safeToApply,false);
  const source=readFileSync(new URL('../src/p3-migration-reconciliation.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(source,/from\s+['"](?:node:fs|node:child_process)/);
  assert.doesNotMatch(source,/\b(?:fetch\s*\(|INSERT\s+INTO|CREATE\s+TABLE|DROP\s+TABLE|wrangler\s+d1)\b/);
 }finally{db.close();}
});
