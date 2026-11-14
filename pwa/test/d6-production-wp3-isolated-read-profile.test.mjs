import {createD6OwnerSourceRoute}
 from '../../experiments/p3/preview/src/d6-owner-source-route.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createD6ProductionRuntimeBindingContract}
 from '../../experiments/p3/preview/src/d6-production-runtime-bindings.mjs';
import {D6_WP3_STAGING_ORIGIN as WP3,
 D6_WP2_STAGING_ORIGIN as WP2,D6_READER_ORIGIN as PUBLIC}
 from '../src/d6-public-reader.mjs';
import {D6_WP3_ISOLATED_PAGES_BASE as PAGES,
 D6_ISOLATED_PAGES_BASE as WP2PAGES,
 D6_GITHUB_PAGES_BASE as PUBLICPAGES,
 planD6PublicRead,createD6PublicReadProxy}
 from '../server/d6-pages-path-gateway.mjs';

const OWNER=265665562,REPO=1350909744,NOW=2000000000;
const base=Object.freeze({
 D6_PRODUCTION_ENABLED:'true',D6_GATEWAY_ENABLED:'true',
 D6_ORIGIN:WP3,D6_OWNER_GITHUB_ID:String(OWNER),
 D6_REPOSITORY_ID:String(REPO),
 D6_WP3_ISOLATED_READ_ENABLED:'true',
 D6_WP3_ISOLATED_PAGES_ENABLED:'true',
});
const r=(origin,path,options={})=>new Request(origin+path,options);
function setup(overrides={}){
 const events={network:[],d1:[],flows:new Map(),sessions:new Map()};
 const AUTH_DB={prepare(sql){return {bind(...a){events.d1.push({sql,a});return{
  async run(){
   if(sql.startsWith('INSERT INTO auth_flows'))events.flows.set(a[0],{
    code_verifier:a[1],expires_at:a[2],
   });
   else if(sql.startsWith('INSERT INTO sessions'))events.sessions.set(a[0],{
    github_id:a[1],expires_at:a[2],
   });
   else throw Error('No unapproved D1 query');
   return {success:true};
  },
  async first(){
   if(sql.startsWith('DELETE FROM auth_flows')){
    const row=events.flows.get(a[0]);
    events.flows.delete(a[0]);
    return row?.expires_at>a[1]?{code_verifier:row.code_verifier}:null;
   }
   if(sql.startsWith('SELECT github_id,expires_at FROM sessions')){
    const row=events.sessions.get(a[0]);
    return row?.expires_at>a[1]?row:null;
   }
   throw Error('No unapproved D1 query');
  },
 };}};}};
 const env={...base,AUTH_DB,
  D6_CSRF_KEY:'wp3-synthetic-csrf-key-000000000000000000000',
  D6_GITHUB_APP_ID:'77',D6_GITHUB_INSTALLATION_ID:'42',
  D6_GITHUB_APP_PRIVATE_KEY:'NOT-A-REAL-KEY',
  ...overrides,
 };
 const runtime=createD6ProductionRuntimeBindingContract({
  env,now:()=>NOW,
  network:async(url,opts)=>{
   events.network.push({url,opts});
   if(url.startsWith(PAGES))
    return new Response('pinned-isolated-wp3-static-bytes',{
     status:200,headers:{'Content-Type':'text/plain'},
    });
   if(url==='https://github.com/login/oauth/access_token')
    return new Response(JSON.stringify({
     access_token:'gho_'+'abcdef'.repeat(6),token_type:'bearer',
    }),{headers:{'Content-Type':'application/json'}});
   if(url==='https://api.github.com/user')
    return new Response(JSON.stringify({id:OWNER,login:'ginosega'}),{
     headers:{'Content-Type':'application/json'},
    });
   throw Error('No unapproved provider call');
  },
 });
 return {runtime,env,events};
}
const cookie=(response,name)=>response.headers.get('Set-Cookie')
 ?.match(new RegExp(name+'=([A-Za-z0-9_-]{43})'))?.[1]??null;

