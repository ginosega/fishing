import test from 'node:test';
import assert from 'node:assert/strict';
import {createOffline} from '../src/offline.mjs';

const root='https://example.test/fishing/';
const releaseId='b'.repeat(32);
async function device(verifyContent,run){
 const names=['navigator','window','document'];
 const old=Object.fromEntries(names.map(key=>[
  key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const calls=[],notices=[];
 let currentMode='Automatic';
 const worker={postMessage(message,ports){
  calls.push(message.type);
  let value;
  if(message.type==='CHECK_CURRENT')
   value={type:'FISHING_V2_CURRENT',releaseId};
  else if(message.type==='V3_READ_MODE')
   value={type:'FISHING_V3_MODE',mode:currentMode,available:true};
  else if(message.type==='V3_SET_MODE'){
   currentMode=message.mode;
   value={type:'FISHING_V3_MODE',mode:currentMode,available:true};
  }else
   value={type:'FISHING_V2_STATUS',
    status:{state:'Ready',releaseId,files:500,bytes:900,
     failed:[],message:''}};
  ports[0]?.postMessage(value);
 }};
 const registration={active:worker,installing:null,update:async()=>{}};
 const env={
  navigator:{onLine:true,serviceWorker:{
   controller:worker,ready:Promise.resolve(registration),
   register:async()=>registration,
   addEventListener(){},removeEventListener(){},
  }},
  window:{addEventListener(){},removeEventListener(){}},
  document:{hidden:false,addEventListener(){},removeEventListener(){}},
 };
 try{
  for(const [key,value] of Object.entries(env))
   Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
  const offline=createOffline({root,releaseId,
   v3ReadingMode:true,verifyContent,
   onStatus(){},onMode(){},isDirty:()=>false,
   notify:(message)=>notices.push(message),
  });
  await offline.start();
  try{await run({offline,calls,notices});}
  finally{offline.dispose();}
 }finally{
  for(const name of names){
   if(old[name])Object.defineProperty(globalThis,name,old[name]);
   else delete globalThis[name];
  }
 }
}
test('O03-MODE01 incomplete content prevents Work Offline even if software is Ready',async()=>{
 let verified=0;
 await device(async()=>{
  verified++;
  throw Error('Current content missing');
 },async({offline,calls,notices})=>{
  const ok=await offline.setMode('Work Offline');
  assert.equal(ok,false);
  assert.equal(verified,1);
  assert.equal(offline.getMode(),'Automatic');
  assert.equal(calls.includes('V3_SET_MODE'),false);
  assert.ok(notices.some(x=>/Current offline content is unavailable/.test(x)));
 });
});
test('O03-MODE02 verified content authorizes existing software integrity mode gate',async()=>{
 let verified=0;
 await device(async()=>{verified++;return {contentId:'a'.repeat(64)};},
 async({offline,calls})=>{
  assert.equal(await offline.setMode('Work Offline'),true);
  assert.equal(verified,1);
  assert.equal(offline.getMode(),'Work Offline');
  assert.ok(calls.includes('V3_SET_MODE'));
  assert.equal(await offline.setMode('Automatic'),true);
  assert.equal(verified,1,'switching online needs no V3 snapshot read');
 });
});
test('O03-MODE03 unflagged V2 mode uses no V3 content verification',async()=>{
 let calls=0;
 await device(async()=>{calls++;},async({calls:workerCalls})=>{
  assert.ok(workerCalls.includes('V3_READ_MODE'));
  assert.equal(calls,0);
 });
});
