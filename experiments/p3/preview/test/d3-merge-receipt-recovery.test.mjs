import test from 'node:test';
import assert from 'node:assert/strict';
import {sandbox,sample} from './d1-fixture.mjs';
import {createD3MergedReceiptVerifier,D3MergeVerificationError}
 from '../src/d3-merged-receipt-verifier.mjs';
import {createD3SandboxScheduledCoordinator}
 from '../src/d3-sandbox-scheduled-coordinator.mjs';
const ID=1430581407,OWNER=265665562;
const OP='p3_01234567-1234-4234-8234-123456789abc';
const BASE='a'.repeat(40),HEAD='b'.repeat(40),MERGE='c'.repeat(40);
const RUN=40565214328,PR=17,TREE='d'.repeat(40);
const API='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const branch='p3-test-'+OP.slice(3);
const expected=['pwa/Gear/gear.json'];
const good={
  pr:{number:PR,state:'closed',merged:true,merged_at:'2026-10-27T19:10:38Z',
   merge_commit_sha:MERGE,head:{repo:{id:ID},ref:branch,sha:HEAD},
   base:{repo:{id:ID},ref:'main',sha:BASE}},
  main:{object:{sha:MERGE}},
  headCommit:{sha:HEAD,tree:{sha:TREE},parents:[{sha:BASE}]},
  commit:{sha:MERGE,parents:[{sha:BASE}],
   files:[{filename:expected[0],status:'modified'}],
   commit:{tree:{sha:TREE},
    message:'FISH118 D3 isolated sandbox Gear/KB publication'}},
};
const rj=obj=>({ok:true,status:200,redirected:false,
 json:async()=>structuredClone(obj)});
function verifier({bad={},token=false,enabled=true}={}){
 const trace=[];
 const responses={
  [API]:{id:ID,full_name:'ginosega/fishing-p3-sandbox',private:true},
  [API+'/pulls/'+PR]:{...good.pr,...bad.pr},
  [API+'/git/ref/heads/main']:{...good.main,...bad.main},
  [API+'/commits/'+MERGE+'?per_page=100']:{...good.commit,...bad.commit},
  [API+'/git/commits/'+HEAD]:{...good.headCommit,...bad.headCommit},
  ...bad.responses,
 };
 const instance=createD3MergedReceiptVerifier({
  enabled:()=>enabled,
  issueReadToken:async arg=>{
   trace.push('read-token');
   assert.equal(arg.repositoryId,ID);
   assert.deepEqual(arg.permissions,{checks:'read',contents:'read',pull_requests:'read'});
   if(token)throw Error('No token');
   return {repositoryId:ID,token:'read-only-test-token',
    permissions:{checks:'read',contents:'read',pull_requests:'read'}};
  },
  request:async (url,options)=>{
   trace.push(options.method+' '+url);
   assert.equal(options.method,'GET');
   assert.equal(options.redirect,'manual');
   assert.equal(options.headers.Authorization,'Bearer read-only-test-token');
   if(url===API+'/pulls/'+PR+'/merge')return {ok:bad.mergeStatus===undefined||bad.mergeStatus===204,
    status:bad.mergeStatus??204,redirected:false};
   if(!(url in responses))throw Error('Unexpected remote URL');
   return rj(responses[url]);
  },
 });
 return {instance,trace};
}
const receipt={repositoryId:ID,operationId:OP,prNumber:PR,
 prHeadSha:HEAD,mainBaseSha:BASE,workflowRunId:RUN,expectedPaths:expected};
const refused=code=>error=>error instanceof D3MergeVerificationError&&error.code===code;

