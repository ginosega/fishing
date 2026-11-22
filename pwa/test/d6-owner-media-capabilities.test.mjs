import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DIRECT_D1_MEDIA_CAPABILITIES as media,
 PRIVATE_D1_MEDIA_CAPABILITIES as privateMedia,
 selectD6OwnerMediaCapabilities,presentD6OwnerImageCapability}
 from '../src/d6-owner-media-capabilities.mjs';

const read=name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');

test('V3-MEDIA01 one immutable fail-closed capability covers all direct-D1 editors',()=>{
 assert.equal(Object.isFrozen(media),true);
 assert.equal(media.version,1);
 assert.equal(media.canReadExistingImages,true);
 assert.equal(media.canUploadNewImages,false);
 assert.equal(media.canReplaceImages,false);
 assert.equal(media.canUploadKnotSequences,false);
 assert.throws(()=>{media.canUploadNewImages=true;},TypeError);
});
test('V3-MEDIA02 runtime refuses forged image-upload capabilities',()=>{
 const fake={querySelector:()=>null};
 assert.throws(()=>presentD6OwnerImageCapability(fake,{...media,canUploadNewImages:true}),
  /Unverified V3 owner media capability/);
 assert.throws(()=>presentD6OwnerImageCapability(fake,undefined),
  /Unverified V3 owner media capability/);
});
test('V3-MEDIA03 a placeholder staging function does not enable new uploads',()=>{
 const ui=read('ui.mjs');
 const gearKB=read('d6-approved-owner-editor-preview.mjs');
 const catches=read('d6-direct-catch-editor.mjs');
 assert.ok(ui.includes('selectD6OwnerMediaCapabilities('));
 assert.ok(ui.includes('ownerMediaCoordinator:mediaCapabilities===DIRECT_D1_MEDIA_CAPABILITIES'));
 const entry=read('entry.mjs');
 assert.ok(entry.includes('__FISHING_D6_OWNER_MEDIA_UPLOAD__'));
 assert.ok(entry.includes('settings.release?.d6OwnerMediaUpload!==true'));
 assert.ok(entry.includes('settings.manifest?.d6OwnerMediaUpload!==true'));
 assert.doesNotMatch(ui,/stageMedia:async/);
 for(const source of [gearKB,catches]){
  assert.match(source,/allowUpload:ctx\.v3\?\.mediaCapabilities\?\.canUploadNewImages===true/);
  assert.match(source,/presentD6OwnerImageCapability\(notesEditor\.element/);
 }
 assert.match(gearKB,/mediaCapabilities\?\.canUploadNewImages!==true/);
 assert.match(gearKB,/const wantsMedia=mediaAction!=='keep'\|\|fileInfo\|\|sequenceSet\|\|notesUploads\.length/);
 assert.match(gearKB,/saved=await saveD6OwnerEditorMedia/);
 assert.match(gearKB,/coordinator:ctx\.v3\?\.ownerMediaCoordinator/);
 assert.match(catches,/if\(notesUploads\.length&&ctx\.v3\?\.mediaCapabilities\?\.canUploadNewImages!==true\)/);
 assert.match(catches,/await saveD6OwnerEditorMedia/);
 assert.match(catches,/coordinator:ctx\.v3\?\.ownerMediaCoordinator/);
});
test('V3-MEDIA04 shared disabled image button is only UI, not an upload',()=>{
 const policy=read('d6-owner-media-capabilities.mjs');
 assert.match(policy,/hiddenButton\.hidden!==true/);
 assert.match(policy,/unavailable\.hidden=false;unavailable\.disabled=true/);
 assert.match(policy,/New image uploads are not yet available/);
 const accepted=read('notes-markdown-editor.mjs');
 assert.match(accepted,/imageButton\.hidden=!allowUpload/);
});

test('M02 V3 media previews reuse accepted Notes parser and verified R2 resolver',()=>{
 const gearKB=read('d6-approved-owner-editor-preview.mjs');
 const catches=read('d6-direct-catch-editor.mjs');
 const notes=read('notes-markdown-editor.mjs');
 for(const editor of [gearKB,catches]){
  assert.ok(editor.includes('resolveSavedAsset:path=>(ctx.image||ctx.asset)(path)'));
  assert.ok(editor.includes('ctx.mediaLiveReader===true?{resolveImage:ctx.image}'));
 }
 assert.ok(gearKB.includes('const resolveSavedImage=ctx.image||ctx.asset'));
 assert.ok(gearKB.includes('sequence.length>=2&&sequence.every(Boolean)'));
 assert.ok(gearKB.includes('ctx.mediaPublishedPaths instanceof Set'));
 assert.ok(notes.includes('const parsed=parseMarkdown(input.value'));
 assert.ok(!notes.includes('strictMediaResolution'));
});

test('M02 private editor capabilities require ready coordinator and explicit approval',()=>{
 const ready={ready:()=>true,stage:async()=>{},publish:async()=>{}};
 for(const params of [{},{approved:true},{coordinator:ready},
  {approved:true,coordinator:{...ready,ready:()=>false}},
  {approved:true,coordinator:{...ready,publish:null}}]){
  assert.strictEqual(selectD6OwnerMediaCapabilities(params),media);
 }
 const enabled=selectD6OwnerMediaCapabilities({approved:true,coordinator:ready});
 assert.strictEqual(enabled,privateMedia);
 assert.equal(Object.isFrozen(enabled),true);
 assert.equal(enabled.canUploadNewImages,true);
 assert.equal(enabled.canReplaceImages,true);
 assert.equal(enabled.canUploadKnotSequences,true);
 const button={hidden:false},toolbar={querySelector:()=>button};
 const editor={querySelector:()=>toolbar};
 assert.doesNotThrow(()=>presentD6OwnerImageCapability(editor,enabled));
 button.hidden=true;
 assert.throws(()=>presentD6OwnerImageCapability(editor,enabled),
  /Shared Notes image capability/);
});
