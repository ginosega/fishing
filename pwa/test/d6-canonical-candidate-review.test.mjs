import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6CanonicalCandidateReview,D6CanonicalReviewError}
 from '../../experiments/p3/preview/src/d6-canonical-candidate-review.mjs';

const MAIN='a'.repeat(40),OLD='b'.repeat(40);
const item=()=>({id:'old-lure',category:'lures',type:'Spinnerbaits',name:'Before'});
const sample=()=>({
 repositoryId:1350909744,repositoryFullName:'ginosega/fishing',
 ref:'refs/heads/main',sourceRevision:MAIN,treeSha:'c'.repeat(40),
 sourceOnly:true,canPublish:false,
 data:{
  gear:{schemaVersion:2,items:[item()]},
  kb:{schemaVersion:2,entities:[{
   id:'existing-guide',type:'technique',name:'Existing guide',
   content:'KB/Techniques/content/Existing guide.md',
  }]},
  catches:{schemaVersion:2,catches:[]},
 },
 files:new Set(['KB/Techniques/content/Existing guide.md']),
 markdown:new Map([['KB/Techniques/content/Existing guide.md','Existing guide text.']]),
});
const add=()=>({
 format:'fishing-companion-change-v2',
 domain:'gear',operation:'add',id:'new-lure',
 base:{schemaVersion:2,sourceRevision:MAIN,recordHash:null},
 record:{id:'new-lure',category:'lures',type:'Spinnerbaits',name:'New lure'},
 notes:{action:'keep'},picture:{action:'keep'},
 pictureSequence:{action:'keep'},
});
const edit=()=>({
 format:'fishing-companion-change-v2',
 domain:'gear',operation:'edit',id:'old-lure',
 base:{schemaVersion:2,sourceRevision:MAIN,recordHash:null},
 changes:{set:{name:'After'},unset:[],baseFields:{name:'Before'}},
 notes:{action:'keep'},picture:{action:'keep'},
 pictureSequence:{action:'keep'},
});
const incoming=(pkg=add())=>({
 id:1350909744,name:'ginosega/fishing',ref:'refs/heads/main',
 ownerGitHubId:265665562,sourceOnly:true,canPublish:false,
 requiresSourceReview:true, trustedMainSha:MAIN,
 submittedSourceRevision:pkg.base.sourceRevision,
 idempotencyKey:'test_key_1234567890',snapshot:{package:pkg,media:[]},
});
const review=()=>createD6CanonicalCandidateReview({enabled:()=>true});
const error=(promise,code)=>assert.rejects(promise,
 e=>e instanceof D6CanonicalReviewError&&e.code===code);

test('D6-REVIEW01 default-OFF never reviews or authorizes writes',async()=>{
 const r=createD6CanonicalCandidateReview();
 await error(r.review(incoming(),sample()),'DISABLED');
 assert.deepEqual(Object.keys(r),['review']);
});
test('D6-REVIEW02 immutable Gear add review is not Accepted or Live',async()=>{
 const s=sample(),i=incoming(),result=await review().review(i,s);
 assert.equal(result.id,'new-lure');
 assert.equal(result.record.name,'New lure');
 assert.equal(result.repositoryId,1350909744);
 assert.equal(result.sourceRevision,MAIN);
 assert.equal(result.sourceOnly,true);
 assert.equal(result.canPublish,false);
 assert.equal(result.requiresDurableReceipt,true);
 assert.equal(result.operationId,undefined);
 assert.equal(result.releaseId,undefined);
 assert.deepEqual(result.narrativeWrites,[]);
 assert.equal(s.data.gear.items.length,1);
 assert(Object.isFrozen(result));
 assert(Object.isFrozen(result.record));
});
test('D6-REVIEW03 exact trusted snapshot identity and SHA cannot drift',async()=>{
 for(const mutation of [
  s=>{s.repositoryId=1430581407;},
  s=>{s.repositoryFullName='ginosega/fishing-p3-sandbox';},
  s=>{s.ref='refs/heads/other';},
  s=>{s.sourceRevision=OLD;},
  s=>{s.sourceOnly=false;},
  s=>{s.canPublish=true;},
  s=>{s.files=[];},
 ]){
  const s=sample();mutation(s);
  await error(review().review(incoming(),s),'UNVERIFIED_SOURCE');
 }
});
test('D6-REVIEW04 untrusted intake identity and media denied',async()=>{
 for(const mutation of [
  i=>{i.id=1430581407;},
  i=>{i.ownerGitHubId=0;},
  i=>{i.requiresSourceReview=false;},
  i=>{i.snapshot.media.push({path:'Gear/a.png'});},
  i=>{i.snapshot.package.picture.action='add';},
  i=>{i.submittedSourceRevision=OLD;},
 ]){
  const i=incoming();mutation(i);
  await error(review().review(i,sample()),
   mutation.toString().includes('i.id=')||
   mutation.toString().includes('i.ownerGitHubId=')||
   mutation.toString().includes('i.requiresSourceReview=')?
    'UNVERIFIED_INTAKE':'INVALID_INTENT');
 }
});
test('D6-REVIEW05 edit reviewed with field-safe source promotion',async()=>{
 const result=await review().review(incoming(edit()),sample());
 assert.equal(result.record.name,'After');
 assert.equal(result.narrativeWrites.length,0);
 const stale=edit();stale.base.sourceRevision=OLD;
 const candidate=await review().review(incoming(stale),sample());
 assert.equal(candidate.baseRevision,OLD);
 assert.equal(candidate.record.name,'After');
});
test('D6-REVIEW06 conflicting edits do not overwrite current main',async()=>{
 const s=sample();s.data.gear.items[0].name='Current main change';
 await error(review().review(incoming(edit()),s),'CONFLICT_REVIEW_REQUIRED');
 const dup=add();dup.id='old-lure';dup.record.id='old-lure';
 await error(review().review(incoming(dup),sample()),'INVALID_CHANGE');
});
test('D6-REVIEW07 KB add plus textual narrative is fully checked',async()=>{
 const p=add();
 p.domain='kb';p.id='new-guide';
 p.record={id:'new-guide',type:'technique',name:'New guide'};
 p.notes={action:'create',path:'KB/Techniques/content/New guide.md',
  body:'Plain text about technique.',baseSha256:null};
 const s=sample();
 const result=await review().review(incoming(p),s);
 assert.equal(result.record.content,p.notes.path);
 assert.deepEqual(result.narrativeWrites.map(x=>x.path),[p.notes.path]);
 assert.equal(s.files.has(p.notes.path),false);
});
test('D6-REVIEW08 reject colliding or broken Markdown in proposed file',async()=>{
 const p=add();
 p.domain='kb';p.id='new-guide';
 p.record={id:'new-guide',type:'technique',name:'New guide'};
 p.notes={action:'create',path:'KB/Techniques/content/Existing guide.md',
  body:'Text',baseSha256:null};
 await error(review().review(incoming(p),sample()),'PATH_ALREADY_EXISTS');
 p.notes.path='KB/Techniques/content/New guide.md';
 p.notes.body='[missing](gear://missing-id)';
 await error(review().review(incoming(p),sample()),'CANDIDATE_VALIDATION_FAILED');
});
test('D6-REVIEW09 schema and source narrative guard fail closed',async()=>{
 const p=add();p.record.type='Invalid type';
 await error(review().review(incoming(p),sample()),
  'CANDIDATE_VALIDATION_FAILED');
 const s=sample();s.markdown.delete('KB/Techniques/content/Existing guide.md');
 await error(review().review(incoming(add()),s),'MISSING_SOURCE_NARRATIVE');
});
