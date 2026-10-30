import test from 'node:test';
import assert from 'node:assert/strict';
import {createD2UnifiedOwnerSession,D2SessionError}
 from '../src/d2-unified-owner-session.mjs';

const ORIGIN='https://fishing.example',OWNER=265665562;
const TOKEN='a'.repeat(43),NOW=1800000000;
let queries=0;
function fixture({authenticated=true,owner=OWNER}={}){
 const db={prepare(sql){
  assert.match(sql,/^SELECT github_id,expires_at FROM sessions/);
  return {bind(tokenHash,when){
   assert.match(tokenHash,/^[A-Za-z0-9_-]{43}$/);
   assert.equal(when,NOW);
   return {async first(){
    queries++;
    return authenticated?{github_id:owner,expires_at:NOW+240}:null;
   }};
  }};
 }};
 return createD2UnifiedOwnerSession({
  AUTH_DB:db,ownerGitHubId:OWNER,
  origin:ORIGIN,csrfKey:'s'.repeat(48),now:()=>NOW,
 });
}
function request(path,{site='cross-site',mode='navigate',dest='document',
 method='GET',cookie=true}={}){
 return new Request(ORIGIN+path,{method,headers:{
  ...(cookie?{Cookie:'__Host-fish_p0_session='+TOKEN}:{}),
  'Sec-Fetch-Site':site,'Sec-Fetch-Mode':mode,
  'Sec-Fetch-Dest':dest,
 }});
}
const denied=code=>e=>e instanceof D2SessionError&&e.code===code;

test('D3-OAUTHNAV01 OAuth cross-site redirect permits exact authenticated pilot document',async()=>{
 const session=fixture();
 const result=await session.authorizePilotPage(request('/__d3_pilot__/'));
 assert.deepEqual(result,{ownerGitHubId:OWNER,authorized:true});
 assert.equal(queries,1);
});
test('D3-OAUTHNAV02 ordinary owner status/source cannot accept cross-site requests',async()=>{
 const session=fixture();
 await assert.rejects(session.authorizeStatus(request('/api/v3/authoring-source')),
  denied('CROSS_SITE_DENIED'));
 await assert.rejects(session.describe(request('/session')),
  denied('CROSS_SITE_DENIED'));
 assert.equal(queries,1);
});
test('D3-OAUTHNAV03 pilot JS is never cross-site-authorized, even with a cookie',async()=>{
 const session=fixture();
 await assert.rejects(session.authorizeStatus(request('/__d3_pilot__/pilot.js')),
  denied('CROSS_SITE_DENIED'));
 await assert.rejects(session.authorizePilotPage(request('/__d3_pilot__/pilot.js')),
  denied('CROSS_SITE_DENIED'));
});
test('D3-OAUTHNAV04 no cross-site fetch or malformed navigation gets pilot exception',async()=>{
 const session=fixture();
 for(const options of [
  {site:'cross-site',mode:'cors',dest:'empty'},
  {site:'same-site',mode:'no-cors',dest:'document'},
  {site:'cross-site',mode:'navigate',dest:'empty'},
 ]){
  await assert.rejects(session.authorizePilotPage(
    request('/__d3_pilot__/',options)),denied('CROSS_SITE_DENIED'));
 }
});
test('D3-OAUTHNAV05 OAuth-style navigation still requires unexpired owner session',async()=>{
 for(const opts of [{authenticated:false},{owner:OWNER+1}]){
  const session=fixture(opts);
  await assert.rejects(session.authorizePilotPage(request('/__d3_pilot__/')),
   denied('SESSION_DENIED'));
 }
 const missing=fixture();
 await assert.rejects(missing.authorizePilotPage(request('/__d3_pilot__/',
  {cookie:false})),denied('SESSION_DENIED'));
});
test('D3-OAUTHNAV06 same-origin pilot JS remains allowed with real owner cookie',async()=>{
 const session=fixture();
 const result=await session.authorizeStatus(request('/__d3_pilot__/pilot.js',{
  site:'same-origin',mode:'no-cors',dest:'script',
 }));
 assert.equal(result.authorized,true);
});
