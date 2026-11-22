import test from 'node:test';
import assert from 'node:assert/strict';
import {notesImageMarkdown,viewerMarkdownTitle,notesPreviewSource} from '../src/notes-markdown-editor.mjs';
import {parseMarkdown} from '../src/markdown.mjs';
const path='KB/Locations/assets/banks/notes/shore.png',owner='KB/Locations/content/banks.md';
test('M03 only explicitly selected viewer images receive thumbnail metadata',()=>{
 const normal=notesImageMarkdown(path,'Banks Lake',{viewer:true,caption:'South shore'});
 const compact=notesImageMarkdown(path,'Banks Lake',{viewer:true,caption:'South shore',thumbnail:true});
 assert.match(normal,/"viewer: South shore"/);
 assert.match(compact,/"viewer-thumb: South shore"/);
 assert(!notesImageMarkdown(path,'Banks Lake',{viewer:false,thumbnail:true}).includes('viewer'));
 assert.equal(viewerMarkdownTitle(true,'',true),' "viewer-thumb"');
 const parsed=parseMarkdown(compact,{owner,maps:{},viewerImages:true,exists:new Set([path])});
 assert.equal(parsed.references[0].viewerThumbnail,true);
 assert.equal(parsed.references[0].viewerCaption,'South shore');
});
test('M03 unsaved image preview remains entirely local at compact render size',()=>{
 const ref={isImage:true,kind:'local',local:path,viewerThumbnail:true};
 assert.equal(notesPreviewSource(ref,{staged:new Map([[path,{url:'blob:staged-photo'}]])}),'blob:staged-photo');
 const saved=notesPreviewSource(ref,{staged:new Map(),knownPaths:new Set([path]),
  resolveSavedAsset:()=> 'https://example.test/api/v3/media/live/photo.png',
  resolveSavedThumbnail:()=> 'https://example.test/api/v3/media/thumb/photo.png',
 });
 assert.equal(saved,'https://example.test/api/v3/media/thumb/photo.png');
});
