/**
 * FISH118 P3-15 — narrow, owner-scoped Checking lease reader.
 *
 * D1 lease acquisition is a DB write, never a GitHub write. The only exposed
 * operations are get and claim. No accept, state transition, PR or Git access.
 * No route, deployment, scheduled polling or migration.
 */
const SANDBOX_ID=1430581407;
const OP=/^p3_[0-9a-f-]{36}$/;
const LEASE=/^[A-Za-z0-9_-]{12,96}$/;
const positive=n=>Number.isSafeInteger(n)&&n>0;
export function createD1CheckLeaseReader({
 DB,ownerGitHubId,repositoryId=SANDBOX_ID,
 now=()=>Math.floor(Date.now()/1000),leaseSeconds=60,
}={}){
 if(typeof DB?.prepare!=='function'||!positive(ownerGitHubId)||
  repositoryId!==SANDBOX_ID||typeof now!=='function'||
  !Number.isSafeInteger(leaseSeconds)||leaseSeconds<10||leaseSeconds>300)
  throw Error('INVALID_CHECK_LEASE_CONFIGURATION');
 const sql=(query,...args)=>DB.prepare(query).bind(...args);
 function at(){
  const tick=now();
  if(!Number.isSafeInteger(tick)||tick<0)
   throw Error('INVALID_CHECK_LEASE_CLOCK');
  return tick;
 }
 async function get(operationId){
  if(typeof operationId!=='string'||!OP.test(operationId))
   throw Error('INVALID_CHECK_LEASE_OPERATION');
  const row=await sql(
   'SELECT operation_id,state,pr_number,pr_head_sha,main_base_sha '+
   'FROM p3_operations WHERE operation_id=? AND github_id=? AND repo_id=?',
   operationId,ownerGitHubId,SANDBOX_ID).first();
  return row?Object.freeze({
   operationId:row.operation_id,state:row.state,
   prNumber:row.pr_number,prHeadSha:row.pr_head_sha,
   mainBaseSha:row.main_base_sha,
  }):null;
 }
 async function claim({operationId,leaseOwner}={}){
  if(typeof operationId!=='string'||!OP.test(operationId)||
   typeof leaseOwner!=='string'||!LEASE.test(leaseOwner))
   throw Error('INVALID_CHECK_LEASE_CLAIM');
  const tick=at();
  const row=await sql(
   'UPDATE p3_operations SET lease_owner=?,lease_expires_at=?,updated_at=? '+
   'WHERE operation_id=? AND github_id=? AND repo_id=? AND state=? '+
   'AND (lease_expires_at IS NULL OR lease_expires_at<=?) '+
   'RETURNING operation_id,state,lease_expires_at',
   leaseOwner,tick+leaseSeconds,tick,
   operationId,ownerGitHubId,SANDBOX_ID,'Checking',tick).first();
  return row?Object.freeze({
   operationId:row.operation_id,state:row.state,expiresAt:row.lease_expires_at,
  }):null;
 }
 return Object.freeze({get,claim});
}
