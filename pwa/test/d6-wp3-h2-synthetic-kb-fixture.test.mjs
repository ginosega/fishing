import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {readdirSync,readFileSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareChange,promoteChange,validatePackage}
 from '../src/handoff.mjs';
import {DOMAIN} from '../src/shared.mjs';
import {collectPaths,validateRecords,validateRecord,validateLibraryPaths,
 validateMarkdown} from '../src/validation.mjs';
import {createD6ProductionPublishIntake}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionSourceReview}
 from '../../experiments/p3/preview/src/d6-production-source-review.mjs';
import {createD6ProductionAtomicSourceMediaTree}
 from '../../experiments/p3/preview/src/d6-production-atomic-source-media-tree.mjs';
import {createD6Wp3H2OperatorApproval}
 from '../server/d6-wp3-h2-operator-approval.mjs';
import {D6_WP3_STAGING_ORIGIN as ORIGIN}
 from '../src/d6-public-reader.mjs';
import {createD6Wp3H2SyntheticKbFixture,
 D6_WP3_H2_SYNTHETIC_RECORD_ID as ID,
 D6_WP3_H2_SYNTHETIC_NOTES_PATH as PATH}
 from '../server/d6-wp3-h2-synthetic-kb-fixture.mjs';

const MAIN='fc85bd38c4c688026700971b4c2d463c293eebf3';
const TREE='c'.repeat(40),SNAP='b'.repeat(64);
const OP='123e4567-e89b-42d3-a456-426614174000';
const NOW=2000000000;
const root=fileURLToPath(new URL('../',import.meta.url));
const sourceData=()=>({
 gear:JSON.parse(readFileSync(join(root,'Gear/gear.json'),'utf8')),
 kb:JSON.parse(readFileSync(join(root,'KB/kb.json'),'utf8')),
 catches:JSON.parse(readFileSync(join(root,'Catches/catches.json'),'utf8')),
});
function localFiles(){
 const files=new Set(),markdown=new Map();
 function walk(dir){
  for(const item of readdirSync(join(root,dir))){
   const name=dir+'/'+item,full=join(root,name);
   if(statSync(full).isDirectory()){walk(name);continue;}
   const rel=relative(root,full).replaceAll('\\','/');
   files.add(rel);
   if(rel.endsWith('.md'))markdown.set(rel,readFileSync(full,'utf8'));
  }
 }
 for(const domain of ['Gear','KB','Catches'])walk(domain);
 return {files,markdown};
}
async function setup(){
 const data=sourceData(),{files,markdown}=localFiles();
 const ids=new Set(data.kb.entities.map(x=>x.id));
 const fx=await createD6Wp3H2SyntheticKbFixture({
  sourceRevision:MAIN,existingIds:ids,existingPaths:files,
 });
 return {data,files,markdown,ids,fx};
}
const actualRequest=body=>new Request(ORIGIN+'/api/v3/operations',{
 method:'POST',headers:{
  Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'publish',
  'X-Fish-V3-CSRF':'C'.repeat(43),
  'Content-Type':'application/json',
 },body,
});

test('WP3-H2FIX01 canonical real 100/60/12 inventory, exact source-only fixture',async()=>{
 const {data,files,fx}=await setup();
 assert.equal(data.gear.items.length,100);
 assert.equal(data.kb.entities.length,60);
 assert.equal(data.catches.catches.length,12);
 assert.equal(files.has(PATH),false);
 assert.equal(fx.recordId,ID);
 assert.equal(fx.notesPath,PATH);
 assert.equal(fx.sourceRevision,MAIN);
 assert.equal(fx.testName,'WP3-H2-SYNTH-KB-001');
 assert.equal(fx.canPublish,false);
 assert.equal(fx.isLive,false);
 assert.equal(fx.sourceOnly,true);
 assert.equal(fx.package.notes.baseSha256,null);
 assert.equal(fx.package.picture.action,'keep');
 assert.equal(fx.package.pictureSequence.action,'keep');
 assert.deepEqual(JSON.parse(fx.body).snapshot.media,[]);
 validatePackage(fx.package);
 assert.equal(fx.bodySha256,createHash('sha256')
  .update(fx.body).digest('hex'));
 assert.equal(fx.body,JSON.stringify(JSON.parse(fx.body)));
});

test('WP3-H2FIX02 current canonical record validates plus Markdown and only two scoped outputs',async()=>{
 const {data,files,fx}=await setup();
 const before=JSON.stringify(data);
 const changed=await promoteChange({
  package:fx.package,sourceRevision:MAIN,currentRecord:undefined,
  validate:record=>validateRecord(record,'kb',data),
 });
 assert.equal(changed.record.id,ID);
 assert.equal(changed.record.content,PATH);
 assert.equal(changed.writes.length,1);
 assert.equal(changed.writes[0].path,PATH);
 const candidate=structuredClone(data);
 candidate.kb.entities.push(changed.record);
 const maps=validateRecords(candidate);
 const paths=validateLibraryPaths(candidate);
 assert.equal(candidate.kb.entities.length,61);
 const exists=new Set([...files,PATH]);
 assert.equal(validateMarkdown(changed.text,{
  owner:PATH,maps,exists,pathRoutes:paths,
 }).length,0);
 assert.equal(JSON.stringify(data),before);
 assert.equal(collectPaths(candidate).has(PATH),true);
 const jsonChanged=JSON.stringify(candidate.kb);
 assert.notEqual(jsonChanged,JSON.stringify(data.kb));
 assert.equal(JSON.stringify(candidate.gear),JSON.stringify(data.gear));
 assert.equal(JSON.stringify(candidate.catches),JSON.stringify(data.catches));
});

