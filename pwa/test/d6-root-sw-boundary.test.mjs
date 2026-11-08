import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {D6_PUBLIC_ROOT,shouldHandleD6RootSWRequest} from '../src/d6-root-sw-boundary.mjs';
import {planD6StaticRequest} from '../server/d6-static-proxy.mjs';

const root=D6_PUBLIC_ROOT;
const id='0123456789abcdef0123456789abcdef';
const check=(path,scope=root)=>shouldHandleD6RootSWRequest({scope,requestUrl:new URL(path,root).href});

test('D6-SW01 unified root SW handles only public verified release paths',()=>{
 const paths=['/','/index.html','/release.json','/loader.js','/sw.js',
  '/manifest.webmanifest','/icon.png','/icon-maskable.png',
  '/releases/'+id+'/app.js',
  '/releases/'+id+'/content/KB/Locations/assets/Lake%20Sammamish.jpg',
  '/releases/'+id+'/card-thumbnails/example.webp',
  '/releases/'+id+'/manifest.json'];
 for(const path of paths){
  assert.equal(check(path),true,path);
  assert.equal(planD6StaticRequest({url:new URL(path,root).href}).kind,'static',path);
 }
});

test('D6-SW02 never intercept owner API, auth callbacks or private sandbox',()=>{
 const paths=['/auth/start','/auth/callback?code=fake','/session',
  '/session/signout','/api','/api/v3/operations/latest',
  '/api/v3/assets/source','/api/v3/operations/p3_fake',
  '/fishing/__v3_owner_candidate__/','/fishing/__d3_pilot__/',
  '/__d3_pilot__/','/admin','/private','/releases/bad/file.js',
  '/favicon.ico','/releases/'+id+'/content/%2e%2e/secret',
  '/releases/'+id+'/content/%2fapi','/%61uth/start'];
 for(const path of paths){
  assert.equal(check(path),false,path);
  assert.notEqual(planD6StaticRequest({url:new URL(path,root).href}).kind,'static',path);
 }
});

test('D6-SW03 existing V2 and D5 scopes are unchanged',()=>{
 for(const scope of ['https://ginosega.github.io/fishing/',
  'https://fishing-auth-p0-test.ginosega.workers.dev/fishing/__v3_owner_candidate__/']){
  assert.equal(shouldHandleD6RootSWRequest({scope,requestUrl:new URL('release.json',scope).href}),true);
  assert.equal(shouldHandleD6RootSWRequest({scope,requestUrl:'https://attacker.invalid/release.json'}),false);
 }
});

test('D6-SW04 does not treat an unrelated root or invalid URL as production scope',()=>{
 assert.equal(shouldHandleD6RootSWRequest({scope:'not a URL',requestUrl:root}),false);
 assert.equal(shouldHandleD6RootSWRequest({scope:root,requestUrl:'not a URL'}),false);
 assert.equal(shouldHandleD6RootSWRequest({scope:root,requestUrl:'http://fishing.ginosega.workers.dev/release.json'}),false);
 assert.equal(shouldHandleD6RootSWRequest({scope:root,requestUrl:'https://other.workers.dev/api/v3/operations/latest'}),false);
});

test('D6-SW05 root scope classification runs before service-worker interception',()=>{
 const source=readFileSync(new URL('../src/sw.mjs',import.meta.url),'utf8');
 const fn=source.indexOf('shouldHandleD6RootSWRequest({scope,requestUrl:request.url})');
 const respond=source.indexOf('event.respondWith((async()=>{');
 assert.ok(fn>=0&&respond>=0&&fn<respond);
 assert.match(source,/if\(!shouldHandleD6RootSWRequest\(\{scope,requestUrl:request.url\}\)\)return;/);
});
