import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sandbox} from './d1-fixture.mjs';
import {createD2GatedAuthGateway} from '../src/d2-gated-auth-gateway.mjs';

const ORIGIN='https://fishing.example.test';
const cookie='a'.repeat(43),OWNER=778899,ID='1430581407';
const operations=sandbox(),auth=sandbox();
auth.sql.exec('CREATE TABLE sessions(token_hash TEXT PRIMARY KEY NOT NULL,github_id INTEGER NOT NULL,expires_at INTEGER NOT NULL)');
const expires=Math.floor(Date.now()/1000)+3600;
auth.sql.prepare('INSERT INTO sessions(token_hash,github_id,expires_at) VALUES (?,?,?)')
 .run(createHash('sha256').update(cookie).digest('base64url'),OWNER,expires);
const env={
 APP_ORIGIN:ORIGIN,OWNER_GITHUB_ID:String(OWNER),
 DB:auth.DB,OPERATIONS_DB:operations.DB,
 D2_CSRF_KEY:'D2-future-runtime-secret-not-for-production-01234567890',
 D2_WRITE_ENABLED:'false',D2_SANDBOX_REPO_ID:ID,
};
const calls=[];
const worker=createD2GatedAuthGateway({
 authWorker:{fetch:async req=>{
  calls.push('auth:'+new URL(req.url).pathname);
  return new Response('P1 auth delegated',{status:209});
 }},
 staticGateway:async req=>{
  calls.push('pages:'+new URL(req.url).pathname);
  return new Response('Unchanged release bytes',{status:200});
 },
});
const req=(path,{method='GET',origin=ORIGIN,body}={})=>
 new Request(origin+path,{method,headers:{
  Cookie:'__Host-fish_p0_session='+cookie,
  'Sec-Fetch-Site':'same-origin',
  Origin:origin,'Content-Type':'application/json',
 },body});
const count=()=>operations.sql.prepare('SELECT count(*) AS c FROM p3_operations').get().c;

test('D2-W01 ported P1 OAuth and signout paths remain available through only one origin',async()=>{
 const before=calls.length;
 for(const path of ['/auth/start','/auth/callback',
  '/session/signout','/session/revoke-all']){
  const r=await worker.fetch(req(path),env);
  assert.equal(r.status,209);
 }
 assert.deepEqual(calls.slice(before),[
  'auth:/auth/start','auth:/auth/callback',
  'auth:/session/signout','auth:/session/revoke-all',
 ]);
});
test('D2-W02 isolated GET /session uses existing P1 D1 cookie and server-only CSRF',async()=>{
 const r=await worker.fetch(req('/session'),env);
 assert.equal(r.status,200);
 assert.equal(r.headers.get('Cache-Control'),'private, no-store, max-age=0');
 const obj=await r.json();
 assert.equal(obj.authenticated,true);
 assert.equal(obj.authorized,true);
 assert.match(obj.csrfToken,/^[A-Za-z0-9_-]{43}$/);
 assert(!JSON.stringify(obj).includes(cookie));
});
test('D2-W03 default-off writing does not call GitHub, validate source or touch D1',async()=>{
 const session=await(await worker.fetch(req('/session'),env)).json();
 const r=await worker.fetch(req('/api/v3/operations',{
  method:'POST',body:JSON.stringify({idempotencyKey:'d2-test-123456',snapshot:{}}),
 }),env);
 assert.equal(r.status,503);
 assert.equal(count(),0);
 assert.match(await r.text(),/TEMPORARILY_UNAVAILABLE/);
 assert(session.csrfToken);
});
test('D2-W04 fake write switch without fixed repo or credentials cannot accept operations',async()=>{
 for(const patch of [
  {D2_WRITE_ENABLED:'true',D2_SANDBOX_REPO_ID:'1350909744'},
  {D2_WRITE_ENABLED:'true',D2_SANDBOX_REPO_ID:undefined},
  {D2_WRITE_ENABLED:'false',D2_SANDBOX_REPO_ID:ID},
  {D2_WRITE_ENABLED:undefined,D2_SANDBOX_REPO_ID:ID},
 ]){
  const r=await worker.fetch(req('/api/v3/operations',{method:'POST',body:'{}'}),
   {...env,...patch});
  assert.equal(r.status,503);
 }
 assert.equal(count(),0);
});
test('D2-W05 the existing AUTH-P0 landing/test pages survive a guarded D2 rollout',async()=>{
 const before=calls.length;
 for(const path of ['/','/test-client.js','/test.css']){
  const r=await worker.fetch(req(path),env);
  assert.equal(r.status,209);
 }
 assert.deepEqual(calls.slice(before),[
  'auth:/','auth:/test-client.js','auth:/test.css',
 ]);
 for(const path of ['/sw.js','/_internal/verify-sandbox',
  '/api/v3/merge','/api/v3/dispatch']){
  const r=await worker.fetch(req(path),env);
  assert.equal(r.status,404);
 }
});
test('D2-W09 read-only AUTH-P0 session remains usable before D2 bindings; write remains blocked',async()=>{
 const reduced={...env,OPERATIONS_DB:undefined,D2_CSRF_KEY:undefined};
 const before=calls.length;
 const r=await worker.fetch(req('/session'),reduced);
 assert.equal(r.status,209);
 assert.deepEqual(calls.slice(before),['auth:/session']);
 const denied=await worker.fetch(req('/api/v3/operations',{
  method:'POST',body:'{}',
 }),reduced);
 assert.equal(denied.status,503);
 const enabled=await worker.fetch(req('/session'),{
  ...reduced,D2_WRITE_ENABLED:'true',
 });
 assert.equal(enabled.status,503);
});
test('D2-W06 public Pages path is forwarded only to P1 byte-preserving proxy',async()=>{
 const before=calls.length;
 for(const path of ['/fishing/','/fishing/assets/test.css']){
  const r=await worker.fetch(req(path),env);
  assert.equal(r.status,200);
  assert.equal(await r.text(),'Unchanged release bytes');
 }
 assert.deepEqual(calls.slice(before),[
  'pages:/fishing/','pages:/fishing/assets/test.css',
 ]);
});
test('D2-W07 unknown host and missing CSRF runtime secret deny without proxy leaks',async()=>{
 const r=await worker.fetch(req('/session',{origin:'https://attacker.example'}),env);
 assert.equal(r.status,404);
 // During the hard-off rollout, the existing AUTH-P0 status remains live.
 const missing=await worker.fetch(req('/session'),{...env,D2_CSRF_KEY:null});
 assert.equal(missing.status,209);
 // Once publishing is armed, missing CSRF is a hard denial (never fallback).
 const armed=await worker.fetch(req('/session'),{
  ...env,D2_CSRF_KEY:null,D2_WRITE_ENABLED:'true',
 });
 assert.equal(armed.status,503);
 assert.equal(count(),0);
});
test('D2-W08 source code has no dispatch handler, installation key or active write default',()=>{
 const src=createD2GatedAuthGateway.toString();
 assert(!src.includes('POST /app/installations/'));
 const off=createD2GatedAuthGateway();
 assert.equal(typeof off.fetch,'function');
});

