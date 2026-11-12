import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';
const ORIGIN='https://fishing-auth-p0.example.workers.dev';
const call=(path,init)=>worker.fetch(new Request(ORIGIN+path,init),env());
const env=()=>({APP_ORIGIN:ORIGIN,OWNER_GITHUB_ID:'1111',GITHUB_CLIENT_ID:'Iv1.test',GITHUB_CLIENT_SECRET:'fake-test-only',DB:{
 prepare(sql){return{bind(){return{async first(){throw Error('Simulated D1 unavailable: PRIVATE_DB_DIAGNOSTIC')},async run(){throw Error('Simulated D1 unavailable: PRIVATE_DB_DIAGNOSTIC')}}}}}
}});
const noLeak=async r=>{const msg=await r.text();assert.doesNotMatch(msg,/PRIVATE_DB_DIAGNOSTIC|fake-test-only|origin diagnostic secret/i);return msg;};

test('G1-E01: published asset proxied by one upstream GET, identity body, no inbound credentials and no store',async t=>{
 const calls=[];
 t.mock.method(globalThis,'fetch',async(url,init)=>{calls.push({url,init});return new Response('release bytes',{status:200,headers:{'Content-Type':'application/json','Set-Cookie':'private=do-not-forward'}})});
 const res=await call('/fishing/release.json',{headers:{Authorization:'Bearer private',Cookie:'private=secret'}});
 assert.equal(res.status,200);assert.equal(await res.text(),'release bytes');assert.equal(res.headers.get('set-cookie'),null);assert.equal(res.headers.get('cache-control'),'no-store');
 assert.equal(calls.length,1);assert.equal(calls[0].url,'https://ginosega.github.io/fishing/release.json');
 assert.deepEqual(calls[0].init.headers,{'Accept':'*/*','Accept-Encoding':'identity'});assert.equal(calls[0].init.redirect,'manual');
});
test('G1-E02: missing upstream public file becomes 404 without reflecting upstream body',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('origin diagnostic secret',{status:404,headers:{'Set-Cookie':'private=1'}}));
 const r=await call('/fishing/not-found');assert.equal(r.status,404);await noLeak(r);assert.equal(r.headers.get('set-cookie'),null);
});
test('G1-E03: upstream errors including quota-style 429 and 503 become controlled 502 responses',async t=>{
 const m=t.mock.method(globalThis,'fetch',async()=>new Response('origin diagnostic secret',{status:503}));
 for(const code of [429,500,503]){m.mock.mockImplementation(async()=>new Response('origin diagnostic secret',{status:code}));const r=await call('/fishing/index.html');assert.equal(r.status,502);await noLeak(r);assert.equal(r.headers.get('cache-control'),'no-store');}
});
test('G1-E04: upstream redirect denied rather than followed or reflected',async t=>{
 t.mock.method(globalThis,'fetch',async()=>Response.redirect('https://invalid.example/',302));
 const r=await call('/fishing/index.html');assert.equal(r.status,502);assert.equal(r.headers.get('location'),null);
});
test('G1-E05: simulated DNS/timeout failure produces generic 502 without upstream detail',async t=>{
 t.mock.method(globalThis,'fetch',async()=>{throw Error('origin diagnostic secret')});
 const r=await call('/fishing/index.html');assert.equal(r.status,502);await noLeak(r);
});
test('G1-E06: unexpected upstream compression fails closed to protect release integrity',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('garbled',{status:200,headers:{'Content-Encoding':'br'}}));
 const r=await call('/fishing/release.json');assert.equal(r.status,502);assert.equal(await r.text(),'Unsupported upstream asset encoding');
});
test('G1-E07: HEAD uses one upstream HEAD and returns no body',async t=>{
 const seen=[];t.mock.method(globalThis,'fetch',async(url,init)=>{seen.push({url,init});return new Response(null,{status:200,headers:{'Content-Type':'application/json'}})});
 const r=await call('/fishing/release.json',{method:'HEAD'});assert.equal(r.status,200);assert.equal(r.body,null);assert.equal(seen.length,1);assert.equal(seen[0].init.method,'HEAD');
});
test('G1-E08: unsupported mutation never contacts upstream; no accidental write side effect',async t=>{
 let called=false;t.mock.method(globalThis,'fetch',async()=>{called=true;throw Error('unexpected')});
 for(const method of ['POST','PUT','DELETE']){const r=await call('/fishing/release.json',{method});assert.equal(r.status,405)}
 assert.equal(called,false);
});
test('G1-E09: D1 outage yields private generic auth failure, while anonymous static gateway GET remains available',async t=>{
 let upstream=0;t.mock.method(globalThis,'fetch',async()=>{upstream++;return new Response('public',{status:200})});
 const auth=await call('/session',{headers:{Cookie:'__Host-fish_p0_session='+'x'.repeat(43)}});assert.equal(auth.status,502);await noLeak(auth);
 const gateway=await call('/fishing/index.html');assert.equal(gateway.status,200);assert.equal(await gateway.text(),'public');assert.equal(upstream,1);
});
test('G1-E10: missing mandatory DB binding causes generic fail closed rather than a public gateway bypass',async()=>{
 const e=env();delete e.DB;
 const r=await worker.fetch(new Request(ORIGIN+'/fishing/index.html'),e);
 assert.equal(r.status,503);await noLeak(r);
});
