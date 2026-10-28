import test from 'node:test';
import assert from 'node:assert/strict';
import {assessV3Save09,assessPostPushLowerBound,MAX_CLICK_TO_PUBLIC_PROOF_MS}
 from '../src/d3-delivery-latency-gate.mjs';
const sha='a'.repeat(40),head='b'.repeat(40);
const good=()=>({
 domain:'gear',textOnly:true,timingBasis:'same-clock-monotonic',
 clickToPublicProofMs:59_999,
 proof:{
  canonicalRepository:'ginosega/fishing',
  canonicalMainCommitSha:sha,checkedPrHeadSha:head,
  exactHeadCheckVerified:true,ordinaryProtectedMergeVerified:true,
  independentPublicHttpGet:true,hostedBytesVerified:true,
  releaseIdentityVerified:true,publiclyAccessible:true,
  canonicalLive:true,sandboxVerified:false,
 },
});
test('V3-60-01: all nine observed Pages lower bounds already fail',()=>{
 for(const seconds of [99,85,183,100,117,138,99,95,164]){
  const report=assessPostPushLowerBound(seconds);
  assert.equal(report.verdict,'FAIL');
  assert.equal(report.reason,'POST_PUSH_ALONE_OVER_60_SECONDS');
 }
});
test('V3-60-02: a faster post-push lane alone cannot claim PASS',()=>{
 assert.equal(assessPostPushLowerBound(30).verdict,'INCOMPLETE');
});
test('V3-60-03: missing genuine click-to-proof duration cannot pass',()=>{
 const s=good();delete s.clickToPublicProofMs;
 assert.equal(assessV3Save09(s).verdict,'INCOMPLETE');
 s.clickToPublicProofMs=NaN;
 assert.equal(assessV3Save09(s).verdict,'INVALID');
});
test('V3-60-04: independent public and protected source evidence required',()=>{
 for(const field of [
  'exactHeadCheckVerified','ordinaryProtectedMergeVerified',
  'independentPublicHttpGet','hostedBytesVerified',
  'releaseIdentityVerified','publiclyAccessible','canonicalLive']){
  const s=good();s.proof[field]=false;
  assert.equal(assessV3Save09(s).verdict,'INCOMPLETE',field);
 }
 const s=good();s.proof.sandboxVerified=true;
 assert.equal(assessV3Save09(s).verdict,'INCOMPLETE');
});
test('V3-60-05: unauthenticated timing basis or wrong repository denied',()=>{
 const s=good();s.timingBasis='server-accepted-to-Live';
 assert.equal(assessV3Save09(s).verdict,'INCOMPLETE');
 s.timingBasis='same-clock-monotonic';
 s.proof.canonicalRepository='ginosega/fishing-p3-sandbox';
 assert.equal(assessV3Save09(s).verdict,'INCOMPLETE');
});
test('V3-60-06: 60-second inclusive edge; 60s+1ms fails',()=>{
 const s=good();s.clickToPublicProofMs=60_000;
 assert.equal(assessV3Save09(s).verdict,'PASS');
 s.clickToPublicProofMs=60_001;
 assert.equal(assessV3Save09(s).verdict,'FAIL');
 assert.equal(MAX_CLICK_TO_PUBLIC_PROOF_MS,60_000);
});
test('V3-60-07: Gear, KB, Catch ordinary text-only all covered',()=>{
 for(const domain of ['gear','kb','catch']){
  const s=good();s.domain=domain;
  assert.equal(assessV3Save09(s).verdict,'PASS');
 }
 const image=good();image.textOnly=false;
 assert.equal(assessV3Save09(image).verdict,'NOT_APPLICABLE');
});
test('V3-60-08: outage claims cannot bypass the gate',()=>{
 const s=good();s.externalProviderOutageClaim=true;
 assert.equal(assessV3Save09(s).verdict,'REVIEW_REQUIRED');
});
