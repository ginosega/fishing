import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6DirectGearWorker} from '../server/d6-direct-gear-worker.mjs';
import {createD6DirectKBClient} from '../src/d6-direct-kb-client.mjs';
import {createD6DirectKBService} from '../server/d6-direct-kb-service.mjs';

const origin='https://fishing-d6-wp2-test.ginosega.workers.dev';
const cookie='__Host-fish_p0_session='+'A'.repeat(43);
const entry=i=>({id:'location-kb-test-'+i,type:'location',
 name:'Test lake '+i,content:'KB/Locations/content/lake-'+i+'.md'});
function harness(size=60){
 const rows=new Map(Array.from({length:size},(_,i)=>[entry(i).id,{
  id:entry(i).id,revision:1,record_json:JSON.stringify(entry(i)),
  content_text:'Original lake notes '+i,updated_at:1000000,
 }]));
 let writes=0;
 const WP3_DB={prepare(sql){
  if(sql==='SELECT id,revision,record_json,content_text FROM d6_kb_records ORDER BY id')
   return {all:async()=>({results:[...rows.values()].map(r=>({...r}))})};
  return {bind(...args){
   if(sql.startsWith('SELECT id,revision,record_json,content_text'))
    return {first:async()=>({...rows.get(args[0])})};
   if(sql.startsWith('UPDATE d6_kb_records'))
    return {run:async()=>{
     const row=rows.get(args[3]);
     if(!row||row.revision!==args[4])return {success:true,meta:{changes:0}};
     rows.set(args[3],{id:args[3],revision:row.revision+1,
      record_json:args[0],content_text:args[1],updated_at:args[2]});
     writes++;
     return {success:true,meta:{changes:1}};
    }};
   throw Error('Unexpected KB SQL: '+sql);
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
  D6_PRODUCTION_ENABLED:'true',D6_GATEWAY_ENABLED:'true',
  D6_SESSION_ENABLED:'true',D6_WP2_STAGING_ENABLED:'true',
  D6_ISOLATED_PAGES_ENABLED:'true',D6_ORIGIN:origin,
  D6_OWNER_GITHUB_ID:'265665562',D6_REPOSITORY_ID:'1350909744',
  D6_CSRF_KEY:'S'.repeat(64),WP3_DB,AUTH_DB,
 };
 const worker=createD6DirectGearWorker({
  now:()=>1000000,network:async()=>{throw Error('No GitHub access allowed');},
 });
 const request=(url,options={})=>{
  const headers=new Headers(options.headers);
  headers.set('Sec-Fetch-Site','same-origin');
  headers.set('Cookie',cookie);
  if(options.method==='POST')headers.set('Origin',origin);
  return worker.fetch(new Request(url,{...options,headers}),env);
 };
 const client=createD6DirectKBClient({root:origin+'/fishing/',
  request,enabled:()=>true,online:()=>true});
 return {client,request,worker,env,WP3_DB,AUTH_DB,writes:()=>writes,rows};
}

test('V3-KB-DIRECT01 full 60-row collection, anonymous read and owner Save/reload',async()=>{
 const h=harness(),items=await h.client.list();
 assert.equal(items.length,60);
 assert.equal(new Set(items.map(x=>x.id)).size,60);
 const original=await h.client.read('location-kb-test-4');
 assert.equal(original.revision,1);
 assert.equal(original.markdown,'Original lake notes 4');
 const saved=await h.client.save({record:{...original.record,
  description:'Revised lake description'},markdown:'New \n\n ## markdown',
  expectedRevision:1});
 assert.equal(saved.revision,2);
 assert.equal(saved.record.description,'Revised lake description');
 assert.equal(saved.markdown,'New \n\n ## markdown');
 assert.deepEqual(await h.client.read('location-kb-test-4'),saved);
 assert.equal(h.writes(),1);
 await assert.rejects(h.client.save({record:original.record,
  markdown:'stale',expectedRevision:1}),e=>e.code==='CONFLICT');
 assert.equal(h.writes(),1);
 const anonymous=await h.worker.fetch(new Request(
  origin+'/api/v3/content/kb/location-kb-test-4'),h.env);
 assert.equal(anonymous.status,200);
 assert.equal((await anonymous.json()).revision,2);
});
test('V3-KB-DIRECT02 absent, incomplete, malformed or duplicate rows fail closed',async()=>{
 const short=harness(59);
 await assert.rejects(short.client.list(),e=>e.code==='UNAVAILABLE');
 const h=harness();
 h.rows.set('location-kb-test-0',{...h.rows.get('location-kb-test-0'),
  record_json:'not json'});
 assert.equal((await h.worker.fetch(new Request(origin+'/api/v3/content/kb'),h.env)).status,503);
 assert.equal(h.writes(),0);
});
test('V3-KB-DIRECT03 rejects unauthorized Save, bad CSRF, wrong origin and invalid record',async()=>{
 const h=harness(),url=origin+'/api/v3/content/kb/location-kb-test-0';
 const payload=JSON.stringify({record:entry(0),markdown:'New notes',expectedRevision:1});
 const send=(headers)=>h.worker.fetch(new Request(url,{method:'POST',headers,
  body:payload}),h.env);
 assert.equal((await send({'Content-Type':'application/json',
  Origin:origin,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'save-kb'})).status,403);
 assert.equal((await send({'Content-Type':'application/json',
  Origin:origin,'Sec-Fetch-Site':'cross-site',Cookie:cookie,
  'X-Fish-V3-Intent':'save-kb'})).status,403);
 assert.equal((await send({'Content-Type':'application/json',
  Origin:origin,'Sec-Fetch-Site':'same-origin',Cookie:cookie,
  'X-Fish-V3-Intent':'save-gear','X-Fish-V3-CSRF':'A'.repeat(43)})).status,403);
 const csrf=await h.request(origin+'/api/v3/content/kb-csrf',{
  method:'GET',headers:{'X-Fish-V3-Intent':'kb-csrf'}});
 assert.equal(csrf.status,200);
 const token=(await csrf.json()).csrfToken;
 assert.equal((await send({'Content-Type':'application/json',
  Origin:origin,'Sec-Fetch-Site':'same-origin',Cookie:cookie,
  'X-Fish-V3-Intent':'save-kb','X-Fish-V3-CSRF':token})).status,200);
 const invalid=await h.worker.fetch(new Request(url,{method:'POST',headers:{
  'Content-Type':'application/json',Origin:origin,
  'Sec-Fetch-Site':'same-origin',Cookie:cookie,
  'X-Fish-V3-Intent':'save-kb','X-Fish-V3-CSRF':token,
 },body:JSON.stringify({record:{...entry(0),bad:true},markdown:'New',expectedRevision:2})}),h.env);
 assert.equal(invalid.status,400);
 assert.equal(h.writes(),1);
 assert.equal((await h.worker.fetch(new Request('https://elsewhere.invalid/api/v3/content/kb'),h.env)).status,404);
});
test('V3-KB-DIRECT04 separate KB feature flag defaults OFF, other routes unchanged',async()=>{
 const h=harness();
 const url=origin+'/api/v3/content/kb';
 assert.equal((await h.worker.fetch(new Request(url),{
  ...h.env,D6_DIRECT_KB_ENABLED:'false'})).status,503);
 assert.equal((await h.worker.fetch(new Request(url,{method:'POST',body:'{}'}),h.env)).status,405);
 assert.equal((await h.worker.fetch(new Request(
  origin+'/api/v3/content/gear/location-kb-test-0'),h.env)).status,404);
 const disabled=createD6DirectKBService({
  origin,csrfKey:'S'.repeat(64),AUTH_DB:h.AUTH_DB,CONTENT_DB:h.WP3_DB,
 });
 assert.equal((await disabled.handle(new Request(url))).status,503);
 assert.equal(h.writes(),0);
});
