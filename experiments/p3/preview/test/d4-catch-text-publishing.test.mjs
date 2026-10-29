import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareCatchPackage,suggestedCatchId} from '../../../../pwa/src/catch-editor.mjs';
import {prepareChange} from '../../../../pwa/src/handoff.mjs';
import {validateRecords} from '../../../../pwa/src/validation.mjs';
import {sha256,sortCatches,catchHistory,parseRoute}
 from '../../../../pwa/src/shared.mjs';
import {createD3TrustedGearKBCandidate,D3CandidateError}
 from '../src/d3-trusted-gear-kb-candidate.mjs';

const REPO=1430581407,OWNER=265665562,SHA='a'.repeat(40);
const NEXT='b'.repeat(40),NOTE='Lake test note.\n';
const source={
 gear:{schemaVersion:2,items:[{id:'test-spoon',category:'lures',
  name:'Synthetic Spoon',type:'Spoons'}]},
 kb:{schemaVersion:2,entities:[
  {id:'species-test-trout',type:'species',name:'Synthetic Trout'},
  {id:'location-test-lake',type:'location',name:'Synthetic Lake'},
 ]},
 catches:{schemaVersion:2,catches:[{id:'catch-test-existing',
  date:'2026-10-01',time:'09:15',size:'12 in',
  speciesId:'species-test-trout',
  locationId:'location-test-lake',
  lureOrBaitId:'test-spoon',
  notes:'Catches/content/catch-test-existing.md'}]},
};
const existingFiles=new Set(['Catches/content/catch-test-existing.md']);
const existingMarkdown=new Map([['Catches/content/catch-test-existing.md',NOTE]]);
const makeContext=(data=source,files=existingFiles)=>({
 data:structuredClone(data),base:'https://fishing.example/fishing/releases/fixture/content/',
 release:{sourceRevision:SHA},v3:{source:{
  files:new Set(files),markdown:new Map(existingMarkdown),
 }},
});
const candidate=(data=source,rev=SHA,files=existingFiles)=>createD3TrustedGearKBCandidate({
 enabled:()=>true,
 loadSnapshot:async()=>({
  repositoryId:REPO,sourceRevision:rev,data:structuredClone(data),
  files:new Set(files),markdown:new Map(existingMarkdown),
 }),
});
const submit=pkg=>candidate().plan({
 package:pkg,repositoryId:REPO,ownerGitHubId:OWNER,
});
const fail=code=>e=>e instanceof D3CandidateError&&e.code===code;
const newCatch={
 id:'catch-2026-10-29-test-lake-test-trout',
 date:'2026-10-29',time:'14:05',size:'13 in',
 speciesId:'species-test-trout',locationId:'location-test-lake',
 lureOrBaitId:'test-spoon',
};

