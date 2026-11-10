import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6ProductionPrCreationFence,D6PrCreationFenceError,
 D6_PR_CREATE_FENCE_SQL}
 from '../../experiments/p3/preview/src/d6-production-pr-creation-fence.mjs';

const OWNER=265665562,REPO=1350909744;
const ID='00000000-0000-4000-8000-000000000001';
const BASE='a'.repeat(40),HEAD='b'.repeat(40),HASH='d'.repeat(64);
const BRANCH='fish-v3/publish/'+ID;
const op=()=>({operationId:ID,ownerGitHubId:OWNER,repositoryId:REPO,
 ref:'refs/heads/main',sourceRevision:BASE,candidateSha256:HASH,
 state:'Accepted',domain:'gear',operation:'edit'});
const evidence=()=>({repositoryId:REPO,ownerGitHubId:OWNER,
 operationId:ID,branch:BRANCH,baseRef:'main',baseSha:BASE,
 candidateSha256:HASH,contentOnly:true,independentlyVerified:true,
 prNumber:501,headSha:HEAD});

function fakeD1({missing=false,uncertainInsert=false,
 uncertainCreated=false}={}){
 const rows=[],stats={writes:0,reads:0};let lostInsert=uncertainInsert,
 lostCreated=uncertainCreated;
 const DB={prepare(sql){
  if(missing)throw Error('Table not migrated');
  return {bind(...args){return {
   async first(){
    stats.reads++;
    assert(sql.startsWith('SELECT '));
    return rows.find(x=>x.operation_id===args[0])??null;
   },
   async run(){
    stats.writes++;
    if(sql.startsWith('INSERT OR IGNORE')){
     const [id,owner,repo,source,candidate,branch,created,updated]=args;
     const exists=rows.some(x=>x.operation_id===id||
      x.branch_name===branch);
     if(!exists)rows.push({operation_id:id,owner_github_id:owner,
      repository_id:repo,source_revision:source,
      candidate_sha256:candidate,branch_name:branch,
      state:'Unknown',pr_number:null,pr_head_sha:null,
      created_at:created,updated_at:updated});
     if(lostInsert){lostInsert=false;throw Error('DB commit ack lost');}
     return {meta:{changes:exists?0:1}};
    }
    if(sql.startsWith('UPDATE d6_pr_creation_fences')){
     const [number,head,at,id,source,digest]=args;
     const row=rows.find(x=>x.operation_id===id&&
      x.source_revision===source&&x.candidate_sha256===digest);
     if(row?.state==='Unknown'){
      row.state='Created';row.pr_number=number;
      row.pr_head_sha=head;row.updated_at=at;
     }
     if(lostCreated){lostCreated=false;
      throw Error('PR receipt D1 commit ack lost');}
     return {meta:{changes:row?1:0}};
    }
    throw Error('unexpected D1 SQL');
   },
  };}};
 }};
 return {DB,rows,stats};
}
function setup({
 enabled=true,db=fakeD1(),row=op(),remote=null,
 createError=false,inspectError=false,revokedOnCreate=false,
}={}){
 const state={active:enabled,creates:[],inspects:[],reads:0,remote};
 const gate=createD6ProductionPrCreationFence({
  DB:db.DB,
  enabled:()=>state.active,now:()=>1800000000,
  readOperation:async id=>{
   state.reads++;
   assert.equal(id,ID);
   return row;
  },
  createPr:async req=>{
   state.creates.push(req);
   if(revokedOnCreate)state.active=false;
   if(createError)throw Error('provider write result uncertain');
   state.remote=evidence();
   return {untrusted:true};
  },
  inspectPr:async req=>{
   state.inspects.push(req);
   if(inspectError)throw Error('remote service unreadable');
   return state.remote;
  },
 });
 return {gate,state,db};
}
const denied=async(p,code)=>assert.rejects(p,e=>
 e instanceof D6PrCreationFenceError&&e.code===code);

