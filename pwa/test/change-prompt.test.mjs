import test from 'node:test';
import assert from 'node:assert/strict';
import {CHANGE_PACKAGE_INSTRUCTION,changePackageClipboardText} from '../src/change-prompt.mjs';

test('FISH110 change-package prompt routes eligible authoring through FISH108',()=>{
 assert.match(CHANGE_PACKAGE_INSTRUCTION,/FISH108 Fast Content Release/);
 assert.match(CHANGE_PACKAGE_INSTRUCTION,/one content PR, lightweight content validation\/build, merge, production deployment, and hosted byte\/release-identity verification/);
 assert.match(CHANGE_PACKAGE_INSTRUCTION,/Do not run the Full Application Release process or create\/update project-state records unless validation shows they are actually required/);
 assert.match(CHANGE_PACKAGE_INSTRUCTION,/If the requested change is not eligible for the Fast Content Release lane, follow the repository’s current instructions for the appropriate release lane/);
 assert.doesNotMatch(CHANGE_PACKAGE_INSTRUCTION,/one feature PR/);
 assert.doesNotMatch(CHANGE_PACKAGE_INSTRUCTION,/then reconcile project records/);
});

test('change-package clipboard text preserves a blank-line JSON boundary',()=>{
 const prepared={format:'fishing-companion-change-v2',domain:'kb',operation:'edit',id:'example'};
 const text=changePackageClipboardText(prepared);
 assert.ok(text.startsWith('Fishing Companion change package:'));
 assert.deepEqual(JSON.parse(text.slice(text.lastIndexOf('\n\n')+2)),prepared);
});
