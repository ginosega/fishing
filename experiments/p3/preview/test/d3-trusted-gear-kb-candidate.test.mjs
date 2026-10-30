import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareChange,narrativePath} from '../../../../pwa/src/handoff.mjs';
import {createD3TrustedGearKBCandidate,D3CandidateError}
 from '../src/d3-trusted-gear-kb-candidate.mjs';

const ID=1430581407,OWNER=265665562;
const SHA='89be79a9c933dd36bd909edd585091232831c835';
const NEXT='a'.repeat(40);
const PATH='KB/Locations/content/P3 Test Lake.md';
const NOTE='# P3 Test Lake\n\nThis is a synthetic fixture for isolated publishing validation.\n';
const data={
 gear:{schemaVersion:2,items:[{
  id:'p3-test-rod',category:'rods-reels',type:'Spinning rod',
  name:'P3 Test Rod D2 Verification',manufacturer:'Fixture Only',
 }]},
 kb:{schemaVersion:2,entities:[{
  id:'location-p3-test-lake',type:'location',name:'P3 Test Lake',content:PATH,
 }]},
 catches:{schemaVersion:2,catches:[]},
};
const fail=code=>e=>e instanceof D3CandidateError&&e.code===code;
const source=(rev=SHA,records=data)=>({
 repositoryId:ID,sourceRevision:rev,
 data:structuredClone(records),
 files:new Set([PATH]),markdown:new Map([[PATH,NOTE]]),
});
function fixture({rev=SHA,records=data,enabled=true}={}){
 let reads=0;
 const candidate=createD3TrustedGearKBCandidate({
  enabled:()=>enabled,
  loadSnapshot:async()=>{reads++;return source(rev,records);},
 });
 return {candidate,get reads(){return reads;}};
}
const opts=packageValue=>({package:packageValue,repositoryId:ID,
 ownerGitHubId:OWNER,expectedMainSha:SHA});
async function editGear(){
 const original=structuredClone(data.gear.items[0]),changed={
  ...original,name:'P3 Test Rod D3 Verified',
 };
 return prepareChange({domain:'gear',operation:'edit',id:original.id,
  baseRecord:original,record:changed,sourceRevision:SHA,
  baseText:'',text:''});
}
async function editKB(text=NOTE+'\nAdded a safe field note.\n'){
 const original=structuredClone(data.kb.entities[0]);
 return prepareChange({domain:'kb',operation:'edit',id:original.id,
  baseRecord:original,record:original,sourceRevision:SHA,
  baseText:NOTE,text,notesPath:PATH});
}
async function addKB(){
 const record={id:'location-p3-new-lake',type:'location',name:'P3 New Lake'};
 return prepareChange({domain:'kb',operation:'add',id:record.id,
  record,sourceRevision:SHA,text:'# P3 New Lake\n\nSynthetic D3 location.\n',
  notesPath:narrativePath('kb',record)});
}
test('D3-S01 default hard-off rejects before loading any current source',async()=>{
 let count=0;
 const v=createD3TrustedGearKBCandidate({
  loadSnapshot:async()=>{count++;return source();},
 });
 await assert.rejects(v.plan(opts(await editGear())),fail('DISABLED'));
 assert.equal(count,0);
});
test('D3-S02 existing Gear edit preserves exact source and emits one canonical JSON candidate',async()=>{
 const x=fixture(),result=await x.candidate.plan(opts(await editGear()));
 assert.equal(x.reads,1);
 assert.equal(result.validated,true);
 assert.equal(result.repositoryId,ID);
 assert.equal(result.sourceRevision,SHA);
 assert.equal(result.domain,'gear');
 assert.equal(result.changes.length,1);
 assert.equal(result.changes[0].path,'pwa/Gear/gear.json');
 assert.equal(JSON.parse(result.changes[0].body).items[0].name,'P3 Test Rod D3 Verified');
});
test('D3-S03 Knowledge Base Markdown edit generates atomic canonical + Markdown candidates',async()=>{
 const x=fixture(),result=await x.candidate.plan(opts(await editKB()));
 assert.equal(result.domain,'kb');
 assert.equal(result.changes.length,2);
 assert.deepEqual(result.changes.map(r=>r.path),
  ['pwa/KB/kb.json','pwa/'+PATH]);
 assert(result.changes[1].body.includes('Added a safe field note.'));
});
test('D3-S04 Knowledge Base add is supported only on a new owned Markdown path',async()=>{
 const x=fixture(),result=await x.candidate.plan(opts(await addKB()));
 assert.equal(result.operation,'add');
 assert.equal(result.changes.length,2);
 const json=JSON.parse(result.changes[0].body);
 const added=json.entities.find(r=>r.id==='location-p3-new-lake');
 assert.equal(added.content,'KB/Locations/content/P3 New Lake.md');
 assert(result.changes[1].body.includes('Synthetic D3 location.'));
});
test('D3-S05 unrelated source movement can rebase clean field edit without losing newer fields',async()=>{
 const records=structuredClone(data);
 records.gear.items[0].model='Added by another author';
 const x=fixture({rev:NEXT,records});
 const {expectedMainSha,...withoutOldSha}=opts(await editGear());
 const r=await x.candidate.plan(withoutOldSha);
 assert.equal(r.sourceRevision,NEXT);
 const item=JSON.parse(r.changes[0].body).items[0];
 assert.equal(item.name,'P3 Test Rod D3 Verified');
 assert.equal(item.model,'Added by another author');
});
test('D3-S06 concurrent change to the same field returns explicit conflict',async()=>{
 const records=structuredClone(data);
 records.gear.items[0].name='Changed by another author';
 const x=fixture({rev:NEXT,records});
 const {expectedMainSha,...withoutOldSha}=opts(await editGear());
 await assert.rejects(x.candidate.plan(withoutOldSha),fail('SOURCE_CONFLICT'));
});
test('D3-S07 wrong owner/repo and stale exact-main proof fail closed before publication',async()=>{
 const x=fixture();
 const pkg=await editGear();
 await assert.rejects(x.candidate.plan({...opts(pkg),ownerGitHubId:123}),fail('OWNER_OR_REPOSITORY_DENIED'));
 await assert.rejects(x.candidate.plan({...opts(pkg),repositoryId:999}),fail('OWNER_OR_REPOSITORY_DENIED'));
 await assert.rejects(x.candidate.plan({...opts(pkg),expectedMainSha:NEXT}),fail('INVALID_SNAPSHOT'));
});
test('D3-S08 remote Markdown images, invalid binary edits and record insertions are rejected',async()=>{
 const x=fixture();
 await assert.rejects(x.candidate.plan(opts(await editKB('![remote](https://example.com/image.jpg)'))),
  fail('INVALID_MARKDOWN_LINKS'));
 const invalid={...(await editGear()),picture:{action:'add',path:'Gear/abc.jpg',base:{$absent:true}}};
 await assert.rejects(x.candidate.plan(opts(invalid)),e=>e instanceof D3CandidateError&&
  ['INVALID_PACKAGE','UNVERIFIED_MEDIA','UNSAFE_MEDIA_CANDIDATE','MISSING_EXISTING_PICTURE'].includes(e.code));
 const insert=await addKB();
 insert.record.picture={src:'KB/Locations/assets/unsupported.jpg'};
 await assert.rejects(x.candidate.plan(opts(insert)),fail('UNTRUSTED_ADD_FIELDS'));
});

