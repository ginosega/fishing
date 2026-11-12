import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';

// Isolated AUTH-P0 session lifecycle tests. No live Cloudflare/GitHub traffic.
const ORIGIN = 'https://fishing-auth-p0.example.workers.dev';
const COOKIE = '__Host-fish_p0_session';
const DAY = 86400;
const request = (path, options={}) => new Request(ORIGIN+path, options);
class MemoryD1 {
  constructor(){this.flows=new Map();this.sessions=new Map();this.commands=[];}
  prepare(sql){
    this.commands.push(sql);
    const db=this;
    return {bind(...args){return {
      async run(){
        if(sql.startsWith('INSERT INTO auth_flows'))db.flows.set(args[0],{code_verifier:args[1],expires_at:args[2]});
        else if(sql.startsWith('INSERT INTO sessions'))db.sessions.set(args[0],{github_id:args[1],expires_at:args[2]});
        else if(sql.startsWith('DELETE FROM sessions WHERE github_id')){for(const [k,v] of db.sessions)if(String(v.github_id)===String(args[0]))db.sessions.delete(k);}
        else if(sql.startsWith('DELETE FROM sessions WHERE token_hash'))db.sessions.delete(args[0]);
        else throw Error('Unexpected mock SQL run: '+sql);
        return {success:true};
      },
      async first(){
        if(sql.startsWith('DELETE FROM auth_flows')){
          const flow=db.flows.get(args[0]);
          if(!flow||flow.expires_at<=args[1])return null;
          db.flows.delete(args[0]);return {code_verifier:flow.code_verifier};
        }
        if(sql.startsWith('SELECT github_id')){
          const session=db.sessions.get(args[0]);
          return session&&session.expires_at>args[1]?session:null;
        }
        throw Error('Unexpected mock SQL first: '+sql);
      }
    };}};
  }
}
function config(){return {APP_ORIGIN:ORIGIN,OWNER_GITHUB_ID:'1111',GITHUB_CLIENT_ID:'Iv1.fake',GITHUB_CLIENT_SECRET:'fake-secret',DB:new MemoryD1()};}
function cookie(resp,name){const h=resp.headers.getSetCookie().find(x=>x.startsWith(name+'='));assert.ok(h,'Missing cookie '+name);return h.split(';')[0];}
function mockGithub(t, id=1111){let calls=0;
  t.mock.method(globalThis,'fetch',async(url,params)=>{
    calls++;
    if(url==='https://github.com/login/oauth/access_token'){
      assert.equal(params.method,'POST');
      return Response.json({access_token:'fake-oauth-token',token_type:'bearer'});
    }
    if(url==='https://api.github.com/user'){
      assert.equal(params.headers.Authorization,'Bearer fake-oauth-token');
      return Response.json({id,login:'test-owner'});
    }
    throw Error('Unexpected external call');
  });return ()=>calls;
}
async function login(e,redirect='/'){
  const r=await worker.fetch(request('/auth/start'+(redirect==='/'?'':'?return=%2Ffishing%2F')),e);
  assert.equal(r.status,303);
  const url=new URL(r.headers.get('Location'));
  const fc=cookie(r,'__Host-fish_p0_flow');
  const callback=await worker.fetch(request('/auth/callback?state='+url.searchParams.get('state')+'&code=mock-code',{headers:{Cookie:fc}}),e);
  assert.equal(callback.status,303);
  const sid=cookie(callback,COOKIE);
  return {sid,callback,url};
}
async function session(e,sid){const r=await worker.fetch(request('/session',{headers:sid?{Cookie:sid}:{}}),e);assert.equal(r.status,200);return r.json();}
function signedPost(route,sid){return request(route,{method:'POST',headers:{Cookie:sid,Origin:ORIGIN,'Sec-Fetch-Site':'same-origin','X-Fish-P0-Intent':'signout'}});}
const yes={authenticated:true,authorized:true},no={authenticated:false,authorized:false};

test('G1-C01: issued cookie is secure, first-party, HttpOnly, Lax, seven-day absolute lifetime',async t=>{
  const now=1730000000000;t.mock.method(Date,'now',()=>now);
  const e=config();mockGithub(t);
  const {sid,callback}=await login(e);
  const set=callback.headers.getSetCookie().find(s=>s.startsWith(COOKIE+'='));
  assert.match(set,/Path=\/; Max-Age=604800; Secure; HttpOnly; SameSite=Lax/);
  assert.equal(e.DB.sessions.size,1);
  const row=[...e.DB.sessions.values()][0];
  assert.equal(row.github_id,1111);
  assert.equal(row.expires_at,now/1000+7*DAY);
  assert.deepEqual(await session(e,sid),yes);
  assert.equal(e.DB.commands.filter(sql=>sql.startsWith('INSERT INTO sessions')).length,1);
});

