import test from 'node:test';
import assert from 'node:assert/strict';
import authWorker from '../src/d2-auth-owner-worker.mjs';
const ORIGIN='https://fishing.example';
function fixture(pilot){
 let inserted=0;
 const env={
  APP_ORIGIN:ORIGIN,GITHUB_CLIENT_ID:'test-public-client-id',
  GITHUB_CLIENT_SECRET:'SERVER_ONLY_TEST',
  OWNER_GITHUB_ID:'265665562',D3_PILOT_ENABLED:pilot?'true':'false',
  DB:{prepare(sql){
   assert.match(sql,/INSERT INTO auth_flows/);
   return {bind(...values){
    assert.equal(values.length,3);
    return {async run(){inserted++;return {success:true}}};
   }};
  }},
 };
 return {env,get inserted(){return inserted;}};
}
test('D3-OA01 pilot OAuth redirect denied BEFORE session write while gate is OFF',async()=>{
 const f=fixture(false);
 const res=await authWorker.fetch(
  new Request(ORIGIN+'/auth/start?return=%2F__d3_pilot__%2F'),f.env);
 assert.equal(res.status,400);
 assert.equal(f.inserted,0);
});
test('D3-OA02 owner pilot OAuth starts only when pilot flag is explicitly ON',async()=>{
 const f=fixture(true);
 const res=await authWorker.fetch(
  new Request(ORIGIN+'/auth/start?return=%2F__d3_pilot__%2F'),f.env);
 assert.equal(res.status,303);
 assert.equal(f.inserted,1);
 const dest=new URL(res.headers.get('location'));
 assert.equal(dest.origin,'https://github.com');
 assert.equal(dest.pathname,'/login/oauth/authorize');
 assert.match(dest.searchParams.get('state'),/^[A-Za-z0-9_-]{43}\.p$/);
 assert.equal(dest.searchParams.get('redirect_uri'),ORIGIN+'/auth/callback');
 assert(res.headers.get('set-cookie').includes('.p'));
});
test('D3-OA03 a previously started pilot OAuth callback is rejected if gate goes OFF',async()=>{
 const f=fixture(false);
 const state='a'.repeat(43)+'.p';
 const res=await authWorker.fetch(new Request(
  ORIGIN+'/auth/callback?state='+state+'&code=never-exchange',
  {headers:{Cookie:'__Host-fish_p0_flow='+state}}),f.env);
 assert.equal(res.status,400);
 assert.equal(f.inserted,0);
});
test('D3-OA04 arbitrary destinations never enter the OAuth transaction',async()=>{
 const f=fixture(true);
 for(const destination of ['https://attacker.example','//attacker.example',
  '/__d3_pilot__/pilot.js','/fishing/../admin','/auth/callback']){
  const url=ORIGIN+'/auth/start?return='+encodeURIComponent(destination);
  const res=await authWorker.fetch(new Request(url),f.env);
  assert.equal(res.status,400);
 }
 assert.equal(f.inserted,0);
});
