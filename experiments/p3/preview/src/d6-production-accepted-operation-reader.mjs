/**
 * FISH-TODO-118 WP3 — canonical durable Accepted-operation D1 reader.
 * SOURCE ONLY / DEFAULT OFF / NO WORKER ROUTE OR PROVIDER MUTATION.
 *
 * Reconstructs an Accepted operation from ONLY the original server-owned
 * immutable snapshot stored by d6-production-operation-receipts.mjs.
 * Verifies the exact bytes of the snapshot JSON, SHA-256, pinned owner/repo,
 * source/record identity, and the complete canonical new-original metadata
 * set. Missing/unprovisioned D1 and corrupted or Unknown receipts fail closed.
 *
 * This reader intentionally does NOT invent signed original-image tickets:
 * the separate D1 verified staging proof / HMAC issuer must provide fresh
 * authentic tickets before the atomic media writer may proceed. Here the
 * mediaTickets array is empty and pendingOriginals names required staging.
 * Downstream publishing must also independently re-review canonical main,
 * source conflicts, actual Git blobs and durable provider fences.
 */
import {sha256} from '../../../../pwa/src/shared.mjs';
import {validatePackage} from '../../../../pwa/src/handoff.mjs';
import {expectedD6CanonicalMedia}
 from './d6-production-media-contract.mjs';
import {D6_PUBLISH_REPOSITORY} from './d6-production-publish-intake.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][0-9a-f]{3}-[a-f0-9]{12}$/i;
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
const KEY=/^[A-Za-z0-9_-]{12,96}$/;
const MAX=131072,encoder=new TextEncoder();
const sql='SELECT operation_id,owner_github_id,idempotency_key,'+
 'snapshot_sha256,snapshot_json,candidate_sha256,source_revision,'+
 'domain,operation_kind,record_id,state,created_at,updated_at '+
 'FROM d6_operation_receipts WHERE operation_id=? AND owner_github_id=?';
export class D6AcceptedOperationReadError extends Error {
 constructor(code){
  super('D6 accepted operation read not verified');
  this.name='D6AcceptedOperationReadError';this.code=code;
 }
}
const deny=code=>{throw new D6AcceptedOperationReadError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
const plain=x=>x!==null&&typeof x==='object'&&
 !Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const keys=(v,list)=>plain(v)&&
 Object.keys(v).length===list.length&&
 list.every(k=>Object.hasOwn(v,k));
function inspect(v,depth=0){
 need(depth<=18,'CORRUPT_SNAPSHOT');
 if(v===null||typeof v==='string'||typeof v==='boolean')return;
 if(typeof v==='number'){need(Number.isFinite(v),'CORRUPT_SNAPSHOT');return;}
 need(typeof v==='object','CORRUPT_SNAPSHOT');
 if(Array.isArray(v)){
  need(v.length<=1024,'CORRUPT_SNAPSHOT');
  for(const x of v)inspect(x,depth+1);
  return;
 }
 need(plain(v),'CORRUPT_SNAPSHOT');
 const names=Object.keys(v);
 need(names.length<=200&&names.every(k=>
  !['__proto__','constructor','prototype'].includes(k)),
  'CORRUPT_SNAPSHOT');
 for(const value of Object.values(v))inspect(value,depth+1);
}
const freeze=v=>{
 if(v&&typeof v==='object'){
  for(const child of Object.values(v))freeze(child);
  Object.freeze(v);
 }
 return v;
};
/**
 * Only this trusted server-side reader can produce operation.sourceRevision,
 * operation.snapshotSha256, and package from the persisted D1 row.
 * Authenticated callers MUST have already passed D2 owner verification before
 * invoking this adapter: it is not an HTTP handler or session verifier.
 */
export function createD6ProductionAcceptedOperationReader({
 DB,enabled=()=>false,
}={}){
 need(DB?.prepare&&typeof enabled==='function','INVALID_CONFIG');
 async function loadAcceptedOperation({operationId,ownerGitHubId}={}){
  need(enabled()===true,'DISABLED');
  need(UUID.test(operationId??'')&&
   ownerGitHubId===REPO.ownerGitHubId,'OWNER_DENIED');
  let row;
  try{row=await DB.prepare(sql).bind(operationId,ownerGitHubId).first();}
  catch{deny('STORE_UNAVAILABLE');}
  need(row&&row.operation_id===operationId&&
   row.owner_github_id===REPO.ownerGitHubId&&
   KEY.test(row.idempotency_key??'')&&
   DIGEST.test(row.snapshot_sha256??'')&&
   DIGEST.test(row.candidate_sha256??'')&&
   SHA.test(row.source_revision??'')&&
   ['gear','kb','catches'].includes(row.domain)&&
   ['add','edit'].includes(row.operation_kind)&&
   typeof row.record_id==='string'&&
   /^[a-z0-9][a-z0-9-]*$/.test(row.record_id)&&
   row.state==='Accepted'&&
   Number.isSafeInteger(row.created_at)&&row.created_at>0&&
   Number.isSafeInteger(row.updated_at)&&
   row.updated_at>=row.created_at,
   'RECEIPT_UNVERIFIED');
  const raw=row.snapshot_json;
  need(typeof raw==='string'&&encoder.encode(raw).length<=MAX&&
   raw.length>0,'CORRUPT_SNAPSHOT');
  let stored;
  try{stored=JSON.parse(raw);}catch{deny('CORRUPT_SNAPSHOT');}
  inspect(stored);
  need(raw===JSON.stringify(stored)&&
   keys(stored,['owner','repositoryId','snapshot'])&&
   stored.owner===REPO.ownerGitHubId&&
   stored.repositoryId===REPO.id&&
   keys(stored.snapshot,['package','media'])&&
   Array.isArray(stored.snapshot.media)&&
   stored.snapshot.media.length<=24,'CORRUPT_SNAPSHOT');
  need(await sha256(raw)===row.snapshot_sha256,
   'SNAPSHOT_HASH_MISMATCH');
  const pkg=stored.snapshot.package;
  try{validatePackage(pkg);}catch{deny('INVALID_PACKAGE');}
  need(pkg.id===row.record_id&&pkg.domain===row.domain&&
   pkg.operation===row.operation_kind&&
   pkg.base?.sourceRevision===row.source_revision&&
   SHA.test(pkg.base.sourceRevision)&&
   pkg.format==='fishing-companion-change-v2',
   'OPERATION_MISMATCH');
  let media;
  try{media=expectedD6CanonicalMedia(pkg);}
  catch{deny('INVALID_PACKAGE');}
  need(JSON.stringify(media)===JSON.stringify(stored.snapshot.media),
   'MEDIA_METADATA_MISMATCH');
  const operation=freeze({
   operationId,ownerGitHubId:REPO.ownerGitHubId,
   repositoryId:REPO.id,ref:REPO.ref,
   sourceRevision:row.source_revision,
   snapshotSha256:row.snapshot_sha256,
   domain:row.domain,operation:row.operation_kind,
   recordId:row.record_id,state:'Accepted',
  });
  return Object.freeze({
   operation,package:freeze(pkg),
   // Until D1 verified-stage proofs and *fresh signed tickets* are bound
   // by a separate trusted server component, media cannot publish.
   mediaTickets:Object.freeze([]),
   pendingOriginals:freeze(media),
   requiresSignedStaging:media.length>0,
   requiresIndependentBlobReadback:media.length>0,
   sourceOnly:true,canPublish:false,isLive:false,
  });
 }
 return Object.freeze({loadAcceptedOperation});
}
