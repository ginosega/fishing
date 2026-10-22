import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../src/worker.mjs';

const ORIGIN = 'https://fishing-auth-p0.example.workers.dev';
class FakeDB {
  constructor() { this.flows = new Map(); this.sessions = new Map(); }
  prepare(sql) {
    const db = this;
    return {
      bind(...args) {
        return {
          async run() {
            if (sql.startsWith('INSERT INTO auth_flows')) db.flows.set(args[0], { code_verifier: args[1], expires_at: args[2] });
            else if (sql.startsWith('INSERT INTO sessions')) db.sessions.set(args[0], { github_id: args[1], expires_at: args[2] });
            else if (sql.startsWith('DELETE FROM sessions WHERE github_id')) {
              for (const [key, s] of db.sessions) if (String(s.github_id) === String(args[0])) db.sessions.delete(key);
            } else if (sql.startsWith('DELETE FROM sessions WHERE token_hash')) db.sessions.delete(args[0]);
            else throw new Error(`Unexpected DB run: ${sql}`);
            return { success: true };
          },
          async first() {
            if (sql.startsWith('DELETE FROM auth_flows')) {
              const record = db.flows.get(args[0]);
              if (record && record.expires_at > args[1]) {
                db.flows.delete(args[0]);
                return { code_verifier: record.code_verifier };
              }
              return null;
            }
            if (sql.startsWith('SELECT github_id')) {
              const record = db.sessions.get(args[0]);
              return record && record.expires_at > args[1] ? record : null;
            }
            throw new Error(`Unexpected DB first: ${sql}`);
          },
        };
      },
    };
  }
}
function env() {
  return { APP_ORIGIN: ORIGIN, OWNER_GITHUB_ID: '1111', GITHUB_CLIENT_ID: 'Iv1.placeholder',
    GITHUB_CLIENT_SECRET: 'test-secret-not-real', DB: new FakeDB() };
}
const req = (path, opts = {}) => new Request(ORIGIN + path, opts);
function cookieValue(res, name) {
  const c = res.headers.getSetCookie().find(v => v.startsWith(name + '='));
  assert.ok(c, `Cookie ${name} must exist`);
  return c.split(';')[0];
}
const mockGitHub = (t, id = 1111) => {
  let hits = 0;
  t.mock.method(globalThis, 'fetch', async (input, opts) => {
    hits++;
    const url = typeof input === 'string' ? input : input.url;
    if (url === 'https://github.com/login/oauth/access_token') {
      const body = JSON.parse(opts.body);
      assert.equal(body.client_secret, 'test-secret-not-real');
      assert.match(body.code_verifier, /^[A-Za-z0-9_-]{43}$/);
      assert.equal(body.redirect_uri, ORIGIN + '/auth/callback');
      return Response.json({ access_token: 'ghu_test_token_never_issued_to_client', token_type: 'bearer' });
    }
    if (url === 'https://api.github.com/user') {
      assert.equal(opts.headers.Authorization, 'Bearer ghu_test_token_never_issued_to_client');
      return Response.json({ id, login: id === 1111 ? 'owner' : 'someoneelse' });
    }
    throw new Error(`Unexpected outgoing fetch: ${url}`);
  });
  return () => hits;
};
async function startFlow(e) {
  const res = await handler.fetch(req('/auth/start'), e);
  assert.equal(res.status, 303);
  const u = new URL(res.headers.get('Location'));
  assert.equal(u.host, 'github.com');
  assert.equal(u.pathname, '/login/oauth/authorize');
  assert.equal(u.searchParams.get('code_challenge_method'), 'S256');
  assert.match(u.searchParams.get('code_challenge'), /^[A-Za-z0-9_-]{43}$/);
  assert.match(res.headers.getSetCookie().join(' '), /Secure; HttpOnly; SameSite=Lax/);
  return { state: u.searchParams.get('state'), flowCookie: cookieValue(res, '__Host-fish_p0_flow') };
}
async function callback(e, flow) {
  return handler.fetch(req('/auth/callback?state=' + flow.state + '&code=fake_one_time_code',
    { headers: { Cookie: flow.flowCookie } }), e);
}

