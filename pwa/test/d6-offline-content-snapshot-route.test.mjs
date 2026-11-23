import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6OfflineContentSnapshotRoute}
 from '../server/d6-offline-content-snapshot-route.mjs';

const origin='https://fishing-d6-wp2-test.ginosega.workers.dev';
const endpoint=origin+'/api/v3/content/offline-snapshot';
const cookie='__Host-fish_p0_session='+'A'.repeat(43);
const owner=headers=>new Request(endpoint,{
 method:'GET',headers:{Cookie:cookie,'Sec-Fetch-Site':'same-origin',...headers},
});
function fixture(enabled=true){
 let reads=0,authReads=0;
 const AUTH_DB={prepare(){return {bind(){return {first:async()=>{
  authReads++;
  return {github_id:265665562,expires_at:1003600};
 }};}};}};
 const CONTENT_DB={prepare(){return {};},batch:async()=>{reads++;return [];}};
 const snapshot={format:'fishing-content-snapshot-v1',
  mediaVerification:'registry-only',contentId:'a'.repeat(64),
  records:[],images:[]};
 const route=createD6OfflineContentSnapshotRoute({
  AUTH_DB,CONTENT_DB,csrfKey:'S'.repeat(64),origin,
  now:()=>1000000,enabled:()=>enabled,
  snapshotFactory:async({CONTENT_DB:db})=>{
   assert.equal(db,CONTENT_DB);reads++;return snapshot;
  },
 });
 return {route,reads:()=>reads,authReads:()=>authReads,snapshot};
}

test('O02-HTTP01 disabled-by-default and strict paths never touch D1',async()=>{
 const f=fixture(false);
 assert.equal((await f.route.handle(owner())).status,503);
 assert.equal((await f.route.handle(new Request(endpoint+'?x=1'))).status,404);
 assert.equal((await f.route.handle(new Request(endpoint.replace(
  origin,'https://untrusted.example')))).status,404);
 assert.equal((await f.route.handle(new Request(endpoint,{
  headers:{Authorization:'Bearer fake'},
 }))).status,404);
 assert.equal(f.reads(),0);
 assert.equal(f.authReads(),0);
});

test('O02-HTTP02 owner cookie and same-origin GET are mandatory',async()=>{
 const f=fixture();
 assert.equal((await f.route.handle(new Request(endpoint))).status,403);
 assert.equal((await f.route.handle(owner({
  'Sec-Fetch-Site':'cross-site',
 }))).status,403);
 assert.equal((await f.route.handle(new Request(endpoint,{
  method:'POST',headers:{Cookie:cookie,'Sec-Fetch-Site':'same-origin'},
 }))).status,405);
 assert.equal(f.reads(),0);
});

test('O02-HTTP03 authorized GET returns only private immutable read metadata',async()=>{
 const f=fixture();
 const response=await f.route.handle(owner());
 assert.equal(response.status,200);
 assert.match(response.headers.get('Content-Type'),/^application\/json/);
 assert.equal(response.headers.get('Cache-Control'),
  'private, no-store, max-age=0');
 assert.equal(response.headers.get('Vary'),'Cookie');
 assert.deepEqual(await response.json(),{
  ok:true,version:1,snapshot:f.snapshot,
 });
 assert.equal(f.reads(),1);
 assert.equal((await f.route.handle(owner())).status,200);
 assert.equal(f.reads(),2);
});

test('O02-HTTP04 unverified manifest, read failure and overlarge response deny',async()=>{
 const AUTH_DB={prepare(){return {bind(){return {first:async()=>({
  github_id:265665562,expires_at:1003600,
 })};}};}};
 const CONTENT_DB={prepare(){return {};},batch:async()=>[]};
 const make=f=>createD6OfflineContentSnapshotRoute({
  AUTH_DB,CONTENT_DB,csrfKey:'S'.repeat(64),origin,
  now:()=>1000000,enabled:()=>true,snapshotFactory:f,
 });
 assert.equal((await make(async()=>{throw Error('D1 unavailable');})
  .handle(owner())).status,503);
 assert.equal((await make(async()=>({format:'other'}))
  .handle(owner())).status,503);
 assert.equal((await make(async()=>({
  format:'fishing-content-snapshot-v1',
  mediaVerification:'registry-only',markdown:'x'.repeat(9*1024*1024),
 })).handle(owner())).status,503);
});
