import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {webcrypto,createHash} from 'node:crypto';
import {build} from 'esbuild';
const scope='https://example.test/fishing/v2-preview/',abs=p=>new URL(p,scope).href;
const hash=x=>createHash('sha256').update(x).digest('hex');
function fixture(id){
 const schemaVersions={gear:2,kb:2,catches:2};
 const paths=['index.html','loader.js','sw.js','manifest.webmanifest','icon.svg',`releases/${id}/app.js`,`releases/${id}/styles.css`,...['Gear/gear','KB/kb','Catches/catches'].map(p=>`releases/${id}/content/${p}.json`)];
 const network=new Map(paths.map(p=>[abs(p),Buffer.from(p+' '+id)]));
 const files=paths.map(path=>({path,bytes:network.get(abs(path)).length,sha256:hash(network.get(abs(path)))}));
 const manifest={format:'fishing-companion-release-v2',releaseId:id,sourceRevision:id,base:'/fishing/v2-preview/',schemaVersions,files,totalBytes:files.reduce((n,e)=>n+e.bytes,0)};
 const bytes=Buffer.from(JSON.stringify(manifest));
 const pointer={id,sourceRevision:id,schemaVersions,manifest:`releases/${id}/manifest.json`,manifestSha256:hash(bytes)};
 network.set(abs(pointer.manifest),bytes);network.set(abs('release.json'),Buffer.from(JSON.stringify(pointer)));
 return {id,network};
}
function storage(){
 const entries=new Map();let fail=()=>false;
 return {setFailure:fn=>{fail=fn;},async keys(){return [...entries.keys()];},async delete(n){return entries.delete(n);},async open(name){
  if(!entries.has(name))entries.set(name,new Map());const data=entries.get(name);
  return {async match(r){return data.get(typeof r==='string'?r:r.url)?.clone();},async keys(){return [...data.keys()].map(url=>({url}));},async put(r,response){const url=typeof r==='string'?r:r.url;if(fail(name,url))throw new DOMException('Injected storage quota failure','QuotaExceededError');data.set(url,response.clone());}};
 }};
}
async function worker(release,caches,network){
 const handlers={};
 const self={registration:{scope},clients:{async claim(){},async matchAll(){return [];}},skipWaiting:async()=>{},addEventListener:(name,fn)=>handlers[name]=fn};
 const bundle=await build({entryPoints:[new URL('../src/sw.mjs',import.meta.url).pathname],bundle:true,write:false,format:'iife',define:{__RELEASE_ID__:JSON.stringify(release.id)}});
 vm.runInNewContext(bundle.outputFiles[0].text,{self,caches,crypto:webcrypto,URL,Response,TextDecoder,TextEncoder,Uint8Array,console,fetch:async url=>network.has(url)?new Response(network.get(url)):new Response('Unavailable',{status:503})});
 return {async install(){let p;handlers.install({waitUntil:x=>p=x});return p;},async fetch(path){let p;handlers.fetch({request:{method:'GET',url:abs(path),mode:'cors'},respondWith:x=>p=x});return p;}};
}
const old=fixture('a'.repeat(32)),next=fixture('b'.repeat(32));
async function markers(caches){const result=[];for(const name of await caches.keys()){const r=await (await caches.open(name)).match(abs('__fishing_complete__'));if(r)result.push({name,...await r.json()});}return result;}
test('missing and corrupt updates retain complete old release and immutable bytes',async()=>{
 const caches=storage(),network=new Map(old.network),first=await worker(old,caches,network);await first.install();
 for(const mode of ['missing','corrupt']){
  for(const [url,bytes] of next.network)network.set(url,bytes);
  const target=abs(`releases/${next.id}/app.js`);if(mode==='missing')network.delete(target);else network.set(target,Buffer.from('corrupt'));
  await assert.rejects((await worker(next,caches,network)).install());
  assert.deepEqual((await markers(caches)).map(m=>m.releaseId),[old.id]);
  network.clear();assert.equal((await (await first.fetch('release.json')).json()).id,old.id);
  assert.equal(await (await first.fetch(`releases/${old.id}/app.js`)).text(),old.network.get(abs(`releases/${old.id}/app.js`)).toString());
 }
});
for(const point of ['asset','commit'])test(`quota failure at ${point} preserves last good and permits retry`,async()=>{
 const caches=storage(),network=new Map(old.network);await (await worker(old,caches,network)).install();
 const before=await markers(caches),oldName=before[0].name;
 for(const [url,bytes] of next.network)network.set(url,bytes);
 caches.setFailure((name,url)=>name!==oldName&&(point==='commit'?url===abs('__fishing_complete__'):url.endsWith('/app.js')));
 const updating=await worker(next,caches,network);await assert.rejects(updating.install(),/quota/);
 assert.deepEqual(await markers(caches),before);assert.equal((await caches.keys()).length,1);
 caches.setFailure(()=>false);await updating.install();
 assert.deepEqual((await markers(caches)).map(m=>m.releaseId),[old.id,next.id]);
 network.clear();assert.equal((await (await updating.fetch('release.json')).json()).id,next.id);
 assert.equal(await (await updating.fetch(`releases/${old.id}/app.js`)).text(),old.network.get(abs(`releases/${old.id}/app.js`)).toString());
});
test('failed same-release repair preserves generation; corrupt content is rejected then recovered',async()=>{
 const caches=storage(),network=new Map(old.network),runtime=await worker(old,caches,network);await runtime.install();
 const [original]=await markers(caches),target=`releases/${old.id}/app.js`;
 await (await caches.open(original.name)).put(abs(target),new Response('tampered'));
 caches.setFailure((name,url)=>name!==original.name&&url.endsWith('__fishing_complete__'));
 await assert.rejects(runtime.install(),/quota/);assert.deepEqual(await markers(caches),[original]);
 network.clear();assert.equal((await runtime.fetch(target)).status,503);
 for(const [url,bytes] of old.network)network.set(url,bytes);
 caches.setFailure(()=>false);await runtime.install();assert.equal((await markers(caches)).length,2);
 network.clear();assert.equal(await (await runtime.fetch(target)).text(),old.network.get(abs(target)).toString());
});
