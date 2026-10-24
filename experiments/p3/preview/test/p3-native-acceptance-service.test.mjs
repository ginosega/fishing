import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sandbox,sample} from './d1-fixture.mjs';
import {signP3InternalCommand} from '../src/p3-internal-command-gate.mjs';
import {createP3NativeAcceptanceService} from '../src/p3-native-acceptance-service.mjs';

const TIME=1800000000000,OWNER=778899,DBNAME='fishing-p3-sandbox';
const origin='https://fishing-p3-sandbox-preview.ginosega.workers.dev';
const route=origin+'/_p3/internal/command';
const secret='test-only-p3-bridge-shared-hmac-0123456789012345';
const nonce='nonce-first-valid-command-0123456789abc';
const id='p3_00000001-1111-4111-8111-123456789abc';
function fixture({migrate=true}={}){
 const f=sandbox();
 if(migrate)f.sql.exec(readFileSync(new URL('../migrations/0004_command_nonce_ledger.sql',import.meta.url),'utf8'));
 let approved=false,created=0;
 const env={APP_ORIGIN:origin,DB:f.DB,P3_OWNER_GITHUB_ID:String(OWNER),
  P3_WRITE_ENABLED:'false',P3_COMMAND_BRIDGE_ENABLED:'false',
  P3_BRIDGE_HMAC_SECRET:secret};
 const service=createP3NativeAcceptanceService({
  env,operatorApproved:()=>approved,now:()=>TIME,
  makeId:()=>{created++;return id;},
 });
 async function request({key='key-idempotent-op-1234567',n=nonce,
  body,usedSecret=secret,method='POST',url=route}={}){
  const content=body??JSON.stringify({action:'accept',idempotencyKey:key,snapshot:sample});
  const auth=await signP3InternalCommand({secret:usedSecret,nonce:n,timestamp:TIME,body:content});
  return new Request(url,{method,headers:{'Content-Type':'application/json',...auth},
   body:method==='POST'?content:undefined});
 }
 return {f,env,service,request,enable(){approved=true;env.P3_WRITE_ENABLED='true';env.P3_COMMAND_BRIDGE_ENABLED='true';},get created(){return created}};
}
function rows(f,table){return f.sql.prepare('SELECT COUNT(*) AS n FROM '+table).get().n;}
test('P3-S01 source-only factory exports only handle; disabled means zero D1 writes',async()=>{
 const x=fixture();
 assert.deepEqual(Object.keys(x.service),['handle']);
 for(const key of ['merge','publish','issueToken','deploy','createDraftStep','accept'])assert.equal(key in x.service,false);
 const response=await x.service.handle(await x.request());
 assert.equal(response.status,503);
 assert.equal(rows(x.f,'p3_command_nonces'),0);
 assert.equal(rows(x.f,'p3_operations'),0);
 x.f.sql.close();
});
test('P3-S02 signed operation persists nonce, Accepted snapshot and audit under same owner',async()=>{
 const x=fixture();x.enable();
 const r=await x.service.handle(await x.request());assert.equal(r.status,202);
 assert.deepEqual(await r.json(),{ok:true,operationId:id,state:'Accepted'});
 for(const table of ['p3_command_nonces','p3_operations','p3_requests','p3_events'])
  assert.equal(rows(x.f,table),1,table);
 const op=x.f.sql.prepare('SELECT github_id,repo_id,state FROM p3_operations').get();
 assert.deepEqual({...op},{github_id:OWNER,repo_id:1430581407,state:'Accepted'});
 assert.equal(x.created,1);
 x.f.sql.close();
});
test('P3-S03 same nonce replay denied even across a new service instance',async()=>{
 const x=fixture();x.enable();
 assert.equal((await x.service.handle(await x.request())).status,202);
 const other=createP3NativeAcceptanceService({env:x.env,operatorApproved:()=>true,now:()=>TIME,
  makeId:()=>{throw Error('must not create');}});
 const again=await other.handle(await x.request());
 assert.equal(again.status,409);
 assert.equal(rows(x.f,'p3_operations'),1);
 assert.equal(rows(x.f,'p3_command_nonces'),1);
 x.f.sql.close();
});
test('P3-S04 new nonce plus same idempotency key preserves one operation',async()=>{
 const x=fixture();x.enable();
 const r1=await x.service.handle(await x.request());assert.equal(r1.status,202);
 const r2=await x.service.handle(await x.request({n:'nonce-second-retry-0123456789abcdefg'}));
 assert.equal(r2.status,202);
 assert.equal((await r2.json()).operationId,id);
 assert.equal(rows(x.f,'p3_command_nonces'),2);
 assert.equal(rows(x.f,'p3_operations'),1);
 assert.equal(rows(x.f,'p3_requests'),1);
 assert.equal(rows(x.f,'p3_events'),1);
 x.f.sql.close();
});
test('P3-S05 without remote R4 schema there is no accepted write or event',async()=>{
 const x=fixture({migrate:false});x.enable();
 const r=await x.service.handle(await x.request());
 assert.equal(r.status,503);
 assert.equal(rows(x.f,'p3_operations'),0);
 assert.equal(rows(x.f,'p3_requests'),0);
 x.f.sql.close();
});
test('P3-S06 wrong HMAC or JSON action cannot cause nonce or Accepted row',async()=>{
 const x=fixture();x.enable();
 let r=await x.service.handle(await x.request({usedSecret:'test-only-invalid-secret-of-sufficient-length'}));
 assert.equal(r.status,403);
 const wrong=JSON.stringify({action:'publish',idempotencyKey:'key-good-123456789012',snapshot:sample});
 r=await x.service.handle(await x.request({body:wrong,n:'nonce-rejected-test-0123456789abc'}));
 assert.equal(r.status,403);
 assert.equal(rows(x.f,'p3_command_nonces'),0);
 assert.equal(rows(x.f,'p3_operations'),0);
 x.f.sql.close();
});
test('P3-S07 invalid owner/DB/origin config hard stops at construction',()=>{
 const x=fixture();
 for(const overrides of [{P3_OWNER_GITHUB_ID:'0'},{P3_OWNER_GITHUB_ID:'9999999999999999999'},
  {DB:{}},{APP_ORIGIN:'https://example.com'},{P3_OWNER_GITHUB_ID:'ginosega'}]){
  assert.throws(()=>createP3NativeAcceptanceService({env:{...x.env,...overrides}}),
   /INVALID_NATIVE_ACCEPTANCE_CONFIGURATION/);
 }
 x.f.sql.close();
});
test('P3-S08 live sentinel Worker source is NOT connected to command acceptance',()=>{
 const source=readFileSync(new URL('../src/worker.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/p3-native-acceptance-service|p3-internal-command-gate/);
});
