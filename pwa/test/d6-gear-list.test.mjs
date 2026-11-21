import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD6DirectGearService} from '../server/d6-direct-gear-service.mjs';
import {createD6DirectGearClient} from '../src/d6-direct-gear-client.mjs';

const origin='https://fishing-d6-wp2-test.ginosega.workers.dev';
const item=i=>({id:'test-spoon-'+i,category:'lures',type:'Spoons',
 name:'Test spoon '+i,specifications:[],links:[]});
function harness(rows=Array.from({length:100},(_,i)=>({
 id:'test-spoon-'+i,revision:1,record_json:JSON.stringify(item(i)),
 notes_text:'',updated_at:100,
}))){
 let reads=0,writes=0;
 const contentDB={prepare(sql){
  assert.match(sql,/^SELECT id,revision,record_json,notes_text FROM d6_gear_records ORDER BY id$/);
  return {all:async()=>{reads++;return {results:rows};}};
 }};
 const service=createD6DirectGearService({
  AUTH_DB:{prepare(){throw Error('Anonymous GET must not query authentication');}},
  CONTENT_DB:contentDB,csrfKey:'S'.repeat(64),
  origin,enabled:()=>true,now:()=>1000000,
 });
 const client=createD6DirectGearClient({
  root:origin+'/fishing/',enabled:()=>true,online:()=>true,
  request:(url,options)=>service.handle(new Request(url,options)),
 });
 return {client,service,reads:()=>reads,writes:()=>writes};
}

test('V3-GEAR-LIST01 100 validated D1 Gear items are anonymously readable',async()=>{
 const x=harness(),items=await x.client.list();
 assert.equal(items.length,100);
 assert.equal(items[0].name,'Test spoon 0');
 assert.equal(items[99].id,'test-spoon-99');
 assert.equal(new Set(items.map(r=>r.id)).size,100);
 assert.equal(x.reads(),1);
 assert.equal(x.writes(),0);
 const response=await x.service.handle(new Request(origin+'/api/v3/content/gear'));
 assert.equal(response.status,200);
 assert.equal((await response.json()).count,100);
});

test('V3-GEAR-LIST02 partial, duplicate or corrupt migration fails closed',async()=>{
 for(const rows of [
  Array.from({length:99},(_,i)=>({
   id:'test-spoon-'+i,revision:1,record_json:JSON.stringify(item(i)),
   notes_text:'',
  })),
  Array.from({length:100},(_,i)=>({
   id:'test-spoon-'+(i===99?98:i),revision:1,
   record_json:JSON.stringify(item(i===99?98:i)),notes_text:'',
  })),
  Array.from({length:100},(_,i)=>({
   id:'test-spoon-'+i,revision:1,
   record_json:i===44?'bad-json':JSON.stringify(item(i)),notes_text:'',
  })),
 ]){
  const {client,service}=harness(rows);
  assert.equal((await service.handle(new Request(origin+'/api/v3/content/gear'))).status,503);
  await assert.rejects(()=>client.list(),error=>error.code==='UNAVAILABLE');
 }
});

test('V3-GEAR-LIST03 public collection is read-only and no authorizer is consulted',async()=>{
 const x=harness();
 const url=origin+'/api/v3/content/gear';
 assert.equal((await x.service.handle(new Request(url,{
  method:'POST',body:'{}',
 }))).status,405);
 assert.equal(x.writes(),0);
});

test('V3-GEAR-LIST04 online catalog, offline safeguards and owner-gated Add Gear',()=>{
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/ensureGearCatalog\(\)/);
 assert.match(ui,/ctx\.v3\.directGearClient\.list\(\)/);
 assert.match(ui,/offline\.getMode\(\)!=='Automatic'/);
 assert.match(ui,/ctx\.data=data;ctx\.maps=maps;routes=markdownRouteMap\(data\);gearCatalogReady=true/);
 assert.match(ui,/onDirectGearSaved:\(\)=>\{gearCatalogReady=false;\}/);
 assert.match(ui,/showEditingLinks\(\)\?/);
 assert.match(ui,/requiredIds:frozenGearIds/);
 assert.match(ui,/navigator\.onLine===true&&offline\?\.getModeAvailable\?\.\(\)===true&&/);
});
