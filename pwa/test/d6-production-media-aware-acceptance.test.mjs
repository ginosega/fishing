import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareChange} from '../src/handoff.mjs';
import {D6_PUBLISH_INTAKE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionPublishIntake}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionSourceReview}
 from '../../experiments/p3/preview/src/d6-production-source-review.mjs';
import {createD6ProductionOperationReceipts}
 from '../../experiments/p3/preview/src/d6-production-operation-receipts.mjs';
import {expectedD6CanonicalMedia}
 from '../../experiments/p3/preview/src/d6-production-media-contract.mjs';

const MAIN='a'.repeat(40),TREE='b'.repeat(40);
const OWNER=265665562,REPO=1350909744;
const digest='c'.repeat(64);
const ORIGIN=D6_PUBLISH_INTAKE_ORIGIN;
const data=()=>({
 gear:{schemaVersion:2,items:[]},
 kb:{schemaVersion:2,entities:[]},
 catches:{schemaVersion:2,catches:[]},
});
const baseFiles=()=>new Set(['Gear/gear.json','KB/kb.json','Catches/catches.json']);
const metadata=path=>({path,bytes:314,sha256:digest});
const req=(pkg,key='media_immutable_submission_1234567890',media=expectedD6CanonicalMedia(pkg))=>
 new Request(ORIGIN+'/api/v3/operations',{
 method:'POST',headers:{
  Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'publish','X-Fish-V3-CSRF':'C'.repeat(43),
  'Content-Type':'application/json',
 },body:JSON.stringify({idempotencyKey:key,snapshot:{package:pkg,media}}),
});
async function packageFor(domain){
 if(domain==='gear'){
  const record={id:'example-jig',category:'lures',type:'Jigs',
   name:'Example Jig'};
  const path='Gear/Lures/assets/example.png';
  return prepareChange({domain,operation:'add',id:record.id,
   record,sourceRevision:MAIN,
   pictureAction:'add',picturePath:path,pictureFile:metadata(path)});
 }
 if(domain==='catches'){
  const record={id:'catch-example',date:'2026-11-12'};
  const path='Catches/assets/catch-example/notes/photo.png';
  const text='Catch story\n\n![Original](../assets/catch-example/notes/photo.png)';
  return prepareChange({domain,operation:'add',id:record.id,
   record,sourceRevision:MAIN,text,notesImages:[metadata(path)]});
 }
 const record={id:'example-knot',type:'knot',name:'Example Knot'};
 const frames=['step-01.png','step-02.png'].map(f=>
  'KB/Knots/assets/example-knot/'+f);
 return prepareChange({domain:'kb',operation:'add',id:record.id,
  record,sourceRevision:MAIN,text:'# Example Knot',
  pictureAction:'add',picturePath:frames[1],
  pictureFile:metadata(frames[1]),
  pictureSequenceAction:'set',pictureSequencePaths:frames,
  pictureSequenceFiles:frames.map(metadata)});
}
function memoryD1(){
 const rows=[],stats={reads:0,writes:0};
 const DB={prepare(sql){
  return {bind(...args){return {
   async first(){
    stats.reads++;
    if(sql.includes('WHERE owner_github_id=? AND idempotency_key=?'))
     return rows.find(x=>x.owner_github_id===args[0]&&
      x.idempotency_key===args[1])??null;
    if(sql.includes('WHERE operation_id=? AND owner_github_id=?'))
     return rows.find(x=>x.operation_id===args[0]&&
      x.owner_github_id===args[1])??null;
    throw Error('Unexpected query');
   },
   async run(){
    stats.writes++;
    if(!sql.startsWith('INSERT OR IGNORE INTO'))
     throw Error('Unexpected write');
    const [id,owner,key,snapshotHash,snapshot,candidateHash,
     source,domain,operation,recordId,created,updated]=args;
    const old=rows.find(r=>r.owner_github_id===owner&&
     (r.idempotency_key===key||r.domain===domain&&
      r.record_id===recordId&&
      ['Accepted','Unknown'].includes(r.state)));
    if(!old)rows.push({operation_id:id,owner_github_id:owner,
     idempotency_key:key,snapshot_sha256:snapshotHash,
     snapshot_json:snapshot,candidate_sha256:candidateHash,
     source_revision:source,domain,operation_kind:operation,
     record_id:recordId,state:'Accepted',
     created_at:created,updated_at:updated});
    return {meta:{changes:old?0:1}};
   },
  };}};}};
 return {DB,rows,stats};
}
function setup({owner=true,enabled=true,sourceFiles=baseFiles(),
 repoData=data(),sourceSha=MAIN,store=memoryD1()}={}){
 const state={auth:0,reads:0};
 const intake=createD6ProductionPublishIntake({
  enabled:()=>enabled,sessionFactory:()=>({
   authorizeWrite:async request=>{
    state.auth++;
    assert.equal(request.method,'POST');
    if(!owner)throw Error('Unauthorized');
    return {authorized:true,ownerGitHubId:OWNER};
   },
  }),
 });
 const review=createD6ProductionSourceReview({
  intake,enabled:()=>enabled,
  loadSnapshot:async({expectedReleaseRevision})=>{
   state.reads++;
   assert.equal(expectedReleaseRevision,MAIN);
   return {repositoryId:REPO,repositoryFullName:'ginosega/fishing',
    ref:'refs/heads/main',sourceRevision:sourceSha,treeSha:TREE,
    sourceOnly:true,canPublish:false,data:repoData,
    files:sourceFiles,markdown:new Map()};
  },
 });
 const receipts=createD6ProductionOperationReceipts({
  DB:store.DB,intake,review,enabled:()=>enabled,
  now:()=>1800000030,
  newId:()=> '123e4567-e89b-42d3-a456-426614174000',
 });
 return {intake,review,receipts,store,state};
}

