import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createD3OwnerPilotHost} from '../src/d3-owner-pilot-host.mjs';
const ORIGIN='https://fishing.example',OWNER=265665562;
const JS=new TextEncoder().encode('/* D3 isolated test bundle */\nvoid 0;');
const DIGEST=createHash('sha256').update(JS).digest('hex');
function fixture({enabled=true,authenticated=true,owner=OWNER,
 tamper=false,missing=false}={}){
 const calls={auth:0,bundle:0};
 const host=createD3OwnerPilotHost({
  origin:ORIGIN,expectedSha256:missing?null:DIGEST,
  enabled:()=>enabled,
  ownerSession:{
   authorizeStatus:async()=>{
    calls.auth++;
    if(!authenticated)throw Error('No owner cookie');
    return {authorized:true,ownerGitHubId:owner};
   },
   authorizePilotPage:async()=>{
    calls.auth++;
    if(!authenticated)throw Error('No owner cookie');
    return {authorized:true,ownerGitHubId:owner};
   },
  },
  readBundle:async()=>{calls.bundle++;
   return tamper?new TextEncoder().encode('other JS'):JS;
  },
 });
 return {host,calls};
}
const path='/__d3_pilot__/';
const script='/__d3_pilot__/pilot.js';
const req=(p,options)=>new Request(ORIGIN+p,options);
test('D3-PH01 disabled pilot hides both HTML and script without session or file I/O',async()=>{
 const f=fixture({enabled:false});
 for(const p of [path,script]){
  const res=await f.host.serve(req(p));
  assert.equal(res.status,404);
 }
 assert.deepEqual(f.calls,{auth:0,bundle:0});
});
test('D3-PH02 anonymous and foreign users cannot retrieve protected bundle',async()=>{
 for(const flags of [{authenticated:false},{owner:42}]){
  const f=fixture(flags);
  const res=await f.host.serve(req(script));
  assert.equal(res.status,401);
  assert.equal(f.calls.bundle,0);
 }
});
test('D3-PH03 owner page is no-store, noindex and contains ONLY test script',async()=>{
 const f=fixture();
 const res=await f.host.serve(req(path));
 assert.equal(res.status,200);
 assert.match(res.headers.get('Content-Type'),/^text\/html/);
 assert.match(res.headers.get('Cache-Control'),/no-store/);
 assert.match(res.headers.get('X-Robots-Tag'),/noindex/);
 assert.match(res.headers.get('Content-Security-Policy'),/script-src 'self'/);
 assert.equal(res.headers.get('Vary'),'Cookie');
 const html=await res.text();
 assert(html.includes('src="/__d3_pilot__/pilot.js"'));
 assert(html.includes('id="connection-status"'));
 assert(!html.includes('src="/fishing/loader.js"'));
 assert.deepEqual(f.calls,{auth:1,bundle:1});
});
test('D3-PH04 owner script is byte-identical to separately pinned build',async()=>{
 const f=fixture();
 const res=await f.host.serve(req(script));
 assert.equal(res.status,200);
 assert.equal(res.headers.get('Content-Type'),'text/javascript; charset=utf-8');
 assert.deepEqual(new Uint8Array(await res.arrayBuffer()),JS);
});
test('D3-PH05 stale digest or absent pinned source never falls back to public app JS',async()=>{
 for(const options of [{tamper:true},{missing:true}]){
  const f=fixture(options);
  for(const p of [path,script]){
   const res=await f.host.serve(req(p));
   assert.equal(res.status,503);
  }
 }
});
test('D3-PH06 cross-origin, query, HTTP method or bearer cannot access pilot',async()=>{
 const f=fixture();
 for(const request of [
  req(path+'?debug=1'),
  req(script+'?cache=off'),
  new Request('https://other.example'+path),
  req(path,{method:'POST'}),
  req(script,{headers:{Authorization:'Bearer test'}}),
  req('/__d3_pilot__/other.js'),
 ]){
  assert.equal((await f.host.serve(request)).status,404);
 }
 assert.deepEqual(f.calls,{auth:0,bundle:0});
});
