import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareChange} from '../../../../pwa/src/handoff.mjs';
import {sha256} from '../../../../pwa/src/shared.mjs';
import {verifyD4MediaManifest,D4MediaError}
 from '../src/d4-media-integrity.mjs';

const SHA='a'.repeat(40),jpg=new Uint8Array([255,216,255,224,1,1,0,255]);
const png=new Uint8Array([137,80,78,71,13,10,26,10,1,2]);
const fail=code=>e=>e instanceof D4MediaError&&e.code===code;
const meta=async(path,bytes)=>({path,bytes:bytes.length,sha256:await sha256(bytes)});
async function single(){
 const path='Gear/Lures/assets/Original.jpg',m=await meta(path,jpg);
 const record={id:'test-lure',category:'lures',type:'Spoons',name:'Test',
  picture:{src:path}};
 const pkg=await prepareChange({domain:'gear',operation:'add',
  record,id:record.id,sourceRevision:SHA,
  pictureAction:'add',picturePath:path,pictureFile:m,
 });
 return {pkg,path};
}
async function knot(){
 const a='KB/Knots/assets/test-knot/step-01.png';
 const b='KB/Knots/assets/test-knot/step-02.jpg';
 const metadata=[await meta(a,png),await meta(b,jpg)];
 const record={id:'test-knot',type:'knot',name:'Synthetic knot',
  pictureSequence:[a,b],picture:{src:b}};
 const pkg=await prepareChange({domain:'kb',operation:'add',
  id:record.id,record,sourceRevision:SHA,
  pictureAction:'add',picturePath:b,
  pictureSequenceAction:'set',pictureSequencePaths:[a,b],
  pictureSequenceFiles:metadata,
  notesPath:'KB/Knots/content/Synthetic knot.md',text:'# Synthetic knot',
 });
 return {pkg,a,b};
}
test('D4-M01 one original image is represented by exact bytes and SHA without transcode',async()=>{
 const {pkg,path}=await single();
 const result=await verifyD4MediaManifest({package:pkg,
  uploads:[{path,bytes:jpg}]});
 assert.equal(result.verified,true);
 assert.equal(result.fileCount,1);
 assert.equal(result.totalBytes,jpg.length);
 assert.deepEqual(result.files[0],{
  path,bytes:jpg.length,sha256:await sha256(jpg),mime:'image/jpeg',
 });
});
test('D4-M02 correct ordered Knot frames and representative final image pass',async()=>{
 const {pkg,a,b}=await knot();
 const result=await verifyD4MediaManifest({package:pkg,
  uploads:[{path:b,bytes:jpg},{path:a,bytes:png}]});
 assert.deepEqual(result.files.map(x=>x.path),[b,a]);
 assert.equal(result.fileCount,2);
 assert.equal(result.totalBytes,jpg.length+png.length);
});
test('D4-M03 missing or additional originals cannot be silently omitted',async()=>{
 const {pkg,a,b}=await knot();
 await assert.rejects(verifyD4MediaManifest({package:pkg,
  uploads:[{path:b,bytes:jpg}]}),fail('MEDIA_COUNT_MISMATCH'));
 await assert.rejects(verifyD4MediaManifest({package:pkg,
  uploads:[{path:b,bytes:jpg},{path:a,bytes:png},
   {path:'Gear/Lures/assets/unrequested.jpg',bytes:jpg}]}),
 fail('MEDIA_COUNT_MISMATCH'));
 const x=await single();
 await assert.rejects(verifyD4MediaManifest({package:x.pkg,
  uploads:[{path:'Gear/Lures/assets/unrequested.jpg',bytes:jpg}]}),
 fail('UNEXPECTED_MEDIA_PATH'));
});
test('D4-M04 altered original bytes and wrong metadata length fail closed',async()=>{
 const {pkg,path}=await single();
 const corrupt=new Uint8Array(jpg);corrupt[4]^=1;
 await assert.rejects(verifyD4MediaManifest({package:pkg,
  uploads:[{path,bytes:corrupt}]}),fail('MEDIA_DIGEST_MISMATCH'));
 await assert.rejects(verifyD4MediaManifest({package:pkg,
  uploads:[{path,bytes:jpg.slice(0,-1)}]}),fail('MEDIA_LENGTH_MISMATCH'));
});
test('D4-M05 spoofed MIME extension, wrong upload path and unsafe path fail',async()=>{
 const {pkg,path}=await single();
 await assert.rejects(verifyD4MediaManifest({package:pkg,
  uploads:[{path,bytes:png}]}),fail('MEDIA_LENGTH_MISMATCH'));
 const tampered=structuredClone(pkg);
 tampered.picture.path='Gear/Lures/assets/Original.png';
 tampered.picture.file=await meta(tampered.picture.path,jpg);
 await assert.rejects(verifyD4MediaManifest({package:tampered,
  uploads:[{path:tampered.picture.path,bytes:jpg}]}),
 fail('MEDIA_SIGNATURE_MISMATCH'));
 const x=structuredClone(pkg);
 x.picture.path='Gear/../private.jpg';
 await assert.rejects(verifyD4MediaManifest({package:x,
  uploads:[{path:x.picture.path,bytes:jpg}]}),fail('INVALID_PACKAGE'));
});
test('D4-M06 duplicate frame names or invalid Knot sequence metadata fail',async()=>{
 const {pkg,a,b}=await knot();
 const missingMeta=structuredClone(pkg);
 delete missingMeta.pictureSequence.files;
 await assert.rejects(verifyD4MediaManifest({package:missingMeta,
  uploads:[{path:a,bytes:png},{path:b,bytes:jpg}]}),
 fail('INVALID_SEQUENCE'));
 const wrongFrame=structuredClone(pkg);
 wrongFrame.pictureSequence.paths[0]='KB/Knots/assets/test-knot/step-03.png';
 wrongFrame.pictureSequence.files[0].path=wrongFrame.pictureSequence.paths[0];
 await assert.rejects(verifyD4MediaManifest({package:wrongFrame,
  uploads:[{path:wrongFrame.pictureSequence.paths[0],bytes:png},{path:b,bytes:jpg}]}),
 fail('INVALID_SEQUENCE'));
});
test('D4-M07 no-media or Catch submission never accepts unexpected originals',async()=>{
 const {pkg,path}=await single();
 const keep=structuredClone(pkg);
 keep.picture={action:'keep'};
 await assert.rejects(verifyD4MediaManifest({package:keep,
  uploads:[{path,bytes:jpg}]}),fail('MEDIA_COUNT_MISMATCH'));
 const catchPkg={...keep,domain:'catches'};
 const empty=await verifyD4MediaManifest({package:catchPkg,uploads:[]});
 assert.equal(empty.fileCount,0,'A Catch with no Notes image is still valid');
 await assert.rejects(verifyD4MediaManifest({package:catchPkg,
  uploads:[{path,bytes:jpg}]}),fail('MEDIA_COUNT_MISMATCH'));
});