test('WP3-MINT01 Gear picture pending originals pass intake and canonical source, not stage',async()=>{
 const pkg=await packageFor('gear'),x=setup();
 const intent=await x.intake.inspect(req(pkg),{trustedMainSha:MAIN});
 assert.equal(intent.snapshot.media.length,1);
 assert(Object.isFrozen(intent.snapshot.media[0]));
 assert.equal(intent.canPublish,false);
 const reviewed=await x.review.review(req(pkg),{trustedMainSha:MAIN});
 assert.equal(reviewed.pendingOriginals.length,1);
 assert.equal(reviewed.requiresSignedStaging,true);
 assert.equal(reviewed.requiresIndependentBlobReadback,true);
 assert(reviewed.candidateFiles.has(pkg.picture.path));
 assert.equal(reviewed.candidateData.gear.items[0].picture.src,pkg.picture.path);
 assert.equal(reviewed.canPublish,false);
 assert.equal(reviewed.operationId,undefined);
 assert.equal(x.state.reads,1);
});

test('WP3-MINT02 Catch original Notes photo is owned by canonical Markdown',async()=>{
 const pkg=await packageFor('catches'),x=setup();
 const reviewed=await x.review.review(req(pkg),{trustedMainSha:MAIN});
 assert.deepEqual(reviewed.pendingOriginals,
  expectedD6CanonicalMedia(pkg));
 assert.equal(reviewed.fileOps.length,1);
 assert.equal(reviewed.fileOps[0].action,'create');
 assert.equal(reviewed.candidateData.catches.catches[0].picture,undefined);
 assert.equal(reviewed.candidateData.catches.catches[0].notes,
  pkg.notes.path);
 assert(reviewed.candidateFiles.has(pkg.notes.images[0].path));
});

test('WP3-MINT03 Knot ordered original frames are source-reviewed together',async()=>{
 const pkg=await packageFor('kb'),x=setup();
 const reviewed=await x.review.review(req(pkg),{trustedMainSha:MAIN});
 assert.deepEqual(reviewed.pendingOriginals,expectedD6CanonicalMedia(pkg));
 assert.deepEqual(reviewed.pendingOriginals.map(m=>m.path),
  pkg.pictureSequence.paths);
 assert.equal(reviewed.candidateData.kb.entities[0].picture.src,
  pkg.picture.path);
 assert.deepEqual(reviewed.candidateData.kb.entities[0].pictureSequence,
  pkg.pictureSequence.paths);
 assert.equal(reviewed.requiresSignedStaging,true);
});