test('anonymous session is read-only and no publishing endpoint exists', async () => {
  const e = env();
  const session = await handler.fetch(req('/session'), e);
  assert.deepEqual(await session.json(), { authenticated: false, authorized: false });
  assert.equal(session.headers.get('Access-Control-Allow-Origin'), null);
  assert.equal((await handler.fetch(req('/publications', { method: 'POST' }), e)).status, 404);
  const home = await handler.fetch(req('/'), e);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /manifest.webmanifest/);
  assert.match(home.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
});

test('owner OAuth callback is one-time and session persists until revoked', async (t) => {
  const e = env();
  const hits = mockGitHub(t);
  const flow = await startFlow(e);
  const res = await callback(e, flow);
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('Location'), '/');
  const sid = cookieValue(res, '__Host-fish_p0_session');
  assert.match(res.headers.getSetCookie().join(' '), /Max-Age=604800/);
  assert.deepEqual(await (await handler.fetch(req('/session', { headers: { Cookie: sid } }), e)).json(),
    { authenticated: true, authorized: true });
  assert.equal((await callback(e, flow)).status, 400, 'state replay rejected');
  assert.equal(hits(), 2, 'callback replay must not contact GitHub');
  const signout = await handler.fetch(req('/session/signout', { method: 'POST', headers: {
    Cookie: sid, Origin: ORIGIN, 'Sec-Fetch-Site': 'same-origin', 'X-Fish-P0-Intent': 'signout',
  } }), e);
  assert.equal(signout.status, 200);
  assert.deepEqual(await (await handler.fetch(req('/session', { headers: { Cookie: sid } }), e)).json(),
    { authenticated: false, authorized: false });
});

test('unauthorized GitHub account gets no session', async (t) => {
  const e = env();
  mockGitHub(t, 9999);
  const flow = await startFlow(e);
  const res = await callback(e, flow);
  assert.equal(res.status, 403);
  assert.ok(!res.headers.getSetCookie().some(v => v.startsWith('__Host-fish_p0_session=')));
  assert.equal(e.DB.sessions.size, 0);
});

test('OAuth state must match an initiating browser cookie and cannot be reused', async (t) => {
  const e = env();
  const hits = mockGitHub(t);
  const flow = await startFlow(e);
  assert.equal((await handler.fetch(req('/auth/callback?code=bogus&state=' + flow.state), e)).status, 400);
  assert.equal((await handler.fetch(req('/auth/callback?code=bogus&state=wrong', { headers: { Cookie: flow.flowCookie } }), e)).status, 400);
  assert.equal(hits(), 0);
  e.DB.flows.values().next().value.expires_at = 0;
  assert.equal((await callback(e, flow)).status, 400, 'expired state rejected');
  assert.equal(hits(), 0);
});

test('cross-origin or forged signout is rejected and revoke-all clears sessions', async (t) => {
  const e = env();
  mockGitHub(t);
  const flow = await startFlow(e);
  const sid = cookieValue(await callback(e, flow), '__Host-fish_p0_session');
  const wrong = await handler.fetch(req('/session/signout', { method: 'POST', headers: {
    Cookie: sid, Origin: 'https://malicious.example', 'X-Fish-P0-Intent': 'signout',
  } }), e);
  assert.equal(wrong.status, 403);
  assert.equal(e.DB.sessions.size, 1);
  const revoke = await handler.fetch(req('/session/revoke-all', { method: 'POST', headers: {
    Cookie: sid, Origin: ORIGIN, 'Sec-Fetch-Site': 'same-origin', 'X-Fish-P0-Intent': 'signout',
  } }), e);
  assert.equal(revoke.status, 200);
  assert.equal(e.DB.sessions.size, 0);
});

test('wrong host and malformed environment fail closed', async () => {
  const e = env();
  assert.equal((await handler.fetch(new Request('https://other.workers.dev/session'), e)).status, 421);
  e.APP_ORIGIN = 'http://not-https.example';
  assert.equal((await handler.fetch(req('/session'), e)).status, 503);
});

