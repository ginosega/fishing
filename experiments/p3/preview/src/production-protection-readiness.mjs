/**
 * FISH118 P3-8 — source-only, observation-only protection/CI readiness.
 *
 * This module is NEVER a merge authorization by itself. It has no write
 * functions, GitHub credentials, deployment, or production integration.
 * Required-check configuration must be enforced independently by GitHub,
 * and the owner must confirm the full branch rule, including PR restrictions
 * and admin bypass, through GitHub's administrative UI.
 */
export const PRODUCTION_REPOSITORY=Object.freeze({
 id:1350909744,fullName:'ginosega/fishing',branch:'main',
});
export const EXPECTED_ACTIONS_APP_ID=15368;
export const PROPOSED_REQUIRED_CHECK='fishing-merge-ready';
const SHA=/^[a-f0-9]{40}$/;
const safeSha=s=>typeof s==='string'&&SHA.test(s);

export function auditProductionBranchSummary({repository,branch,
 requiredCheck=PROPOSED_REQUIRED_CHECK}={}){
 const blockers=[];
 const require=(condition,code)=>{if(!condition)blockers.push(code);};
 require(repository?.id===PRODUCTION_REPOSITORY.id&&
  repository?.full_name===PRODUCTION_REPOSITORY.fullName&&
  repository?.private===false,'WRONG_OR_PRIVATE_REPOSITORY');
 require(branch?.name==='main'&&branch?.commit?.sha&&
  safeSha(branch?.commit?.sha),'UNVERIFIED_MAIN');
 require(branch?.protected===true&&branch?.protection?.enabled===true,
  'MAIN_NOT_PROTECTED');
 const checks=branch?.protection?.required_status_checks;
 require(checks?.enforcement_level==='everyone','STATUS_CHECKS_NOT_ENFORCED_FOR_ADMINS');
 const named=new Set([...(Array.isArray(checks?.contexts)?checks.contexts:[]),
  ...(Array.isArray(checks?.checks)?checks.checks.map(x=>x?.context):[])]);
 require(typeof requiredCheck==='string'&&
  requiredCheck===PROPOSED_REQUIRED_CHECK&&named.has(requiredCheck),
  'STABLE_REQUIRED_CHECK_NOT_CONFIGURED');
 const selected=Array.isArray(checks?.checks)?
  checks.checks.filter(x=>x?.context===requiredCheck):[];
 if(selected.length){
  require(selected.length===1&&
   selected[0].app_id===EXPECTED_ACTIONS_APP_ID,
   'REQUIRED_CHECK_SOURCE_NOT_PINNED');
 }else{
  require(false,'REQUIRED_CHECK_SOURCE_NOT_PINNED');
 }
 return Object.freeze({
  observedReady:blockers.length===0,blockers:Object.freeze(blockers),
  // Read-only branch summary cannot establish PR requirements, other rule
  // matching, no bypass, and restrictions on force-push/deletion.
  needsOwnerAdminVerification:true,
  neverAuthorizesMerge:true,
 });
}


/**
 * GitHub Rulesets and classic branch protection are independent APIs:
 * an active ruleset protects the branch while the classic branch-protection
 * summary can still report enabled:false. This read-only audit verifies the
 * real Ruleset 25742040, not just a manually interpreted screenshot.
 */
