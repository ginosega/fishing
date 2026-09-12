import test from 'node:test';
import {validateManifest} from '../src/release.mjs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {webcrypto,createHash} from 'node:crypto';
import {build} from 'esbuild';
const scope='https://example.test/fishing/v2-preview/',abs=p=>new URL(p,scope).href;
const hash=x=>createHash('sha256').update(x).digest('hex');
function fixture(id,icon='icon.png'){
 const schemaVersions={gear:2,kb:2,catches:2};
 const paths=['index.html','loader.js','sw.js','manifest.webmanifest',icon,`releases/${id}/app.js`,`releases/${id}/styles.css`,...['Gear/gear','KB/kb','Catches/catches'].map(p=>`releases/${id}/content/${p}.json`)];
 const network=new Map(paths.map(p=>[abs(p),Buffer.from(p+' '+id)]));
 const files=paths.map(path=>({path,bytes:network.get(abs(path)).length,sha256:hash(network.get(abs(path)))}));
 const manifest={format:'fishing-companion-release-v2',releaseId:id,sourceRevision:id,base:'/fishing/v2-preview/',schemaVersions,files,totalBytes:files.reduce((n,e)=>n+e.bytes,0)};
 const bytes=Buffer.from(JSON.stringify(manifest));
 const pointer={id,sourceRevision:id,schemaVersions,manifest:`releases/${id}/manifest.json`,manifestSha256:hash(bytes)};
 network.set(abs(pointer.manifest),bytes);network.set(abs('release.json'),Buffer.from(JSON.stringify(pointer)));
 return {id,network,manifest,pointer};
}
function storage(){
 const entries=new Map();let fail=()=>false;
 return {setFailure:fn=>{fail=fn;},async keys(){return [...entries.keys()];},async delete(n){return entries.delete(n);},async open(name){
  if(!entries.has(name))entries.set(name,new Map());const data=entries.get(name);
  return {async match(r){return data.get(typeof r==='string'?r:r.url)?.clone();},async keys(){return [...data.keys()].map(url=>({url}));},async delete(r){return data.delete(typeof r==='string'?r:r.url);},async put(r,response){const url=typeof r==='string'?r:r.url;if(fail(name,url))throw new DOMException('Injected storage quota failure','QuotaExceededError');data.set(url,response.clone());}};
 }};
}
async function worker(caches,network){
 const handlers={};
 const self={registration:{scope},clients:{async claim(){},async matchAll(){return [];}},skipWaiting:async()=>{},addEventListener:(name,fn)=>handlers[name]=fn};
 const bundle=await build({entryPoints:[new URL('../src/sw.mjs',import.meta.url).pathname],bundle:true,write:false,format:'iife'});
 vm.runInNewContext(bundle.outputFiles[0].text,{self,caches,crypto:webcrypto,URL,Response,TextDecoder,TextEncoder,Uint8Array,DOMException,console,fetch:async url=>network.has(url)?new Response(network.get(url)):new Response('Unavailable',{status:503})});
 const waited=handler=>new Promise((resolve,reject)=>{let p;try{handler({waitUntil:x=>p=x});}catch(error){reject(error);return;}Promise.resolve(p).then(resolve,reject);});
 return {
  install(){return waited(handlers.install);},activate(){return waited(handlers.activate);},
  async message(type){let result;let p;handlers.message({data:{type},ports:[{postMessage:value=>{result=value;}}],waitUntil:x=>p=x});await p;return result;},
  async fetch(path,mode='cors',clientId='client'){let p;handlers.fetch({request:{method:'GET',url:abs(path),mode},clientId,resultingClientId:mode==='navigate'?clientId:'',respondWith:x=>p=x});return p;}
 };
}
const old=fixture('a'.repeat(32),'icon.svg'),next=fixture('b'.repeat(32));
async function markers(caches){const result=[];for(const name of await caches.keys()){const r=await (await caches.open(name)).match(abs('__fishing_complete__'));if(r)result.push({name,...await r.json()});}return result;}

test('worker install is lightweight and online reads do not create a complete library',async()=>{
 const caches=storage(),network=new Map(old.network),runtime=await worker(caches,network);await runtime.install();await runtime.activate();
 assert.deepEqual(await markers(caches),[]);
 assert.equal((await (await runtime.fetch('release.json')).json()).id,old.id);
 assert.equal(await (await runtime.fetch(`releases/${old.id}/app.js`)).text(),old.network.get(abs(`releases/${old.id}/app.js`)).toString());
 assert.deepEqual(await markers(caches),[]);
});

