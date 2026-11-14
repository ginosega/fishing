import test from 'node:test';
import assert from 'node:assert/strict';
import {
 D6_WP3_D1_SCHEMA_PLAN,createD6Wp3D1Readiness,
 D6Wp3D1ReadinessError,
} from '../../experiments/p3/preview/src/d6-production-wp3-d1-readiness.mjs';

const tables=[
 'd6_operation_receipts','d6_provider_step_fences',
 'd6_media_stage_verified','d6_atomic_tree_verified',
 'd6_publish_branch_verified','d6_publish_commit_verified',
 'd6_publish_commit_candidates','d6_publish_advance_verified',
 'd6_publish_pr_verified',
];
function fake({enabled=true,missing=null,extra=false,indexes=true,
 activeIndex=true,keys=true,unavailable=false,throwAt=null,
 loseGate=false}={}){
 const calls=[],state={enabled,missing,extra,indexes,
  activeIndex,keys,unavailable,throwAt,loseGate};
 const DB={prepare(sql){
  calls.push(sql);
  assert.ok(sql.startsWith('PRAGMA '),'no schema migration or D1 mutation');
  if(state.unavailable||state.throwAt===sql)throw Error('D1 unavailable');
  return {async all(){
   let result=[];
   const table=sql.match(/^PRAGMA table_info\("([^"]+)"\)$/)?.[1];
   if(table){
    const entry=D6_WP3_D1_SCHEMA_PLAN.find(x=>x.table===table);
    assert.ok(entry);
    result=state.missing===table?[]:
     entry.columns.map((x,i)=>({cid:i,...x,pk:i===0?1:0}));
    if(state.extra&&table==='d6_provider_step_fences')
     result=[...result,{cid:result.length,name:'rogue',type:'TEXT'}];
   }else if(sql==='PRAGMA index_list("d6_operation_receipts")'){
    result=state.indexes?[
     {name:'sqlite_autoindex_d6_operation_receipts_1',
      unique:1,partial:0},
     ...(state.activeIndex?[{name:'d6_operation_active_record',
      unique:1,partial:1}]:[]),
    ]:[];
   }else if(sql==='PRAGMA index_info("sqlite_autoindex_d6_operation_receipts_1")'){
    result=state.keys?
     [{name:'owner_github_id'},{name:'idempotency_key'}]:
     [{name:'owner_github_id'},{name:'snapshot_sha256'}];
   }else if(sql==='PRAGMA index_info("d6_operation_active_record")'){
    result=[{name:'owner_github_id'},{name:'domain'},
     {name:'record_id'}];
   }else throw Error('unknown introspection');
   if(state.loseGate)state.enabled=false;
   return {success:true,results:result};
  }};
 },
 async run(){throw Error('forbidden D1 run');},
 async exec(){throw Error('forbidden D1 exec');},
 async batch(){throw Error('forbidden D1 batch');},
 };
 return {state,calls,audit:createD6Wp3D1Readiness({
  DB,enabled:()=>state.enabled,
 })};
}
const denied=(promise,code)=>assert.rejects(promise,e=>
 e instanceof D6Wp3D1ReadinessError&&e.code===code);

test('WP3-D1PLAN01 exact imported nine-table D1 plan, immutable and no execute surface',()=>{
 assert.deepEqual(D6_WP3_D1_SCHEMA_PLAN.map(x=>x.table),tables);
 assert(Object.isFrozen(D6_WP3_D1_SCHEMA_PLAN));
 for(const entry of D6_WP3_D1_SCHEMA_PLAN){
  assert(Object.isFrozen(entry));
  assert(Object.isFrozen(entry.columns));
  assert.equal(entry.canApply,false);
  assert.equal(entry.sourceOnly,true);
  assert.match(entry.sql,/^CREATE TABLE IF NOT EXISTS d6_/);
  assert.match(entry.sql,/\);/);
  assert.doesNotMatch(entry.sql,
   /\b(?:DROP|ALTER|DELETE|INSERT|UPDATE|REPLACE|ATTACH|DETACH)\b/i);
  assert.ok(entry.columns.some(x=>x.name==='operation_id'));
  assert.equal(new Set(entry.columns.map(x=>x.name)).size,
   entry.columns.length);
 }
 assert.match(D6_WP3_D1_SCHEMA_PLAN[0].sql,
  /CREATE UNIQUE INDEX IF NOT EXISTS d6_operation_active_record/);
});

test('WP3-D1PLAN02 default-off schema audit touches no D1',async()=>{
 const x=fake({enabled:false});
 await denied(x.audit.inspect(),'DISABLED');
 assert.deepEqual(x.calls,[]);
 assert.deepEqual(Object.keys(x.audit),['inspect']);
 for(const name of ['apply','migrate','rollback','publish','fetch',
  'run','execute','install','activate','getCredentials'])
  assert.equal(name in x.audit,false);
});

test('WP3-D1PLAN03 provisioned exact schema yields read-only readiness, never Live',async()=>{
 const x=fake();
 const result=await x.audit.inspect();
 assert.deepEqual(result,{
  schemaReady:true,tableCount:9,
  receiptsUnique:true,activeRecordUnique:true,
  sourceOnly:true,canApply:false,
  writeAuthorized:false,canPublish:false,isLive:false,
  requiresSeparateOwnerApproval:true,
 });
 assert.equal(x.calls.length,12);
 assert.equal(x.calls.filter(x=>x.startsWith('PRAGMA table_info')).length,9);
 assert(x.calls.every(q=>q.startsWith('PRAGMA ')));
});

test('WP3-D1PLAN04 missing table or extra columns cannot be called ready',async()=>{
 for(const table of tables){
  const x=fake({missing:table});
  await denied(x.audit.inspect(),'SCHEMA_MISMATCH');
 }
 await denied(fake({extra:true}).audit.inspect(),'SCHEMA_MISMATCH');
});

test('WP3-D1PLAN05 both receipt uniqueness indexes mandatory',async()=>{
 for(const variant of [
  {indexes:false},{activeIndex:false},{keys:false},
 ]){
  const x=fake(variant);
  await denied(x.audit.inspect(),'RECEIPT_UNIQUENESS_UNVERIFIED');
 }
});

test('WP3-D1PLAN06 missing D1, PRAGMA error or unknown read fail closed',async()=>{
 await denied(createD6Wp3D1Readiness({
  enabled:()=>true,
 }).inspect(),'DB_UNAVAILABLE');
 const x=fake({unavailable:true});
 await denied(x.audit.inspect(),'SCHEMA_READ_UNKNOWN');
 assert.deepEqual(x.calls.length,1);
 const noIndex=fake({throwAt:
  'PRAGMA index_list("d6_operation_receipts")'});
 await denied(noIndex.audit.inspect(),'SCHEMA_READ_UNKNOWN');
});

test('WP3-D1PLAN07 revoked schema inspection gate cannot pass',async()=>{
 const x=fake({loseGate:true});
 await denied(x.audit.inspect(),'DISABLED');
 assert(x.calls.length>0);
});

test('WP3-D1PLAN08 no credentials, provider URLs, write flags or deployed bindings embedded',()=>{
 const code=D6_WP3_D1_SCHEMA_PLAN.map(x=>x.sql).join('\n');
 for(const secret of ['Bearer ','BEGIN TRANSACTION','CREATE TRIGGER',
  'INSERT INTO sessions','DELETE FROM sessions',
  'https://api.github.com','https://fishing.'])
  assert.equal(code.includes(secret),false);
 assert.equal(D6_WP3_D1_SCHEMA_PLAN.length,9);
});
