/**
 * FISH118 V3-SAVE-09 — one-shot reuse of a FULLY GitHub-verified immutable
 * sandbox source inside exactly one Validating coordinator invocation.
 * No persistent cache, credential/token storage, source relaxation or extra
 * mutable state. The PR adapter separately GETs main before/after writing
 * and the trusted candidate still performs all canonical validations.
 */
const ID=1430581407,OP=/^p3_[0-9a-f-]{36}$/,SHA=/^[a-f0-9]{40}$/;
export function createD3OneStepVerifiedSource({loadSnapshot}={}){
 if(typeof loadSnapshot!=='function')throw Error('INVALID_SOURCE_LOADER');
 let oneShot=null;
 async function currentMain({repositoryId,operationId}={}){
  oneShot=null;
  if(repositoryId!==ID||!OP.test(operationId??''))throw Error('INVALID_SOURCE_SCOPE');
  // This is the SAME independent full remote GitHub tree/blob/source
  // verification performed before the optimization. It checks that main
  // did not move between its initial and final HEAD reads.
  const source=await loadSnapshot({repositoryId:ID,operationId});
  if(source?.repositoryId!==ID||source.operationId!==operationId||
     !SHA.test(source.sourceRevision??''))
   throw Error('UNVERIFIED_SOURCE_SNAPSHOT');
  oneShot={operationId,revision:source.sourceRevision,source};
  return source.sourceRevision;
 }
 async function loadForCandidate(args={}){
  const prior=oneShot;
  oneShot=null; // At most one reuse, including when args don't match.
  // Exact owner/repository, operation and immutable main SHA MUST match.
  // Any mismatch uses the original fully verified remote loader, which
  // remains responsible for rejecting unauthorized/changed inputs.
  if(prior&&args.repositoryId===ID&&args.operationId===prior.operationId&&
     SHA.test(args.expectedMainSha??'')&&
     args.expectedMainSha===prior.revision)
   return prior.source;
  return loadSnapshot(args);
 }
 return Object.freeze({currentMain,loadForCandidate});
}
