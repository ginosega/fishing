import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {D5_OWNER_FIRST_VISIT_SCRIPT as bootstrap} from '../src/d5-owner-first-visit.mjs';
import {createD5OwnerCandidateStaticHost,D5_OWNER_STATIC_PREFIX}
 from '../../experiments/p3/preview/src/d5-owner-candidate-static-host.mjs';

const origin='https://owner.example.test',pages='https://a1b2c3d4.fishing-v3-owner-d5-test.pages.dev';
const root=origin+D5_OWNER_STATIC_PREFIX, sw=root+'sw.js';
test('D5-FIRST01 only V3 owner build embeds an early, controlled bootstrap',()=>{
 const build=readFileSync(new URL('../tools/build.mjs',import.meta.url),'utf8');
 assert.match(build,/v3OwnerCandidate\?\`<script>\$\{D5_OWNER_FIRST_VISIT_SCRIPT\}<\/script>\`/);
 assert.match(build,/v3OwnerCandidate\?''/);
 assert.match(build,/script defer src="\.\/loader\.js"/);
 assert.match(bootstrap,/sw\.register\(swUrl,\{scope:root\.href\}\)/);
 for(const forbidden of ['unregister(', 'caches.delete(', 'indexedDB.deleteDatabase(',
  'localStorage.clear(', 'Clear-Site-Data', '/api/v3/operations'])
  assert(!bootstrap.includes(forbidden));
});
test('D5-FIRST02 exact owner HTML CSP authorizes ONLY audited inline script',async()=>{
 const host=createD5OwnerCandidateStaticHost({origin,pagesOrigin:pages,
  enabled:()=>true,requestPages:async()=>new Response('<html></html>',{
   headers:{'Content-Type':'text/html; charset=utf-8'}})});
 const response=await host.serve(new Request(root));
 assert.equal(response.status,200);
 const hash=createHash('sha256').update(bootstrap).digest('base64');
 const csp=response.headers.get('Content-Security-Policy');
 assert(csp.includes("'sha256-"+hash+"'"));
 assert(csp.includes("script-src 'self'"));
 assert(!csp.includes("script-src 'self' 'unsafe-inline'"));
 const other=await host.serve(new Request(root+'some-page.html'));
 assert(!other.headers.get('Content-Security-Policy').includes('sha256-'));
});
test('D5-FIRST03 legacy controller cannot fetch loader before candidate registration',async()=>{
 const seen=[];let handler=null;
 const swApi={
  controller:{scriptURL:origin+'/fishing/sw.js'},
  addEventListener(type,fn){if(type==='controllerchange')handler=fn;},
  removeEventListener(){},
  async getRegistration(){seen.push('getRegistration');return {scope:origin+'/fishing/'};},
  async register(script,opts){
   seen.push('register');
   assert.equal(script,sw);assert.equal(opts.scope,root);
   this.controller={scriptURL:script};handler?.();
   return {scope:root,active:{scriptURL:script}};
  },
 };
 const head={append(el){if(el.src?.endsWith('loader.js'))seen.push('loader');}};
 const ctx={location:{origin,pathname:D5_OWNER_STATIC_PREFIX,reload(){}},
  navigator:{serviceWorker:swApi},
  document:{head,createElement:tag=>({tag}),readyState:'complete'},
  sessionStorage:{removeItem(){},getItem(){return null;},setItem(){}},
  setTimeout:()=>42,clearTimeout:()=>{},URL,Promise};
 vm.runInNewContext(bootstrap,ctx);
 await new Promise(resolve=>setImmediate(resolve));
 assert(seen.indexOf('register')>=0);
 assert(seen.indexOf('loader')>seen.indexOf('register'));
 assert.equal(seen.filter(x=>x==='loader').length,1);
});

test('D5-FIRST04 scoped bootstrap preserves deferred-loader DOM readiness',()=>{
 const seen=[];let ready=null;
 const serviceWorker={
  controller:{scriptURL:sw},
  addEventListener(){},removeEventListener(){},
  async getRegistration(){throw Error('should not register when already controlled');},
 };
 const document={
  readyState:'loading',
  head:{append(node){seen.push(node.src?.endsWith('loader.js')?'loader':'link');}},
  createElement:tag=>({tag}),
  addEventListener(type,fn,opts){
   assert.equal(type,'DOMContentLoaded');
   assert.equal(opts.once,true);
   ready=fn;
  },
 };
 const ctx={
  location:{origin,pathname:D5_OWNER_STATIC_PREFIX,reload(){throw Error('unexpected reload');}},
  navigator:{serviceWorker},
  document,
  sessionStorage:{removeItem(){},getItem(){return null;},setItem(){}},
  setTimeout:()=>42,clearTimeout:()=>{},URL,Promise,
 };
 vm.runInNewContext(bootstrap,ctx);
 assert.deepEqual(seen,[],'loader and manifest cannot be fetched before body is parsed');
 assert.equal(typeof ready,'function');
 document.readyState='interactive';
 ready();
 assert.equal(seen.filter(x=>x==='loader').length,1);
 assert(seen.indexOf('loader')>seen.indexOf('link'));
});
