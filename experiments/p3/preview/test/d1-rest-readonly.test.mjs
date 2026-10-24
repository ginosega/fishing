import test from 'node:test';
import assert from 'node:assert/strict';
import {createP3ReadOnlyD1REST,P3ReadOnlyD1Error} from '../src/d1-rest-readonly.mjs';
import {createD1CheckLeaseReader} from '../src/d1-check-lease-reader.mjs';
import {createD1CheckObservationStore} from '../src/d1-check-observation-store.mjs';

const account='a'.repeat(32),dbid='11111111-2222-3333-4444-555555555555';
const key='private-test-only-token-not-real-01234567890';
const base='https://api.cloudflare.com/client/v4/accounts/'+account+'/d1/database/'+dbid;
const op='p3_00000001-1111-4111-8111-123456789abc';
const repo=1430581407,owner=778899;
function gateway(rowsByTable={}){
 const calls=[];
 async function request(url,init){
  calls.push({url,method:init.method,auth:init.headers.Authorization,body:init.body});
  if(url===base&&init.method==='GET')return {ok:true,json:async()=>({
   success:true,errors:[],result:{name:'fishing-p3-sandbox',uuid:dbid,version:'production'}})};
  assert.equal(url,base+'/query');
  assert.equal(init.method,'POST');
  const body=JSON.parse(init.body);
  assert(Array.isArray(body.params));
  const name=body.sql.includes('FROM p3_ci_observation_audit')?'history':
    body.sql.includes('FROM p3_ci_observations')?'observation':'lease';
  return {ok:true,json:async()=>({
   success:true,errors:[],result:[{success:true,results:rowsByTable[name]??[],
    meta:{changed_db:false,rows_written:0}}]})};
 }
 return {calls,request};
}
async function bind(g){return createP3ReadOnlyD1REST({
 accountId:account,databaseId:dbid,apiToken:key,request:g.request});}
test('P3-19 only fixed owner-scoped SELECTs and no write/batch interface',async()=>{
 const g=gateway(),DB=await bind(g);
 assert.deepEqual(Object.keys(DB),['prepare','batch']);
 assert.throws(()=>DB.prepare('UPDATE p3_operations SET state=?'),e=>e.code==='UNAPPROVED_SQL');
 assert.throws(()=>DB.prepare('SELECT * FROM p3_sessions'),e=>e.code==='UNAPPROVED_SQL');
 assert.throws(()=>DB.prepare('SELECT 1; DROP TABLE p3_operations;'),e=>e.code==='UNAPPROVED_SQL');
 await assert.rejects(DB.batch([]),e=>e.code==='REMOTE_BATCH_FORBIDDEN');
 assert.equal(g.calls.length,1,'no SQL request allowed from denied calls');
});
test('P3-19 live-shape REST transport supports existing owner-scoped lease read',async()=>{
 const g=gateway({lease:[{operation_id:op,state:'Checking',pr_number:1,
  pr_head_sha:'a'.repeat(40),main_base_sha:'b'.repeat(40)}]});
 const DB=await bind(g);
 const reader=createD1CheckLeaseReader({DB,ownerGitHubId:owner});
 const record=await reader.get(op);
 assert.equal(record.state,'Checking');assert.equal(record.prNumber,1);
 assert.deepEqual(JSON.parse(g.calls[1].body).params,[op,String(owner),String(repo)]);
 assert.equal(g.calls.length,2);
});
test('P3-19 existing Check observation store read/history works without mutations',async()=>{
 const g=gateway({observation:[],history:[{attempt:1,state:'passed',
  check_run_id:41,reason_code:null,observed_at:1800000000,next_poll_at:null}]});
 const DB=await bind(g),s=createD1CheckObservationStore({DB,ownerGitHubId:owner});
 assert.equal(await s.get(op),null);
 const history=await s.history(op);
 assert.equal(history[0].checkRunId,41);
 assert.equal(g.calls.length,3);
});
test('P3-19 rejects untrusted owner/repository bindings before SQL network request',async()=>{
 const g=gateway(),DB=await bind(g);
 assert.throws(()=>DB.prepare(
  'SELECT operation_id,state,pr_number,pr_head_sha,main_base_sha FROM p3_operations WHERE operation_id=? AND github_id=? AND repo_id=?'
 ).bind(op,owner,1350909744),e=>e.code==='INVALID_READ_PARAMETERS');
 assert.equal(g.calls.length,1);
});
test('P3-19 rejects wrong Cloudflare D1 identity, never logs private token',async()=>{
 const g=gateway();g.request=async()=>({ok:true,json:async()=>({
   success:true,errors:[],result:{name:'fishing-auth-p0',uuid:dbid,version:'production'}})});
 await assert.rejects(bind(g),e=>e instanceof P3ReadOnlyD1Error&&e.code==='WRONG_D1_TARGET'&&
  !e.message.includes(key));
});
test('P3-19 HTTP errors, malformed SQL shape and any claimed write fail closed',async()=>{
 const g=gateway(),DB=await bind(g);
 g.request=async()=>{throw Error(key)};
 // Binding captures initial gateway request function, so test independent fresh factory.
 await assert.rejects(createP3ReadOnlyD1REST({accountId:account,databaseId:dbid,
   apiToken:key,request:async()=>{throw Error(key)}}),
  e=>e.code==='REMOTE_NETWORK_FAILED'&&!e.message.includes(key));
 const bad=gateway();bad.request=async(url,init)=>init.method==='GET'
  ?{ok:true,json:async()=>({success:true,errors:[],result:{name:'fishing-p3-sandbox',
    uuid:dbid,version:'production'}})}
  :{ok:true,json:async()=>({success:true,errors:[],result:[{success:true,results:[],
    meta:{changed_db:true,rows_written:1}}]})};
 const other=await bind(bad),s=createD1CheckLeaseReader({DB:other,ownerGitHubId:owner});
 await assert.rejects(s.get(op),e=>e.code==='UNEXPECTED_DB_WRITE');
});