test('D3-RC01 read-only observer independently proves exact merged PR, parent, files and main',async()=>{
 const x=verifier();const r=await x.instance.verify(receipt);
 assert.deepEqual(r,{verified:true,repositoryId:ID,operationId:OP,
  prNumber:PR,prHeadSha:HEAD,mainBaseSha:BASE,mergeSha:MERGE,
  workflowRunId:RUN,canonicalLive:false});
 assert.equal(x.trace.filter(s=>s.startsWith('GET ')).length,9);
 assert.equal(x.trace.filter(s=>s!=='read-token'&&!s.startsWith('GET ')).length,0);
});
test('D3-RC02 open PR or moving main, wrong base/branch, wrong files or multi-parent fails closed',async()=>{
 for(const bad of [
  {pr:{state:'open'}},{mergeStatus:404},{mergeStatus:403},{mergeStatus:200},
  {pr:{merge_commit_sha:'f'.repeat(40)}},
  {headCommit:{tree:{sha:'e'.repeat(40)}}},
  {headCommit:{parents:[{sha:'e'.repeat(40)}]}},
  {commit:{commit:{tree:{sha:'e'.repeat(40)},message:'FISH118 D3 isolated sandbox Gear/KB publication'}}},
  {pr:{head:{repo:{id:ID},ref:'malicious',sha:HEAD}}},
  {main:{object:{sha:'f'.repeat(40)}}},
  {commit:{parents:[{sha:'f'.repeat(40)}]}},
  {commit:{parents:[{sha:BASE},{sha:'d'.repeat(40)}]}},
  {commit:{files:[{filename:'pwa/Catches/catches.json',status:'modified'}]}},
  {commit:{files:[{filename:expected[0],status:'modified'},{filename:'src/secret.mjs',status:'added'}]}},
 ]){
  const x=verifier({bad});
  await assert.rejects(x.instance.verify(receipt),e=>e instanceof D3MergeVerificationError);
 }
 const off=verifier({enabled:false});
 await assert.rejects(off.instance.verify(receipt),refused('RECOVERY_DISABLED'));
 assert.deepEqual(off.trace,[]);
});
test('D3-RC03 D1 CAS only after expired marker; preserves event audit and prevents repeats',async()=>{
 const x=sandbox(),store=x.store();
 const {operationId}=await store.accept({idempotencyKey:x.key,snapshot:sample});
 const lease='reconcile-owner-123456';
 for(const [from,to,details] of [
  ['Accepted','Validating',{}],
  ['Validating','Checking',{prNumber:PR,prHeadSha:HEAD,mainBaseSha:BASE}],
  ['Checking','Merging',{workflowRunId:RUN}],
 ]){
  assert.equal((await store.claim({operationId,leaseOwner:lease})).state,from);
  assert.equal((await store.advance({operationId,leaseOwner:lease,from,to,details})).state,to);
 }
 assert.equal((await store.claim({operationId,leaseOwner:lease})).state,'Merging');
 assert.equal(await store.markMergeAttempt({operationId,leaseOwner:lease}),true);
 assert.equal(await store.nextEligible(),null);
 assert.equal(await store.nextRecoverableMerge(),null);
 x.clock(31);
 assert.equal(await store.nextRecoverableMerge(),operationId);
 const evidence={verified:true,repositoryId:ID,operationId,prNumber:PR,
  prHeadSha:HEAD,mainBaseSha:BASE,mergeSha:MERGE,workflowRunId:RUN,
  canonicalLive:false};
 assert.equal(await store.reconcileVerifiedMerge({...evidence,prNumber:18}).then(()=>null,()=> 'refused'),'refused');
 assert.equal((await store.get(operationId)).state,'Merging');
 const updated=await store.reconcileVerifiedMerge(evidence);
 assert.equal(updated.state,'Deploying');
 assert.equal(updated.mergeSha,MERGE);
 assert.equal(updated.reasonCode,null);
 assert.equal(await store.nextRecoverableMerge(),null);
 await assert.rejects(store.reconcileVerifiedMerge(evidence));
 const events=await store.events(operationId);
 assert.equal(events.at(-1).from,'Merging');
 assert.equal(events.at(-1).to,'Deploying');
 assert.equal((await store.claim({operationId,leaseOwner:lease})).state,'Deploying');
 assert.equal((await store.advance({operationId,leaseOwner:lease,
  from:'Deploying',to:'Verifying'})).state,'Verifying');
});
test('D3-RC04 scheduled coordinator verifies completed merge via GET only, no fresh merge or worker claim',async()=>{
 const trace=[];
 let row={operationId:OP,state:'Merging',reasonCode:'merge_attempted',
  mergeSha:null,prNumber:PR,prHeadSha:HEAD,mainBaseSha:BASE,
  workflowRunId:RUN};
 const env={D3_RUNNER_ENABLED:'true',D3_WRITE_ENABLED:'true',
  D3_READ_TOKENS_ENABLED:'true',D3_TEST_HOST_ENABLED:'true',
  D3_SANDBOX_REPO_ID:String(ID),OWNER_GITHUB_ID:String(OWNER)};
 const repo={
  [API]:{id:ID,full_name:'ginosega/fishing-p3-sandbox',private:true},
  [API+'/pulls/'+PR]:good.pr,[API+'/git/ref/heads/main']:good.main,
  [API+'/commits/'+MERGE+'?per_page=100']:good.commit,
  [API+'/git/commits/'+HEAD]:good.headCommit,
 };
 const store={
  nextRecoverableMerge:async()=>OP,
  nextEligible:async()=>{throw Error('No operation replay permitted');},
  get:async()=>structuredClone(row),
  readSnapshot:async()=>({package:{format:'fishing-companion-change-v2',
   domain:'gear',operation:'edit',picture:{action:'keep'},
   pictureSequence:{action:'keep'},notes:{action:'keep'}},media:[]}),
  reconcileVerifiedMerge:async p=>{
   trace.push('d1-CAS');
   assert.equal(p.mergeSha,MERGE);
   assert.equal(p.operationId,OP);
   row={...row,mergeSha:p.mergeSha,state:'Deploying',reasonCode:null};
   return structuredClone(row);
  },
  claim:async()=>{throw Error('No runner claim')},
  advance:async()=>{throw Error('No ordinary runner advance')},
  branchReceipt:async()=>null,saveBranchReceipt:async()=>null,
  markMergeAttempt:async()=>{throw Error('Never repeat merge')},
  saveMergeReceipt:async()=>null,
 };
 const coordinator=createD3SandboxScheduledCoordinator({
  env,store,requestGitHub:async(url,opts)=>{
   trace.push(opts.method);assert.equal(opts.method,'GET');
   if(url===API+'/pulls/'+PR+'/merge')return {ok:true,status:204,redirected:false};
   return rj(repo[url]);
  },
  issueReadToken:async arg=>({repositoryId:ID,
   permissions:arg.permissions,token:'readonly-twelve-chars'}),
  issueWriteToken:async()=>{throw Error('No write tokens')},
  verifyHosted:async()=>{throw Error('No host request')},
 });
 const result=await coordinator.tick();
 assert.equal(result.state,'Deploying');
 assert.equal(result.reconciled,true);
 assert.equal(trace.filter(x=>x==='GET').length,9);
 assert.equal(trace.at(-1),'d1-CAS');
});

