import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {inventorySource} from '../../../pwa/tools/library.mjs';
import {validateSandboxHead,SandboxHeadError} from '../preview/tools/validate-sandbox-head.mjs';

const ID=1430581407;
const FIXTURE=fileURLToPath(new URL('../preview/fixtures/sandbox-canonical/pwa/',import.meta.url));
const denied=code=>e=>e instanceof SandboxHeadError&&e.code===code;
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
async function setup(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'fishing-p3-ci-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await fs.cp(FIXTURE,path.join(root,'pwa'),{recursive:true});
 git(root,'init','-q','-b','main');
 git(root,'config','user.name','Fixture CI');
 git(root,'config','user.email','ci@example.invalid');
 git(root,'remote','add','origin','https://github.com/ginosega/fishing-p3-sandbox.git');
 git(root,'add','.');git(root,'commit','-q','-m','known sandbox baseline');
 const base=git(root,'rev-parse','HEAD');
 async function commit(relative,content){
  await fs.mkdir(path.dirname(path.join(root,relative)),{recursive:true});
  await fs.writeFile(path.join(root,relative),content);
  git(root,'add','--all');git(root,'commit','-q','-m','simulated PR edit');
  return git(root,'rev-parse','HEAD');
 }
 const target=head=>({
  checkoutRoot:root,expectedHeadSha:head,expectedBaseSha:base,
  headRepoId:ID,baseRepoId:ID,baseRef:'main',
 });
 return {root,base,commit,target};
}
const gear={schemaVersion:2,items:[
 {id:'p3-test-rod',category:'rods-reels',type:'Spinning rod',
  name:'Changed P3 Test Rod',manufacturer:'Fixture Only'}
]};
test('P3-F01 fixture is actually accepted by existing full canonical inventory',async()=>{
 const result=await inventorySource(FIXTURE,{pendingMedia:false});
 assert.equal(result.data.gear.items.length,1);
 assert.equal(result.data.kb.entities.length,1);
 assert.equal(result.data.catches.catches.length,0);
 assert.equal(result.pending.length,0);
 assert(result.files.some(x=>x.path==='KB/Locations/content/P3 Test Lake.md'));
});
test('P3-H01 exact GitHub event PR head, ancestor, changed paths and canonical inventory succeed',async t=>{
 const f=await setup(t);
 const head=await f.commit('pwa/Gear/gear.json',JSON.stringify(gear,null,2)+'\n');
 const proof=await validateSandboxHead(f.target(head));
 assert.equal(proof.headSha,head);
 assert.equal(proof.baseSha,f.base);
 assert.equal(proof.repositoryId,ID);
 assert.equal(proof.changedFiles,1);
 assert.deepEqual([proof.gear,proof.kb,proof.catches],[1,1,0]);
});
test('P3-H02 branch, repository and base identity cannot be substituted',async t=>{
 const f=await setup(t);
 const head=await f.commit('pwa/Gear/gear.json',JSON.stringify(gear));
 for(const changes of [
  [{headRepoId:123},'REPOSITORY_EVENT_DENIED'],
  [{baseRepoId:123},'REPOSITORY_EVENT_DENIED'],
  [{baseRef:'not-main'},'REPOSITORY_EVENT_DENIED'],
  [{expectedHeadSha:f.base},'INVALID_EVENT_SHA'],
  [{expectedHeadSha:'a'.repeat(40)},'WRONG_PR_HEAD'],
  [{expectedBaseSha:'bad'},'INVALID_EVENT_SHA'],
 ]){
  await assert.rejects(validateSandboxHead({...f.target(head),...changes[0]}),denied(changes[1]));
 }
});
test('P3-H03 untrusted changes outside canonical three roots fail even if Git HEAD matches',async t=>{
 const f=await setup(t);
 const head=await f.commit('README.md','Untrusted workflow content cannot be validated.\n');
 await assert.rejects(validateSandboxHead(f.target(head)),denied('CHANGED_PATH_DENIED'));
});
test('P3-H04 rejected workflow or executable change within sandbox PR',async t=>{
 const f=await setup(t);
 const head=await f.commit('.github/workflows/untrusted.yml','name: Unsafe\n');
 await assert.rejects(validateSandboxHead(f.target(head)),denied('CHANGED_PATH_DENIED'));
});
test('P3-H05 broken canonical Markdown image reference fails full source inventory',async t=>{
 const f=await setup(t);
 const head=await f.commit('pwa/KB/Locations/content/P3 Test Lake.md',
  '![not present](../assets/no-file.png)\n');
 await assert.rejects(validateSandboxHead(f.target(head)));
});
test('P3-H06 invalid record taxonomy fails Ajv/semantic checks',async t=>{
 const f=await setup(t);
 const head=await f.commit('pwa/Gear/gear.json',JSON.stringify({
  schemaVersion:2,items:[{...gear.items[0],type:'Unsupported Type'}]
 }));
 await assert.rejects(validateSandboxHead(f.target(head)));
});
test('P3-H07 tracked symlink within canonical inventory is blocked before opening',async t=>{
 const f=await setup(t);
 await fs.symlink('/etc/hosts',path.join(f.root,'pwa','Gear','unsafe.md'));
 git(f.root,'add','.');git(f.root,'commit','-q','-m','adversarial symlink');
 const head=git(f.root,'rev-parse','HEAD');
 await assert.rejects(validateSandboxHead(f.target(head)),denied('UNSAFE_CANONICAL_TREE'));
});
test('P3-H08 dirty checkout or switched remote is never considered exact-head proof',async t=>{
 const f=await setup(t);
 const head=await f.commit('pwa/Gear/gear.json',JSON.stringify(gear));
 await fs.writeFile(path.join(f.root,'extra.txt'),'untracked');
 await assert.rejects(validateSandboxHead(f.target(head)),denied('DIRTY_CHECKOUT'));
 await fs.rm(path.join(f.root,'extra.txt'));
 git(f.root,'remote','set-url','origin','https://github.com/ginosega/fishing.git');
 await assert.rejects(validateSandboxHead(f.target(head)),denied('INVALID_GIT_REMOTE'));
});
test('P3-H09 moved base SHA is not silently accepted or rebased',async t=>{
 const f=await setup(t);
 const head=await f.commit('pwa/Gear/gear.json',JSON.stringify(gear));
 const wrong='e'.repeat(40);
 await assert.rejects(validateSandboxHead({...f.target(head),expectedBaseSha:wrong}),
  denied('GIT_VERIFICATION_FAILED'));
});

