import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../src/worker.mjs';

// Entire test suite is offline: GitHub OAuth, D1 and upstream Pages are simulated.
// No test contacts the live Cloudflare AUTH-P0 Worker or changes production.
const ORIGIN = 'https://fishing-auth-p0.example.workers.dev';
const request = (path, init = {}) => new Request(ORIGIN + path, init);
class FakeD1 {
  constructor() { this.flows = new Map(); this.sessions = new Map(); }
  prepare(sql) {
    const db = this;
    return { bind(...args) { return {
      async run() {
        if (sql.startsWith('INSERT INTO auth_flows')) db.flows.set(args[0], { code_verifier: args[1], expires_at: args[2] });
        else if (sql.startsWith('INSERT INTO sessions')) db.sessions.set(args[0], { github_id: args[1], expires_at: args[2] });
        else if (sql.startsWith('DELETE FROM sessions WHERE github_id')) {
          for (const [key, value] of db.sessions) if (String(value.github_id) === String(args[0])) db.sessions.delete(key);
        } else if (sql.startsWith('DELETE FROM sessions WHERE token_hash')) db.sessions.delete(args[0]);
        else throw Error('Unexpected simulated SQL statement');
        return {success:true};
      },
      async first() {
        if (sql.startsWith('DELETE FROM auth_flows')) {
          const value=db.flows.get(args[0]);
          if (!value || value.expires_at <= args[1]) return null;
          db.flows.delete(args[0]); return {code_verifier:value.code_verifier};
        }
        if (sql.startsWith('SELECT github_id')) {
          const value=db.sessions.get(args[0]);
          return value && value.expires_at>args[1] ? value : null;
        }
        throw Error('Unexpected simulated SQL lookup');
      }
    }; } };
  }
}
const environment = () => ({APP_ORIGIN:ORIGIN, OWNER_GITHUB_ID:'1111', GITHUB_CLIENT_ID:'Iv1.test', GITHUB_CLIENT_SECRET:'fake-secret-only', DB:new FakeD1()});
function cookie(res,name) {
  const pair=res.headers.getSetCookie().find(v=>v.startsWith(name+'='));
  assert.ok(pair, 'missing cookie '+name);
  return pair.split(';')[0];
}
async function begin(env, path='/auth/start') {
  const r=await handler.fetch(request(path),env);
  assert.equal(r.status,303);
  const auth=new URL(r.headers.get('location'));
  assert.equal(auth.origin,'https://github.com');
  return {state:auth.searchParams.get('state'), flowCookie:cookie(r,'__Host-fish_p0_flow'), url:auth};
}
const callback=(env,flow,overrides={})=>handler.fetch(request('/auth/callback?state='+flow.state+'&code=fake_code',{
  headers:{Cookie:flow.flowCookie,...(overrides.headers||{})}
}),env);
function github(t,id=1111) {
  const calls=[];
  t.mock.method(globalThis,'fetch',async(url,init)=>{
    calls.push(typeof url==='string'?url:url.url);
    if(url==='https://github.com/login/oauth/access_token') return Response.json({access_token:'fake-private-gh-token',token_type:'bearer'});
    if(url==='https://api.github.com/user') {
      assert.equal(init.headers.Authorization,'Bearer fake-private-gh-token');
      return Response.json({id, login:'someuser'});
    }
    throw Error('Unexpected network destination');
  });
  return calls;
}
async function ownerSession(t,env){
  const hits=github(t);
  const flow=await begin(env,'/auth/start?return=%2Ffishing%2F');
  const resp=await callback(env,flow);
  assert.equal(resp.status,303);
  assert.equal(resp.headers.get('location'),'/fishing/');
  return {sid:cookie(resp,'__Host-fish_p0_session'),hits,flow};
}
function signedRequest(path,sid,overrides={}){
  return request(path,{method:'POST',headers:{Cookie:sid,Origin:ORIGIN,'Sec-Fetch-Site':'same-origin','X-Fish-P0-Intent':'signout',...overrides}});
}

