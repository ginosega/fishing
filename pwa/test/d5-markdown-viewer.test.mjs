import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMarkdown} from '../src/markdown.mjs';
import {bindMarkdownPictureViewer} from '../src/markdown-viewer.mjs';

const owner='KB/Knots/content/Synthetic knot.md';
const image='KB/Knots/assets/step-01.jpg';
const base='https://example.test/fishing/releases/abc123/';
function parsedMarkdown(markdown,extras={}){
 return parseMarkdown(markdown,{owner,maps:{},
  assetBase:base,exists:new Set([image]),viewerImages:true,...extras});
}

function element(tag){
 return {
  tag,attrs:{},handlers:{},className:'',replacement:null,
  setAttribute(name,value){this.attrs[name]=value;},
  getAttribute(name){return this.attrs[name]??null;},
  addEventListener(name,cb){this.handlers[name]=cb;},
  replaceWith(replacement){this.replacement=replacement;},
  append(child){this.child=child;},
 };
}
function fixture({src,alt='Synthetic knot',title='',linked=false}={}){
 const imageNode=element('img');
 imageNode.src=src;
 imageNode.attrs={alt,title,src};
 imageNode.closest=selector=>selector==='a'&&linked?{tag:'a'}:null;
 const article={
  ownerDocument:{createElement:element},
  querySelectorAll(selector){assert.equal(selector,'img');return [imageNode];},
 };
 return {article,imageNode};
}
test('D5-V01 strict writer still rejects missing Markdown images, V3 reader degrades only missing images',()=>{
 const markdown='Before ![First step](../assets/missing.jpg) after';
 assert.throws(()=>parsedMarkdown(markdown),/Missing Markdown resource/);
 const relaxed=parsedMarkdown(markdown,{allowMissingImages:true});
 assert.equal(relaxed.references.length,1);
 assert.equal(relaxed.references[0].kind,'local');
 assert.equal(relaxed.references[0].isImage,true);
 assert.equal(relaxed.references[0].missing,true);
 assert.match(relaxed.html,/Before/);
 assert.match(relaxed.html,/after/);
 assert.throws(()=>parsedMarkdown('[Bad link](../assets/missing.jpg)',
  {allowMissingImages:true}),/Missing Markdown resource/,
  'V3 image fallback must not relax nonimage link validation');
 assert.throws(()=>parsedMarkdown('![Remote](https://example.com/bad.jpg)',
  {allowMissingImages:true}),/Remote or unsafe Markdown image/);
});
test('D5-V02 V3 local Markdown pictures open full original with accessible button and caption',()=>{
 const parsed=parsedMarkdown('![Synthetic knot](../assets/step-01.jpg "Step 1")');
 const reference=parsed.references[0];
 assert.equal(reference.kind,'local');
 assert.equal(reference.isImage,true);
 assert.equal(reference.local,image);
 assert.equal(reference.missing,undefined,'Existing valid Markdown reference shape stays unchanged');
 const {article,imageNode}=fixture({src:reference.target,title:'Step 1'});
 let called=null;
 assert.equal(bindMarkdownPictureViewer(article,{
  references:parsed.references,
  resolveAsset:file=>{assert.equal(file,image);
   return 'https://example.test/verified-original.jpg';},
  openViewer:(...args)=>{called=args;},
 }),true);
 assert.equal(imageNode.src,'https://example.test/verified-original.jpg');
 assert.equal(imageNode.replacement.tag,'button');
 assert.equal(imageNode.replacement.attrs['aria-label'],'Enlarge Synthetic knot');
 assert.equal(imageNode.replacement.child,imageNode);
 imageNode.replacement.handlers.click();
 assert.deepEqual(called,['https://example.test/verified-original.jpg',
  'Synthetic knot','Step 1']);
 imageNode.handlers.error();
 assert.equal(imageNode.replacement.replacement.tag,'span');
 assert.match(imageNode.replacement.replacement.textContent,
  /Picture unavailable: Synthetic knot/);
});
test('D5-V03 image inside a normal link keeps link behavior, no contradictory viewer action',()=>{
 const parsed=parsedMarkdown('[![Synthetic knot](../assets/step-01.jpg)](https://example.com)');
 assert.equal(parsed.references.filter(x=>x.isImage===true).length,1);
 const ref=parsed.references.find(x=>x.isImage===true);
 const {article,imageNode}=fixture({src:ref.target,linked:true});
 let opens=0;
 assert.equal(bindMarkdownPictureViewer(article,{
  references:parsed.references,
  resolveAsset:()=> 'https://example.test/original.jpg',
  openViewer:()=>{opens++;},
 }),true);
 assert.equal(imageNode.replacement,null);
 assert.equal(imageNode.handlers.click,undefined);
 assert.equal(opens,0);
 imageNode.handlers.error();
 assert.equal(imageNode.replacement.tag,'span');
});
test('D5-V04 missing image never starts fetch; mismatched sanitized source refuses enhancements',()=>{
 const parsed=parsedMarkdown('![Synthetic knot](../assets/missing.jpg)',
  {allowMissingImages:true});
 const ref=parsed.references[0];
 const {article,imageNode}=fixture({src:ref.target});
 let resolved=0;
 assert.equal(bindMarkdownPictureViewer(article,{
  references:parsed.references,
  resolveAsset:()=>{resolved++;return 'https://example.test/original.jpg';},
  openViewer:()=>{},
 }),true);
 assert.equal(resolved,0);
 assert.equal(imageNode.replacement.tag,'span');
 assert.match(imageNode.replacement.textContent,/Picture unavailable/);
 const bad=fixture({src:'https://example.test/untrusted.jpg'});
 assert.equal(bindMarkdownPictureViewer(bad.article,{
  references:parsed.references,
  resolveAsset:()=>{resolved++;return 'https://example.test/original.jpg';},
  openViewer:()=>{},
 }),true);
 assert.equal(bad.imageNode.replacement,null);
 assert.equal(resolved,0);
});
test('D5-V05 unexpected extra sanitized images do not obtain viewer controls',()=>{
 const parsed=parsedMarkdown('![Synthetic knot](../assets/step-01.jpg)');
 const ref=parsed.references[0];
 const fake=fixture({src:ref.target});
 fake.article.querySelectorAll=()=>[fake.imageNode,fake.imageNode];
 let opened=0;
 assert.equal(bindMarkdownPictureViewer(fake.article,{
  references:parsed.references,
  resolveAsset:()=>{opened++;return 'https://example.test/original.jpg';},
  openViewer:()=>{},
 }),false);
 assert.equal(opened,0);
});

