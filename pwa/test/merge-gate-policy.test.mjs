import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const workflow=fs.readFileSync(new URL('../../.github/workflows/fishing-production.yml',import.meta.url),'utf8');

function classifyScript(){
 const step=workflow.indexOf('      - id: classify\n');
 assert(step!==-1,'classify step was removed');
 const run=workflow.indexOf('        run: |\n',step);
 const end=workflow.indexOf('\n  validate-content:\n',run);
 assert(run!==-1&&end>run,'classify shell step boundaries changed');
 return workflow.slice(run+'        run: |\n'.length,end).split('\n')
  .map(line=>line.startsWith('          ')?line.slice(10):line)
  .join('\n')
  .replace("base='${{ github.event.pull_request.base.sha }}'",'base="$P3_TEST_BASE"');
}
function git(cwd,...args){
 return execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
}
async function modeFor(t,files){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fish118-lanes-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 git(dir,'init','-q','-b','main');
 git(dir,'config','user.name','Source Test');
 git(dir,'config','user.email','ci@example.invalid');
 fs.writeFileSync(path.join(dir,'baseline.txt'),'Baseline\n');
 git(dir,'add','.');git(dir,'commit','-q','-m','baseline');
 const base=git(dir,'rev-parse','HEAD');
 git(dir,'checkout','-q','-b','feature/test-lane');
 for(const file of files){
  const full=path.join(dir,file);
  fs.mkdirSync(path.dirname(full),{recursive:true});
  fs.writeFileSync(full,'Source-only fixture\n');
 }
 if(files.length){git(dir,'add','.');git(dir,'commit','-q','-m','fixture');}
 const output=path.join(dir,'output');
 execFileSync('bash',['-c',classifyScript()],{
  cwd:dir,encoding:'utf8',
  env:{...process.env,GITHUB_EVENT_NAME:'pull_request',
   P3_TEST_BASE:base,GITHUB_OUTPUT:output},
 });
 const match=/^mode=(.*)$/m.exec(fs.readFileSync(output,'utf8'));
 assert(match,'mode output missing');
 return match[1];
}

test('FISH118-M01 all PRs receive one stable, never-skipped merge-ready check',()=>{
 assert.match(workflow,/\n  pull_request:\s*\n/);
 assert.doesNotMatch(workflow,/\n  pull_request:\s*\n\s+paths:/);
 assert.match(workflow,/\n  merge-ready:\n    name: fishing-merge-ready\n/);
 assert.match(workflow,/if: \$\{\{ always\(\) && github\.event_name == 'pull_request' \}\}/);
 assert.match(workflow,/needs: \[classify, validate-content, validate-full, validate-docs\]/);
 assert.equal((workflow.match(/name: fishing-merge-ready/g)||[]).length,1);
});
test('FISH118-M02 Gear, KB, Catch source changes use the fast lane',async t=>{
 for(const file of ['pwa/Gear/fixture.json','pwa/KB/Techniques/content/example.md',
  'pwa/Catches/fixture.json']){
  assert.equal(await modeFor(t,[file]),'content',file);
 }
});
test('FISH118-M03 docs-only PRs use nonrelease docs validation',async t=>{
 for(const file of ['README.md','pwa/docs/Release Note.md','pwa/README.md']){
  assert.equal(await modeFor(t,[file]),'docs',file);
 }
});
test('FISH118-M04 runtime, schema and workflow changes use full application tests',async t=>{
 for(const file of ['pwa/src/runtime.mjs','pwa/tools/build.mjs','pwa/contracts/schema.json',
  '.github/workflows/example.yml','experiments/p3/preview/src/worker.mjs']){
  assert.equal(await modeFor(t,[file]),'full',file);
 }
});
test('FISH118-M05 mixed docs and canonical changes use full lane regardless of file order',async t=>{
 for(const files of [
  ['README.md','pwa/Gear/change.json'],
  ['pwa/Gear/change.json','z-last-doc.md'],
  ['pwa/docs/update.md','pwa/KB/Locations/content/test.md'],
  ['pwa/Catches/change.json','pwa/docs/notes.md'],
 ]){
  assert.equal(await modeFor(t,files),'full',files.join(' + '));
 }
});
test('FISH118-M06 empty or ambiguous diff is not fast or docs lane',async t=>{
 assert.equal(await modeFor(t,[]),'full');
});
test('FISH118-M07 main deployment trigger and guards remain unchanged',()=>{
 assert.match(workflow,/push:\s*\n\s+branches: \[main, feature\/v2-implementation-20260908\]/);
 assert.match(workflow,/paths: \['pwa\/\*\*', '!pwa\/docs\/\*\*', '!pwa\/README\.md', '\.github\/workflows\/\*\*'\]/);
 assert.match(workflow,/if: needs\.classify\.outputs\.mode == 'content' && github\.ref == 'refs\/heads\/main' && github\.event_name == 'push'/);
 assert.match(workflow,/if: needs\.classify\.outputs\.mode == 'full' && github\.ref == 'refs\/heads\/main' && github\.event_name != 'pull_request'/);
});
