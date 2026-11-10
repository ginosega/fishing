import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

// Exact Git blob identities from approved isolated D5 owner source
// feature/fish118-d5-owner-integration@298ab5e76e48b8d66102d179dbf62d881c642226.
// These imported files are deliberately NOT activated in current D6 entry.
// Future refactoring needs an explicit review of any changed accepted UX.
const accepted=Object.freeze({
 'catch-editor.mjs':'c9f3b813e812116d5dc191d7ae2ddd98a69bcf42',
 'catch-fields.mjs':'ae76f34ccf5040460cebba27a72cbde922416d52',
 'catch-lure-picker.mjs':'410782136419507965a5871ef5a93ab9c3f05fbd',
 'd5-auth-return.mjs':'b0e62ba6969af76fa95ec37657e61f6e17a89739',
 'd5-device-drafts.mjs':'7ae0e4c2922f0f69af0ceef34ea76ce861d073ae',
 'd5-editor-entry-gate.mjs':'8e3de68416625c2f26311ab08e1a3471950d0bc3',
 'd5-editor-recovery.mjs':'a64648c567c235e0ae053281734aff58441a3eab',
 'diagnostics.mjs':'2c9375c25f387309c5282b3f72cf1f1e1d35ebc7',
 'editor-preview.mjs':'5e3e48b67cc5f105d84dba9282bef6175adffece',
 'notes-link.mjs':'1ae887ce1ef2c9feb12b8cd7dd8ecd5b528cf50c',
 'notes-markdown-editor.mjs':'ac69607297b2acd093a9bbbca8ae5f8b78bfb224',
 'v3-connection-experience.mjs':'56851a934d1b79abd6256076f15f27387d159965',
 'v3-connection.mjs':'2bbfded417cdc88a4d82ebd6d18cf58a85bdc879',
});
const read=name=>readFileSync(new URL('../src/'+name,import.meta.url));
const hash=data=>createHash('sha1')
 .update('blob '+data.byteLength+'\0').update(data).digest('hex');

test('D6-UX-PORT01 thirteen accepted D5 sources are exact-byte imports',()=>{
 assert.equal(Object.keys(accepted).length,13);
 for(const [name,expected] of Object.entries(accepted))
  assert.equal(hash(read(name)),expected,
   'Approved D5 source drift without review: '+name);
});
test('D6-UX-PORT02 approved Connection Status implementation stays unmodified',()=>{
 const acceptedFile=read('v3-connection-experience.mjs').toString();
 assert.match(acceptedFile,/v3-connection-section v3-account/);
 assert.match(acceptedFile,/v3-connection-section v3-publishing/);
 assert.match(acceptedFile,/Not signed in/);
 assert.match(acceptedFile,/Sign in with GitHub/);
 assert.match(acceptedFile,/Signed in as /);
 assert.match(acceptedFile,/Publishing Status/);
 assert.match(acceptedFile,/No recent publication available/);
});
test('D6-UX-PORT03 isolated D5 sandbox is NOT imported into D6 public entry',()=>{
 const entry=read('entry.mjs').toString();
 const ui=read('ui.mjs').toString();
 const build=readFileSync(new URL('../tools/build.mjs',import.meta.url),'utf8');
 // This PR ports source provenance only. A future reviewed composition
 // must adapt sandbox-only functionality before any owner UI can be active.
 for(const text of [entry,ui]){
  assert.doesNotMatch(text,/d5-owner-candidate\.mjs/);
  assert.doesNotMatch(text,/d3-owner-test-shell\.mjs/);
  assert.doesNotMatch(text,/v3-connection-experience\.mjs/);
  assert.doesNotMatch(text,/v3-connection\.mjs/);
 }
 assert.doesNotMatch(build,/--d6-production-owner/);
 assert.match(build,/--d6-reader-candidate/);
});
test('D6-UX-PORT04 no extra auth, backend or publishing entry is introduced',()=>{
 const entry=read('entry.mjs').toString();
 assert.match(entry,/__FISHING_D6_STATIC_STAGING__/);
 assert.match(entry,/__FISHING_D6_PUBLIC_READER__/);
 assert.doesNotMatch(entry,/__FISHING_V3_OWNER_CANDIDATE__/);
 assert.doesNotMatch(entry,/d3-live-owner-worker|D2_WRITE_ENABLED/);
});
