import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import worker,{createD6Wp3H2Worker}
 from '../server/d6-wp3-h2-worker.mjs';
import {createD2UnifiedOwnerSession}
 from '../../experiments/p3/preview/src/d2-unified-owner-session.mjs';
import {createD6Wp3H2OwnerCsrfHandoff,
 D6_WP3_H2_OWNER_CSRF_PATH as PATH,
 D6_WP3_H2_OWNER_CSRF_INTENT as INTENT}
 from '../server/d6-wp3-h2-owner-csrf.mjs';

const ORIGIN='https://fishing-v3-wp3-test.ginosega.workers.dev';
const MAIN='fc85bd38c4c688026700971b4c2d463c293eebf3';
const BODY_SHA='ca753cb403f9e3054b2a2f092e877fee92cd58c4da10966f52d86fa07333f408';
const RECORD='h2-synthetic-kb-publishing-proof';
const NOTES='KB/Techniques/content/'+RECORD+'.md';
const NOW=2000000000;
const COOKIE='T'.repeat(43);
const KEY='S'.repeat(64);

function database({githubId=265665562,expires=NOW+3600,
 onLookup=()=>{}}={}){
 const queries=[];
 return {queries,prepare(sql){
  assert.equal(sql,
   'SELECT github_id,expires_at FROM sessions WHERE token_hash=? AND expires_at>?');
  return {bind(hash,at){
   assert.match(hash,/^[A-Za-z0-9_-]{43}$/);
   assert.equal(at,NOW);
   return {first:async()=>{
    queries.push(sql);onLookup();
    return {github_id:githubId,expires_at:expires};
   }};
  }};
 }};
}
const approved=(extra={})=>({
 D6_ORIGIN:ORIGIN,D6_OWNER_GITHUB_ID:'265665562',
 D6_REPOSITORY_ID:'1350909744',
 D6_WP2_STAGING_ENABLED:'false',
 D6_ISOLATED_PAGES_ENABLED:'false',
 D6_WP3_H2_OPERATOR_APPROVED:'true',
 D6_WP3_H2_TEST_NAME:'WP3-H2-SYNTH-KB-001',
 D6_WP3_H2_APPROVED_PHASE:'intake',
 D6_WP3_H2_APPROVED_START:String(NOW-30),
 D6_WP3_H2_APPROVED_END:String(NOW+30),
 D6_WP3_H2_APPROVED_SOURCE_REVISION:MAIN,
 D6_WP3_H2_APPROVED_ENVELOPE_SHA256:BODY_SHA,
 D6_WP3_H2_APPROVED_RECORD_ID:RECORD,
 D6_WP3_H2_APPROVED_NOTES_PATH:NOTES,
 D6_CSRF_KEY:KEY,
 AUTH_DB:database(),
 ...extra,
});
const writePins={
 D6_WP3_RUNTIME_ENABLED:'true',
 D6_WP3_WRITE_ENABLED:'true',
 D6_WP3_MOUNT_ENABLED:'true',
 D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED:'true',
};
const readPins={
 D6_WP3_H2_SOURCE_READY:'true',D6_WP3_H1_READ_ONLY_ENABLED:'false',
 D6_PRODUCTION_ENABLED:'true',D6_GATEWAY_ENABLED:'true',
 D6_WP3_ISOLATED_READ_ENABLED:'true',
 D6_WP3_ISOLATED_PAGES_ENABLED:'true',
 D6_WP3_READ_PROFILE_ENABLED:'true',
 D6_STATIC_ENABLED:'true',D6_SESSION_ENABLED:'true',
 D6_OAUTH_ENABLED:'true',D6_SOURCE_ENABLED:'true',
 D6_READ_TOKEN_ENABLED:'true',D6_SIGNER_ENABLED:'true',
};
const get=(options={})=>{
 const {path=PATH,origin=ORIGIN,method='GET',cookie=COOKIE,
  headers={}}=options;
 return new Request(origin+path,{
  method,headers:{
   Accept:'application/json',
   'Sec-Fetch-Site':'same-origin',
   'X-Fish-V3-H2-Intent':INTENT,
   ...(cookie?{Cookie:'__Host-fish_p0_session='+cookie}:{}),
   ...headers,
  },
 });
};
const handoff=(env,enabled=()=>true,now=()=>NOW)=>
 createD6Wp3H2OwnerCsrfHandoff({env,enabled,now});
