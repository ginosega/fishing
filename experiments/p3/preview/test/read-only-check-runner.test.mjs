import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {sandbox,sample} from './d1-fixture.mjs';
import {createReadOnlyP3CheckRunner} from '../src/read-only-check-runner.mjs';
import {createD1CheckLeaseReader} from '../src/d1-check-lease-reader.mjs';

const ID=1430581407,HEAD='a'.repeat(40),BASE='b'.repeat(40);
const OP='p3_00000001-1111-4111-8111-123456789abc';
const BRANCH='p3-test-00000001-1111-4111-8111-123456789abc';
const API='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const READ_SCOPE={contents:'read',pull_requests:'read',checks:'read'};
async function fixture(){
 const f=sandbox();let tick=1800000000;
 const accepted=await f.store().accept({idempotencyKey:f.key,snapshot:sample});
 assert.equal(accepted.operationId,OP);
 const store=f.store();
 let c=await store.claim({operationId:OP,leaseOwner:'owner-validating-lease-0001'});
 assert.equal(c.state,'Accepted');
 await store.advance({operationId:OP,leaseOwner:'owner-validating-lease-0001',
  from:'Accepted',to:'Validating'});
 c=await store.claim({operationId:OP,leaseOwner:'owner-draft-lease-0002'});
 assert.equal(c.state,'Validating');
 await store.saveBranchReceipt({operationId:OP,leaseOwner:'owner-draft-lease-0002',
  baseSha:BASE,headSha:HEAD});
 await store.advance({operationId:OP,leaseOwner:'owner-draft-lease-0002',
  from:'Validating',to:'Checking',
  details:{prNumber:17,prHeadSha:HEAD,mainBaseSha:BASE}});
 const env={P3_WRITE_ENABLED:'false',P3_CHECK_OBSERVATION_ENABLED:'false'};
 const requests=[],grants=[];let phase='completed',conclusion='success';
 let ownerApproved=false,moveMain=false,movePR=false;
 const request=async(url,init)=>{
  requests.push({url,method:init.method});
  assert.equal(init.method,'GET');
  assert.equal(init.headers.Authorization,'Bearer private_scoped_test_token_1234567890');
  const response=body=>({ok:true,json:async()=>body});
  if(url===API)return response({id:ID,full_name:'ginosega/fishing-p3-sandbox',private:true});
  if(url===API+'/git/ref/heads/main')
   return response({object:{sha:moveMain?'f'.repeat(40):BASE}});
  if(url===API+'/pulls/17')
   return response({number:17,state:'open',draft:true,merged:false,merged_at:null,
    head:{sha:movePR?'f'.repeat(40):HEAD,ref:BRANCH,repo:{id:ID}},
    base:{sha:BASE,ref:'main',repo:{id:ID}}});
  if(url===API+'/commits/'+HEAD+'/check-runs?per_page=100&filter=latest')
   return response({total_count:1,check_runs:[{
    name:'validate-sandbox-head',id:101,app:{id:15368},
    status:phase,conclusion,head_sha:HEAD,
   }]});
  throw Error('Unexpected GitHub URL');
 };
 const issueCheckReadToken=async payload=>{
  grants.push(payload);
  assert.deepEqual(payload,{repositoryId:ID,permissions:READ_SCOPE});
  return {repositoryId:ID,permissions:READ_SCOPE,token:'private_scoped_test_token_1234567890'};
 };
 const build=(changes={})=>createReadOnlyP3CheckRunner({
  env,DB:f.DB,ownerGitHubId:778899,request,issueCheckReadToken,
  operatorApproved:()=>ownerApproved,
  now:()=>tick,
  makeLease:()=> 'p3-check-observer-lease-00001',
  ...changes,
 });
 return {f,env,build,requests,grants,
  approve(){ownerApproved=true;env.P3_CHECK_OBSERVATION_ENABLED='true';},
  setPending(){phase='in_progress';conclusion=null;},
  setFailed(){phase='completed';conclusion='failure';},
  moveMain(){moveMain=true;},movePR(){movePR=true;},
  advance(seconds){tick+=seconds;f.clock(seconds);},
 };
}
test('P3-R01 no Checkout, dispatcher, PR writer, node process or HTTP route in read-only composition',async()=>{
 const f=await fixture();
 const runner=f.build();
 assert.deepEqual(Object.keys(runner),['observeCheck','get','getCheck','checkHistory']);
 for(const name of ['accept','createDraftStep','merge','deploy','issueWriteToken','publish'])
  assert.equal(name in runner,false,name);
 assert.equal((await runner.observeCheck(OP)).state,'Disabled');
 assert.equal(f.requests.length,0);
 assert.equal(f.grants.length,0);
});
test('P3-R02 read observation accepts only three independent opt-ins',async()=>{
 const f=await fixture();
 f.env.P3_CHECK_OBSERVATION_ENABLED='true';
 assert.equal((await f.build().observeCheck(OP)).state,'Disabled');
 f.approve();
 f.env.P3_WRITE_ENABLED='true';
 assert.equal((await f.build().observeCheck(OP)).state,'Disabled');
 f.env.P3_WRITE_ENABLED='false';
 f.env.P3_CHECK_OBSERVATION_ENABLED='false';
 assert.equal((await f.build().observeCheck(OP)).state,'Disabled');
 assert.equal(f.grants.length,0);
 assert.equal(f.requests.length,0);
});
test('P3-R03 read-only observer persists exact check success and holds Checking',async()=>{
 const f=await fixture();f.approve();
 const result=await f.build().observeCheck(OP);
 assert.deepEqual({state:result.state,reason:result.reasonCode,
  canMerge:result.canMerge,canDeploy:result.canDeploy},
  {state:'ManualReview',reason:'CI_SUCCESS_RECORDED',canMerge:false,canDeploy:false});
 assert.equal((await f.build().get(OP)).state,'Checking');
 assert.equal((await f.build().getCheck(OP)).checkRunId,101);
 assert.deepEqual((await f.build().checkHistory(OP)).map(x=>x.state),['passed']);
 assert.equal(f.requests.length,6);
 assert.equal(f.grants.length,1);
 assert(f.requests.every(x=>x.method==='GET'&&x.url.startsWith(API)));
});
test('P3-R04 restart does not re-read prior successful check',async()=>{
 const f=await fixture();f.approve();
 await f.build().observeCheck(OP);
 const prior=f.requests.length;
 assert.equal((await f.build().observeCheck(OP)).reasonCode,'CI_ALREADY_RECORDED');
 assert.equal(f.requests.length,prior);
 assert.equal((await f.build().checkHistory(OP)).length,1);
});
test('P3-R05 pending observation and later failed-check review respect cooldown and lease',async()=>{
 const f=await fixture();f.approve();f.setPending();
 assert.equal((await f.build().observeCheck(OP)).state,'RetryScheduled');
 const after=f.requests.length;
 assert.equal((await f.build().observeCheck(OP)).state,'Deferred');
 assert.equal(f.requests.length,after);
 f.advance(15);
 // The fixture has check phase pending; after some time the actual check concludes.
 f.env.P3_WRITE_ENABLED='false';
 // Change check conclusion via local fixture method only.
 f.setFailed();
 const out=await f.build().observeCheck(OP);
 assert.equal(out.state,'ManualReview');
 assert.equal((await f.build().getCheck(OP)).state,'review');
 assert.deepEqual((await f.build().checkHistory(OP)).map(x=>x.state),['retry','review']);
});
test('P3-R06 moved PR or main never becomes durable success',async()=>{
 for(const kind of ['main','pr']){
  const f=await fixture();f.approve();
  if(kind==='main')f.moveMain();else f.movePR();
  const out=await f.build().observeCheck(OP);
  assert.equal(out.state,'ManualReview');
  assert.equal((await f.build().getCheck(OP)).state,'review');
  assert.equal((await f.build().get(OP)).state,'Checking');
 }
});
test('P3-R07 owner isolation denies operation and avoids network access',async()=>{
 const f=await fixture();f.approve();
 const other=f.build({ownerGitHubId:778900});
 assert.equal((await other.observeCheck(OP)).state,'NotChecking');
 assert.equal(await other.get(OP),null);
 assert.equal(f.requests.length,0);
});
test('P3-R08 narrow D1 lease reader only claims Checking and cannot state-advance',async()=>{
 const f=await fixture();
 const reader=createD1CheckLeaseReader({DB:f.f.DB,ownerGitHubId:778899,
  now:()=>1800000000,leaseSeconds:30});
 assert.deepEqual(Object.keys(reader),['get','claim']);
 assert.equal((await reader.get(OP)).state,'Checking');
 assert.equal((await reader.claim({operationId:OP,leaseOwner:'ci-observer-lease-000001'})).state,'Checking');
 assert.equal(await reader.claim({operationId:OP,leaseOwner:'ci-observer-lease-000002'}),null);
 assert.equal(typeof reader.advance,'undefined');
 assert.equal((await f.f.store().get(OP)).state,'Checking');
});
test('P3-R09 observation cannot start with missing owner, DB or invalid claim config',async()=>{
 const f=await fixture();
 for(const changes of [{DB:null},{ownerGitHubId:0},{request:null},
   {operatorApproved:null},{issueCheckReadToken:7}]){
  assert.throws(()=>f.build(changes),/INVALID_READ_ONLY_RUNNER_CONFIGURATION/);
 }
 assert.throws(()=>createD1CheckLeaseReader({DB:f.f.DB,ownerGitHubId:778899,
  repositoryId:1350909744}),/INVALID_CHECK_LEASE_CONFIGURATION/);
});
test('P3-R10 source-level import chain must not reference any GitHub writer or Node Git checkout',async()=>{
 const root=new URL('../src/',import.meta.url);
 const files=['read-only-check-runner.mjs','d1-check-lease-reader.mjs',
  'd1-check-observation-store.mjs','sandbox-check-observer.mjs',
  'sandbox-check-coordinator.mjs','sandbox-check-read-token.mjs',
  'github-app-readonly.mjs'];
 const bodies=files.map(filename=>readFileSync(new URL(filename,root),'utf8'));
 const source=bodies.join('\n');
 assert.doesNotMatch(source,/from\s+['"][^'"]*(?:sandbox-dispatcher|sandbox-github-pr|trusted-sandbox-runner|checkout|trusted-sandbox-candidate|source-aware)['"]/);
 assert.doesNotMatch(source,/\b(?:node:child_process|spawnSync|execFileSync|git push|\/merge)\b/);
 assert.doesNotMatch(bodies[0],/\bcreateSandboxDispatcher\b|\bissueWriteToken\b/);
});