test('WP3-H2FIX03 actual source-review and atomic tree components accept exact synthetic KB package',async()=>{
 const {data,files,markdown,fx}=await setup();
 let sourceReads=0,sessionChecks=0,gitWrites=0;
 const intake=createD6ProductionPublishIntake({
  enabled:()=>true,origin:ORIGIN,isolatedOriginEnabled:()=>true,
  sessionFactory:()=>({authorizeWrite:async()=>{
   sessionChecks++;return {authorized:true,ownerGitHubId:265665562};
  }}),
 });
 const loadSnapshot=async({expectedReleaseRevision})=>{
  sourceReads++;
  assert.equal(expectedReleaseRevision,MAIN);
  return {repositoryId:1350909744,
   repositoryFullName:'ginosega/fishing',
   ref:'refs/heads/main',sourceRevision:MAIN,treeSha:TREE,
   data,files,markdown,sourceOnly:true,canPublish:false};
 };
 const review=createD6ProductionSourceReview({
  intake,loadSnapshot,enabled:()=>true,
 });
 const reviewed=await review.review(actualRequest(fx.body),{
  trustedMainSha:MAIN,
 });
 assert.equal(reviewed.fileOps.length,1);
 assert.equal(reviewed.fileOps[0].path,PATH);
 assert.equal(reviewed.candidateData.kb.entities.length,61);
 assert.equal(reviewed.canPublish,false);
 assert.equal(sourceReads,1);
 assert.equal(sessionChecks,1);
 const planner=createD6ProductionAtomicSourceMediaTree({
  loadSnapshot,enabled:()=>true,
  readGitBlob:async()=>{gitWrites++;throw Error('No media expected');},
  verifyTicket:async()=>false,
 });
 const operation={operationId:OP,repositoryId:1350909744,
  ownerGitHubId:265665562,ref:'refs/heads/main',
  state:'Accepted',sourceRevision:MAIN,snapshotSha256:SNAP,
  domain:'kb',operation:'add',recordId:ID};
 const plan=await planner.plan({operation,
  package:fx.package,mediaTickets:[]});
 assert.equal(plan.atomicTreeReady,true);
 assert.equal(plan.isLive,false);
 assert.equal(plan.canPublish,false);
 assert.equal(plan.mediaCount,0);
 assert.equal(plan.textCount,2);
 assert.deepEqual(new Set(plan.entries.map(x=>x.path)),
  new Set(['KB/kb.json',PATH]));
 assert.equal(gitWrites,0);
 assert.equal(sourceReads,2);
});

test('WP3-H2FIX04 exact-generated bytes accepted by H2 operator, modifications rejected',async()=>{
 const {fx}=await setup();
 const env={
  D6_WP3_H2_OPERATOR_APPROVED:'true',
  D6_WP3_H2_TEST_NAME:'WP3-H2-SYNTH-KB-001',
  D6_WP3_H2_APPROVED_PHASE:'intake',
  D6_WP3_H2_APPROVED_START:String(NOW-10),
  D6_WP3_H2_APPROVED_END:String(NOW+10),
  D6_WP3_H2_APPROVED_SOURCE_REVISION:MAIN,
  D6_WP3_H2_APPROVED_ENVELOPE_SHA256:fx.bodySha256,
  D6_WP3_H2_APPROVED_RECORD_ID:ID,
  D6_WP3_H2_APPROVED_NOTES_PATH:PATH,
 };
 const gate=createD6Wp3H2OperatorApproval({
  env,now:()=>NOW,cryptoApi:webcrypto,
 });
 assert.equal(gate.approved(),true);
 assert.equal(await gate.permit(actualRequest(fx.body)),true);
 assert.equal(await gate.permit(actualRequest(fx.body+' ')),false);
 assert.equal(await gate.permit(actualRequest(fx.body.replace(
  'Not fishing advice','Live fishing advice'))),false);
 env.D6_WP3_H2_OPERATOR_APPROVED='false';
 assert.equal(await gate.permit(actualRequest(fx.body)),false);
});

test('WP3-H2FIX05 absent or stale main snapshot/colliding record and path must deny',async()=>{
 const {files,ids}=await setup();
 const make=(overrides={})=>createD6Wp3H2SyntheticKbFixture({
  sourceRevision:MAIN,existingIds:ids,existingPaths:files,
  ...overrides,
 });
 for(const rev of ['','abc','z'.repeat(40),'a'.repeat(39),null])
  await assert.rejects(make({sourceRevision:rev}));
 await assert.rejects(make({existingIds:null}));
 await assert.rejects(make({existingPaths:undefined}));
 await assert.rejects(make({existingIds:new Set([...ids,ID])}),
  /already exists/);
 await assert.rejects(make({existingPaths:new Set([...files,PATH])}),
  /already exists/);
 // Source review must independently reject a main that drifted after
 // fixture generation; no implicit rebase to the new main.
 const fx=await make();
 const intake=createD6ProductionPublishIntake({
  enabled:()=>true,origin:ORIGIN,isolatedOriginEnabled:()=>true,
  sessionFactory:()=>({authorizeWrite:async()=>({
   authorized:true,ownerGitHubId:265665562,
  })}),
 });
 const review=createD6ProductionSourceReview({
  intake,enabled:()=>true,
  loadSnapshot:async()=>{throw Error('Should never reach snapshot loader');},
 });
 await assert.rejects(review.review(actualRequest(fx.body),{
  trustedMainSha:'d'.repeat(40),
 }),e=>e.code==='STALE_SOURCE');
});