const safe=async resp=>{
 assert.equal(resp.headers.get('Cache-Control'),'private, no-store, max-age=0');
 assert.equal(resp.headers.get('Vary'),'Cookie');
 assert.equal(resp.headers.get('Cross-Origin-Resource-Policy'),'same-origin');
 assert.equal(resp.headers.has('Set-Cookie'),false);
 assert.equal(resp.headers.has('Access-Control-Allow-Origin'),false);
 assert.equal(resp.headers.has('Location'),false);
 assert.equal(resp.headers.get('Content-Type'),'application/json; charset=utf-8');
 return resp.json();
};

test('H2-CSRF01 disabled handoff is absent before any session DB read',async()=>{
 const db=database(),env=approved({AUTH_DB:db});
 assert.equal((await handoff(env,()=>false).serve(get())).status,404);
 assert.equal(db.queries.length,0);
 const bad=approved({D6_WP3_H2_APPROVED_ENVELOPE_SHA256:'a'.repeat(64),AUTH_DB:db});
 assert.equal((await handoff(bad).serve(get())).status,404);
 assert.equal(db.queries.length,0);
});

test('H2-CSRF02 exact owner GET derives existing D2 session-bound token',async()=>{
 const db=database(),env=approved({AUTH_DB:db});
 const response=await handoff(env).serve(get());
 assert.equal(response.status,200);
 const body=await safe(response);
 assert.deepEqual(Object.keys(body).sort(),['csrfToken','ok','test']);
 assert.equal(body.ok,true);
 assert.equal(body.test,'WP3-H2-SYNTH-KB-001');
 assert.match(body.csrfToken,/^[A-Za-z0-9_-]{43}$/);
 assert.equal(db.queries.length,1);
 const d2=createD2UnifiedOwnerSession({
  AUTH_DB:db,ownerGitHubId:265665562,origin:ORIGIN,
  csrfKey:KEY,now:()=>NOW,
 });
 const post=new Request(ORIGIN+'/api/v3/operations',{
  method:'POST',headers:{
   Cookie:'__Host-fish_p0_session='+COOKIE,
   Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
   'X-Fish-V3-Intent':'publish',
   'X-Fish-V3-CSRF':body.csrfToken,
   'Content-Type':'application/json',
  },body:'{}',
 });
 assert.deepEqual(await d2.authorizeWrite(post),
  {ownerGitHubId:265665562,authorized:true});
 const tampered=new Request(post,{headers:{
  ...Object.fromEntries(post.headers),
  'X-Fish-V3-CSRF':'A'.repeat(43),
 }});
 await assert.rejects(d2.authorizeWrite(tampered),e=>e.code==='CSRF_DENIED');
});

test('H2-CSRF03 invalid method/host/path/query/bearer/fetch-site/intent denied without DB read',async()=>{
 const db=database(),host=handoff(approved({AUTH_DB:db}));
 const invalid=[
  get({method:'POST'}),
  get({path:PATH+'?extra=1'}),
  get({path:PATH+'#hash'}),
  get({path:PATH+'/'}),
  get({path:'/session'}),
  get({origin:'https://evil.invalid'}),
  get({headers:{Authorization:'Bearer secret'}}),
  get({headers:{'Sec-Fetch-Site':'same-site'}}),
  get({headers:{'Sec-Fetch-Site':'cross-site'}}),
  get({headers:{'Sec-Fetch-Site':'none'}}),
  get({headers:{'Sec-Fetch-Site':''}}),
  get({headers:{'X-Fish-V3-H2-Intent':'publish'}}),
  get({headers:{'X-Fish-V3-H2-Intent':''}}),
  get({headers:{Accept:'text/html'}}),
  get({headers:{Origin:'https://evil.invalid'}}),
 ];
 for(const req of invalid){
  const response=await host.serve(req);
  assert.equal(response.status,404,req.url);
  await safe(response);
 }
 assert.equal(db.queries.length,0);
});

test('H2-CSRF04 signed-out, foreign, expired and malformed sessions deny',async()=>{
 for(const {db,cookie} of [
  {db:database(),cookie:null},
  {db:database({githubId:12345}),cookie:COOKIE},
  {db:database({expires:NOW-1}),cookie:COOKIE},
  {db:database(),cookie:'malformed'},
 ]){
  const response=await handoff(approved({AUTH_DB:db}))
   .serve(get({cookie}));
  assert.equal(response.status,403);
  assert.deepEqual(await safe(response),
   {ok:false,error:'OWNER_DENIED'});
 }
});

