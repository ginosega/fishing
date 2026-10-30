/**
 * P3-3 source-only durable persistence adapter. NOT ROUTED OR DEPLOYED.
 * Requires the 0001 and 0002 migrations on an isolated P3 D1 database.
 * Never accepts a browser-provided owner identity; caller supplies trusted config.
 * No credentials, tokens, GitHub API calls, merge or publish capability.
 *
 * Snapshot is intentionally limited to a small, text-only Gear/KB test package.
 * The full source-aware validator and durable media staging are NOT implemented.
 */
const SANDBOX_ID=1430581407;
const MAX_SNAPSHOT_BYTES=128*1024;
const states=new Set(['Accepted','Validating','Checking','Merging','Deploying','Verifying','Live','Conflict','Failed']);
const terminals=new Set(['Live','Conflict','Failed']);
const nextStates={
 Accepted:['Validating','Failed'],
 Validating:['Checking','Conflict','Failed'],
 Checking:['Merging','Conflict','Failed'],
 Merging:['Deploying','Conflict','Failed'],
 Deploying:['Verifying','Failed'],
 Verifying:['Live','Failed'],
};
const columns={
 prNumber:['pr_number',v=>Number.isSafeInteger(v)&&v>0],
 prHeadSha:['pr_head_sha',v=>typeof v==='string'&&/^[0-9a-f]{40}$/.test(v)],
 mainBaseSha:['main_base_sha',v=>typeof v==='string'&&/^[0-9a-f]{40}$/.test(v)],
 mergeSha:['merge_sha',v=>typeof v==='string'&&/^[0-9a-f]{40}$/.test(v)],
 workflowRunId:['workflow_run_id',v=>Number.isSafeInteger(v)&&v>0],
 verifiedReleaseId:['verified_release_id',v=>typeof v==='string'&&/^[0-9a-f]{32}$/.test(v)],
 reasonCode:['reason_code',v=>typeof v==='string'&&/^[a-z][a-z0-9_]{0,63}$/.test(v)],
};
export class DurableStoreError extends Error {
 constructor(code){super('P3 durable store refused operation');this.name='DurableStoreError';this.code=code;}
}
const deny=code=>{throw new DurableStoreError(code);};
const check=(okay,code)=>{if(!okay)deny(code);};
const numberId=n=>Number.isSafeInteger(n)&&n>0;
const opId=s=>typeof s==='string'&&/^p3_[0-9a-f-]{36}$/.test(s);
const token=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{12,96}$/.test(s);
const sha256=async value=>{
 const bytes=typeof value==='string'?new TextEncoder().encode(value):value;
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
};
function canonical(value){
 if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
 if(typeof value==='number'){
  check(Number.isFinite(value),'INVALID_SNAPSHOT');
  return JSON.stringify(value);
 }
 if(Array.isArray(value))return '['+value.map(item=>canonical(item)).join(',')+']';
 check(value&&typeof value==='object'&&Object.getPrototypeOf(value)===Object.prototype,'INVALID_SNAPSHOT');
 const keys=Object.keys(value).sort();
 check(keys.every(key=>value[key]!==undefined && key!=='__proto__'&&key!=='constructor'&&key!=='prototype'),'INVALID_SNAPSHOT');
 return '{'+keys.map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';
}
const resultRow=q=>q?.results?.[0]??null;
const opSelect='SELECT operation_id,github_id,repo_id,idempotency_key_hash,payload_sha256,state,created_at,updated_at,lease_owner,lease_expires_at,pr_number,pr_head_sha,main_base_sha,merge_sha,workflow_run_id,verified_release_id,reason_code FROM p3_operations';
function publicRecord(row){
 if(!row)return null;
 return {
  operationId:row.operation_id,state:row.state,
  prNumber:row.pr_number??null,prHeadSha:row.pr_head_sha??null,
  mainBaseSha:row.main_base_sha??null,mergeSha:row.merge_sha??null,
  workflowRunId:row.workflow_run_id??null,verifiedReleaseId:row.verified_release_id??null,
  reasonCode:row.reason_code??null,
 };
}
function verifySubmission(snapshot){
 check(snapshot && Object.getPrototypeOf(snapshot)===Object.prototype,'INVALID_SNAPSHOT');
 check(snapshot.package && Object.getPrototypeOf(snapshot.package)===Object.prototype,'INVALID_SNAPSHOT');
 check(snapshot.package.format==='fishing-companion-change-v2' &&
  ['gear','kb','catches'].includes(snapshot.package.domain) &&
  ['add','edit'].includes(snapshot.package.operation),'INVALID_SNAPSHOT');
 check(Array.isArray(snapshot.media)&&snapshot.media.length<=24&&
  snapshot.media.every(t=>t&&Object.getPrototypeOf(t)===Object.prototype&&
   Object.keys(t).sort().join(',')===
   'blobSha,bytes,expiresAt,mime,path,sha256,signature'&&
   typeof t.path==='string'&&t.path.length<=240&&
   Number.isSafeInteger(t.bytes)&&t.bytes>0&&t.bytes<=10*1024*1024&&
   /^[a-f0-9]{40}$/.test(t.blobSha)&&
   /^[a-f0-9]{64}$/.test(t.sha256)&&
   /^[A-Za-z0-9_-]{43}$/.test(t.signature)&&
   Number.isSafeInteger(t.expiresAt)&&
   typeof t.mime==='string'&&t.mime.length<=40),'MEDIA_STAGING_REQUIRED');
 check(snapshot.media.length===0||
  ['gear','kb'].includes(snapshot.package.domain),'MEDIA_STAGING_REQUIRED');
 // This is an envelope check, NOT full source-aware or canonical validation.
}
function requireDetails(from,to,fields){
 if(to==='Checking')check(fields.prNumber!=null&&fields.prHeadSha!=null&&fields.mainBaseSha!=null,'MISSING_PR_EVIDENCE');
 if(to==='Deploying')check(fields.mergeSha!=null,'MISSING_MERGE_EVIDENCE');
 if(to==='Live')check(fields.verifiedReleaseId!=null&&fields.workflowRunId!=null,'MISSING_HOSTED_EVIDENCE');
 if(['Failed','Conflict'].includes(to))check(fields.reasonCode!=null,'MISSING_REASON');
}
export function createD1OperationStore({DB,ownerGitHubId,repositoryId=SANDBOX_ID,now=()=>Math.floor(Date.now()/1000),
 leaseSeconds=60,makeId=()=> 'p3_'+crypto.randomUUID()}={}){
 check(DB?.prepare&&DB?.batch&&numberId(ownerGitHubId)&&repositoryId===SANDBOX_ID,'INVALID_CONFIGURATION');
 check(Number.isSafeInteger(leaseSeconds)&&leaseSeconds>=10&&leaseSeconds<=300,'INVALID_CONFIGURATION');
 const ts=()=>{const value=now();check(Number.isSafeInteger(value)&&value>=0,'INVALID_CLOCK');return value;};
 const sql=(query,...args)=>DB.prepare(query).bind(...args);
 async function get(operationId){
  check(opId(operationId),'INVALID_OPERATION_ID');
  const row=await sql(opSelect+' WHERE operation_id=? AND github_id=? AND repo_id=?',operationId,ownerGitHubId,SANDBOX_ID).first();
  return publicRecord(row);
 }
 // Owner-scoped, read-only latest receipt. Cross-device publication status
 // must not depend on the original submitting browser's local storage.
 async function latest(){
  const row=await sql(opSelect+
   ' WHERE github_id=? AND repo_id=? ORDER BY created_at DESC,operation_id DESC LIMIT 1',
   ownerGitHubId,SANDBOX_ID).first();
  return publicRecord(row);
 }
 async function accept({idempotencyKey,snapshot}={}){
  check(token(idempotencyKey),'INVALID_IDEMPOTENCY_KEY');
  verifySubmission(snapshot);
  let payload;
  try{payload=canonical(snapshot);}catch(e){if(e instanceof DurableStoreError)throw e;deny('INVALID_SNAPSHOT');}
  check(new TextEncoder().encode(payload).byteLength<=MAX_SNAPSHOT_BYTES,'SNAPSHOT_TOO_LARGE');
  const payloadHash=await sha256(payload);
  const keyHash=await sha256(ownerGitHubId+':'+SANDBOX_ID+':'+idempotencyKey);
  const at=ts(),candidate=makeId();
  check(opId(candidate),'INVALID_OPERATION_ID');
  // D1.batch() is an atomic transaction. The snapshot insert depends on
  // the operation row having been inserted by THIS request. SQLite triggers
  // insert exactly one accepted event in the same transaction.
  await DB.batch([
   sql('INSERT INTO p3_operations(operation_id,github_id,repo_id,idempotency_key_hash,payload_sha256,state,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(github_id,repo_id,idempotency_key_hash) DO NOTHING',
     candidate,ownerGitHubId,SANDBOX_ID,keyHash,payloadHash,'Accepted',at,at),
   sql('INSERT INTO p3_requests(operation_id,request_json,payload_sha256,created_at) SELECT operation_id,?,?,? FROM p3_operations WHERE operation_id=? AND github_id=? AND repo_id=? AND payload_sha256=? ON CONFLICT(operation_id) DO NOTHING',
     payload,payloadHash,at,candidate,ownerGitHubId,SANDBOX_ID,payloadHash),
  ]);
  const row=await sql(opSelect+' WHERE github_id=? AND repo_id=? AND idempotency_key_hash=?',ownerGitHubId,SANDBOX_ID,keyHash).first();
  check(row?.payload_sha256===payloadHash,'IDEMPOTENCY_CONFLICT');
  const stored=await sql('SELECT request_json,payload_sha256 FROM p3_requests WHERE operation_id=?',row.operation_id).first();
  check(stored?.request_json===payload && stored?.payload_sha256===payloadHash,'CORRUPT_SNAPSHOT');
  return {...publicRecord(row),inserted:row.operation_id===candidate};
 }
 async function lookupReceipt({idempotencyKey,snapshot}={}){
  // An owner-authorized caller can safely recover a LOST 202 receipt using
  // only the original key and exact canonical payload. Read-only: no new
  // operation, audit event, GitHub call or source revalidation is performed.
  check(token(idempotencyKey),'INVALID_IDEMPOTENCY_KEY');
  verifySubmission(snapshot);
  let payload;
  try{payload=canonical(snapshot);}
  catch(e){if(e instanceof DurableStoreError)throw e;deny('INVALID_SNAPSHOT');}
  check(new TextEncoder().encode(payload).byteLength<=MAX_SNAPSHOT_BYTES,
   'SNAPSHOT_TOO_LARGE');
  const payloadHash=await sha256(payload);
  const keyHash=await sha256(ownerGitHubId+':'+SANDBOX_ID+':'+idempotencyKey);
  const row=await sql(opSelect+' WHERE github_id=? AND repo_id=? AND idempotency_key_hash=?',
   ownerGitHubId,SANDBOX_ID,keyHash).first();
  if(!row)return null;
  check(row.payload_sha256===payloadHash,'IDEMPOTENCY_CONFLICT');
  const stored=await sql(
   'SELECT request_json,payload_sha256 FROM p3_requests WHERE operation_id=?',
   row.operation_id).first();
  check(stored?.request_json===payload&&stored?.payload_sha256===payloadHash,
   'CORRUPT_SNAPSHOT');
  return {...publicRecord(row),inserted:false};
 }
 async function nextEligible(){
  const at=ts();
  // Single bounded lease candidate for the future private scheduled runner.
  // NEVER retry a remote merge with a durable write-ahead marker.
  const row=await sql(
   "SELECT operation_id FROM p3_operations WHERE github_id=? AND repo_id=? "+
   "AND state IN ('Accepted','Validating','Checking','Merging','Deploying','Verifying') "+
   "AND reason_code IS NULL AND (lease_expires_at IS NULL OR lease_expires_at<=?) "+
   "ORDER BY created_at,operation_id LIMIT 1",
   ownerGitHubId,SANDBOX_ID,at).first();
  return row?.operation_id??null;
 }
 // An authenticated GitHub check webhook is only a wake-up hint.
 // Find an EXACT one owner/repo scoped D1 CHECKING receipt by immutable
 // head SHA, using primary read when read replicas are enabled. Never use a
 // webhook PR number or check conclusion to make a merge decision.
 async function findCheckingByHead({repositoryId,headSha}={}){
  check(repositoryId===SANDBOX_ID&&/^[a-f0-9]{40}$/.test(headSha??''),
   'INVALID_CHECK_WAKE');
  const primary=typeof DB.withSession==='function'?
   DB.withSession('first-primary'):DB;
  const rows=await primary.prepare(
   "SELECT operation_id,state,pr_head_sha FROM p3_operations WHERE "+
   "github_id=? AND repo_id=? AND state='Checking' AND pr_head_sha=? "+
   'ORDER BY operation_id LIMIT 2'
  ).bind(ownerGitHubId,SANDBOX_ID,headSha).all();
  check(Array.isArray(rows?.results)&&rows.results.length<=1,
   'AMBIGUOUS_CHECK_WAKE');
  const row=rows.results[0];
  return row?Object.freeze({operationId:row.operation_id,state:row.state,
   prHeadSha:row.pr_head_sha,repositoryId:SANDBOX_ID}):null;
 }
 // Only expired, completed-attempt markers are eligible for read-only
 // independent reconciliation. This query cannot replay a GitHub merge.
 async function nextRecoverableMerge(){
  const at=ts();
  const row=await sql("SELECT operation_id FROM p3_operations "+
   "WHERE github_id=? AND repo_id=? AND state='Merging' "+
   "AND reason_code='merge_attempted' "+
   "AND (merge_sha IS NULL OR (length(merge_sha)=40 AND "+
   "merge_sha NOT GLOB '*[^0-9a-f]*')) "+
   "AND pr_number>0 AND length(pr_head_sha)=40 "+
   "AND length(main_base_sha)=40 AND workflow_run_id>0 "+
   "AND lease_expires_at IS NOT NULL AND lease_expires_at<=? "+
   "ORDER BY created_at,operation_id LIMIT 1",
   ownerGitHubId,SANDBOX_ID,at).first();
  return row?.operation_id??null;
 }
 // The alarm for ONE durable operation may only reconcile THAT operation.
 // The periodic Cron retains the older global ordered recovery query.
 async function nextRecoverableMergeFor(operationId){
  check(opId(operationId),'INVALID_OPERATION_ID');
  const at=ts();
  const row=await sql("SELECT operation_id FROM p3_operations "+
   "WHERE operation_id=? AND github_id=? AND repo_id=? "+
   "AND state='Merging' AND reason_code='merge_attempted' "+
   "AND (merge_sha IS NULL OR (length(merge_sha)=40 AND "+
   "merge_sha NOT GLOB '*[^0-9a-f]*')) "+
   "AND pr_number>0 AND length(pr_head_sha)=40 "+
   "AND length(main_base_sha)=40 AND workflow_run_id>0 "+
   "AND lease_expires_at IS NOT NULL AND lease_expires_at<=?",
   operationId,ownerGitHubId,SANDBOX_ID,at).first();
  return row?.operation_id??null;
 }
 // Called only after independently obtaining immutable PR, current main,
 // exact squash parent and changed-file evidence. One operation, one CAS.
 // Never calls GitHub; never permits skipping hosted-byte verification.
 async function reconcileVerifiedMerge(evidence={}){
  check(evidence?.verified===true&&evidence?.repositoryId===SANDBOX_ID&&
   opId(evidence.operationId)&&numberId(evidence.prNumber)&&
   /^[a-f0-9]{40}$/.test(evidence.prHeadSha??'')&&
   /^[a-f0-9]{40}$/.test(evidence.mainBaseSha??'')&&
   /^[a-f0-9]{40}$/.test(evidence.mergeSha??'')&&
   numberId(evidence.workflowRunId)&&
   evidence.canonicalLive===false,'INVALID_RECONCILIATION_EVIDENCE');
  const at=ts();
  const row=await sql(
   "UPDATE p3_operations SET state='Deploying',merge_sha=?,"+
   "reason_code=NULL,lease_owner=NULL,lease_expires_at=NULL,updated_at=? "+
   "WHERE operation_id=? AND github_id=? AND repo_id=? "+
   "AND state='Merging' AND reason_code='merge_attempted' "+
   "AND (merge_sha IS NULL OR merge_sha=?) AND verified_release_id IS NULL "+
   "AND lease_expires_at IS NOT NULL AND lease_expires_at<=? "+
   "AND pr_number=? AND pr_head_sha=? AND main_base_sha=? "+
   "AND workflow_run_id=? "+
   "RETURNING operation_id,state,merge_sha,reason_code",
   evidence.mergeSha,at,evidence.operationId,ownerGitHubId,SANDBOX_ID,
   evidence.mergeSha,at,evidence.prNumber,evidence.prHeadSha,evidence.mainBaseSha,
   evidence.workflowRunId).first();
  check(row?.operation_id===evidence.operationId&&
   row.state==='Deploying'&&row.merge_sha===evidence.mergeSha&&
   row.reason_code===null,'RECONCILIATION_CAS_DENIED');
  return publicRecord(row);
 }
 async function branchReceipt(operationId){
  check(opId(operationId),'INVALID_OPERATION_ID');
  const row=await sql('SELECT main_base_sha,pr_head_sha FROM p3_operations WHERE operation_id=? AND github_id=? AND repo_id=? AND state IN (?,?)',
   operationId,ownerGitHubId,SANDBOX_ID,'Validating','Checking').first();
  if(!row||!row.main_base_sha||!row.pr_head_sha)return null;
  return Object.freeze({repositoryId:SANDBOX_ID,baseSha:row.main_base_sha,headSha:row.pr_head_sha});
 }
 async function saveBranchReceipt({operationId,leaseOwner,baseSha,headSha}={}){
  check(opId(operationId)&&token(leaseOwner)&&/^[0-9a-f]{40}$/.test(baseSha??'')&&
   /^[0-9a-f]{40}$/.test(headSha??'')&&baseSha!==headSha,'INVALID_RECEIPT');
  const at=ts();
  // The branch already exists in GitHub; commit evidence survives the lease.
  // Only its owning, unexpired Validiating worker may save it, and values
  // cannot be changed once set (including a replay after lease recovery).
  const row=await sql(
   'UPDATE p3_operations SET main_base_sha=?,pr_head_sha=?,updated_at=? '+
   'WHERE operation_id=? AND github_id=? AND repo_id=? AND state=? AND lease_owner=? '+
   'AND lease_expires_at>? AND (main_base_sha IS NULL OR main_base_sha=?) '+
   'AND (pr_head_sha IS NULL OR pr_head_sha=?) '+
   'RETURNING main_base_sha,pr_head_sha',
   baseSha,headSha,at,operationId,ownerGitHubId,SANDBOX_ID,'Validating',leaseOwner,at,
   baseSha,headSha).first();
  return row?Object.freeze({repositoryId:SANDBOX_ID,baseSha:row.main_base_sha,headSha:row.pr_head_sha}):null;
 }
 async function markMergeAttempt({operationId,leaseOwner}={}){
  check(opId(operationId)&&token(leaseOwner),'INVALID_RECEIPT');
  const at=ts();
  // Durable write-ahead barrier. A crash at any time after this call
  // MUST block automatic retries until an independent read-only
  // reconciliation has established the exact GitHub outcome.
  const row=await sql(
   "UPDATE p3_operations SET reason_code='merge_attempted',updated_at=? "+
   "WHERE operation_id=? AND github_id=? AND repo_id=? AND state='Merging' "+
   "AND lease_owner=? AND lease_expires_at>? AND reason_code IS NULL "+
   "AND pr_number>0 AND length(pr_head_sha)=40 AND length(main_base_sha)=40 "+
   "RETURNING operation_id",
   at,operationId,ownerGitHubId,SANDBOX_ID,leaseOwner,at).first();
  return row?.operation_id===operationId;
 }
 async function saveMergeReceipt({operationId,leaseOwner,mergeSha,prNumber}={}){
  check(opId(operationId)&&token(leaseOwner)&&
   /^[0-9a-f]{40}$/.test(mergeSha??'')&&
   Number.isSafeInteger(prNumber)&&prNumber>0,'INVALID_RECEIPT');
  const at=ts();
  // Record the remote merge SHA under the owning unexpired lease BEFORE
  // returning success to the orchestrator. On a lost acknowledgment, do not
  // retry GitHub's merge blindly: reconcile server-side PR/main first.
  const row=await sql(
   'UPDATE p3_operations SET merge_sha=?,updated_at=? '+
   'WHERE operation_id=? AND github_id=? AND repo_id=? '+
   'AND state=? AND pr_number=? AND lease_owner=? AND lease_expires_at>? '+
   "AND reason_code='merge_attempted' "+
   'AND (merge_sha IS NULL OR merge_sha=?) RETURNING merge_sha,pr_number',
   mergeSha,at,operationId,ownerGitHubId,SANDBOX_ID,
   'Merging',prNumber,leaseOwner,at,mergeSha).first();
  return row?Object.freeze({repositoryId:SANDBOX_ID,
   mergeSha:row.merge_sha,prNumber:row.pr_number}):null;
 }
 async function readSnapshot(operationId){
  check(opId(operationId),'INVALID_OPERATION_ID');
  const row=await sql('SELECT r.request_json,r.payload_sha256,o.payload_sha256 AS operation_sha FROM p3_requests r JOIN p3_operations o ON r.operation_id=o.operation_id WHERE o.operation_id=? AND o.github_id=? AND o.repo_id=?',operationId,ownerGitHubId,SANDBOX_ID).first();
  if(!row)return null;
  const hash=await sha256(row.request_json);
  check(hash===row.payload_sha256&&hash===row.operation_sha,'CORRUPT_SNAPSHOT');
  return JSON.parse(row.request_json);
 }
 // Authenticated API calls only. Extract bounded display fields from the
 // hash-verified durable request, never from browser-local draft data.
 async function summary(operationId){
  check(opId(operationId),'INVALID_OPERATION_ID');
  const row=await sql('SELECT state,created_at,updated_at,reason_code FROM p3_operations WHERE operation_id=? AND github_id=? AND repo_id=?',
   operationId,ownerGitHubId,SANDBOX_ID).first();
  if(!row)return null;
  const snapshot=await readSnapshot(operationId);
  const pkg=snapshot?.package;
  if(!pkg||!['gear','kb','catches'].includes(pkg.domain)||
   !['add','edit'].includes(pkg.operation))return null;
  // Source change packages encode records under changes.set rather than
  // requiring a complete record field. Use only the validated, immutable
  // package metadata and fall back to its stable record ID.
  const rec=pkg.record??pkg.changes?.set;
  let name=typeof rec?.name==='string'?rec.name.trim():
   typeof pkg.changes?.baseFields?.name==='string'?
    pkg.changes.baseFields.name.trim():'';
  if(pkg.domain==='catches'){
   const species=rec?.speciesName||rec?.speciesId||
    pkg.changes?.baseFields?.speciesName||'Catch';
   name=String(species)+' · '+String(rec?.date||pkg.changes?.baseFields?.date||'Undated');
  }
  if(!name)name=typeof pkg.id==='string'?pkg.id:'Item';
  name=name.slice(0,160).replace(/[\\x00-\\x1f\\x7f]/g,' ').trim();
  const time=Number.isSafeInteger(row.updated_at)&&row.updated_at>0?
   row.updated_at:null;
  const reason=typeof row.reason_code==='string'&&
   /^[A-Z][A-Z0-9_]{1,63}$/.test(row.reason_code)?
   row.reason_code:null;
  return Object.freeze({domain:pkg.domain,action:pkg.operation,
   itemName:name||'Item',
   completedAt:row.state==='Live'?time:null,
   reasonCode:['Failed','Conflict'].includes(row.state)?reason:null});
 }
 async function claim({operationId,leaseOwner}={}){
  check(opId(operationId)&&token(leaseOwner),'INVALID_CLAIM');
  const at=ts();
  const row=await sql('UPDATE p3_operations SET lease_owner=?,lease_expires_at=?,updated_at=? WHERE operation_id=? AND github_id=? AND repo_id=? AND state NOT IN (?,?,?) AND (lease_expires_at IS NULL OR lease_expires_at<=?) RETURNING operation_id,state,lease_expires_at',
    leaseOwner,at+leaseSeconds,at,operationId,ownerGitHubId,SANDBOX_ID,'Live','Conflict','Failed',at).first();
  return row?{operationId:row.operation_id,state:row.state,expiresAt:row.lease_expires_at}:null;
 }
 // A known pending read-only CI check does not deserve the entire 60s
 // lease. Release ONLY the same owner/operation in Checking, allowing the
 // named-operation watchdog's next 8.5s independent GitHub observation.
 // No state transition, check result, merge receipt, or Live claim is written.
 async function releasePendingCheckLease({operationId,leaseOwner}={}){
  check(opId(operationId)&&token(leaseOwner),'INVALID_PENDING_RELEASE');
  const at=ts();
  const row=await sql(
   "UPDATE p3_operations SET lease_owner=NULL,lease_expires_at=NULL "+
   "WHERE operation_id=? AND github_id=? AND repo_id=? "+
   "AND state='Checking' AND reason_code IS NULL "+
   "AND lease_owner=? AND lease_expires_at>? "+
   "RETURNING operation_id",
   operationId,ownerGitHubId,SANDBOX_ID,leaseOwner,at).first();
  return row?.operation_id===operationId;
 }
 async function advance({operationId,leaseOwner,from,to,details={}}={}){
  check(opId(operationId)&&token(leaseOwner)&&states.has(from)&&states.has(to),'INVALID_ADVANCE');
  check(nextStates[from]?.includes(to),'INVALID_TRANSITION');
  check(details&&Object.getPrototypeOf(details)===Object.prototype,'INVALID_EVIDENCE');
  const names=Object.keys(details).sort();
  check(names.every(name=>columns[name]&&columns[name][1](details[name])),'INVALID_EVIDENCE');
  requireDetails(from,to,details);
  const values=[],pairs=[];
  for(const name of names){pairs.push(columns[name][0]+'=?');values.push(details[name]);}
  const at=ts();
  // UPDATE+state-audit trigger is a single atomic SQLite statement. CAS also
  // requires the lease still belongs to the caller and has not expired.
  const query='UPDATE p3_operations SET state=?,updated_at=?,lease_owner=NULL,lease_expires_at=NULL'+
    (from==='Merging'&&to==='Deploying'?',reason_code=NULL':'')+
    (pairs.length?','+pairs.join(','):'')+
    ' WHERE operation_id=? AND github_id=? AND repo_id=? AND state=? AND lease_owner=? AND lease_expires_at>? '+
    (from==='Merging'&&to==='Deploying'?"AND reason_code='merge_attempted' AND (merge_sha IS NULL OR merge_sha=?) ":'')+
    'RETURNING operation_id,state,pr_number,pr_head_sha,main_base_sha,merge_sha,workflow_run_id,verified_release_id,reason_code';
  const row=await sql(query,to,at,...values,operationId,ownerGitHubId,SANDBOX_ID,from,leaseOwner,at,
    ...(from==='Merging'&&to==='Deploying'?[details.mergeSha]:[])).first();
  return row?publicRecord(row):null;
 }
 async function events(operationId){
  check(opId(operationId),'INVALID_OPERATION_ID');
  const rows=await sql('SELECT e.event_id,e.event_type,e.from_state,e.to_state,e.event_at,e.error_code FROM p3_events e JOIN p3_operations o ON o.operation_id=e.operation_id WHERE e.operation_id=? AND o.github_id=? AND o.repo_id=? ORDER BY e.event_id',operationId,ownerGitHubId,SANDBOX_ID).all();
  return (rows?.results||[]).map(row=>({eventType:row.event_type,from:row.from_state,to:row.to_state,at:row.event_at,error:row.error_code}));
 }
 return Object.freeze({accept,get,latest,lookupReceipt,readSnapshot,summary,nextEligible,
  findCheckingByHead,
  nextRecoverableMerge,nextRecoverableMergeFor,reconcileVerifiedMerge,branchReceipt,saveBranchReceipt,
  markMergeAttempt,saveMergeReceipt,claim,releasePendingCheckLease,advance,events});
}