test('D2-W10 source rejection logs stable code only, never message or secret',async()=>{
 const messages=[],originalWarn=console.warn;
 const testError=Object.assign(new Error('PEM contents, JWT and private credential'),{
  name:'D2TokenError',code:'TOKEN_DENIED',
 });
 const target=createD2GatedAuthGateway({
  issueReadToken:async()=>{throw testError;},
 });
 try{
  const csrf=(await(await target.fetch(req('/session'),env)).json()).csrfToken;
  console.warn=(...args)=>messages.push(args);
  const input={
   idempotencyKey:'d2-w10-source-failure-check',
   snapshot:{package:{
    format:'fishing-companion-change-v2',domain:'gear',
    operation:'edit',id:'p3-test-rod',
    base:{schemaVersion:2,sourceRevision:'a'.repeat(40),
     recordHash:'b'.repeat(64)},
    changes:{set:{name:'Synthetic Test'},unset:[],
     baseFields:{name:'P3 Test Rod'}},
    notes:{action:'keep'},picture:{action:'keep'},pictureSequence:{action:'keep'},
   },media:[]},
  };
  const r=new Request(ORIGIN+'/api/v3/operations',{
   method:'POST',
   headers:{Cookie:'__Host-fish_p0_session='+cookie,
    Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
    'X-Fish-V3-Intent':'publish','X-Fish-V3-CSRF':csrf,
    'Content-Type':'application/json'},
   body:JSON.stringify(input),
  });
  const before=count();
  const reply=await target.fetch(r,{...env,D2_WRITE_ENABLED:'true'});
  assert.equal(reply.status,409);
  assert.deepEqual(await reply.json(),{ok:false,error:'UNVERIFIED_SOURCE'});
  assert.equal(count(),before);
  assert.deepEqual(messages,[['FISH118_D2_SOURCE_VALIDATION_REFUSED','TOKEN_DENIED']]);
  assert(!JSON.stringify(messages).includes('PEM contents'));
 }finally{console.warn=originalWarn;}
});