test('D6-PRFENCE01 default OFF makes no DB/provider requests',async()=>{
 const x=setup({enabled:false});
 await denied(x.gate.begin(ID),'DISABLED');
 await denied(x.gate.check(ID),'DISABLED');
 assert.equal(x.state.reads,0);
 assert.deepEqual(x.db.stats,{writes:0,reads:0});
 assert.deepEqual(x.state.creates,[]);
 assert.match(D6_PR_CREATE_FENCE_SQL,/operation_id TEXT PRIMARY KEY/);
 assert.match(D6_PR_CREATE_FENCE_SQL,/branch_name TEXT NOT NULL UNIQUE/);
 assert.match(D6_PR_CREATE_FENCE_SQL,/state IN \('Unknown','Created'\)/);
 assert.deepEqual(Object.keys(x.gate),['begin','check']);
});

test('D6-PRFENCE02 persist unknown fence BEFORE first provider mutation',async()=>{
 const x=setup();
 const observed=[];
 const original=x.state.creates.push.bind(x.state.creates);
 x.state.creates.push=(request)=>{
  assert.equal(x.db.rows.length,1);
  assert.equal(x.db.rows[0].state,'Unknown');
  assert.equal(x.db.rows[0].branch_name,BRANCH);
  observed.push('fenced');
  return original(request);
 };
 const receipt=await x.gate.begin(ID);
 assert.deepEqual(observed,['fenced']);
 assert.equal(receipt.state,'Created');
 assert.equal(receipt.prNumber,501);
 assert.equal(receipt.headSha,HEAD);
 assert.equal(receipt.canMerge,false);
 assert.equal(receipt.canPublish,false);
 assert.equal(receipt.isLive,false);
 assert.equal(x.state.creates.length,1);
 assert.equal(x.state.inspects.length,1);
 assert.equal(x.db.rows[0].state,'Created');
});

test('D6-PRFENCE03 same operation retries never create second PR',async()=>{
 const x=setup();
 const first=await x.gate.begin(ID);
 const retry=await x.gate.begin(ID);
 const checked=await x.gate.check(ID);
 assert.deepEqual(first,retry);
 assert.deepEqual(retry,checked);
 assert.equal(x.state.creates.length,1);
 assert.equal(x.db.rows.length,1);
});

test('D6-PRFENCE04 simultaneous calls get one unique persisted write claim',async()=>{
 const x=setup();
 const [a,b]=await Promise.all([x.gate.begin(ID),x.gate.begin(ID)]);
 assert.equal(x.state.creates.length,1);
 assert.equal(x.db.rows.length,1);
 assert(['Unknown','Created'].includes(a.state));
 assert(['Unknown','Created'].includes(b.state));
 assert.equal((await x.gate.check(ID)).state,'Created');
});

test('D6-PRFENCE05 uncertain provider write stays locked, no blind retry',async()=>{
 const x=setup({createError:true});
 const first=await x.gate.begin(ID);
 assert.equal(first.state,'Unknown');
 assert.equal(first.requiresReconciliation,true);
 assert.equal(first.prNumber,null);
 const retry=await x.gate.begin(ID);
 assert.equal(retry.state,'Unknown');
 assert.equal(x.state.creates.length,1);
 const check=await x.gate.check(ID);
 assert.equal(check.state,'Unknown');
 assert.equal(x.state.inspects.length,1);
});

test('D6-PRFENCE06 remote result can be reconciled without a second write',async()=>{
 const x=setup({createError:true});
 await x.gate.begin(ID);
 x.state.remote=evidence();
 const resolved=await x.gate.check(ID);
 assert.equal(resolved.state,'Created');
 assert.equal(resolved.prNumber,501);
 assert.equal(x.state.creates.length,1);
 assert.equal(x.db.rows.length,1);
});

test('D6-PRFENCE07 absent remote or inspection failure never clears unknown',async()=>{
 for(const settings of [{createError:true},{inspectError:true}]){
  const x=setup(settings),r=await x.gate.begin(ID);
  if(settings.inspectError)assert.equal(r.state,'Unknown');
  const result=await x.gate.check(ID);
  assert.equal(result.state,'Unknown');
  assert.equal(x.state.creates.length,1);
  assert.equal(x.db.rows[0].state,'Unknown');
 }
});

