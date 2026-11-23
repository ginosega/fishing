import test from 'node:test';
import assert from 'node:assert/strict';
import {canonical,sha256} from '../src/shared.mjs';
import {createD6OfflineContentTransport}
 from '../src/d6-offline-content-transport.mjs';
import {readVerifiedD6OfflineContent}
 from '../src/d6-offline-content-preparation.mjs';

const root='https://fishing-d6-wp2-test.ginosega.workers.dev/fishing/';
const scope=root;
const origin=new URL(root).origin;
const imagePath='Gear/Lures/assets/owner-original.jpg';
const bytes=value=>new TextEncoder().encode(value);
async function snapshot(rev=1,original='picture-one'){
 const record={id:'private-gear',picture:{src:imagePath}};
 const source=canonical(record),markdown='';
 const digest=await sha256(original);
 const entry={domain:'gear',id:record.id,revision:rev,record,
  recordBytes:bytes(source).length,recordSha256:await sha256(source),
  markdown,markdownBytes:0,markdownSha256:await sha256(markdown)};
 const image={logicalPath:imagePath,sha256:digest,
  bytes:bytes(original).length,mime:'image/jpeg',
  storageKey:'staged/v1/sha256/'+digest,
  owners:[{domain:'gear',recordId:record.id,role:'cover'}]};
 const payload={
  format:'fishing-content-snapshot-v1',
  readerCompatibility:{min:1,max:1},
  schemaVersions:{gear:2,kb:2,catches:2},
  counts:{gear:1,kb:0,catches:0,imagePaths:1,imageObjects:1,
   retainedUnlinkedRefs:0},
  bytes:{records:entry.recordBytes,markdown:0,images:image.bytes},
  records:[entry],images:[image],
 };
 return {contentId:await sha256(canonical(payload)),...payload,
  mediaVerification:'registry-only'};
}
function storage(){
 const tables=new Map();
 return {async open(name){
  if(!tables.has(name))tables.set(name,new Map());
  const rows=tables.get(name);
  return {
   match:async key=>rows.get(key)?.clone()||null,
   put:async(key,value)=>{rows.set(key,value.clone());},
  };
 },async keys(){return [...tables.keys()];},
 async delete(name){return tables.delete(name);}};
}
function transport(current,{image='picture-one',fail=null}={}){
 const calls=[];
 const request=async(url,options)=>{
  calls.push({url,method:options.method,credentials:options.credentials,
   cache:options.cache,redirect:options.redirect});
  if(fail==='network')throw new TypeError('Failed to fetch');
  if(url===origin+'/api/v3/content/offline-snapshot'){
   if(fail==='denied')return new Response('Forbidden',{status:403});
   if(fail==='redirect')return new Response('Moved',{status:302});
   return new Response(JSON.stringify({
    ok:true,version:1,snapshot:current,
   }),{status:200,headers:{'Content-Type':'application/json'}});
  }
  assert.equal(url,origin+'/api/v3/media/live/Gear/Lures/assets/owner-original.jpg');
  if(fail==='image')return new Response('R2 missing',{status:503});
  return new Response(image,{status:200,headers:{
   'Content-Type':'image/jpeg',
   'Content-Length':String(current.images[0].bytes),
  }});
 };
 const client=createD6OfflineContentTransport({
  root,request,enabled:()=>true,readingMode:()=> 'Automatic',
 });
 return {client,calls};
}
test('O02-NET01 constructor has no automatic D1/R2 network activity',async()=>{
 const current=await snapshot(),{client,calls}=transport(current);
 assert.equal(calls.length,0);
 assert.equal((await client.fetchSnapshot()).contentId,current.contentId);
 assert.equal(calls.length,1);
 assert.deepEqual(calls[0],{
  url:origin+'/api/v3/content/offline-snapshot',method:'GET',
  credentials:'same-origin',cache:'no-store',redirect:'manual',
 });
});

