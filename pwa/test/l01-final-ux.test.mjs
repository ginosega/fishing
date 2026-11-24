import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {waitForDetailPicture} from '../src/dom.mjs';
const read=name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
function fakePicture(decode){
 const image={loading:'lazy',hidden:false,naturalWidth:640,decode};
 const fallback={hidden:true};
 const page={querySelector:selector=>selector==='.picture img'?image:fallback};
 return {page,image,fallback};
}
test('L01 empty editor and diagnostics announcements consume no layout space; Species hint uses only standard gap',()=>{
 const css=read('styles.css');
 assert.match(css,/:is\(\.editor,\.v3-help-body\) \[aria-live\]:empty\{[^}]*position:absolute[^}]*margin:0/);
 assert.match(css,/\.gear-choice-control>\.new-choice>\.hint\{margin:0\}/);
 assert.match(css,/\.gear-choice-control\{[^}]*gap:14px/);
});
test('L01 detail waits for the actual decoded main image while keeping the page detached',async()=>{
 let finish;
 const {page,image,fallback}=fakePicture(()=>new Promise(resolve=>{finish=resolve;}));
 let ready=false;
 const pending=waitForDetailPicture(page).then(()=>{ready=true;});
 assert.equal(image.loading,'eager');
 assert.equal(ready,false);
 finish();await pending;
 assert.equal(ready,true);assert.equal(image.hidden,false);assert.equal(fallback.hidden,true);
 const ui=read('ui.mjs');
 assert.match(ui,/await waitForDetailPicture\(page\);\s*if\(ticket!==serial\)return;\s*\}\s*root\.replaceChildren\(page\)/);
});
test('L01 missing or stalled main pictures do not block detail content',async()=>{
 await waitForDetailPicture({querySelector:()=>null});
 for(const decode of [()=>Promise.reject(Error('broken')),()=>new Promise(()=>{})]){
  const {page,image,fallback}=fakePicture(decode);
  await waitForDetailPicture(page,{timeoutMs:5});
  assert.equal(image.hidden,true);assert.equal(fallback.hidden,false);
 }
});
test('L01 list pictures remain lazy and keep their slot on error',()=>{
 const ui=read('ui.mjs'),css=read('styles.css');
 assert.match(ui,/loading:'lazy',decoding:'async',class:'card-thumbnail',onerror:event=>\{event\.target\.classList\.add\('card-spacer'\)/);
 assert.match(css,/\.card-spacer\{visibility:hidden;flex-shrink:0\}/);
 assert.match(css,/\.card-thumbnail\{flex-shrink:0\}/);
});
test('L01 Account text differentiates offline from online sign-in',()=>{
 const src=read('v3-connection-experience.mjs');
 assert.match(src,/caption\(state\.phase==='Offline'\?'You must be online to add or edit content\.':'Sign in to add or edit content\.'\)/);
 assert.match(src,/if\(state\.phase!=='Offline'\)/);
});
