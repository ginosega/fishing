import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6DirectGearWorker} from '../server/d6-direct-gear-worker.mjs';
import {createD6DirectCatchClient} from '../src/d6-direct-catch-client.mjs';
import {createD6DirectCatchService} from '../server/d6-direct-catch-service.mjs';

const origin='https://fishing-d6-wp2-test.ginosega.workers.dev';
const cookie='__Host-fish_p0_session='+'A'.repeat(43);
const entry=i=>({id:'catch-test-'+i,date:'2026-11-19',
 notes:'Catches/content/catch-test-'+i+'.md'});
function harness(size=12){
 const rows=new Map(Array.from({length:size},(_,i)=>[entry(i).id,{
  id:entry(i).id,revision:1,record_json:JSON.stringify(entry(i)),
  notes_text:'Original Catch notes '+i,updated_at:1000000,
 }]));
 let writes=0;
 const WP3_DB={prepare(sql){
  if(sql==='SELECT id,revision,record_json,notes_text FROM d6_catch_records ORDER BY id')
   return {all:async()=>({results:[...rows.values()].map(r=>({...r}))})};
  return {bind(...args){
   if(sql.startsWith('SELECT id,revision,record_json,notes_text'))
    return {first:async()=>rows.get(args[0])?{...rows.get(args[0])}:null};
   if(sql.startsWith('SELECT record_json FROM '))
    return {first:async()=>null};
   if(sql.startsWith('UPDATE d6_catch_records'))
    return {run:async()=>{
     const old=rows.get(args[3]);
     if(!old||old.revision!==args[4])
      return {success:true,meta:{changes:0}};
     rows.set(args[3],{id:args[3],revision:old.revision+1,
      record_json:args[0],notes_text:args[1],updated_at:args[2]});
     writes++;return {success:true,meta:{changes:1}};
    }};
   if(sql.startsWith('INSERT INTO d6_catch_records'))
    return {run:async()=>{
     if(rows.has(args[0]))return {success:true,meta:{changes:0}};
     rows.set(args[0],{id:args[0],revision:1,
      record_json:args[1],notes_text:args[2],updated_at:args[3]});
     writes++;return {success:true,meta:{changes:1}};
    }};
   throw Error('Unexpected Catch SQL: '+sql);
  }};
 }};
 const AUTH_DB={prepare(sql){
  assert.match(sql,/FROM sessions/);
  return {bind:()=>({first:async()=>({
   github_id:265665562,expires_at:1003600,
  })})};
 }};
 const env={
  D6_DIRECT_GEAR_ENABLED:'true',D6_DIRECT_KB_ENABLED:'true',
  D6_DIRECT_CATCH_ENABLED:'true',
  D6_PRODUCTION_ENABLED:'true',D6_GATEWAY_ENABLED:'true',
  D6_SESSION_ENABLED:'true',D6_WP2_STAGING_ENABLED:'true',
  D6_ISOLATED_PAGES_ENABLED:'true',D6_ORIGIN:origin,
  D6_OWNER_GITHUB_ID:'265665562',D6_REPOSITORY_ID:'1350909744',
  D6_CSRF_KEY:'S'.repeat(64),WP3_DB,AUTH_DB,
 };
 const worker=createD6DirectGearWorker({now:()=>1000000,
  network:async()=>{throw Error('No external network request permitted');},
 });
 const request=(url,options={})=>{
  const headers=new Headers(options.headers);
  headers.set('Sec-Fetch-Site','same-origin');headers.set('Cookie',cookie);
  if(options.method==='POST')headers.set('Origin',origin);
  return worker.fetch(new Request(url,{...options,headers}),env);
 };
 const client=createD6DirectCatchClient({root:origin+'/fishing/',
  request,enabled:()=>true,online:()=>true});
 return {client,worker,env,request,rows,writes:()=>writes,WP3_DB,AUTH_DB};
}
test('V3-CATCH-DIRECT01 12 original GET rows, Edit/Save/reload and stale 409',async()=>{
 const h=harness();
 assert.equal((await h.client.list()).length,12);
 const original=await h.client.read('catch-test-2');
 assert.equal(original.revision,1);
 const updated=await h.client.save({
  record:{...original.record,size:'14 in'},
  notes:'Original Catch notes 2 with revision',
  expectedRevision:1,
 });
 assert.equal(updated.revision,2);
 assert.equal(updated.record.size,'14 in');
 assert.deepEqual(await h.client.read('catch-test-2'),updated);
 await assert.rejects(h.client.save({record:original.record,
  notes:original.notes,expectedRevision:1}),e=>e.code==='CONFLICT');
 assert.equal(h.writes(),1);
});
test('V3-CATCH-DIRECT02 new owner Catch Add is insert-only and collision safe',async()=>{
 const h=harness(),fresh={id:'catch-new-2026-11-19',date:'2026-11-19',
  notes:'Catches/content/catch-new-2026-11-19.md',
  size:'12 in',locationName:'Synthetic back bay'};
 const saved=await h.client.save({record:fresh,
  notes:'Original owner-written Catch Notes',expectedRevision:0});
 assert.equal(saved.revision,1);
 assert.equal((await h.client.list()).length,13);
 assert.deepEqual((await h.client.read(fresh.id)).record,fresh);
 await assert.rejects(h.client.save({record:fresh,
  notes:'Duplicate',expectedRevision:0}),e=>e.code==='CONFLICT');
 assert.equal(h.writes(),1);
});
test('V3-CATCH-DIRECT03 incomplete, malformed and disabled collections fail closed',async()=>{
 const small=harness(11);
 await assert.rejects(small.client.list(),e=>e.code==='UNAVAILABLE');
 const h=harness();
 h.rows.get('catch-test-1').record_json='invalid';
 assert.equal((await h.worker.fetch(new Request(
  origin+'/api/v3/content/catches'),h.env)).status,503);
 assert.equal((await h.worker.fetch(new Request(
  origin+'/api/v3/content/catches'),{
  ...h.env,D6_DIRECT_CATCH_ENABLED:'false',
 })).status,503);
 const disabled=createD6DirectCatchService({origin,
  csrfKey:'S'.repeat(64),AUTH_DB:h.AUTH_DB,CONTENT_DB:h.WP3_DB});
 assert.equal((await disabled.handle(new Request(
  origin+'/api/v3/content/catches'))).status,503);
 assert.equal(h.writes(),0);
});
test('V3-CATCH-DIRECT04 rejects CSRF, cross-site, invalid link and payload',async()=>{
 const h=harness(),url=origin+'/api/v3/content/catches/catch-test-0';
 const body=JSON.stringify({record:entry(0),notes:'Note',
  expectedRevision:1});
 const send=(headers,data=body)=>h.worker.fetch(new Request(url,{
  method:'POST',headers,body:data,
 }),h.env);
 const headers={'Content-Type':'application/json',Origin:origin,
  'Sec-Fetch-Site':'same-origin',Cookie:cookie,
  'X-Fish-V3-Intent':'save-catch'};
 assert.equal((await send(headers)).status,403);
 assert.equal((await send({...headers,'Sec-Fetch-Site':'cross-site'})).status,403);
 const proof=await h.request(origin+'/api/v3/content/catches-csrf',{
  method:'GET',headers:{'X-Fish-V3-Intent':'catch-csrf'},
 });
 assert.equal(proof.status,200);
 const token=(await proof.json()).csrfToken;
 assert.equal((await send({...headers,'X-Fish-V3-CSRF':token},JSON.stringify({
  record:{...entry(0),speciesId:'unknown-species'},
  notes:'Note',expectedRevision:1,
 }))).status,400);
 assert.equal((await send({...headers,'X-Fish-V3-CSRF':token},JSON.stringify({
  record:{...entry(0),bad:true},
  notes:'Note',expectedRevision:1,
 }))).status,400);
 assert.equal(h.writes(),0);
});
