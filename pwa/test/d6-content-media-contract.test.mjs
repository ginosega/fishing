import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateD6MediaOwnerPath,publishedD6MediaRole,
 d6ValidKnotSequence,D6_IMAGE_ROLES}
 from '../src/d6-content-media-contract.mjs';
import {createD6ContentImageResolver,d6ResolveImageForDisplay,loadD6PublishedMediaPaths}
 from '../src/d6-content-image-resolver.mjs';
import {validateD6MediaPath} from '../server/d6-shared-media-stage.mjs';

const gear={id:'owner-lure',category:'lures',name:'Owner Lure',
 picture:{src:'Gear/Lures/assets/my-cover.webp'}};
const kb={id:'owner-species',type:'species',name:'Owner Fish',
 picture:{src:'KB/Species/assets/fish-cover.png'}};
const knot={id:'owner-knot',type:'knot',name:'Owner Knot',
 pictureSequence:['KB/Knots/assets/owner-knot/step-01.png',
 'KB/Knots/assets/owner-knot/step-02.webp'],
 picture:{src:'KB/Knots/assets/owner-knot/step-02.webp'}};
const catchRec={id:'catch-test',date:'2026-11-21'};

test('V3-M02-01 Notes, Gear/KB cover, and Knot frames share one path contract',()=>{
 assert.deepEqual(D6_IMAGE_ROLES,['notes','cover','knot-step']);
 const cases=[
  ['gear',gear,gear.picture.src,'cover'],
  ['kb',kb,kb.picture.src,'cover'],
  ['kb',knot,knot.pictureSequence[0],'knot-step'],
  ['kb',knot,knot.pictureSequence[1],'knot-step'],
  ['catches',catchRec,'Catches/assets/catch-test/notes/fish.png','notes'],
 ];
 for(const [domain,record,logicalPath,role] of cases){
  assert.equal(validateD6MediaOwnerPath({domain,record,logicalPath,role}).role,role);
  assert.equal(validateD6MediaPath({domain,record,logicalPath,role}).role,role);
  assert.equal(publishedD6MediaRole({domain,record,logicalPath,
   notesLinked:true}),role);
 }
 assert.equal(d6ValidKnotSequence(knot),true);
});
test('V3-M02-02 unauthorized paths, roles, noncontiguous Knot steps fail closed',()=>{
 for(const c of [
  {domain:'catches',record:catchRec,logicalPath:'Catches/assets/cover.png',role:'cover'},
  {domain:'gear',record:gear,logicalPath:'Gear/Lures/assets/foo/nested.png',role:'cover'},
  {domain:'gear',record:gear,logicalPath:'Gear/Lures/assets/foo.png',role:'knot-step'},
  {domain:'kb',record:kb,logicalPath:'KB/Knots/assets/owner-species/step-01.png',role:'knot-step'},
  {domain:'kb',record:knot,logicalPath:'KB/Knots/assets/owner-knot/step-01.svg',role:'knot-step'},
  {domain:'kb',record:knot,logicalPath:'KB/Knots/assets/other/step-01.png',role:'knot-step'},
  {domain:'gear',record:gear,logicalPath:'Gear/Lures/assets/../bad.png',role:'cover'},
  {domain:'gear',record:gear,logicalPath:'Gear/Lures/assets/my-cover.webp',role:'unknown'},
 ])assert.throws(()=>validateD6MediaOwnerPath(c),/MEDIA_INVALID|Unsafe/);
 assert.equal(publishedD6MediaRole({
  domain:'gear',record:gear,logicalPath:'Gear/Lures/assets/other.png'}),null);
 assert.equal(publishedD6MediaRole({
  domain:'gear',record:gear,logicalPath:'Gear/Lures/assets/owner-lure/notes/new.png',
  notesLinked:false}),null);
 const bad={...knot,pictureSequence:[
  'KB/Knots/assets/owner-knot/step-01.png',
  'KB/Knots/assets/owner-knot/step-03.png',
 ],picture:{src:'KB/Knots/assets/owner-knot/step-03.png'}};
 assert.equal(d6ValidKnotSequence(bad),false);
 assert.equal(publishedD6MediaRole({domain:'kb',record:bad,
  logicalPath:bad.pictureSequence[0]}),null);
 assert.equal(d6ValidKnotSequence({...knot,picture:{src:knot.pictureSequence[0]}}),false);
 assert.equal(d6ValidKnotSequence({...knot,pictureSequence:[...knot.pictureSequence,
  knot.pictureSequence[1]]}),false);
});
test('V3-M02-03 image resolver defaults OFF and enforces release/media separation',()=>{
 const root='https://example.invalid/fishing/';
 const publishedPaths=new Set([gear.picture.src,knot.pictureSequence[0]]);
 const off=createD6ContentImageResolver({root,publishedPaths});
 assert.equal(off.resolve(gear.picture.src),null);
 assert.equal(d6ResolveImageForDisplay(gear.picture.src,{
  verifiedLive:off,frozenAsset:p=>'https://example.invalid/release/'+p}),
  'https://example.invalid/release/'+gear.picture.src);
 const on=createD6ContentImageResolver({root,
  publishedPaths,enabled:()=>true,readingMode:()=> 'Automatic'});
 assert.equal(on.resolve(gear.picture.src),
  'https://example.invalid/api/v3/media/live/Gear/Lures/assets/my-cover.webp');
 assert.equal(on.resolve(knot.pictureSequence[0]),
  'https://example.invalid/api/v3/media/live/KB/Knots/assets/owner-knot/step-01.png');
 assert.equal(on.resolve('Gear/Lures/assets/unpublished.png'),null);
 // The resolver snapshots verified D1 paths; callers cannot grant new reads
 // through mutation of the Set after readiness was established.
 publishedPaths.add('Gear/Lures/assets/unpublished.png');
 assert.equal(on.resolve('Gear/Lures/assets/unpublished.png'),null);
 // A ready R2 authority never silently falls back to stale release images.
 assert.equal(d6ResolveImageForDisplay('Gear/Lures/assets/unpublished.png',{
  verifiedLive:on,frozenAsset:()=> 'STALE_RELEASE'}),null);
 assert.equal(d6ResolveImageForDisplay('Gear/Lures/assets/unpublished.png',{
  verifiedLive:on,strictOnline:true,frozenAsset:()=> 'STALE_RELEASE'}),null);
 assert.equal(d6ResolveImageForDisplay(gear.picture.src,{
  verifiedLive:on,strictOnline:true,frozenAsset:()=> 'STALE_RELEASE'}),
  on.resolve(gear.picture.src));
 const offline=createD6ContentImageResolver({root,
  publishedPaths,enabled:()=>true,readingMode:()=> 'Work Offline'});
 assert.equal(offline.resolve(gear.picture.src),null);
 for(const invalid of ['https://attacker.invalid/image.jpg','../escape.png',
  '/Gear/Lures/assets/my-cover.webp','Gear//Lures/assets/my-cover.webp']){
  assert.equal(on.resolve(invalid),null);
 }
});
test('V3-M02-04 active reader cannot be spoofed using another origin or path',()=>{
 for(const root of ['http://example.invalid/fishing/',
  'https://example.invalid/untrusted/',
  'https://user:password@example.invalid/fishing/',
  'https://example.invalid/fishing/?unsafe=1']){
  assert.throws(()=>createD6ContentImageResolver({root}),/ORIGIN_INVALID/);
 }
 const source=readFileSync(new URL('../server/d6-direct-gear-worker.mjs',
  import.meta.url),'utf8');
 assert.ok(source.includes("env.D6_M02_MEDIA_ENABLED==='true'"));
 // Importing an OFF-by-default handler is not provider activation.
 const config=JSON.parse(readFileSync(new URL(
  '../wrangler.direct-gear-private.jsonc',import.meta.url),'utf8'));
 assert.equal(config.vars.D6_M02_MEDIA_ENABLED,'true');
 assert.deepEqual(config.r2_buckets,[{
  binding:'MEDIA_R2',bucket_name:'fishing-v3-owner-media-test',
 }]);
 const contract=readFileSync(new URL('../src/d6-content-image-resolver.mjs',
  import.meta.url),'utf8');
 assert.doesNotMatch(contract,/fetch\(|localStorage|sessionStorage/);
});

test('M02 D1 media manifest loads only in approved Automatic mode',async()=>{
 const root='https://example.invalid/fishing/',calls=[];
 const request=async(url,options)=>{
  calls.push({url,options});
  return new Response(JSON.stringify({ok:true,version:1,paths:[
   gear.picture.src,knot.pictureSequence[0],
  ]}),{status:200,headers:{'Content-Type':'application/json'}});
 };
 const config={root,request,enabled:()=>true,readingMode:()=> 'Automatic'};
 for(const disabled of [{enabled:()=>false},{readingMode:()=> 'Work Offline'}]){
  await assert.rejects(loadD6PublishedMediaPaths({...config,...disabled}),
   /MEDIA_REGISTRY_DISABLED/);
 }
 assert.equal(calls.length,0,'not a single offline/provider request');
 const paths=await loadD6PublishedMediaPaths(config);
 assert.equal(paths.size,2);
 const resolver=createD6ContentImageResolver({
  root,enabled:()=>true,readingMode:()=> 'Automatic',
  publishedPaths:paths,
 });
 assert.ok(resolver.resolve(gear.picture.src)?.includes('/api/v3/media/live/'));
 assert.equal(resolver.resolve('Gear/Lures/assets/unpublished.png'),null);
 assert.deepEqual(calls.map(x=>x.url),[
  'https://example.invalid/api/v3/media/manifest',
 ]);
 assert.equal(calls[0].options.credentials,'same-origin');
 assert.equal(calls[0].options.method,'GET');
});
test('M02 unverified D1 media manifest fails before any live-image authorization',async()=>{
 const root='https://example.invalid/fishing/';
 const config={root,enabled:()=>true,readingMode:()=> 'Automatic'};
 const payloads=[
  {ok:true,version:1,paths:[gear.picture.src,gear.picture.src]},
  {ok:true,version:1,paths:['../private.jpg']},
  {ok:true,version:1,paths:['https://elsewhere.invalid/x.png']},
  {ok:true,version:1,paths:['Gear/Lures/assets/image.svg']},
  {ok:true,version:2,paths:[gear.picture.src]},
 ];
 for(const data of payloads){
  await assert.rejects(loadD6PublishedMediaPaths({...config,
   request:async()=>new Response(JSON.stringify(data),{
    status:200,headers:{'Content-Type':'application/json'},
   }),
  }),/MEDIA_REGISTRY_UNVERIFIED/);
 }
 await assert.rejects(loadD6PublishedMediaPaths({...config,
  request:async()=>new Response(JSON.stringify({
   ok:true,version:1,paths:[gear.picture.src],
  }),{status:403,headers:{'Content-Type':'application/json'}}),
 }),/MEDIA_REGISTRY_SIGN_IN_REQUIRED/);
 for(const bad of ['http://example.invalid/fishing/',
  'https://example.invalid/other/']){
  await assert.rejects(loadD6PublishedMediaPaths({...config,root:bad,
   request:async()=>{throw Error('MUST NOT CALL');},
  }),/MEDIA_REGISTRY_INVALID/);
 }
});
