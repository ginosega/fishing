import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
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

test('D5-START07 browser JS parses and reaches on-screen output without esbuild helpers',async()=>{
 const source=await host.serve(request(PATH+'probe.js')).text();
 assert.doesNotMatch(source,/__name\(|browserProbe\.toString\(|\b__async\b/);
 const elements=new Map();
 for(const id of ['results','progress','rerun','copy']){
  elements.set(id,{textContent:'',disabled:false,events:{},
   addEventListener(type,handler){this.events[type]=handler;}});
 }
 const requested=[];
 const environment={
  document:{getElementById:id=>elements.get(id)},
  window:{},
  navigator:{onLine:true},
  location:{origin:ORIGIN},
  URL,AbortController,Response,setTimeout,clearTimeout,
  fetch:async(url,options)=>{
   requested.push({url,credentials:options.credentials,cache:options.cache});
   if(url.endsWith('loader.js'))
    return new Response('/* loader */',{status:200,headers:{'Content-Type':'text/javascript'}});
   if(url.endsWith('release.json'))
    return new Response(JSON.stringify({id:'a'.repeat(32)}),{status:200});
   throw Error('Unexpected diagnostic resource');
  },
 };
 const script=new vm.Script(source,{filename:'d5-startup-probe.js'});
 script.runInNewContext(environment,{timeout:2000});
 assert.match(elements.get('results').textContent,/JavaScript running: yes/);
 assert.equal(elements.get('progress').textContent,'Running read-only checks…');
 await new Promise((resolve,reject)=>{
  const deadline=Date.now()+1000;
  const tick=()=>{
   if(elements.get('progress').textContent==='Read-only checks complete.')resolve();
   else if(Date.now()>deadline)reject(Error('Browser diagnostic never completed'));
   else setTimeout(tick,5);
  };
  tick();
 });
 assert.match(elements.get('results').textContent,/Network loader.js: HTTP 200/);
 assert.match(elements.get('results').textContent,/Network release.json: HTTP 200, release a{32}/);
 assert.deepEqual(requested.map(x=>x.credentials),['omit','omit']);
 assert.deepEqual(requested.map(x=>x.cache),['no-store','no-store']);
 assert.equal(elements.get('rerun').disabled,false);
 assert.equal(elements.get('copy').disabled,false);
});

test('D5-START08 Wrangler/esbuild keepNames bundle returns executable standalone JS',async()=>{
 const esbuildPath=new URL('../../../../pwa/node_modules/esbuild/lib/main.js',import.meta.url);
 const imported=await import(esbuildPath.href);
 const transform=imported.transform??imported.default?.transform;
 assert.equal(typeof transform,'function','Locked esbuild dependency unavailable');
 const original=await fs.readFile(new URL('../src/d5-startup-diagnostic.mjs',import.meta.url),'utf8');
 const compiled=await transform(original,{
  loader:'js',format:'esm',platform:'neutral',target:'es2022',keepNames:true,minify:true,
 });
 const compiledModule=await import('data:text/javascript;base64,'+
  Buffer.from(compiled.code).toString('base64'));
 const compiledHost=compiledModule.createD5StartupDiagnostic({origin:ORIGIN,enabled:()=>true});
 const response=compiledHost.serve(request(PATH+'probe.js'));
 assert.equal(response.status,200);
 const script=await response.text();
 assert.doesNotMatch(script,/\b__name\s*\(|\b__async\s*\(|browserProbe\.toString\s*\(/);
 assert.match(script,/JavaScript running/);
 const documentNode={textContent:'',disabled:true,addEventListener(){}};
 const elements=new Map([
  ['results',{...documentNode}],['progress',{...documentNode}],
  ['rerun',{...documentNode}],['copy',{...documentNode}],
 ]);
 const requested=[];
 const env={
  document:{getElementById:id=>elements.get(id)},
  navigator:{onLine:true},window:{},location:{origin:ORIGIN},
  URL,AbortController,Response,setTimeout,clearTimeout,
  fetch:async(url,opts)=>{
   requested.push([url,opts.credentials,opts.cache]);
   return new Response(url.endsWith('release.json')?JSON.stringify({id:'b'.repeat(32)}):'/*ok*/',{
    status:200,
    headers:{'Content-Type':url.endsWith('release.json')?'application/json':'text/javascript'},
   });
  },
 };
 new vm.Script(script,{filename:'wrangler-shipped-d5-probe.js'})
  .runInNewContext(env,{timeout:2000});
 assert.match(elements.get('results').textContent,/JavaScript running: yes/);
 await new Promise((resolve,reject)=>{
  const stop=Date.now()+1000;
  const check=()=>{
   if(elements.get('progress').textContent==='Read-only checks complete.')resolve();
   else if(Date.now()>stop)reject(Error('Bundled diagnostic script did not complete'));
   else setTimeout(check,5);
  };
  check();
 });
 assert.equal(requested.length,2);
 assert.ok(requested.every(([url,credentials,cache])=>url.startsWith('/fishing/')&&credentials==='omit'&&cache==='no-store'));
});
