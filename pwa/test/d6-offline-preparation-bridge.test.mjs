import test from 'node:test';
import assert from 'node:assert/strict';
import {createOffline} from '../src/offline.mjs';
import {v3OfflineLibraryDisplay}
 from '../src/v3-offline-library-status.mjs';

const releaseId='a'.repeat(32),root='https://example.test/fishing/';
async function withWorker({prepareState='Ready',content=null},check){
 const globalNames=['navigator','window','document','caches'];
 const previous=Object.fromEntries(globalNames.map(k=>
  [k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 let calls=[];
 const ready=()=>({state:'Ready',releaseId,files:575,bytes:2500,
  failed:[],message:''});
 const worker={postMessage(message,ports){
  calls.push(message.type);
  if(message.type==='CHECK_CURRENT'){
   ports[0].postMessage({type:'FISHING_V2_CURRENT',releaseId});return;
  }
  const status=message.type==='PREPARE'&&prepareState==='Incomplete'?
   {state:'Incomplete',releaseId:null,files:0,bytes:0,
    failed:[],message:'Software verification failed'}:
   message.type==='PREPARE'&&prepareState==='OldReadyAfterFailure'?
    {...ready(),message:'Update incomplete; prior software retained.'}:
   ready();
  ports[0].postMessage({type:'FISHING_V2_STATUS',status});
 }};
 const reg={active:worker,installing:null,update:async()=>{}};
 const serviceWorker={
  controller:worker,ready:Promise.resolve(reg),
  async register(){return reg;},
  addEventListener(){},removeEventListener(){},
 };
 const globals={
  navigator:{onLine:true,serviceWorker},
  window:{addEventListener(){},removeEventListener(){}},
  document:{hidden:false,addEventListener(){},removeEventListener(){}},
  caches:{},
 };
 try{
  for(const [key,value] of Object.entries(globals))
   Object.defineProperty(globalThis,key,{
    configurable:true,writable:true,value,
   });
  const events=[];
  const offline=createOffline({
   root,releaseId,onStatus:s=>events.push(s),
   isDirty:()=>false,notify:()=>{},
   ...(content?{prepareContent:content}:{}),
  });
  await offline.start();
  await offline.update();
  await check({events,offline,calls});
  offline.dispose();
 }finally{
  for(const key of globalNames){
   if(previous[key])Object.defineProperty(globalThis,key,previous[key]);
   else delete globalThis[key];
  }
 }
}
test('O02-BRIDGE01 source-only opt-in runs AFTER verified software PREPARE',async()=>{
 await withWorker({content:async({onStatus,caches,scope})=>{
  assert.equal(scope,root);
  assert.ok(caches);
  onStatus({phase:'checking',completed:0,total:0,
   previousVerified:false});
  onStatus({phase:'images',completed:1,total:2,
   previousVerified:false});
  onStatus({phase:'complete',completed:2,total:2,
   previousVerified:false});
  return {changed:true};
 }},({events,offline,calls})=>{
  assert(calls.indexOf('PREPARE')>=0);
  assert(calls.filter(x=>x==='STATUS').length>=2,
   'software integrity is verified again after O02');
  assert.deepEqual(events.filter(x=>x.contentPreparation?.phase==='images')
   .map(x=>x.contentPreparation.completed),[1]);
  const current=offline.getStatus();
  assert.equal(current.state,'Ready');
  assert.equal(current.contentPreparation.phase,'complete');
  assert.equal(current.contentPreparation.libraryReady,true);
  assert.equal(v3OfflineLibraryDisplay(current,{
   online:true,currentReleaseId:releaseId,
  }).message,'Offline library is ready for offline use.');
 });
});

test('O02-BRIDGE02 incomplete software release blocks content downloading',async()=>{
 let contentCalls=0;
 await withWorker({prepareState:'Incomplete',
  content:async()=>{contentCalls++;}},
 ({offline})=>{
  assert.equal(contentCalls,0);
  assert.equal(offline.getStatus().contentPreparation,null);
 });
});

test('O02-BRIDGE03 content failure keeps bounded message and prior selection',async()=>{
 await withWorker({content:async({onStatus})=>{
  onStatus({phase:'error',reason:'image',previousVerified:true});
  throw Error('Internal R2 key should never be displayed');
 }},({events,offline})=>{
  const current=offline.getStatus();
  assert.equal(current.state,'Ready');
  assert.equal(current.contentPreparation.phase,'error');
  assert.equal(current.message,'');
  assert.equal(v3OfflineLibraryDisplay(current,{
   online:true,currentReleaseId:releaseId,
  }).message,
  'An image could not be verified. Previous offline library retained. Try updating again.');
  assert(events.every(x=>!String(x.message||'').includes('Internal R2')));
 });
});

test('O02-BRIDGE04 existing FISH091-only preparation stays unchanged',async()=>{
 await withWorker({},({offline,calls})=>{
  assert.equal(offline.getStatus().contentPreparation,null);
  assert.equal(offline.getStatus().state,'Ready');
  assert.equal(calls.includes('PREPARE'),true);
 });
});

test('O02-BRIDGE05 a failed FISH091 update reporting old Ready blocks content',async()=>{
 let contentCalls=0;
 await withWorker({prepareState:'OldReadyAfterFailure',
  content:async()=>{contentCalls++;}},
 ({offline})=>{
  assert.equal(contentCalls,0);
  assert.equal(offline.getStatus().contentPreparation,null);
  assert.equal(offline.getStatus().state,'Ready',
   'the previous complete software library remains usable');
 });
});