test('both source and dashboard-editor workers expose the manifest and icons under CSP', async () => {
  const editor = (await import('../cloudflare-editor-worker.js')).default;
  for (const handlerToTest of [handler, editor]) {
    const e = env();
    const home = await handlerToTest.fetch(req('/'), e);
    assert.equal(home.status, 200);
    const csp = home.headers.get('Content-Security-Policy');
    assert.match(csp, /default-src 'none'/);
    assert.match(csp, /manifest-src 'self'/);
    assert.match(csp, /img-src 'self'/);
    assert.match(csp, /script-src 'self'/);
    assert.match(await home.text(), /rel="manifest"/);
  }
  const e = env();
  const editorManifest = await editor.fetch(req('/manifest.webmanifest'), e);
  assert.equal(editorManifest.status, 200);
  assert.match(editorManifest.headers.get('Content-Type'), /application\/manifest\+json/);
  const manifest = await editorManifest.json();
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.some(icon => icon.sizes === '192x192'));
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512'));
  const sw = await editor.fetch(req('/sw.js'), e);
  assert.equal(sw.status, 200);
  assert.match(await sw.text(), /addEventListener\('fetch'/);
  for (const [size, path] of [[192, '/icon-192.png'], [512, '/icon-512.png']]) {
    const icon = await editor.fetch(req(path), e);
    assert.equal(icon.status, 200);
    assert.equal(icon.headers.get('Content-Type'), 'image/png');
    const bytes = new DataView(await icon.arrayBuffer());
    assert.equal(bytes.getUint32(16), size);
    assert.equal(bytes.getUint32(20), size);
  }
});

test('one-time OAuth state binds exact allowlisted gateway callback target', async (t) => {
  const e = env();
  const hits = mockGitHub(t);
  const bad = await handler.fetch(req('/auth/start?return=https%3A%2F%2Fevil.example'), e);
  assert.equal(bad.status, 400);
  assert.equal(e.DB.flows.size, 0);
  const unexpected = await handler.fetch(req('/auth/start?return=%2Ffishing%2F..%2Fauth'), e);
  assert.equal(unexpected.status, 400);
  const start = await handler.fetch(req('/auth/start?return=%2Ffishing%2F'), e);
  assert.equal(start.status, 303);
  const u = new URL(start.headers.get('Location'));
  const state = u.searchParams.get('state');
  assert.match(state, /^[A-Za-z0-9_-]{43}\\.f$/);
  const flowCookie = cookieValue(start, '__Host-fish_p0_flow');
  const cb = await handler.fetch(req('/auth/callback?state='+state+'&code=one_time_code',
    {headers:{Cookie:flowCookie}}),e);
  assert.equal(cb.status,303);
  assert.equal(cb.headers.get('Location'),'/fishing/');
  assert.equal(hits(),2);
  assert.equal((await handler.fetch(req('/auth/callback?state='+state+'&code=one_time_code',
    {headers:{Cookie:flowCookie}}),e)).status,400);
  assert.equal(hits(),2);
});

test('gateway stays read-only through both Worker entry points and strips browser credentials', async t => {
  const editor = (await import('../cloudflare-editor-worker.js')).default;
  const upstreamCalls=[];
  t.mock.method(globalThis,'fetch',async(url,init)=>{
    upstreamCalls.push({url,init});
    return new Response('untouched published bytes',{status:200,headers:{'Content-Type':'text/plain','Set-Cookie':'upstream=bad'}});
  });
  for(const impl of [handler,editor]){
    const e=env();
    const reqOptions={headers:{Cookie:'__Host-fish_p0_session=private',Authorization:'Bearer hidden'}};
    const resp=await impl.fetch(req('/fishing/release.json',reqOptions),e);
    assert.equal(resp.status,200);
    assert.equal(await resp.text(),'untouched published bytes');
    assert.equal(resp.headers.get('Set-Cookie'),null);
    assert.equal((await impl.fetch(req('/fishing/release.json',{method:'POST'}),e)).status,405);
    assert.equal((await impl.fetch(req('/publications',{method:'POST'}),e)).status,404);
  }
  assert.equal(upstreamCalls.length,2);
  for(const call of upstreamCalls){
    assert.equal(call.url,'https://ginosega.github.io/fishing/release.json');
    assert.deepEqual(call.init.headers,{'Accept':'*/*','Accept-Encoding':'identity'});
    assert.equal(call.init.redirect,'manual');
  }
});