test('D3-RC05 live PR #18 exact squash and both KB files pass read-only evidence',async()=>{
 const op='p3_5527208d-a67c-4a2c-876d-9edaee353bc8';
 const base='7418cc15e5e392b6e52a48eb533804a5055ca8d7';
 const head='9276f35348e43a23c72208f3b2134e28554382fd';
 const merged='97f68efc932084f2e607480c12cee37a94f81758';
 const paths=['pwa/KB/kb.json','pwa/KB/Locations/content/P3 Test Lake.md'];
 const tree='dc90f7c4fdad86b79baa791af7e6f2b54c66711c';
 const pr={number:18,state:'closed',merged:true,
   merged_at:'2026-10-27T23:25:43Z',merge_commit_sha:merged,
   head:{repo:{id:ID},ref:'p3-test-'+op.slice(3),sha:head},
   base:{repo:{id:ID},ref:'main',sha:base}};
 const responses={
  [API]:{id:ID,full_name:'ginosega/fishing-p3-sandbox',private:true},
  [API+'/pulls/18']:pr,
  [API+'/git/ref/heads/main']:{object:{sha:merged}},
  [API+'/git/commits/'+head]:{
    sha:head,tree:{sha:tree},parents:[{sha:base}]},
  [API+'/commits/'+merged+'?per_page=100']:{
    sha:merged,parents:[{sha:base}],
    files:[{filename:paths[1],status:'modified'},
     {filename:paths[0],status:'modified'}],
    commit:{tree:{sha:tree},message:'FISH118 D3 isolated sandbox Gear/KB publication\\n\\nOwner-authorized sandbox-only text; no public canonical content'},
  },
 };
 const receipt={repositoryId:ID,operationId:op,prNumber:18,
  prHeadSha:head,mainBaseSha:base,workflowRunId:40600896518,
  expectedPaths:paths};
 let reads=0,mergeStatus=204;
 const instance=createD3MergedReceiptVerifier({
  enabled:()=>true,
  issueReadToken:async()=>({repositoryId:ID,
   token:'sandbox-read-test-token-18',
   permissions:{checks:'read',contents:'read',pull_requests:'read'}}),
  request:async (url,options)=>{
   assert.equal(options.method,'GET');
   if(url===API+'/pulls/18/merge'){
    reads++;
    return {ok:mergeStatus===204,status:mergeStatus,redirected:false};
   }
   assert.ok(url in responses,'unexpected URL '+url);
   reads++;
   return rj(responses[url]);
  },
 });
 const result=await instance.verify(receipt);
 assert.equal(result.mergeSha,merged);
 assert.equal(result.canonicalLive,false);
 assert.equal(reads,9);
 // No weakening of merge guards: discrepancies are specific and fail closed.
 for(const [field,value,errorCode] of [
   ['number',19,'PR_NUMBER_MISMATCH'],
   ['state','open','PR_NOT_CLOSED'],
   ['merge_commit_sha','f'.repeat(40),'PR_MERGE_SHA_CONFLICT'],
 ]){
  responses[API+'/pulls/18']={...pr,[field]:value};
  await assert.rejects(instance.verify(receipt),refused(errorCode));
 }
 // The 204 merged-status proof is authoritative even when GitHub PR
 // summary fields are stale/omitted; all immutable evidence is still checked.
 responses[API+'/pulls/18']={...pr,merged:false,merged_at:null,merge_commit_sha:null};
 assert.equal((await instance.verify(receipt)).mergeSha,merged);
 // The hosted App can omit the merged SHA entirely. Tree equality ties
 // the immutable PR head to current main, while 204 must remain valid.
 responses[API+'/pulls/18']={...pr,merge_commit_sha:undefined};
 assert.equal((await instance.verify(receipt)).mergeSha,merged);
 responses[API+'/pulls/18']={...pr,merge_commit_sha:null};
 responses[API+'/commits/'+merged+'?per_page=100']={
  ...responses[API+'/commits/'+merged+'?per_page=100'],
  commit:{tree:{sha:'f'.repeat(40)},
   message:'FISH118 D3 isolated sandbox Gear/KB publication'},
 };
 await assert.rejects(instance.verify(receipt),refused('MERGE_COMMIT_NOT_EXACT'));
 responses[API+'/commits/'+merged+'?per_page=100']={
  ...responses[API+'/commits/'+merged+'?per_page=100'],
  commit:{tree:{sha:tree},
   message:'FISH118 D3 isolated sandbox Gear/KB publication'},
 };
 for(const code of [404,403,200]){
  mergeStatus=code;
  await assert.rejects(instance.verify(receipt),
   refused('PR_MERGE_STATUS_UNVERIFIED'));
 }
 mergeStatus=204;
 responses[API+'/pulls/18']=pr;
 for(const [alter,errorCode] of [
  [{head:{...pr.head,repo:{id:123}}},'PR_HEAD_REPOSITORY_MISMATCH'],
  [{base:{...pr.base,repo:{id:123}}},'PR_BASE_REPOSITORY_MISMATCH'],
  [{base:{...pr.base,ref:'other'}},'PR_BASE_REF_MISMATCH'],
  [{head:{...pr.head,ref:'other'}},'PR_HEAD_BRANCH_MISMATCH'],
  [{head:{...pr.head,sha:'f'.repeat(40)}},'PR_HEAD_SHA_MISMATCH'],
  [{base:{...pr.base,sha:'f'.repeat(40)}},'PR_BASE_SHA_MISMATCH'],
 ]){
  responses[API+'/pulls/18']={...pr,...alter};
  await assert.rejects(instance.verify(receipt),refused(errorCode));
 }
});
