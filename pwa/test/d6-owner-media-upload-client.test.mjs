import test from 'node:test';
import assert from 'node:assert/strict';
import {sha256} from '../src/shared.mjs';
import {createD6OwnerMediaUploadCoordinator as create}
 from '../src/d6-owner-media-upload-client.mjs';
const root='https://example.invalid/fishing/';
const gear={id:'owner-lure',category:'lures',
 picture:{src:'Gear/Lures/assets/photo.png'}};
const png=Uint8Array.from([137,80,78,71,13,10,26,10,
 0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,2,0,0,0,
 0,0,0,0,73,69,78,68,0,0,0,0,0,0,0,0]);
const file=(name='photo.png')=>({name,size:png.byteLength,
 arrayBuffer:async()=>png.slice().buffer});
const reply=(data,status=200)=>new Response(JSON.stringify(data),{
 status,headers:{'Content-Type':'application/json'}});
const config={root,enabled:()=>true,readingMode:()=> 'Automatic'};
async function bitmap(fn){
 const before=globalThis.createImageBitmap;
 globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
 try{return await fn();}finally{
  if(before===undefined)delete globalThis.createImageBitmap;
  else globalThis.createImageBitmap=before;
 }
}
function fixture({lostAck=false}={}){
 const calls=[];
 const request=async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith('-csrf'))return reply({ok:true,csrfToken:'A'.repeat(43)});
  if(url.endsWith('/stage')){
   const digest=await sha256(png);
   return reply({ok:true,staged:true,published:false,domain:'gear',
    recordId:gear.id,logicalPath:gear.picture.src,role:'cover',
    sha256:digest,bytes:png.byteLength,width:1,height:1,
    contentType:'image/png',storageKey:'staged/v1/sha256/'+digest});
  }
  if(url.endsWith('/publish')){
   if(lostAck)throw Error('lost acknowledgement');
   const body=JSON.parse(options.body);
   return reply({ok:true,published:true,revision:body.expectedRevision+1,
    record:body.record,notes:body.markdown,
    media:body.media.map(x=>({...x,role:'cover'}))});
  }
  if(url.includes('/content/gear/'))
   return reply({ok:true,record:gear,revision:2,notes:'Owner notes'});
  if(options.method==='HEAD')
   return new Response(null,{status:200,headers:{
    ETag:'"'+await sha256(png)+'"','Content-Type':'image/png',
    'Content-Length':String(png.byteLength)}});
  throw Error('Unexpected endpoint '+url);
 };
 return {request,calls};
}
test('M02 upload defaults OFF; Work Offline never contacts provider',async()=>{
 const f=fixture(),off=create({root,request:f.request});
 await assert.rejects(off.stage({domain:'gear',record:gear,role:'cover',
  logicalPath:gear.picture.src,file:file()}),{code:'DISABLED'});
 const offline=create({root,request:f.request,enabled:()=>true,
  readingMode:()=> 'Work Offline'});
 await assert.rejects(offline.stage({domain:'gear',record:gear,role:'cover',
  logicalPath:gear.picture.src,file:file()}),{code:'DISABLED'});
 assert.equal(f.calls.length,0);
 assert.throws(()=>create({...config,request:f.request,
  root:'https://wrong.invalid/fishing/?q=1'}),{code:'INVALID_ORIGIN'});
});
test('M02 one Gear cover stage → revision-safe publish → D1 and R2 readback',async()=>{
 await bitmap(async()=>{
  const f=fixture(),client=create({...config,request:f.request});
  const staged=await client.stage({domain:'gear',record:gear,
   role:'cover',logicalPath:gear.picture.src,file:file()});
  assert.equal(staged.sha256,await sha256(png));
  const published=await client.publish({domain:'gear',record:gear,
   markdown:'Owner notes',expectedRevision:1,staged:[staged]});
  assert.equal(published.verified,true);
  assert.equal(published.revision,2);
  assert.equal(f.calls.filter(x=>x.url.endsWith('/publish')).length,1);
  assert.equal(f.calls.filter(x=>x.url.endsWith('/stage')).length,1);
  assert.equal(f.calls.filter(x=>x.options.method==='HEAD').length,1);
  assert.equal(f.calls.find(x=>x.url.endsWith('/stage'))
   .options.headers['X-Fish-V3-Intent'],'stage-media');
 });
});
test('M02 client preserves staged receipt on ambiguous publish; no auto-retry',async()=>{
 await bitmap(async()=>{
  const f=fixture({lostAck:true}),client=create({...config,request:f.request});
  const staged=await client.stage({domain:'gear',record:gear,
   role:'cover',logicalPath:gear.picture.src,file:file()});
  await assert.rejects(client.publish({domain:'gear',record:gear,
   markdown:'Owner notes',expectedRevision:1,staged:[staged]}),
   {code:'UNVERIFIED'});
  assert.equal(f.calls.filter(x=>x.url.endsWith('/publish')).length,1);
  await assert.rejects(client.publish({domain:'gear',record:gear,
   markdown:'Owner notes',expectedRevision:1,staged:[staged]}),
   {code:'UNVERIFIED'});
  assert.equal(f.calls.filter(x=>x.url.endsWith('/publish')).length,1);
  await assert.rejects(client.stage({domain:'gear',record:gear,
   role:'cover',logicalPath:gear.picture.src,file:file()}),{code:'DUPLICATE'});
 });
});
test('M02 invalid files and fabricated receipts fail before provider writes',async()=>{
 const f=fixture(),client=create({...config,request:f.request});
 await assert.rejects(client.stage({domain:'gear',record:gear,
  role:'cover',logicalPath:gear.picture.src,file:file('foo.jpg')}),
  {code:'INVALID'});
 await assert.rejects(client.publish({domain:'gear',record:gear,
  markdown:'Owner notes',expectedRevision:1,staged:[{
   domain:'gear',recordId:gear.id,logicalPath:gear.picture.src,
   role:'cover'}]}),{code:'INVALID'});
 assert.equal(f.calls.length,0);
});

test('M02 unknown R2 stage acknowledgement remains blocked without retry',async()=>{
 await bitmap(async()=>{
  const f=fixture();let stageCalls=0;
  const request=async(url,options)=>{
   if(url.endsWith('/stage')){
    stageCalls++;
    throw Error('lost R2 stage acknowledgement');
   }
   return f.request(url,options);
  };
  const client=create({...config,request});
  await assert.rejects(client.stage({domain:'gear',record:gear,
   role:'cover',logicalPath:gear.picture.src,file:file()}),
   {code:'UNVERIFIED'});
  await assert.rejects(client.stage({domain:'gear',record:gear,
   role:'cover',logicalPath:gear.picture.src,file:file()}),
   {code:'DUPLICATE'});
  assert.equal(stageCalls,1);
 });
});
