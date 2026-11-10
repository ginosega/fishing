import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6ProductionPublishIntake,D6_PUBLISH_INTAKE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionSourceReview}
 from '../../experiments/p3/preview/src/d6-production-source-review.mjs';
import {createD6ProductionOperationReceipts,D6ReceiptError,
 D6_RECEIPTS_SCHEMA_SQL}
 from '../../experiments/p3/preview/src/d6-production-operation-receipts.mjs';

const MAIN='a'.repeat(40),LATER='b'.repeat(40),TREE='c'.repeat(40);
const OWNER=265665562;
const makeData=()=>({
 gear:{schemaVersion:2,items:[]},kb:{schemaVersion:2,entities:[]},
 catches:{schemaVersion:2,catches:[]},
});
const packageFor=(name='Sample',sourceRevision=MAIN)=>({
 format:'fishing-companion-change-v2',domain:'gear',operation:'add',
 id:'sample-item',base:{schemaVersion:2,sourceRevision,recordHash:null},
 record:{id:'sample-item',category:'lures',type:'Jigs',name},
 notes:{action:'keep'},picture:{action:'keep'},
 pictureSequence:{action:'keep'},
});
const makeRequest=({key='sample_idempotency_key_1234',
 name='Sample',sourceRevision=MAIN}={})=>new Request(
 D6_PUBLISH_INTAKE_ORIGIN+'/api/v3/operations',{
 method:'POST',headers:{
  Origin:D6_PUBLISH_INTAKE_ORIGIN,
  'Sec-Fetch-Site':'same-origin','X-Fish-V3-Intent':'publish',
  'X-Fish-V3-CSRF':'C'.repeat(43),'Content-Type':'application/json',
 },body:JSON.stringify({idempotencyKey:key,snapshot:{
  package:packageFor(name,sourceRevision),media:[],
 }})});

function mockD1({absent=false,uncertainOnce=false}={}){
 const rows=[],calls={reads:0,writes:0};
 let afterWriteFail=uncertainOnce;
 const DB={prepare(sql){
  if(absent)throw Error('no D1 table');
  return {bind(...args){
   return {
    async first(){
     calls.reads++;
     if(sql.includes('WHERE owner_github_id=? AND idempotency_key=?')){
      const [owner,key]=args;
      return rows.find(r=>r.owner_github_id===owner&&
       r.idempotency_key===key)??null;
     }
     if(sql.includes('WHERE operation_id=? AND owner_github_id=?')){
      const [id,owner]=args;
      return rows.find(r=>r.operation_id===id&&
       r.owner_github_id===owner)??null;
     }
     throw Error('Unexpected SELECT');
    },
    async run(){
     calls.writes++;
     if(sql.startsWith('INSERT OR IGNORE INTO')){
      const [id,owner,key,sha,snapshot,candidate,source,
       domain,kind,recordId,created,updated]=args;
      if(!rows.some(r=>r.owner_github_id===owner&&
       (r.idempotency_key===key||
        r.domain===domain&&r.record_id===recordId&&
        ['Accepted','Unknown'].includes(r.state)))){
       rows.push({operation_id:id,owner_github_id:owner,
        idempotency_key:key,snapshot_sha256:sha,snapshot_json:snapshot,
        candidate_sha256:candidate,source_revision:source,
        domain,operation_kind:kind,record_id:recordId,
        state:'Accepted',created_at:created,updated_at:updated});
      }
      if(afterWriteFail){
       afterWriteFail=false;
       throw Error('D1 commit result unknown after insert');
      }
      return {success:true};
     }
     if(sql.startsWith('UPDATE d6_operation_receipts')){
      const [at,id,owner]=args;
      const r=rows.find(x=>x.operation_id===id&&
       x.owner_github_id===owner);
      if(r&&r.state==='Accepted'){r.state='Unknown';r.updated_at=at;}
      return {success:true};
     }
     throw Error('Unexpected UPDATE');
    },
   };
  }};
 }};
 return {DB,rows,calls};
}
function setup({enabled=true,owner=true,store=mockD1(),
 reviewOverride=null}={}){
 let checks=0,reads=0,ids=0;
 const intake=createD6ProductionPublishIntake({
  enabled:()=>true,
  sessionFactory:()=>({authorizeWrite:async()=>{
   checks++;
   if(!owner)throw Error('Session denied');
   return {authorized:true,ownerGitHubId:OWNER};
  }}),
 });
 const trustedReview=createD6ProductionSourceReview({
  intake,enabled:()=>true,
  loadSnapshot:async({expectedReleaseRevision})=>{
   reads++;
   assert.equal(expectedReleaseRevision,MAIN);
   return {repositoryId:1350909744,
    repositoryFullName:'ginosega/fishing',ref:'refs/heads/main',
    sourceRevision:MAIN,treeSha:TREE,
    sourceOnly:true,canPublish:false,data:makeData(),
    files:new Set(['Gear/gear.json','KB/kb.json','Catches/catches.json']),
    markdown:new Map()};
  },
 });
 const receipt=createD6ProductionOperationReceipts({
  DB:store.DB,intake,review:reviewOverride??trustedReview,
  enabled:()=>enabled,now:()=>1800000000,
  newId:()=>`00000000-0000-4000-8000-${String(++ids).padStart(12,'0')}`,
 });
 return {receipt,store,count:()=>({checks,reads,ids})};
}
const reject=async(p,code)=>assert.rejects(p,e=>e instanceof
 D6ReceiptError&&e.code===code);

