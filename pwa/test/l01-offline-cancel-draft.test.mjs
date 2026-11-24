import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {v3DeviceDraftLeaveMessage} from '../src/d6-v3-draft-leave.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('L01 Offline Cancel clearly distinguishes device draft from publishing',()=>{
 const offline=v3DeviceDraftLeaveMessage({unavailable:true});
 assert.match(offline,/Save is unavailable while working offline or signed out/);
 assert.match(offline,/saved as a device draft on this device, not published/);
 assert.match(offline,/Leave this editor\?/);
 assert.doesNotMatch(offline,/Discard this edit|changes have not been saved/);
 const online=v3DeviceDraftLeaveMessage({unavailable:false});
 assert.match(online,/These changes have not been published/);
 assert.doesNotMatch(online,/Save is unavailable/);
 const images=v3DeviceDraftLeaveMessage({unavailable:true,needsReselect:true});
 assert.match(images,/Locally selected pictures are not stored in the draft/);
 assert.match(images,/selected again when restoring/);
});

test('L01 Gear, KB, and Catch Cancel persist latest D1-revision-pinned draft before leave',()=>{
 const gear=read('../src/d6-approved-owner-editor-preview.mjs');
 const catches=read('../src/d6-direct-catch-editor.mjs');
 const ui=read('../src/ui.mjs');
 for(const source of [gear,catches]){
  assert.match(source,/const writeDraft=\(\)=>saveD6RevisionAwareDraft/);
  assert.match(source,/await writeDraft\(\)!==true/);
  assert.match(source,/onBack\(\{deviceDraftSaved:true,/);
  assert.match(source,/Unable to save the device draft\. Keep this editor open/);
  assert.match(source,/cancelButton.disabled=true/);
  assert.match(source,/cancelButton.disabled=false/);
 }
 assert.match(ui,/if\(!confirm\(v3DeviceDraftLeaveMessage/);
 assert.match(ui,/disposeEditor\(\);approvedNavigation=hash;location.hash=hash/);
 assert.equal((ui.match(/deviceDraftSaved\?leaveWithSavedDraft\(parent,\{needsReselect\}\)/g)||[]).length,2);
});