test('explicit PREPARE creates a verified complete library that survives an offline worker restart',async()=>{
 const caches=storage(),network=new Map(old.network),runtime=await worker(caches,network);await runtime.install();
 const status=await runtime.message('PREPARE');assert.equal(status.status.state,'Ready');assert.equal(status.status.releaseId,old.id);
 assert.deepEqual((await markers(caches)).map(m=>m.releaseId),[old.id]);
 network.clear();const offline=await worker(caches,network);await offline.install();
 assert.equal((await offline.fetch('index.html','navigate')).status,200);
 assert.equal((await (await offline.fetch('release.json')).json()).id,old.id);
 assert.equal(await (await offline.fetch(`releases/${old.id}/app.js`)).text(),old.network.get(abs(`releases/${old.id}/app.js`)).toString());
});

test('missing and corrupt explicit updates retain the selected previous complete release',async()=>{
 for(const mode of ['missing','corrupt']){
  const caches=storage(),network=new Map(old.network),runtime=await worker(caches,network);await runtime.message('PREPARE');
  network.clear();for(const [url,bytes] of next.network)network.set(url,bytes);
  const target=abs(`releases/${next.id}/app.js`);if(mode==='missing')network.delete(target);else network.set(target,Buffer.from('corrupt'));
  const result=await runtime.message('PREPARE');assert.equal(result.status.state,'Ready');assert.equal(result.status.releaseId,old.id);assert.match(result.status.message,/previous complete offline library is retained|Asset/);
  assert.deepEqual((await markers(caches)).map(m=>m.releaseId),[old.id]);
  network.clear();const offline=await worker(caches,network);assert.equal((await (await offline.fetch('release.json')).json()).id,old.id);
 }
});

for(const point of ['asset','commit','selection'])test(`quota failure at ${point} preserves the prior selected library and permits retry`,async()=>{
 const caches=storage(),network=new Map(old.network),runtime=await worker(caches,network);await runtime.message('PREPARE');
 const before=await markers(caches),oldName=before[0].name;
 network.clear();for(const [url,bytes] of next.network)network.set(url,bytes);
 caches.setFailure((name,url)=>name!==oldName&&(point==='commit'?url===abs('__fishing_complete__'):point==='selection'?url===abs('__fishing_selected__'):url.endsWith('/app.js')));
 const failed=await runtime.message('PREPARE');assert.equal(failed.status.releaseId,old.id);assert.deepEqual(await markers(caches),before);
 caches.setFailure(()=>false);const ready=await runtime.message('PREPARE');assert.equal(ready.status.releaseId,next.id);
 assert.deepEqual((await markers(caches)).map(m=>m.releaseId),[old.id,next.id]);
 network.clear();const offline=await worker(caches,network);assert.equal((await (await offline.fetch('release.json')).json()).id,next.id);
});

test('tampered prepared content is rejected and only an explicit PREPARE replaces it',async()=>{
 const caches=storage(),network=new Map(old.network),runtime=await worker(caches,network);await runtime.message('PREPARE');
 const [original]=await markers(caches),target=`releases/${old.id}/app.js`;
 await (await caches.open(original.name)).put(abs(target),new Response('tampered'));
 network.clear();const offline=await worker(caches,network);assert.equal((await offline.fetch(target)).status,503);
 const state=await offline.message('STATUS');assert.equal(state.status.state,'Incomplete');
 for(const [url,bytes] of old.network)network.set(url,bytes);
 const repaired=await offline.message('PREPARE');assert.equal(repaired.status.state,'Ready');assert.equal(repaired.status.releaseId,old.id);assert.equal((await markers(caches)).length,2);
 network.clear();const restarted=await worker(caches,network);assert.equal(await (await restarted.fetch(target)).text(),old.network.get(abs(target)).toString());
});

test('release icon rename accepts cached historical names and still requires an icon',()=>{
 for(const icon of ['icon.png','revised-icon.png','icon.svg']){
  const f=fixture('c'.repeat(32),icon);
  assert(validateManifest(f.manifest,f.pointer,'/fishing/v2-preview/').has(icon));
 }
 const f=fixture('d'.repeat(32),'unrecognized.png');
 assert.throws(()=>validateManifest(f.manifest,f.pointer,'/fishing/v2-preview/'),/Missing required release icon/);
});
