/**
 * FISH118 P3-12 — source-only D1 CI observation and lease release.
 * Requires unapplied migration 0003 (and earlier 0001/0002).
 * One fenced SQL upsert per observation; trigger appends an immutable event.
 * No direct GitHub, token, merge, deployment, or state transition methods.
 */
const ID=1430581407;
const SHA=/^[a-f0-9]{40}$/;
const OP=/^p3_[0-9a-f-]{36}$/;
const OWNER=/^[A-Za-z0-9_-]{12,96}$/;
const MAX_ATTEMPTS=12;
const states=new Set(['retry','pending','review','passed']);
const reason=/^[a-z][a-z0-9_]{0,63}$/;
const branch=id=>'p3-test-'+id.slice(3);
const isNum=x=>Number.isSafeInteger(x)&&x>0;
export class D1CheckError extends Error{
 constructor(code){super('P3 D1 check operation refused');this.name='D1CheckError';this.code=code;}
}
const deny=code=>{throw new D1CheckError(code);};
const check=(yes,code)=>{if(!yes)deny(code);};
const shape=row=>row?Object.freeze({
 operationId:row.operation_id,repositoryId:row.repo_id,
 prNumber:row.pr_number,headSha:row.head_sha,baseSha:row.base_sha,
 branch:row.branch,state:row.state,checkRunId:row.check_run_id,
 reasonCode:row.reason_code,attempts:row.attempts,observedAt:row.observed_at,
 nextPollAt:row.next_poll_at,
}):null;

export function createD1CheckObservationStore({
 DB,ownerGitHubId,repositoryId=ID,now=()=>Math.floor(Date.now()/1000),
}={}){
 check(typeof DB?.prepare==='function'&&isNum(ownerGitHubId)&&repositoryId===ID&&
  typeof now==='function','INVALID_CONFIGURATION');
 const sql=(statement,...params)=>DB.prepare(statement).bind(...params);
 const ts=()=>{const v=now();check(Number.isSafeInteger(v)&&v>=0,'INVALID_CLOCK');return v;};
 const get=async operationId=>{
  check(typeof operationId==='string'&&OP.test(operationId),'INVALID_OPERATION');
  return shape(await sql(
   'SELECT c.* FROM p3_ci_observations c JOIN p3_operations o ON c.operation_id=o.operation_id '+
   'WHERE c.operation_id=? AND o.github_id=? AND o.repo_id=?',
   operationId,ownerGitHubId,ID).first());
 };
 async function record({
  operationId,leaseOwner,prNumber,headSha,baseSha,
  expectedAttempts,state,checkRunId=null,reasonCode=null,nextPollAt=null,
 }={}){
  check(typeof operationId==='string'&&OP.test(operationId)&&
   typeof leaseOwner==='string'&&OWNER.test(leaseOwner)&&isNum(prNumber)&&
   SHA.test(headSha??'')&&SHA.test(baseSha??'')&&headSha!==baseSha&&
   Number.isSafeInteger(expectedAttempts)&&expectedAttempts>=0&&
   expectedAttempts<MAX_ATTEMPTS&&states.has(state),'INVALID_OBSERVATION');
  const at=ts(),attempts=expectedAttempts+1;
  if(state==='passed'){
   check(isNum(checkRunId)&&reasonCode===null&&nextPollAt===null,'INVALID_OBSERVATION');
  }else if(state==='review'){
   check(checkRunId===null&&reason.test(reasonCode??'')&&nextPollAt===null,'INVALID_OBSERVATION');
  }else{
   check(checkRunId===null&&reason.test(reasonCode??'')&&
    Number.isSafeInteger(nextPollAt)&&nextPollAt>at,'INVALID_OBSERVATION');
  }
  const row=await sql(
   'INSERT INTO p3_ci_observations '+
   '(operation_id,repo_id,pr_number,head_sha,base_sha,branch,state,check_run_id,reason_code,attempts,observed_at,next_poll_at) '+
   'SELECT operation_id,repo_id,pr_number,pr_head_sha,main_base_sha,?,?,?,?,?,?,?,? '+
   'FROM p3_operations WHERE operation_id=? AND github_id=? AND repo_id=? AND state=? '+
   'AND lease_owner=? AND lease_expires_at>? AND pr_number=? AND pr_head_sha=? AND main_base_sha=? '+
   'ON CONFLICT(operation_id) DO UPDATE SET '+
   'state=excluded.state,check_run_id=excluded.check_run_id,reason_code=excluded.reason_code,'+
   'attempts=excluded.attempts,observed_at=excluded.observed_at,next_poll_at=excluded.next_poll_at '+
   'WHERE p3_ci_observations.attempts=? AND p3_ci_observations.state IN (?,?) '+
   'AND p3_ci_observations.repo_id=excluded.repo_id '+
   'AND p3_ci_observations.pr_number=excluded.pr_number '+
   'AND p3_ci_observations.head_sha=excluded.head_sha '+
   'AND p3_ci_observations.base_sha=excluded.base_sha '+
   'AND p3_ci_observations.branch=excluded.branch '+
   'RETURNING *',
   branch(operationId),state,checkRunId,reasonCode,attempts,at,nextPollAt,
   operationId,ownerGitHubId,ID,'Checking',leaseOwner,at,prNumber,headSha,baseSha,
   expectedAttempts,'retry','pending').first();
  // A missing row is never permission to assume an earlier write succeeded.
  return shape(row);
 }
 async function release({operationId,leaseOwner}={}){
  check(typeof operationId==='string'&&OP.test(operationId)&&
   typeof leaseOwner==='string'&&OWNER.test(leaseOwner),'INVALID_RELEASE');
  const at=ts();
  const row=await sql(
   'UPDATE p3_operations SET lease_owner=NULL,lease_expires_at=NULL,updated_at=? '+
   'WHERE operation_id=? AND github_id=? AND repo_id=? AND state=? '+
   'AND lease_owner=? AND lease_expires_at>? RETURNING operation_id',
   at,operationId,ownerGitHubId,ID,'Checking',leaseOwner,at).first();
  return row?.operation_id===operationId;
 }
 async function history(operationId){
  check(typeof operationId==='string'&&OP.test(operationId),'INVALID_OPERATION');
  const result=await sql(
   'SELECT a.attempt,a.state,a.check_run_id,a.reason_code,a.observed_at,a.next_poll_at '+
   'FROM p3_ci_observation_audit a JOIN p3_operations o ON o.operation_id=a.operation_id '+
   'WHERE a.operation_id=? AND o.github_id=? AND o.repo_id=? ORDER BY a.attempt',
   operationId,ownerGitHubId,ID).all();
  return Object.freeze((result?.results??[]).map(x=>Object.freeze({
   attempt:x.attempt,state:x.state,checkRunId:x.check_run_id,
   reasonCode:x.reason_code,observedAt:x.observed_at,nextPollAt:x.next_poll_at,
  })));
 }
 return Object.freeze({get,record,release,history});
}
