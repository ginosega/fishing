import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile as cb} from 'node:child_process';
import {promisify} from 'node:util';
import {createAuthenticatedSandboxCheckout,AuthenticatedCheckoutError} from '../src/authenticated-sandbox-checkout.mjs';
import {createTrustedSandboxCandidate} from '../src/trusted-sandbox-candidate.mjs';
import {createCanonicalSourceAware} from '../src/source-aware.mjs';
import {prepareChange} from '../../../pwa/src/handoff.mjs';

const exec=promisify(cb),ID=1430581407,REPO='ginosega/fishing-p3-sandbox';
const API='https://api.github.com/repos/'+REPO;
const OP='p3_00000000-1111-4111-8111-123456789abc';
const base={id:'test-rod',category:'rods-reels',type:'Spinning rod',name:'Test Rod',manufacturer:'OldCo'};
const kb={id:'location-lake',type:'location',name:'Lake',content:'KB/Locations/content/Lake.md'};
const deny=code=>e=>e instanceof AuthenticatedCheckoutError&&e.code===code;
async function git(root,...args){
 return (await exec('git',['-C',root,...args],{encoding:'utf8'})).stdout.trim();
}
async function fixture(t,{concurrent=false,invalidSource=false}={}){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'fish-p3-origin-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 for(const p of ['pwa/Gear','pwa/KB/Locations/content','pwa/Catches'])
  await fs.mkdir(path.join(root,p),{recursive:true});
 await fs.writeFile(path.join(root,'pwa/Gear/gear.json'),
  JSON.stringify({schemaVersion:2,items:[{...base,...(concurrent?{name:'Concurrent rename'}:{})}]},null,2));
 await fs.writeFile(path.join(root,'pwa/KB/kb.json'),
  JSON.stringify({schemaVersion:2,entities:[kb]},null,2));
 await fs.writeFile(path.join(root,'pwa/Catches/catches.json'),
  JSON.stringify({schemaVersion:2,catches:[]},null,2));
 await fs.writeFile(path.join(root,'pwa/KB/Locations/content/Lake.md'),
  invalidSource?'![bad](../assets/does-not-exist.png)':'A valid lake description.');
 await git(root,'init','-q','-b','main');
 await git(root,'config','user.name','Fixture');
 await git(root,'config','user.email','fixture@example.invalid');
 await git(root,'add','.');
 await git(root,'commit','-q','-m','unprivileged canonical fixture');
 const sha=await git(root,'rev-parse','HEAD');
 const tree=await git(root,'rev-parse','HEAD^{tree}');
 const bare=path.join(await fs.mkdtemp(path.join(os.tmpdir(),'fish-p3-bare-')),'repo.git');
 t.after(()=>fs.rm(path.dirname(bare),{recursive:true,force:true}));
 await exec('git',['clone','-q','--bare',root,bare]);
 return {root,bare,sha,tree};
}
function network(f,{main=f.sha,commit=f.sha,repositoryId=ID}={}){
 const calls=[];
 const reply=object=>({ok:true,json:async()=>object});
 const request=async(url,init)=>{
  calls.push({url,method:init.method,authorization:init.headers.Authorization});
  assert.equal(init.method,'GET');
  assert.match(init.headers.Authorization,/^Bearer /);
  if(url===API)return reply({id:repositoryId,full_name:REPO,private:true,archived:false});
  if(url===API+'/git/ref/heads/main')
   return reply({ref:'refs/heads/main',object:{type:'commit',sha:main}});
  if(url===API+'/git/commits/'+main)return reply({sha:commit,tree:{sha:f.tree}});
  throw Error('Unexpected trusted API request: '+url);
 };
 return {request,calls};
}
function provider(f,networkOpts={},transportOpts={}){
 const n=network(f,networkOpts);
 const workspace=[];
 const grants=[];
 let fetched=0;
 const gitExec=async(program,args,opts)=>{
  assert.equal(program,'git');
  assert(!args.join(' ').includes('example_readonly_token'));
  assert(!args.join(' ').includes('x-access-token'));
  if(args.includes('fetch')){
   fetched++;
   assert.deepEqual(args.slice(-4),['fetch','--no-tags','--depth=1','origin','refs/heads/main'].slice(-4));
   assert.equal(opts.env.GIT_TERMINAL_PROMPT,'0');
   assert.equal(opts.env.P3_GIT_AUTH_PASSWORD,'example_readonly_token');
   const actual=transportOpts.bare??f.bare;
   // Test-only replacement for the network transport. Production always
   // sends git fetch to its hard-coded sandbox GitHub HTTPS origin.
   return exec('git',['-C',args[1],'-c','protocol.file.allow=always',
    'fetch','--no-tags','--depth=1',actual,'refs/heads/main'],opts);
  }
  return exec(program,args,opts);
 };
 const p=createAuthenticatedSandboxCheckout({
  issueReadToken:async request=>{
   grants.push(request);
   return {repositoryId:ID,permissions:{contents:'read'},token:'example_readonly_token'};
  },
  request:n.request,gitExec,
 });
 return {...p,calls:n.calls,grants,fetched:()=>fetched};
}
const target=f=>({repositoryId:ID,repository:REPO,commitSha:f.sha});
async function gearPackage(f,record={...base,name:'Updated Rod'}){
 return prepareChange({domain:'gear',operation:'edit',id:base.id,baseRecord:base,
  record,sourceRevision:f.sha});
}
test('P3-A01 scoped authenticated GitHub identity, ref, commit and exact Git checkout',async t=>{
 const f=await fixture(t),p=provider(f);
 const main=await p.readMainSha({repositoryId:ID});
 assert.deepEqual(main,{repositoryId:ID,sha:f.sha});
 const lease=await p.trustedCheckout(target(f));
 assert.equal(lease.commitSha,f.sha);
 assert.equal(await git(lease.root,'rev-parse','HEAD'),f.sha);
 assert.equal(await git(lease.root,'remote','get-url','origin'),
  'https://github.com/ginosega/fishing-p3-sandbox.git');
 const config=await fs.readFile(path.join(lease.root,'.git/config'),'utf8');
 assert(!config.includes('example_readonly_token'));
 assert.equal(await fs.stat(path.join(lease.root,'askpass.sh')).catch(()=>null),null);
 assert.equal(await git(lease.root,'status','--porcelain','--untracked-files=all'),'');
 assert.deepEqual(p.grants.map(x=>x.permissions),[{contents:'read'},{contents:'read'}]);
 const root=lease.root;
 await p.releaseCheckout(lease);
 await assert.rejects(fs.stat(root),{code:'ENOENT'});
 await assert.rejects(p.releaseCheckout(lease),deny('UNKNOWN_CHECKOUT_LEASE'));
});
test('P3-A02 client cannot choose repository or commit; remote identity and moving main rejected',async t=>{
 const f=await fixture(t);
 for(const targetChange of [
  {repositoryId:1350909744},{repository:'ginosega/fishing'},
  {commitSha:'bad'}, {commitSha:'f'.repeat(40)},
 ]){
  const p=provider(f);
  await assert.rejects(p.trustedCheckout({...target(f),...targetChange}),
   deny(targetChange.commitSha==='f'.repeat(40)?'REMOTE_HEAD_MOVED':'CHECKOUT_TARGET_DENIED'));
 }
 const mismatch=provider(f,{repositoryId:1350909744});
 await assert.rejects(mismatch.trustedCheckout(target(f)),deny('REPOSITORY_IDENTITY_MISMATCH'));
 const substitution=provider(f,{commit:'f'.repeat(40)});
 await assert.rejects(substitution.trustedCheckout(target(f)),deny('COMMIT_IDENTITY_MISMATCH'));
});
test('P3-A03 substituted Git fetch SHA is rejected and temporary checkout deleted',async t=>{
 const f=await fixture(t),other=await fixture(t,{concurrent:true});
 const p=provider(f,{}, {bare:other.bare});
 await assert.rejects(p.trustedCheckout(target(f)),deny('FETCHED_SHA_MISMATCH'));
 assert.equal(p.fetched(),1);
});
test('P3-A04 real canonical Gear promoter on authenticated checkout preserves unrelated source',async t=>{
 const f=await fixture(t),p=provider(f);
 const pkg=await gearPackage(f);
 let leaseRoot;
 const candidate=createTrustedSandboxCandidate({
  trustedCheckout:async x=>{const lease=await p.trustedCheckout(x);leaseRoot=lease.root;return lease;},
  releaseCheckout:p.releaseCheckout,
  sourceAware:createCanonicalSourceAware(),
  store:{readSnapshot:async()=>({package:pkg,media:[]})},
 });
 const result=await candidate({baseSha:f.sha,domain:'gear',operationId:OP});
 assert.equal(result.validated,true);
 assert.equal(result.sourceRevision,f.sha);
 const proposed=JSON.parse(result.changes.find(x=>x.path==='Gear/gear.json').body);
 assert.equal(proposed.items[0].name,'Updated Rod');
 assert.equal(proposed.items[0].manufacturer,'OldCo');
 assert.equal(JSON.parse(await fs.readFile(path.join(f.root,'pwa/Gear/gear.json'),'utf8')).items[0].name,'Test Rod');
 await assert.rejects(fs.stat(leaseRoot),{code:'ENOENT'});
});
test('P3-A05 actual canonical promoter denies conflict, bad schema and broken Markdown; releases checkout',async t=>{
 const cases=[
  {opts:{concurrent:true},package:async f=>gearPackage(f),code:'CONFLICT'},
  {opts:{},package:async f=>gearPackage(f,{...base,type:'Invalid Taxonomy'}),code:'VALIDATION'},
  {opts:{invalidSource:true},package:async f=>gearPackage(f),code:'VALIDATION'},
 ];
 for(const c of cases){
  const f=await fixture(t,c.opts),p=provider(f),pkg=await c.package(f);
  let leaseRoot;
  const candidate=createTrustedSandboxCandidate({
   trustedCheckout:async x=>{const l=await p.trustedCheckout(x);leaseRoot=l.root;return l;},
   releaseCheckout:p.releaseCheckout,
   store:{readSnapshot:async()=>({package:pkg,media:[]})},
   sourceAware:createCanonicalSourceAware(),
  });
  await assert.rejects(candidate({baseSha:f.sha,domain:'gear',operationId:OP}),
   e=>e.code===c.code);
  await assert.rejects(fs.stat(leaseRoot),{code:'ENOENT'});
 }
});
test('P3-A06 no arbitrary checkout deletion or path supplied by caller',async t=>{
 const f=await fixture(t),p=provider(f);
 await assert.rejects(p.releaseCheckout({root:f.root}),deny('UNKNOWN_CHECKOUT_LEASE'));
 assert((await fs.stat(f.root)).isDirectory());
 await assert.rejects(p.readMainSha({repositoryId:1350909744}),deny('REPOSITORY_DENIED'));
 assert.equal(p.calls.length,0);
});