test('WP3-READ01 without distinct profile enabled, isolated origin cannot read or authenticate',async()=>{
 const x=setup({D6_WP3_READ_PROFILE_ENABLED:undefined,
  D6_STATIC_ENABLED:'true',D6_OAUTH_ENABLED:'true',
  D6_SESSION_ENABLED:'true'});
 for(const path of ['/','/fishing/release.json','/session',
  '/auth/start','/auth/callback','/api/v3/authoring-source',
  '/api/v3/operations','/api/v3/media']){
  const response=await x.runtime.fetch(r(WP3,path));
  assert.equal(response.status,503);
 }
 assert.equal(x.events.network.length,0);
 assert.equal(x.events.d1.length,0);
 assert.deepEqual(Object.keys(x.runtime),['fetch']);
});

test('WP3-READ02 pinned isolated origin and Pages pair only; no WP2/production bytes',async()=>{
 const x=setup({D6_WP3_READ_PROFILE_ENABLED:'true',
  D6_STATIC_ENABLED:'true'});
 const response=await x.runtime.fetch(r(WP3,'/fishing/release.json'));
 assert.equal(response.status,200);
 assert.equal(await response.text(),'pinned-isolated-wp3-static-bytes');
 assert.deepEqual(x.events.network.map(z=>z.url),[
  PAGES+'release.json',
 ]);
 assert.equal(x.events.network[0].opts.credentials,'omit');
 assert.equal(x.events.network[0].opts.cache,'no-store');
 for(const path of ['/api/v3/operations','/api/v3/media']){
  assert.equal((await x.runtime.fetch(r(WP3,path,{method:'POST'}))).status,404);
 }
 for(const origin of [PUBLIC,WP2,'https://untrusted.invalid']){
  assert.equal((await x.runtime.fetch(r(origin,'/fishing/release.json'))).status,404);
 }
 assert.equal(x.events.network.length,1);
 assert.equal(x.events.d1.length,0);
});

test('WP3-READ03 wrong or mixed host/PAGES profile pins fail before network',async()=>{
 for(const bad of [
  {D6_ORIGIN:WP2},
  {D6_ORIGIN:PUBLIC},
  {D6_WP3_ISOLATED_PAGES_ENABLED:undefined},
  {D6_ISOLATED_PAGES_ENABLED:'true'},
  {D6_WP2_STAGING_ENABLED:'true'},
  {D6_WP3_ISOLATED_READ_ENABLED:undefined},
  {D6_OWNER_GITHUB_ID:String(OWNER+1)},
  {D6_REPOSITORY_ID:String(REPO+1)},
  {D6_WP3_READ_PROFILE_ENABLED:'True'},
 ]){
  const x=setup({...bad,D6_WP3_READ_PROFILE_ENABLED:
   Object.hasOwn(bad,'D6_WP3_READ_PROFILE_ENABLED')?
    bad.D6_WP3_READ_PROFILE_ENABLED:'true',
   D6_STATIC_ENABLED:'true',D6_SESSION_ENABLED:'true',
   D6_OAUTH_ENABLED:'true'});
  assert.equal((await x.runtime.fetch(r(WP3,'/fishing/release.json'))).status,503);
  assert.equal(x.events.network.length,0);
  assert.equal(x.events.d1.length,0);
 }
});

test('WP3-READ04 dedicated Pages cannot be served from WP2 or public origins',async()=>{
 assert.equal(planD6PublicRead({origin:WP3,
  pagesBase:PAGES,url:WP3+'/fishing/release.json'}).upstreamUrl,
  PAGES+'release.json');
 for(const [origin,pagesBase] of [
  [WP3,WP2PAGES],[WP3,PUBLICPAGES],[WP2,PAGES],[PUBLIC,PAGES],
 ]){
  assert.equal(planD6PublicRead({
   origin,pagesBase,url:origin+'/fishing/release.json',
  }).kind,'deny');
  assert.throws(()=>createD6PublicReadProxy({
   origin,pagesBase,fetchAsset:async()=>new Response('x'),
  }));
 }
});

