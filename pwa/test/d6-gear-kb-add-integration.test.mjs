import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createD6DirectGearService} from '../server/d6-direct-gear-service.mjs';
import {createD6DirectKBService} from '../server/d6-direct-kb-service.mjs';
import {createD2UnifiedOwnerSession}
 from '../../experiments/p3/preview/src/d2-unified-owner-session.mjs';
import {narrativePath} from '../src/handoff.mjs';

const origin='https://fishing-d6-wp2-test.ginosega.workers.dev';
function setup(domain){
 const db=new DatabaseSync(':memory:');
 const gear=domain==='gear',table=gear?'d6_gear_records':'d6_kb_records';
 const field=gear?'notes_text':'content_text',minimum=gear?100:60;
 db.exec('CREATE TABLE '+table+' (id TEXT PRIMARY KEY,revision INTEGER NOT NULL,'+
  'record_json TEXT NOT NULL,'+field+' TEXT NOT NULL,updated_at INTEGER NOT NULL)');
 const seed=db.prepare('INSERT INTO '+table+' (id,revision,record_json,'+field+
  ',updated_at) VALUES(?,1,?,?,?)');
 for(let i=0;i<minimum;i++){
  const record=gear?{id:'gear-seed-'+i,category:'lures',
   type:'Spoons',name:'Lure '+i}:
   {id:'kb-seed-'+i,type:'location',name:'Lake '+i,
    content:'KB/Locations/content/Lake '+i+'.md'};
  seed.run(record.id,JSON.stringify(record),'Seed '+i,1);
 }
 const CONTENT_DB={prepare(sql){return {
  async all(){return {results:db.prepare(sql).all()};},
  bind(...params){return {
   async first(){return db.prepare(sql).get(...params)??null;},
   async run(){const meta=db.prepare(sql).run(...params);
    return {success:true,meta:{changes:Number(meta.changes)}};
   },
  }},
 };}};
 const AUTH_DB={prepare(){return {bind(){return {first:async()=>({
  github_id:265665562,expires_at:1003600,
 })};}};}};
 const csrfKey='S'.repeat(64),now=()=>1000000;
 const session=createD2UnifiedOwnerSession({
  AUTH_DB,csrfKey,now,ownerGitHubId:265665562,origin,
 });
 const service=(gear?createD6DirectGearService:createD6DirectKBService)({
  AUTH_DB,CONTENT_DB,origin,csrfKey,now,enabled:()=>true,
 });
 const cookie='__Host-fish_p0_session='+'A'.repeat(43);
 const fields=gear?'notes':'markdown';
 const record=gear?{id:'new-gear-owner',category:'lures',
  type:'Spoons',name:'New Owner Lure'}:
  {id:'new-kb-owner',type:'species',name:'New Owner Fish'};
 record[gear?'notes':'content']=narrativePath(domain,record);
 const url=origin+'/api/v3/content/'+domain+'/'+record.id;
 const count=()=>db.prepare('SELECT count(*) AS n FROM '+table).get().n;
 const send=async(recordOverride=record,rev=0)=>{
  const csrf=(await session.describe(new Request(origin+'/fishing/',{
   headers:{Cookie:cookie,'Sec-Fetch-Site':'same-origin'},
  }))).csrfToken;
  const response=await service.handle(new Request(url,{
   method:'POST',headers:{Origin:origin,
    Cookie:cookie,'Sec-Fetch-Site':'same-origin',
    'X-Fish-V3-Intent':'save-'+domain,'X-Fish-V3-CSRF':csrf,
    'Content-Type':'application/json'},
   body:JSON.stringify({record:recordOverride,expectedRevision:rev,
    [fields]:'New owner-written notes'}),
  }));
  return response;
 };
 return {service,record,url,count,minimum,send,db,table};
}
for(const domain of ['gear','kb']){
 test('V3 direct Add '+domain+': create, list, collision and edit',async()=>{
  const f=setup(domain);
  assert.equal(f.count(),f.minimum);
  const created=await f.send();
  assert.equal(created.status,200);
  assert.equal((await created.json()).revision,1);
  assert.equal(f.count(),f.minimum+1);
  const list=await f.service.handle(new Request(
   origin+'/api/v3/content/'+domain));
  assert.equal(list.status,200);
  assert.equal((await list.json()).count,f.minimum+1);
  const duplicate=await f.send({...f.record,name:'Overwrite attempted'});
  assert.equal(duplicate.status,409);
  assert.equal(f.count(),f.minimum+1);
  const edited=await f.send({...f.record,name:'Updated after create'},1);
  assert.equal(edited.status,200);
  assert.equal((await edited.json()).revision,2);
  assert.equal(f.count(),f.minimum+1);
  const wrong=await f.send({...f.record,
   [domain==='gear'?'notes':'content']:'Other/content/unsafe.md'});
  assert.equal(wrong.status,400);
  assert.equal(f.count(),f.minimum+1);
 });
}
