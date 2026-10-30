/**
 * FISH118 / V3-SAVE-09 -- SOURCE-ONLY acceptance evidence grader.
 *
 * This does not perform any remote verification or make content Live.
 * A trusted external test harness must obtain the evidence, independently
 * fetch public bytes, and time the entire click-to-proof interval using the
 * SAME monotonic clock. Never pass a server time as the click timestamp.
 *
 * No production runtime imports this module. No credentials or write paths.
 */
export const MAX_CLICK_TO_PUBLIC_PROOF_MS=60_000;
const domains=new Set(['gear','kb','catch']);
const sha=/^[a-f0-9]{40}$/;
const has=v=>v!==null&&v!==undefined;
const result=(verdict,reason,elapsedMs=null)=>Object.freeze({
 verdict,reason,elapsedMs,
 maxMs:MAX_CLICK_TO_PUBLIC_PROOF_MS,
});
/**
 * Grade a NORMAL text-only Save and Publish acceptance sample, but only
 * when independently acquired evidence has been provided by the test harness.
 * An attestation-shaped object does not itself prove GitHub or HTTP identity.
 *
 * elapsedMs must be monotonic from UI click to final independent PUBLIC GET
 * and byte/release verification, NOT from D1 Accepted, CI, merge, or deploy.
 */
export function assessV3Save09(sample){
 if(!sample||typeof sample!=='object'||Array.isArray(sample))
  return result('INCOMPLETE','MISSING_SAMPLE');
 if(!domains.has(sample.domain)||sample.textOnly!==true)
  return result('NOT_APPLICABLE','NOT_NORMAL_TEXT_ONLY');
 if(sample.externalProviderOutageClaim===true)
  return result('REVIEW_REQUIRED','OUTAGE_NEEDS_INDEPENDENT_EVIDENCE');
 const elapsed=sample.clickToPublicProofMs;
 if(!has(elapsed))return result('INCOMPLETE','CLICK_TO_PROOF_MISSING');
 if(!Number.isFinite(elapsed)||elapsed<0)
  return result('INVALID','INVALID_MONOTONIC_DURATION');
 if(sample.timingBasis!=='same-clock-monotonic')
  return result('INCOMPLETE','UNTRUSTED_TIMING_BASIS');
 const proof=sample.proof;
 if(!proof||typeof proof!=='object'||Array.isArray(proof)||
    proof.canonicalRepository!=='ginosega/fishing'||
    !sha.test(proof.canonicalMainCommitSha??'')||
    !sha.test(proof.checkedPrHeadSha??'')||
    proof.exactHeadCheckVerified!==true||
    proof.ordinaryProtectedMergeVerified!==true||
    proof.independentPublicHttpGet!==true||
    proof.hostedBytesVerified!==true||
    proof.releaseIdentityVerified!==true||
    proof.publiclyAccessible!==true||
    proof.canonicalLive!==true||
    proof.sandboxVerified===true)
  return result('INCOMPLETE','PUBLIC_CANONICAL_PROOF_MISSING');
 if(elapsed>MAX_CLICK_TO_PUBLIC_PROOF_MS)
  return result('FAIL','OVER_60_SECONDS',elapsed);
 return result('PASS','VERIFIED_WITHIN_60_SECONDS',elapsed);
}
/**
 * Current historical Actions-to-hosted proof is a strict LOWER BOUND on the
 * full click-to-proof time, because source validation/PR/merge happen before
 * the Actions run exists. This does NOT certify a future optimized lane.
 */
export function assessPostPushLowerBound(seconds){
 if(!Number.isFinite(seconds)||seconds<0)
  return result('INVALID','INVALID_LOWER_BOUND');
 const ms=seconds*1000;
 return ms>MAX_CLICK_TO_PUBLIC_PROOF_MS
  ?result('FAIL','POST_PUSH_ALONE_OVER_60_SECONDS',ms)
  :result('INCOMPLETE','EARLIER_STAGES_AND_PUBLIC_PROOF_REQUIRED',ms);
}
