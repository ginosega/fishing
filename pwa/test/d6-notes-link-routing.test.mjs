import test from 'node:test';
import assert from 'node:assert/strict';
import {internalLink} from '../src/shared.mjs';
import {notesLinkMarkdown,notesLinkTargets} from '../src/notes-link.mjs';
import {parseMarkdown} from '../src/markdown.mjs';

const maps={
 gear:new Map([['test-lure',{id:'test-lure',name:'Test Lure'}]]),
 kb:new Map([['test-lake',{id:'test-lake',name:'Test Lake'}]]),
 catches:new Map([['test-catch',{id:'test-catch',date:'2026-10-02'}]]),
};
const owner='Gear/Lures/content/test-lure.md';

test('WP1-LINK01 picker includes fixed site pages and Gear/KB, never individual Catches',()=>{
 const targets=notesLinkTargets(maps);
 assert.deepEqual(targets.filter(t=>t.group==='Navigation').map(t=>t.uri).sort(),
  ['site://catches','site://gear','site://home','site://kb']);
 assert(targets.some(t=>t.uri==='gear://test-lure'));
 assert(targets.some(t=>t.uri==='kb://test-lake'));
 assert(!targets.some(t=>t.uri.startsWith('catches://')));
});

test('WP1-LINK02 fixed site links resolve to the four approved in-app routes',()=>{
 const routes={
  'site://home':'#/','site://gear':'#/inventory',
  'site://kb':'#/kb','site://catches':'#/catches',
 };
 for(const [uri,route] of Object.entries(routes)){
  assert.equal(internalLink(uri,maps),route);
  const markdown=notesLinkMarkdown('Navigation',uri,maps);
  const parsed=parseMarkdown(markdown,{owner,maps});
  assert.equal(parsed.references.length,1);
  assert.equal(parsed.references[0].target,route);
  assert.equal(parsed.references[0].kind,'internal');
 }
});

test('WP1-LINK03 picker Gear/KB and manually authored Catch links resolve and preserve IDs',()=>{
 for(const [uri,route] of [
  ['gear://test-lure','#/inventory/item/test-lure'],
  ['kb://test-lake','#/kb/test-lake'],
  ['catches://test-catch','#/catches/test-catch'],
 ]){
  assert.equal(internalLink(uri,maps),route);
  const markdown=notesLinkMarkdown('Reference',uri,maps);
  assert.equal(parseMarkdown(markdown,{owner,maps}).references[0].target,route);
 }
});

test('WP1-LINK04 arbitrary pages, retired records and unsafe URLs fail closed',()=>{
 for(const target of [
  'site://unknown','site://home/extra','catches://removed',
  'gear://missing','kb://missing','catches://../secret',
  'javascript:alert(1)','https://user:secret@example.org/','file:///tmp/x',
 ]){
  assert.throws(()=>notesLinkMarkdown('Blocked',target,maps));
 }
 assert.throws(()=>parseMarkdown('[Missing](catches://removed)',{owner,maps}));
 const ordinary=notesLinkMarkdown('Fishing', 'https://example.org/guide',maps);
 assert.equal(ordinary,'[Fishing](https://example.org/guide)');
 assert.equal(parseMarkdown(ordinary,{owner,maps}).references[0].kind,'external');
});
