import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

for(const [domain,path] of [
 ['Gear and Knowledge Base','../src/d6-approved-owner-editor-preview.mjs'],
 ['Catch Log','../src/d6-direct-catch-editor.mjs'],
]){
 test('L01 '+domain+' verified Save auto-exits once; failed Save stays editable',()=>{
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  const success=source.indexOf(domain==='Catch Log'?
   'accepted=true;\n    // Save completes navigation':
   'saveAccepted=true;\n    // A verified D1/R2 Save');
  const error=domain==='Catch Log'?
   source.indexOf('if(!standaloneV3){',success):
   source.indexOf("}catch(error)",success);
  assert(success>=0&&error>success,'verified direct Save branch exists');
  const section=source.slice(success,error);
  assert.match(section,/await discardDraft\(\)/);
  assert.match(section,/onExit\(\{savedId:candidate\.id\}\)/);
  assert.match(section,/window\.location\.reload\(\)/);
  assert(section.indexOf('await discardDraft()')<
   section.indexOf('onExit({savedId:candidate.id})'));
  assert(section.indexOf('onExit({savedId:candidate.id})')<
   section.indexOf('window.location.reload()'));
  assert.doesNotMatch(section,/button\('Exit'/);
  assert.match(source,/const cancelButton=button\('Cancel',async\(\)=>\{/);
  assert.match(source,/if\(!\w+\)\{[\s\S]*?Save/);
  if(domain==='Gear and Knowledge Base')
   assert.doesNotMatch(source,/Prepared change package|Publication accepted/);
 });
}

test('L01 verified Add Save navigates to its newly persisted record',()=>{
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/history\.replaceState\(null,'',routeFor\(domain,savedId\)\)/);
 assert.match(ui,/history\.replaceState\(null,'',routeFor\('catches',savedId\)\)/);
 assert.doesNotMatch(ui,/navigate\(savedId\?routeFor/);
});
