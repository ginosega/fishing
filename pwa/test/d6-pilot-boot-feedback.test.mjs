import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const loader=readFileSync(new URL('../src/loader.js',import.meta.url),'utf8');
const editor=readFileSync(new URL('../src/d6-approved-owner-editor-preview.mjs',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const root='https://fishing-d6-wp2-test.ginosega.workers.dev/fishing/';

async function boot({navigation='reload',controller=false,active=true,online=true,
 workerScript=root+'sw.js',hello=true}={}){
 const seen={fetches:[],errors:[],registered:false};
 let finished;
 const done=new Promise(resolve=>{finished=resolve;});
 const worker={
  scriptURL:workerScript,state:'activated',
  postMessage(_message,ports){
   if(hello)queueMicrotask(()=>ports[0].send({
    protocol:'fishing-companion-v2',base:'/fishing/',
    capabilities:{onlineDefault:true},
   }));
  },
 };
 const registration={
  active:active?worker:null,installing:null,
  addEventListener(){},removeEventListener(){},
 };
 class FakeMessageChannel{
  constructor(){
   this.port1={onmessage:null,close(){}};
   this.port2={send:data=>this.port1.onmessage?.({data})};
  }
 }
 const elements=new Map();
 const element=id=>{
  if(!elements.has(id))elements.set(id,{
   dataset:{},textContent:'',
   addEventListener(){},removeEventListener(){},
   replaceChildren(){},append(){},
  });
  return elements.get(id);
 };
 const serviceWorker={
  controller:controller?worker:null,
  async register(){seen.registered=true;return registration;},
  addEventListener(){},removeEventListener(){},
 };
 const context={
  URL,MessageChannel:FakeMessageChannel,
  navigator:{onLine:online,serviceWorker},
  performance:{getEntriesByType:()=>[{type:navigation}]},
  document:{
   currentScript:{src:root+'loader.js'},
   getElementById:element,
   createElement:tag=>({tag,textContent:'',addEventListener(){}}),
  },
  fetch:async url=>{
   seen.fetches.push(String(url));
   return {ok:false,status:404};
  },
  console:{error:error=>{
   seen.errors.push(error.message);finished();
  }},
  setTimeout:(fn,ms)=>setTimeout(fn,ms===30000?30:ms===1500?15:ms),
  clearTimeout,
 };
 vm.runInNewContext(loader,context,{timeout:1000});
 await Promise.race([
  done,
  new Promise((_,reject)=>setTimeout(()=>reject(Error('Loader test did not settle')),450)),
 ]);
 return seen;
}

test('V3-BOOT01 forced reload: active verified worker permits online release check',async()=>{
 const x=await boot({navigation:'reload',controller:false,active:true});
 assert.equal(x.registered,true);
 assert.deepEqual(x.fetches,[root+'release.json']);
 assert.deepEqual(x.errors,['Release pointer unavailable']);
});

test('V3-BOOT02 normal navigation still requires a controlling worker',async()=>{
 const x=await boot({navigation:'navigate',controller:false,active:true});
 assert.equal(x.fetches.length,0);
 assert.match(x.errors[0],/could not activate its current service worker/);
});

test('V3-BOOT03 verified controller boots ordinary navigation',async()=>{
 const x=await boot({navigation:'navigate',controller:true,active:true});
 assert.deepEqual(x.fetches,[root+'release.json']);
});

test('V3-BOOT04 offline, foreign or unverified worker cannot bypass activation',async()=>{
 for(const options of [
  {navigation:'reload',controller:false,active:true,online:false},
  {navigation:'reload',controller:false,active:true,
   workerScript:'https://not-owned.example/sw.js'},
  {navigation:'reload',controller:false,active:true,hello:false},
 ]){
  const x=await boot(options);
  assert.equal(x.fetches.length,0);
  assert.match(x.errors[0],/could not activate its current service worker/);
 }
});

test('V3-UX01 successful Gear Save appears both above and below actions',()=>{
  assert.match(editor,/const success=directGear\?'Saved\\. Your Gear item will show the updated information after reload\\.'/);
  assert.match(editor,/Saved\\. Your Knowledge Base entry will show the updated information after reload\\./);
 assert.match(editor,/status\(notice,success,'success'\);/);
 assert.match(editor,/status\(actionNotice,success,'success'\);/);
 assert.match(editor,/form\.append\(actions,actionNotice\);/);
 assert.match(editor,/editor-notice editor-action-feedback/);
 assert.match(css,/\.editor-action-feedback:not\(:empty\)\{padding-top:8px;padding-bottom:12px\}/);
});