test('D6-RECEIPT01 default OFF never touches intake, DB or provider',async()=>{
 const s=setup({enabled:false});
 await reject(s.receipt.accept(makeRequest(),{trustedMainSha:MAIN}),
  'DISABLED');
 assert.deepEqual(s.count(),{checks:0,reads:0,ids:0});
 assert.deepEqual(s.store.calls,{reads:0,writes:0});
 assert.match(D6_RECEIPTS_SCHEMA_SQL,/UNIQUE\(owner_github_id,idempotency_key\)/);
 assert.match(D6_RECEIPTS_SCHEMA_SQL,/d6_operation_active_record/);
 assert.match(D6_RECEIPTS_SCHEMA_SQL,/state IN \('Accepted','Unknown'\)/);
});

test('D6-RECEIPT02 accepted intent is persisted, immutable and never Live',async()=>{
 const s=setup(),r=await s.receipt.accept(makeRequest(),{
  trustedMainSha:MAIN});
 assert.equal(r.status,'Accepted');assert.equal(r.sourceOnly,true);
 assert.equal(r.isLive,false);assert.equal(r.canPublish,false);
 assert.equal(r.operationId,'00000000-0000-4000-8000-000000000001');
 assert.equal(r.sourceRevision,MAIN);
 assert.equal(s.store.rows.length,1);
 const row=s.store.rows[0];
 assert.equal(row.state,'Accepted');
 assert.equal(JSON.parse(row.snapshot_json).snapshot.package.record.name,
  'Sample');
 assert.match(row.candidate_sha256,/^[a-f0-9]{64}$/);
 assert.equal(s.count().reads,1);
});

test('D6-RECEIPT03 same-key retry after main changes returns exact receipt',async()=>{
 const s=setup(),first=await s.receipt.accept(makeRequest(),{
  trustedMainSha:MAIN});
 const retry=await s.receipt.accept(makeRequest(),{
  trustedMainSha:LATER});
 assert.deepEqual(retry,first);
 assert.equal(s.count().reads,1);
 assert.equal(s.store.calls.writes,1);
});

test('D6-RECEIPT04 same key different snapshot cannot change accepted edit',async()=>{
 const s=setup();await s.receipt.accept(makeRequest(),{
  trustedMainSha:MAIN});
 await reject(s.receipt.accept(makeRequest({name:'Different'}),{
  trustedMainSha:MAIN}),'KEY_REUSE');
 assert.equal(s.store.rows.length,1);
 assert.equal(s.count().reads,1);
});

