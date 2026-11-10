/**
 * D6 durable owner publication RECEIPTS — SOURCE ONLY / DEFAULT OFF.
 *
 * No Worker route, D1 migration, provider writer, GitHub PR, merge, deploy,
 * hosted verification, or public Live status. A separately authorized
 * runtime must provision this schema and bind the correct D1 database.
 * Accepted is a durable intent, NOT successful publication.
 *
 * Exact owner session+CSRF intake and trusted canonical-main source review
 * must precede any new acceptance. A retry with the same key and exact
 * immutable snapshot reads the original receipt BEFORE source re-review;
 * this prevents duplicate writes if the main SHA advances after acceptance.
 * The operation engine must never retry an uncertain provider write until
 * it independently reconciles its external outcome.
 */
import {D6_PUBLISH_REPOSITORY} from './d6-production-publish-intake.mjs';

export const D6_RECEIPTS_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS d6_operation_receipts (
 operation_id TEXT PRIMARY KEY,
 owner_github_id INTEGER NOT NULL,
 idempotency_key TEXT NOT NULL,
 snapshot_sha256 TEXT NOT NULL,
 snapshot_json TEXT NOT NULL,
 candidate_sha256 TEXT NOT NULL,
 source_revision TEXT NOT NULL,
 domain TEXT NOT NULL CHECK(domain IN ('gear','kb')),
 operation_kind TEXT NOT NULL CHECK(operation_kind IN ('add','edit')),
 record_id TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'Accepted'
   CHECK(state IN ('Accepted','Unknown')),
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 UNIQUE(owner_github_id,idempotency_key)
);
CREATE UNIQUE INDEX IF NOT EXISTS d6_operation_active_record
 ON d6_operation_receipts(owner_github_id,domain,record_id)
 WHERE state IN ('Accepted','Unknown');
