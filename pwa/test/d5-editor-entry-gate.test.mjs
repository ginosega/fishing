import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {d5EditorEntryGate as gate} from '../src/d5-editor-entry-gate.mjs';

const ready={enabled:true,online:true,modeAvailable:true,readingMode:'Automatic',
 modeChecking:false,ownerPhase:'Owner',authorized:true};
test('D5-ENTRY01 only isolated owner Add/Edit startup is gated',()=>{
 assert.equal(gate({...ready,enabled:false}), 'ready');
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/const status=isEditorRoute\(currentHash\)\?editorGate\(\):'ready'/);
 assert.match(ui,/const EDITOR_ROUTES=new Set\(\['gear-add','gear-edit','kb-add','kb-edit','catch-add','catch-edit'\]\)/);
 assert.match(ui,/editorGateVisible&&!dirty\(\)/);
 assert.match(ui,/if\(ownerController&&onlineForEditing\(\)\)void refreshOwner\(\)/);
 assert.match(ui,/30000/);
});
test('D5-ENTRY02 unknown reading mode and owner return neutral pending',()=>{
 for(const phase of ['Unverified','Checking','SigningOut'])
  assert.equal(gate({...ready,ownerPhase:phase}),'pending');
 assert.equal(gate({...ready,modeAvailable:false,modeChecking:true}),'pending');
 assert.equal(gate({...ready,modeAvailable:false,modeChecking:false}),'unavailable');
});
test('D5-ENTRY03 verified offline and owner denial fail closed',()=>{
 assert.equal(gate({...ready,online:false}),'offline');
 assert.equal(gate({...ready,readingMode:'Work Offline'}),'offline');
 assert.equal(gate({...ready,readingMode:'Unknown'}),'unavailable');
 assert.equal(gate({...ready,authorized:false}),'unauthorized');
 assert.equal(gate({...ready,ownerPhase:'Anonymous',authorized:false}),'unauthorized');
 assert.equal(gate({...ready,ownerPhase:'Unavailable'}),'unavailable');
 assert.equal(gate({...ready,editorTimedOut:true}),'unavailable');
});
test('D5-ENTRY04 authorization only after verified Online/Automatic/Owner',()=>{
 assert.equal(gate(ready),'ready');
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/Checking connection and account…/);
 assert.match(ui,/Retry verification/);
 assert.match(ui,/const canAuthor=\(\)=>/);
 assert.match(ui,/async function guardedPublish|const guardedPublish=/);
 assert.match(ui,/refreshMode\(\)/);
});
