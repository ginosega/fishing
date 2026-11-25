/**
 * FISH-TODO-118 WP3 — FIVE EXISTING GitHub coordinators wired as one
 * request-scoped step set for #494's verified-media operation loader.
 *
 * SOURCE ONLY / DEFAULT OFF / UNMOUNTED.
 * No alternative GitHub writer, origin, D2 verifier, scheduler, attestor,
 * token issuer, migration, Worker entrypoint or publishing status is added.
 * The caller is the existing owner-authenticated request-bound publisher.
 *
 * Tree and commit result SHAs are held only by the actual D1 candidate
 * custodians, not browser hints, synthetic "success" callbacks or network
 * responses treated as proof. Only the independent existing Git GET
 * reconcilers can advance from Unknown to VerifiedTree/VerifiedCommit.
 */
import {D6_PUBLISH_REPOSITORY as REPO}
 from './d6-production-publish-intake.mjs';
import {createD6ProductionAtomicTreeStep}
 from './d6-production-atomic-tree-step.mjs';
import {createD6ProductionAtomicTreeReconciliation}
 from './d6-production-atomic-tree-reconciliation.mjs';
import {createD6ProductionPublishBranchCoordinator}
 from './d6-production-publish-branch-coordinator.mjs';
import {createD6ProductionPublishCommitCoordinator}
 from './d6-production-publish-commit-coordinator.mjs';
import {createD6ProductionPublishAdvanceCoordinator}
 from './d6-production-publish-advance-coordinator.mjs';
import {createD6ProductionPublishPrCoordinator}
 from './d6-production-publish-pr-coordinator.mjs';
import {createD6ProductionTreeCandidateCustody}
 from './d6-production-tree-candidate-custody.mjs';
import {createD6ProductionCommitCandidateCustody}
 from './d6-production-commit-candidate-custody.mjs';
import {createD6ProductionPublishSourcePrecondition}
 from './d6-production-publish-source-precondition.mjs';

const STEPS=Object.freeze(['tree','branch','commit','advance','pr']);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export class D6FiveStepWiringError extends Error{
 constructor(code){
  super('WP3 five-step publishing dependencies cannot be wired');
  this.name='D6FiveStepWiringError';this.code=code;
 }
}
const deny=code=>{throw new D6FiveStepWiringError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
const available=x=>typeof x==='function';
const readonly=o=>Object.freeze({...o});
export function createD6ProductionFiveStepWiring({
 DB,session,atomicPlanner,issueReadToken,issueWriteToken,request,
 enabled=()=>false,writeEnabled=()=>false,
 now=()=>Math.floor(Date.now()/1000),
}={}){
 need(DB?.prepare&&available(session?.authorizeWrite)&&
  available(atomicPlanner?.plan)&&
  [issueReadToken,issueWriteToken,request,enabled,writeEnabled,now]
   .every(available),'INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 const writable=()=>{active();need(writeEnabled()===true,'WRITE_DISABLED');};
 // All these helpers use the actual D1 binding; no arbitrary candidate
 // hint or source-attestation callback can be substituted at the host.
 const trees=createD6ProductionTreeCandidateCustody({
  DB,enabled,now,
 });
 const commits=createD6ProductionCommitCandidateCustody({
  DB,enabled,now,
 });
 const precondition=createD6ProductionPublishSourcePrecondition({
  request,issueReadToken,enabled,
 });
 const writeGrant=async params=>{
  writable();
  return issueWriteToken(params);
 };
 function createStepSet({loadAcceptedOperation,operationId,authRequest}={}){
  active();
  need(available(loadAcceptedOperation)&&UUID.test(operationId??'')&&
   authRequest instanceof Request&&authRequest.method==='POST',
   'UNTRUSTED_REQUEST_BOUND_LOADER');
  // No D1 read or remote HTTP is performed by constructing the step set.
  // Every actual attempt later reauthenticates via the same injected D2.
  const common={DB,session,loadAcceptedOperation,atomicPlanner,
   issueReadToken,issueWriteToken:writeGrant,request,enabled,now};
  const tree=createD6ProductionAtomicTreeStep({
   ...common,
   verifyPrerequisite:precondition.verifyPrerequisite,
   storeCandidateTreeHint:trees.storeCandidateTreeHint,
  });
  const treeProof=createD6ProductionAtomicTreeReconciliation({
   ...common,loadCandidateTreeHint:trees.loadCandidateTreeHint,
  });
  const branch=createD6ProductionPublishBranchCoordinator({
   ...common,verifyCurrentMain:precondition.verifyCurrentMain,
  });
  const commit=createD6ProductionPublishCommitCoordinator({
   ...common,verifyPrerequisite:precondition.verifyPrerequisite,
   storeCandidateCommitHint:commits.storeCandidateCommitHint,
   loadCandidateCommitHint:commits.loadCandidateCommitHint,
  });
  const advance=createD6ProductionPublishAdvanceCoordinator({
   ...common,verifyPrerequisite:precondition.verifyPrerequisite,
  });
  const pr=createD6ProductionPublishPrCoordinator({
   ...common,verifyPrerequisite:precondition.verifyPrerequisite,
  });
  // A direct coordinator attempt must not bypass #494's write switch.
  const protectedAttempt=impl=>readonly({
   attempt:async(req,id)=>{writable();return impl.attempt(req,id);},
  });
  const protectedReconcile=impl=>readonly({
   reconcile:async(req,id)=>{writable();return impl.reconcile(req,id);},
  });
  const coordinators=readonly({
   tree:protectedAttempt(tree),branch:protectedAttempt(branch),
   commit:protectedAttempt(commit),advance:protectedAttempt(advance),
   pr:protectedAttempt(pr),
  });
  const reconcilers=readonly({
   tree:protectedReconcile(treeProof),
   branch:protectedReconcile(branch),
   commit:protectedReconcile(commit),
   advance:protectedReconcile(advance),
   pr:protectedReconcile(pr),
  });
  need(STEPS.every(k=>
   available(coordinators[k]?.attempt)&&
   available(reconcilers[k]?.reconcile)),
   'INVALID_STEP_SET');
  return readonly({coordinators,reconcilers});
 }
 return Object.freeze({createStepSet});
}
