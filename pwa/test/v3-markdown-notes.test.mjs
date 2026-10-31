import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseMarkdown} from '../src/markdown.mjs';
import {notesImageMarkdown,noteImagePath,noteImageReference,viewerMarkdownTitle}
 from '../src/notes-markdown-editor.mjs';
import {prepareChange,validatePackage,validInlineNoteImagePath} from '../src/handoff.mjs';
import {expectedD4Media} from '../../experiments/p3/preview/src/d4-media-tickets.mjs';
import {verifyD4MediaManifest} from '../../experiments/p3/preview/src/d4-media-integrity.mjs';

test('V3-N01 semantic unordered and ordered Markdown lists inside table cells',()=>{
 const md=['| Action | Instructions |','| --- | --- |',
  '| Start | - Connect battery<br/>- Power on<br/>- Confirm GPS |',
  '| Configure | 1. Select Sonar<br/>2. Set depth<br/>3. Confirm |'].join('\n');
 const html=parseMarkdown(md).html;
 assert.match(html,/<ul><li>Connect battery<\/li><li>Power on<\/li><li>Confirm GPS<\/li><\/ul>/);
 assert.match(html,/<ol><li>Select Sonar<\/li><li>Set depth<\/li><li>Confirm<\/li><\/ol>/);
 assert.doesNotMatch(html,/&lt;br/);
});
test('V3-N02 raw HTML is still disabled and untrusted tags are escaped',()=>{
 const html=parseMarkdown('| Key | Value |\n|---|---|\n| A | <script>alert(1)</script><br/>OK |').html;
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/&lt;script&gt;/);
 assert.match(html,/<br\/>/);
});
test('V3-N03 generated relative image paths and viewer marker preserve Catch cover picture',async()=>{
 const record={id:'p3-test-catch-salmon',date:'2026-10-31',speciesName:'Synthetic Salmon'};
 const file='fish-photo.jpg',path=noteImagePath('catches',record,file);
 assert.equal(path,'Catches/assets/p3-test-catch-salmon/notes/fish-photo.jpg');
 assert.equal(noteImageReference(path),'../assets/p3-test-catch-salmon/notes/fish-photo.jpg');
 assert.equal(notesImageMarkdown(path,'Fish',['x']), '![Fish](../assets/p3-test-catch-salmon/notes/fish-photo.jpg)');
 assert.equal(viewerMarkdownTitle(true,'Large fish'),' "viewer: Large fish"');
 const body=notesImageMarkdown(path,'Fish',{viewer:true,caption:'Large fish'});
 const files=new Set([path]);
 const parsed=parseMarkdown(body,{owner:'Catches/content/p3-test-catch-salmon.md',
  maps:{},exists:files,viewerImages:true});
 assert.equal(parsed.references[0].local,path);
 assert.equal(parsed.references[0].viewerEnabled,true);
 const bytes=new Uint8Array([137,80,78,71,13,10,26,10]);
 const sha=createHash('sha256').update(bytes).digest('hex');
 const pkg=await prepareChange({domain:'catches',operation:'add',id:record.id,record,
  text:body,sourceRevision:'a'.repeat(40),notesImages:[{path,bytes:bytes.length,sha256:sha}]});
 assert.equal(pkg.picture.action,'keep');
 assert.deepEqual(pkg.notes.images,[{path,bytes:bytes.length,sha256:sha}]);
 validatePackage(pkg);
 assert.equal(expectedD4Media(pkg).length,1);
 const result=await verifyD4MediaManifest({package:pkg,uploads:[{path,bytes}]});
 assert.equal(result.verified,true);
 assert.equal(result.fileCount,1);
});
test('V3-N04 Notes image paths are owner-scoped and Catch cover media remains excluded',async()=>{
 const id='p3-test-catch-salmon';
 assert.equal(validInlineNoteImagePath('catches',id,'Catches/assets/'+id+'/notes/fish.jpg'),true);
 assert.equal(validInlineNoteImagePath('catches',id,'Catches/assets/unrelated/notes/fish.jpg'),false);
 assert.equal(validInlineNoteImagePath('gear',id,'Catches/assets/'+id+'/notes/fish.jpg'),false);
 const metadata={path:'Catches/assets/unrelated/notes/fish.jpg',bytes:8,sha256:'f'.repeat(64)};
 await assert.rejects(prepareChange({domain:'catches',operation:'add',id,
  record:{id,date:'2026-10-31',speciesName:'Synthetic Salmon'},
  sourceRevision:'a'.repeat(40),text:'Image',notesImages:[metadata]}),/Invalid inline Notes image/);
 await assert.rejects(prepareChange({domain:'catches',operation:'add',id,
  record:{id,date:'2026-10-31',speciesName:'Synthetic Salmon',picture:{src:'Catches/assets/cover.jpg'}},
  sourceRevision:'a'.repeat(40),text:'Image'}),/Catch pictures/);
});
