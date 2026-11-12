import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createD6ProductionRuntimeBindingContract}
 from '../../experiments/p3/preview/src/d6-production-runtime-bindings.mjs';

const ORIGIN='https://fishing.ginosega.workers.dev',NOW=2000000000;
const secure={
 D6_PRODUCTION_ENABLED:'true',D6_ORIGIN:ORIGIN,
 D6_OWNER_GITHUB_ID:'265665562',D6_REPOSITORY_ID:'1350909744',
 D6_GATEWAY_ENABLED:'true',
};
const req=(path,opts={})=>new Request(ORIGIN+path,opts);
const hash=text=>createHash('sha256').update(text).digest('base64url');
function make(overrides={},config={}){
 const network=[],dbEvents=[],flow=new Map(),sessions=new Map();
 const db={prepare(sql){return {bind(...args){
  dbEvents.push({sql,args});
  return {
   async run(){
    if(sql.startsWith('INSERT INTO auth_flows')){
     flow.set(args[0],{code_verifier:args[1],expires_at:args[2]});
    }else if(sql.startsWith('INSERT INTO sessions')){
     sessions.set(args[0],{github_id:args[1],expires_at:args[2]});
    }else if(sql==='DELETE FROM sessions WHERE token_hash = ? AND github_id = ?'){
     if(sessions.get(args[0])?.github_id===args[1])sessions.delete(args[0]);
    }else throw Error('invalid database mutation');
    return {success:true};
   },
   async first(){
    if(sql.startsWith('DELETE FROM auth_flows')){
     const row=flow.get(args[0]);flow.delete(args[0]);
     return row?.expires_at>args[1]?
      {code_verifier:row.code_verifier}:null;
    }
    if(sql.startsWith('SELECT github_id,expires_at FROM sessions')){
     const row=sessions.get(args[0]);
     return row?.expires_at>args[1]?row:null;
    }
    throw Error('invalid database read');
   },
  };
 }};}};
 const env={...secure,AUTH_DB:db,
  D6_CSRF_KEY:'source-only-test-csrf-key-xxxxxxxxxxxxxxxxxx',
  D6_GITHUB_APP_ID:'77',D6_GITHUB_INSTALLATION_ID:'42',
  D6_GITHUB_APP_PRIVATE_KEY:'not a production credential',
  ...overrides,
 };
 const app=createD6ProductionRuntimeBindingContract({
  env,now:()=>NOW,
  network:async(url,options)=>{
   network.push({url,options});
   if(url==='https://github.com/login/oauth/access_token')
    return new Response(JSON.stringify({
     access_token:'gho_'+'abc123'.repeat(6),token_type:'bearer',
    }),{headers:{'Content-Type':'application/json'}});
   if(url==='https://api.github.com/user')
    return new Response(JSON.stringify({id:265665562,login:'ginosega'}),
     {headers:{'Content-Type':'application/json'}});
   if(url.startsWith('https://ginosega.github.io/fishing/'))
    return new Response('static bytes',{status:200,
     headers:{'Content-Type':'text/plain'}});
   throw Error('unapproved provider call');
  },
  ...config,
 });
 return {app,env,network,dbEvents,sessions,flow};
}
test('D6-BIND01 global kill switch defaults OFF; zero provider/D1 use',async()=>{
 const x=make({D6_PRODUCTION_ENABLED:undefined});
 for(const path of ['/','/session','/fishing/release.json',
  '/auth/start','/auth/callback','/api/v3/authoring-source']){
  assert.equal((await x.app.fetch(req(path))).status,503);
 }
 assert.deepEqual(Object.keys(x.app),['fetch']);
 assert(Object.isFrozen(x.app));
 assert.equal(x.dbEvents.length,0);assert.equal(x.network.length,0);
});
test('D6-BIND02 exact owner, repo, origin and true string pins are mandatory',async()=>{
 const invalid=[
  {D6_PRODUCTION_ENABLED:true},{D6_ORIGIN:'https://evil.invalid'},
  {D6_OWNER_GITHUB_ID:'0'},{D6_OWNER_GITHUB_ID:'265665563'},
  {D6_REPOSITORY_ID:'1430581407'},
  {D6_REPOSITORY_ID:'1350909744 '},
 ];
 for(const override of invalid){
  const x=make({...override,D6_STATIC_ENABLED:'true',
   D6_OAUTH_ENABLED:'true'});
  assert.equal((await x.app.fetch(req('/fishing/release.json'))).status,503);
  assert.equal((await x.app.fetch(req('/auth/start'))).status,503);
  assert.equal(x.network.length,0);assert.equal(x.dbEvents.length,0);
 }
});
test('D6-BIND03 all individual capabilities default OFF',async()=>{
 const x=make();
 for(const path of ['/session','/auth/start','/api/v3/authoring-source',
  '/fishing/release.json']){
  assert.equal((await x.app.fetch(req(path))).status,503);
 }
 assert.equal(x.network.length,0);assert.equal(x.dbEvents.length,0);
 assert.deepEqual(Object.keys(x.app).sort(),
  ['fetch','verifyHostedBytes']);
});
test('D6-BIND04 static-only proxy never enables OAuth or GitHub App',async()=>{
 const x=make({D6_STATIC_ENABLED:'true'});
 const res=await x.app.fetch(req('/fishing/release.json'));
 assert.equal(res.status,200);
 assert.equal(await res.text(),'static bytes');
 assert.deepEqual(x.network.map(n=>n.url),
  ['https://ginosega.github.io/fishing/release.json']);
 const op=x.network[0].options;
 assert.equal(op.redirect,'manual');assert.equal(op.cache,'no-store');
 assert.equal(op.credentials,'omit');
 assert.equal(op.headers?.Authorization,undefined);
 assert.equal((await x.app.fetch(req('/auth/start'))).status,503);
 assert.equal((await x.app.fetch(req('/api/v3/authoring-source'))).status,503);
});
test('D6-BIND05 OAuth requires gateway, session and valid server-only secrets',async()=>{
 for(const override of [
  {D6_GATEWAY_ENABLED:undefined,D6_OAUTH_ENABLED:'true',
   D6_SESSION_ENABLED:'true'},
  {D6_SESSION_ENABLED:undefined,D6_OAUTH_ENABLED:'true'},
  {D6_SESSION_ENABLED:'true',D6_OAUTH_ENABLED:'true'},
  {D6_SESSION_ENABLED:'true',D6_OAUTH_ENABLED:'true',
   D6_OAUTH_CLIENT_ID:'Iv1.test',D6_OAUTH_CLIENT_SECRET:''},
 ]){
  const x=make(override);
  const response=await x.app.fetch(req('/auth/start'));
  assert.equal(response.status,503);
  assert.equal(x.network.length,0);assert.equal(x.dbEvents.length,0);
 }
});
test('D6-BIND06 source App grants never silently enable login',async()=>{
 const x=make({
  D6_SESSION_ENABLED:'true',D6_SOURCE_ENABLED:'true',
  D6_READ_TOKEN_ENABLED:'true',D6_SIGNER_ENABLED:'true',
 });
 assert.equal((await x.app.fetch(req('/auth/start'))).status,503);
 assert.equal(x.network.length,0);
});
test('D6-BIND07 valid mocked OAuth uses D5-compatible D1 owner session',async()=>{
 const x=make({D6_SESSION_ENABLED:'true',D6_OAUTH_ENABLED:'true',
  D6_OAUTH_CLIENT_ID:'Iv1.fishingtest',
  D6_OAUTH_CLIENT_SECRET:'test-only-client-secret-value-xxxxxxxx',
 });
 const started=await x.app.fetch(req('/auth/start',{
  headers:{'Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document',
   'Sec-Fetch-Site':'same-origin'},
 }));
 assert.equal(started.status,303);
 const state=(started.headers.get('Set-Cookie')??'')
  .match(/__Host-fish_p0_flow=([A-Za-z0-9_-]{43})/)?.[1];
 assert.match(state,/^[A-Za-z0-9_-]{43}$/);
 assert.equal(x.network.length,0);
 const callback=await x.app.fetch(req('/auth/callback?code=githubCode1234567890&state='+state,{
  headers:{Cookie:'__Host-fish_p0_flow='+state,
   'Sec-Fetch-Site':'cross-site','Sec-Fetch-Mode':'navigate',
   'Sec-Fetch-Dest':'document'},
 }));
 assert.equal(callback.status,303);
 const sid=(callback.headers.get('Set-Cookie')??'')
  .match(/__Host-fish_p0_session=([A-Za-z0-9_-]{43})/)?.[1];
 assert.match(sid,/^[A-Za-z0-9_-]{43}$/);
 assert.equal(x.sessions.get(hash(sid)).github_id,265665562);
 assert.deepEqual(x.network.map(n=>n.url),[
  'https://github.com/login/oauth/access_token',
  'https://api.github.com/user',
 ]);
 assert(x.network.every(n=>n.options.redirect==='manual'&&
  n.options.cache==='no-store'&&n.options.credentials==='omit'));
 const status=await x.app.fetch(req('/session',{headers:{
  Cookie:'__Host-fish_p0_session='+sid,
  'Sec-Fetch-Site':'same-origin',
 }}));
 assert.equal(status.status,200);
 assert.deepEqual(await status.json(),{
  authenticated:true,authorized:true,ownerLogin:'ginosega',
 });
 assert.equal((await x.app.fetch(req('/api/v3/authoring-source',{headers:{
  Cookie:'__Host-fish_p0_session='+sid,
 }}))).status,503);
});
test('D6-BIND08 public writer and media routes never exist',async()=>{
 const x=make({D6_STATIC_ENABLED:'true',D6_SESSION_ENABLED:'true',
  D6_OAUTH_ENABLED:'true',D6_OAUTH_CLIENT_ID:'Iv1.fishingtest',
  D6_OAUTH_CLIENT_SECRET:'test-only-client-secret-value-xxxxxxxx'});
 for(const path of ['/api/v3/operations','/api/v3/media',
  '/session/revoke-all','/session/signout']){
  assert.equal((await x.app.fetch(req(path,{method:'POST',
   headers:{Origin:ORIGIN,'Sec-Fetch-Site':'same-origin'}}))).status,404);
 }
 assert.equal(x.network.length,0);
});
test('D6-BIND09 no mistaken site, arbitrary OAuth redirect or bearer route',async()=>{
 const x=make({D6_SESSION_ENABLED:'true',D6_OAUTH_ENABLED:'true',
  D6_OAUTH_CLIENT_ID:'Iv1.fishingtest',
  D6_OAUTH_CLIENT_SECRET:'test-only-client-secret-value-xxxxxxxx'});
 for(const input of [
  new Request('https://evil.invalid/auth/start'),
  req('/auth/start?return=https://evil.invalid'),
  req('/auth/start',{headers:{Origin:'https://evil.invalid'}}),
  req('/auth/start',{headers:{Authorization:'Bearer fake'}}),
 ]){
  const response=await x.app.fetch(input);
  assert([400,403,404].includes(response.status));
 }
 assert.equal(x.dbEvents.length,0);assert.equal(x.network.length,0);
});
test('D6-BIND10 malformed runtime shape fails closed at construction',()=>{
 for(const settings of [{env:null},{network:null},{now:1}]){
  assert.throws(()=>createD6ProductionRuntimeBindingContract(settings));
 }
});
test('D6-BIND11 no entrypoint, sandbox creds, writer, cron or deploy surface',()=>{
 const code=readFileSync(new URL(
  '../../experiments/p3/preview/src/d6-production-runtime-bindings.mjs',
  import.meta.url),'utf8');
 assert.match(code,/D6_PRODUCTION_ENABLED/);
 assert.match(code,/D6_OWNER_GITHUB_ID/);
 assert.match(code,/D6_REPOSITORY_ID/);
 assert.match(code,/createD6ProductionOAuthReadComposition/);
 assert.doesNotMatch(code,/export default|addEventListener\(/);
 assert.doesNotMatch(code,/1430581407|fishing-p3-sandbox/);
 assert.doesNotMatch(code,/authorizeWrite|issueWriteToken|scheduled\(/);
 assert.doesNotMatch(code,/api\/v3\/operations|D2_WRITE_ENABLED/);
});

async function signedInOwner(x){
 const started=await x.app.fetch(req('/auth/start',{
  headers:{'Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document',
   'Sec-Fetch-Site':'same-origin'},
 }));
 assert.equal(started.status,303);
 const state=started.headers.get('Set-Cookie')?.match(
  /__Host-fish_p0_flow=([A-Za-z0-9_-]{43})/)?.[1];
 assert.match(state,/^[A-Za-z0-9_-]{43}$/);
 const response=await x.app.fetch(req('/auth/callback?code=githubCode1234567890&state='+state,{
  headers:{Cookie:'__Host-fish_p0_flow='+state,
   'Sec-Fetch-Site':'cross-site','Sec-Fetch-Mode':'navigate',
   'Sec-Fetch-Dest':'document'},
 }));
 assert.equal(response.status,303);
 const sid=response.headers.get('Set-Cookie')?.match(
  /__Host-fish_p0_session=([A-Za-z0-9_-]{43})/)?.[1];
 assert.match(sid,/^[A-Za-z0-9_-]{43}$/);
 return sid;
}

test('D6-BIND12 OAuth owner sign-out revokes D1 session before source access',async()=>{
 const x=make({
  D6_SESSION_ENABLED:'true',D6_OAUTH_ENABLED:'true',
  D6_SIGNOUT_ENABLED:'true',D6_SOURCE_ENABLED:'true',
  D6_OAUTH_CLIENT_ID:'Iv1.fishingtest',
  D6_OAUTH_CLIENT_SECRET:'test-only-client-secret-value-xxxxxxxx',
 });
 const sid=await signedInOwner(x);
 const cookie='__Host-fish_p0_session='+sid;
 assert.equal(x.sessions.get(hash(sid))?.github_id,265665562);
 const before=await x.app.fetch(req('/session',{headers:{
  Cookie:cookie,'Sec-Fetch-Site':'same-origin',
 }}));
 assert.equal((await before.json()).authorized,true);
 const signedOut=await x.app.fetch(req('/session/signout',{
  method:'POST',headers:{Cookie:cookie,Origin:ORIGIN,
   'Sec-Fetch-Site':'same-origin','X-Fish-P0-Intent':'signout'},
 }));
 assert.equal(signedOut.status,200);
 assert.deepEqual(await signedOut.json(),{signedOut:true});
 assert.equal(x.sessions.has(hash(sid)),false);
 assert.match(signedOut.headers.get('Set-Cookie'),/Max-Age=0/);
 const after=await x.app.fetch(req('/session',{headers:{
  Cookie:cookie,'Sec-Fetch-Site':'same-origin',
 }}));
 assert.deepEqual(await after.json(),{
  authenticated:false,authorized:false,
 });
 const source=await x.app.fetch(req('/api/v3/authoring-source',{
  headers:{Cookie:cookie,'Sec-Fetch-Site':'same-origin'},
 }));
 assert.equal(source.status,401);
 assert.deepEqual(x.network.map(c=>c.url),[
  'https://github.com/login/oauth/access_token',
  'https://api.github.com/user',
 ]);
 assert.equal(x.dbEvents.filter(e=>e.sql.startsWith('DELETE FROM sessions')).length,1);
 assert.equal((await x.app.fetch(req('/api/v3/operations',{
  method:'POST',headers:{Cookie:cookie,Origin:ORIGIN},
 }))).status,404);
});

test('D6-BIND13 forged sign-out cannot revoke active owner session',async()=>{
 const x=make({
  D6_SESSION_ENABLED:'true',D6_OAUTH_ENABLED:'true',
  D6_SIGNOUT_ENABLED:'true',
  D6_OAUTH_CLIENT_ID:'Iv1.fishingtest',
  D6_OAUTH_CLIENT_SECRET:'test-only-client-secret-value-xxxxxxxx',
 });
 const sid=await signedInOwner(x),cookie='__Host-fish_p0_session='+sid;
 for(const headers of [
  {Origin:'https://evil.invalid','Sec-Fetch-Site':'same-origin',
   'X-Fish-P0-Intent':'signout'},
  {Origin:ORIGIN,'Sec-Fetch-Site':'cross-site',
   'X-Fish-P0-Intent':'signout'},
  {Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
   'X-Fish-P0-Intent':'other'},
 ]){
  const response=await x.app.fetch(req('/session/signout',{
   method:'POST',headers:{...headers,Cookie:cookie},
  }));
  assert([403,404].includes(response.status));
  assert.equal(response.headers.get('Set-Cookie'),null);
  assert.equal(x.sessions.has(hash(sid)),true);
 }
 assert.equal(x.dbEvents.filter(e=>e.sql.startsWith('DELETE FROM sessions')).length,0);
 const status=await x.app.fetch(req('/session',{headers:{
  Cookie:cookie,'Sec-Fetch-Site':'same-origin',
 }}));
 assert.equal((await status.json()).authorized,true);
});
