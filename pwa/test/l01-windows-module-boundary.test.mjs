import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeL01ModulePath,isL01SourceImporter,
 assertL01StandaloneModuleBoundary}
 from '../tools/l01-module-boundary.mjs';

const linux='/home/runner/work/fishing/fishing/pwa/src/';
const windows='C:\\Users\\ginos\\fishing-o02-private\\pwa\\src\\';
const allowed=[
 'd6-legacy-editor-denial.mjs',
 'd6-v3-content-paths.mjs',
 'd6-legacy-source-denial.mjs',
];

test('L01-WIN01 Windows and Linux importers both receive V3 module substitutes',()=>{
 for(const dir of [linux,windows]){
  assert.equal(isL01SourceImporter(dir+'ui.mjs'),true);
  assert.equal(isL01SourceImporter(dir+'d6-approved-owner-editor-preview.mjs'),true);
 }
 for(const dir of ['/opt/unrelated/', 'C:\\other\\project\\']){
  assert.equal(isL01SourceImporter(dir+'ui.mjs'),false);
 }
 assert.equal(normalizeL01ModulePath(windows+'ui.mjs'),
  'C:/Users/ginos/fishing-o02-private/pwa/src/ui.mjs');
});

test('L01-WIN02 standalone module boundary accepts both OS path separators',()=>{
 for(const dir of [linux,windows]){
  const inputs=Object.fromEntries(allowed.map(name=>[dir+name,{}]));
  const found=assertL01StandaloneModuleBoundary(inputs);
  assert.equal(found.length,allowed.length);
  assert(found.every(name=>name.includes('/pwa/src/')));
 }
});

test('L01-WIN03 Windows legacy handoff and missing substitutions still fail closed',()=>{
 const inputs=Object.fromEntries(allowed.map(name=>[windows+name,{}]));
 for(const old of ['editor.mjs','handoff.mjs','change-prompt.mjs',
  'd6-canonical-authoring-source.mjs']){
  assert.throws(()=>assertL01StandaloneModuleBoundary({
   ...inputs,[windows+old]:{},
  }),/must not bundle legacy GitHub handoff\/editor/);
 }
 assert.throws(()=>assertL01StandaloneModuleBoundary({
  [windows+'d6-legacy-editor-denial.mjs']:{},
 }),/legacy editor boundary was not applied/);
});