`;

const SHA=/^[a-f0-9]{40}$/, DIGEST=/^[a-f0-9]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEY=/^[A-Za-z0-9_-]{12,96}$/;
const STATE=new Set(['Accepted','Unknown']);
const enc=new TextEncoder();
const digest=async raw=>{
 const bytes=await crypto.subtle.digest('SHA-256',enc.encode(raw));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
};

export class D6ReceiptError extends Error{
 constructor(code){super('D6 operation receipt denied');this.name='D6ReceiptError';this.code=code;}
}
const deny=code=>{throw new D6ReceiptError(code);};
const need=(condition,code)=>{if(!condition)deny(code);};

const lookupSql=`SELECT operation_id,owner_github_id,idempotency_key,
 snapshot_sha256,source_revision,domain,operation_kind,record_id,
 state,created_at,updated_at FROM d6_operation_receipts
 WHERE owner_github_id=? AND idempotency_key=?`;
const insertSql=`INSERT OR IGNORE INTO d6_operation_receipts
 (operation_id,owner_github_id,idempotency_key,snapshot_sha256,
  snapshot_json,candidate_sha256,source_revision,domain,operation_kind,
  record_id,state,created_at,updated_at)
 VALUES (?,?,?,?,?,?,?,?,? ,?,'Accepted',?,?)`;
const unknownSql=`UPDATE d6_operation_receipts SET state='Unknown',updated_at=?
 WHERE operation_id=? AND owner_github_id=? AND state='Accepted'`;
const byIdSql=`SELECT operation_id,owner_github_id,idempotency_key,
 snapshot_sha256,source_revision,domain,operation_kind,record_id,
 state,created_at,updated_at FROM d6_operation_receipts
 WHERE operation_id=? AND owner_github_id=?`;

function receipt(row){
 need(row&&UUID.test(row.operation_id??'')&&
  row.owner_github_id===D6_PUBLISH_REPOSITORY.ownerGitHubId&&
  KEY.test(row.idempotency_key??'')&&DIGEST.test(row.snapshot_sha256??'')&&
  SHA.test(row.source_revision??'')&&
  ['gear','kb'].includes(row.domain)&&
  ['add','edit'].includes(row.operation_kind)&&
  typeof row.record_id==='string'&&row.record_id.length>0&&
  STATE.has(row.state)&&Number.isSafeInteger(row.created_at)&&
  Number.isSafeInteger(row.updated_at)&&row.updated_at>=row.created_at,
  'CORRUPT_RECEIPT');
 return Object.freeze({
  operationId:row.operation_id,status:row.state,
  domain:row.domain,operation:row.operation_kind,recordId:row.record_id,
  sourceRevision:row.source_revision,
  createdAt:row.created_at,updatedAt:row.updated_at,
  sourceOnly:true,canPublish:false,isLive:false,
 });
}

export function createD6ProductionOperationReceipts({
 DB,intake,review,enabled=()=>false,
 now=()=>Math.floor(Date.now()/1000),newId=()=>crypto.randomUUID(),
}={}){
 need(DB?.prepare&&typeof intake?.inspect==='function'&&
  typeof review?.review==='function'&&typeof enabled==='function'&&
  typeof now==='function'&&typeof newId==='function','INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 const query=async(sql,...args)=>{
  try{return await DB.prepare(sql).bind(...args).first();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 const execute=async(sql,...args)=>{
  try{return await DB.prepare(sql).bind(...args).run();}
  catch{deny('STORE_UNAVAILABLE');}
 };
 async function accept(request,{trustedMainSha}={}){
  active();
  need(request instanceof Request&&SHA.test(trustedMainSha??''),
   'UNVERIFIED_REQUEST');
  // Duplicate retries still require full authenticated owner/CSRF intake.
  const intent=await intake.inspect(request.clone(),{trustedMainSha});
  const owner=intent.ownerGitHubId;
  need(intent.sourceOnly===true&&intent.canPublish===false&&
   intent.id===D6_PUBLISH_REPOSITORY.id&&
   intent.name===D6_PUBLISH_REPOSITORY.name&&
   intent.ref===D6_PUBLISH_REPOSITORY.ref&&
   owner===D6_PUBLISH_REPOSITORY.ownerGitHubId&&
   intent.trustedMainSha===trustedMainSha&&
   KEY.test(intent.idempotencyKey??''),'UNTRUSTED_INTENT');
  const pkg=intent.snapshot?.package;
  need(['gear','kb'].includes(pkg?.domain)&&
   ['add','edit'].includes(pkg?.operation)&&
   typeof pkg?.id==='string'&&pkg.id.length>0,
   'UNTRUSTED_INTENT');
  const snapshotJson=JSON.stringify({owner,repositoryId:intent.id,
   snapshot:intent.snapshot});
  need(enc.encode(snapshotJson).length<=131072,'UNTRUSTED_INTENT');
  const snapshotHash=await digest(snapshotJson);
  const previous=await query(lookupSql,owner,intent.idempotencyKey);
  if(previous){
   // The key is permanently bound to its original submission bytes.
   need(previous.snapshot_sha256===snapshotHash,'KEY_REUSE');
   return receipt(previous);
  }
  // New key: review the exact authenticated request at verified main.
  // There is no caller-supplied candidate or arbitrary repository selector.
  const candidate=await review.review(request,{trustedMainSha});
  need(candidate?.sourceOnly===true&&candidate?.canPublish===false&&
   candidate?.requiresDurableOperation===true&&
   candidate?.repositoryId===D6_PUBLISH_REPOSITORY.id&&
   candidate?.ref===D6_PUBLISH_REPOSITORY.ref&&
   candidate?.idempotencyKey===intent.idempotencyKey&&
   candidate?.sourceRevision===trustedMainSha&&
   candidate?.domain===pkg.domain&&
   candidate?.operation===pkg.operation&&
   candidate?.recordId===pkg.id&&
   SHA.test(candidate.treeSha??'')&&
   Array.isArray(candidate.fileOps),
   'UNTRUSTED_CANDIDATE');
  const record=candidate.candidateData?.[pkg.domain]?.[
   pkg.domain==='gear'?'items':'entities']?.find(x=>x.id===pkg.id);
  need(record,'UNTRUSTED_CANDIDATE');
  const candidateHash=await digest(JSON.stringify({
   main:trustedMainSha,tree:candidate.treeSha,
   domain:pkg.domain,operation:pkg.operation,
   record,files:candidate.fileOps,
  }));
  const operationId=newId(),at=now();
  need(UUID.test(operationId)&&Number.isSafeInteger(at)&&at>0,
   'INVALID_CONFIG');
  // D1 uniqueness makes simultaneous duplicates and same-record conflicts
  // fail closed. INSERT OR IGNORE + follow-up SELECT resolves either race.
  await execute(insertSql,operationId,owner,intent.idempotencyKey,
   snapshotHash,snapshotJson,candidateHash,trustedMainSha,
   pkg.domain,pkg.operation,pkg.id,at,at);
  const stored=await query(lookupSql,owner,intent.idempotencyKey);
  if(!stored)deny('RECORD_BUSY'); // Another active operation for this record.
  need(stored.snapshot_sha256===snapshotHash,'KEY_REUSE');
  return receipt(stored);
 }
 async function markUnknown(operationId){
  active();
  need(UUID.test(operationId??''),'INVALID_OPERATION');
  const owner=D6_PUBLISH_REPOSITORY.ownerGitHubId;
  const at=now();
  need(Number.isSafeInteger(at)&&at>0,'INVALID_CONFIG');
  // UNKNOWN is sticky; no replay, no automatic fail/success coercion.
  // A future coordinator must verify provider outcome before adding other
  // transitions. This component has NO transition to Live.
  await execute(unknownSql,at,operationId,owner);
  const stored=await query(byIdSql,operationId,owner);
  need(stored,'OPERATION_NOT_FOUND');
  need(stored.state==='Unknown','UNKNOWN_NOT_PERSISTED');
  return receipt(stored);
 }
 return Object.freeze({accept,markUnknown});
}
