/**
 * FISH-TODO-118 WP3-4 — one durable publishing lifecycle/recovery router.
 * SOURCE ONLY / DEFAULT OFF / NO HTTP ROUTE, TOKENS, OR PROVIDER WRITES.
 *
 * A single canonical owner operation flows through:
 *   VerifiedTree -> VerifiedBranch -> VerifiedCommit -> VerifiedAdvance
 *     -> VerifiedPr.
 * Each remote mutation has an immutable per-step Unknown D1 fence and an
 * independent readback receipt. This coordinator does NOT attempt any
 * mutation. It can ask ONLY the existing step's independent readback
 * reconciler to resolve a *previously fenced* uncertain write.
 *
 * Bare HTTP success, a later fence, a partial proof chain, out-of-order
 * evidence, changed operation identity, or an unprovisioned D1 table cannot
 * advance status. Even VerifiedPr is GitHub source evidence, NOT merged,
 * deployed, hosted-byte-verified, published or public Live.
 */
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][0-9a-f]{3}-[a-f0-9]{12}$/i;
const STEPS=Object.freeze([
 Object.freeze({step:'tree',table:'d6_atomic_tree_verified',
  proof:'VerifiedTree',previous:null}),
 Object.freeze({step:'branch',table:'d6_publish_branch_verified',
  proof:'VerifiedBranch',previous:'tree'}),
 Object.freeze({step:'commit',table:'d6_publish_commit_verified',
  proof:'VerifiedCommit',previous:'branch'}),
 Object.freeze({step:'advance',table:'d6_publish_advance_verified',
  proof:'VerifiedAdvance',previous:'commit'}),
 Object.freeze({step:'pr',table:'d6_publish_pr_verified',
  proof:'VerifiedPr',previous:'advance'}),
]);
const FENCE='SELECT operation_id,step_key,owner_github_id,'+
 'repository_id,request_sha256,state,created_at FROM '+
 'd6_provider_step_fences WHERE operation_id=? AND step_key=?';
