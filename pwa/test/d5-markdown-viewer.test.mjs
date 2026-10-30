import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMarkdown} from '../src/markdown.mjs';
import {bindMarkdownPictureViewer} from '../src/markdown-viewer.mjs';

const owner='KB/Knots/content/Synthetic knot.md';
const image='KB/Knots/assets/step-01.jpg';
const base='https://example.test/fishing/releases/abc123/';
function parsedMarkdown(markdown,extras={}){
 return parseMarkdown(markdown,{owner,maps:{},
  assetBase:base,exists:new Set([image]),...extras});
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
 assert.equal(relaxed.references[0].kind,'image');
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
 assert.equal(reference.kind,'image');
 assert.equal(reference.local,image);
 assert.equal(reference.missing,false);
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
 assert.equal(parsed.references.filter(x=>x.kind==='image').length,1);
 const ref=parsed.references.find(x=>x.kind==='image');
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
