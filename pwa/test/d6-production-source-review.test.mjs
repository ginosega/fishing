import test from 'node:test';
import assert from 'node:assert/strict';
import {fingerprint} from '../src/shared.mjs';
import {prepareChange} from '../src/handoff.mjs';
import {prepareCatchPackage} from '../src/catch-editor.mjs';
import {createD6ProductionPublishIntake,D6_PUBLISH_INTAKE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionSourceReview,D6SourceReviewError}
 from '../../experiments/p3/preview/src/d6-production-source-review.mjs';

const MAIN='a'.repeat(40),OLD='b'.repeat(40),TREE='c'.repeat(40);
const record={id:'sample-item',category:'lures',type:'Jigs',name:'Sample'};
const baseData=()=>({
 gear:{schemaVersion:2,items:[]},kb:{schemaVersion:2,entities:[]},
 catches:{schemaVersion:2,catches:[]},
});
const pkg=(operation='add')=>({
 format:'fishing-companion-change-v2',domain:'gear',
 operation,id:record.id,
 base:{schemaVersion:2,sourceRevision:MAIN,recordHash:null},
 ...(operation==='add'?{record:{...record}}:
  {changes:{set:{name:'Updated'},unset:[],
   baseFields:{name:record.name}}}),
 notes:{action:'keep'},picture:{action:'keep'},
 pictureSequence:{action:'keep'},
});
const request=(p,media=[])=>new Request(D6_PUBLISH_INTAKE_ORIGIN+
 '/api/v3/operations',{
 method:'POST',headers:{
  Origin:D6_PUBLISH_INTAKE_ORIGIN,
  'Sec-Fetch-Site':'same-origin','X-Fish-V3-Intent':'publish',
  'X-Fish-V3-CSRF':'C'.repeat(43),
  'Content-Type':'application/json',
 },
 body:JSON.stringify({
  idempotencyKey:'sample_idempotency_key_1234',
  snapshot:{package:p,media},
 }),
});
function setup({
 data=baseData(),files=new Set([
  'Gear/gear.json','KB/kb.json','Catches/catches.json']),
 markdown=new Map(),enabled=true,owner=true,sourcePatch={},
}={}){
 let reads=0,checks=0;
 const intake=createD6ProductionPublishIntake({
  enabled:()=>true,
  sessionFactory:()=>({authorizeWrite:async()=>{
   checks++;
   if(!owner)throw Error('Unauthorized');
   return {authorized:true,ownerGitHubId:265665562};
  }}),
 });
 const loadSnapshot=async({expectedReleaseRevision})=>{
  reads++;assert.equal(expectedReleaseRevision,MAIN);
  return {repositoryId:1350909744,
   repositoryFullName:'ginosega/fishing',ref:'refs/heads/main',
   sourceRevision:MAIN,treeSha:TREE,
   files,markdown,data,sourceOnly:true,canPublish:false,
   ...sourcePatch};
 };
 const review=createD6ProductionSourceReview({
  intake,loadSnapshot,enabled:()=>enabled,
 });
 return {review,counts:()=>({reads,checks})};
}
const deny=async(promise,code)=>assert.rejects(promise,
 e=>e instanceof D6SourceReviewError&&e.code===code);

