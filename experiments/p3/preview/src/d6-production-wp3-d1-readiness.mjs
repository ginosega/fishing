/**
 * FISH-TODO-118 WP3 — isolated hosted D1 provisioning/readiness contract.
 *
 * SOURCE ONLY. NO MIGRATIONS ARE APPLIED BY THIS MODULE.
 * The SQL below is imported from the actual immutable-operation, Unknown
 * fence, original-media and five-step publishing/custody components; it is
 * not a second separately maintained database schema.
 *
 * A separately owner-approved operator may use this reviewed plan to
 * provision a DEDICATED isolated WP3 D1, then inspect its exact tables.
 * Never execute these statements against existing WP2 AUTH_DB, the D5 pilot
 * or production without separate scope-specific authorization.
 *
 * "schemaReady" is only a schema inspection result; it is NOT permission
 * for credentials, GitHub writes, route activation, deployment or Live.
 */
import {D6_RECEIPTS_SCHEMA_SQL}
 from './d6-production-operation-receipts.mjs';
import {D6_PROVIDER_STEP_SQL}
 from './d6-production-github-step-writer.mjs';
import {D6_MEDIA_STAGE_PROOF_SQL}
 from './d6-production-media-stage-reconcile.mjs';
import {D6_ATOMIC_TREE_PROOF_SQL}
 from './d6-production-atomic-tree-reconciliation.mjs';
import {D6_PUBLISH_BRANCH_PROOF_SQL}
 from './d6-production-publish-branch-coordinator.mjs';
import {D6_PUBLISH_COMMIT_PROOF_SQL}
 from './d6-production-publish-commit-coordinator.mjs';
import {D6_PUBLISH_COMMIT_CANDIDATE_SQL}
 from './d6-production-commit-candidate-custody.mjs';
import {D6_PUBLISH_ADVANCE_PROOF_SQL}
 from './d6-production-publish-advance-coordinator.mjs';
import {D6_PUBLISH_PR_PROOF_SQL}
 from './d6-production-publish-pr-coordinator.mjs';

const DEFINITIONS=[
 ['d6_operation_receipts',D6_RECEIPTS_SCHEMA_SQL],
 ['d6_provider_step_fences',D6_PROVIDER_STEP_SQL],
 ['d6_media_stage_verified',D6_MEDIA_STAGE_PROOF_SQL],
 ['d6_atomic_tree_verified',D6_ATOMIC_TREE_PROOF_SQL],
 ['d6_publish_branch_verified',D6_PUBLISH_BRANCH_PROOF_SQL],
 ['d6_publish_commit_verified',D6_PUBLISH_COMMIT_PROOF_SQL],
 ['d6_publish_commit_candidates',D6_PUBLISH_COMMIT_CANDIDATE_SQL],
 ['d6_publish_advance_verified',D6_PUBLISH_ADVANCE_PROOF_SQL],
 ['d6_publish_pr_verified',D6_PUBLISH_PR_PROOF_SQL],
];
const NAME=/^[a-z][a-z0-9_]{1,80}$/;
const extractColumns=sql=>sql.split('\n').map(line=>{
 const m=/^\s*([a-z_][a-z_0-9]*)\s+(TEXT|INTEGER)\b/i.exec(line);
 return m?Object.freeze({name:m[1],type:m[2].toUpperCase()}):null;
}).filter(Boolean);
export class D6Wp3D1ReadinessError extends Error{
 constructor(code){
  super('WP3 D1 schema or isolated readiness not verified');
  this.name='D6Wp3D1ReadinessError';this.code=code;
 }
}
const deny=code=>{throw new D6Wp3D1ReadinessError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};

function definition(table,sql){
 need(NAME.test(table)&&typeof sql==='string'&&
  sql.trimStart().startsWith('CREATE TABLE IF NOT EXISTS '+table+' (')&&
  !/\b(?:DROP|ALTER|DELETE|INSERT|UPDATE|REPLACE|ATTACH|DETACH)\b/i.test(sql),
  'UNTRUSTED_SCHEMA_SOURCE');
 const columns=extractColumns(sql),names=columns.map(x=>x.name);
 need(columns.length>=7&&new Set(names).size===names.length&&
  names.includes('operation_id')&&
  names.includes('owner_github_id')&&
  sql.includes(');'),'UNTRUSTED_SCHEMA_SOURCE');
 return Object.freeze({
  table,columns:Object.freeze(columns),
  sql,sourceOnly:true,canApply:false,
 });
}
export const D6_WP3_D1_SCHEMA_PLAN=Object.freeze(
 DEFINITIONS.map(([table,sql])=>definition(table,sql))
);
const ALLOWED=new Set(DEFINITIONS.map(([name])=>name));
const list=(db,sql)=>db.prepare(sql).all();
const schemaIndex='d6_operation_active_record';
const requireRows=value=>need(value&&value.success!==false&&
 Array.isArray(value.results),'SCHEMA_READ_UNKNOWN');

/**
 * Inspect table columns and both unique receipt indexes via read-only
 * SQLite PRAGMAs. Never call D1.run, batch, exec or mutation endpoints.
 * The trusted host supplies the isolated D1 binding AFTER provisioning;
 * this function cannot select a database or authorize provisioning.
 */
export function createD6Wp3D1Readiness({
 DB,enabled=()=>false,
}={}){
 need(typeof enabled==='function','INVALID_CONFIG');
 async function inspect(){
  need(enabled()===true,'DISABLED');
  need(typeof DB?.prepare==='function','DB_UNAVAILABLE');
  for(const entry of D6_WP3_D1_SCHEMA_PLAN){
   need(ALLOWED.has(entry.table),'UNTRUSTED_SCHEMA_SOURCE');
   let actual;
   try{
    actual=await list(DB,'PRAGMA table_info("'+entry.table+'")');
   }catch{deny('SCHEMA_READ_UNKNOWN');}
   requireRows(actual);
   const found=actual.results.map(row=>({
    name:row?.name,type:row?.type?.toUpperCase?.(),
   }));
   need(JSON.stringify(found)===JSON.stringify(entry.columns),
    'SCHEMA_MISMATCH');
  }
  // A receipt without both uniqueness gates allows conflicting duplicate
  // Saves to be accepted, even if its columns appear correct.
  let idx;
  try{
   idx=await list(DB,
    'PRAGMA index_list("d6_operation_receipts")');
  }catch{deny('SCHEMA_READ_UNKNOWN');}
  requireRows(idx);
  const indices=idx.results.filter(row=>
   row&&row.unique===1&&
   typeof row.name==='string'&&NAME.test(row.name));
  let key=false,active=false;
  for(const index of indices){
   let info;
   try{
    info=await list(DB,'PRAGMA index_info("'+index.name+'")');
   }catch{deny('SCHEMA_READ_UNKNOWN');}
   requireRows(info);
   const names=info.results.map(x=>x?.name);
   if(names.join(',')==='owner_github_id,idempotency_key'&&
    index.partial===0)key=true;
   if(index.name===schemaIndex&&index.partial===1&&
    names.join(',')==='owner_github_id,domain,record_id')active=true;
  }
  need(key&&active,'RECEIPT_UNIQUENESS_UNVERIFIED');
  need(enabled()===true,'DISABLED');
  return Object.freeze({
   schemaReady:true,tableCount:D6_WP3_D1_SCHEMA_PLAN.length,
   receiptsUnique:true,activeRecordUnique:true,
   sourceOnly:true,canApply:false,
   writeAuthorized:false,canPublish:false,isLive:false,
   requiresSeparateOwnerApproval:true,
  });
 }
 return Object.freeze({inspect});
}
