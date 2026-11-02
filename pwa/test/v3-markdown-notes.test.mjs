import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseMarkdown} from '../src/markdown.mjs';
import {notesImageMarkdown,noteImagePath,noteImageReference,viewerMarkdownTitle,notesPreviewSource}
 from '../src/notes-markdown-editor.mjs';
import {prepareChange,validatePackage,validInlineNoteImagePath} from '../src/handoff.mjs';
import {expectedD4Media} from '../../experiments/p3/preview/src/d4-media-tickets.mjs';
import {verifyD4MediaManifest} from '../../experiments/p3/preview/src/d4-media-integrity.mjs';
import {expectedD3HostedPaths,d3HostedTestPath,parseD3HostedTestPath} from '../../experiments/p3/preview/src/d3-sandbox-host-paths.mjs';

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
 const file='fish-photo.png',path=noteImagePath('catches',record,file);
 assert.equal(path,'Catches/assets/p3-test-catch-salmon/notes/fish-photo.png');
 assert.equal(noteImageReference(path),'../assets/p3-test-catch-salmon/notes/fish-photo.png');
 assert.equal(notesImageMarkdown(path,'Fish'), '![Fish](../assets/p3-test-catch-salmon/notes/fish-photo.png)');
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
  sourceRevision:'a'.repeat(40),text:'Image',notesImages:[metadata]}),/Invalid Notes image/);
 await assert.rejects(prepareChange({domain:'catches',operation:'add',id,
  record:{id,date:'2026-10-31',speciesName:'Synthetic Salmon',picture:{src:'Catches/assets/cover.jpg'}},
  sourceRevision:'a'.repeat(40),text:'Image'}),/Catch pictures/);
});

test('V3-N05 Catch Notes photos participate in authenticated exact hosted-byte verification',async()=>{
 const id='p3-test-catch-salmon',path='Catches/assets/'+id+'/notes/fish.jpg';
 const pkg=await prepareChange({domain:'catches',operation:'add',id,
  record:{id,date:'2026-10-31',speciesName:'Synthetic Salmon'},
  sourceRevision:'a'.repeat(40),text:'![Fish](../assets/'+id+'/notes/fish.jpg "viewer")',
  notesImages:[{path,bytes:8,sha256:'b'.repeat(64)}]});
 const files=expectedD3HostedPaths(pkg,[{path,blobSha:'c'.repeat(40),sha256:'b'.repeat(64)}]);
 assert(files.includes('pwa/'+path));
 const url=d3HostedTestPath('p3_'+('a'.repeat(36)),'pwa/'+path);
 assert.equal(parseD3HostedTestPath(url)?.file,'pwa/'+path);
});

test('V3-N06 missing Name errors identify the field required to create an image owner path',()=>{
 for(const domain of ['gear','kb']){
  const draft={id:'',name:'',category:'rods-reels',type:'location'};
  assert.throws(()=>noteImagePath(domain,draft,'photo.jpg'),/Enter a Name above first/);
  assert.throws(()=>noteImagePath(domain,{...draft,name:'New item'},'photo.jpg'),/item ID is not yet valid/);
 }
 assert.throws(()=>noteImagePath('catches',{id:''},'photo.jpg'),/Catch details/);
});

test('V3-N07 saved KB/Gear/Catch Notes images resolve to verified private originals on edit',()=>{
 const cases=[
  ['kb','KB/Knots/content/Test Knot.md','KB/Knots/assets/p3-test-knot/notes/step-01.jpg'],
  ['gear','Gear/Rods-Reels/content/Test gear.md','Gear/Rods-Reels/assets/p3-test-gear/notes/step-01.jpg'],
  ['catches','Catches/content/p3-test-catch-2026-10-16-synthetic-lake-synthetic-bluegill.md',
   'Catches/assets/p3-test-catch-2026-10-16-synthetic-lake-synthetic-bluegill/notes/fish.jpg'],
 ];
 for(const [domain,owner,path] of cases){
  const body=notesImageMarkdown(path,'Saved original',{viewer:true,caption:'Stored image'});
  const refs=parseMarkdown(body,{owner,exists:new Set([path]),viewerImages:true}).references;
  assert.equal(refs.length,1,domain);
  const privateUrl='https://fishing-auth-p0-test.ginosega.workers.dev/api/v3/assets/'+
   encodeURIComponent(path)+'?revision='+('a'.repeat(40));
  let resolved=0;
  const source=notesPreviewSource(refs[0],{
   knownPaths:new Set([path]),staged:new Map(),
   resolveSavedAsset:requested=>{resolved++;assert.equal(requested,path);return privateUrl;},
  });
  assert.equal(source,privateUrl);
  assert.equal(resolved,1);
 }
});
test('V3-N08 new image uses local staged URL, saved preview refuses missing/foreign assets',()=>{
 const path='Gear/Rods-Reels/assets/p3-test-gear/notes/a.jpg';
 const ref=parseMarkdown('![A](../assets/p3-test-gear/notes/a.jpg)',{
  owner:'Gear/Rods-Reels/content/Test gear.md',
  exists:new Set([path]),viewerImages:true}).references[0];
 const known=new Set([path]),local='blob:https://example.test/local';
 assert.equal(notesPreviewSource(ref,{knownPaths:known,staged:new Map([[path,{url:local}]]),
  resolveSavedAsset:()=>{throw Error('Never fetched staged original');}}),local);
 assert.equal(notesPreviewSource(ref,{knownPaths:new Set(),staged:new Map(),
  resolveSavedAsset:()=>{throw Error('Unverified asset path');}}),null);
 assert.equal(notesPreviewSource({...ref,kind:'external'},{
  knownPaths:known,resolveSavedAsset:()=> 'https://example.test/fake.jpg'}),null);
 for(const unsafe of ['http://remote.example/asset.jpg','javascript:alert(1)',
  'https://user:password@example.test/a.jpg']){
  assert.equal(notesPreviewSource(ref,{knownPaths:known,
   resolveSavedAsset:()=>unsafe}),null);
 }
});
test('V3-N09 immutable Catch edit labels survive Notes-only and data-only updates',async()=>{
 const current={id:'p3-test-catch-2026-10-16-synthetic-lake-synthetic-bluegill',
  date:'2026-10-16',speciesName:'Synthetic bluegill',time:'10:30',size:'9 in.',
  notes:'Catches/content/p3-test-catch-2026-10-16-synthetic-lake-synthetic-bluegill.md'};
 const pkg=await prepareChange({domain:'catches',operation:'edit',
  id:current.id,record:current,baseRecord:current,
  text:'Extra note',baseText:'Prior note',sourceRevision:'a'.repeat(40)});
 assert.equal(pkg.notes.action,'replace');
 assert.deepEqual(pkg.changes,{set:{},unset:[],baseFields:{}});
 assert.deepEqual(pkg.display,{itemName:'Synthetic bluegill · 2026-10-16'});
 validatePackage(pkg);
 const next={...current,time:'11:00',size:'10 in.'};
 const data=await prepareChange({domain:'catches',operation:'edit',
  id:current.id,record:next,baseRecord:current,
  text:'Prior note',baseText:'Prior note',sourceRevision:'a'.repeat(40)});
 assert.equal(data.notes.action,'keep');
 assert.equal(data.display.itemName,'Synthetic bluegill · 2026-10-16');
 validatePackage(data);
});
