import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createD6ProductionOAuthSessionIssuer,D6_OAUTH_ORIGIN,
 D6_OAUTH_OWNER_ID}
 from '../../experiments/p3/preview/src/d6-production-oauth-session-issuer.mjs';

const ORIGIN='https://fishing.ginosega.workers.dev';
const CODE='githubTestCode1234567890';
const NOW=2000000000;
const sha=x=>createHash('sha256').update(x).digest('base64url');
const req=(path,options={})=>new Request(ORIGIN+path,options);
const b64cookie=(res,name)=>{
 const header=res.headers.get('Set-Cookie')??'';
 const m=header.match(new RegExp(name+'=([A-Za-z0-9_-]{43})'));
 return m?.[1]??null;
};
function database(){
 const flows=new Map(),sessions=new Map(),calls=[];
 let failFlow=false,failSession=false;
 return {flows,sessions,calls,
  set failFlow(v){failFlow=v;},set failSession(v){failSession=v;},
  prepare(sql){
   return {bind(...args){
    calls.push({sql,args});
    return {
     async run(){
      if(sql.startsWith('INSERT INTO auth_flows')){
       if(failFlow)return {success:false};
       const [hash,verifier,expires]=args;
       flows.set(hash,{code_verifier:verifier,expires_at:expires});
       return {success:true};
      }
      if(sql.startsWith('INSERT INTO sessions')){
       if(failSession)return {success:false};
       const [hash,github_id,expires_at]=args;
       sessions.set(hash,{github_id,expires_at});
       return {success:true};
      }
      throw Error('unexpected D1 write');
     },
     async first(){
      assert.match(sql,/^DELETE FROM auth_flows WHERE state_hash/);
      const [hash,at]=args;
      const row=flows.get(hash);flows.delete(hash);
      return row&&row.expires_at>at?{code_verifier:row.code_verifier}:null;
     },
    };
   }};
  },
 };
}
function factory(overrides={}){
 const db=database(),provider=[];
 const issue=createD6ProductionOAuthSessionIssuer({
  AUTH_DB:db,clientId:'Iv1.fishingtest',
  clientSecret:'private-d6-test-secret-long-value-0123456789',
  enabled:()=>true,now:()=>NOW,
  requestGitHub:async(url,options)=>{
   provider.push({url,options});
   if(url==='https://github.com/login/oauth/access_token')
    return new Response(JSON.stringify({
     access_token:'gho_'+'abc123'.repeat(6),token_type:'bearer',
    }),{headers:{'Content-Type':'application/json'}});
   if(url==='https://api.github.com/user')
    return new Response(JSON.stringify({
     id:D6_OAUTH_OWNER_ID,login:'ginosega',
    }),{headers:{'Content-Type':'application/json'}});
   throw Error('unexpected provider endpoint');
  },
  ...overrides,
 });
 return {issue,db,provider};
}
async function start(x){
 const res=await x.issue.start(req('/auth/start',{
  headers:{'Sec-Fetch-Site':'same-origin',
   'Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document'},
 }));
 assert.equal(res.status,303);
 const state=b64cookie(res,'__Host-fish_p0_flow');
 assert.match(state,/^[A-Za-z0-9_-]{43}$/);
 return {res,state};
}
const callback=(state,{code=CODE,cookie=state,query=''}={})=>
 req('/auth/callback?state='+state+'&code='+code+query,{
  headers:{Cookie:'__Host-fish_p0_flow='+cookie,
   'Sec-Fetch-Site':'cross-site','Sec-Fetch-Mode':'navigate',
   'Sec-Fetch-Dest':'document'},
 });