test('WP3-READ05 isolated OAuth PKCE redirect and cookie are bound to WP3 only',async()=>{
 const x=setup({D6_WP3_READ_PROFILE_ENABLED:'true',
  D6_OAUTH_ENABLED:'true',D6_SESSION_ENABLED:'true',
  D6_OAUTH_CLIENT_ID:'Iv1.fishingtest',
  D6_OAUTH_CLIENT_SECRET:'test-only-private-secret-XXXXXXXXXXXXXXXXXX'});
 const start=await x.runtime.fetch(r(WP3,'/auth/start',{
  headers:{'Sec-Fetch-Mode':'navigate',
   'Sec-Fetch-Dest':'document','Sec-Fetch-Site':'same-origin'},
 }));
 assert.equal(start.status,303);
 const params=new URL(start.headers.get('Location'));
 assert.equal(params.searchParams.get('redirect_uri'),WP3+'/auth/callback');
 assert.equal(params.searchParams.get('allow_signup'),'false');
 const state=cookie(start,'__Host-fish_p0_flow');
 assert.match(state,/^[A-Za-z0-9_-]{43}$/);
 assert.equal(x.events.flows.size,1);
 assert.equal(x.events.network.length,0);
 const callback=await x.runtime.fetch(r(WP3,
  '/auth/callback?code=testGithubCode1234567890&state='+state,{
   headers:{Cookie:'__Host-fish_p0_flow='+state,
    'Sec-Fetch-Mode':'navigate',
    'Sec-Fetch-Dest':'document','Sec-Fetch-Site':'cross-site'},
  }));
 assert.equal(callback.status,303);
 assert.equal(callback.headers.get('Location'),'/fishing/');
 const sid=cookie(callback,'__Host-fish_p0_session');
 assert.match(sid,/^[A-Za-z0-9_-]{43}$/);
 assert.equal(x.events.sessions.get(
  createHash('sha256').update(sid).digest('base64url')).github_id,OWNER);
 assert.deepEqual(x.events.network.map(x=>x.url),[
  'https://github.com/login/oauth/access_token',
  'https://api.github.com/user',
 ]);
 assert.equal((await x.runtime.fetch(r(WP3,'/session',{
  headers:{Cookie:'__Host-fish_p0_session='+sid,
   'Sec-Fetch-Site':'same-origin'},
 }))).status,200);
 assert.equal((await x.runtime.fetch(r(WP2,'/session',{
  headers:{Cookie:'__Host-fish_p0_session='+sid,
   'Sec-Fetch-Site':'same-origin'},
 }))).status,404);
 assert.equal((await x.runtime.fetch(r(WP3,'/api/v3/operations',{
  method:'POST'}))).status,404);
});

test('WP3-READ06 source profile has no token, D1 or write method exposure',()=>{
 const x=setup({D6_WP3_READ_PROFILE_ENABLED:'true'});
 assert.deepEqual(Object.keys(x.runtime).sort(),[
  'fetch','verifyHostedBytes',
 ]);
 for(const key of ['publish','write','issueToken','sign',
  'authorizeWrite','issueWriteToken','merge','deploy','migrate',
  'createOperation'])
  assert.equal(key in x.runtime,false);
 assert.equal(x.events.network.length,0);
 assert.equal(x.events.d1.length,0);
});

test('WP3-READ07 owner canonical read source only accepts matching explicit staging profile',async()=>{
 const options={
  ownerSession:{authorizeStatus:async()=>({
   authorized:true,ownerGitHubId:OWNER,
  })},
  readHostedRevision:async()=>{throw Error('Not hosted')},
  loadSnapshot:async()=>{throw Error('Not hosted')},
  enabled:()=>false,
 };
 for(const origin of [WP2,WP3]){
  const route=createD6OwnerSourceRoute({...options,origin,
   stagingMode:true});
  assert.deepEqual(Object.keys(route),['serve']);
  assert.equal((await route.serve(r(origin,
   '/api/v3/authoring-source'))).status,503);
 }
 for(const [origin,stagingMode] of [
  [PUBLIC,true],[WP2,false],[WP3,false],
  ['https://untrusted.invalid',true],
 ]){
  assert.throws(()=>createD6OwnerSourceRoute({...options,
   origin,stagingMode}));
 }
});
