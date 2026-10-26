import test from 'node:test';
import assert from 'node:assert/strict';
import {createOffline} from '../src/offline.mjs';

test('D3-PW01 isolated private pilot never registers or contacts V2 service worker',async()=>{
 const priorNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
 const priorLocation=Object.getOwnPropertyDescriptor(globalThis,'location');
 let touched=0,notices=0;
 Object.defineProperty(globalThis,'navigator',{configurable:true,
  value:{serviceWorker:{get register(){touched++;throw Error('Forbidden SW registration')}}}});
 Object.defineProperty(globalThis,'location',{configurable:true,
  value:{reload(){touched++;}}});
 try{
  const statuses=[];
  const offline=createOffline({
   root:'https://fishing.example/fishing/',releaseId:'a'.repeat(32),
   onlineOnly:true,
   onStatus:v=>statuses.push(v),
   isDirty:()=>false,
   notify:()=>{notices++;},
  });
  await offline.start();
  assert.equal(await offline.checkCurrent(),true);
  assert.equal(offline.getStatus().state,'OnlineOnly');
  assert.equal(statuses[0].message,'Private sandbox pilot · online-only');
  await offline.update();
  assert.equal(notices,1);
  assert.equal(touched,0);
  offline.dispose();
 }finally{
  if(priorNavigator)Object.defineProperty(globalThis,'navigator',priorNavigator);
  else delete globalThis.navigator;
  if(priorLocation)Object.defineProperty(globalThis,'location',priorLocation);
  else delete globalThis.location;
 }
});
test('D3-PW02 ordinary V2 retains its original service-worker workflow',()=>{
 const source=createOffline.toString();
 assert(source.includes("navigator.serviceWorker.register("));
 assert(source.includes("new URL('sw.js',root)"));
});
