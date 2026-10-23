/**
 * FISH118 P3-15 — source-only, metadata-only, fail-closed D1 preflight.
 *
 * Never issues DDL/DML, touches Cloudflare remotely, manages Wrangler's
 * migration ledger, or declares a migration safe to APPLY. A trusted caller
 * supplies the expected sqlite_master schema generated from exact pinned 0001
 * source in a fresh local SQLite fixture. DB is an existing *read-only-intent*
 * D1 binding; the caller must independently verify the Cloudflare account.
 *
 * No account IDs, UUIDs, SQL text or sensitive rows are returned.
 */
const SAFE_NAME=/^[a-z][a-z0-9_]{0,80}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const migrationNames=['0001_initial.sql','0002_durable_snapshot_and_audit.sql',
 '0003_ci_observation_recovery.sql'];
const normalize=s=>typeof s==='string'?s.trim().replace(/;+$/,'')
 .replace(/\s+/g,' ').replace(/\s*([(),=])\s*/g,'$1').toLowerCase():null;
const shape=rows=>Array.isArray(rows)&&rows.every(row=>
 row&&typeof row.name==='string'&&SAFE_NAME.test(row.name)&&
 ['table','index','trigger'].includes(row.type)&&typeof row.sql==='string'&&
 row.sql.trim().length>0);
const required=['p3_sessions','p3_operations','p3_events','p3_sessions_owner_expiry',
 'p3_operations_state_lease','p3_events_operation'];

/**
 * Independent, pinned six-object definition from 0001_initial.sql. A caller
 * cannot claim an altered local reference is canonical by copying the remote
 * schema into the expected list. Changes to 0001 require source review here.
 */
const PINNED_0001=Object.freeze({
 p3_sessions:[
  'table',String.raw`CREATE TABLE IF NOT EXISTS p3_sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  github_id INTEGER NOT NULL,
  csrf_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
 )`,
 ],
 p3_sessions_owner_expiry:[
  'index','CREATE INDEX IF NOT EXISTS p3_sessions_owner_expiry ON p3_sessions(github_id,expires_at)',
 ],
 p3_operations:[
  'table',String.raw`CREATE TABLE IF NOT EXISTS p3_operations (
  operation_id TEXT PRIMARY KEY NOT NULL,
  github_id INTEGER NOT NULL,
  repo_id INTEGER NOT NULL,
  idempotency_key_hash TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('Accepted','Validating','Checking','Merging','Deploying','Verifying','Live','Conflict','Failed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  lease_owner TEXT,
  lease_expires_at INTEGER,
  pr_number INTEGER,
  pr_head_sha TEXT,
  main_base_sha TEXT,
  merge_sha TEXT,
  workflow_run_id INTEGER,
  verified_release_id TEXT,
  reason_code TEXT,
  UNIQUE(github_id,repo_id,idempotency_key_hash)
 )`,
 ],
 p3_operations_state_lease:[
  'index','CREATE INDEX IF NOT EXISTS p3_operations_state_lease ON p3_operations(state,lease_expires_at)',
 ],
 p3_events:[
  'table',String.raw`CREATE TABLE IF NOT EXISTS p3_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT NOT NULL REFERENCES p3_operations(operation_id),
  event_type TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT,
  event_at INTEGER NOT NULL,
  error_code TEXT,
  details_digest TEXT
 )`,
 ],
 p3_events_operation:[
  'index','CREATE INDEX IF NOT EXISTS p3_events_operation ON p3_events(operation_id,event_at)',
 ],
});

const output=(status,blockers,extra={})=>Object.freeze({
 status,blockers:Object.freeze([...new Set(blockers)]),
 safeToApply:false,needsOwnerReview:true,...extra,
});

