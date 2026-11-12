import test from 'node:test';
import assert from 'node:assert/strict';
import {sha256} from '../src/shared.mjs';
import {prepareChange} from '../src/handoff.mjs';
import {expectedD6CanonicalMedia,verifyD6CanonicalMedia,
 D6MediaContractError}
 from '../../experiments/p3/preview/src/d6-production-media-contract.mjs';

const MAIN='a'.repeat(40);
// Real 1x1 PNG fixture, never a provider credential or staged Git blob.
const png=Uint8Array.from(Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==',
 'base64'));
const makeMeta=async path=>({path,bytes:png.length,sha256:await sha256(png)});
const catchRecord={id:'catch-example',date:'2026-11-12'};
const catchPath='Catches/assets/catch-example/notes/photo.png';
const catchPkg=async()=>prepareChange({
 domain:'catches',operation:'add',id:catchRecord.id,record:catchRecord,
 sourceRevision:MAIN,
 text:'![Original](../assets/catch-example/notes/photo.png)',
 notesImages:[await makeMeta(catchPath)],
});
const fail=async(p,code)=>assert.rejects(p,e=>e instanceof
 D6MediaContractError&&e.code===code);

test('WP3-MEDIA01 Catch Notes originals are preserved without a cover field',async()=>{
 const pkg=await catchPkg();
 const expected=expectedD6CanonicalMedia(pkg);
 assert.deepEqual(expected,[await makeMeta(catchPath)]);
 const receipt=await verifyD6CanonicalMedia({
  package:pkg,uploads:[{path:catchPath,bytes:png}],
 });
 assert.equal(receipt.verified,true);
 assert.equal(receipt.canPublish,false);
 assert.equal(receipt.fileCount,1);
 assert.equal(receipt.totalBytes,png.length);
 assert.equal(receipt.files[0].mime,'image/png');
 assert.equal(pkg.record.picture,undefined);
});

test('WP3-MEDIA02 forged or incomplete original bytes cannot pass',async()=>{
 const pkg=await catchPkg();
 await fail(verifyD6CanonicalMedia({package:pkg,uploads:[]}),
  'MEDIA_COUNT_MISMATCH');
 await fail(verifyD6CanonicalMedia({package:pkg,uploads:[
  {path:catchPath,bytes:new Uint8Array(png.length)}
 ]}),'MEDIA_SIGNATURE_MISMATCH');
 const wrong=Uint8Array.from(png);wrong[wrong.length-3]^=1;
 await fail(verifyD6CanonicalMedia({package:pkg,uploads:[
  {path:catchPath,bytes:wrong}
 ]}),'MEDIA_DIGEST_MISMATCH');
 await fail(verifyD6CanonicalMedia({package:pkg,uploads:[
  {path:'Catches/assets/other/notes/photo.png',bytes:png}
 ]}),'UNEXPECTED_MEDIA_PATH');
});

test('WP3-MEDIA03 original Gear representative and Notes images are independent',async()=>{
 const item={id:'example-jig',category:'lures',type:'Jigs',
  name:'Example Jig'};
 const picture='Gear/Lures/assets/example.png';
 const note='Gear/Lures/assets/example-jig/notes/detail.png';
 const pkg=await prepareChange({
  domain:'gear',operation:'add',id:item.id,record:item,
  sourceRevision:MAIN,text:'![Detail](../assets/example-jig/notes/detail.png)',
  pictureAction:'add',picturePath:picture,pictureFile:await makeMeta(picture),
  notesImages:[await makeMeta(note)],
 });
 const expected=expectedD6CanonicalMedia(pkg);
 assert.deepEqual(expected.map(x=>x.path),[picture,note]);
 const r=await verifyD6CanonicalMedia({package:pkg,
  uploads:[{path:note,bytes:png},{path:picture,bytes:png}]});
 assert.equal(r.fileCount,2);assert.equal(r.canPublish,false);
});

test('WP3-MEDIA04 Knot frames require exact ordered metadata and bytes',async()=>{
 const item={id:'example-knot',type:'knot',name:'Example Knot'};
 const frames=['step-01.png','step-02.png'].map(s=>
  'KB/Knots/assets/example-knot/'+s);
 const pkg=await prepareChange({
  domain:'kb',operation:'add',id:item.id,record:item,
  sourceRevision:MAIN,text:'# Example Knot',
  pictureAction:'add',picturePath:frames[1],
  pictureFile:await makeMeta(frames[1]),
  pictureSequenceAction:'set',pictureSequencePaths:frames,
  pictureSequenceFiles:await Promise.all(frames.map(makeMeta)),
 });
 assert.deepEqual(expectedD6CanonicalMedia(pkg).map(x=>x.path),frames);
 const r=await verifyD6CanonicalMedia({
  package:pkg,uploads:frames.map(path=>({path,bytes:png}))});
 assert.equal(r.fileCount,2);
 const missing=structuredClone(pkg);missing.pictureSequence.files.pop();
 await assert.rejects(async()=>expectedD6CanonicalMedia(missing));
});

test('WP3-MEDIA05 rejected duplicates, unsafe paths and unfenced notes',async()=>{
 const pkg=await catchPkg();
 const wrong=structuredClone(pkg);
 wrong.notes.images.push({...wrong.notes.images[0]});
 await assert.rejects(async()=>expectedD6CanonicalMedia(wrong));
 const unsafe=structuredClone(pkg);
 unsafe.notes.images[0].path='../Catches/assets/catch-example/notes/a.png';
 await assert.rejects(async()=>expectedD6CanonicalMedia(unsafe));
 const missing=structuredClone(pkg);missing.notes.action='keep';
 await assert.rejects(async()=>expectedD6CanonicalMedia(missing));
 await fail(verifyD6CanonicalMedia({package:pkg,uploads:[
  {path:catchPath,bytes:png},{path:catchPath,bytes:png},
 ]}),'MEDIA_COUNT_MISMATCH');
});
