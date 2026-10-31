import test from 'node:test';
import assert from 'node:assert/strict';
import {internalLink,routeFor} from '../src/shared.mjs';
import {parseMarkdown} from '../src/markdown.mjs';
import {notesLinkTargets,findNotesLinkTargets,notesLinkMarkdown}
 from '../src/notes-link.mjs';
import {readFileSync} from 'node:fs';
import {draftNotesPreviewOptions} from '../src/editor-preview.mjs';

const maps={
 gear:new Map([
  ['humminbird-fish-finder',{id:'humminbird-fish-finder',name:'Humminbird Fish Finder'}],
  ['garmin-force-current',{id:'garmin-force-current',name:'Garmin Force Current'}]]),
 kb:new Map([['location-banks-lake',{id:'location-banks-lake',name:'Banks Lake'}]]),
 catches:new Map(Array.from({length:150},(_,i)=>{
  const id='catch-'+String(i+1).padStart(4,'0');
  return [id,{id,date:'2026-10-31'}];
 }))
};
const parserOptions={owner:'Gear/Equipment/content/Humminbird.md',maps,
 assetBase:'https://example.test/fishing/releases/release/'};

test('V3-L01 searchable picker includes Gear/KB and site navigation, never Catch entries',()=>{
 const targets=notesLinkTargets(maps);
 assert.equal(targets.length,7);
 assert.equal(targets.filter(t=>t.uri.startsWith('catches://')).length,0);
 assert.equal(targets.filter(t=>t.group==='Navigation').length,4);
 assert(targets.some(t=>t.uri==='site://catches'&&t.title==='Catch Log'));
 assert.equal(findNotesLinkTargets(targets,{query:'fish finder'}).length,1);
 assert.equal(findNotesLinkTargets(targets,{group:'Gear'}).length,2);
 assert.deepEqual(findNotesLinkTargets(targets,{query:'banks'}).map(t=>t.uri),
  ['kb://location-banks-lake']);
 assert.deepEqual(findNotesLinkTargets(targets,{query:'catch'}).map(t=>t.uri),
  ['site://catches']);
});