test('D3-S09 reproduces owner editor normalization on exact D2 Gear source',async()=>{
 const original=structuredClone(data.gear.items[0]);
 // createEditor adds optional empty arrays even if the original Gear
 // record lacks the corresponding keys. This is the exact requested edit.
 const changed={...original,name:'P3 Test Rod D3 Verification',
  specifications:[],links:[]};
 const pkg=await prepareChange({domain:'gear',operation:'edit',id:original.id,
  baseRecord:original,record:changed,sourceRevision:SHA,
  baseText:'',text:''});
 assert.deepEqual(pkg.changes.set,{
  name:'P3 Test Rod D3 Verification',specifications:[],links:[]});
 const x=fixture();
 const result=await x.candidate.plan(opts(pkg));
 assert.equal(result.validated,true);
 const item=JSON.parse(result.changes[0].body).items[0];
 assert.equal(item.name,'P3 Test Rod D3 Verification');
 assert.deepEqual(item.specifications,[]);
 assert.deepEqual(item.links,[]);
 assert.equal(x.reads,1);
});

test('D4-S10 validated staged original joins the exact Gear JSON candidate',async()=>{
 const original=structuredClone(data.gear.items[0]);
 const picture='Gear/Rods-Reels/assets/Synthetic Original.jpg';
 const staged={path:picture,blobSha:'f'.repeat(40),
  sha256:'d'.repeat(64),bytes:43,mime:'image/jpeg'};
 const record={...original,picture:{src:picture}};
 const pkg=await prepareChange({domain:'gear',operation:'edit',
  id:record.id,record,baseRecord:original,sourceRevision:SHA,
  pictureAction:'add',picturePath:picture,
  pictureFile:{bytes:43,sha256:staged.sha256},
 });
 const v=createD3TrustedGearKBCandidate({
  enabled:()=>true,loadSnapshot:async()=>source(),
  verifyMediaTickets:async(_pkg,media)=>{
   assert.deepEqual(media,[{ticket:'synthetic-owner-proof'}]);
   return [staged];
  },
 });
 const result=await v.plan({
  package:pkg,media:[{ticket:'synthetic-owner-proof'}],
  repositoryId:ID,ownerGitHubId:OWNER,operationId:
   'p3_01234567-1234-4234-8234-123456789abc',
 });
 assert.equal(result.changes.length,2);
 assert.equal(result.changes[0].path,'pwa/Gear/gear.json');
 assert.deepEqual(result.changes[1],{
  action:'staged',path:'pwa/'+picture,
  blobSha:staged.blobSha,sha256:staged.sha256,bytes:43,
 });
});
test('D4-S11 a claimed picture without a verified canonical or staged original is denied',async()=>{
 const original=structuredClone(data.gear.items[0]);
 const path='Gear/Rods-Reels/assets/Missing.jpg';
 const record={...original,picture:{src:path}};
 const pkg=await prepareChange({domain:'gear',operation:'edit',
  id:record.id,record,baseRecord:original,sourceRevision:SHA,
  pictureAction:'add',picturePath:path,
 });
 const v=createD3TrustedGearKBCandidate({
  enabled:()=>true,loadSnapshot:async()=>source(),
  verifyMediaTickets:async()=>[],
 });
 await assert.rejects(v.plan({
  package:pkg,repositoryId:ID,ownerGitHubId:OWNER,
 }),fail('MISSING_EXISTING_PICTURE'));
});
