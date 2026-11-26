import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const gear=read('../src/d6-approved-owner-editor-preview.mjs');
const catchEditor=read('../src/d6-direct-catch-editor.mjs');
const ui=read('../src/ui.mjs');
const indicator=read('../src/connection-indicator.mjs');

test('L01 direct D1 Save shows busy button and blocks Cancel until verified',()=>{
 for(const source of [gear,catchEditor]){
  assert.match(source,/textContent='Saving…'/);
  assert.match(source,/setAttribute\('aria-busy','true'\)/);
  assert.match(source,/Saving changes and pictures…/);
  assert.match(source,/cancelButton.disabled=true/);
  assert.match(source,/cancelButton.disabled=false/);
  assert.doesNotMatch(source,/if\(restoredMediaMissing\)throw/);
 }
 assert.match(gear,/candidate\.picture&&!knownPaths/);
 assert.match(catchEditor,/parseMarkdown\(notesText/);
});

test('L01 standalone does not show obsolete GitHub Publishing Status or blue icon',()=>{
 assert.match(ui,/ctx\.release\.standaloneV3===true/);
 assert.match(ui,/querySelector\('\.v3-publishing'\)\?\.remove\(\)/);
 assert.match(indicator,/if\(!standaloneV3&&authorized===true&&ACTIVE\.has/);
 assert.match(indicator,/if\(!standaloneV3&&authorized===true&&FAILED\.has/);
});