test('WP3-MINT04 complete media metadata is included in immutable durable accepted snapshot',async()=>{
 const pkg=await packageFor('catches'),x=setup();
 const accepted=await x.receipts.accept(req(pkg),{trustedMainSha:MAIN});
 assert.equal(accepted.status,'Accepted');
 assert.equal(accepted.isLive,false);
 assert.equal(accepted.canPublish,false);
 assert.equal(x.store.rows.length,1);
 const row=x.store.rows[0];
 assert.deepEqual(JSON.parse(row.snapshot_json).snapshot.media,
  expectedD6CanonicalMedia(pkg));
 assert.match(row.candidate_sha256,/^[0-9a-f]{64}$/);
 assert.equal(x.store.stats.writes,1);
 const retry=await x.receipts.accept(req(pkg),{trustedMainSha:'d'.repeat(40)});
 assert.equal(retry.operationId,accepted.operationId);
 assert.equal(x.store.stats.writes,1);
 assert.equal(x.state.reads,1);
 const change=structuredClone(pkg);
 change.notes.images[0].sha256='e'.repeat(64);
 const changed=await assert.rejects(
  x.receipts.accept(req(change),{trustedMainSha:MAIN}));
 assert(changed);
 assert.equal(x.store.rows.length,1);
});

test('WP3-MINT05 metadata mismatch is rejected before canonical source, D1 or upload',async()=>{
 const pkg=await packageFor('gear'),x=setup();
 for(const bad of [
  [],[{...pkg.picture.file,path:pkg.picture.path,bytes:313}],
  [{path:pkg.picture.path,bytes:314,sha256:'f'.repeat(64)}],
  [{path:pkg.picture.path,bytes:314,sha256:digest,
   blobSha:'f'.repeat(40)}],
 ]){
  await assert.rejects(x.receipts.accept(req(pkg,'media_immutable_submission_1234567890',bad),
   {trustedMainSha:MAIN}));
 }
 assert.equal(x.state.reads,0);
 assert.equal(x.store.stats.writes,0);
});

test('WP3-MINT06 forged source identity, unowned assets and source collisions fail closed',async()=>{
 const pkg=await packageFor('gear');
 const moved=setup({sourceSha:'f'.repeat(40)});
 await assert.rejects(moved.receipts.accept(req(pkg),{trustedMainSha:MAIN}));
 assert.equal(moved.store.stats.writes,0);
 const files=baseFiles();files.add(pkg.picture.path);
 const colliding=setup({sourceFiles:files});
 await assert.rejects(colliding.receipts.accept(req(pkg),{trustedMainSha:MAIN}));
 assert.equal(colliding.store.stats.writes,0);
});

test('WP3-MINT07 foreign owner cannot access canonical source or durable acceptance',async()=>{
 const pkg=await packageFor('catches'),x=setup({owner:false});
 await assert.rejects(x.receipts.accept(req(pkg),{trustedMainSha:MAIN}));
 assert.equal(x.state.reads,0);
 assert.equal(x.store.stats.reads,0);
 assert.equal(x.store.stats.writes,0);
});

test('WP3-MINT08 text-only intake still produces no pending media, no signed stage',async()=>{
 const pkg=await prepareChange({domain:'gear',operation:'add',
  id:'simple-lure',record:{id:'simple-lure',category:'lures',
   type:'Jigs',name:'Simple Lure'},sourceRevision:MAIN});
 const x=setup();
 const candidate=await x.review.review(req(pkg),{trustedMainSha:MAIN});
 assert.deepEqual(candidate.pendingOriginals,[]);
 assert.equal(candidate.requiresSignedStaging,false);
 assert.equal(candidate.requiresIndependentBlobReadback,false);
 assert.equal(candidate.canPublish,false);
});

test('WP3-MINT09 altered media path or Note reference cannot create receipt',async()=>{
 const pkg=await packageFor('catches'),x=setup();
 const fake=structuredClone(pkg);
 fake.notes.body='# Missing image attachment';
 await assert.rejects(x.receipts.accept(req(fake),{trustedMainSha:MAIN}));
 assert.equal(x.store.rows.length,0);
 assert.equal(x.store.stats.writes,0);
});

test('WP3-MINT10 disabled or missing D1 means no provisional success',async()=>{
 const pkg=await packageFor('gear'),x=setup({enabled:false});
 await assert.rejects(x.receipts.accept(req(pkg),{trustedMainSha:MAIN}));
 assert.equal(x.state.reads,0);
 assert.equal(x.store.stats.writes,0);
 const bad=setup({store:{DB:{prepare:()=>{throw Error('DB missing');}},
  rows:[],stats:{reads:0,writes:0}}});
 await assert.rejects(bad.receipts.accept(req(pkg),{trustedMainSha:MAIN}));
 assert.equal(bad.state.reads,0);
});