const PROOF_SELECT=Object.freeze({
 tree:'SELECT * FROM d6_atomic_tree_verified WHERE operation_id=?',
 branch:'SELECT * FROM d6_publish_branch_verified WHERE operation_id=?',
 commit:'SELECT * FROM d6_publish_commit_verified WHERE operation_id=?',
 advance:'SELECT * FROM d6_publish_advance_verified WHERE operation_id=?',
 pr:'SELECT * FROM d6_publish_pr_verified WHERE operation_id=?',
});
const BRANCH=id=>'refs/heads/fish-v3/publish/'+id;
export class D6PublishRecoveryError extends Error{
 constructor(code){
  super('D6 source publication lifecycle cannot be certified');
  this.name='D6PublishRecoveryError';this.code=code;
 }
}
const deny=code=>{throw new D6PublishRecoveryError(code);};
const need=(v,code)=>{if(!v)deny(code);};
const validInt=n=>Number.isSafeInteger(n)&&n>0;
const get=async(DB,sql,...args)=>{
 try{return await DB.prepare(sql).bind(...args).first();}
 catch{deny('STORE_UNAVAILABLE');}
};
function accepted(stored,id){
 const op=stored?.operation,pkg=stored?.package;
 need(UUID.test(id??'')&&op?.operationId===id&&
  op.state==='Accepted'&&op.ownerGitHubId===REPO.ownerGitHubId&&
  op.repositoryId===REPO.id&&op.ref===REPO.ref&&
  SHA.test(op.sourceRevision??'')&&
  DIGEST.test(op.snapshotSha256??'')&&
  ['gear','kb','catches'].includes(op.domain)&&
  ['add','edit'].includes(op.operation)&&
  op.recordId===pkg?.id&&op.domain===pkg?.domain&&
  op.operation===pkg?.operation&&
  pkg.base?.sourceRevision===op.sourceRevision&&
  Array.isArray(stored.mediaTickets),
  'UNTRUSTED_OPERATION');
 return op;
}
function validateFence(row,op,s){
 need(row.operation_id===op.operationId&&
  row.step_key===s.step&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  DIGEST.test(row.request_sha256??'')&&
  row.state==='Unknown'&&validInt(row.created_at),
  'FENCE_CORRUPT');
}
function validateProof(row,op,s,fence,prev,at){
 need(row.operation_id===op.operationId&&
  row.owner_github_id===REPO.ownerGitHubId&&
  row.repository_id===REPO.id&&
  row.request_sha256===fence.request_sha256&&
  row.state===s.proof&&
  validInt(row.verified_at)&&
  row.verified_at>=fence.created_at&&
  row.verified_at<=at+60&&
  (!prev||row.verified_at>=prev.verified_at)&&
  row.source_revision===op.sourceRevision,
  'PROOF_CORRUPT');
 if(s.step==='tree'){
  need(SHA.test(row.base_tree_sha??'')&&
   SHA.test(row.result_tree_sha??'')&&
   row.base_tree_sha!==row.result_tree_sha&&
   Number.isSafeInteger(row.changed_paths)&&
   row.changed_paths>=1&&row.changed_paths<=32,
   'PROOF_CORRUPT');
 }else{
  const field=s.previous+'_request_sha256';
  // All later receipts retain the original tree digest, and each
  // non-tree receipt binds to its preceding step's immutable digest.
  need(row.tree_request_sha256===prev.tree_request_sha256||
   s.step==='branch'&&row.tree_request_sha256===prev.request_sha256,
   'PROOF_CORRUPT');
  if(s.step==='commit')
   need(row.branch_request_sha256===prev.request_sha256,
    'PROOF_CORRUPT');
  if(s.step==='advance')
   need(row.commit_request_sha256===prev.request_sha256,
    'PROOF_CORRUPT');
  if(s.step==='pr')
   need(row.advance_request_sha256===prev.request_sha256,
    'PROOF_CORRUPT');
  need(row.ref_name===BRANCH(op.operationId)&&
   SHA.test(row.result_commit_sha??'')===
    (s.step!=='branch')&&
   (s.step!=='branch'||SHA.test(row.base_tree_sha??'')),
   'PROOF_CORRUPT');
  if(s.step==='branch')
   need(row.base_tree_sha===prev.base_tree_sha&&
    row.result_tree_sha===prev.result_tree_sha,
    'PROOF_CORRUPT');
  if(s.step==='commit')
   need(row.result_tree_sha===prev.result_tree_sha,
    'PROOF_CORRUPT');
  if(s.step==='advance')
   need(row.result_commit_sha===prev.result_commit_sha&&
    row.result_tree_sha===prev.result_tree_sha,
    'PROOF_CORRUPT');
  if(s.step==='pr')
   need(row.result_commit_sha===prev.result_commit_sha&&
    validInt(row.pr_number)&&validInt(row.pr_id),
    'PROOF_CORRUPT');
 }
 // Explicit cross-chain request fields prevent partial/foreign D1
 // receipts being interpreted as a successful operation.
 const expected={};
 if(prev){
  if(s.step==='branch')expected.tree_request_sha256=prev.request_sha256;
  if(s.step==='commit'){
   expected.tree_request_sha256=prev.tree_request_sha256;
   expected.branch_request_sha256=prev.request_sha256;
  }
  if(s.step==='advance'){
   expected.tree_request_sha256=prev.tree_request_sha256;
   expected.branch_request_sha256=prev.branch_request_sha256;
   expected.commit_request_sha256=prev.request_sha256;
  }
  if(s.step==='pr'){
   expected.tree_request_sha256=prev.tree_request_sha256;
   expected.branch_request_sha256=prev.branch_request_sha256;
   expected.commit_request_sha256=prev.commit_request_sha256;
   expected.advance_request_sha256=prev.request_sha256;
  }
 }
 for(const [k,value] of Object.entries(expected))
  need(row[k]===value,'PROOF_CORRUPT');
}
function snapshot(op,status,step,verifiedSteps,extra={}){
 return Object.freeze({
  operationId:op.operationId,
  domain:op.domain,recordId:op.recordId,
  sourceRevision:op.sourceRevision,
  state:status,step,
  verifiedSteps:Object.freeze([...verifiedSteps]),
  ...extra,
  sourceOnly:true,canMerge:false,canPublish:false,isLive:false,
  requiresHostedReleaseProof:true,
 });
}
export function createD6ProductionPublishRecoveryLifecycle({
 DB,session,loadAcceptedOperation,reconcilers,
 enabled=()=>false,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(DB?.prepare&&
  typeof session?.authorizeWrite==='function'&&
  typeof loadAcceptedOperation==='function'&&
  typeof enabled==='function'&&typeof now==='function'&&
  reconcilers&&STEPS.every(({step})=>
   typeof reconcilers[step]?.reconcile==='function'),
  'INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 async function inspect(authRequest,operationId){
  active();
  let actor;
  try{actor=await session.authorizeWrite(authRequest);}
  catch{deny('OWNER_DENIED');}
  need(actor?.authorized===true&&
   actor.ownerGitHubId===REPO.ownerGitHubId,'OWNER_DENIED');
  need(UUID.test(operationId??''),'INVALID_OPERATION');
  let stored;
  try{stored=await loadAcceptedOperation({
   operationId,ownerGitHubId:REPO.ownerGitHubId,
  });}catch{deny('OPERATION_UNAVAILABLE');}
  const op=accepted(stored,operationId);
  const at=now();
  need(validInt(at),'INVALID_CLOCK');
  const rows=[];
  // Read every step before returning a status. A future fence or proof
  // without its preceding verified step is an evidence conflict.
  for(const s of STEPS){
   const [f,p]=await Promise.all([
    get(DB,FENCE,operationId,s.step),
    get(DB,PROOF_SELECT[s.step],operationId),
   ]);
   rows.push({s,f,p});
  }
  const verifiedSteps=[],proofs=new Map();
  let waiting=null,unknown=null,previous=null;
  for(const {s,f,p} of rows){
   if(f)validateFence(f,op,s);
   if(p&&!f)deny('EVIDENCE_OUT_OF_ORDER');
   if(waiting||unknown){
    if(f||p)deny('EVIDENCE_OUT_OF_ORDER');
    continue;
   }
   if(!f){waiting=s.step;continue;}
   if(!p){unknown=s.step;continue;}
   validateProof(p,op,s,f,previous,at);
   if(previous&&f.created_at<previous.verified_at)
    deny('EVIDENCE_OUT_OF_ORDER');
   verifiedSteps.push(s.step);
   proofs.set(s.step,p);
   previous=p;
  }
  if(unknown)return snapshot(op,'ReconciliationRequired',unknown,
   verifiedSteps,{requiresIndependentReadback:true,
    safeToRetryWrite:false});
  if(waiting)return snapshot(op,'AwaitingAuthorizedWrite',waiting,
   verifiedSteps,{requiresOwnerWriteApproval:true,
    safeToRetryWrite:false});
  need(verifiedSteps.length===STEPS.length,'EVIDENCE_OUT_OF_ORDER');
  const pr=proofs.get('pr');
  return snapshot(op,'VerifiedPr',null,verifiedSteps,{
   prNumber:pr.pr_number,prId:pr.pr_id,
   prUrl:'https://github.com/'+REPO.name+'/pull/'+pr.pr_number,
   requiresGuardedMerge:true,
  });
 }
 async function reconcile(authRequest,operationId){
  const state=await inspect(authRequest,operationId);
  need(state.state==='ReconciliationRequired','NOTHING_TO_RECONCILE');
  const step=state.step;
  // This interface deliberately exposes NO attempt/begin or mutation
  // callback. Only a pre-existing Unknown step can be reconciled.
  const result=await reconcilers[step].reconcile(authRequest,operationId);
  need(result?.operationId===operationId&&
   result.sourceOnly===true&&result.isLive===false&&
   ['VerifiedTree','VerifiedBranch','VerifiedCommit',
    'VerifiedAdvance','VerifiedPr'].includes(result.state),
   'RECONCILIATION_UNVERIFIED');
  const reread=await inspect(authRequest,operationId);
  need(reread.verifiedSteps.includes(step),
   'RECONCILIATION_NOT_PERSISTED');
  return reread;
 }
 return Object.freeze({inspect,reconcile});
}
