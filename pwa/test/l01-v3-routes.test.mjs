import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRoute,routeFor,rootRoute,categoryRoute,addRoute,editRoute} from '../src/v3-routes.mjs';
import {D6_NORMALIZED_IDS} from '../src/d6-normalized-id-ledger.mjs';
// Exercise every retained canonical identity without frozen fishing files.
const types={location:'locations',species:'species',equipment:'gear-guides',technique:'techniques',knot:'knots'};
const categories=['rods-reels','line','weights','snaps-swivels','hooks','lures','bait','equipment','custom-category'];
const data={
 gear:D6_NORMALIZED_IDS.gear.map((id,i)=>({id,category:categories[i%categories.length]})),
 kb:D6_NORMALIZED_IDS.kb.map((id,i)=>({id,type:Object.values(types)[i%5]})),
 catches:D6_NORMALIZED_IDS.catches.map(id=>({id})),
};
test('L01 all 172 retained canonical IDs have unique detail/edit routes',()=>{
 const paths=new Set();
 for(const [domain,records] of Object.entries(data)){
  const normalized=records;
  assert.deepEqual(normalized.map(r=>r.id).sort(),[...D6_NORMALIZED_IDS[domain]].sort());
  for(const record of normalized){
   const url=routeFor(domain,record);
   assert(!paths.has(url),url);paths.add(url);
   const page=domain==='catches'?'catch':domain;
   const category=domain==='gear'?{category:record.category}:domain==='kb'?{type:record.type}:{};
   assert.deepEqual(parseRoute(url),{page:page+'-detail',id:record.id,...category});
   assert.deepEqual(parseRoute(editRoute(domain,record)),{page:page+'-edit',id:record.id,...category});
   assert.deepEqual(parseRoute(url+'?section=fishing-tips'),{page:page+'-detail',id:record.id,...category,section:'fishing-tips'});
   assert.equal(routeFor(domain,{...record,name:'Renamed'}),url);
   assert.equal(url.split('/').at(-1),record.id);
  }
 }
 assert.equal(paths.size,172);
});
test('L01 direct canonical root, category and add URLs',()=>{
 for(const domain of ['gear','kb','catches'])assert.equal(rootRoute(domain),'#/'+domain);
 for(const [domain,keys] of [['gear',['rods-reels','line','weights','snaps-swivels','hooks','lures','bait','equipment','custom-category']],['kb',Object.values(types)]]){
  for(const key of keys){
   const category=domain==='gear'?{category:key}:{type:key};
   assert.equal(categoryRoute(domain,key),'#/'+domain+'/'+key);
   assert.deepEqual(parseRoute(categoryRoute(domain,key)),{page:domain+'-list',...category});
   assert.deepEqual(parseRoute(addRoute(domain,key)),{page:domain+'-add',...category});
  }
 }
 assert.equal(routeFor('kb',{id:'fishing-line',type:'gear-guides'}),'#/kb/gear-guides/fishing-line');
 assert.equal(routeFor('kb',{id:'palomar-knot',type:'knots'}),'#/kb/knots/palomar-knot');
 assert.equal(routeFor('catches',{id:'2026-07-27-silver-lake-largemouth-01'}),'#/catches/2026-07-27-silver-lake-largemouth-01');
 assert.deepEqual(parseRoute(addRoute('catches')),{page:'catch-add'});
});
test('L01 reserved IDs rejected without aliasing unrelated IDs',()=>{
 for(const id of ['add','edit'])for(const domain of ['gear','kb','catches'])
  assert.throws(()=>routeFor(domain,{id,category:'equipment',type:'gear-guides'}));
 for(const id of ['id','id-edit','fishing-line','technique-fishing-line']){
  const record={id,type:'gear-guides'};
  assert.equal(routeFor('kb',record),'#/kb/gear-guides/'+id);
  assert.equal(parseRoute(routeFor('kb',record)).id,id);
 }
});
test('L01 rejects obsolete route grammar and malformed segments',()=>{
 for(const url of ['#/inventory','#/inventory/item/daiwa-tatula-xt-rod',
  '#/kb/category/equipment','#/kb/type/technique','#/kb/technique-fishing-line',
  '#/kb/technique/ned-rig','#/catch-log','#/gear/lures/a%2Fb',
  '#/gear//lures','#/kb/gear-guides/fishing-line/extra/edit'])
  assert.deepEqual(parseRoute(url),{page:'missing'},url);
});
