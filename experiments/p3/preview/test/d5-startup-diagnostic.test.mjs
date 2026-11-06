import test from 'node:test';
import assert from 'node:assert/strict';
import {createD5StartupDiagnostic,D5_STARTUP_DIAGNOSTIC_PREFIX as PATH}
 from '../src/d5-startup-diagnostic.mjs';
import {createD3GatedAuthGateway}
 from '../src/d3-gated-auth-gateway.mjs';

const ORIGIN='https://fishing.example';
const host=createD5StartupDiagnostic({origin:ORIGIN,enabled:()=>true});
const request=(path,init)=>new Request(ORIGIN+path,init);

test('D5-START01 disabled diagnostic fails closed; no public or private content',async()=>{
 const inactive=createD5StartupDiagnostic({origin:ORIGIN});
 for(const path of [PATH,PATH+'probe.js']){
  assert.equal((await inactive.serve(request(path))).status,404);
 }
});
test('D5-START02 external-scope exact path serves visible diagnostics and script',async()=>{
 const res=host.serve(request(PATH));
 assert.equal(res.status,200);
 assert.match(res.headers.get('Content-Type'),/text\/html/);
 const html=await res.text();
 assert.match(html,/startup diagnostic/);
 assert.match(html,/probe\.js/);
 assert.match(html,/Read-only checks/);
 const js=host.serve(request(PATH+'probe.js'));
 assert.equal(js.status,200);
 assert.match(js.headers.get('Content-Type'),/text\/javascript/);
 const body=await js.text();
 assert.match(body,/getRegistration/);
 assert.match(body,/serviceWorker/);
 assert.match(body,/fishing-v2:/);
 assert.match(body,/Network loader\.js/);
 assert.match(body,/Network release\.json/);
 assert.doesNotMatch(body,/localStorage|indexedDB|sessionStorage|document\.cookie|delete\(|unregister\(|register\(|\.update\(|POST/);
});
test('D5-START03 strict CSP, no-store, no framing and no inline script',async()=>{
 const response=host.serve(request(PATH));
 assert.equal(response.headers.get('Cache-Control'),'no-store');
 const csp=response.headers.get('Content-Security-Policy');
 for(const item of ["default-src 'none'","script-src 'self'","connect-src 'self'","frame-ancestors 'none'"]){
  assert.ok(csp.includes(item),item);
 }
 assert.ok(!csp.includes("'unsafe-eval'"));
 assert.match(csp,/script-src 'self';/);
 assert.doesNotMatch(csp,/script-src[^;]*unsafe-inline/);
 assert.equal(response.headers.get('X-Frame-Options'),'DENY');
});
test('D5-START04 no query, variant, wrong origin or method mutation',async()=>{
 for(const path of [PATH+'unexpected',PATH+'probe.js/more',PATH+'?token=1',PATH+'probe.js?x=1']){
  assert.equal(host.serve(request(path)).status,404,path);
 }
 const other=new Request('https://evil.example'+PATH);
 assert.equal(host.serve(other).status,404);
 assert.equal(host.serve(request(PATH,{method:'POST'})).status,405);
 assert.equal(host.serve(request(PATH+'probe.js',{method:'DELETE'})).status,405);
 const head=host.serve(request(PATH,{method:'HEAD'}));
 assert.equal(head.status,200);
 assert.equal(await head.text(),'');
});
test('D5-START05 invalid origins rejected',()=>{
 for(const origin of ['http://fishing.example','https://fishing.example/path','https://fishing.example?x=1','https://u:p@fishing.example']){
  assert.throws(()=>createD5StartupDiagnostic({origin}),/Invalid startup diagnostic/);
 }
});
test('D5-START06 gateway route default OFF, no proxy, owner API or privilege',async()=>{
 let proxy=0,auth=0;
 const gateway=createD3GatedAuthGateway({
  auth:{fetch:async()=>{auth++;return new Response('auth');}},
  proxy:async()=>{proxy++;return new Response('proxy');},
 });
 const env={APP_ORIGIN:ORIGIN};
 const off=await gateway.fetch(request(PATH),env,{});
 assert.equal(off.status,404);
 assert.equal(proxy,0);
 assert.equal(auth,0);
 const enabled=await gateway.fetch(request(PATH),{...env,D5_STARTUP_DIAGNOSTIC_ENABLED:'true'},{});
 assert.equal(enabled.status,200);
 assert.match(await enabled.text(),/startup diagnostic/);
 const file=await gateway.fetch(request(PATH+'probe.js'),{...env,D5_STARTUP_DIAGNOSTIC_ENABLED:'true'},{});
 assert.equal(file.status,200);
 assert.equal(proxy,0);
 assert.equal(auth,0);
 const ordinary=await gateway.fetch(request('/fishing/'),env,{});
 assert.equal(await ordinary.text(),'proxy');
 assert.equal(proxy,1);
});