test('D4-C01 Catch add package emits schema-valid JSON + owned Markdown together',async()=>{
 const ctx=makeContext();
 const pkg=await prepareCatchPackage({ctx,record:newCatch,
  text:'# New synthetic catch\n\nA measured catch.\n'});
 assert.equal(pkg.domain,'catches');
 assert.equal(pkg.notes.action,'create');
 assert.equal(pkg.notes.path,'Catches/content/'+newCatch.id+'.md');
 assert.deepEqual(pkg.picture,{action:'keep'});
 assert.deepEqual(pkg.pictureSequence,{action:'keep'});
 const planned=await submit(pkg);
 assert.equal(planned.validated,true);
 assert.deepEqual(planned.changes.map(c=>c.path),[
  'pwa/Catches/catches.json','pwa/Catches/content/'+newCatch.id+'.md',
 ]);
 const data=structuredClone(source);
 data.catches=JSON.parse(planned.changes[0].body);
 const maps=validateRecords(data);
 assert.equal(maps.catches.get(newCatch.id).size,'13 in');
 assert.equal(catchHistory(data,'kb','species-test-trout').length,2);
 assert.equal(sortCatches(data.catches.catches)[0].id,newCatch.id);
});
test('D4-C02 Catch without Notes preserves optional notes and writes only JSON',async()=>{
 const pkg=await prepareCatchPackage({ctx:makeContext(),
  record:{id:'catch-test-no-note',date:'2026-10-29'},
  text:''});
 assert.equal(pkg.notes.action,'keep');
 const result=await submit(pkg);
 assert.deepEqual(result.changes.map(x=>x.path),['pwa/Catches/catches.json']);
 assert.equal(JSON.parse(result.changes[0].body).catches.at(-1).notes,undefined);
});
test('D4-C03 source-aware Catch edit preserves unrelated records, IDs and notes',async()=>{
 const old=source.catches.catches[0],record={...old,size:'14 in'};
 const pkg=await prepareCatchPackage({ctx:makeContext(),baseRecord:old,
  record,text:NOTE,baseText:NOTE,baseHash:await sha256(NOTE)});
 const result=await submit(pkg);
 assert.equal(result.changes.length,1);
 const row=JSON.parse(result.changes[0].body).catches[0];
 assert.equal(row.id,old.id);
 assert.equal(row.size,'14 in');
 assert.equal(row.notes,old.notes);
 assert.equal(row.locationId,old.locationId);
});
test('D4-C04 Catch Notes edit is included in the same protected candidate',async()=>{
 const old=source.catches.catches[0];
 const pkg=await prepareCatchPackage({ctx:makeContext(),baseRecord:old,
  record:old,text:NOTE+'\nFurther details.\n',baseText:NOTE,
  baseHash:await sha256(NOTE)});
 const result=await submit(pkg);
 assert.deepEqual(result.changes.map(x=>x.path),[
  'pwa/Catches/catches.json','pwa/Catches/content/catch-test-existing.md',
 ]);
 assert(result.changes[1].body.includes('Further details.'));
});
test('D4-C05 conflicting simultaneous Catch edits fail closed; independent fields rebase',async()=>{
 const old=source.catches.catches[0],changed={...old,size:'15 in'};
 const pkg=await prepareCatchPackage({ctx:makeContext(),baseRecord:old,
  record:changed,text:NOTE,baseText:NOTE,baseHash:await sha256(NOTE)});
 const latest=structuredClone(source);
 latest.catches.catches[0].size='16 in';
 await assert.rejects(candidate(latest,NEXT).plan({
  package:pkg,repositoryId:REPO,ownerGitHubId:OWNER,
 }),fail('SOURCE_CONFLICT'));
 latest.catches.catches[0].size='12 in';
 latest.catches.catches[0].time='10:30';
 const result=await candidate(latest,NEXT).plan({
  package:pkg,repositoryId:REPO,ownerGitHubId:OWNER,
 });
 const saved=JSON.parse(result.changes[0].body).catches[0];
 assert.equal(saved.size,'15 in');
 assert.equal(saved.time,'10:30');
});
test('D4-C06 incorrect species/location/lure IDs and invalid date are rejected',async()=>{
 for(const record of [
  {...newCatch,date:'2026-02-30'},
  {...newCatch,speciesId:'location-test-lake'},
  {...newCatch,locationId:'species-test-trout'},
  {...newCatch,lureOrBaitId:'unknown-gear'},
 ]){
  await assert.rejects(prepareCatchPackage({
   ctx:makeContext(),record,text:'Test.',}),Error);
 }
});
test('D4-C07 Catch photos, GPS, schema expansion and ID mutation are disallowed',async()=>{
 for(const record of [
  {...newCatch,picture:{src:'Catches/assets/photo.jpg'}},
  {...newCatch,pictureSequence:['Catches/assets/step-01.jpg']},
  {...newCatch,gps:'47,-122'},
 ]){
  await assert.rejects(prepareCatchPackage({
   ctx:makeContext(),record,text:'Test.',}),Error);
 }
 const old=source.catches.catches[0];
 await assert.rejects(prepareCatchPackage({
  ctx:makeContext(),baseRecord:old,record:{...old,id:'renamed-catch'},
  text:NOTE,baseText:NOTE,
 }),/Existing Catch IDs cannot be changed/);
});
test('D4-C08 missing owned Markdown and pathname collision do not publish',async()=>{
 const old=source.catches.catches[0];
 await assert.rejects(prepareCatchPackage({
  ctx:makeContext(source,new Set()),baseRecord:old,
  record:old,text:NOTE,baseText:NOTE,
 }),/original Catch Notes are missing/);
 await assert.rejects(prepareCatchPackage({
  ctx:makeContext(source,new Set([...existingFiles,
   'Catches/content/'+newCatch.id+'.md'])),
  record:newCatch,text:'A note.',
 }),/already exists/);
});
test('D4-C09 unsafe foreign media in Catch package fails even if directly submitted',async()=>{
 const pkg=await prepareChange({domain:'catches',operation:'add',
  id:newCatch.id,record:newCatch,sourceRevision:SHA,text:'A note.',
  notesPath:'Catches/content/'+newCatch.id+'.md'});
 pkg.picture={action:'add',path:'Catches/assets/unsafe.jpg'};
 await assert.rejects(submit(pkg),fail('INVALID_PACKAGE'));
});
test('D4-C10 ID generator and Catch route parsing preserve existing links',()=>{
 assert.equal(suggestedCatchId({
  date:'2026-10-29',locationId:'location-test-lake',
  speciesId:'species-test-trout'},new Set()),newCatch.id);
 assert.equal(suggestedCatchId({
  date:'2026-10-29',locationId:'location-test-lake',
  speciesId:'species-test-trout'},new Set([newCatch.id])),newCatch.id+'-2');
 assert.deepEqual(parseRoute('#/catches/add'),{page:'catch-add'});
 assert.deepEqual(parseRoute('#/catches/edit/catch-test-existing'),
  {page:'catch-edit',id:'catch-test-existing'});
 assert.equal(parseRoute('#/catches/catch-test-existing').page,'catch-detail');
});
