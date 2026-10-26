import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createD2UnifiedOwnerSession} from '../src/d2-unified-owner-session.mjs';
import {createD3OwnerPilotHost} from '../src/d3-owner-pilot-host.mjs';

const ORIGIN='https://fishing.example',OWNER=265665562;
const token='z'.repeat(43);
const bytes=new TextEncoder().encode('/* private owner pilot bundle */\nvoid 0;');
const sha256=createHash('sha256').update(bytes).digest('hex');
function fixture({owner=OWNER,expiresAt=1800001000,authenticated=true}={}){
 const calls={db:0,bundle:0};
 const session=createD2UnifiedOwnerSession({
  AUTH_DB:{prepare(sql){
   assert.match(sql,/SELECT github_id,expires_at FROM sessions/);
   return {bind(){
    return {async first(){
     calls.db++;
     return authenticated?{github_id:owner,expires_at:expiresAt}:null;
    }};
   }};
  }},
  ownerGitHubId:OWNER,origin:ORIGIN,csrfKey:'c'.repeat(48),
  now:()=>1800000000,
 });
 const host=createD3OwnerPilotHost({
  origin:ORIGIN,ownerSession:session,expectedSha256:sha256,
  enabled:()=>true,
  readBundle:async()=>{calls.bundle++;return bytes;},
 });
 return {host,calls};
}
function request(path,{site='same-origin',mode='cors',dest='empty',
 cookie=true}={}){
 return new Request(ORIGIN+path,{headers:{
  ...(cookie?{Cookie:'__Host-fish_p0_session='+token}:{}),
  'Sec-Fetch-Site':site,'Sec-Fetch-Mode':mode,'Sec-Fetch-Dest':dest,
 }});
}
test('D3-NAV01 real authorized pilot fetch and cross-site top-level navigation both return 200',async()=>{
 const f=fixture();
 for(const headers of [
  {site:'same-origin',mode:'cors',dest:'empty'},
  {site:'cross-site',mode:'navigate',dest:'document'},
  {site:'same-site',mode:'navigate',dest:'document'},
 ]){
  const res=await f.host.serve(request('/__d3_pilot__/',headers));
  assert.equal(res.status,200);
  assert.match(await res.text(),/Private Gear \/ Knowledge Base sandbox/);
 }
 assert.equal(f.calls.bundle,3);
});
test('D3-NAV02 anonymous, expired or foreign-owner navigation stays 401',async()=>{
 for(const opts of [
  {authenticated:false},{expiresAt:1799999999},{owner:OWNER+1},
 ]){
  const f=fixture(opts);
  const res=await f.host.serve(request('/__d3_pilot__/',
   {site:'cross-site',mode:'navigate',dest:'document'}));
  assert.equal(res.status,401);
  assert.equal(f.calls.bundle,0);
 }
 const anonymous=fixture();
 const res=await anonymous.host.serve(request('/__d3_pilot__/',
  {site:'cross-site',mode:'navigate',dest:'document',cookie:false}));
 assert.equal(res.status,401);
 assert.equal(anonymous.calls.bundle,0);
});
test('D3-NAV03 cross-site JS, XHR and fake navigation cannot read private pilot',async()=>{
 const f=fixture();
 for(const [path,mode,dest] of [
  ['/__d3_pilot__/pilot.js','navigate','document'],
  ['/__d3_pilot__/pilot.js','no-cors','script'],
  ['/__d3_pilot__/','cors','empty'],
  ['/__d3_pilot__/','navigate','empty'],
 ]){
  const res=await f.host.serve(request(path,{site:'cross-site',mode,dest}));
  assert.equal(res.status,401);
 }
 assert.equal(f.calls.bundle,0);
});
test('D3-NAV04 same-origin protected pilot JS remains byte-identical and no-store',async()=>{
 const f=fixture();
 const res=await f.host.serve(request('/__d3_pilot__/pilot.js',
  {site:'same-origin',mode:'no-cors',dest:'script'}));
 assert.equal(res.status,200);
 assert.match(res.headers.get('Cache-Control'),/no-store/);
 assert.deepEqual(new Uint8Array(await res.arrayBuffer()),bytes);
});
