import test from 'node:test';
import assert from 'node:assert/strict';
import {canonical,sha256} from '../src/shared.mjs';
import {prepareD6OfflineContent,readVerifiedD6OfflineContent,
 verifyD6OfflineContentManifest}
 from '../src/d6-offline-content-preparation.mjs';

const scope='https://example.test/fishing/v3/';
const textBytes=x=>new TextEncoder().encode(x);
const mediaPath='Gear/Lures/assets/one.jpg';
const fakeCaches=()=>{
 const tables=new Map();
 let deny=()=>false;
 const api={
  async open(name){
   if(!tables.has(name))tables.set(name,new Map());
   const rows=tables.get(name);
   return {
    async match(url){return rows.get(url)?.clone()??null;},
    async put(url,response){
     if(deny(name,url))throw Object.assign(new Error('Quota exceeded'),{
      name:'QuotaExceededError'});
     rows.set(url,response.clone());
    },
    async delete(url){return rows.delete(url);},
   };
  },
  async delete(name){return tables.delete(name);},
  setFailure(fn){deny=fn;},
  async corruptImage(){
   const current=await readVerifiedD6OfflineContent({caches:api,scope});
   assert.ok(current);
   const entry=tables.get(current.cacheName);
   const image=current.snapshot.images[0];
   entry.set(new URL('__fishing_v3_content_image__/'+image.sha256,scope).href,
    new Response('corrupt'));
  },
 };
 return api;
};
async function snapshot({rev=1,files=[['one.jpg','image-one']]}={}){
 const r={id:'item-a',picture:{src:mediaPath}};
 const source=canonical(r),markdown='';
 const record={domain:'gear',id:r.id,revision:rev,record:r,
  recordBytes:textBytes(source).length,recordSha256:await sha256(source),
  markdown,markdownBytes:0,markdownSha256:await sha256(markdown)};
 const images=[];
 for(const [file,body] of files){
  const logicalPath='Gear/Lures/assets/'+file;
  const hash=await sha256(body);
  images.push({logicalPath,sha256:hash,bytes:textBytes(body).length,
   mime:'image/jpeg',storageKey:'staged/v1/sha256/'+hash,
   owners:[{domain:'gear',recordId:r.id,role:'cover'}]});
 }
 const unique=new Map(images.map(x=>[x.sha256,x.bytes]));
 const payload={format:'fishing-content-snapshot-v1',
  readerCompatibility:{min:1,max:1},
  schemaVersions:{gear:2,kb:2,catches:2},
  counts:{gear:1,kb:0,catches:0,imagePaths:images.length,
   imageObjects:unique.size,retainedUnlinkedRefs:0},
  bytes:{records:record.recordBytes,markdown:0,
   images:[...unique.values()].reduce((a,b)=>a+b,0)},
  records:[record],images};
 return {contentId:await sha256(canonical(payload)),...payload,
  mediaVerification:'registry-only'};
}
const nonce=()=> 'abcde123-1234-1234-1234-123456789abc';

test('O02 requires explicit call, stages verified images and returns ready only afterward',async()=>{
 const caches=fakeCaches(),data=await snapshot();let requests=0;
 assert.equal(await readVerifiedD6OfflineContent({caches,scope}),null);
 const result=await prepareD6OfflineContent({snapshot:data,caches,scope,nonce,
  fetchImage:async image=>{
   requests++;
   assert.equal(image.logicalPath,mediaPath);
   return new Response('image-one');
  }});
 assert.deepEqual({changed:result.changed,reused:result.reused,
  downloaded:result.downloaded},{changed:true,reused:0,downloaded:1});
 assert.equal(requests,1);
 const selected=await readVerifiedD6OfflineContent({caches,scope});
 assert.equal(selected.contentId,data.contentId);
 const again=await prepareD6OfflineContent({snapshot:data,caches,scope,nonce,
  fetchImage:()=>{throw Error('Unexpected redownload');}});
 assert.equal(again.changed,false);
 assert.equal(again.reused,1);
});