test('V3-L02 existing Gear/KB URI and manual Catch URI resolve to stable site routes',()=>{
 for(const [uri,expected] of [
  ['gear://humminbird-fish-finder','#/inventory/item/humminbird-fish-finder'],
  ['kb://location-banks-lake','#/kb/location-banks-lake'],
  ['catches://catch-0001','#/catches/catch-0001'],
  ['site://home','#/'],['site://gear','#/inventory'],
  ['site://kb','#/kb'],['site://catches','#/catches']]){
  assert.equal(internalLink(uri,maps),expected,uri);
  const inserted=notesLinkMarkdown('Go to page',uri,maps);
  const parsed=parseMarkdown(inserted,parserOptions);
  assert.equal(parsed.references[0].kind,'internal');
  assert.equal(parsed.references[0].target,expected);
  assert.match(parsed.html,/href="#\//);
 }
 assert.equal(routeFor('catches','catch-0001'),'#/catches/catch-0001');
});

test('V3-L03 picker links can use selected text and preserve custom Markdown labels',()=>{
 assert.equal(notesLinkMarkdown('Humminbird Fish Finder','gear://humminbird-fish-finder',maps),
  '[Humminbird Fish Finder](gear://humminbird-fish-finder)');
 assert.equal(notesLinkMarkdown('Read [setup] notes','site://kb',maps),
  String.raw`[Read \[setup\] notes](site://kb)`);
 const html=parseMarkdown(notesLinkMarkdown('Read [setup] notes','site://kb',maps),parserOptions).html;
 assert.match(html,/>Read \[setup\] notes<\/a>/);
});

test('V3-L04 valid external HTTPS links open new tab and escape parentheses in destination',()=>{
 const link=notesLinkMarkdown('Device manual',
  'https://example.com/manual(v2)?version=1&mode=full',maps);
 assert.match(link,/manual%28v2%29/);
 const parsed=parseMarkdown(link,parserOptions);
 assert.equal(parsed.references[0].kind,'external');
 assert.match(parsed.html,/target="_blank"/);
 assert.match(parsed.html,/rel="noopener noreferrer"/);
});

test('V3-L05 invalid links fail closed before insertion or publication',()=>{
 for(const target of ['site://unknown','gear://unknown','kb://absent',
  'catches://unknown','https://user:password@example.com/',
  'javascript:alert(1)','file:///etc/passwd','//example.com',
  'ftp://example.com','https://example.com/no spaces']){
  assert.throws(()=>notesLinkMarkdown('Bad link',target,maps),Error,target);
 }
 assert.throws(()=>notesLinkMarkdown('  ','site://kb',maps),/Link text is required/);
 assert.throws(()=>notesLinkMarkdown('label','',maps),/Choose a link destination/);
 assert.throws(()=>parseMarkdown('[Bad](site://invalid)',parserOptions),/Unknown internal reference/);
 assert.throws(()=>parseMarkdown('[Bad](catches://missing)',parserOptions),/Unknown internal reference/);
});

test('V3-L06 all Gear/KB/Catch Notes share toolbar with link and image insertion',()=>{
 const editor=readFileSync(new URL('../src/notes-markdown-editor.mjs',import.meta.url),'utf8');
 const gear=readFileSync(new URL('../src/editor.mjs',import.meta.url),'utf8');
 const catchNotes=readFileSync(new URL('../src/catch-editor.mjs',import.meta.url),'utf8');
 assert.match(editor,/button\('Insert link'/);
 assert.match(editor,/button\('Insert image'/);
 assert.match(editor,/toolbar\.append\(linkButton,imageButton,previewButton,expandButton\)/);
 assert.match(gear,/createNotesMarkdownEditor\(/);
 assert.match(catchNotes,/createNotesMarkdownEditor\(/);
 assert.match(editor,/linkList\.addEventListener\('change'/);
 assert.match(editor,/insertAtCursor\(markdown\)/);
});

test('V3-L07 Preview renders a chosen D3 Verification link before a new Gear draft has a Name or ID',()=>{
 const testRod={id:'p3-test-rod',name:'P3 Test Rod D3 Verification',
  type:'Spinning rod',category:'rods-reels',
  notes:'Gear/Rods-Reels/content/P3 Test Rod D3 Verification.md'};
 const testLake={id:'location-p3-test-lake',
  name:'P3 Test Lake D3 Verification - Validation Fix Test',
  type:'location',content:'KB/Locations/content/P3 Test Lake.md'};
 const data={gear:{items:[testRod]},kb:{entities:[testLake]},catches:{catches:[]}};
 const verifiedMaps={gear:new Map([[testRod.id,testRod]]),
  kb:new Map([[testLake.id,testLake]]),catches:new Map()};
 const ctx={data,maps:verifiedMaps,base:'https://example.test/fishing/releases/release/'};
 const incompleteGear={id:'',name:'',category:'rods-reels',
  type:'Spinning rod',specifications:[],links:[]};
 const options=draftNotesPreviewOptions(ctx,'gear',incompleteGear);
 assert.equal(options.maps,verifiedMaps,'Preview uses the validated source catalog');
 assert.equal(options.owner,'Gear/Rods-Reels/content/Notes-Preview.md');
 for(const uri of ['gear://p3-test-rod','kb://location-p3-test-lake','site://kb']){
  const markdown=notesLinkMarkdown('D3 Verification',uri,verifiedMaps);
  const parsed=parseMarkdown(markdown,{...options,exists:new Set()});
  assert.equal(parsed.references.length,1);
  assert.equal(parsed.references[0].kind,'internal');
  assert.match(parsed.html,/>D3 Verification<\/a>/);
 }
});
test('V3-L08 Preview handles incomplete Knowledge Base draft and preserves validation on Save',()=>{
 const data={gear:{items:[]},kb:{entities:[]},catches:{catches:[]}};
 const maps={gear:new Map(),kb:new Map(),catches:new Map()};
 const ctx={data,maps,base:'https://example.test/fishing/releases/release/'};
 const draft={id:'',name:'',type:'technique'};
 const preview=draftNotesPreviewOptions(ctx,'kb',draft);
 assert.equal(preview.owner,'KB/Techniques/content/Notes-Preview.md');
 const parsed=parseMarkdown('[Knowledge Base](site://kb)',preview);
 assert.match(parsed.html,/href="#\/kb"/);
 const editor=readFileSync(new URL('../src/editor.mjs',import.meta.url),'utf8');
 assert.match(editor,/draftNotesPreviewOptions\(ctx,domain,record\)/);
 assert.match(editor,/const result=editorMaps\(ctx,domain,candidate\);validateRecord\(candidate,domain,ctx.data\)/);
});
test('V3-L09 Both image and link panels have compact Insert label',()=>{
 const editor=readFileSync(new URL('../src/notes-markdown-editor.mjs',import.meta.url),'utf8');
 assert.equal((editor.match(/button\('Insert',/g)||[]).length,2);
 assert.doesNotMatch(editor,/Insert into Notes/);
});
