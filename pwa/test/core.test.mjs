import test from 'node:test';
import assert from 'node:assert/strict';
import {safePath,pathKey,encodedPath,parseRoute,routeFor,internalLink,catchHistory,sortGear,localDateValid} from '../src/shared.mjs';
import {validateRecords,validateLibraryPaths,checkPathCollisions} from '../src/validation.mjs';
import {parseMarkdown,markdownRouteMap} from '../src/markdown.mjs';
import {validateImage} from '../tools/library.mjs';
// Synthetic catalog; production content belongs to D1, not the repository.
const data={
 gear:{schemaVersion:2,items:[
  {id:'daiwa-tatula-xt-rod',category:'rods-reels',type:'Spinning rod',name:'Fixture rod',specifications:[],links:[]},
  {id:'fixture-lure',category:'lures',type:'Spoons',name:'Fixture lure',specifications:[],links:[]},
 ]},
 kb:{schemaVersion:2,entities:[
  {id:'fixture-species',type:'species',name:'Fixture species',content:'KB/Species/content/fixture-species.md'},
  {id:'fixture-location',type:'location',name:'Fixture location',content:'KB/Locations/content/fixture-location.md'},
 ]},
 catches:{schemaVersion:2,catches:[
  {id:'fixture-catch',date:'2026-11-20',notes:'Catches/content/fixture-catch.md',speciesId:'fixture-species',locationId:'fixture-location',lureOrBaitId:'fixture-lure'},
 ]},
};
const maps=validateRecords(data),routes=markdownRouteMap(data);
const clone=x=>structuredClone(x);
test('synthetic content graph validates its schemas, types and references',()=>{
 assert.equal(maps.gear.size,data.gear.items.length);assert.equal(maps.kb.size,data.kb.entities.length);assert.equal(maps.catches.size,data.catches.catches.length);
 const paths=validateLibraryPaths(data);assert(paths.size>0);
});
test('strict schema rejects unknown fields, duplicate IDs, invalid dates and broken references',()=>{
 const bad=clone(data);bad.gear.items[0].quantity=1;assert.throws(()=>validateRecords(bad),/additional properties|schema/i);
 const dup=clone(data);dup.gear.items.push(clone(dup.gear.items[0]));assert.throws(()=>validateRecords(dup),/Duplicate/);
 const invalid=clone(data);invalid.catches.catches[0].date='2026-02-30';assert.throws(()=>validateRecords(invalid),/date/);
 const ref=clone(data);ref.catches.catches[0].speciesId='retired-species';assert.throws(()=>validateRecords(ref),/speciesId/);
 const wrong=clone(data);wrong.catches.catches[0].lureOrBaitId='daiwa-tatula-xt-rod';assert.throws(()=>validateRecords(wrong),/lure\/bait/);
});
test('dates and ordered domain sorting are deterministic',()=>{
 assert(localDateValid('2024-02-29'));assert(!localDateValid('2025-02-29'));assert(!localDateValid('2026-13-01'));
 assert.deepEqual(sortGear([{type:'B',name:'Z'},{type:'A',name:'Z'},{type:'A',name:'A'}]).map(x=>x.name),['A','Z','Z']);
});
test('canonical paths reject traversal, controls, Windows names and Unicode collisions',()=>{
 for(const bad of ['../x','./x','/x','a//b','a/./b','a/../b','a\\b','a:invalid','Gear/CON.txt','Gear/LPT1.png','Gear/name.','Gear/name ','Gear/hello\u202e.jpg','Gear/hello\u200f.jpg','Gear/'+ 'a'.repeat(181),'Gear/'+ 'é'.repeat(121)])assert.throws(()=>safePath(bad));
 assert.equal(safePath('Gear/Equipment/assets/La pêche été.png'),'Gear/Equipment/assets/La pêche été.png');
 assert.equal(encodedPath('Gear/Equipment/assets/La pêche été.png'),'Gear/Equipment/assets/La%20p%C3%AAche%20%C3%A9t%C3%A9.png');
 assert.throws(()=>checkPathCollisions(['Gear/A.png','gear/a.png']),/collision/);
 assert.equal(pathKey('Gear/Été.png'),pathKey('gear/Été.png'));
});
test('stable routes preserve existing identities and missing references fail closed',()=>{
 assert.deepEqual(parseRoute('#/inventory/item/daiwa-tatula-xt-rod'),{page:'gear-detail',id:'daiwa-tatula-xt-rod'});
 assert.deepEqual(parseRoute('#/kb/technique/ned-rig'),{page:'kb-detail',id:'ned-rig'});
 assert.equal(internalLink('gear://daiwa-tatula-xt-rod',maps),routeFor('gear','daiwa-tatula-xt-rod'));
 assert.throws(()=>internalLink('gear://setup-spinning',maps),/Unknown/);
 assert.deepEqual(parseRoute('#/inventory/item/a%2Fb'),{page:'gear-detail',id:'a/b'});
});
test('Catch History is derived only from three approved forward references',()=>{
 for(const c of data.catches.catches){
  if(c.speciesId)assert(catchHistory(data,'kb',c.speciesId).some(x=>x.id===c.id));
  if(c.locationId)assert(catchHistory(data,'kb',c.locationId).some(x=>x.id===c.id));
  if(c.lureOrBaitId)assert(catchHistory(data,'gear',c.lureOrBaitId).some(x=>x.id===c.id));
 }
 assert.deepEqual(catchHistory(data,'gear','daiwa-tatula-xt-rod'),[]);
 assert.deepEqual(catchHistory(data,'kb','technique-ned-rig'),[]);
});
test('Markdown preserves tables, lists and code while escaping executable HTML',()=>{
 const owner=data.kb.entities[0].content;
 const result=parseMarkdown('# Heading\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n- Parent\n  - Child\n\n```html\n<script>alert(1)</script>\n```\n\n<script>alert(1)</script>',{owner,maps,pathRoutes:routes});
 assert.match(result.html,/<table>/);assert.match(result.html,/<ul>/);assert.match(result.html,/&lt;script&gt;/);assert.doesNotMatch(result.html,/<script>/);
 assert.match(result.html,/id="heading"/);
});
test('Markdown external links open a new tab while internal links remain same-tab',()=>{const owner=data.kb.entities[0].content;const result=parseMarkdown('[External](https://example.com) [Internal](gear://daiwa-tatula-xt-rod)',{owner,maps,pathRoutes:routes});assert(result.html.includes('href="https://example.com" target="_blank" rel="noopener noreferrer"'));assert(result.html.includes('href="#/inventory/item/daiwa-tatula-xt-rod"'));assert(!result.html.includes('href="#/inventory/item/daiwa-tatula-xt-rod" target="_blank"'));});
test('Markdown resolves internal, relative and heading links without double encoding',()=>{
 const owner=data.kb.entities[0].content;
 const result=parseMarkdown('[Gear](gear://daiwa-tatula-xt-rod) [Section](#Fishing%20Tips) [Local](../assets/La%20p%C3%AAche.png)',{owner,maps,pathRoutes:routes});
 assert.equal(result.references[0].target,routeFor('gear','daiwa-tatula-xt-rod'));
 assert.match(result.references[1].target,/section=Fishing%20Tips/);
 assert.match(result.references[2].target,/La%20p%C3%AAche.png/);
});
test('Markdown refuses remote images, unsafe URLs, missing resources and empty alt',()=>{
 const owner=data.kb.entities[0].content;
 for(const source of ['![Remote](https://example.com/image.png)','![](../assets/a.png)','[bad](%2e%2e%2fsecret)','[bad](../%2Fsecret)'])assert.throws(()=>parseMarkdown(source,{owner,maps,exists:new Set(),pathRoutes:routes}));
 for(const source of ['[bad](javascript:alert%281%29)','![bad](data:image/png;base64,AA)']){const unsafe=parseMarkdown(source,{owner,maps});assert.doesNotMatch(unsafe.html,/<(?:a|img)\b/i);}
 assert.throws(()=>parseMarkdown('[Missing](gear://retired)',{owner,maps}),/Unknown/);
});
test('malformed images and unsupported formats are rejected',async()=>{
 await assert.rejects(validateImage(Buffer.from('not an image'),'Gear/Lures/assets/bad.png'));
 await assert.rejects(validateImage(Buffer.from('GIF89a'),'Gear/Lures/assets/bad.avif'),/Unsupported/);
});
