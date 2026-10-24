import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {sandbox,sample} from './d1-fixture.mjs';
import {createP3OwnerSessionGuard} from '../src/p3-owner-session-guard.mjs';
import {createD1OperationStore} from '../src/d1-operation-store.mjs';
import {createTrustedSandboxRunner} from '../src/trusted-sandbox-runner.mjs';

const ID=1430581407,API='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const HEAD='d'.repeat(40),TREE='b'.repeat(40),BLOB='c'.repeat(40);
const TOKEN='a'.repeat(48),CSRF='b'.repeat(48);
const ORIGIN='https://fishing-p3-sandbox-preview.ginosega.workers.dev';
const digest=s=>createHash('sha256').update(s).digest('hex');
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
const opId='p3_00000001-1111-4111-8111-123456789abc';
const expectedBranch='p3-test-'+opId.slice(3);
const reply=(data,status=200)=>({status,ok:status>=200&&status<300,json:async()=>data});
async function fixture(){
 const root=await mkdtemp(path.join(tmpdir(),'fishing-p3-trusted-runner-'));
 for(const folder of ['Gear','KB','Catches'])
  await mkdir(path.join(root,'pwa',folder),{recursive:true});
 await writeFile(path.join(root,'pwa/Gear/notes.md'),'Base\n');
 git(root,'init','-q');git(root,'config','user.name','P3 Test');
 git(root,'config','user.email','ci@example.invalid');
 git(root,'remote','add','origin','https://github.com/ginosega/fishing-p3-sandbox.git');
 git(root,'add','.');git(root,'commit','-q','-m','sandbox-fixture');
 const base=git(root,'rev-parse','HEAD');
 const e=sandbox();let at=1800000000;
 e.sql.prepare('INSERT INTO p3_sessions(token_hash,github_id,csrf_hash,expires_at,created_at) VALUES(?,?,?,?,?)')
  .run(digest(TOKEN),778899,digest(CSRF),1800000000+604800,1800000000);
 const guard=createP3OwnerSessionGuard({
  DB:e.DB,ownerGitHubId:778899,origin:ORIGIN,now:()=>at,
 });
 const env={P3_WRITE_ENABLED:'false',P3_CHECK_OBSERVATION_ENABLED:'false'};
 const writes=[],reads=[],readGrants=[];
 let branch=null,hasPR=false,checkStatus='completed',
  checkConclusion='success',changedMain=false,movedHead=false;
 const writeRequest=async(url,init)=>{
  writes.push({url,method:init.method});
  if(init.method==='GET'&&url===API)
   return reply({id:ID,full_name:'ginosega/fishing-p3-sandbox',private:true});
  if(init.method==='GET'&&url===API+'/git/ref/heads/main')
   return reply({object:{sha:base}});
  if(init.method==='GET'&&url===API+'/git/ref/heads/'+expectedBranch)
   return branch?reply({object:{sha:HEAD}}):reply({},404);
  if(init.method==='GET'&&url===API+'/git/commits/'+base)
   return reply({sha:base,tree:{sha:TREE}});
  if(init.method==='GET'&&url.includes('/pulls?'))
   return reply(hasPR?[{number:17,head:{ref:branch,sha:HEAD,repo:{id:ID}},
    base:{ref:'main',repo:{id:ID}},state:'open',merged_at:null}]:[]);
  if(init.method==='POST'&&url===API+'/git/blobs')
   return reply({sha:BLOB},201);
  if(init.method==='POST'&&url===API+'/git/trees')
   return reply({sha:TREE},201);
  if(init.method==='POST'&&url===API+'/git/commits')
   return reply({sha:HEAD},201);
  if(init.method==='POST'&&url===API+'/git/refs'){
   branch=JSON.parse(init.body).ref.slice('refs/heads/'.length);
   return reply({ref:'refs/heads/'+branch,object:{sha:HEAD}},201);
  }
  if(init.method==='POST'&&url===API+'/pulls'){
   hasPR=true;return reply({number:17,head:{ref:branch,sha:HEAD,repo:{id:ID}},
    base:{ref:'main',repo:{id:ID}},state:'open',merged_at:null},201);
  }
  throw Error('Unexpected write endpoint '+init.method+' '+url);
 };
 const readRequest=async(url,init)=>{
  reads.push({url,method:init.method});
  assert.equal(init.method,'GET');
  assert.equal(init.headers.Authorization,'Bearer scoped_read_check_token_0123456789');
  if(url===API)
   return reply({id:ID,full_name:'ginosega/fishing-p3-sandbox',private:true});
  if(url===API+'/git/ref/heads/main')
   return reply({object:{sha:changedMain?'f'.repeat(40):base}});
  if(url===API+'/pulls/17')
   return reply({number:17,state:'open',draft:true,merged:false,merged_at:null,
    head:{ref:expectedBranch,sha:movedHead?'e'.repeat(40):HEAD,repo:{id:ID}},
    base:{ref:'main',sha:base,repo:{id:ID}}});
  if(url===API+'/commits/'+HEAD+'/check-runs?per_page=100&filter=latest')
   return reply({total_count:1,check_runs:[{
    id:120492395098,name:'validate-sandbox-head',app:{id:15368},
    head_sha:HEAD,status:checkStatus,conclusion:checkConclusion,
   }]});
  throw Error('Unexpected read endpoint '+url);
 };
 const issueCheckReadToken=async payload=>{
  readGrants.push(payload);
  assert.deepEqual(payload,{repositoryId:ID,permissions:{
   contents:'read',pull_requests:'read',checks:'read',
  }});
  return {repositoryId:ID,permissions:payload.permissions,
   token:'scoped_read_check_token_0123456789'};
 };
 const deps={
  env,DB:e.DB,ownerGitHubId:778899,guard,
  trustedCheckout:async({repositoryId,commitSha})=>({
   repositoryId,repository:'ginosega/fishing-p3-sandbox',commitSha,root,
  }),
  releaseCheckout:async()=>{},
  sourceAware:{promote:async({snapshot})=>{
   assert.equal(snapshot.mainSha,base);
   return {validated:true,sourceRevision:base,
    changes:[{action:'write',path:'Gear/Gear.json',body:'{"ok":true}\n'}]};
  }},
  readMainSha:async()=>({repositoryId:ID,sha:base}),
  issueWriteToken:async()=>({repositoryId:ID,
   permissions:{contents:'write',pull_requests:'write'},token:'scoped_write_sandbox_token'}),
  writeRequest,readRequest,issueCheckReadToken,
  allowSandboxWrites:()=>true,allowCheckObservation:()=>true,
  now:()=>at,makeId:()=>opId,
  makeDraftLease:()=> 'p3-runner-draft-lease-1234',
  makeCheckLease:()=> 'p3-runner-check-lease-1234',
 };
 const runner=()=>createTrustedSandboxRunner(deps);
 function submitRequest(){
  return new Request(ORIGIN+'/publications',{method:'POST',headers:{
   Origin:ORIGIN,'Sec-Fetch-Site':'same-origin','X-P3-Intent':'publish',
   'Content-Type':'application/json','X-P3-CSRF':CSRF,
   Cookie:'__Host-fish_p3_session='+TOKEN,
  },body:JSON.stringify({idempotencyKey:e.key,snapshot:sample})});
 }
 async function setChecking(){
  env.P3_WRITE_ENABLED='true';
  const svc=runner();const accepted=await svc.accept(submitRequest());
  assert.equal(accepted.state,'Accepted');
  assert.equal((await svc.createDraftStep(opId)).state,'Validating');
  assert.equal((await svc.createDraftStep(opId)).state,'Checking');
  env.P3_WRITE_ENABLED='false';
  return svc;
 }
 return {root,e,env,deps,runner,submitRequest,setChecking,base,
  writes,reads,readGrants,opId,
  setCheck(status,conclusion){checkStatus=status;checkConclusion=conclusion;},
  moveMain(){changedMain=true;},moveHead(){movedHead=true;},
  advance(seconds){at+=seconds;e.clock(seconds);},
  cleanup:()=>rm(root,{recursive:true,force:true}),
 };
}
test('P3-I01 full accepted→draft→Checking→observed success, distinct read and write gates',async()=>{
 const f=await fixture();
 try{
  const publishRunner=await f.setChecking();
  assert.equal((await publishRunner.get(f.opId)).state,'Checking');
  assert.equal(f.writes.filter(x=>x.method==='POST'&&x.url===API+'/pulls').length,1);
  const writeCount=f.writes.length;
  const disabled=await publishRunner.observeCheck(f.opId);
  assert.equal(disabled.state,'Disabled');
  assert.equal(f.reads.length,0);
  f.env.P3_CHECK_OBSERVATION_ENABLED='true';
  const observed=await publishRunner.observeCheck(f.opId);
  assert.equal(observed.state,'ManualReview');
  assert.equal(observed.reasonCode,'CI_SUCCESS_RECORDED');
  assert.equal(observed.checkRunId,120492395098);
  assert.equal(observed.canMerge,false);
  assert.equal(observed.canDeploy,false);
  assert.equal((await publishRunner.get(f.opId)).state,'Checking');
  assert.deepEqual((await publishRunner.checkHistory(f.opId)).map(x=>x.state),['passed']);
  assert.equal((await publishRunner.getCheck(f.opId)).branch,expectedBranch);
  assert.equal(f.reads.length,6);
  assert.equal(f.readGrants.length,1);
  assert.equal(f.writes.length,writeCount);
  assert(!f.reads.some(x=>x.method!=='GET'));
  assert(!f.writes.some(x=>x.url.includes('/merge')));
 }finally{await f.cleanup();}
});
test('P3-I02 restarted trusted runner reuses durable check result with no GitHub fetch',async()=>{
 const f=await fixture();
 try{
  await f.setChecking();f.env.P3_CHECK_OBSERVATION_ENABLED='true';
  await f.runner().observeCheck(f.opId);
  const prior=f.reads.length;
  const restart=f.runner();
  assert.equal((await restart.observeCheck(f.opId)).reasonCode,'CI_ALREADY_RECORDED');
  assert.equal(f.reads.length,prior);
  assert.equal((await restart.checkHistory(f.opId)).length,1);
 }finally{await f.cleanup();}
});
test('P3-I03 pending CI with write disabled goes retry→success in a later runner',async()=>{
 const f=await fixture();
 try{
  await f.setChecking();f.env.P3_CHECK_OBSERVATION_ENABLED='true';
  f.setCheck('in_progress',null);
  const svc=f.runner();const pending=await svc.observeCheck(f.opId);
  assert.equal(pending.state,'RetryScheduled');
  assert.equal(pending.attempts,1);
  const initial=f.reads.length;
  assert.equal((await f.runner().observeCheck(f.opId)).state,'Deferred');
  assert.equal(f.reads.length,initial);
  f.advance(15);f.setCheck('completed','success');
  const done=await f.runner().observeCheck(f.opId);
  assert.equal(done.checkRunId,120492395098);
  assert.deepEqual((await svc.checkHistory(f.opId)).map(x=>x.state),['retry','passed']);
 }finally{await f.cleanup();}
});
test('P3-I04 stale or failed GitHub check never creates positive audit entry',async()=>{
 for(const mode of ['stale-head','stale-main','failed']){
  const f=await fixture();
  try{
   await f.setChecking();f.env.P3_CHECK_OBSERVATION_ENABLED='true';
   if(mode==='stale-main')f.moveMain();
   if(mode==='stale-head')f.moveHead();
   if(mode==='failed')f.setCheck('completed','failure');
   const result=await f.runner().observeCheck(f.opId);
   assert.equal(result.state,'ManualReview');
   assert.equal((await f.runner().getCheck(f.opId)).state,'review');
   assert.equal((await f.runner().get(f.opId)).state,'Checking');
   assert.equal(result.canMerge,false);
  }finally{await f.cleanup();}
 }
});
test('P3-I05 read-only observation explicitly refuses P3_WRITE_ENABLED=true',async()=>{
 const f=await fixture();
 try{
  await f.setChecking();f.env.P3_CHECK_OBSERVATION_ENABLED='true';
  f.env.P3_WRITE_ENABLED='true';
  const denied=await f.runner().observeCheck(f.opId);
  assert.equal(denied.state,'Disabled');
  assert.equal(f.readGrants.length,0);
  assert.equal(f.reads.length,0);
 }finally{await f.cleanup();}
});
test('P3-I06 runner defaults disabled even with real D1 and all supplied adapters',async()=>{
 const f=await fixture();
 try{
  const original=f.deps;
  const disabled=createTrustedSandboxRunner({...original,
   allowSandboxWrites:undefined,
   allowCheckObservation:undefined,
  });
  assert.equal((await disabled.observeCheck(f.opId)).state,'Disabled');
  assert.equal(f.readGrants.length,0);
  assert.equal(f.writes.length,0);
  assert.equal(await disabled.get(f.opId),null);
 }finally{await f.cleanup();}
});
test('P3-I07 only owner-scoped operation is visible, never another owner row',async()=>{
 const f=await fixture();
 try{
  await f.setChecking();
  f.env.P3_CHECK_OBSERVATION_ENABLED='true';
  const other=createTrustedSandboxRunner({...f.deps,ownerGitHubId:999001});
  const denied=await other.observeCheck(f.opId);
  assert.equal(denied.state,'NotChecking');
  assert.equal(await other.get(f.opId),null);
  assert.equal(f.reads.length,0);
 }finally{await f.cleanup();}
});
test('P3-I08 source-only runner exposes no merge, deploy or token methods',async()=>{
 const f=await fixture();
 try{
  assert.deepEqual(Object.keys(f.runner()),[
   'accept','createDraftStep','observeCheck','get','getCheck','checkHistory',
  ]);
  assert.equal('merge' in f.runner(),false);
  assert.equal('deploy' in f.runner(),false);
  assert.equal('issueToken' in f.runner(),false);
 }finally{await f.cleanup();}
});
