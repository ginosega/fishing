import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD6DirectGearWorker} from '../server/d6-direct-gear-worker.mjs';
import {createD6DirectGearClient} from '../src/d6-direct-gear-client.mjs';

const origin='https://fishing-d6-wp2-test.ginosega.workers.dev';
const cookie='__Host-fish_p0_session='+'A'.repeat(43);
const original={id:'test-rod',category:'rods-reels',type:'Spinning rod',
 name:'Original rod',specifications:[],links:[]};

function pilot(host=origin){
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
  D6_PRODUCTION_ENABLED:'true',D6_SESSION_ENABLED:'true',D6_ORIGIN:host,
  D6_OWNER_GITHUB_ID:'265665562',
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
  if(options.method==='POST')headers.set('Origin',host);
  return worker.fetch(new Request(url,{...options,headers}),env);
 };
 return {env,worker,client:createD6DirectGearClient({
  root:host+'/fishing/',request,enabled:()=>true,online:()=>true,
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

test('A01 final Worker has only owner auth, no legacy reader or publisher',async()=>{
 const {env,worker}=pilot();
 const source=readFileSync(new URL('../server/d6-direct-gear-worker.mjs',
  import.meta.url),'utf8');
 assert.match(source,/createD6OwnerAuth/);
 assert.doesNotMatch(source,/createD6ProductionRuntimeBindingContract/);
 const auth=readFileSync(new URL('../server/d6-owner-auth.mjs',
  import.meta.url),'utf8');
 assert.doesNotMatch(auth,/createD6ProductionRead|createD6PublicReadProxy|createD6ProductionAppSigner/);
 const enabled={...env,D6_STATIC_ENABLED:'true',D6_SOURCE_ENABLED:'true',
  D6_READ_TOKEN_ENABLED:'true',D6_SIGNER_ENABLED:'true',
  D6_HOSTED_PREFLIGHT_ENABLED:'true'};
 for(const path of ['/api/v3/authoring-source','/api/v3/operations',
  '/fishing/release.json','/session/revoke-all']){
  assert.equal((await worker.fetch(new Request(origin+path),enabled)).status,404);
 }
 const status=await worker.fetch(new Request(origin+'/session',{
  headers:{Cookie:cookie,'Sec-Fetch-Site':'same-origin'},
 }),enabled);
 assert.equal(status.status,200);
 assert.deepEqual(await status.json(),{authenticated:true,authorized:true,ownerLogin:'ginosega'});
 assert.deepEqual(await (await worker.fetch(new Request(origin+'/session'),
  enabled)).json(),{authenticated:false,authorized:false});
 assert.equal((await worker.fetch(new Request(origin+'/session',{
  headers:{Origin:'https://evil.invalid'},
 }),enabled)).status,403);
 assert.equal((await worker.fetch(new Request(origin+'/auth/start'),enabled)).status,503);
});

test('A01 retained Worker OAuth creates a PKCE flow and exact callback',async()=>{
 const {env,worker}=pilot();
 let inserts=0;
 const AUTH_DB={prepare(sql){
  assert.match(sql,/^INSERT INTO auth_flows /);
  return {bind(){return {run:async()=>{inserts++;return {success:true};}};}};
 }};
 const response=await worker.fetch(new Request(origin+'/auth/start'),{
  ...env,AUTH_DB,D6_OAUTH_ENABLED:'true',D6_OAUTH_CLIENT_ID:'test-client-id',
  D6_OAUTH_CLIENT_SECRET:'S'.repeat(32),
 });
 assert.equal(response.status,303);
 const url=new URL(response.headers.get('Location'));
 assert.equal(url.origin,'https://github.com');
 assert.equal(url.pathname,'/login/oauth/authorize');
 assert.equal(url.searchParams.get('redirect_uri'),origin+'/auth/callback');
 assert.equal(url.searchParams.get('code_challenge_method'),'S256');
 assert.equal(inserts,1);
});

test('V3-PILOT03 one existing isolated Worker hosts assets and D1; no public deployment',()=>{
 const cfg=JSON.parse(readFileSync(new URL('../wrangler.l01-private.jsonc',import.meta.url),'utf8'));
 assert.equal(cfg.name,'fishing-d6-wp2-test');
 assert.equal(cfg.keep_vars,true);
 assert.deepEqual(cfg.secrets.required,['D6_CSRF_KEY','D6_OAUTH_CLIENT_SECRET']);
 assert.equal(cfg.main,'./server/d6-direct-gear-worker.mjs');
 assert.equal(cfg.vars.D6_ORIGIN,origin);
 assert.equal(cfg.vars.D6_DIRECT_GEAR_ENABLED,'true');
 assert.equal(cfg.vars.D6_OAUTH_ENABLED,'true');
 for(const name of ['D6_SOURCE_ENABLED','D6_READ_TOKEN_ENABLED','D6_SIGNER_ENABLED'])
  assert.equal(cfg.vars[name],undefined);
 assert.equal(cfg.vars.D6_M02_MEDIA_ENABLED,'true',
  'owner-approved isolated M02 deployment candidate');
 assert.deepEqual(cfg.r2_buckets,[{
  binding:'MEDIA_R2',bucket_name:'fishing-v3-owner-media-test',
 }],'one existing private bucket, no public endpoint or additional storage');
 assert.equal(cfg.workers_dev,true);
 assert.equal(cfg.routes,undefined);
 assert.equal(cfg.assets.base_path,'/fishing');
 assert.equal(cfg.assets.directory,'./dist-v3-pilot');
 assert.deepEqual(cfg.assets.run_worker_first,['/api/*','/auth/*','/session','/session/signout']);
 assert.equal(cfg.d1_databases.length,2);
 assert.deepEqual(cfg.d1_databases.map(x=>x.binding),['AUTH_DB','WP3_DB']);
 assert.equal(cfg.d1_databases[0].database_id,'0d8da698-87b8-4b5e-a1e7-fe6de49e5afc');
 assert.equal(cfg.d1_databases[1].database_id,'5a47841e-7874-4ec8-9fa8-be0315f6a802');

});


test('M02 Worker default-OFF denies private media routes without R2/flag',async()=>{
 const {env,worker}=pilot();
 const names=[
  '/api/v3/media/manifest','/api/v3/media/stage',
  '/api/v3/media/publish','/api/v3/media/live/Gear/Lures/assets/a.png',
 ];
 for(const suffix of names){
  const call=await worker.fetch(new Request(origin+suffix),env);
  assert.equal(call.status,503,suffix+' must remain OFF');
 }
 let calls=0;
 const fakeR2={
  head:async()=>{calls++;return null;},
  get:async()=>{calls++;return null;},
  put:async()=>{calls++;return null;},
 };
 const bound={...env,MEDIA_R2:fakeR2,WP3_DB:{...env.WP3_DB,
  batch:async()=>[]}};
 assert.equal((await worker.fetch(new Request(origin+names[0]),bound)).status,503,
  'R2 binding alone cannot enable media');
 assert.equal(calls,0);
 // This is a source-only configured mock, not any real Cloudflare binding.
 const opted={...bound,D6_M02_MEDIA_ENABLED:'true',
  D6_DIRECT_KB_ENABLED:'true',D6_DIRECT_CATCH_ENABLED:'true'};
 const result=await worker.fetch(new Request(origin+names[0]),opted);
 assert.equal(result.status,503,
  'anonymous registry read reaches D1; incomplete mock fails closed');
 assert.equal((await worker.fetch(new Request(origin+names[1]),opted)).status,405,
  'stage is POST only');
 assert.equal(calls,0,'no R2 access for unauthorized requests');
});

test('O02-HTTP05 existing Worker denies new route without BOTH private gates',async()=>{
 const {env,worker}=pilot();
 const route=origin+'/api/v3/content/offline-snapshot';
 assert.equal((await worker.fetch(new Request(route),env)).status,503);
 const R2={head:async()=>null,get:async()=>null,put:async()=>null};
 const bound={...env,WP3_DB:{...env.WP3_DB,batch:async()=>[]},
  MEDIA_R2:R2,D6_DIRECT_KB_ENABLED:'true',
  D6_DIRECT_CATCH_ENABLED:'true',D6_M02_MEDIA_ENABLED:'true'};
 assert.equal((await worker.fetch(new Request(route),bound)).status,503);
 const opt={...bound,D6_O02_OFFLINE_SNAPSHOT_ENABLED:'true'};
 assert.equal((await worker.fetch(new Request(route),opt)).status,503,
  'anonymous snapshot read reaches D1; incomplete mock fails closed');
 assert.equal((await worker.fetch(new Request(route+'?id=1'),opt)).status,404);
 const cfg=JSON.parse(readFileSync(new URL(
  '../wrangler.l01-private.jsonc',import.meta.url),'utf8'));
 assert.equal(cfg.vars.D6_O02_OFFLINE_SNAPSHOT_ENABLED,'true');
});

test('A01 production host uses identical owner-authenticated content and OAuth; mismatched hosts are denied',async()=>{
 const host='https://fishing.ginosega.workers.dev';
 const {env,worker,client,writes}=pilot(host);
 assert.equal((await client.read('test-rod')).record.name,'Original rod');
 await client.save({record:{...original,name:'Production fixture'},notes:'Fixture',expectedRevision:1});
 assert.equal(writes(),1);
 assert.equal((await client.read('test-rod')).record.name,'Production fixture');
 assert.equal((await worker.fetch(new Request(origin+'/session'),env)).status,404);
 assert.equal((await worker.fetch(new Request(host+'/session'),{...env,D6_ORIGIN:'https://evil.invalid'})).status,404);
 const session=await worker.fetch(new Request(host+'/session',{headers:{Cookie:cookie,'Sec-Fetch-Site':'same-origin'}}),env);
 assert.deepEqual(await session.json(),{authenticated:true,authorized:true,ownerLogin:'ginosega'});
 let inserts=0;
 const AUTH_DB={prepare(sql){assert.match(sql,/^INSERT INTO auth_flows /);return {bind(){return {run:async()=>{inserts++;return {success:true};}};}};}};
 const response=await worker.fetch(new Request(host+'/auth/start'),{...env,AUTH_DB,D6_OAUTH_ENABLED:'true',D6_OAUTH_CLIENT_ID:'test-client-id',D6_OAUTH_CLIENT_SECRET:'S'.repeat(32)});
 assert.equal(response.status,303);
 assert.equal(new URL(response.headers.get('Location')).searchParams.get('redirect_uri'),host+'/auth/callback');
 assert.equal(inserts,1);
 const bound={...env,WP3_DB:{...env.WP3_DB,batch:async()=>[]},
  MEDIA_R2:{head:async()=>null,get:async()=>null,put:async()=>null},
  D6_DIRECT_KB_ENABLED:'true',D6_DIRECT_CATCH_ENABLED:'true',
  D6_M02_MEDIA_ENABLED:'true',D6_O02_OFFLINE_SNAPSHOT_ENABLED:'true'};
 for(const path of ['/api/v3/media/manifest','/api/v3/content/offline-snapshot'])
  assert.equal((await worker.fetch(new Request(host+path),bound)).status,503,
   'anonymous reads reach D1 on production host; incomplete fixture fails closed');
});