export function auditP3SchemaPreflight({
 target,source0001,observedSchema,wranglerLedger,
}={}){
 const blockers=[];
 const add=x=>blockers.push(x);
 if(target?.databaseName!=='fishing-p3-sandbox'||
   typeof target?.selectedDatabaseId!=='string'||
   !UUID.test(target.selectedDatabaseId)||
   typeof target?.workerBindingDatabaseId!=='string'||
   target.workerBindingDatabaseId!==target.selectedDatabaseId)
  add('WRONG_OR_UNVERIFIED_D1_TARGET');
 if(!shape(source0001)||!shape(observedSchema)){
  add('INVALID_SCHEMA_INVENTORY');
  return output('BLOCKED',blockers);
 }
 const toMap=(rows,kind)=>{
  const result=new Map();
  for(const row of rows){
   if(result.has(row.name))add(kind+'_DUPLICATE_OBJECT');
   result.set(row.name,{type:row.type,sql:normalize(row.sql)});
  }
  return result;
 };
 const expected=toMap(source0001,'SOURCE');
 const actual=toMap(observedSchema,'REMOTE');
 if(expected.size!==6||required.some(name=>!expected.has(name))||
   [...expected.keys()].some(name=>!required.includes(name))||
   Object.entries(PINNED_0001).some(([name,[type,sql]])=>
    expected.get(name)?.type!==type||expected.get(name)?.sql!==normalize(sql)))
  add('UNTRUSTED_0001_REFERENCE');
 for(const [name,definition] of expected){
  const found=actual.get(name);
  if(!found)add('MISSING_0001_OBJECT');
  else if(found.type!==definition.type||found.sql!==definition.sql)
   add('0001_SCHEMA_DRIFT');
 }
 for(const name of actual.keys()){
  if(!expected.has(name))add('UNEXPECTED_P3_OBJECT');
 }
 // The migration ledger may be absent because 0001 was created in the
 // Cloudflare console. That is NOT permission to blindly apply 0001 again.
 if(wranglerLedger===null||wranglerLedger===undefined){
  add('WRANGLER_LEDGER_MISSING');
 }else if(!Array.isArray(wranglerLedger)||
  wranglerLedger.some(x=>!x||typeof x.name!=='string')){
  add('INVALID_WRANGLER_LEDGER');
 }else{
  const names=wranglerLedger.map(x=>x.name);
  if(new Set(names).size!==names.length)add('DUPLICATE_MIGRATION_ENTRY');
  if(names.some(name=>!migrationNames.includes(name)))add('UNKNOWN_MIGRATION_ENTRY');
  if(!names.includes('0001_initial.sql'))add('MANUAL_0001_UNTRACKED');
  if(names.includes('0002_durable_snapshot_and_audit.sql')||
    names.includes('0003_ci_observation_recovery.sql'))
   add('MIGRATION_LEDGER_SCHEMA_MISMATCH');
 }
 return output(blockers.length?'BLOCKED':'READY_FOR_OWNER_REVIEW',blockers,{
  verified0001:!blockers.some(x=>x==='0001_SCHEMA_DRIFT'||
   x==='MISSING_0001_OBJECT'||x==='UNEXPECTED_P3_OBJECT'||
   x==='UNTRUSTED_0001_REFERENCE'||x==='INVALID_SCHEMA_INVENTORY'),
  migrationFilesStillRequireSeparateApproval:true,
 });
}

export async function readP3SchemaMetadata({DB}={}){
 if(typeof DB?.prepare!=='function')throw Error('INVALID_SCHEMA_READER');
 // Fixed SELECTs only. Never fetch application data, GitHub/App credentials,
 // operation snapshots, or Cloudflare environment configuration.
 const schema=await DB.prepare(
  "SELECT type,name,sql FROM sqlite_master WHERE sql IS NOT NULL AND "+
  "(name LIKE 'p3_%') ORDER BY name").all();
 const rows=schema?.results;
 if(!Array.isArray(rows))throw Error('MALFORMED_SCHEMA_READ');
 const ledgerExists=await DB.prepare(
  "SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name='d1_migrations'"
 ).first();
 if(!Number.isSafeInteger(ledgerExists?.n)||ledgerExists.n<0||
    ledgerExists.n>1)throw Error('MALFORMED_LEDGER_METADATA');
 let ledger=null;
 if(ledgerExists.n===1){
  const details=await DB.prepare(
   'SELECT name FROM d1_migrations ORDER BY id').all();
  if(!Array.isArray(details?.results))throw Error('MALFORMED_LEDGER_READ');
  ledger=details.results.map(r=>({name:r.name}));
 }
 return Object.freeze({observedSchema:rows,wranglerLedger:ledger});
}
