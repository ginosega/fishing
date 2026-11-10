/**
 * D6 publishing provenance gate — SOURCE ONLY, DEFAULT OFF.
 *
 * Read-only evidence evaluation for a future independently approved owner
 * writer/coordinator. No GitHub mutation, token, D1 migration, Worker route,
 * production deployment, status transition, or claim of public Live.
 *
 * All injected readers MUST be server-owned trustworthy adapters, NOT values
 * supplied by a browser. The future provider adapter must:
 *  - load the operation/PR binding and candidate digest from durable D1;
 *  - independently reconstruct the candidate hash from GitHub tree bytes;
 *  - fetch ALL changed paths and exact-head GitHub check runs;
 *  - read current main just before any separately approved merge;
 *  - invoke the existing complete Pages+gateway hosted-byte verifier.
 * Passing this evaluator is only a proof checkpoint. A future writer must
 * re-read current PR/head/main/checks immediately before mutating GitHub.
 */
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';
import {safePath}
 from '../../../../pwa/src/shared.mjs';

const REPO=D6_PUBLISH_REPOSITORY;
const SHA=/^[0-9a-f]{40}$/,DIGEST=/^[0-9a-f]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUIRED=Object.freeze(['classify','validate-content','fishing-merge-ready']);
const branch=id=>'fish-v3/publish/'+id;
export class D6PublishEvidenceError extends Error{
 constructor(code){super('D6 publishing provenance is unverified');
  this.name='D6PublishEvidenceError';this.code=code;}
}
const deny=code=>{throw new D6PublishEvidenceError(code);};
const need=(x,code)=>{if(!x)deny(code);};
const safeCall=async fn=>{
 try{return await fn();}catch{deny('EVIDENCE_UNAVAILABLE');}
};
function checkOperation(op,id){
 need(op&&op.operationId===id&&UUID.test(id)&&
  op.ownerGitHubId===REPO.ownerGitHubId&&
  op.repositoryId===REPO.id&&op.ref===REPO.ref&&
  SHA.test(op.sourceRevision??'')&&DIGEST.test(op.candidateSha256??'')&&
  Number.isSafeInteger(op.prNumber)&&op.prNumber>0&&
  ['Accepted','Unknown'].includes(op.state)&&
  ['gear','kb'].includes(op.domain)&&
  ['add','edit'].includes(op.operation)&&
  typeof op.recordId==='string'&&op.recordId.length>0,
  'UNTRUSTED_OPERATION');
 return op;
}
function checkPR(pr,op,merged){
 need(pr&&pr.repositoryId===REPO.id&&pr.number===op.prNumber&&
  pr.base?.repoId===REPO.id&&pr.base.ref==='main'&&
  pr.head?.repoId===REPO.id&&
  pr.head.ref===branch(op.operationId)&&
  SHA.test(pr.head.sha??'')&&
  pr.isFork===false&&
  (merged?pr.state==='closed'&&pr.merged===true&&
   SHA.test(pr.mergeCommitSha??''):
   pr.state==='open'&&pr.merged===false&&pr.draft===false&&
   pr.base.sha===op.sourceRevision&&
   pr.head.sha!==op.sourceRevision),
  'UNTRUSTED_PULL_REQUEST');
}
function checkPaths(paths,domain){
 need(Array.isArray(paths)&&paths.length>=1&&paths.length<=20,
  'UNTRUSTED_DIFF');
 const root=domain==='gear'?'Gear':'KB';
 const json=root+'/'+(domain==='gear'?'gear':'kb')+'.json';
 const uniq=new Set();
 let haveJson=false;
 for(const path of paths){
  let valid=false;
  try{valid=safePath(path)===path&&
   (path===json||
    path.startsWith(root+'/')&&path.includes('/content/')&&
    path.endsWith('.md'))&&!path.includes('\\')&&
    !path.split('/').some(s=>!s||s==='.'||s==='..');}
  catch{}
  need(valid,'UNTRUSTED_DIFF');
  const key=path.normalize('NFC').toLowerCase();
  need(!uniq.has(key),'UNTRUSTED_DIFF');
  uniq.add(key);
  if(path===json)haveJson=true;
 }
 need(haveJson,'UNTRUSTED_DIFF');
}
function checkStatuses(statuses,headSha){
 need(Array.isArray(statuses)&&statuses.length>=REQUIRED.length&&
  statuses.length<=100,'CHECKS_UNVERIFIED');
 const names=new Set();
 for(const status of statuses){
  need(status&&typeof status.name==='string'&&
   status.headSha===headSha&&
   status.status==='completed'&&
   ['success','neutral','skipped','failure','cancelled','timed_out',
    'action_required'].includes(status.conclusion),
   'CHECKS_UNVERIFIED');
  need(!names.has(status.name),'CHECKS_UNVERIFIED');
  names.add(status.name);
 }
 for(const name of REQUIRED){
  need(statuses.some(s=>s.name===name&&s.conclusion==='success'),
   'CHECKS_UNVERIFIED');
 }
}
function checkMain(main,sha){
 need(main?.repositoryId===REPO.id&&main?.ref===REPO.ref&&
  main?.sha===sha&&SHA.test(main.sha),'MAIN_MOVED');
}
export function createD6ProductionPublishEvidenceGate({
 readOperation,readPullRequest,readChecks,readMain,verifyCandidate,
 verifyHosted,enabled=()=>false,
}={}){
 need([readOperation,readPullRequest,readChecks,readMain,
  verifyCandidate,verifyHosted,enabled].every(x=>typeof x==='function'),
  'INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 const operation=async id=>{
  active();need(UUID.test(id??''),'INVALID_OPERATION');
  return checkOperation(await safeCall(()=>readOperation(id)),id);
 };
 const pull=async op=>await safeCall(()=>readPullRequest(op.prNumber));

 async function reviewBeforeMerge(operationId){
  const op=await operation(operationId);
  // An unknown write MUST be reconciled, never treated as merge-ready.
  need(op.state==='Accepted','UNKNOWN_OUTCOME');
  const pr=await pull(op);
  checkPR(pr,op,false);
  checkPaths(pr.changedPaths,op.domain);
  const proof=await safeCall(()=>verifyCandidate({
   operationId,prNumber:pr.number,headSha:pr.head.sha,
   originalSourceRevision:op.sourceRevision,
   expectedCandidateSha256:op.candidateSha256,
  }));
  need(proof?.repositoryId===REPO.id&&
   proof?.sourceRevision===op.sourceRevision&&
   proof?.headSha===pr.head.sha&&
   proof?.candidateSha256===op.candidateSha256&&
   proof?.pathsVerified===pr.changedPaths.length&&
   proof?.contentOnly===true,'CANDIDATE_UNVERIFIED');
  const statuses=await safeCall(()=>readChecks(pr.head.sha));
  checkStatuses(statuses,pr.head.sha);
  // This read is intentionally LAST, as near the future merge call as
  // possible. The separate actual writer must repeat it before mutation.
  checkMain(await safeCall(()=>readMain()),op.sourceRevision);
  active();
  return Object.freeze({
   operationId,prNumber:pr.number,verifiedHeadSha:pr.head.sha,
   checkedMainSha:op.sourceRevision,
   exactHeadChecksVerified:true,contentCandidateVerified:true,
   readyForFutureMergeReview:true,sourceOnly:true,
   canMerge:false,canPublish:false,isLive:false,
  });
 }

 async function reviewAfterMerge(operationId){
  const op=await operation(operationId);
  const pr=await pull(op);
  checkPR(pr,op,true);
  // Verify that the recorded source operation and exact PR match the
  // GitHub merged commit now on main; do not accept a replaced main.
  checkMain(await safeCall(()=>readMain()),pr.mergeCommitSha);
  const hosted=await safeCall(()=>verifyHosted({
   expectedSourceRevision:pr.mergeCommitSha,
  }));
  need(hosted?.sourceRevision===pr.mergeCommitSha&&
   DIGEST.test(hosted.manifestSha256??'')&&
   typeof hosted.releaseId==='string'&&hosted.releaseId.length>0&&
   Number.isSafeInteger(hosted.filesVerified)&&hosted.filesVerified>0&&
   hosted.pagesAndGatewayBytesMatch===true&&
   hosted.canPublish===false&&hosted.publicCutoverApproved===false,
   'HOSTED_UNVERIFIED');
  checkMain(await safeCall(()=>readMain()),pr.mergeCommitSha);
  active();
  return Object.freeze({
   operationId,prNumber:pr.number,mergedSourceRevision:pr.mergeCommitSha,
   verifiedReleaseId:hosted.releaseId,
   verifiedManifestSha256:hosted.manifestSha256,
   verifiedFileCount:hosted.filesVerified,
   mergedAndHostedEvidenceVerified:true,
   sourceOnly:true,canMerge:false,canPublish:false,isLive:false,
  });
 }
 return Object.freeze({reviewBeforeMerge,reviewAfterMerge});
}
