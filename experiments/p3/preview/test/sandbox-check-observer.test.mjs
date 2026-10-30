import test from 'node:test';
import assert from 'node:assert/strict';
import {createSandboxCheckObserver,SandboxCheckError} from '../src/sandbox-check-observer.mjs';
const ID=1430581407,API='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const HEAD='a'.repeat(40),BASE='b'.repeat(40),PR=25;
const BRANCH='p3-test-00000000-1111-4111-8111-123456789abc';
const scope={contents:'read',pull_requests:'read',checks:'read'};
const denied=code=>e=>e instanceof SandboxCheckError&&e.code===code;
const receipt=()=>({repositoryId:ID,prNumber:PR,expectedHeadSha:HEAD,
 expectedBaseSha:BASE,expectedBranch:BRANCH});
function setup({
 enabled=true,scopeOverride=null,repoId=ID,
 mainMovedInitially=false,mainMovedFinally=false,
 prOverride=null,prMovedFinally=false,checkOverride=null,
 checksOverride=null,missingReadToken=false,httpError=null,
 networkFailure=null,invalidJson=null,
}={}){
 const calls=[];let mainReads=0,prReads=0,issued=0;
 const pr=()=>({number:PR,state:'open',draft:true,merged:false,
  merged_at:null,head:{sha:HEAD,ref:BRANCH,repo:{id:ID}},
  base:{sha:BASE,ref:'main',repo:{id:ID}}});
 const ci=()=>({id:101,name:'validate-sandbox-head',head_sha:HEAD,
  app:{id:15368},status:'completed',conclusion:'success',
  details_url:'https://github.com/ginosega/fishing-p3-sandbox/actions/runs/10001/job/101'});
 const json=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});
 const request=async(url,init)=>{
  calls.push({url,method:init.method,headers:init.headers});
  assert(url===API||url.startsWith(API+'/'));
  assert.equal(init.method,'GET');
  assert.equal(init.headers['User-Agent'],'fishing-p3-sandbox-publisher');
  if(httpError&&url.includes(httpError))return json({message:'denied'},403);
  if(networkFailure&&url.includes(networkFailure))throw Error('connection refused');
  if(invalidJson&&url.includes(invalidJson))return {ok:true,status:200,json:async()=>{throw Error('bad JSON');}};
  if(url===API)return json({id:repoId,full_name:'ginosega/fishing-p3-sandbox',private:true});
  if(url===API+'/git/ref/heads/main'){
   mainReads++;
   return json({object:{sha:(mainMovedInitially&&mainReads===1)||
     (mainMovedFinally&&mainReads>1)?'f'.repeat(40):BASE}});
  }
  if(url===API+'/pulls/'+PR){
   prReads++;
   return json(prMovedFinally&&prReads>1?
    {...pr(),head:{...pr().head,sha:'e'.repeat(40)}}:{...pr(),...prOverride});
  }
  if(url===API+'/commits/'+HEAD+'/check-runs?per_page=100&filter=latest'){
   if(checksOverride)return json(checksOverride);
   return json({total_count:1,check_runs:[{...ci(),...checkOverride}]});
  }
  throw Error('Unexpected URL '+url);
 };
 const issueCheckReadToken=async args=>{
  issued++;
  assert.equal(args.repositoryId,ID);
  assert.deepEqual(args.permissions,scope);
  return missingReadToken?null:{repositoryId:ID,
   permissions:scopeOverride??scope,token:'read-only-p3-checks-example-token'};
 };
 const observer=createSandboxCheckObserver({request,issueCheckReadToken,enabled:()=>enabled});
 return {observer,calls,get issued(){return issued;}};
}
test('P3-C01 inactive observer cannot request token or contact GitHub',async()=>{
 const s=setup({enabled:false});
 await assert.rejects(s.observer.observe(receipt()),denied('OBSERVER_DISABLED'));
 assert.equal(s.calls.length,0);
 assert.equal(s.issued,0);
});
test('P3-C02 success requires exact PR head/base, current main, Actions check and read-only scope',async()=>{
 const s=setup();
 const proof=await s.observer.observe(receipt());
 assert.deepEqual(proof,{
  repositoryId:ID,prNumber:PR,headSha:HEAD,baseSha:BASE,
  checkRunId:101,workflowRunId:10001,checkName:'validate-sandbox-head',actionsAppId:15368,
  checkObserved:'success',readyForManualReview:true,canMerge:false,canDeploy:false,
 });
 assert.equal(s.calls.length,6);
 assert(s.calls.every(c=>c.method==='GET'));
 assert(!s.calls.some(c=>c.url.includes('/merge')));
});
test('P3-C03 wrong receipt identity or SHA is refused before token issuance',async()=>{
 for(const input of [
  {repositoryId:1350909744},{prNumber:0},{expectedBaseSha:HEAD},
  {expectedHeadSha:'not-a-sha'},{expectedBranch:'../other'},
  {expectedBranch:'main'},
 ]){
  const s=setup();
  await assert.rejects(s.observer.observe({...receipt(),...input}),
   denied('INVALID_TRUSTED_RECEIPT'));
  assert.equal(s.calls.length,0);
  assert.equal(s.issued,0);
 }
});
test('P3-C04 missing Checks read scope or any write scope is refused',async()=>{
 for(const permissions of [
  {contents:'read',pull_requests:'read'},
  {checks:'write',contents:'read',pull_requests:'read'},
  {checks:'read',contents:'write',pull_requests:'read'},
  {checks:'read',contents:'read',pull_requests:'read',administration:'read'},
 ]){
  const s=setup({scopeOverride:permissions});
  await assert.rejects(s.observer.observe(receipt()),denied('READ_TOKEN_SCOPE_DENIED'));
  assert.equal(s.calls.length,0);
 }
 const s=setup({missingReadToken:true});
 await assert.rejects(s.observer.observe(receipt()),denied('READ_TOKEN_SCOPE_DENIED'));
});
test('P3-C05 wrong repository ID cannot masquerade as sandbox',async()=>{
 const s=setup({repoId:1350909744});
 await assert.rejects(s.observer.observe(receipt()),denied('REPOSITORY_DENIED'));
 assert.equal(s.calls.length,1);
});
test('P3-C06 moving main before or during checks fails closed',async()=>{
 for(const options of [{mainMovedInitially:true},{mainMovedFinally:true}]){
  const s=setup(options);
  await assert.rejects(s.observer.observe(receipt()),denied('MAIN_MOVED'));
 }
});
test('P3-C07 changed PR SHA, repo ID, branch, state, draft, merge status or number refuses',async()=>{
 const mutations=[
  {draft:false},{state:'closed'},{merged:true},{merged_at:'2026-10-23T18:00:00Z'},
  {number:999},{head:{sha:HEAD,ref:'bad',repo:{id:ID}}},
  {head:{sha:'c'.repeat(40),ref:BRANCH,repo:{id:ID}}},
  {base:{sha:BASE,ref:'release',repo:{id:ID}}},
  {base:{sha:BASE,ref:'main',repo:{id:1350909744}}},
 ];
 for(const prOverride of mutations){
  const s=setup({prOverride});
  await assert.rejects(s.observer.observe(receipt()));
 }
 const s=setup({prMovedFinally:true});
 await assert.rejects(s.observer.observe(receipt()),denied('PR_HEAD_OR_BASE_MOVED'));
});
test('P3-C08 failed, skipped, pending or forged Actions check never passes',async()=>{
 for(const [patch,code] of [
  [{status:'in_progress',conclusion:null},'CHECK_PENDING'],
  [{status:'completed',conclusion:'failure'},'CHECK_NOT_SUCCESSFUL'],
  [{status:'completed',conclusion:'skipped'},'CHECK_NOT_SUCCESSFUL'],
  [{status:'completed',conclusion:'neutral'},'CHECK_NOT_SUCCESSFUL'],
  [{app:{id:999}},'CHECK_IDENTITY_DENIED'],
  [{head_sha:'d'.repeat(40)},'CHECK_IDENTITY_DENIED'],
  [{details_url:'https://evil.example/actions/runs/10001'},'WORKFLOW_PROVENANCE_DENIED'],
  [{id:'not-a-number'},'CHECK_IDENTITY_DENIED'],
 ]){
  const s=setup({checkOverride:patch});
  await assert.rejects(s.observer.observe(receipt()),denied(code));
 }
});
test('P3-C09 missing, duplicate and truncated check responses fail',async()=>{
 const good={id:101,name:'validate-sandbox-head',
  head_sha:HEAD,app:{id:15368},status:'completed',conclusion:'success'};
 for(const [checksOverride,code] of [
  [{total_count:0,check_runs:[]},'CHECK_MISSING_OR_AMBIGUOUS'],
  [{total_count:2,check_runs:[good,{...good,id:102}]},'CHECK_MISSING_OR_AMBIGUOUS'],
  [{total_count:2,check_runs:[good]},'CHECK_RESULTS_INCOMPLETE'],
  [{total_count:101,check_runs:[good]},'CHECK_RESULTS_INCOMPLETE'],
 ]){
  const s=setup({checksOverride});
  await assert.rejects(s.observer.observe(receipt()),denied(code));
 }
});
test('P3-C10 GitHub 403, network errors and invalid JSON are never success',async()=>{
 for(const [options,code] of [
  [{httpError:'/check-runs'},'GITHUB_READ_FAILED'],
  [{networkFailure:'/check-runs'},'GITHUB_NETWORK_ERROR'],
  [{invalidJson:'/check-runs'},'INVALID_GITHUB_JSON'],
 ]){
  const s=setup(options);
  await assert.rejects(s.observer.observe(receipt()),denied(code));
 }
});
test('P3-C11 positive observation has no git mutation, deployment or merge method',async()=>{
 const s=setup();
 const proof=await s.observer.observe(receipt());
 assert.equal(proof.canMerge,false);
 assert.equal(proof.canDeploy,false);
 assert.deepEqual(Object.keys(s.observer),['observe']);
 assert.equal(Object.isFrozen(proof),true);
});
