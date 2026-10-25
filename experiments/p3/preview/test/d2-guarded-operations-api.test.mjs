import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sandbox,sample} from './d1-fixture.mjs';
import {createD2UnifiedOwnerSession,D2SessionError} from '../src/d2-unified-owner-session.mjs';
import {createD2GuardedOperationsApi} from '../src/d2-guarded-operations-api.mjs';

const ORIGIN='https://fishing-v3-test.ginosega.workers.dev';
const OWNER=778899,ID=1430581407,CLOCK=1800000000;
const RAW='a'.repeat(43),OTHER='b'.repeat(43);
const KEY='future-server-only-csrf-key-do-not-use-in-production-12345678';
const IDEM='d2-source-only-gear-edit-123456';
const BODY=JSON.stringify({idempotencyKey:IDEM,snapshot:sample});
const hash=s=>createHash('sha256').update(s).digest('base64url');
function fixture({write=false,validation=true}={}){
 const auth=sandbox(),operations=sandbox();
 auth.sql.exec('CREATE TABLE sessions(token_hash TEXT PRIMARY KEY NOT NULL, github_id INTEGER NOT NULL, expires_at INTEGER NOT NULL)');
 let at=CLOCK, enabled=write, allowSource=validation, validatorCalls=0;
 auth.sql.prepare('INSERT INTO sessions(token_hash,github_id,expires_at) VALUES(?,?,?)')
  .run(hash(RAW),OWNER,CLOCK+3600);
 const session=createD2UnifiedOwnerSession({
  AUTH_DB:auth.DB,ownerGitHubId:OWNER,origin:ORIGIN,
  csrfKey:KEY,now:()=>at,
 });
 const api=createD2GuardedOperationsApi({
  session,store:operations.store(),writeEnabled:()=>enabled,
  validateGearChange:async({snapshot,owner,repositoryId})=>{
   validatorCalls++;assert.equal(owner.ownerGitHubId,OWNER);
   assert.equal(repositoryId,ID);
   assert.equal(snapshot.package.domain,'gear');
   return {valid:allowSource,repositoryId:ID,sourceRevision:'f'.repeat(40)};
  },
 });
 const request=(method,path,{cookie=RAW,origin=ORIGIN,site='same-origin',
  csrf,body=BODY,headers={}}={})=>{
  const h=new Headers({
   'Cookie':cookie===null?'':'__Host-fish_p0_session='+cookie,
   'Origin':origin,
   'Sec-Fetch-Site':site,
   'X-Fish-V3-Intent':'publish',
   'Content-Type':'application/json',
   ...headers,
  });
  if(cookie===null)h.delete('Cookie');
  if(origin===null)h.delete('Origin');
  if(site===null)h.delete('Sec-Fetch-Site');
  if(csrf!==undefined)h.set('X-Fish-V3-CSRF',csrf);
  return new Request(ORIGIN+path,{method,headers:h,
   body:method==='POST'?body:undefined});
 };
 const token=async()=>{
  const r=await api.handle(request('GET','/session'));
  return (await r.json()).csrfToken;
 };
 const count=()=>operations.sql.prepare('SELECT count(*) AS c FROM p3_operations').get().c;
 return {session,api,request,token,count,auth,operations,
  setEnabled:v=>{enabled=v;},setValidation:v=>{allowSource=v;},
  advance:v=>{at+=v;},get validatorCalls(){return validatorCalls}};
}
test('D2-G01 AUTH-P0 cookie/hash yields owner status and session-bound CSRF without another login',async()=>{
 const x=fixture();
 const r=await x.api.handle(x.request('GET','/session'));
 assert.equal(r.status,200);
 assert.equal(r.headers.get('Cache-Control'),'private, no-store, max-age=0');
 const value=await r.json();
 assert.equal(value.authenticated,true);
 assert.equal(value.authorized,true);
 assert.match(value.csrfToken,/^[A-Za-z0-9_-]{43}$/);
 assert.equal(value.expiresAt,CLOCK+3600);
 assert.equal(await x.token(),value.csrfToken);
 assert(!JSON.stringify(value).includes(RAW));
 assert.equal(x.count(),0);
});
test('D2-G02 absent or wrong cookie anonymous session never returns CSRF',async()=>{
 const x=fixture();
 for(const cookie of [null,OTHER,'x'.repeat(48)]){
  const r=await x.api.handle(x.request('GET','/session',{cookie}));
  assert.equal(r.status,200);
  assert.deepEqual(await r.json(),{authenticated:false,authorized:false});
 }
 assert.equal(x.count(),0);
});
test('D2-G03 default-off write returns 503 and creates no D1 operation or source checks',async()=>{
 const x=fixture();
 const r=await x.api.handle(x.request('POST','/api/v3/operations',{
  csrf:await x.token(),
 }));
 assert.equal(r.status,503);
 assert.deepEqual(await r.json(),{ok:false,error:'DISABLED'});
 assert.equal(x.count(),0);
 assert.equal(x.validatorCalls,0);
});
test('D2-G04 authorized exact canonical Gear edit records Accepted once and stable status',async()=>{
 const x=fixture({write:true});
 const csrf=await x.token();
 const r=await x.api.handle(x.request('POST','/api/v3/operations',{csrf}));
 assert.equal(r.status,202);
 const value=await r.json();
 assert.equal(value.ok,true);
 assert.equal(value.accepted,true);
 assert.equal(value.duplicate,false);
 assert.equal(value.canonicalLive,false);
 assert.match(value.operationId,/^p3_[0-9a-f-]{36}$/);
 assert.equal(x.count(),1);
 const status=await x.api.handle(x.request('GET',value.statusPath));
 assert.equal(status.status,200);
 const record=await status.json();
 assert.equal(record.operation.operationId,value.operationId);
 assert.equal(record.operation.state,'Accepted');
 assert.equal(record.canonicalLive,false);
 const again=await x.api.handle(x.request('POST','/api/v3/operations',{csrf}));
 assert.equal(again.status,200);
 const duplicate=await again.json();
 assert.equal(duplicate.operationId,value.operationId);
 assert.equal(duplicate.duplicate,true);
 assert.equal(x.count(),1);
});
test('D2-G05 anonymous, wrong owner, revoked and expired session cannot create an operation',async()=>{
 const x=fixture({write:true});
 const csrf=await x.token();
 for(const cookie of [null,OTHER]){
  const r=await x.api.handle(x.request('POST','/api/v3/operations',{cookie,csrf}));
  assert.equal(r.status,401);
 }
 x.auth.sql.prepare('UPDATE sessions SET github_id=?').run(12345);
 assert.equal((await x.api.handle(x.request('POST','/api/v3/operations',{csrf}))).status,401);
 x.auth.sql.prepare('UPDATE sessions SET github_id=?').run(OWNER);
 x.advance(3601);
 assert.equal((await x.api.handle(x.request('POST','/api/v3/operations',{csrf}))).status,401);
 assert.equal(x.count(),0);
 assert.equal(x.validatorCalls,0);
});
test('D2-G06 Origin, Fetch Metadata, CSRF, intent and bearer denied before source or D1',async()=>{
 const x=fixture({write:true});
 const csrf=await x.token();
 const bad=[
  {origin:'https://attacker.example',csrf},
  {origin:null,csrf},
  {site:'cross-site',csrf},
  {site:'same-site',csrf},
  {site:null,csrf},
  {csrf:undefined},
  {csrf:'z'.repeat(43)},
  {csrf,headers:{Authorization:'Bearer attacker'}},
  {csrf,headers:{'X-Fish-V3-Intent':'other'}},
  {csrf,headers:{'Content-Type':'text/plain'}},
  {csrf,headers:{'X-Fish-V3-Intent':''}},
 ];
 for(const props of bad){
  const r=await x.api.handle(x.request('POST','/api/v3/operations',props));
  assert(r.status>=400,'expected fail for '+JSON.stringify(props));
 }
 assert.equal(x.count(),0);
 assert.equal(x.validatorCalls,0);
});
test('D2-G07 noncanonical, extra repo, media, wrong operation and unsafe nested JSON denied',async()=>{
 const x=fixture({write:true}),csrf=await x.token();
 const bad=[
  BODY+' ',
  '{"idempotencyKey":"'+IDEM+'","snapshot":'+JSON.stringify(sample)+',"idempotencyKey":"'+IDEM+'"}',
  JSON.stringify({...JSON.parse(BODY),repositoryId:1350909744}),
  JSON.stringify({idempotencyKey:IDEM,snapshot:{...sample,media:[{name:'a.png'}]}}),
  JSON.stringify({idempotencyKey:IDEM,snapshot:{...sample,
   package:{...sample.package,domain:'kb'}}}),
  JSON.stringify({idempotencyKey:IDEM,snapshot:{...sample,
   package:{...sample.package,operation:'delete'}}}),
  JSON.stringify({idempotencyKey:IDEM,snapshot:{...sample,
   package:{...sample.package,id:''}}}),
  JSON.stringify({idempotencyKey:IDEM,snapshot:{...sample,
   package:{...sample.package,extra:{constructor:'bad'}}}}),
  'not json',
 ];
 for(const body of bad){
  const r=await x.api.handle(x.request('POST','/api/v3/operations',{csrf,body}));
  assert(r.status>=400&&r.status<500,'must reject '+body.slice(0,80));
 }
 assert.equal(x.count(),0);
 assert.equal(x.validatorCalls,0);
});
test('D2-G08 source-aware validation fail-closed, no Accepted row or GitHub call',async()=>{
 const x=fixture({write:true,validation:false}),csrf=await x.token();
 const r=await x.api.handle(x.request('POST','/api/v3/operations',{csrf}));
 assert.equal(r.status,409);
 assert.deepEqual(await r.json(),{ok:false,error:'UNVERIFIED_SOURCE'});
 assert.equal(x.count(),0);
 assert.equal(x.validatorCalls,1);
});
test('D2-G09 owner-only operation status denies token leak and enumeration',async()=>{
 const x=fixture({write:true}),csrf=await x.token();
 const created=await(await x.api.handle(x.request('POST','/api/v3/operations',{csrf}))).json();
 const cases=[
  x.request('GET',created.statusPath,{cookie:null}),
  x.request('GET',created.statusPath,{cookie:OTHER}),
  x.request('GET',created.statusPath,{site:'cross-site'}),
  x.request('GET',created.statusPath,{headers:{Authorization:'Bearer attacker'}}),
 ];
 for(const req of cases){
  const r=await x.api.handle(req);assert(r.status>=400);
  assert(!(await r.text()).includes(created.operationId));
 }
 assert.equal((await x.api.handle(x.request('GET','/api/v3/operations/p3_invalid'))).status,404);
 assert.equal((await x.api.handle(x.request('GET',
  '/api/v3/operations/p3_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'))).status,404);
 assert.equal(x.count(),1);
});
test('D2-G10 revoking existing AUTH-P0 session invalidates write and status and expires CSRF',async()=>{
 const x=fixture({write:true}),csrf=await x.token();
 const created=await(await x.api.handle(x.request('POST','/api/v3/operations',{csrf}))).json();
 x.auth.sql.exec('DELETE FROM sessions');
 assert.equal((await x.api.handle(x.request('POST','/api/v3/operations',{csrf}))).status,401);
 assert.equal((await x.api.handle(x.request('GET',created.statusPath))).status,401);
 assert.deepEqual(await(await x.api.handle(x.request('GET','/session'))).json(),
  {authenticated:false,authorized:false});
 assert.equal(x.count(),1);
});
test('D2-G11 oversized content and unsupported routes never hit source validator',async()=>{
 const x=fixture({write:true}),csrf=await x.token();
 assert.equal((await x.api.handle(x.request('POST','/api/v3/operations',{
  csrf,body:' '.repeat(16385)}))).status,413);
 assert.equal((await x.api.handle(x.request('POST','/api/v3/operations',{
  csrf,headers:{'Content-Length':'20000'}}))).status,413);
 assert.equal((await x.api.handle(x.request('POST','/api/v3/arbitrary',{csrf}))).status,404);
 assert.equal((await x.api.handle(x.request('GET','/api/v3/operations'))).status,404);
 assert.equal(x.count(),0);
 assert.equal(x.validatorCalls,0);
});
test('D2-G12 separate P3 cookie cannot authenticate AUTH-P0 session',async()=>{
 const x=fixture({write:true}),csrf=await x.token();
 const req=x.request('POST','/api/v3/operations',{csrf,headers:{
  'Cookie':'__Host-fish_p3_session='+RAW,
 }});
 assert.equal((await x.api.handle(req)).status,401);
 assert.equal(x.count(),0);
});
test('D2-G13 same idempotency key with changed canonical content conflicts without overwrite',async()=>{
 const x=fixture({write:true}),csrf=await x.token();
 const initial=await x.api.handle(x.request('POST','/api/v3/operations',{csrf}));
 assert.equal(initial.status,202);
 const changed=JSON.stringify({idempotencyKey:IDEM,snapshot:{
  package:{...sample.package,id:'different-gear'},media:[],
 }});
 const r=await x.api.handle(x.request('POST','/api/v3/operations',{csrf,body:changed}));
 assert.equal(r.status,409);
 assert.deepEqual(await r.json(),{ok:false,error:'IDEMPOTENCY_CONFLICT'});
 assert.equal(x.count(),1);
});