test('D6-OAUTH01 default OFF never touches storage or provider',async()=>{
 let dbCalls=0,networkCalls=0;
 const p=createD6ProductionOAuthSessionIssuer({
  AUTH_DB:{prepare(){dbCalls++;throw Error('no');}},
  requestGitHub(){networkCalls++;throw Error('no');},
 });
 assert.equal((await p.start(req('/auth/start'))).status,503);
 assert.equal((await p.callback(req('/auth/callback'))).status,503);
 assert.equal(dbCalls,0);assert.equal(networkCalls,0);
 assert.deepEqual(Object.keys(p).sort(),['callback','start']);
 assert(Object.isFrozen(p));
});
test('D6-OAUTH02 start stores 10-minute one-use PKCE flow and fixed origin',async()=>{
 const x=factory(),{res,state}=await start(x);
 assert.equal(D6_OAUTH_ORIGIN,ORIGIN);
 const url=new URL(res.headers.get('Location'));
 assert.equal(url.origin,'https://github.com');
 assert.equal(url.pathname,'/login/oauth/authorize');
 assert.equal(url.searchParams.get('client_id'),'Iv1.fishingtest');
 assert.equal(url.searchParams.get('redirect_uri'),ORIGIN+'/auth/callback');
 assert.equal(url.searchParams.get('state'),state);
 assert.equal(url.searchParams.get('code_challenge_method'),'S256');
 assert.equal(url.searchParams.get('allow_signup'),'false');
 assert.equal(url.searchParams.has('scope'),false);
 assert.equal(x.db.flows.size,1);
 const f=x.db.flows.get(sha(state));
 assert.match(f.code_verifier,/^[A-Za-z0-9_-]{43}$/);
 assert.equal(f.expires_at,NOW+600);
 assert.equal(url.searchParams.get('code_challenge'),sha(f.code_verifier));
 assert.match(res.headers.get('Set-Cookie'),/Secure; HttpOnly; SameSite=Lax/);
 assert.equal(res.headers.get('Cache-Control'),'private, no-store, max-age=0');
 assert.equal(x.provider.length,0);
});
test('D6-OAUTH03 callback accepts only pinned owner, creates hashed D5 session',async()=>{
 const x=factory(),{state}=await start(x);
 const response=await x.issue.callback(callback(state));
 assert.equal(response.status,303);
 assert.equal(response.headers.get('Location'),'/fishing/');
 const sid=b64cookie(response,'__Host-fish_p0_session');
 assert.match(sid,/^[A-Za-z0-9_-]{43}$/);
 assert.match(response.headers.get('Set-Cookie'),/__Host-fish_p0_flow=; Path=\/; Max-Age=0/);
 assert.match(response.headers.get('Set-Cookie'),/__Host-fish_p0_session=/);
 assert.equal(x.db.flows.size,0);
 assert.equal(x.db.sessions.size,1);
 assert.deepEqual(x.db.sessions.get(sha(sid)),{
  github_id:D6_OAUTH_OWNER_ID,expires_at:NOW+7*86400,
 });
 assert.equal(x.provider.length,2);
 assert.equal(x.provider[0].url,'https://github.com/login/oauth/access_token');
 assert.equal(x.provider[1].url,'https://api.github.com/user');
 assert.equal(x.provider[0].options.method,'POST');
 assert.equal(x.provider[0].options.redirect,'manual');
 assert.equal(x.provider[0].options.credentials,'omit');
 const body=JSON.parse(x.provider[0].options.body);
 assert.equal(body.redirect_uri,ORIGIN+'/auth/callback');
 assert.equal(body.code,CODE);
 assert.equal(body.code_verifier.length,43);
 assert.equal(body.client_secret,'private-d6-test-secret-long-value-0123456789');
 assert.equal(x.provider[1].options.headers.Authorization,
  'Bearer '+'gho_'+'abc123'.repeat(6));
 assert(!String(response.headers.get('Set-Cookie')).includes('gho_'));
 assert(!String(response.headers.get('Location')).includes('gho_'));
});
test('D6-OAUTH04 foreign GitHub ID cannot receive a session',async()=>{
 const x=factory({requestGitHub:async(url)=>{
  if(url.includes('access_token'))return new Response(JSON.stringify({
   access_token:'gho_'+'Z'.repeat(40),token_type:'bearer',
  }),{headers:{'Content-Type':'application/json'}});
  return new Response(JSON.stringify({id:6666666,login:'ginosega'}),
   {headers:{'Content-Type':'application/json'}});
 }});
 const {state}=await start(x);
 const response=await x.issue.callback(callback(state));
 assert.equal(response.status,403);
 assert.equal(x.db.sessions.size,0);assert.equal(x.db.flows.size,0);
 assert.equal(b64cookie(response,'__Host-fish_p0_session'),null);
});
test('D6-OAUTH05 state is consumed atomically and replay is denied',async()=>{
 const x=factory(),{state}=await start(x);
 assert.equal((await x.issue.callback(callback(state))).status,303);
 const replay=await x.issue.callback(callback(state));
 assert.equal(replay.status,400);
 assert.equal(x.db.sessions.size,1);
 assert.equal(x.provider.length,2);
});
test('D6-OAUTH06 malformed, duplicate, mismatched flow and redirect denied before provider',async()=>{
 const x=factory(),{state}=await start(x);
 const invalid=[
  callback(state,{cookie:'B'.repeat(43)}),
  callback(state,{query:'&state='+state}),
  callback(state,{query:'&return=https://evil.invalid'}),
  callback(state,{code:'bad'}),
  req('/auth/callback?state='+state+'&code='+CODE,{
   headers:{Cookie:'__Host-fish_p0_flow='+state+
    '; __Host-fish_p0_flow='+state},
  }),
  req('/auth/callback?state='+state+'&code='+CODE),
 ];
 for(const request of invalid){
  assert.equal((await x.issue.callback(request)).status,400);
  assert.equal(x.provider.length,0);
 }
 assert.equal(x.db.flows.size,1);
 assert.equal((await x.issue.callback(callback(state))).status,303);
});
test('D6-OAUTH07 cross-origin and non-navigation starts fail closed',async()=>{
 const x=factory();
 const invalid=[
  req('/auth/start?return=https://evil.invalid'),
  req('/auth/start',{method:'POST'}),
  req('/auth/start',{headers:{Authorization:'Bearer fake'}}),
  req('/auth/start',{headers:{'Sec-Fetch-Site':'cross-site'}}),
  req('/auth/start',{headers:{'Sec-Fetch-Site':'same-site'}}),
  req('/auth/start',{headers:{'Sec-Fetch-Mode':'cors'}}),
  new Request('https://evil.invalid/auth/start'),
 ];
 for(const request of invalid){
  const response=await x.issue.start(request);
  assert.equal(response.status,404);
 }
 assert.equal(x.db.flows.size,0);assert.equal(x.provider.length,0);
});
test('D6-OAUTH08 OAuth provider redirects and malformed JSON fail closed',async()=>{
 for(const upstream of [
  new Response(null,{status:302,headers:{Location:'https://evil.invalid'}}),
  new Response('<script>bad</script>',{headers:{'Content-Type':'text/html'}}),
  new Response('{bad',{headers:{'Content-Type':'application/json'}}),
  new Response('{}',{headers:{'Content-Type':'application/json'}}),
 ]){
  const x=factory({requestGitHub:async()=>upstream.clone()});
  const {state}=await start(x);
  const response=await x.issue.callback(callback(state));
  assert.equal(response.status,503);assert.equal(x.db.sessions.size,0);
  assert.equal(x.db.flows.size,0);
  assert.equal(b64cookie(response,'__Host-fish_p0_session'),null);
 }
});
test('D6-OAUTH09 failed D1 persistence never sets new session cookies',async()=>{
 const x=factory();x.db.failFlow=true;
 const failedStart=await x.issue.start(req('/auth/start'));
 assert.equal(failedStart.status,503);
 assert.equal(failedStart.headers.get('Set-Cookie'),null);
 x.db.failFlow=false;
 const {state}=await start(x);
 x.db.failSession=true;
 const failed=await x.issue.callback(callback(state));
 assert.equal(failed.status,503);
 assert.equal(x.db.sessions.size,0);
 assert.equal(b64cookie(failed,'__Host-fish_p0_session'),null);
});
test('D6-OAUTH10 config and capability revocation deny independently',async()=>{
 const x=factory({clientSecret:''});
 assert.equal((await x.issue.start(req('/auth/start'))).status,503);
 assert.equal(x.db.calls.length,0);
 let on=true;
 const y=factory({enabled:()=>on});
 const {state}=await start(y);
 on=false;
 assert.equal((await y.issue.callback(callback(state))).status,503);
 assert.equal(y.db.flows.size,1);
 assert.throws(()=>createD6ProductionOAuthSessionIssuer({enabled:true}));
 assert.throws(()=>createD6ProductionOAuthSessionIssuer({now:'bad'}));
});
test('D6-OAUTH11 source has no production Worker, sandbox or writer entrypoint',()=>{
 const code=readFileSync(new URL(
  '../../experiments/p3/preview/src/d6-production-oauth-session-issuer.mjs',
  import.meta.url),'utf8');
 assert.match(code,/DELETE FROM auth_flows WHERE state_hash/);
 assert.match(code,/INSERT INTO sessions \(token_hash, github_id, expires_at\)/);
 assert.match(code,/SameSite=Lax/);
 assert.doesNotMatch(code,/export default|addEventListener\(/);
 assert.doesNotMatch(code,/1430581407|fishing-p3-sandbox/);
 assert.doesNotMatch(code,/issueReadToken|issueWriteToken|authorizeWrite/);
 assert.doesNotMatch(code,/\/api\/v3\/operations|D2_SANDBOX|D5_OWNER/);
});

// WP2-AUTH-03 / X-03: bound provider bodies without Content-Length.
test('D6-OAUTH12 oversized streamed OAuth JSON cancels before full read',async()=>{
 let pulled=0,canceled=false;
 const x=factory({requestGitHub:async url=>{
  assert.equal(url,'https://github.com/login/oauth/access_token');
  return new Response(new ReadableStream({
   pull(controller){
    pulled++;
    controller.enqueue(new Uint8Array(4096));
    if(pulled===10)controller.close();
   },
   cancel(){canceled=true;},
  }),{headers:{'Content-Type':'application/json'}});
 }});
 const {state}=await start(x);
 const response=await x.issue.callback(callback(state));
 assert.equal(response.status,503);
 assert.equal(x.db.sessions.size,0);
 assert.equal(x.db.flows.size,0);
 assert.equal(canceled,true);
 assert(pulled<10);
});

test('D6-OAUTH13 exact GitHub RFC 9207 issuer permits callback; spoofed issuers fail closed',async()=>{
 const githubIssuer='&iss=https%3A%2F%2Fgithub.com%2Flogin%2Foauth';
 const accepted=factory(),{state}=await start(accepted);
 const success=await accepted.issue.callback(callback(state,{query:githubIssuer}));
 assert.equal(success.status,303);
 assert.equal(success.headers.get('Location'),'/fishing/');
 assert.equal(accepted.db.sessions.size,1);
 assert.equal(accepted.db.flows.size,0);
 assert.equal(accepted.provider.length,2);

 const denied=factory(),{state:otherState}=await start(denied);
 for(const query of [
  '&iss=https%3A%2F%2Fevil.invalid%2Flogin%2Foauth',
  '&iss=https%3A%2F%2Fgithub.com',
  '&iss=HTTPS%3A%2F%2Fgithub.com%2Flogin%2Foauth',
  githubIssuer+'%2F',
  githubIssuer+githubIssuer,
  githubIssuer+'&return=%2Ffishing%2F',
  '&ISS=https%3A%2F%2Fgithub.com%2Flogin%2Foauth',
 ]){
  const rejected=await denied.issue.callback(
   callback(otherState,{query}));
  assert.equal(rejected.status,400,query);
  assert.equal(rejected.headers.get('Set-Cookie')?.includes('__Host-fish_p0_session='),false);
  assert.equal(denied.provider.length,0);
  assert.equal(denied.db.flows.size,1);
  assert.equal(denied.db.sessions.size,0);
 }
 // Rejected foreign parameters must not consume the legitimate pending flow.
 const recovered=await denied.issue.callback(
  callback(otherState,{query:githubIssuer}));
 assert.equal(recovered.status,303);
 assert.equal(denied.db.sessions.size,1);
 assert.equal(denied.provider.length,2);
});
