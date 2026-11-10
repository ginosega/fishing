import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createD6ProductionOAuthReadComposition}
 from '../../experiments/p3/preview/src/d6-production-oauth-read-composition.mjs';

const ORIGIN='https://fishing.ginosega.workers.dev',NOW=2000000000;
const OWNER=265665562, CODE='githubTestCode1234567890';
const sha=x=>createHash('sha256').update(x).digest('base64url');
const req=(path,opts={})=>new Request(ORIGIN+path,opts);
function make(overrides={}){
 const state={flows:new Map(),sessions:new Map(),db:[],oauth:[],app:[],asset:[]};
 const db={prepare(sql){return {bind(...args){
  state.db.push({sql,args});
  return {
   async run(){
    if(sql.startsWith('INSERT INTO auth_flows')){
     const [hash,code_verifier,expires_at]=args;
     state.flows.set(hash,{code_verifier,expires_at});
    }else if(sql.startsWith('INSERT INTO sessions')){
     const [hash,github_id,expires_at]=args;
     state.sessions.set(hash,{github_id,expires_at});
    }else throw Error('D1 mutation denied');
    return {success:true};
   },
   async first(){
    if(sql.startsWith('DELETE FROM auth_flows')){
     const [hash,at]=args,row=state.flows.get(hash);
     state.flows.delete(hash);
     return row?.expires_at>at?{code_verifier:row.code_verifier}:null;
    }
    if(sql.startsWith('SELECT github_id,expires_at FROM sessions')){
     const [hash,at]=args,row=state.sessions.get(hash);
     return row?.expires_at>at?row:null;
    }
    throw Error('D1 read denied');
   },
  };
 }};}};
 const provider=async(url,options)=>{
  state.oauth.push({url,options});
  if(url==='https://github.com/login/oauth/access_token')
   return new Response(JSON.stringify({
    access_token:'gho_'+'abc123'.repeat(6),token_type:'bearer',
   }),{headers:{'Content-Type':'application/json'}});
  if(url==='https://api.github.com/user')
   return new Response(JSON.stringify({id:OWNER,login:'ginosega'}),
    {headers:{'Content-Type':'application/json'}});
  throw Error('Invalid OAuth upstream');
 };
 const config={
  transport:async(url,options)=>{
   state.asset.push({url,options});
   return new Response('read-only bytes',{
    status:200,headers:{'Content-Type':'text/plain'},
   });
  },
  requestAppGitHub:async(...args)=>{state.app.push(args);throw Error('App denied');},
  requestOAuthGitHub:provider,
  oauthClientId:'Iv1.fishingtest',
  oauthClientSecret:'test-only-private-oauth-secret-xxxxxxxx',
  AUTH_DB:db,csrfKey:'valid-test-only-csrf-secret-xxxxxxxxxxxxxxxxxxxxx',
  now:()=>NOW,appEnv:{D6_GITHUB_APP_ID:'77',D6_GITHUB_INSTALLATION_ID:'42',
   D6_GITHUB_APP_PRIVATE_KEY:'not-a-real-key'},
  ...overrides,
 };
 const app=createD6ProductionOAuthReadComposition(config);
 return {app,state};
}
function flowCookie(res){
 const match=(res.headers.get('Set-Cookie')??'').match(
  /__Host-fish_p0_flow=([A-Za-z0-9_-]{43})/);
 return match?.[1]??null;
}
function sessionCookie(res){
 const match=(res.headers.get('Set-Cookie')??'').match(
  /__Host-fish_p0_session=([A-Za-z0-9_-]{43})/);
 return match?.[1]??null;
}
async function login(x){
 const res=await x.app.fetch(req('/auth/start',{headers:{
  'Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document',
  'Sec-Fetch-Site':'same-origin',
 }}));
 assert.equal(res.status,303);
 const state=flowCookie(res);
 assert.match(state,/^[A-Za-z0-9_-]{43}$/);
 return state;
}
const callback=state=>req('/auth/callback?code='+CODE+'&state='+state,{
 headers:{Cookie:'__Host-fish_p0_flow='+state,
  'Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document',
  'Sec-Fetch-Site':'cross-site',
 },
});
test('D6-OAUTH-READ01 all default OFF with no data/provider access',async()=>{
 const x=make();
 for(const path of ['/auth/start','/auth/callback','/session',
  '/fishing/release.json','/api/v3/authoring-source']){
  assert.equal((await x.app.fetch(req(path))).status,503);
 }
 assert.equal(x.state.db.length,0);
 assert.equal(x.state.oauth.length,0);
 assert.equal(x.state.app.length,0);
 assert.equal(x.state.asset.length,0);
 assert.deepEqual(Object.keys(x.app).sort(),['fetch','verifyHostedBytes']);
 assert(Object.isFrozen(x.app));
});
test('D6-OAUTH-READ02 OAuth requires separate gateway, session, auth gates',async()=>{
 for(const flags of [
  {oauthEnabled:true},
  {gatewayEnabled:true,oauthEnabled:true},
  {sessionEnabled:true,oauthEnabled:true},
  {gatewayEnabled:true,sessionEnabled:true},
 ]){
  const x=make(flags);
  assert.equal((await x.app.fetch(req('/auth/start'))).status,503);
  assert.equal(x.state.db.length,0);
  assert.equal(x.state.oauth.length,0);
 }
});
test('D6-OAUTH-READ03 OAuth enabled with no source/issuer/App permissions',async()=>{
 const x=make({gatewayEnabled:true,sessionEnabled:true,oauthEnabled:true});
 const state=await login(x);
 const response=await x.app.fetch(callback(state));
 assert.equal(response.status,303);
 assert.equal(response.headers.get('Location'),'/fishing/');
 const sid=sessionCookie(response);
 assert.match(sid,/^[A-Za-z0-9_-]{43}$/);
 assert.equal(x.state.sessions.get(sha(sid)).github_id,OWNER);
 assert.equal(x.state.oauth.length,2);
 assert.equal(x.state.app.length,0);
 const ownerStatus=await x.app.fetch(req('/session',{headers:{
  Cookie:'__Host-fish_p0_session='+sid,'Sec-Fetch-Site':'same-origin',
 }}));
 assert.equal(ownerStatus.status,200);
 assert.deepEqual(await ownerStatus.json(),{
  authenticated:true,authorized:true,ownerLogin:'ginosega',
 });
 const source=await x.app.fetch(req('/api/v3/authoring-source',{headers:{
  Cookie:'__Host-fish_p0_session='+sid,
 }}));
 assert.equal(source.status,503);
 assert.equal(x.state.app.length,0);
 assert.equal(x.state.asset.length,0);
});
test('D6-OAUTH-READ04 authenticated session cannot grant publishing',async()=>{
 const x=make({gatewayEnabled:true,sessionEnabled:true,oauthEnabled:true});
 const sid=sessionCookie(await x.app.fetch(callback(await login(x))));
 for(const path of ['/api/v3/operations','/api/v3/media','/session/signout',
  '/session/revoke-all']){
  const response=await x.app.fetch(req(path,{
   method:'POST',headers:{
    Cookie:'__Host-fish_p0_session='+sid,
    Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
   },
  }));
  assert.equal(response.status,404);
 }
 assert.equal(x.state.app.length,0);
});
test('D6-OAUTH-READ05 one-use state and exact callback',async()=>{
 const x=make({gatewayEnabled:true,sessionEnabled:true,oauthEnabled:true});
 const state=await login(x);
 assert.equal((await x.app.fetch(callback(state))).status,303);
 assert.equal((await x.app.fetch(callback(state))).status,400);
 assert.equal(x.state.sessions.size,1);
 assert.equal(x.state.oauth.length,2);
 const bad=await x.app.fetch(req('/auth/callback?code='+CODE+'&state='+state+
  '&return=https://evil.invalid',{
  headers:{Cookie:'__Host-fish_p0_flow='+state},
 }));
 assert.equal(bad.status,400);
});
test('D6-OAUTH-READ06 malformed methods, origin and bearer requests rejected',async()=>{
 const x=make({gatewayEnabled:true,sessionEnabled:true,oauthEnabled:true});
 for(const request of [
  new Request('https://evil.invalid/auth/start'),
  req('/auth/start',{method:'POST'}),
  req('/auth/start',{headers:{Authorization:'Bearer xxx'}}),
  req('/auth/start',{headers:{Origin:'https://evil.invalid'}}),
  req('/auth/start',{headers:{'Sec-Fetch-Site':'cross-site'}}),
  req('/auth/start',{headers:{'Sec-Fetch-Mode':'cors'}}),
 ]){
  const result=await x.app.fetch(request);
  assert([403,404].includes(result.status));
 }
 assert.equal(x.state.oauth.length,0);
 assert.equal(x.state.db.length,0);
});
test('D6-OAUTH-READ07 static anonymous proxy remains separate from auth',async()=>{
 const x=make({gatewayEnabled:true,staticEnabled:true});
 const res=await x.app.fetch(req('/fishing/release.json'));
 assert.equal(res.status,200);
 assert.equal(await res.text(),'read-only bytes');
 assert.equal(x.state.asset.length,1);
 assert.equal(x.state.asset[0].url,
  'https://ginosega.github.io/fishing/release.json');
 assert.equal((await x.app.fetch(req('/auth/start'))).status,503);
 assert.equal(x.state.oauth.length,0);
 assert.equal(x.state.app.length,0);
});
test('D6-OAUTH-READ08 all App read flags do not silently enable OAuth',async()=>{
 const x=make({gatewayEnabled:true,staticEnabled:true,sessionEnabled:true,
  sourceEnabled:true,tokenEnabled:true,signerEnabled:true,
  oauthEnabled:false});
 assert.equal((await x.app.fetch(req('/auth/start'))).status,503);
 assert.equal(x.state.oauth.length,0);
 assert.equal(x.state.app.length,0);
});
test('D6-OAUTH-READ09 invalid switch types are refused',()=>{
 for(const flags of [{oauthEnabled:'true'},{sessionEnabled:()=>true},
  {gatewayEnabled:1},{now:123}]){
  assert.throws(()=>make(flags));
 }
});
test('D6-OAUTH-READ10 no Worker entry, sandbox, publisher or client token',()=>{
 const source=readFileSync(new URL(
  '../../experiments/p3/preview/src/d6-production-oauth-read-composition.mjs',
  import.meta.url),'utf8');
 assert.match(source,/createD6ProductionOAuthSessionIssuer/);
 assert.match(source,/createD6ProductionReadWithSigner/);
 assert.match(source,/oauthEnabled=false/);
 assert.doesNotMatch(source,/export default|addEventListener\(/);
 assert.doesNotMatch(source,/1430581407|fishing-p3-sandbox/);
 assert.doesNotMatch(source,/authorizeWrite|issueWriteToken|session\.signout/);
 assert.doesNotMatch(source,/D2_WRITE_ENABLED|D3_RUNNER_ENABLED/);
});
