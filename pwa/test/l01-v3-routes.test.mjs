import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseRoute,routeFor,rootRoute,categoryRoute,addRoute,editRoute} from '../src/v3-routes.mjs';
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const data={gear:read('Gear/gear.json').items,kb:read('KB/kb.json').entities,catches:read('Catches/catches.json').catches};
test('L01 every migrated record round-trips through one canonical detail and edit URL',()=>{
 const paths=new Set();
 for(const [domain,records] of Object.entries(data)){
  for(const record of records){
   const url=routeFor(domain,record);
   assert(!paths.has(url),url);paths.add(url);
   const page=domain==='catches'?'catch':domain;
   const category=domain==='gear'?{category:record.category}:domain==='kb'?{type:record.type}:{};
   assert.deepEqual(parseRoute(url),{page:page+'-detail',id:record.id,...category});
   assert.deepEqual(parseRoute(editRoute(domain,record)),{page:page+'-edit',id:record.id,...category});
   assert.deepEqual(parseRoute(url+'?section=fishing-tips'),{page:page+'-detail',id:record.id,...category,section:'fishing-tips'});
   assert.equal(routeFor(domain,{...record,name:'Renamed'}),url);
  }
 }
 assert.equal(paths.size,172);
});
test('L01 approved list, detail and add URL vocabulary',()=>{
 assert.equal(rootRoute('gear'),'#/gear');
 assert.equal(rootRoute('kb'),'#/kb');
 assert.equal(rootRoute('catches'),'#/catches');
 for(const [domain,key,slug] of [
  ...['rods-reels','line','weights','snaps-swivels','hooks','lures','bait'].map(x=>['gear',x,x]),
  ['gear','accessories','equipment'],['kb','location','locations'],['kb','species','species'],
  ['kb','equipment','gear-guides'],['kb','technique','techniques'],['kb','knot','knots'],
  ['gear','custom-category','custom-category']]){
  const category=domain==='gear'?{category:key}:{type:key};
  assert.equal(categoryRoute(domain,key),'#/'+domain+'/'+slug);
  assert.deepEqual(parseRoute(categoryRoute(domain,key)),{page:domain+'-list',...category});
  assert.deepEqual(parseRoute(addRoute(domain,key)),{page:domain+'-add',...category});
 }
 assert.equal(routeFor('kb',{id:'technique-fishing-line',type:'equipment'}),'#/kb/gear-guides/fishing-line');
 assert.equal(routeFor('kb',{id:'knot-palomar',type:'knot'}),'#/kb/knots/palomar-knot');
 assert.equal(routeFor('kb',{id:'location-lake-washington',type:'location'}),'#/kb/locations/lake-washington');
 assert.equal(routeFor('catches',{id:'catch-2026-07-27-silver-lake-largemouth-01'}),'#/catches/2026-07-27-silver-lake-largemouth-01');
 assert.deepEqual(parseRoute(addRoute('catches')),{page:'catch-add'});
});
test('L01 reserved and colliding future IDs cannot steal existing routes',()=>{
 const old={id:'technique-fishing-line',type:'equipment'};
 const expected=routeFor('kb',old);
 const cases=[
  ['kb',{id:'fishing-line',type:'equipment'}],
  ['kb',{id:'id-fishing-line',type:'equipment'}],
  ['kb',{id:'add',type:'equipment'}],
  ['gear',{id:'edit',category:'lures'}],
  ['gear',{id:'id-edit',category:'equipment'}],
  ['gear',{id:'item',category:'accessories'}],
  ['catches',{id:'catch-add'}],['catches',{id:'id-add'}],
  ['catches',{id:'catch-id-add'}],
 ];
 const urls=new Set([expected]);
 for(const [domain,record] of cases){
  const url=routeFor(domain,record);
  assert(!urls.has(url));urls.add(url);
  assert.equal(parseRoute(url).id,record.id);
 }
 assert.equal(routeFor('kb',old),expected);
 assert.equal(categoryRoute('gear','equipment'),'#/gear/id-equipment');
 assert.equal(parseRoute('#/gear/id-equipment').category,'equipment');
});
test('L01 standalone rejects retired route grammar and malformed segments',()=>{
 for(const url of ['#/inventory','#/inventory/item/daiwa-tatula-xt-rod',
  '#/kb/category/equipment','#/kb/type/technique','#/kb/technique-fishing-line',
  '#/kb/technique/ned-rig','#/catch-log','#/gear/lures/a%2Fb',
  '#/gear//lures','#/kb/gear-guides/fishing-line/extra/edit'])
  assert.deepEqual(parseRoute(url),{page:'missing'},url);
});