test('G1-B01: anonymous, malformed and expired sessions cannot gain owner authorization',async(t)=>{
  const e=environment();
  for(const value of ['', 'bad', 'x'.repeat(43), 'x'.repeat(44)]){
    const r=await handler.fetch(request('/session',{headers:value?{Cookie:'__Host-fish_p0_session='+value}:{}}),e);
    assert.deepEqual(await r.json(),{authenticated:false,authorized:false});
    assert.equal(r.headers.get('access-control-allow-origin'),null);
    assert.match(r.headers.get('cache-control'),/no-store/);
  }
  const {sid}=await ownerSession(t,e);
  assert.deepEqual(await (await handler.fetch(request('/session',{headers:{Cookie:sid}}),e)).json(),
    {authenticated:true,authorized:true});
  for(const row of e.DB.sessions.values()) row.expires_at=0;
  assert.deepEqual(await (await handler.fetch(request('/session',{headers:{Cookie:sid}}),e)).json(),
    {authenticated:false,authorized:false},'expired server-side row must not authorize');
});

test('G1-B02: every unapproved OAuth return destination fails without creating a flow',async()=>{
  const e=environment();
  const invalid=['https%3A%2F%2Fevil.example','%2F%2Fevil.example','%2Ffishing','%2Ffishing%2F..%2Fauth','%2Ffishing%2F%3Ffoo%3D1','%2F','%5Cevil','%2Ffishing%2F%00'];
  for (const ret of invalid) {
    const r=await handler.fetch(request('/auth/start?return='+ret),e);
    assert.equal(r.status,400,'return='+ret);
    assert.equal(r.headers.get('location'),null);
    assert.equal(r.headers.get('set-cookie'),null);
    assert.equal(e.DB.flows.size,0);
  }
});

test('G1-B03: forged OAuth state/cookie and missing code are rejected before network or session issuance',async(t)=>{
  const e=environment(), hits=github(t);
  const flow=await begin(e);
  const malformed=[
    '/auth/callback?state='+flow.state+'&code=fake_code',
    '/auth/callback?state='+flow.state+'&code=fake_code',
    '/auth/callback?state='+flow.state,
    '/auth/callback?state=evil&code=fake_code',
    '/auth/callback?state='+flow.state+'%2F&code=fake_code',
  ];
  for (const [i,path] of malformed.entries()){
    const r=await handler.fetch(request(path,{headers:i===0?{}:{Cookie:i===1?'__Host-fish_p0_flow=wrong':flow.flowCookie}}),e);
    assert.equal(r.status,400,path);
  }
  assert.equal(hits.length,0);
  assert.equal(e.DB.sessions.size,0);
  assert.equal(e.DB.flows.size,1,'invalid callback must not consume a valid pending flow');
});

test('G1-B04: expired state and replay each fail before a second GitHub exchange',async(t)=>{
  const e=environment(),hits=github(t);
  const expired=await begin(e);
  e.DB.flows.values().next().value.expires_at=0;
  assert.equal((await callback(e,expired)).status,400);
  assert.equal(hits.length,0);
  const good=await begin(e,'/auth/start?return=%2Ffishing%2F');
  const ok=await callback(e,good);
  assert.equal(ok.status,303);
  assert.equal(ok.headers.get('location'),'/fishing/');
  assert.equal(hits.length,2);
  const replay=await callback(e,good);
  assert.equal(replay.status,400);
  assert.equal(hits.length,2);
  assert.equal(e.DB.sessions.size,1);
});

test('G1-B05: non-owner immutable GitHub ID never creates an authorized session',async(t)=>{
  const e=environment();github(t,9999);
  const flow=await begin(e);
  const denied=await callback(e,flow);
  assert.equal(denied.status,403);
  assert.equal(e.DB.sessions.size,0);
  assert.equal(denied.headers.getSetCookie().some(x=>x.startsWith('__Host-fish_p0_session=')),false);
  assert.deepEqual(await (await handler.fetch(request('/session'),e)).json(),{authenticated:false,authorized:false});
});

test('G1-B06: cross-origin, missing Origin, cross-site metadata and missing intent cannot sign out an owner',async(t)=>{
  const e=environment(),{sid}=await ownerSession(t,e);
  const rejected=[
    {Origin:'https://evil.example'},
    {Origin:''},
    {'Sec-Fetch-Site':'cross-site'},
    {'Sec-Fetch-Site':'same-site'},
    {'X-Fish-P0-Intent':''},
    {'X-Fish-P0-Intent':'write'},
  ];
  for (const alteration of rejected) {
    for(const path of ['/session/signout','/session/revoke-all']){
      const res=await handler.fetch(signedRequest(path,sid,alteration),e);
      assert.equal(res.status,403,JSON.stringify({path,alteration}));
      assert.equal(e.DB.sessions.size,1);
    }
  }
  const valid=await handler.fetch(signedRequest('/session/revoke-all',sid),e);
  assert.equal(valid.status,200);
  assert.equal(e.DB.sessions.size,0);
});

