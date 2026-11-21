import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {d6CanOfferOfflineRecovery,selectD6VerifiedOffline,
 mountD6OfflineRecovery} from '../src/d6-online-recovery.mjs';
const releaseId='a'.repeat(32);
function channel(){
 return {port1:{onmessage:null,close(){}},port2:{close(){}}};
}
test('V3-C03-04 no automatic transition: explicit click only',async()=>{
 const calls=[],chn=channel();
 const ctrl={postMessage(message,ports){
  calls.push(message);
  assert.equal(ports[0],chn.port2);
  chn.port1.onmessage({data:{type:'FISHING_V3_MODE',
   available:true,mode:'Work Offline'}});
 }};
 const promise=selectD6VerifiedOffline({releaseId,controller:ctrl,
  channelFactory:()=>chn,timeoutMs:100});
 assert.equal(await promise,true);
 assert.deepEqual(calls,[{type:'V3_SET_MODE',mode:'Work Offline',
  expectedReleaseId:releaseId}]);
});
test('V3-C03-05 rejects missing worker, wrong release, incomplete cache, errors',async()=>{
 await assert.rejects(selectD6VerifiedOffline({releaseId:'bad',controller:{
  postMessage(){throw Error('should not post');}
 }}),/VERIFIED_OFFLINE_LIBRARY_UNAVAILABLE/);
 await assert.rejects(selectD6VerifiedOffline({releaseId,
  controller:null}),/VERIFIED_OFFLINE_LIBRARY_UNAVAILABLE/);
 for(const reply of [
  {type:'FISHING_V3_MODE',mode:'Automatic',available:true},
  {type:'FISHING_V3_MODE',mode:'Work Offline',available:false},
  {type:'FISHING_V3_MODE',mode:'Work Offline',available:true,
   error:'Missing validated cache'},
  {type:'FISHING_V2_STATUS',mode:'Work Offline',available:true},
 ]){
  const chn=channel(),ctrl={postMessage(){
   chn.port1.onmessage({data:reply});
  }};
  await assert.rejects(selectD6VerifiedOffline({releaseId,
   controller:ctrl,channelFactory:()=>chn,timeoutMs:100}),
   /VERIFIED_OFFLINE_LIBRARY_UNAVAILABLE/);
 }
});
function dom(){
 const clicks=[];
 function createElement(tag){
  return {tag,children:[],textContent:'',disabled:false,
   append(...children){this.children.push(...children);},
   setAttribute(k,v){this[k]=v;},
   addEventListener(name,handler){if(name==='click')this.click=handler;},
  };
 }
 const main=createElement('main');
 return {main,doc:{createElement},clicks};
}
test('V3-C03-06 only typed D1 error renders opt-in; no automatic recovery',async()=>{
 const {main,doc}=dom();let recoveries=0,reloads=0;
 for(const error of [Error('Release manifest invalid'),
  {code:'V3_READING_MODE_UNAVAILABLE'},null]){
  assert.equal(mountD6OfflineRecovery({main,doc,error,releaseId}),false);
 }
 assert.equal(main.children.length,0);
 const error={code:'D1_BOOTSTRAP_UNAVAILABLE'};
 assert.equal(d6CanOfferOfflineRecovery(error),true);
 assert.equal(mountD6OfflineRecovery({main,doc,error,releaseId,
  recover:async()=>{recoveries++;return true;},
  reload:()=>{reloads++},
 }),true);
 assert.equal(recoveries,0);
 const button=main.children[1];assert.equal(button.textContent,
  'Open verified offline library');
 await button.click();
 assert.equal(recoveries,1);
 assert.equal(reloads,1);
});
test('V3-C03-07 refused offline selection never reloads, can retry',async()=>{
 const {main,doc}=dom();let reloads=0;
 mountD6OfflineRecovery({main,doc,error:{code:'D1_BOOTSTRAP_UNAVAILABLE'},
  releaseId,recover:async()=>{throw Error('missing valid cache');},
  reload:()=>{reloads++},
 });
 await main.children[1].click();
 assert.equal(reloads,0);
 assert.equal(main.children[1].disabled,false);
 assert.match(main.children[2].textContent,/No complete verified offline library/);
});
test('V3-C03-08 entrypoint mounts only controlled recovery after startup failure',()=>{
 const source=readFileSync(new URL('../src/entry.mjs',import.meta.url),'utf8');
 assert.match(source,/mountD6OfflineRecovery\(\{main,error,releaseId:settings\.release\?\.id\}\)/);
 const sw=readFileSync(new URL('../src/sw.mjs',import.meta.url),'utf8');
 assert.match(sw,/const \{entry\}=await resolveSelected\(\{verify:true\}\)/);
 assert.match(sw,/entry\.pointer\.id!==expectedReleaseId/);
 assert.match(sw,/await verifyCache\(entry\)/);
});
