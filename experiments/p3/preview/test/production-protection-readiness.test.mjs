import test from 'node:test';
import assert from 'node:assert/strict';
import {auditProductionBranchSummary,auditExactPRCheck,
 PROPOSED_REQUIRED_CHECK,EXPECTED_ACTIONS_APP_ID,
} from '../src/production-protection-readiness.mjs';

const SHA1='a'.repeat(40),SHA2='b'.repeat(40);
const name=PROPOSED_REQUIRED_CHECK;
const repo=()=>({id:1350909744,full_name:'ginosega/fishing',private:false});
const protectedMain=()=>({
 name:'main',commit:{sha:SHA1},protected:true,protection:{
  enabled:true,required_status_checks:{
   enforcement_level:'everyone',contexts:[name],
   checks:[{context:name,app_id:EXPECTED_ACTIONS_APP_ID}],
  },
 },
});
const pr=()=>({
 state:'open',merged_at:null,draft:false,
 head:{sha:SHA2,repo:{id:1350909744}},
 base:{sha:SHA1,repo:{id:1350909744},ref:'main'},
});
const success=()=>({
 total_count:1,check_runs:[{
  name,head_sha:SHA2,app:{id:EXPECTED_ACTIONS_APP_ID},
  status:'completed',conclusion:'success',
 }],
});
const args=()=>({pullRequest:pr(),checks:success(),
 expectedHeadSha:SHA2,expectedBaseSha:SHA1});

test('P3-P01 no branch protection means no production readiness (actual baseline)',()=>{
 const observed={name:'main',commit:{sha:SHA1},protected:false,
  protection:{enabled:false,required_status_checks:{
   enforcement_level:'off',contexts:[],checks:[],
  }}};
 const audit=auditProductionBranchSummary({repository:repo(),branch:observed});
 assert.equal(audit.observedReady,false);
 assert(audit.blockers.includes('MAIN_NOT_PROTECTED'));
 assert(audit.blockers.includes('STABLE_REQUIRED_CHECK_NOT_CONFIGURED'));
 assert.equal(audit.needsOwnerAdminVerification,true);
 assert.equal(audit.neverAuthorizesMerge,true);
});
test('P3-P02 protected production branch summary is only an observable subset',()=>{
 const audit=auditProductionBranchSummary({repository:repo(),branch:protectedMain()});
 assert.equal(audit.observedReady,true);
 assert.equal(audit.needsOwnerAdminVerification,true);
 assert.equal(audit.neverAuthorizesMerge,true);
});
test('P3-P03 cannot claim public production status using private sandbox or another repo',()=>{
 for(const repository of [
  {...repo(),private:true},
  {...repo(),id:1430581407,full_name:'ginosega/fishing-p3-sandbox',private:true},
  {...repo(),id:42},
 ]){
  assert(auditProductionBranchSummary({repository,branch:protectedMain()}).blockers
   .includes('WRONG_OR_PRIVATE_REPOSITORY'));
 }
});
test('P3-P04 required check must be enforced for admins, explicitly selected and Actions-pinned',()=>{
 const cases=[
  [b=>b.protection.required_status_checks.enforcement_level='non_admins',
   'STATUS_CHECKS_NOT_ENFORCED_FOR_ADMINS'],
  [b=>{b.protection.required_status_checks.contexts=[];
   b.protection.required_status_checks.checks=[];},'STABLE_REQUIRED_CHECK_NOT_CONFIGURED'],
  [b=>b.protection.required_status_checks.checks[0].app_id=42,
   'REQUIRED_CHECK_SOURCE_NOT_PINNED'],
  [b=>b.protection.enabled=false,'MAIN_NOT_PROTECTED'],
 ];
 for(const [mutate,code] of cases){
  const b=protectedMain();mutate(b);
  const audit=auditProductionBranchSummary({repository:repo(),branch:b});
  assert(audit.blockers.includes(code),JSON.stringify(audit));
 }
});
test('P3-P05 exact same-repository PR plus successful exact-head GitHub Actions check',()=>{
 const observed=auditExactPRCheck(args());
 assert.equal(observed.observedCheckPassed,true);
 assert.deepEqual(observed.blockers,[]);
 assert.equal(observed.neverAuthorizesMerge,true);
});
test('P3-P06 draft/merged/closed/cross-repo PR and stale base or head all refuse',()=>{
 const cases=[
  [p=>p.draft=true,'PR_NOT_MERGE_CANDIDATE'],
  [p=>p.state='closed','PR_NOT_MERGE_CANDIDATE'],
  [p=>p.merged_at='2026-10-23T00:00:00Z','PR_NOT_MERGE_CANDIDATE'],
  [p=>p.head.repo.id=1430581407,'PR_REPOSITORY_OR_BASE_DENIED'],
  [p=>p.base.ref='not-main','PR_REPOSITORY_OR_BASE_DENIED'],
  [p=>p.head.sha='e'.repeat(40),'STALE_PR'],
  [p=>p.base.sha='e'.repeat(40),'STALE_PR'],
 ];
 for(const [mutate,code] of cases){
  const a=args();mutate(a.pullRequest);
  assert(auditExactPRCheck(a).blockers.includes(code),code);
 }
});
test('P3-P07 pending, neutral, skipped, failed and absent CI do not pass',()=>{
 for(const [status,conclusion] of [
  ['queued',null],['in_progress',null],['completed','failure'],
  ['completed','cancelled'],['completed','skipped'],['completed','neutral'],
 ]) {
  const a=args();a.checks.check_runs[0].status=status;
  a.checks.check_runs[0].conclusion=conclusion;
  assert(auditExactPRCheck(a).blockers.includes('CHECK_NOT_SUCCESSFUL'));
 }
 const a=args();a.checks.check_runs=[];
 assert(auditExactPRCheck(a).blockers.includes('MISSING_OR_AMBIGUOUS_CHECK'));
});
test('P3-P08 wrong SHA, wrong App and forged duplicate check are rejected',()=>{
 const cases=[
  [a=>a.checks.check_runs[0].head_sha=SHA1,'CHECK_SHA_OR_SOURCE_MISMATCH'],
  [a=>a.checks.check_runs[0].app.id=15,'CHECK_SHA_OR_SOURCE_MISMATCH'],
  [a=>{a.checks.check_runs.push({...a.checks.check_runs[0]});
   a.checks.total_count=2;},'MISSING_OR_AMBIGUOUS_CHECK'],
  [a=>a.checks.total_count=101,'INCOMPLETE_CHECKS_RESPONSE'],
  [a=>a.checks.total_count=7,'INCOMPLETE_CHECKS_RESPONSE'],
 ];
 for(const [mutate,code] of cases){
  const a=args();mutate(a);
  assert(auditExactPRCheck(a).blockers.includes(code),code);
 }
});
test('P3-P09 check names are fixed by reviewed policy, not untrusted request',()=>{
 const a=args();
 a.requiredCheck='user-picked-green-check';
 assert(auditExactPRCheck(a).blockers.includes('MISSING_OR_AMBIGUOUS_CHECK'));
 assert(auditProductionBranchSummary({repository:repo(),branch:protectedMain(),
  requiredCheck:'other-check'}).blockers.includes('STABLE_REQUIRED_CHECK_NOT_CONFIGURED'));
});
