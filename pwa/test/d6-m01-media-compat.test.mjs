import assert from 'node:assert/strict';
import test from 'node:test';
import {d6HistoricalMarkdownLinked,d6ReadableMediaRole}
 from '../src/d6-historical-media-link.mjs';
import {D6_MEDIA_SCHEMA_SQL} from '../tools/d6-media-schema.mjs';
test('V2 Catch Markdown relative picture resolves without record edits',()=>{
 const path='Catches/content/catch-2026-09-24-banks-lake-largemouth-01.jpg';
 const owner='Catches/content/catch-2026-09-24-banks-lake-largemouth-01.md';
 const md='![Largemouth Bass - Banks Lake](./catch-2026-09-24-banks-lake-largemouth-01.jpg)';
 assert.equal(d6HistoricalMarkdownLinked(md,path,owner),true);
 assert.equal(d6ReadableMediaRole({domain:'catches',
  record:{notes:owner},logicalPath:path,markdown:md,allowLegacy:true}),'notes');
 assert.equal(d6HistoricalMarkdownLinked(''+
  '\`![x](./catch-2026-09-24-banks-lake-largemouth-01.jpg)\`',
  path,owner),false);
});
test('KB cross-domain historical Gear covers remain valid',()=>{
 assert.equal(d6ReadableMediaRole({domain:'kb',
  record:{type:'technique',
   picture:{src:'Gear/Lures/assets/zman-original-chatterbait.webp'}},
  logicalPath:'Gear/Lures/assets/zman-original-chatterbait.webp',
  markdown:'',allowLegacy:true}),'cover');
});
test('old KB article links and Knot ordering can remain unchanged',()=>{
 assert.equal(d6ReadableMediaRole({domain:'kb',
  record:{type:'knot',picture:{src:'KB/Knots/assets/old-final.png'},
   pictureSequence:['KB/Knots/assets/old-first.png',
    'KB/Knots/assets/old-final.png']},
   logicalPath:'KB/Knots/assets/old-first.png',markdown:'',allowLegacy:true}),'knot-step');
 assert.equal(d6HistoricalMarkdownLinked('![photo](../assets/map.png)',
  'KB/Locations/assets/map.png',
  'KB/Locations/content/lake.md'),true);
});
test('unapproved legacy paths never bypass strict new-V3 Knot rules',()=>{
 assert.equal(d6ReadableMediaRole({domain:'kb',
  record:{type:'knot',picture:{src:'KB/Knots/assets/old-final.png'},
   pictureSequence:['KB/Knots/assets/old-first.png','KB/Knots/assets/old-final.png']},
  logicalPath:'KB/Knots/assets/old-first.png',markdown:''}),null);
});
test('shared references are keyed by image path and each record; same path cannot change hash',()=>{
 assert.match(D6_MEDIA_SCHEMA_SQL,
  /PRIMARY KEY\(logical_path,domain,record_id\)/);
 assert.match(D6_MEDIA_SCHEMA_SQL,/CREATE TRIGGER.*d6_media_same_path_sha/);
});