test('D5-V06 ordinary V2 Markdown reference kinds and fields are unchanged',()=>{
 const result=parseMarkdown('![Synthetic knot](../assets/step-01.jpg)',{
  owner,maps:{},assetBase:base,exists:new Set([image]),
 });
 assert.equal(result.references.length,1);
 assert.equal(result.references[0].kind,'local');
 assert(!Object.hasOwn(result.references[0],'isImage'));
 assert(!Object.hasOwn(result.references[0],'missing'));
 assert.equal(result.references[0].local,image);
 const v3=parsedMarkdown('![Synthetic knot](../assets/step-01.jpg)');
 assert.equal(v3.references[0].kind,'local');
 assert.equal(v3.references[0].isImage,true);
 const linked=parsedMarkdown('[![Synthetic knot](../assets/step-01.jpg)](https://example.com)');
 assert.equal(linked.references.filter(x=>x.isImage===true).length,1);
 assert.equal(linked.references.filter(x=>x.kind==='external').length,1);
});


test('D5-V07 loopback candidate shows Banks Lake-style local Markdown PNG in full viewer',()=>{
 const banksOwner='KB/Locations/content/banks-lake.md';
 const south='KB/Locations/content/Banks-Lake-Steamboat-Rock-State-Park-South.png';
 const north='KB/Locations/content/Banks-Lake-Steamboat-Rock-State-Park-North.png';
 const localBase='http://127.0.0.1:4173/fishing/__v3_reader_candidate__/releases/'+'a'.repeat(32)+'/';
 const parsed=parseMarkdown(
  '| South | North |\n| --- | --- |\n| ![South](./Banks-Lake-Steamboat-Rock-State-Park-South.png) | ![North](./Banks-Lake-Steamboat-Rock-State-Park-North.png) |',
  {owner:banksOwner,maps:{},assetBase:localBase,viewerImages:true,
   exists:new Set([south,north])});
 const imgs=parsed.references.filter(x=>x.isImage===true);
 assert.equal(imgs.length,2);
 let opened=[];
 const fixtures=imgs.map(ref=>fixture({src:ref.target}));
 const doc=fixtures[0].article;
 doc.querySelectorAll=()=>fixtures.map(f=>f.imageNode);
 assert.equal(bindMarkdownPictureViewer(doc,{
  references:parsed.references,
  resolveAsset:file=>new URL('content/'+file,localBase).href,
  openViewer:(...args)=>opened.push(args),
 }),true);
 for(const f of fixtures){
  assert.equal(f.imageNode.replacement.tag,'button');
  f.imageNode.replacement.handlers.click();
 }
 assert.equal(opened.length,2);
 assert.match(opened[0][0],/^http:\/\/127\.0\.0\.1:4173\/fishing\/__v3_reader_candidate__\//);
});

test('D5-V08 viewer refuses non-loopback plaintext and credential-bearing original assets',()=>{
 const parsed=parsedMarkdown('![Synthetic knot](../assets/step-01.jpg)');
 for(const url of [
  'http://example.com/original.jpg',
  'http://user:password@127.0.0.1:4173/original.jpg',
  'javascript:alert(1)',
 ]){
  const {article,imageNode}=fixture({src:parsed.references[0].target});
  assert.equal(bindMarkdownPictureViewer(article,{
   references:parsed.references,resolveAsset:()=>url,openViewer:()=>{},
  }),true);
  assert.equal(imageNode.replacement,null,'untrusted asset must not gain viewer');
 }
});
