/**
 * FISH118 D2 -- SOURCE-ONLY, not installed, no scheduled() binding.
 * Worker-compatible composition of one leased sandbox Gear operation.
 * All remote API credentials and trusted hosted-byte verification are injected
 * by the operator-approved server runtime. No default fetch or App signing.
 *
 * WARNING: No real publication until a reviewed, isolated Cloudflare binding,
 * real token issuer, and independently authenticated production-origin host
 * verifier have been wired and live-tested under explicit owner approval.
 */
import {createD2WorkerGearCandidate} from './d2-worker-source-candidate.mjs';
import {createD2SandboxPRAdapter} from './d2-sandbox-gear-pr.mjs';
import {createSandboxCheckObserver} from './sandbox-check-observer.mjs';
import {createD2SandboxNormalMerge} from './d2-sandbox-normal-merge.mjs';
import {createD2SandboxOperationRunner} from './d2-sandbox-operation-runner.mjs';

const ID=1430581407,REPO='ginosega/fishing-p3-sandbox';
export class D2CoordinatorError extends Error{
 constructor(code){super('D2 trusted scheduler denied');this.name='D2CoordinatorError';this.code=code;}
}
const deny=code=>{throw new D2CoordinatorError(code);};
const check=(v,code)=>{if(!v)deny(code);};
export function createD2SandboxScheduledCoordinator({
 env,store,requestGitHub,issueReadToken,issueWriteToken,
 verifyHosted,makeLease=()=> 'd2-'+crypto.randomUUID(),
}={}){
 check(env&&typeof env==='object'&&
  ['nextEligible','claim','get','readSnapshot','advance',
   'branchReceipt','saveBranchReceipt','markMergeAttempt','saveMergeReceipt']
   .every(k=>typeof store?.[k]==='function')&&
  [requestGitHub,issueReadToken,issueWriteToken,verifyHosted,makeLease]
   .every(fn=>typeof fn==='function'),
  'INVALID_CONFIGURATION');
 const active=()=>env.D2_RUNNER_ENABLED==='true'&&
  env.D2_WRITE_ENABLED==='true'&&
  env.D2_READ_TOKENS_ENABLED==='true'&&
  env.D2_SANDBOX_REPO_ID===String(ID);
 const hostedEnabled=()=>env.D2_TEST_HOST_ENABLED==='true'&&active();
 const candidate=createD2WorkerGearCandidate({
  request:requestGitHub,issueReadToken,
  sourceEnabled:()=>active(),
 });
 const observer=createSandboxCheckObserver({
  request:requestGitHub,
  issueCheckReadToken:issueReadToken,enabled:()=>active(),
 });
 async function createDraft({operationId,repositoryId,
  expectedMainSha,package:pkg,leaseOwner}={}){
  check(active(),'RUNNER_DISABLED');
  check(repositoryId===ID&&pkg?.domain==='gear'&&
   pkg?.operation==='edit'&&pkg?.id==='p3-test-rod',
   'INVALID_PACKAGE');
  const pr=createD2SandboxPRAdapter({
   request:requestGitHub,
   issueToken:issueWriteToken,
   publishingGate:()=>active(),
   trustedCandidate:async({baseSha,domain,operationId:op})=>{
    check(baseSha===expectedMainSha&&domain==='gear'&&op===operationId,
     'WRONG_CANDIDATE');
    const stored=await store.readSnapshot(operationId);
    check(stored?.package?.id===pkg.id,'WRONG_SNAPSHOT');
    return candidate.plan({package:stored.package,expectedMainSha:baseSha,
     operationId});
   },
   knownReceipt:async({operationId:op,repositoryId:repoId})=>
    repoId===ID&&op===operationId?store.branchReceipt(op):null,
   onBranchCreated:async receipt=>{
    check(receipt.operationId===operationId&&
     receipt.repositoryId===ID,'WRONG_BRANCH_RECEIPT');
    return store.saveBranchReceipt({...receipt,leaseOwner});
   },
  });
  return pr.createDraft({operationId,domain:'gear',expectedMainSha});
 }
 const merger=createD2SandboxNormalMerge({
  request:requestGitHub,
  issueWriteToken,
  observeCheck:info=>observer.observe(info),
  recordMerge:receipt=>store.saveMergeReceipt(receipt),
  enabled:()=>hostedEnabled(),
 });
 const runner=createD2SandboxOperationRunner({
  store,enabled:()=>active(),
  currentMain:async({repositoryId,package:pkg})=>{
   check(repositoryId===ID&&pkg?.id==='p3-test-rod','WRONG_REPO');
   const proof=await candidate.plan({package:pkg});
   return proof.sourceRevision;
  },
  createDraft,
  observeCheck:info=>observer.observe(info),
  merge:info=>merger.merge(info),
  verifyHosted:async info=>{
   check(hostedEnabled()&&info.repositoryId===ID&&
    info.expectedPath==='pwa/Gear/gear.json'&&
    info.canonicalLive===false,'HOST_PROOF_DISABLED');
   // CRITICAL: future callback must GET the ACTUAL production-origin test
   // path with owner/service authentication, compare bytes to an immutable
   // Git blob at the exact merged sandbox SHA, and independently validate
   // the bound GitHub Actions run. No mocked fixture may be deployed here.
   return verifyHosted(info);
  },
 });
 async function tick(){
  // All five hard gates must be explicitly activated by approved secrets and
  // a private Cron deployment. No route or default event trigger exists here.
  check(active(),'RUNNER_DISABLED');
  const operationId=await store.nextEligible();
  if(operationId===null)return Object.freeze({
   progressed:false,reason:'NO_ELIGIBLE_OPERATION',canonicalLive:false});
  check(/^p3_[a-f0-9-]{36}$/.test(operationId),'INVALID_DURABLE_ID');
  // Sandbox PR creation and exact-head CI checks are safe without hosting,
  // but never transition into a merge attempt unless the host-test route is
  // enabled. Check durable state BEFORE claiming a lease or writing a merge
  // marker: this makes the PR-only checkpoint genuinely non-mutating.
  if(!hostedEnabled()){
   const record=await store.get(operationId);
   check(record?.operationId===operationId,'RECEIPT_DRIFT');
   if(['Merging','Deploying','Verifying'].includes(record.state))
    return Object.freeze({progressed:false,
     reason:'AWAITING_HOST_PROOF_ENABLEMENT',operationId,
     canonicalLive:false});
   check(['Accepted','Validating','Checking'].includes(record.state),
    'INVALID_OPERATION_STATE');
  }
  const leaseOwner=makeLease();
  check(typeof leaseOwner==='string'&&
   /^[A-Za-z0-9_-]{12,96}$/.test(leaseOwner),'INVALID_LEASE');
  return runner.run({operationId,leaseOwner});
 }
 return Object.freeze({tick});
}
export const D2_SANDBOX_REPOSITORY=REPO;
