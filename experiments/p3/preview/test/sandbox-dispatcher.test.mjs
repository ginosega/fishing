import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {sandbox,sample} from './d1-fixture.mjs';
import {createP3OwnerSessionGuard} from '../src/p3-owner-session-guard.mjs';
import {createSandboxDispatcher,DispatchError} from '../src/sandbox-dispatcher.mjs';

const ORIGIN='https://fishing-p3-sandbox-preview.ginosega.workers.dev';
const ID=1430581407,URL='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const HEAD='d'.repeat(40),TREE='b'.repeat(40),BLOB='c'.repeat(40);
const TOKEN='a'.repeat(48),CSRF='b'.repeat(48);
const digest=s=>createHash('sha256').update(s).digest('hex');
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
async function setup({publishing=true,missingReceipt=false}={}){
 const repo=await mkdtemp(path.join(tmpdir(),'fishing-p3-dispatcher-'));
 await mkdir(path.join(repo,'pwa','Gear'),{recursive:true});
 await writeFile(path.join(repo,'pwa','Gear','notes.md'),'Base\n');
 git(repo,'init','-q');
 git(repo,'config','user.name','Test');git(repo,'config','user.email','test@example.invalid');
 git(repo,'remote','add','origin','https://github.com/ginosega/fishing-p3-sandbox.git');
 git(repo,'add','.');git(repo,'commit','-q','-m','sandbox fixture');
 const MAIN=git(repo,'rev-parse','HEAD');
 const e=sandbox();
 e.sql.prepare('INSERT INTO p3_sessions(token_hash,github_id,csrf_hash,expires_at,created_at) VALUES(?,?,?,?,?)')
  .run(digest(TOKEN),778899,digest(CSRF),1800000000+604800,1800000000);
 const guard=createP3OwnerSessionGuard({DB:e.DB,ownerGitHubId:778899,origin:ORIGIN,now:()=>1800000000});
 const network=[];let branch=false,PR=false,cleanups=0,validators=0,enable=publishing;
 const reply=(obj,status=200)=>({status,ok:status>=200&&status<300,json:async()=>obj});
 const request=async(url,init)=>{
  network.push({url,method:init.method});
  if(init.method==='GET'&&url===URL)return reply({id:ID,full_name:'ginosega/fishing-p3-sandbox',private:true});
  if(init.method==='GET'&&url===URL+'/git/ref/heads/main')return reply({object:{sha:MAIN}});
  if(init.method==='GET'&&url.startsWith(URL+'/git/ref/heads/p3-test-'))
   return branch?reply({object:{sha:HEAD}}):reply({},404);
  if(init.method==='GET'&&url===URL+'/git/commits/'+MAIN)
   return reply({sha:MAIN,tree:{sha:TREE}});
  if(init.method==='GET'&&url===URL+'/git/commits/'+HEAD)
   return reply({sha:HEAD,tree:{sha:TREE},parents:[{sha:MAIN}]});
  if(init.method==='GET'&&url.includes('/pulls?')){
   return reply(PR?[{number:9,head:{sha:HEAD,ref:branch,repo:{id:ID}},base:{ref:'main',repo:{id:ID}},
    state:'open',merged_at:null}]:[]);
  }
  if(init.method==='POST'&&url.endsWith('/git/blobs'))return reply({sha:BLOB},201);
  if(init.method==='POST'&&url.endsWith('/git/trees'))return reply({sha:TREE},201);
  if(init.method==='POST'&&url.endsWith('/git/commits'))return reply({sha:HEAD},201);
  if(init.method==='POST'&&url.endsWith('/git/refs')){
   branch=JSON.parse(init.body).ref.slice('refs/heads/'.length);
   return reply({ref:'refs/heads/'+branch,object:{sha:HEAD}},201);
  }
  if(init.method==='POST'&&url.endsWith('/pulls')){
   PR=true;
   return reply({number:9,head:{sha:HEAD,ref:branch,repo:{id:ID}},
    base:{ref:'main',repo:{id:ID}},state:'open',merged_at:null},201);
  }
  throw Error('Unhandled mock GitHub URL '+url);
 };
 const make=()=>createSandboxDispatcher({
  guard,store:e.store(),
  trustedCheckout:async({repositoryId,commitSha})=>({repositoryId,repository:'ginosega/fishing-p3-sandbox',commitSha,root:repo}),
  releaseCheckout:async()=>{cleanups++;},
  sourceAware:{promote:async({snapshot})=>{
   validators++;assert.equal(snapshot.mainSha,MAIN);
   return {validated:true,sourceRevision:MAIN,
    changes:[{action:'write',path:'Gear/Gear.json',body:'{"sample":true}\n'}]};
  }},
  readMainSha:async()=>({repositoryId:ID,sha:MAIN}),
  issueToken:async()=>({repositoryId:ID,permissions:{contents:'write',pull_requests:'write'},token:'example_sandbox_scoped_token'}),
  githubFetch:request,
  publishingGate:()=>enable,
 });
 const makeRequest=(changes={})=>{
  const body=changes.body??{idempotencyKey:e.key,snapshot:sample};
  const headers=new Headers({
   Origin:ORIGIN,'Sec-Fetch-Site':'same-origin','X-P3-Intent':'publish',
   'Content-Type':'application/json','X-P3-CSRF':CSRF,
   Cookie:'__Host-fish_p3_session='+TOKEN,
  });
  for(const [key,value] of Object.entries(changes.headers??{})){
   if(value===null)headers.delete(key);else headers.set(key,value);
  }
  return new Request(ORIGIN+'/publications',{method:'POST',headers,body:JSON.stringify(body)});
 };
 return {e,make,makeRequest,MAIN,network,counts:()=>({validators,cleanups,branch:!!branch,PR}),disable:()=>{enable=false;},
  cleanup:()=>rm(repo,{recursive:true,force:true})};
}
test('P3-X01 full mocked API + real D1 session, acceptance, exact checkout and receipt to Checking',async()=>{
 const f=await setup();
 try{
  const service=f.make();
  const accepted=await service.accept(f.makeRequest());
  assert.equal(accepted.state,'Accepted');
  assert.equal(accepted.inserted,true);
  assert.equal((await service.accept(f.makeRequest())).operationId,accepted.operationId);
  assert.equal((await service.step(accepted.operationId)).state,'Validating');
  const done=await service.step(accepted.operationId);
  assert.equal(done.state,'Checking');
  const saved=await f.e.store().get(accepted.operationId);
  assert.equal(saved.prNumber,9);
  assert.equal(saved.prHeadSha,HEAD);
  assert.deepEqual(await f.e.store().branchReceipt(accepted.operationId),
   {repositoryId:ID,baseSha:f.MAIN,headSha:HEAD});
  assert.equal(f.counts().validators,1);
  assert.equal(f.counts().cleanups,1);
  assert.equal(f.counts().PR,true);
  assert.equal(f.network.filter(x=>x.method==='POST'&&x.url.endsWith('/pulls')).length,1);
  assert.equal((await service.step(accepted.operationId)).action,'no_automatic_advance');
 }finally{await f.cleanup();}
});
test('P3-X02 unauthorized Origin and CSRF cannot persist any operation',async()=>{
 const f=await setup();
 try{
  const svc=f.make();
  for(const headers of [{Origin:'https://attacker.invalid'},{'X-P3-CSRF':'c'.repeat(48)}]){
   await assert.rejects(svc.accept(f.makeRequest({headers})));
  }
  assert.equal(f.e.sql.prepare('SELECT count(*) as n FROM p3_operations').get().n,0);
  assert.equal(f.network.length,0);
 }finally{await f.cleanup();}
});
test('P3-X03 write-disable gate blocks any token, network or operation claim',async()=>{
 const f=await setup({publishing:false});
 try{
  const svc=f.make(),accepted=await svc.accept(f.makeRequest());
  await assert.rejects(svc.step(accepted.operationId),
   e=>e instanceof DispatchError&&e.code==='WRITES_DISABLED');
  assert.equal(f.network.length,0);
  assert.equal((await f.e.store().get(accepted.operationId)).state,'Accepted');
 }finally{await f.cleanup();}
});
