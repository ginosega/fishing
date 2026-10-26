/**
 * FISH118 D3: one-step, DEFAULT-OFF, private-sandbox Gear/KB publisher.
 * Source-only; no deployed Worker/route, no Cron, no secret custody here.
 * Respects the completed and parked D2 experiment: never replays its Live
 * operation, never mutates public ginosega/fishing main.
 *
 * Real GitHub checks/ordinary merge are delegated to the same reviewed,
 * tightly scoped private-sandbox adapters used for the D2 proof. The
 * independently verified D3 multi-file hosted-byte verifier is REQUIRED as
 * an injected runtime capability; without it, merging and Live are blocked.
 */
import {createD3SandboxSnapshotLoader} from './d3-sandbox-snapshot-loader.mjs';
import {createD3TrustedGearKBCandidate} from './d3-trusted-gear-kb-candidate.mjs';
import {createD3SandboxGearKBPRAdapter} from './d3-sandbox-gear-kb-pr.mjs';
import {createSandboxCheckObserver} from './sandbox-check-observer.mjs';
import {createD2SandboxNormalMerge} from './d2-sandbox-normal-merge.mjs';
import {createD3SandboxOperationRunner} from './d3-sandbox-operation-runner.mjs';
const ID=1430581407,OWNER=265665562,OP=/^p3_[0-9a-f-]{36}$/;
const branch=id=>'p3-test-'+id.slice(3);
export class D3CoordinatorError extends Error{
 constructor(code){
  super('D3 sandbox coordinator unavailable');
  this.name='D3CoordinatorError';this.code=code;
 }
}
const fail=code=>{throw new D3CoordinatorError(code);};
const need=(v,code)=>{if(!v)fail(code);};
const methods=['nextEligible','claim','get','readSnapshot','advance',
 'branchReceipt','saveBranchReceipt','markMergeAttempt','saveMergeReceipt'];
export function createD3SandboxScheduledCoordinator({
 env,store,requestGitHub,issueReadToken,issueWriteToken,verifyHosted,
 makeLease=()=> 'd3-'+crypto.randomUUID(),
}={}){
 need(env&&typeof env==='object'&&methods.every(k=>
  typeof store?.[k]==='function')&&
  [requestGitHub,issueReadToken,issueWriteToken,verifyHosted,makeLease]
   .every(x=>typeof x==='function'),'INVALID_CONFIGURATION');
 const active=()=>env.D3_RUNNER_ENABLED==='true'&&
  env.D3_WRITE_ENABLED==='true'&&
  env.D3_READ_TOKENS_ENABLED==='true'&&
  env.D3_SANDBOX_REPO_ID===String(ID)&&
  Number(env.OWNER_GITHUB_ID)===OWNER;
 const hosted=()=>active()&&env.D3_TEST_HOST_ENABLED==='true';
 const reader=createD3SandboxSnapshotLoader({
  request:requestGitHub,issueReadToken,
  enabled:()=>active(),
 });
 const candidate=createD3TrustedGearKBCandidate({
  loadSnapshot:reader.loadSnapshot,enabled:()=>active(),
 });
 const observer=createSandboxCheckObserver({
  request:requestGitHub,issueCheckReadToken:issueReadToken,
  enabled:()=>active(),
 });
 async function createDraft({operationId,repositoryId,domain,
  expectedMainSha,package:pkg,leaseOwner}={}){
  need(active(),'RUNNER_DISABLED');
  need(repositoryId===ID&&OP.test(operationId??'')&&
   ['gear','kb'].includes(domain)&&pkg?.domain===domain&&
   typeof leaseOwner==='string','INVALID_DRAFT_REQUEST');
  const pr=createD3SandboxGearKBPRAdapter({
   request:requestGitHub,issueToken:issueWriteToken,
   enabled:()=>active(),
   trustedCandidate:async({package:incoming,operationId:op,
    expectedMainSha:expected,repositoryId:repoId,ownerGitHubId})=>{
    need(op===operationId&&repoId===ID&&ownerGitHubId===OWNER&&
     expected===expectedMainSha,'CANDIDATE_RECEIPT_MISMATCH');
    const stored=await store.readSnapshot(operationId);
    need(stored?.package&&JSON.stringify(stored.package)===
     JSON.stringify(incoming),'DURABLE_SNAPSHOT_MISMATCH');
    return candidate.plan({
     package:stored.package,repositoryId:ID,ownerGitHubId:OWNER,
     expectedMainSha:expected,operationId,
    });
   },
   knownBranchReceipt:async({repositoryId:repoId,operationId:op})=>{
    if(repoId!==ID||op!==operationId)return null;
    const prior=await store.branchReceipt(operationId);
    return prior?{...prior,operationId,branch:branch(operationId)}:null;
   },
   onBranchCreated:async receipt=>{
    need(receipt.repositoryId===ID&&receipt.operationId===operationId&&
     receipt.branch===branch(operationId),'WRONG_BRANCH_RECEIPT');
    const durable=await store.saveBranchReceipt({...receipt,leaseOwner});
    return durable?{...durable,operationId,branch:receipt.branch}:null;
   },
  });
  return pr.createDraft({operationId,domain,expectedMainSha,package:pkg});
 }
 const merger=createD2SandboxNormalMerge({
  request:requestGitHub,issueWriteToken,
  observeCheck:info=>observer.observe(info),
  recordMerge:info=>store.saveMergeReceipt(info),
  enabled:()=>hosted(),
 });
 const runner=createD3SandboxOperationRunner({
  store,enabled:()=>active(),
  currentMain:async({repositoryId})=>{
   need(repositoryId===ID,'REPOSITORY_DENIED');
   const source=await reader.loadSnapshot({repositoryId:ID});
   return source.sourceRevision;
  },
  createDraft,
  observeCheck:info=>observer.observe(info),
  merge:info=>merger.merge(info),
  verifyHosted:async info=>{
   need(hosted()&&info.repositoryId===ID&&
    info.canonicalLive===false&&
    Array.isArray(info.expectedPaths)&&
    info.expectedPaths.length>=1&&info.expectedPaths.length<=2,
    'HOST_PROOF_DISABLED');
   return verifyHosted(info);
  },
 });
 async function tick(){
  need(active(),'RUNNER_DISABLED');
  const operationId=await store.nextEligible();
  if(operationId===null)return Object.freeze({
   progressed:false,reason:'NO_ELIGIBLE_OPERATION',canonicalLive:false,
  });
  need(OP.test(operationId),'INVALID_DURABLE_ID');
  // Before any merge attempt, the independent hosted verifier must already
  // be enabled. Never acquire a lease or write a merge marker while it is off.
  if(!hosted()){
   const record=await store.get(operationId);
   need(record?.operationId===operationId,'RECEIPT_DRIFT');
   if(['Merging','Deploying','Verifying'].includes(record.state))
    return Object.freeze({progressed:false,
     reason:'AWAITING_HOST_PROOF_ENABLEMENT',operationId,
     canonicalLive:false});
   need(['Accepted','Validating','Checking'].includes(record.state),
    'INVALID_OPERATION_STATE');
  }
  const leaseOwner=makeLease();
  need(typeof leaseOwner==='string'&&
   /^[A-Za-z0-9_-]{12,96}$/.test(leaseOwner),'INVALID_LEASE');
  return runner.run({operationId,leaseOwner});
 }
 return Object.freeze({tick});
}
