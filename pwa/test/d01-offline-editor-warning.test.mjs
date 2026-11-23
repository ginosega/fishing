import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');

test('D01-UX01 dirty Work Offline notice is editor-local below Save/Cancel',()=>{
 const offline=source('offline.mjs'),ui=source('ui.mjs');
 const message='The unsaved editor stays open, but publishing is disabled in Work Offline.';
 assert.ok(offline.includes(message),'preserve approved warning wording');
 assert.ok(ui.includes("const offlineEditorWarning='"+message+"'"));
 assert.match(ui,/message===offlineEditorWarning&&dirty\(\)\?\s*editor\?\.element\?\.querySelector\('\.editor-action-feedback'\)/);
 assert.match(ui,/actionNotice\.classList\.add\('editor-offline-action-feedback'\);\s*status\(actionNotice,message,kind\)/);
 assert.match(ui,/status\(alertHost,message,kind\)/,
  'all other notices remain in the original global host');
 for(const name of ['d6-approved-owner-editor-preview.mjs',
  'd6-direct-catch-editor.mjs']){
  const editor=source(name);
  assert.match(editor,/class:'editor-notice editor-action-feedback'/,
   name+' must retain action-adjacent feedback after its buttons');
 }
});

test('D01-UX02 temporary warning uses approved spacing and clears on Automatic',()=>{
 const css=source('styles.css'),ui=source('ui.mjs');
 // .editor-form has 24px gap; 8px feedback padding minus 20px
 // specific margin yields 12px between Save/Cancel and the notice.
 assert.match(css,/\.editor-form\{display:flex;flex-direction:column;gap:24px\}/);
 assert.match(css,/\.editor-action-feedback:not\(:empty\)\{padding-top:8px;padding-bottom:12px\}/);
 assert.match(css,/\.editor-action-feedback\.editor-offline-action-feedback:not\(:empty\)\{margin-top:-20px\}/);
 assert.match(ui,/if\(mode==='Automatic'\)\{\s*const actionNotice=editor\?\.element\?\.querySelector\('\.editor-offline-action-feedback'\)/);
 assert.match(ui,/actionNotice\.classList\.remove\('editor-offline-action-feedback'\);\s*actionNotice\.replaceChildren\(\)/);
});