test('G1-C02: repeated /session checks do not extend the absolute expiry',async t=>{
  let now=1730000000000;t.mock.method(Date,'now',()=>now);
  const e=config();mockGithub(t);const {sid}=await login(e);
  const expiry=[...e.DB.sessions.values()][0].expires_at;
  now+=(6*DAY+23*3600)*1000;
  assert.deepEqual(await session(e,sid),yes);
  assert.deepEqual(await session(e,sid),yes);
  assert.equal([...e.DB.sessions.values()][0].expires_at,expiry);
  now=(expiry-1)*1000;assert.deepEqual(await session(e,sid),yes);
  now=expiry*1000;assert.deepEqual(await session(e,sid),no);
  now=(expiry+DAY)*1000;assert.deepEqual(await session(e,sid),no);
});

test('G1-C03: independently expiring D1 session invalidates a still-present cookie; reauthentication works',async t=>{
  let now=1730000000000;t.mock.method(Date,'now',()=>now);
  const e=config();mockGithub(t);const {sid}=await login(e,'/fishing/');
  assert.deepEqual(await session(e,sid),yes);
  const original=[...e.DB.sessions.keys()][0];
  e.DB.sessions.get(original).expires_at=now/1000;
  assert.deepEqual(await session(e,sid),no);
  const newLogin=await login(e,'/fishing/');
  assert.notEqual(newLogin.sid,sid);
  assert.equal(newLogin.callback.headers.get('Location'),'/fishing/');
  assert.deepEqual(await session(e,newLogin.sid),yes);
  assert.deepEqual(await session(e,sid),no);
});

test('G1-C04: signout invalidates only one independent client session',async t=>{
  const e=config();mockGithub(t);
  const a=await login(e), b=await login(e);
  assert.notEqual(a.sid,b.sid);
  assert.equal(e.DB.sessions.size,2);
  const res=await worker.fetch(signedPost('/session/signout',a.sid),e);
  assert.equal(res.status,200);
  assert.match(res.headers.getSetCookie().join(','),new RegExp(COOKIE+'=; Path=/; Max-Age=0'));
  assert.equal(e.DB.sessions.size,1);
  assert.deepEqual(await session(e,a.sid),no);
  assert.deepEqual(await session(e,b.sid),yes);
});

test('G1-C05: revoke-all disables every owner session across multiple devices',async t=>{
  const e=config();mockGithub(t);const a=await login(e),b=await login(e),c=await login(e);
  assert.equal(e.DB.sessions.size,3);
  const revoke=await worker.fetch(signedPost('/session/revoke-all',b.sid),e);
  assert.equal(revoke.status,200);
  assert.equal(e.DB.sessions.size,0);
  for(const {sid} of [a,b,c])assert.deepEqual(await session(e,sid),no);
  const again=await worker.fetch(signedPost('/session/revoke-all',a.sid),e);
  assert.equal(again.status,403);
});

test('G1-C06: an expired session cannot revoke active sessions, but can sign out locally',async t=>{
  const e=config();mockGithub(t);const expired=await login(e),valid=await login(e);
  const badRow=[...e.DB.sessions.values()][0];badRow.expires_at=0;
  const rev=await worker.fetch(signedPost('/session/revoke-all',expired.sid),e);
  assert.equal(rev.status,403);
  assert.deepEqual(await session(e,valid.sid),yes);
  const signout=await worker.fetch(signedPost('/session/signout',expired.sid),e);
  assert.equal(signout.status,200);
  assert.deepEqual(await session(e,expired.sid),no);
  assert.deepEqual(await session(e,valid.sid),yes);
});

test('G1-C07: ten-minute OAuth flow expires exactly at boundary and reattempt can succeed',async t=>{
  let now=1730000000000;t.mock.method(Date,'now',()=>now);
  const e=config(),calls=mockGithub(t);
  const start=await worker.fetch(request('/auth/start'),e);
  const oauth=new URL(start.headers.get('Location'));
  assert.equal([...e.DB.flows.values()][0].expires_at,now/1000+600);
  now+=600000;
  const fail=await worker.fetch(request('/auth/callback?state='+oauth.searchParams.get('state')+'&code=mock',{headers:{Cookie:cookie(start,'__Host-fish_p0_flow')}}),e);
  assert.equal(fail.status,400);assert.equal(calls(),0);
  const again=await login(e);
  assert.deepEqual(await session(e,again.sid),yes);
});

test('G1-C08: server session does not consult GitHub after login; upstream grant revocation is not immediately reflected',async t=>{
  const e=config(),calls=mockGithub(t);const {sid}=await login(e);
  assert.equal(calls(),2);
  for(let i=0;i<3;i++)assert.deepEqual(await session(e,sid),yes);
  assert.equal(calls(),2,'session uses D1 only: no GitHub API/grant revalidation');
  assert.equal(e.DB.sessions.size,1);
});

test('G1-C09: callback accepts only allowed owner identity; non-owner never gets a session',async t=>{
  const e=config();mockGithub(t,9999);
  const r=await worker.fetch(request('/auth/start'),e);
  const oauth=new URL(r.headers.get('Location'));
  const c=await worker.fetch(request('/auth/callback?state='+oauth.searchParams.get('state')+'&code=mock',{headers:{Cookie:cookie(r,'__Host-fish_p0_flow')}}),e);
  assert.equal(c.status,403);
  assert.equal(e.DB.sessions.size,0);
  assert.equal(c.headers.getSetCookie().some(s=>s.startsWith(COOKIE+'=')),false);
});