test('P3-H10 inactive workflow template uses a pinned trusted script and NO PR-executed code',async()=>{
 const location=fileURLToPath(new URL('../preview/templates/fishing-p3-sandbox-exact-head.example.yml',import.meta.url));
 const yaml=await fs.readFile(location,'utf8');
 assert.match(yaml,/name: Fishing P3 sandbox exact-PR-head validation/);
 assert.match(yaml,/\bon:\s*\n\s*pull_request:/);
 assert.doesNotMatch(yaml,/pull_request_target|workflow_run|permissions:\s*write/);
 assert.match(yaml,/permissions:\s*\n\s*contents: read/);
 assert.equal((yaml.match(/persist-credentials: false/g)||[]).length,2);
 assert.match(yaml,/repository: ginosega\/fishing-p3-sandbox/);
 assert.match(yaml,/repository: ginosega\/fishing/);
 assert.match(yaml,/ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
 assert.match(yaml,/ref: e75b6009f947b03568124ddf8d2c513a63c4025c/);
 assert.match(yaml,/node trusted\/experiments\/p3\/preview\/tools\/validate-sandbox-head\.mjs/);
 assert.doesNotMatch(yaml,/working-directory: sandbox|run:\s*npm\s+(test|install|ci).*sandbox/);
});

test('P3-H11 valid but non-synthetic production-style records are refused',async t=>{
 const f=await setup(t);
 const head=await f.commit('pwa/Gear/gear.json',JSON.stringify({
  schemaVersion:2,items:[{...gear.items[0],id:'user-real-rod'}],
 }));
 await assert.rejects(validateSandboxHead(f.target(head)),
  denied('NON_SYNTHETIC_SANDBOX_SOURCE'));
});