test('D6-RECEIPT05 simultaneous same-key submissions never create two rows',async()=>{
 const s=setup();
 const [a,b]=await Promise.all([
  s.receipt.accept(makeRequest(),{trustedMainSha:MAIN}),
  s.receipt.accept(makeRequest(),{trustedMainSha:MAIN}),
 ]);
 assert.equal(a.operationId,b.operationId);
 assert.equal(s.store.rows.length,1);
});

test('D6-RECEIPT06 different key cannot start second active same-record edit',async()=>{
 const s=setup();await s.receipt.accept(makeRequest(),{
  trustedMainSha:MAIN});
 await reject(s.receipt.accept(makeRequest({
  key:'another_submission_12345'}),{trustedMainSha:MAIN}),'RECORD_BUSY');
 assert.equal(s.store.rows.length,1);
});

test('D6-RECEIPT07 unknown provider outcome is sticky, blocks all replay',async()=>{
 const s=setup(),a=await s.receipt.accept(makeRequest(),{
  trustedMainSha:MAIN});
 const unknown=await s.receipt.markUnknown(a.operationId);
 assert.equal(unknown.status,'Unknown');
 const same=await s.receipt.accept(makeRequest(),{
  trustedMainSha:LATER});
 assert.equal(same.status,'Unknown');
 assert.equal(same.operationId,a.operationId);
 await reject(s.receipt.accept(makeRequest({
  key:'another_submission_12345'}),{trustedMainSha:MAIN}),'RECORD_BUSY');
 assert.equal((await s.receipt.markUnknown(a.operationId)).status,'Unknown');
 assert.equal(s.store.rows.length,1);
});

test('D6-RECEIPT08 unauthorized session has no D1 or review side effects',async()=>{
 const s=setup({owner:false});
 await assert.rejects(s.receipt.accept(makeRequest(),{
  trustedMainSha:MAIN}));
 assert.deepEqual(s.store.calls,{reads:0,writes:0});
 assert.equal(s.count().reads,0);
});

test('D6-RECEIPT09 missing D1 schema fails closed before review',async()=>{
 const s=setup({store:mockD1({absent:true})});
 await reject(s.receipt.accept(makeRequest(),{
  trustedMainSha:MAIN}),'STORE_UNAVAILABLE');
 assert.equal(s.count().reads,0);
});

test('D6-RECEIPT10 unreviewed stale main never creates receipt',async()=>{
 const s=setup();
 await assert.rejects(s.receipt.accept(makeRequest({
  sourceRevision:LATER}),{trustedMainSha:MAIN}),
  e=>e?.code==='STALE_SOURCE');
 assert.equal(s.store.rows.length,0);
});

test('D6-RECEIPT11 lost D1 insert acknowledgment is safely retryable',async()=>{
 const s=setup({store:mockD1({uncertainOnce:true})});
 await reject(s.receipt.accept(makeRequest(),{
  trustedMainSha:MAIN}),'STORE_UNAVAILABLE');
 assert.equal(s.store.rows.length,1);
 const once=s.store.rows[0].operation_id;
 const result=await s.receipt.accept(makeRequest(),{trustedMainSha:LATER});
 assert.equal(result.operationId,once);
 assert.equal(s.store.rows.length,1);
 assert.equal(s.count().reads,1);
});

test('D6-RECEIPT12 rejected forged review cannot produce accepted receipt',async()=>{
 const fake={review:async()=>({sourceOnly:true,canPublish:true,
  requiresDurableOperation:true})};
 const s=setup({reviewOverride:fake});
 await reject(s.receipt.accept(makeRequest(),{trustedMainSha:MAIN}),
  'UNTRUSTED_CANDIDATE');
 assert.equal(s.store.rows.length,0);
});

test('D6-RECEIPT13 unknown IDs and corrupt stored rows never claim success',async()=>{
 const s=setup();
 await reject(s.receipt.markUnknown(
  '00000000-0000-4000-8000-000000000099'),'OPERATION_NOT_FOUND');
 await s.receipt.accept(makeRequest(),{trustedMainSha:MAIN});
 s.store.rows[0].state='Live';
 await reject(s.receipt.accept(makeRequest(),{trustedMainSha:MAIN}),
  'CORRUPT_RECEIPT');
});