test('D6-PRFENCE08 remote forgery/mismatched digest/branch is refused',async()=>{
 for(const bad of [
  {repositoryId:1430581407},{ownerGitHubId:0},
  {operationId:'bad'},{branch:'other'},{baseSha:HEAD},
  {candidateSha256:'e'.repeat(64)},{baseRef:'develop'},
  {contentOnly:false},{independentlyVerified:false},
  {prNumber:0},{headSha:'not-sha'},
 ]){
  const x=setup({createError:true});
  await x.gate.begin(ID);
  x.state.remote={...evidence(),...bad};
  await denied(x.gate.check(ID),'PR_NOT_VERIFIED');
  assert.equal(x.db.rows[0].state,'Unknown');
  assert.equal(x.state.creates.length,1);
 }
});

test('D6-PRFENCE09 invalid/foreign/non-Accepted durable operation denied',async()=>{
 for(const bad of [
  {repositoryId:1},{ownerGitHubId:0},
  {ref:'refs/heads/develop'},{state:'Unknown'},
  {state:'Live'}, {sourceRevision:'bad'},
  {candidateSha256:'bad'},{domain:'catches'},
  {operation:'delete'},
 ]){
  const x=setup({row:{...op(),...bad}});
  await denied(x.gate.begin(ID),'UNTRUSTED_OPERATION');
  assert.equal(x.db.stats.writes,0);
  assert.equal(x.state.creates.length,0);
 }
});

test('D6-PRFENCE10 missing migration or uncertain insert ack cannot create PR',async()=>{
 for(const cfg of [{missing:true},{uncertainInsert:true}]){
  const x=setup({db:fakeD1(cfg)});
  await denied(x.gate.begin(ID),'STORE_UNAVAILABLE');
  assert.equal(x.state.creates.length,0);
  if(cfg.uncertainInsert){
   const result=await x.gate.begin(ID);
   assert.equal(result.state,'Unknown');
   assert.equal(x.state.creates.length,0);
  }
 }
});

test('D6-PRFENCE11 losing Created commit ack never causes a second write',async()=>{
 const x=setup({db:fakeD1({uncertainCreated:true})});
 await denied(x.gate.begin(ID),'STORE_UNAVAILABLE');
 assert.equal(x.db.rows[0].state,'Created');
 const r=await x.gate.begin(ID);
 assert.equal(r.state,'Created');
 assert.equal(x.state.creates.length,1);
});

test('D6-PRFENCE12 stored receipt corruption cannot authorize provider use',async()=>{
 const x=setup({createError:true});
 await x.gate.begin(ID);
 x.db.rows[0].source_revision=HEAD;
 await denied(x.gate.begin(ID),'CORRUPT_FENCE');
 await denied(x.gate.check(ID),'CORRUPT_FENCE');
 assert.equal(x.state.creates.length,1);
});

test('D6-PRFENCE13 revocation after durable write claim blocks provider call',async()=>{
 const x=setup({revokedOnCreate:true});
 const r=await x.gate.begin(ID);
 assert.equal(r.state,'Unknown');
 assert.equal(x.db.rows.length,1);
 const again=await x.gate.begin(ID).catch(e=>e.code);
 assert.equal(again,'DISABLED');
 assert.equal(x.state.creates.length,1);
});

test('D6-PRFENCE14 restart sharing durable D1 reads known PR, no repeat',async()=>{
 const db=fakeD1();
 const first=setup({db});
 await first.gate.begin(ID);
 const second=setup({db,createError:true});
 const r=await second.gate.begin(ID);
 assert.equal(r.state,'Created');
 assert.equal(second.state.creates.length,0);
 assert.equal(db.rows.length,1);
});

test('D6-PRFENCE15 invalid operation ID and constructor fail safely',async()=>{
 const x=setup();
 await denied(x.gate.begin('forged-id'),'INVALID_OPERATION');
 assert.equal(x.db.stats.reads,0);
 assert.throws(()=>createD6ProductionPrCreationFence({
  DB:x.db.DB,readOperation:()=>{},createPr:()=>{},inspectPr:null,
 }),e=>e instanceof D6PrCreationFenceError&&e.code==='INVALID_CONFIG');
});
