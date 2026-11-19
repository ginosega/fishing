import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD6DirectGearWorker} from '../server/d6-direct-gear-worker.mjs';
import {createD6DirectGearClient} from '../src/d6-direct-gear-client.mjs';

const origin='https://fishing-d6-wp2-test.ginosega.workers.dev';
const cookie='__Host-fish_p0_session='+'A'.repeat(43);
const original={id:'test-rod',category:'rods-reels',type:'Spinning rod',
 name:'Original rod',specifications:[],links:[]};

function pilot(){
 let writes=0;
 let data={id:original.id,revision:1,record_json:JSON.stringify(original),
  notes_text:'First notes',updated_at:1000000};
 const db={prepare(sql){return {bind(...args){return {
  async first(){
   assert.match(sql,/^SELECT id,revision,record_json,notes_text /);
   return args[0]===data.id?{...data}:null;
  },
  async run(){
   assert.match(sql,/^UPDATE d6_gear_records /);
   if(args[3]!==data.id||args[4]!==data.revision)
    return {success:true,meta:{changes:0}};
   data={id:args[3],revision:data.revision+1,
    record_json:args[0],notes_text:args[1],updated_at:args[2]};
   writes++;
   return {success:true,meta:{changes:1}};
  },
 };}};}};
 const authDb={prepare(){return {bind(){return {first:async()=>({
  github_id:265665562,expires_at:1003600,
 })};}};}};
 const env={D6_DIRECT_GEAR_ENABLED:'true',
  D6_PRODUCTION_ENABLED:'true',D6_GATEWAY_ENABLED:'true',
  D6_SESSION_ENABLED:'true',D6_WP2_STAGING_ENABLED:'true',
  D6_ISOLATED_PAGES_ENABLED:'true',D6_ORIGIN:origin,
  D6_OWNER_GITHUB_ID:'265665562',D6_REPOSITORY_ID:'1350909744',
  D6_CSRF_KEY:'S'.repeat(64),AUTH_DB:authDb,WP3_DB:db,
 };
 const worker=createD6DirectGearWorker({
  network:async()=>{throw Error('No network calls expected for Gear');},
  now:()=>1000000,
 });
 const request=(url,options)=>{
  const headers=new Headers(options.headers);
  headers.set('Sec-Fetch-Site','same-origin');
  headers.set('Cookie',cookie);
  if(options.method==='POST')headers.set('Origin',origin);
  return worker.fetch(new Request(url,{...options,headers}),env);
 };
 return {env,worker,client:createD6DirectGearClient({
  root:origin+'/fishing/',request,enabled:()=>true,online:()=>true,
 }),writes:()=>writes};
}

test('V3-PILOT01 Worker router supports D1 Gear Save and reload without GitHub',async()=>{
 const {client,writes}=pilot();
 assert.equal((await client.read('test-rod')).record.name,'Original rod');
 await client.save({record:{...original,name:'Edited rod'},
  notes:'Updated notes',expectedRevision:1});
 assert.equal((await client.read('test-rod')).record.name,'Edited rod');
 assert.equal((await client.read('test-rod')).notes,'Updated notes');
 await assert.rejects(
  client.save({record:original,notes:'stale',expectedRevision:1}),
  error=>error.code==='CONFLICT');
 assert.equal(writes(),1);
});

test('V3-PILOT02 Worker denies wrong host or disabled direct Gear flag',async()=>{
 const {env,worker}=pilot(),url=origin+'/api/v3/content/gear/test-rod';
 assert.equal((await worker.fetch(new Request(url),{
  ...env,D6_DIRECT_GEAR_ENABLED:'false',
 })).status,503);
 assert.equal((await worker.fetch(new Request(
  'https://other.invalid/api/v3/content/gear/test-rod'),env)).status,404);
 assert.equal((await worker.fetch(new Request(origin+'/api/v3/content/operations'),env)).status,404);
});

test('V3-PILOT03 one existing isolated Worker hosts assets and D1; no public deployment',()=>{
 const cfg=JSON.parse(readFileSync(new URL('../wrangler.direct-gear-private.jsonc',import.meta.url),'utf8'));
 assert.equal(cfg.name,'fishing-d6-wp2-test');
 assert.equal(cfg.main,'./server/d6-direct-gear-worker.mjs');
 assert.equal(cfg.vars.D6_ORIGIN,origin);
 assert.equal(cfg.vars.D6_DIRECT_GEAR_ENABLED,'true');
 assert.equal(cfg.vars.D6_OAUTH_ENABLED,'true');
 for(const name of ['D6_SOURCE_ENABLED','D6_READ_TOKEN_ENABLED','D6_SIGNER_ENABLED'])
  assert.equal(cfg.vars[name],'false');
 assert.equal(cfg.workers_dev,true);
 assert.equal(cfg.routes,undefined);
 assert.equal(cfg.assets.base_path,'/fishing');
 assert.equal(cfg.assets.directory,'./dist-v3-pilot');
 assert.deepEqual(cfg.assets.run_worker_first,['/api/*','/auth/*','/session']);
 assert.equal(cfg.d1_databases.length,2);
 assert.deepEqual(cfg.d1_databases.map(x=>x.binding),['AUTH_DB','WP3_DB']);
 assert.equal(cfg.d1_databases[0].database_id,'0d8da698-87b8-4b5e-a1e7-fe6de49e5afc');
 assert.equal(cfg.d1_databases[1].database_id,'5a47841e-7874-4ec8-9fa8-be0315f6a802');
 const seed=readFileSync(new URL('../migration/d6-direct-gear-pilot-seed.sql',import.meta.url),'utf8');
 assert.match(seed,/INSERT INTO d6_gear_records/);
 assert.match(seed,/daiwa-tatula-xt-rod/);
 assert.match(seed,/ON CONFLICT\(id\) DO NOTHING;/);
 assert.doesNotMatch(seed,/\b(?:UPDATE|DELETE|DROP)\b/i);
});