test('O02 reuses hash-verified unchanged R2 bytes and fetches only new image',async()=>{
 const caches=fakeCaches(),old=await snapshot(),newer=await snapshot({
  rev:2,files:[['one.jpg','image-one'],['two.jpg','image-two']]});
 await prepareD6OfflineContent({snapshot:old,caches,scope,nonce,
  fetchImage:async()=>new Response('image-one')});
 const calls=[];
 const result=await prepareD6OfflineContent({
  snapshot:newer,caches,scope,nonce:()=> '2bcde123-1234-1234-1234-123456789abc',
  fetchImage:async image=>{
   calls.push(image.logicalPath);
   return new Response('image-two');
  },
 });
 assert.equal(result.changed,true);
 assert.equal(result.reused,1);
 assert.equal(result.downloaded,1);
 assert.deepEqual(calls,['Gear/Lures/assets/two.jpg']);
 assert.equal((await readVerifiedD6OfflineContent({caches,scope})).contentId,
  newer.contentId);
});

test('O02 rejects R2 size/digest mismatch, retains last good selection',async()=>{
 const caches=fakeCaches(),old=await snapshot(),newer=await snapshot({
  rev:3,files:[['one.jpg','image-one'],['two.jpg','image-two']]});
 await prepareD6OfflineContent({snapshot:old,caches,scope,nonce,
  fetchImage:async()=>new Response('image-one')});
 await assert.rejects(prepareD6OfflineContent({
  snapshot:newer,caches,scope,nonce:()=> '3bcde123-1234-1234-1234-123456789abc',
  fetchImage:async()=>new Response('tampered'),
 }),/O02_CONTENT_UNVERIFIED: R2 image (size|digest) mismatch/);
 assert.equal((await readVerifiedD6OfflineContent({caches,scope})).contentId,
  old.contentId);
});

test('O02 aborts quota failure without selecting incomplete generation',async()=>{
 const caches=fakeCaches(),old=await snapshot(),newer=await snapshot({
  rev:4,files:[['one.jpg','image-one'],['two.jpg','image-two']]});
 await prepareD6OfflineContent({snapshot:old,caches,scope,nonce,
  fetchImage:async()=>new Response('image-one')});
 caches.setFailure((name,url)=>name.includes('generation:')&&
  url.includes('__fishing_v3_content_image__/'));
 await assert.rejects(prepareD6OfflineContent({
  snapshot:newer,caches,scope,nonce:()=> '4bcde123-1234-1234-1234-123456789abc',
  fetchImage:async()=>new Response('image-two'),
 }),/QuotaExceededError|Quota exceeded/);
 assert.equal((await readVerifiedD6OfflineContent({caches,scope})).contentId,
  old.contentId);
});

test('O02 detects storage corruption and never claims Ready',async()=>{
 const caches=fakeCaches(),data=await snapshot();
 await prepareD6OfflineContent({snapshot:data,caches,scope,nonce,
  fetchImage:async()=>new Response('image-one')});
 await caches.corruptImage();
 assert.equal(await readVerifiedD6OfflineContent({caches,scope}),null);
});

test('O02 refuses a tampered manifest before writing or fetching anything',async()=>{
 const caches=fakeCaches(),data=await snapshot(),tampered={
  ...data,records:[{...data.records[0],revision:500}],
 };
 await assert.rejects(verifyD6OfflineContentManifest(tampered),
  /O02_CONTENT_UNVERIFIED: Snapshot identity mismatch/);
 await assert.rejects(prepareD6OfflineContent({
  snapshot:tampered,caches,scope,nonce,
  fetchImage:()=>{throw Error('Unexpected fetch');},
 }),/O02_CONTENT_UNVERIFIED/);
 assert.equal(await readVerifiedD6OfflineContent({caches,scope}),null);
});
