import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

for(const [domain,path] of [
 ['Gear and Knowledge Base','../src/d6-approved-owner-editor-preview.mjs'],
 ['Catch Log','../src/d6-direct-catch-editor.mjs'],
]){
 test('M02 '+domain+' verified Save Exit refreshes, while Cancel does not',()=>{
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  const callback=/button\('Exit',\(\)=>\{\s*onExit\(\{savedId:candidate\.id\}\);window\.location\.reload\(\);\s*\},\{variant:'primary'\}\)/g;
  assert.equal([...source.matchAll(callback)].length,1,
   'exactly one successful direct-Save Exit reload handler');
  assert.match(source,/const cancelButton=button\('Cancel',async\(\)=>\{/,
   'Cancel first verifies device draft persistence; it does not reload');
  if(domain==='Gear and Knowledge Base')
   assert.doesNotMatch(source,/Prepared change package|Publication accepted/,
    'the direct Gear/KB editor has no GitHub publication UI');
 });
}


test('L01 verified Add Save navigates to its newly persisted record',()=>{
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/history\.replaceState\(null,'',routeFor\(domain,savedId\)\)/);
 assert.match(ui,/history\.replaceState\(null,'',routeFor\('catches',savedId\)\)/);
 assert.doesNotMatch(ui,/navigate\(savedId\?routeFor/);
});
