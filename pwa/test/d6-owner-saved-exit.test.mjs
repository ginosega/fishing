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
  assert.match(source,/button\('Cancel',onBack\)/,
   'Cancel keeps its existing no-reload handler');
  assert.match(source,/actions\.replaceChildren\(button\('Exit',onExit,\{variant:'primary'\}\)\)/,
   'other Exit paths must retain their existing behavior');
 });
}