test('O02-NET02 explicit owner preparation verifies private originals and current graph',async()=>{
 const current=await snapshot(),caches=storage();
 const {client,calls}=transport(current);
 const events=[],progress=[];
 const result=await client.prepare({caches,scope,
  onStatus:s=>events.push(s),onProgress:s=>progress.push(s)});
 assert.equal(result.changed,true);
 assert.equal(result.downloaded,1);
 assert.equal(result.reused,0);
 assert.equal(result.snapshot.contentId,current.contentId);
 assert.equal(calls.length,2);
 assert(calls.every(x=>x.method==='GET'&&x.credentials==='same-origin'&&
  x.cache==='no-store'&&x.redirect==='manual'));
 assert.deepEqual(events.map(x=>x.phase),[
  'checking','checking','images','images','verifying','complete',
 ]);
 assert.deepEqual(progress.map(x=>[x.completed,x.total]),[[1,1]]);
 assert.equal((await readVerifiedD6OfflineContent({caches,scope})).contentId,
  current.contentId);
 const second=await client.prepare({caches,scope});
 assert.equal(second.changed,false);
 assert.equal(second.downloaded,0);
 assert.equal(second.reused,1);
 assert.equal(calls.length,3,'unchanged generation needs only D1 snapshot GET');
});

test('O02-NET03 disabled or Work Offline state never contacts owner routes',async()=>{
 const current=await snapshot();
 for(const [enabled,readingMode] of [[false,'Automatic'],
  [true,'Work Offline'],[true,'Checking']]){
  let calls=0;
  const client=createD6OfflineContentTransport({root,
   enabled:()=>enabled,readingMode:()=>readingMode,
   request:async()=>{calls++;throw Error('should not be called');},
  });
  await assert.rejects(client.prepare({caches:storage(),scope}),
   error=>error.code==='NOT_ENABLED');
  assert.equal(calls,0);
 }
});

test('O02-NET04 network/authorization/redirect errors cannot advertise readiness',async()=>{
 const current=await snapshot();
 for(const reason of ['network','denied','redirect']){
  const {client}=transport(current,{fail:reason}),caches=storage(),
    events=[];
  await assert.rejects(client.prepare({caches,scope,
   onStatus:x=>events.push(x)}));
  assert.equal(events.at(-1).phase,'error');
  assert.equal(events.at(-1).previousVerified,false);
  assert.equal(events.at(-1).reason,
   reason==='network'?'network':'content');
  assert.equal(await readVerifiedD6OfflineContent({caches,scope}),null);
 }
});

test('O02-NET05 changed R2 bytes or unavailable image retains old selection',async()=>{
 const initial=await snapshot(1,'picture-one'),next=await snapshot(2,'picture-two'),
  caches=storage();
 await transport(initial).client.prepare({caches,scope});
 for(const fail of ['image',null]){
  const testClient=transport(next,{
   fail,image:fail?'picture-two':'tampered-R2',
  }).client;
  const progress=[];
  await assert.rejects(testClient.prepare({caches,scope,
   onStatus:s=>progress.push(s)}));
  assert.equal(progress.at(-1).phase,'error');
  assert.equal((await readVerifiedD6OfflineContent({caches,scope})).contentId,
   initial.contentId,'previously verified content must remain selected');
 }
});

async function seedLegacyCache(caches,content){
 const releaseId='b'.repeat(32);
 const cacheName='fishing-v2:/fishing/:offline:owner-existing:'+releaseId;
 const metadata=await caches.open('fishing-v2:/fishing/:metadata');
 await metadata.put(new URL('__fishing_selected__',scope).href,
  new Response(JSON.stringify({cacheName,releaseId})));
 const legacy=await caches.open(cacheName);
 await legacy.put(new URL('releases/'+releaseId+
  '/content/Gear/Lures/assets/owner-original.jpg',scope).href,
  new Response(content));
 return cacheName;
}
test('O02-NET06 first prep reuses existing FISH091 images only after current SHA proof',async()=>{
 const caches=storage(),current=await snapshot();
 const legacy=await seedLegacyCache(caches,'picture-one');
 const {client,calls}=transport(current);
 const result=await client.prepare({caches,scope});
 assert.equal(result.reused,1);
 assert.equal(result.downloaded,0);
 assert.equal(calls.length,1,'no duplicate image download for current SHA');
 assert((await caches.keys()).includes(legacy),
  'existing FISH091 offline library must remain untouched');
 assert.equal((await readVerifiedD6OfflineContent({caches,scope})).contentId,
  current.contentId);
});

test('O02-NET07 stale FISH091 candidate never bypasses private R2 fetch',async()=>{
 const caches=storage(),current=await snapshot();
 await seedLegacyCache(caches,'corrupt-one');
 const {client,calls}=transport(current);
 const result=await client.prepare({caches,scope});
 assert.equal(result.reused,0);
 assert.equal(result.downloaded,1);
 assert.equal(calls.length,2,'fallback fetches authenticated R2 original');
 assert.equal((await readVerifiedD6OfflineContent({caches,scope})).contentId,
  current.contentId);
});
