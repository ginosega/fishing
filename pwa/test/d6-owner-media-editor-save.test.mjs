import test from 'node:test';
import assert from 'node:assert/strict';
import {saveD6OwnerEditorMedia as save}
 from '../src/d6-owner-media-editor-save.mjs';
import {noteImageReference} from '../src/notes-markdown-editor.mjs';

const caps={canUploadNewImages:true};
const file=()=>({name:'image.png',arrayBuffer:async()=>new ArrayBuffer(4)});
const gear={id:'owner-lure',category:'lures',
 picture:{src:'Gear/Lures/assets/cover.png'}};
const kb={id:'owner-fish',type:'species',
 picture:{src:'KB/Species/assets/fish.png'}};
const knot={id:'owner-knot',type:'knot',pictureSequence:[
 'KB/Knots/assets/owner-knot/step-01.png',
 'KB/Knots/assets/owner-knot/step-02.png'],
 picture:{src:'KB/Knots/assets/owner-knot/step-02.png'}};
const catchRecord={id:'catch-owner-01',date:'2026-11-21',
 notes:'Catches/content/catch-owner-01.md'};
const notesPath='Catches/assets/catch-owner-01/notes/image.png';
const upload=(path,role)=>({path,role,file:file()});
function harness({stageFailure=false,publishFailure=false}={}){
 const calls=[],staged=[];
 const coordinator={ready:()=>true,
  stage:async input=>{
   calls.push({type:'stage',path:input.logicalPath,role:input.role});
   if(stageFailure)throw Object.assign(Error('unknown R2 receipt'),{code:'UNVERIFIED'});
   const receipt=Object.freeze({logicalPath:input.logicalPath,role:input.role});
   staged.push(receipt);return receipt;
  },
  publish:async ({record,expectedRevision,staged:receipts})=>{
   calls.push({type:'publish',receipts});
   assert.deepEqual(receipts,staged);
   if(publishFailure)throw Object.assign(Error('unknown D1 receipt'),{code:'UNVERIFIED'});
   return {verified:true,record,revision:expectedRevision+1};
  },
 };
 return {coordinator,calls};
}
const use=(h,params)=>save({capabilities:caps,coordinator:h.coordinator,
 expectedRevision:1,markdown:'Owner notes',...params});
test('M02 browser Save is disabled until owner media capability and readiness',async()=>{
 const h=harness();
 await assert.rejects(save({domain:'gear',record:gear,
  markdown:'Owner notes',expectedRevision:1,
  uploads:[upload(gear.picture.src,'cover')],coordinator:h.coordinator}),
  {code:'MEDIA_DISABLED'});
 await assert.rejects(save({domain:'gear',record:gear,
  markdown:'Owner notes',expectedRevision:1,uploads:[upload(gear.picture.src,'cover')],
  capabilities:caps,coordinator:{...h.coordinator,ready:()=>false}}),
  {code:'MEDIA_DISABLED'});
 assert.equal(h.calls.length,0);
});
test('M02 Gear and KB covers stage then publish exactly one revision',async()=>{
 for(const [domain,record] of [['gear',gear],['kb',kb]]){
  const h=harness();
  const saved=await use(h,{domain,record,
   uploads:[upload(record.picture.src,'cover')]});
  assert.equal(saved.verified,true);
  assert.deepEqual(h.calls.map(x=>x.type),['stage','publish']);
  assert.equal(h.calls[0].role,'cover');
 }
});
test('M02 complete ordered Knot frames and Catch Notes use same coordinator',async()=>{
 const h=harness();
 await use(h,{domain:'kb',record:knot,
  uploads:knot.pictureSequence.map(path=>upload(path,'knot-step'))});
 assert.deepEqual(h.calls.map(x=>x.type),['stage','stage','publish']);
 const c=harness();
 const saved=await use(c,{domain:'catches',record:catchRecord,
  markdown:'![Fish]('+noteImageReference(notesPath)+')',
  expectedRevision:0,uploads:[upload(notesPath,'notes')]});
 assert.equal(saved.revision,1);
 assert.deepEqual(c.calls.map(x=>x.type),['stage','publish']);
});
test('M02 malformed or incomplete image manifests make zero provider calls',async()=>{
 const bad=[
  {domain:'gear',record:gear,uploads:[upload(gear.picture.src,'cover'),
   upload(gear.picture.src,'cover')]},
  {domain:'kb',record:knot,uploads:[upload(knot.pictureSequence[0],'knot-step')]},
  {domain:'catches',record:catchRecord,uploads:[upload(notesPath,'notes')]},
  {domain:'catches',record:catchRecord,uploads:[upload(notesPath,'cover')]},
  {domain:'gear',record:gear,uploads:[upload('Gear/Lures/assets/other.png','cover')]},
 ];
 for(const input of bad){
  const h=harness();
  await assert.rejects(use(h,input),e=>
   e.code==='MEDIA_INVALID'||/MEDIA_INVALID/.test(e.message));
  assert.equal(h.calls.length,0);
 }
});
test('M02 failed staging, ambiguous publication and unverified readback never fall back',async()=>{
 for(const config of [{stageFailure:true},{publishFailure:true}]){
  const h=harness(config);
  await assert.rejects(use(h,{domain:'gear',record:gear,
   uploads:[upload(gear.picture.src,'cover')]}),{code:'UNVERIFIED'});
  assert.equal(h.calls.filter(x=>x.type==='publish').length,
   config.stageFailure?0:1);
 }
 const h=harness();
 h.coordinator.publish=async()=>({verified:false,record:gear,revision:2});
 await assert.rejects(use(h,{domain:'gear',record:gear,
  uploads:[upload(gear.picture.src,'cover')]}),{code:'MEDIA_UNVERIFIED'});
});
