import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadD6PublishedMediaPaths} from '../src/d6-content-image-resolver.mjs';

const root='https://fishing-d6-wp2-test.ginosega.workers.dev/fishing/';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const load=request=>loadD6PublishedMediaPaths({
 root,request,enabled:()=>true,readingMode:()=> 'Automatic',
});

test('L01-ANDROID01 new browser HTTP 403/401 asks for sign-in without publishing any media paths',async()=>{
 for(const code of [401,403]){
  await assert.rejects(()=>load(async()=>new Response(JSON.stringify({
   ok:false,error:'MEDIA_NOT_AUTHORIZED',
  }),{status:code,headers:{'Content-Type':'application/json'}})),
  /MEDIA_REGISTRY_SIGN_IN_REQUIRED/);
 }
 const shell=read('../src/entry.mjs');
 assert.match(shell,/MEDIA_REGISTRY_SIGN_IN_REQUIRED/);
 assert.match(shell,/signIn.href='\/auth\/start'/);
 assert.match(shell,/This browser is not signed in/);
 assert.match(shell,/if\(needsSignIn\)[\s\S]*?main\.append\(heading,message,signIn\)/);
});

test('L01-ANDROID02 service failure stays distinct from unsigned browser',async()=>{
 for(const code of [500,503]){
  await assert.rejects(()=>load(async()=>new Response(JSON.stringify({
   ok:false,error:'MEDIA_REGISTRY_UNVERIFIED',
  }),{status:code,headers:{'Content-Type':'application/json'}})),
  /MEDIA_REGISTRY_UNAVAILABLE/);
 }
 await assert.rejects(()=>load(async()=>{throw Error('network failed');}),
  /MEDIA_REGISTRY_UNAVAILABLE/);
 assert.deepEqual([...await load(async()=>new Response(JSON.stringify({
  ok:true,version:1,paths:[],
 }),{status:200,headers:{'Content-Type':'application/json'}}))],[]);
});
