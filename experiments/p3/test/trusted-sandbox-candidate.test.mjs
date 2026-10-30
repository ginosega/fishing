import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,appendFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createTrustedSandboxCandidate,TrustedCandidateError} from '../src/trusted-sandbox-candidate.mjs';
const ID=1430581407,REPO='ginosega/fishing-p3-sandbox',OP='p3_00000000-1111-4111-8111-123456789abc';
const pkg={format:'fishing-companion-change-v2',domain:'gear',operation:'edit',id:'sample'};
const denied=code=>e=>(assert.equal(e instanceof TrustedCandidateError,true),assert.equal(e.code,code),true);
function git(root,...args){return execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();}
async function fixture(){
 const root=await mkdtemp(path.join(tmpdir(),'fish-p3-trusted-'));
 for(const name of ['Gear','KB','Catches'])await mkdir(path.join(root,'pwa',name),{recursive:true});
 await writeFile(path.join(root,'pwa','Gear','sample.md'),'One\n');
 git(root,'init','-q');git(root,'config','user.name','Sandbox test');
 git(root,'config','user.email','test@example.invalid');
 git(root,'remote','add','origin','https://github.com/ginosega/fishing-p3-sandbox.git');
 git(root,'add','.');git(root,'commit','-q','-m','fixture');
 const sha=git(root,'rev-parse','HEAD');
 return {root,sha,cleanup:()=>rm(root,{recursive:true,force:true})};
}
function bridge(f,opts={}){
 let validated=0,cleanups=0;
 const store={readSnapshot:async()=>({package:pkg,media:[]})};
 const sourceAware={promote:async args=>{
  validated++;
  assert.equal(args.snapshot.mainSha,f.sha);
  assert.equal(args.snapshot.root,path.join(f.root,'pwa'));
  assert.equal(args.package.domain,'gear');
  return {validated:true,sourceRevision:f.sha,changes:[{action:'write',path:'Gear/Gear.json',body:'{}\n'}]};
 }};
 const trustedCheckout=async()=>({repositoryId:ID,repository:REPO,commitSha:f.sha,root:f.root});
 const releaseCheckout=async()=>{cleanups++;};
 const adapter=createTrustedSandboxCandidate({
  trustedCheckout:opts.trustedCheckout??trustedCheckout,
  store:opts.store??store,sourceAware:opts.sourceAware??sourceAware,
  releaseCheckout,
 });
 return {adapter,counts:()=>({validated,cleanups})};
}
const call=(adapter,sha)=>adapter({baseSha:sha,domain:'gear',operationId:OP});
test('P3-T01 independently checks clean Git HEAD/remote and promotes D1 snapshot',async()=>{
 const f=await fixture();
 try{
  const x=bridge(f),result=await call(x.adapter,f.sha);
  assert.equal(result.validated,true);
  assert.deepEqual(x.counts(),{validated:1,cleanups:1});
 }finally{await f.cleanup();}
});
test('P3-T02 dirty checkout and wrong immutable commit are denied',async()=>{
 const f=await fixture();
 try{
  await appendFile(path.join(f.root,'pwa','Gear','sample.md'),'changed\n');
  const x=bridge(f);
  await assert.rejects(call(x.adapter,f.sha),denied('CHECKOUT_DIRTY'));
  assert.deepEqual(x.counts(),{validated:0,cleanups:1});
  await assert.rejects(call(x.adapter,'f'.repeat(40)),denied('UNTRUSTED_CHECKOUT'));
 }finally{await f.cleanup();}
});
test('P3-T03 non-sandbox Git remote is never promoted as trusted',async()=>{
 const f=await fixture();
 try{
  git(f.root,'remote','set-url','origin','https://github.com/ginosega/fishing.git');
  const x=bridge(f);
  await assert.rejects(call(x.adapter,f.sha),denied('CHECKOUT_REMOTE_DENIED'));
  assert.equal(x.counts().validated,0);
 }finally{await f.cleanup();}
});
test('P3-T04 durable snapshot mismatch and unvalidated promoter are rejected',async()=>{
 const f=await fixture();
 try{
  const x=bridge(f,{store:{readSnapshot:async()=>({package:{...pkg,domain:'kb'},media:[]})}});
  await assert.rejects(call(x.adapter,f.sha),denied('INVALID_DURABLE_SNAPSHOT'));
  const y=bridge(f,{sourceAware:{promote:async()=>({validated:false,sourceRevision:f.sha,changes:[]})}});
  await assert.rejects(call(y.adapter,f.sha),denied('VALIDATION_FAILED'));
 }finally{await f.cleanup();}
});
test('P3-T05 source-aware errors propagate, and checkout gets cleaned up',async()=>{
 const f=await fixture();
 try{
  const x=bridge(f,{sourceAware:{promote:async()=>{throw new Error('canonical inventory invalid');}}});
  await assert.rejects(call(x.adapter,f.sha),/canonical inventory invalid/);
  assert.equal(x.counts().cleanups,1);
 }finally{await f.cleanup();}
});

test('P3-T06 a tracked symlink under canonical source is rejected before promoter runs',async()=>{
 const f=await fixture();
 try{
  await symlink('/etc/hosts',path.join(f.root,'pwa','Gear','unsafe.md'));
  git(f.root,'add','.');
  git(f.root,'commit','-q','-m','unsafe tracked link');
  f.sha=git(f.root,'rev-parse','HEAD');
  const x=bridge(f);
  await assert.rejects(call(x.adapter,f.sha),denied('CHECKOUT_UNSAFE_TREE'));
  assert.deepEqual(x.counts(),{validated:0,cleanups:1});
 }finally{await f.cleanup();}
});
test('P3-T07 a symlinked canonical root cannot escape the isolated checkout',async()=>{
 const f=await fixture();
 try{
  await rm(path.join(f.root,'pwa','KB'),{recursive:true});
  await symlink('/etc',path.join(f.root,'pwa','KB'));
  git(f.root,'add','.');
  git(f.root,'commit','-q','-m','symlinked root');
  f.sha=git(f.root,'rev-parse','HEAD');
  const x=bridge(f);
  await assert.rejects(call(x.adapter,f.sha),denied('CHECKOUT_UNSAFE_TREE'));
  assert.deepEqual(x.counts(),{validated:0,cleanups:1});
 }finally{await f.cleanup();}
});