export function auditProductionRuleset({repository,branch,ruleset,
 requiredCheck=PROPOSED_REQUIRED_CHECK}={}){
 const blockers=[];
 const need=(condition,code)=>{if(!condition)blockers.push(code);};
 need(repository?.id===PRODUCTION_REPOSITORY.id&&
  repository?.full_name===PRODUCTION_REPOSITORY.fullName&&
  repository?.private===false,'WRONG_OR_PRIVATE_REPOSITORY');
 need(branch?.name==='main'&&safeSha(branch?.commit?.sha)&&
  branch?.protected===true,'MAIN_NOT_PROTECTED');
 need(ruleset?.id===25742040&&ruleset?.source==='ginosega/fishing'&&
  ruleset?.source_type==='Repository'&&ruleset?.target==='branch'&&
  ruleset?.enforcement==='active','RULESET_NOT_ACTIVE_OR_TRUSTED');
 const conditions=ruleset?.conditions?.ref_name;
 need(Array.isArray(conditions?.include)&&
  (conditions.include.includes('~DEFAULT_BRANCH')||
   conditions.include.includes('refs/heads/main'))&&
  Array.isArray(conditions.exclude)&&conditions.exclude.length===0,
  'MAIN_NOT_TARGETED');
 need(Array.isArray(ruleset?.bypass_actors)&&
  ruleset.bypass_actors.length===0&&
  ruleset?.current_user_can_bypass==='never',
  'RULESET_HAS_BYPASS');
 const rules=Array.isArray(ruleset?.rules)?ruleset.rules:[];
 const get=(name)=>rules.filter(x=>x?.type===name);
 need(get('deletion').length===1,'DELETION_ALLOWED');
 need(get('non_fast_forward').length===1,'FORCE_PUSH_ALLOWED');
 const prs=get('pull_request');
 need(prs.length===1&&prs[0]?.parameters?.required_approving_review_count===0&&
  prs[0]?.parameters?.require_code_owner_review===false&&
  prs[0]?.parameters?.require_last_push_approval===false&&
  Array.isArray(prs[0]?.parameters?.required_reviewers)&&
  prs[0].parameters.required_reviewers.length===0,
  'PR_RULE_INCORRECT');
 const statusRules=get('required_status_checks');
 const checks=statusRules[0]?.parameters;
 need(statusRules.length===1&&
  checks?.strict_required_status_checks_policy===true&&
  checks?.do_not_enforce_on_create===false,
  'CHECKS_NOT_ENFORCED_STRICTLY');
 const required=checks?.required_status_checks;
 need(requiredCheck===PROPOSED_REQUIRED_CHECK&&
  Array.isArray(required)&&required.length===1&&
  required[0]?.context===requiredCheck&&
  required[0]?.integration_id===EXPECTED_ACTIONS_APP_ID,
  'REQUIRED_CHECK_INCORRECT');
 return Object.freeze({
  observedReady:blockers.length===0,
  blockers:Object.freeze(blockers),
  rulesetId:ruleset?.id??null,
  // Does not authorize a merge; the live caller still needs exact PR head,
  // current base, actual successful Actions check, and GitHub enforcement.
  neverAuthorizesMerge:true,
 });
}

export function auditExactPRCheck({pullRequest,checks,expectedHeadSha,
 expectedBaseSha,requiredCheck=PROPOSED_REQUIRED_CHECK}={}){
 const blockers=[];
 const require=(condition,code)=>{if(!condition)blockers.push(code);};
 const id=PRODUCTION_REPOSITORY.id;
 require(safeSha(expectedHeadSha)&&safeSha(expectedBaseSha)&&
  expectedHeadSha!==expectedBaseSha,'INVALID_EXPECTED_SHA');
 require(pullRequest?.state==='open'&&pullRequest?.merged_at==null&&
  pullRequest?.draft===false,'PR_NOT_MERGE_CANDIDATE');
 require(pullRequest?.head?.repo?.id===id&&pullRequest?.base?.repo?.id===id&&
  pullRequest?.base?.ref==='main','PR_REPOSITORY_OR_BASE_DENIED');
 require(pullRequest?.head?.sha===expectedHeadSha&&
  pullRequest?.base?.sha===expectedBaseSha,'STALE_PR');
 require(checks?.total_count===checks?.check_runs?.length&&
  Array.isArray(checks?.check_runs)&&checks.total_count<=100,
  'INCOMPLETE_CHECKS_RESPONSE');
 const exact=checks?.check_runs?.filter(run=>run?.name===requiredCheck)??[];
 require(requiredCheck===PROPOSED_REQUIRED_CHECK&&exact.length===1,
  'MISSING_OR_AMBIGUOUS_CHECK');
 const run=exact[0];
 require(run?.head_sha===expectedHeadSha&&
  run?.app?.id===EXPECTED_ACTIONS_APP_ID,
  'CHECK_SHA_OR_SOURCE_MISMATCH');
 // Explicitly refuse "skipped" and "neutral" for the publisher's own
 // pre-merge verification, even where GitHub protection accepts them.
 require(run?.status==='completed'&&run?.conclusion==='success',
  'CHECK_NOT_SUCCESSFUL');
 return Object.freeze({
  observedCheckPassed:blockers.length===0,
  blockers:Object.freeze(blockers),
  neverAuthorizesMerge:true,
 });
}
