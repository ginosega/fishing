import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateD6MediaOwnerPath,publishedD6MediaRole,
 d6ValidKnotSequence,D6_IMAGE_ROLES}
 from '../src/d6-content-media-contract.mjs';
import {createD6ContentImageResolver,d6ResolveImageForDisplay}
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
 assert.doesNotMatch(source,/d6-shared-media-(?:stage|live)/);
 const contract=readFileSync(new URL('../src/d6-content-image-resolver.mjs',
  import.meta.url),'utf8');
 assert.doesNotMatch(contract,/fetch\(|localStorage|sessionStorage/);
});
