import test from 'node:test';
import assert from 'node:assert/strict';
import {MessageChannel} from 'node:worker_threads';
import {createOffline} from '../src/offline.mjs';

const A='a'.repeat(32),B='b'.repeat(32);
async function scenario({initial=A,dirty=false,online=true}={}){
 const original={navigator:globalThis.navigator,window:globalThis.window,document:globalThis.document,location:globalThis.location,MessageChannel:globalThis.MessageChannel};
 const listeners={window:new Map(),document:new Map(),worker:new Map()};
 let remote=initial,edited=dirty,reloads=0,notices=[];
 const listen=(where,kind,fn)=>listeners[where].set(kind,fn);
 const remove=(where,kind)=>listeners[where].delete(kind);
 const controller={postMessage(msg,ports){
  const result=msg.type==='CHECK_CURRENT'?{type:'FISHING_V2_CURRENT',releaseId:remote}:{type:'FISHING_V2_STATUS',status:{state:'Incomplete',releaseId:null,files:0}};
  queueMicrotask(()=>ports[0].postMessage(result));
 }};
 const serviceWorker={controller,ready:Promise.resolve(),register:async()=>({active:controller}),
  addEventListener:(kind,fn)=>listen('worker',kind,fn),
  removeEventListener:(kind)=>remove('worker',kind)};
 Object.defineProperty(globalThis,'navigator',{value:{onLine:online,serviceWorker},configurable:true});
 globalThis.window={addEventListener:(kind,fn)=>listen('window',kind,fn),removeEventListener:(kind)=>remove('window',kind)};
 globalThis.document={hidden:false,addEventListener:(kind,fn)=>listen('document',kind,fn),removeEventListener:(kind)=>remove('document',kind)};
 globalThis.location={hash:'#/inventory/category/lures',reload:()=>{reloads++;}};
 globalThis.MessageChannel=MessageChannel;
 const offline=createOffline({root:'https://example.test/fishing/',releaseId:A,isDirty:()=>edited,notify:(msg,kind)=>notices.push({msg,kind}),onStatus:()=>{}});
 const restore=()=>{
  offline.dispose();
  for(const [name,value] of Object.entries(original)){
   if(name==='navigator'){if(value===undefined)delete globalThis.navigator;else Object.defineProperty(globalThis,'navigator',{value,configurable:true});}
   else if(value===undefined)delete globalThis[name];else globalThis[name]=value;
  }
 };
 return {offline,restore,setRemote:x=>{remote=x;},setDirty:x=>{edited=x;},fire:async(where,kind)=>{listeners[where].get(kind)?.();await new Promise(r=>setTimeout(r,50));},get reloads(){return reloads;},get notices(){return notices;}};
}
test('no false update notice on first controller activation with matching release',async()=>{
 const x=await scenario();try{await x.offline.start();await x.fire('worker','controllerchange');assert.equal(x.reloads,0);assert.equal(x.notices.length,0);assert.equal(await x.offline.checkCurrent(),true);}finally{x.restore();}
});
test('clean stale tab reloads atomically on focus and preserves the current hash route',async()=>{
 const x=await scenario();try{await x.offline.start();x.setRemote(B);await x.fire('window','focus');assert.equal(x.reloads,1);assert.equal(globalThis.location.hash,'#/inventory/category/lures');assert.equal(await x.offline.checkCurrent(),false);assert.equal(x.reloads,1);}finally{x.restore();}
});
test('dirty editor is not discarded; upgrade happens after changes are resolved',async()=>{
 const x=await scenario({dirty:true});try{await x.offline.start();x.setRemote(B);assert.equal(await x.offline.checkCurrent(),false);assert.equal(x.reloads,0);assert.match(x.notices[0].msg,/unsaved changes/);assert.equal(x.notices[0].kind,'warning');assert.equal(await x.offline.checkCurrent(),false);assert.equal(x.notices.length,1);x.setDirty(false);await x.fire('window','focus');assert.equal(x.reloads,1);}finally{x.restore();}
});
test('unverified or temporarily unavailable hosted release does not cause false reloads',async()=>{
 const x=await scenario();try{await x.offline.start();x.setRemote(null);assert.equal(await x.offline.checkCurrent(),true);assert.equal(x.reloads,0);assert.equal(x.notices.length,0);}finally{x.restore();}
});
test('new worker controller triggers fresh release check but does not notify for identical release',async()=>{
 const x=await scenario();try{await x.offline.start();await x.fire('worker','controllerchange');assert.equal(x.notices.length,0);x.setRemote(B);await x.fire('worker','controllerchange');assert.equal(x.reloads,1);}finally{x.restore();}
});