test('D6-SOURCE01 default OFF: no auth, GitHub or write operations',async()=>{
 const x=setup({enabled:false});
 await deny(x.review.review(request(pkg()),{trustedMainSha:MAIN}),
  'DISABLED');
 assert.deepEqual(x.counts(),{reads:0,checks:0});
 assert.deepEqual(Object.keys(x.review),['review']);
});
test('D6-SOURCE02 only server-supplied exact main SHA may start',async()=>{
 const x=setup();
 await deny(x.review.review(request(pkg()),{trustedMainSha:OLD.slice(1)}),
  'UNVERIFIED_MAIN');
 assert.deepEqual(x.counts(),{reads:0,checks:0});
});
test('D6-SOURCE03 unauthorized owner never triggers GitHub reader',async()=>{
 const x=setup({owner:false});
 await assert.rejects(x.review.review(request(pkg()),{
  trustedMainSha:MAIN}));
 assert.deepEqual(x.counts(),{reads:0,checks:1});
});
test('D6-SOURCE04 valid Gear add produces no publish or receipt',async()=>{
 const x=setup();
 const result=await x.review.review(request(pkg()),{
  trustedMainSha:MAIN});
 assert.equal(result.candidateData.gear.items[0].name,'Sample');
 assert.equal(result.canPublish,false);
 assert.equal(result.requiresDurableOperation,true);
 assert.equal(result.operationId,undefined);
 assert.equal(result.releaseId,undefined);
 assert.equal(result.fileOps.length,0);
 assert.deepEqual(x.counts(),{reads:1,checks:1});
});
test('D6-SOURCE05 stale origin base never silently rebases',async()=>{
 const p=pkg();p.base.sourceRevision=OLD;
 const x=setup();
 await deny(x.review.review(request(p),{trustedMainSha:MAIN}),
  'STALE_SOURCE');
 assert.equal(x.counts().reads,0);
});
test('D6-SOURCE06 forged or mismatched canonical snapshot denied',async()=>{
 const x=setup({sourcePatch:{repositoryId:1430581407}});
 await deny(x.review.review(request(pkg()),{trustedMainSha:MAIN}),
  'SOURCE_UNVERIFIED');
});
test('D6-SOURCE07 existing add ID is a conflict, not overwrite',async()=>{
 const data=baseData();data.gear.items=[{...record}];
 const x=setup({data});
 await deny(x.review.review(request(pkg()),{trustedMainSha:MAIN}),
  'CONFLICT');
});
test('D6-SOURCE08 edit requires same canonical record hash',async()=>{
 const data=baseData();data.gear.items=[{...record}];
 const p=pkg('edit');p.base.recordHash='f'.repeat(64);
 await deny(setup({data}).review.review(request(p),
  {trustedMainSha:MAIN}),'CONFLICT');
});
test('D6-SOURCE09 reviewed text-only edit preserves other fields',async()=>{
 const data=baseData();data.gear.items=[{...record,manufacturer:'SampleCo'}];
 const p=pkg('edit');p.base.recordHash=await fingerprint(data.gear.items[0]);
 const x=setup({data});
 const r=await x.review.review(request(p),{trustedMainSha:MAIN});
 assert.equal(r.candidateData.gear.items[0].name,'Updated');
 assert.equal(r.candidateData.gear.items[0].manufacturer,'SampleCo');
 assert.equal(data.gear.items[0].name,'Sample');
 assert.equal(r.canPublish,false);
});
test('D6-SOURCE10 valid narrative create validates complete candidate',async()=>{
 const p=pkg();p.notes={
  action:'create',path:'Gear/Lures/content/Sample.md',body:'# Sample',
  baseSha256:null,
 };
 const r=await setup().review.review(request(p),{
  trustedMainSha:MAIN});
 assert.equal(r.fileOps[0].action,'create');
 assert.equal(r.candidateMarkdown.get('Gear/Lures/content/Sample.md'),
  '# Sample');
});
test('D6-SOURCE11 existing unclaimed Markdown path cannot be clobbered',async()=>{
 const p=pkg();p.notes={
  action:'create',path:'Gear/Lures/content/Sample.md',body:'# Sample',
  baseSha256:null,
 };
 const files=new Set(['Gear/gear.json','KB/kb.json','Catches/catches.json',
  'Gear/Lures/content/Sample.md']);
 const x=setup({files});
 await deny(x.review.review(request(p),{trustedMainSha:MAIN}),
  'CONFLICT');
});
test('D6-SOURCE12 empty unchanged edit rejected, no operation',async()=>{
 const data=baseData();data.gear.items=[{...record}];
 const p=pkg('edit');p.base.recordHash=await fingerprint(record);
 p.changes={set:{},unset:[],baseFields:{}};
 const x=setup({data});
 await deny(x.review.review(request(p),{trustedMainSha:MAIN}),
  'NO_CHANGE');
});

const catchRecord={id:'catch-2026-11-12',date:'2026-11-12'};
const catchCtx=(data=baseData())=>({
 v3:{source:{files:new Set([
  'Gear/gear.json','KB/kb.json','Catches/catches.json'])}},
 release:{sourceRevision:MAIN},data,
});

test('WP3-CATCH01 editor Catch Add prepares a canonical text-only source package',async()=>{
 const p=await prepareCatchPackage({ctx:catchCtx(),record:catchRecord});
 assert.equal(p.domain,'catches');
 assert.equal(p.notes.action,'keep');
 const result=await setup().review.review(request(p),{trustedMainSha:MAIN});
 assert.deepEqual(result.candidateData.catches.catches,[catchRecord]);
 assert.equal(result.canPublish,false);
 assert.equal(result.fileOps.length,0);
});

test('WP3-CATCH02 editor Catch Edit preserves original fields under review',async()=>{
 const data=baseData();data.catches.catches=[{...catchRecord}];
 const p=await prepareCatchPackage({
  ctx:catchCtx(data),baseRecord:data.catches.catches[0],
  record:{...catchRecord,size:'12 in'},
 });
 const result=await setup({data}).review.review(request(p),{trustedMainSha:MAIN});
 assert.equal(result.candidateData.catches.catches[0].size,'12 in');
 assert.equal(data.catches.catches[0].size,undefined);
 assert.equal(result.sourceOnly,true);
});

