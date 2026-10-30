import test from 'node:test';
import assert from 'node:assert/strict';
import {MessageChannel} from 'node:worker_threads';
import {createOffline} from '../src/offline.mjs';

function withBrowserWorker(worker,run){
 const old=Object.getOwnPropertyDescriptor(globalThis,'navigator');
 const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
 const oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
 const oldChannel=Object.getOwnPropertyDescriptor(globalThis,'MessageChannel');
 const handlers=new Map();
 const serviceWorker={
  controller:worker,ready:Promise.resolve(),
  register:async()=>({active:worker,update:async()=>{}}),
  addEventListener:(name,fn)=>handlers.set(name,fn),
  removeEventListener:(name)=>handlers.delete(name),
 };
 Object.defineProperty(globalThis,'navigator',{value:{
  serviceWorker,onLine:true,
 },configurable:true});
 Object.defineProperty(globalThis,'window',{value:{
  addEventListener(){},removeEventListener(){},
 },configurable:true});
 Object.defineProperty(globalThis,'document',{value:{
  hidden:false,addEventListener(){},removeEventListener(){},
 },configurable:true});
 Object.defineProperty(globalThis,'MessageChannel',{value:MessageChannel,configurable:true});
 return Promise.resolve().then(run).finally(()=>{
  for(const [name,d] of [
   ['navigator',old],['window',oldWindow],['document',oldDocument],
   ['MessageChannel',oldChannel],
  ]){if(d)Object.defineProperty(globalThis,name,d);
   else delete globalThis[name];}
 });
}

function fakeWorker({badFirstModeRead=false}={}){
 let reads=0,mode='Automatic',ready=true;
 const calls=[];
 return {calls,postMessage(message,[port]){
  calls.push(message.type);
  let reply;
  if(message.type==='STATUS')reply={type:'FISHING_V2_STATUS',
   status:{state:'Ready',releaseId:'a'.repeat(32),files:10,bytes:1000}};
  if(message.type==='CHECK_CURRENT')reply={
   type:'FISHING_V2_CURRENT',releaseId:'a'.repeat(32)};
  if(message.type==='V3_READ_MODE'){
   reads++;
   reply=badFirstModeRead&&reads===1?{type:'INVALID'}:
    {type:'FISHING_V3_MODE',mode,available:true};
  }
  if(message.type==='V3_SET_MODE'){
   if(ready)mode=message.mode;
   reply={type:'FISHING_V3_MODE',mode,available:true};
  }
  // Asynchronous message channel to exercise the real client callback.
  queueMicrotask(()=>{port.postMessage(reply);port.close();});
 }};
}

function client(events,notifications){
 return createOffline({
  root:'http://127.0.0.1:4173/fishing/__v3_reader_candidate__/',
  releaseId:'a'.repeat(32),
  onStatus:()=>{},isDirty:()=>false,notify:(...args)=>notifications.push(args),
  v3ReadingMode:true,onMode:(mode,available,feedback)=>
   events.push({mode,available,...feedback}),
 });
}

test('D5-M01 candidate mode buttons receive available state after SW handshake and show both transitions',async()=>{
 const worker=fakeWorker(),events=[],notifications=[];
 await withBrowserWorker(worker,async()=>{
  const offline=client(events,notifications);
  await offline.start();
  assert.equal(offline.getModeAvailable(),true);
  assert.equal(offline.getMode(),'Automatic');
  assert(events.some(e=>e.busy&&/Checking service-worker/.test(e.message)));
  assert(await offline.setMode('Work Offline'));
  assert.equal(offline.getMode(),'Work Offline');
  assert(events.some(e=>e.busy&&/Verifying every file/.test(e.message)));
  assert(events.some(e=>e.mode==='Work Offline'&&!e.busy));
  assert(await offline.setMode('Automatic'));
  assert.equal(offline.getMode(),'Automatic');
  assert.equal(notifications.length,0);
  offline.dispose();
 });
});

test('D5-M02 invalid initial SW reply shows retry and never assumes mode availability',async()=>{
 const worker=fakeWorker({badFirstModeRead:true}),events=[];
 await withBrowserWorker(worker,async()=>{
  const offline=client(events,[]);
  await offline.start();
  assert.equal(offline.getModeAvailable(),false);
  assert.match(events.at(-1).message,/Retry reading controls/);
  assert.equal(await offline.refreshMode(),true);
  assert.equal(offline.getModeAvailable(),true);
  assert.equal(offline.getMode(),'Automatic');
  offline.dispose();
 });
});
