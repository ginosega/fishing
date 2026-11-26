import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadD6PublishedMediaPaths} from '../src/d6-content-image-resolver.mjs';

const root='https://fishing-d6-wp2-test.ginosega.workers.dev/fishing/';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const load=request=>loadD6PublishedMediaPaths({
 root,request,enabled:()=>true,readingMode:()=> 'Automatic',
});

test('A01 anonymous browser loads published registry; denied reads are service failures',async()=>{
 assert.deepEqual([...await load(async()=>new Response(JSON.stringify({
  ok:true,version:1,paths:['Gear/Lures/assets/example.png'],
 }),{status:200,headers:{'Content-Type':'application/json'}}))],
 ['Gear/Lures/assets/example.png']);
 for(const code of [401,403]){
  await assert.rejects(()=>load(async()=>new Response(JSON.stringify({
   ok:false,error:'MEDIA_NOT_AUTHORIZED',
  }),{status:code,headers:{'Content-Type':'application/json'}})),
  /MEDIA_REGISTRY_UNAVAILABLE/);
 }
 const shell=read('../src/entry.mjs');
 assert.doesNotMatch(shell,/MEDIA_REGISTRY_SIGN_IN_REQUIRED|This browser is not signed in/);
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
