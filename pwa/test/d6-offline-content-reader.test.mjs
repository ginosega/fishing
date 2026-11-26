import test from 'node:test';
import assert from 'node:assert/strict';
import {canonical,sha256} from '../src/shared.mjs';
import {prepareD6OfflineContent,readVerifiedD6OfflineContent}
 from '../src/d6-offline-content-preparation.mjs';
import {readD6OfflineContent} from '../src/d6-offline-content-reader.mjs';
import {readD6OfflineImage} from '../src/d6-offline-content-image-route.mjs';
import {chooseD6BootstrapContent} from '../src/d6-online-content-bootstrap.mjs';
import {createD6DirectContentFixture}
 from './support/d6-online-content-fixture.mjs';

const scope='https://example.test/fishing/';
const imagePath='Gear/Lures/assets/test-cover.jpg';
const bytes=new TextEncoder().encode('test-image-binary');
const cacheStorage=()=>{
 const tables=new Map();
 return {
  async open(name){
   if(!tables.has(name))tables.set(name,new Map());
   const rows=tables.get(name);
   return {
    async match(url){return rows.get(url)?.clone()??null;},
    async put(url,value){rows.set(url,value.clone());},
   };
  },
  async delete(name){return tables.delete(name);},
  async keys(){return [...tables.keys()];},
  async tamper(name,key,value){
   tables.get(name)?.set(key,new Response(value));
  },
 };
};
async function fixture(){
 const h=createD6DirectContentFixture();
 const [gear,kb,catches]=await Promise.all([
  h.v3.directGearClient.list(),h.v3.directKBClient.list(),
  h.v3.directCatchClient.list(),
 ]);
 gear[0].picture={src:imagePath};
 catches[0].speciesId=kb[0].id;
 const snapshotRecords=[],content={
  gear,kb,catches,
 };
 for(const [domain,rows] of Object.entries(content))
  for(const record of rows){
   const text=domain==='kb'?'# Offline Knowledge Base':
    domain==='catches'?'Current Catch Notes':'';
   const canonicalRecord=canonical(record);
   snapshotRecords.push({domain,id:record.id,revision:1,record,
    recordBytes:new TextEncoder().encode(canonicalRecord).length,
    recordSha256:await sha256(canonicalRecord),
    markdown:text,markdownBytes:new TextEncoder().encode(text).length,
    markdownSha256:await sha256(text)});
  }
 const digest=await sha256(bytes);
 const image={logicalPath:imagePath,sha256:digest,bytes:bytes.length,
  mime:'image/jpeg',storageKey:'staged/v1/sha256/'+digest,
  owners:[{domain:'gear',recordId:gear[0].id,role:'cover'}]};
 const payload={
  format:'fishing-content-snapshot-v1',
  readerCompatibility:{min:1,max:1},
  schemaVersions:{gear:2,kb:2,catches:2},
  counts:{gear:gear.length,kb:kb.length,catches:catches.length,
   imagePaths:1,imageObjects:1,retainedUnlinkedRefs:0},
  bytes:{records:snapshotRecords.reduce((n,r)=>n+r.recordBytes,0),
   markdown:snapshotRecords.reduce((n,r)=>n+r.markdownBytes,0),
   images:bytes.length},
  records:snapshotRecords,images:[image],
 };
 const snapshot={contentId:await sha256(canonical(payload)),...payload,
  mediaVerification:'registry-only'};
 const caches=cacheStorage();
 await prepareD6OfflineContent({snapshot,caches,scope,
  nonce:()=> 'abcde123-1234-1234-1234-123456789abc',
  fetchImage:async()=>new Response(bytes),
 });
 return {h,caches,snapshot,image};
}
test('O03-READ01 full V3 Gear KB Catches and Markdown from verified cache',async()=>{
 const f=await fixture();
 const selected=await readD6OfflineContent({caches:f.caches,scope});
 assert.equal(selected.source,'v3-content');
 assert.equal(selected.contentId,f.snapshot.contentId);
 assert.deepEqual([
  selected.data.gear.items.length,selected.data.kb.entities.length,
  selected.data.catches.catches.length],[100,60,12]);
 assert.equal(selected.markdown.get(f.snapshot.records.find(r=>r.domain==='kb').record.content),
  '# Offline Knowledge Base');
 assert.equal(selected.markdown.get(f.snapshot.records.find(r=>r.domain==='catches').record.notes),
  'Current Catch Notes');
 assert.equal(selected.image(imagePath),
  scope+'__fishing_v3_content_image__/'+f.image.sha256);
 assert.equal(selected.thumbnail(imagePath),selected.image(imagePath));
 assert.equal(selected.image('Gear/Lures/assets/nonexistent.jpg'),null);
});
test('O03-READ02 offline bootstrap performs zero provider or legacy fetches',async()=>{
 const f=await fixture();
 const reader=()=>readD6OfflineContent({caches:f.caches,scope});
 const observed=f.h.reads().length;
 let modeReads=0;
 for(const [online,mode] of [[true,'Work Offline'],[false,'Automatic']]){
  const selected=await chooseD6BootstrapContent({
   v3:{...f.h.v3,offlineContentReader:reader},online,
   readMode:async()=>{modeReads++;return mode;},
   loadRelease:()=>{throw Error('Legacy release content must not be read');},
  });
  assert.equal(selected.source,'v3-content');
  assert.equal(selected.offlineReader.data,selected.data);
  assert.equal(selected.readingMode,mode);
 }
 assert.equal(modeReads,2);
 assert.equal(f.h.reads().length,observed);
});
test('O03-READ03 image SW route serves only original verified bytes',async()=>{
 const f=await fixture();
 const result=await readD6OfflineImage({
  caches:f.caches,scope,digest:f.image.sha256,
 });
 assert.equal(result.status,200);
 assert.equal(result.headers.get('Content-Type'),'image/jpeg');
 assert.equal(await sha256(await result.arrayBuffer()),f.image.sha256);
 assert.equal((await readD6OfflineImage({
  caches:f.caches,scope,digest:'a'.repeat(64),
 })).status,503);
 assert.equal((await readD6OfflineImage({
  caches:f.caches,scope,digest:'bad',
 })).status,503);
});
test('O03-READ04 corrupt image blocks both content reader and SW image response',async()=>{
 const f=await fixture();
 const selected=await readVerifiedD6OfflineContent({caches:f.caches,scope});
 await f.caches.tamper(selected.cacheName,
  scope+'__fishing_v3_content_image__/'+f.image.sha256,'corrupt');
 await assert.rejects(readD6OfflineContent({caches:f.caches,scope}),
  /current offline content library is unavailable/i);
 assert.equal((await readD6OfflineImage({
  caches:f.caches,scope,digest:f.image.sha256,
 })).status,503);
});
test('O03-READ05 missing referenced current image rejects even internally coherent metadata',async()=>{
 const f=await fixture();
 // Remove picture bytes declaration AND body through a new generation:
 // O01 would reject this before issuing it, and O03 also fails closed.
 const first=f.snapshot.records.find(r=>r.domain==='gear');
 const metadata={...f.snapshot,images:[],counts:{
  ...f.snapshot.counts,imagePaths:0,imageObjects:0,
 },bytes:{...f.snapshot.bytes,images:0}};
 const {contentId,mediaVerification,...rest}=metadata;
 metadata.contentId=await sha256(canonical(rest));
 const caches=cacheStorage();
 await prepareD6OfflineContent({snapshot:metadata,caches,scope,
  nonce:()=> 'fbcde123-1234-1234-1234-123456789abc',
  fetchImage:()=>{throw Error('no bytes expected');}});
 assert.ok(first.record.picture);
 await assert.rejects(readD6OfflineContent({caches,scope}),
  /current offline content library is unavailable/i);
});