test('WP3-CATCH03 Catch Notes create has an owned Catches path and no Live',async()=>{
 const p=await prepareCatchPackage({
  ctx:catchCtx(),record:catchRecord,text:'# Catch notes',
 });
 assert.equal(p.notes.action,'create');
 assert.equal(p.notes.path,'Catches/content/'+catchRecord.id+'.md');
 const result=await setup().review.review(request(p),{trustedMainSha:MAIN});
 assert.equal(result.fileOps[0].path,'Catches/content/'+catchRecord.id+'.md');
 assert.equal(result.candidateData.catches.catches[0].notes,
  'Catches/content/'+catchRecord.id+'.md');
 assert.equal(result.canPublish,false);
});

test('WP3-CATCH04 Catch image package is retained but publisher remains off',async()=>{
 const path='Catches/assets/'+catchRecord.id+'/notes/photo.png';
 const p=await prepareCatchPackage({
  ctx:catchCtx(),record:catchRecord,
  text:'![Photo](../assets/'+catchRecord.id+'/notes/photo.png)',
  notesImages:[{path,bytes:16,sha256:'b'.repeat(64)}],
 });
 assert.deepEqual(p.notes.images,[{path,bytes:16,sha256:'b'.repeat(64)}]);
 // Authentication and source ownership now accept only the immutable
 // metadata; no image bytes are staged and no provider writes are enabled.
 const reviewed=await setup().review.review(request(p,p.notes.images),{
  trustedMainSha:MAIN});
 assert.deepEqual(reviewed.pendingOriginals,p.notes.images);
 assert.equal(reviewed.requiresSignedStaging,true);
 assert.equal(reviewed.requiresIndependentBlobReadback,true);
 assert.equal(reviewed.canPublish,false);
 assert.equal(reviewed.operationId,undefined);
 const bad={...catchRecord,picture:{src:path}};
 await assert.rejects(prepareCatchPackage({
  ctx:catchCtx(),record:bad,
 }),/Invalid Catch fields/);
});

test('WP3-DOMAIN01 KB Add through shared source review retains Markdown',async()=>{
 const record={id:'sample-technique',type:'technique',name:'Sample Technique'};
 const p=await prepareChange({
  domain:'kb',operation:'add',id:record.id,record,
  sourceRevision:MAIN,text:'# Sample Technique',
 });
 const r=await setup().review.review(request(p),{trustedMainSha:MAIN});
 assert.equal(r.domain,'kb');
 assert.equal(r.candidateData.kb.entities[0].content,
  'KB/Techniques/content/Sample Technique.md');
 assert.equal(r.candidateMarkdown.get(r.fileOps[0].path),
  '# Sample Technique');
 assert.equal(r.fileOps[0].action,'create');
 assert.equal(r.sourceOnly,true);
 assert.equal(r.canPublish,false);
});

test('WP3-DOMAIN02 KB Edit protects original canonical text',async()=>{
 const original={id:'sample-technique',type:'technique',
  name:'Sample Technique',
  content:'KB/Techniques/content/Sample Technique.md'};
 const data=baseData();data.kb.entities=[original];
 const files=new Set(['Gear/gear.json','KB/kb.json','Catches/catches.json',
  original.content]);
 const markdown=new Map([[original.content,'# Existing']]);
 const p=await prepareChange({domain:'kb',operation:'edit',
  id:original.id,baseRecord:original,
  record:{...original,name:'Updated Technique'},
  baseText:'# Existing',text:'# Existing',sourceRevision:MAIN,
 });
 const r=await setup({data,files,markdown}).review.review(request(p),{
  trustedMainSha:MAIN,
 });
 assert.equal(r.candidateData.kb.entities[0].name,'Updated Technique');
 assert.equal(r.candidateMarkdown.get(original.content),'# Existing');
 assert.equal(r.fileOps.length,0);
 assert.equal(original.name,'Sample Technique');
 assert.equal(r.canPublish,false);
});

test('WP3-DOMAIN03 Catch Notes cannot escape its owned source path',async()=>{
 const p=await prepareCatchPackage({ctx:catchCtx(),
  record:catchRecord,text:'# Notes'});
 p.notes.path='Catches/content/unrelated-record.md';
 await deny(setup().review.review(request(p),{trustedMainSha:MAIN}),
  'UNSAFE_NARRATIVE_PATH');
});

test('WP3-NAMES01 Catch editor free-text choices survive canonical review',async()=>{
 const item={...catchRecord,speciesName:'Unlisted species',
  locationName:'Unnamed bay',lureOrBaitName:'Custom jig'};
 const p=await prepareCatchPackage({ctx:catchCtx(),record:item,
  text:'# Catch details'});
 const r=await setup().review.review(request(p),{trustedMainSha:MAIN});
 assert.equal(r.candidateData.catches.catches[0].speciesName,
  'Unlisted species');
 assert.equal(r.candidateData.catches.catches[0].locationName,
  'Unnamed bay');
 assert.equal(r.candidateData.catches.catches[0].lureOrBaitName,
  'Custom jig');
 assert.equal(r.candidateMarkdown.get('Catches/content/'+item.id+'.md'),
  '# Catch details');
 assert.equal(r.sourceOnly,true);
 assert.equal(r.canPublish,false);
});