test('H2-CSRF05 wrong repo/owner/app scope/fixture/window pins never read DB',async()=>{
 const db=database();
 const variants=[
  {D6_ORIGIN:'https://fishing.ginosega.workers.dev'},
  {D6_OWNER_GITHUB_ID:'12345'},
  {D6_REPOSITORY_ID:'1'},
  {D6_WP2_STAGING_ENABLED:'true'},
  {D6_ISOLATED_PAGES_ENABLED:'true'},
  {D6_WP3_H2_TEST_NAME:'other'},
  {D6_WP3_H2_APPROVED_SOURCE_REVISION:'b'.repeat(40)},
  {D6_WP3_H2_APPROVED_ENVELOPE_SHA256:'b'.repeat(64)},
  {D6_WP3_H2_APPROVED_RECORD_ID:'other'},
  {D6_WP3_H2_APPROVED_NOTES_PATH:'KB/Techniques/content/other.md'},
 ];
 for(const extra of variants)
  assert.equal((await handoff(approved({...extra,AUTH_DB:db}))
   .serve(get())).status,404);
 assert.equal(db.queries.length,0);
});

test('H2-CSRF06 no secret or AUTH_DB fails closed without token',async()=>{
 for(const extra of [{D6_CSRF_KEY:''},{AUTH_DB:null}]){
  const resp=await handoff(approved(extra)).serve(get());
  assert.equal(resp.status,503);
  assert.deepEqual(await safe(resp),
   {ok:false,error:'TEMPORARILY_UNAVAILABLE'});
 }
});

test('H2-CSRF07 disabled or expired while session awaits never releases token',async()=>{
 let enabled=true;
 const db=database({onLookup:()=>{enabled=false;}});
 const response=await handoff(approved({AUTH_DB:db}),()=>enabled).serve(get());
 assert.equal(response.status,404);
 assert.deepEqual(await safe(response),{ok:false,error:'NOT_FOUND'});
 let now=NOW;
 const db2=database({onLookup:()=>{now=NOW+400;}});
 const response2=await handoff(approved({AUTH_DB:db2}),()=>now<=NOW+30,()=>now).serve(get());
 assert.equal(response2.status,404);
 assert.deepEqual(await safe(response2),{ok:false,error:'NOT_FOUND'});
});

test('H2-CSRF08 Worker leaves route absent with any writer gate OFF',async()=>{
 const db=database();
 const make=env=>createD6Wp3H2Worker({
  now:()=>NOW,cryptoApi:webcrypto,
  network:async()=>{throw Error('No provider permitted');},
 }).fetch(get(),env);
 const env=approved({...readPins,...writePins,AUTH_DB:db});
 for(const flag of Object.keys(writePins)){
  const resp=await make({...env,[flag]:'false'});
  assert.equal(resp.status,404,flag);
 }
 assert.equal((await make({...env,D6_WP3_H2_OPERATOR_APPROVED:'false'})).status,404);
 assert.equal((await make({...env,D6_WP3_H2_APPROVED_END:String(NOW-1)})).status,404);
 assert.equal(db.queries.length,0);
});

test('H2-CSRF09 Worker exact gated route uses D2, does not call provider',async()=>{
 const db=database(),env=approved({...readPins,...writePins,AUTH_DB:db});
 let networkCalls=0;
 const host=createD6Wp3H2Worker({
  now:()=>NOW,cryptoApi:webcrypto,
  network:async()=>{networkCalls++;throw Error('Unexpected provider call');},
 });
 const resp=await host.fetch(get(),env);
 assert.equal(resp.status,200);
 const body=await safe(resp);
 assert.match(body.csrfToken,/^[A-Za-z0-9_-]{43}$/);
 assert.equal(networkCalls,0);
 assert.equal(db.queries.length,1);
 for(const path of ['/api/v3/h2','/api/v3/h2/unknown','/api/v3/h2/owner-csrf/']){
  const other=await host.fetch(get({path}),env);
  assert.equal(other.status,404);
 }
 assert.equal(networkCalls,0);
});

test('H2-CSRF10 deployed default-OFF config, no general session/Worker token method',()=>{
 const config=JSON.parse(readFileSync(new URL(
  '../wrangler.wp3-h2-candidate.jsonc',import.meta.url),'utf8'));
 for(const flag of [...Object.keys(writePins),'D6_WP3_H2_OPERATOR_APPROVED'])
  assert.equal(config.vars[flag],'false');
 assert.equal(config.main,'./server/d6-wp3-h2-worker.mjs');
 assert.deepEqual(Object.keys(worker),['fetch']);
 assert.equal('csrfToken' in worker,false);
 assert.equal('serve' in worker,false);
});