test('G1-B07: no write route exists even with a valid owner session and hostile body',async(t)=>{
  const e=environment(),{sid}=await ownerSession(t,e);
  const forbidden=[
    ['/publications','POST',404],['/publications/1','PATCH',404],['/api/publish','POST',404],
    ['/fishing/','POST',405],['/fishing/releases/current/content/Gear/gear.json','PUT',405],
    ['/fishing/sw.js','DELETE',405]
  ];
  for (const [path,method,expected] of forbidden) {
    const r=await handler.fetch(request(path,{method,headers:{Cookie:sid,Origin:ORIGIN,'X-Fish-P0-Intent':'write'},body:'{"repo":"another-user/private","path":"../secret"}'}),e);
    assert.equal(r.status,expected,path);
    assert.equal(r.headers.get('access-control-allow-origin'),null);
  }
  assert.equal(e.DB.sessions.size,1);
});

test('G1-B08: fail-closed malformed environment and unexpected host for session and gateway',async()=>{
  const e=environment();
  for(const pathname of ['/session','/fishing/release.json']){
    assert.equal((await handler.fetch(new Request('https://evil.example'+pathname),e)).status,421);
  }
  e.APP_ORIGIN='http://insecure.example';
  assert.equal((await handler.fetch(request('/session'),e)).status,503);
  e.APP_ORIGIN=ORIGIN;e.GITHUB_CLIENT_SECRET='';
  assert.equal((await handler.fetch(request('/session'),e)).status,503);
});

test('G1-B09: simulated GitHub failure produces no session and no token disclosure',async(t)=>{
  const e=environment();
  t.mock.method(globalThis,'fetch',async()=>Response.json({error:'internal oauth failure',secret:'not-a-real-token'},{status:502}));
  const flow=await begin(e);
  const failed=await callback(e,flow);
  assert.equal(failed.status,502);
  assert.equal(e.DB.sessions.size,0);
  const body=await failed.text();
  assert.doesNotMatch(body,/not-a-real-token|fake_code|fake-secret-only|code_verifier/);
  assert.equal(failed.headers.get('set-cookie'),null);
});

test('G1-B10: dashboard-style missing Fetch Metadata remains accepted with valid Origin and intent (hardening note)',async(t)=>{
  const e=environment(),{sid}=await ownerSession(t,e);
  // Source currently has (Sec-Fetch-Site || same-origin), so absence is NOT rejection.
  const headers={Cookie:sid,Origin:ORIGIN,'X-Fish-P0-Intent':'signout'};
  const response=await handler.fetch(request('/session/signout',{method:'POST',headers}),e);
  assert.equal(response.status,200);
  assert.equal(e.DB.sessions.size,0);
});

test('G1-B11: gateway refuses credential forwarding, reflective headers and unsafe redirects',async(t)=>{
  const e=environment();let upstreamCount=0;
  const mock=t.mock.method(globalThis,'fetch',async(_url,init)=>{
    upstreamCount++;
    assert.deepEqual(init.headers,{'Accept':'*/*','Accept-Encoding':'identity'});
    return new Response('public body',{status:200,headers:{'Content-Type':'text/plain','Set-Cookie':'private-secret=oops','Location':'https://evil.example','Access-Control-Allow-Origin':'*'}});
  });
  const r=await handler.fetch(request('/fishing/release.json',{headers:{Authorization:'Bearer secret',Cookie:'__Host-fish_p0_session=secret',Origin:'https://evil.example'}}),e);
  assert.equal(r.status,200);
  assert.equal(await r.text(),'public body');
  for(const field of ['Set-Cookie','Location','Access-Control-Allow-Origin'])assert.equal(r.headers.get(field),null);
  assert.equal(upstreamCount,1);
  const invalid=['/fishing/a%2Fb','/fishing/a%5Cb','/fishing/a%00b'];
  for(const path of invalid) {
    const blocked=await handler.fetch(request(path),e);
    assert.equal(blocked.status,400,path);
  }
  assert.equal(upstreamCount,1,'invalid paths must never contact Pages');
  mock.mock.mockImplementation(async()=>Response.redirect('https://evil.example/move',302));
  const redirect=await handler.fetch(request('/fishing/index.html'),e);
  assert.equal(redirect.status,502);
  assert.equal(redirect.headers.get('Location'),null);
});
