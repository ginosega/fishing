import test from 'node:test';
import assert from 'node:assert/strict';
import {gatewayResponse} from '../gateway.mjs';
const ROOT = 'https://fishing-auth-p0-test.ginosega.workers.dev';
const req = (path, opts) => new Request(ROOT + path, opts);
const bytes = new Uint8Array([0, 33, 127, 128, 250, 255]);

test('forwards immutable-origin public bytes, query and nothing sensitive', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({url, init});
    return new Response(bytes, {status:200, headers:{
      'Content-Type':'image/png', 'Set-Cookie':'malicious=1',
      Location:'https://evil.example', 'Access-Control-Allow-Origin':'*',
      'Content-Encoding':'br', 'Content-Length':'6',
    }});
  });
  const out = await gatewayResponse(req('/fishing/releases/abc/images/My%20Photo.png?test=1', {
    headers:{Cookie:'__Host-fish_p0_session=confidential',Authorization:'Bearer secret',Origin:'https://evil.example'},
  }));
  assert.equal(out.status, 200);
  assert.equal(out.headers.get('Content-Type'), 'image/png');
  assert.equal(out.headers.get('Cache-Control'), 'no-store');
  assert.equal(out.headers.get('Set-Cookie'), null);
  assert.equal(out.headers.get('Location'), null);
  assert.equal(out.headers.get('Access-Control-Allow-Origin'), null);
  assert.equal(out.headers.get('Content-Encoding'), null);
  assert.equal(out.headers.get('Content-Length'), null);
  assert.deepEqual(new Uint8Array(await out.arrayBuffer()), bytes);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://ginosega.github.io/fishing/releases/abc/images/My%20Photo.png?test=1');
  assert.deepEqual(calls[0].init.headers, {'Accept':'*/*'});
  assert.equal(calls[0].init.redirect, 'manual');
  assert.equal(calls[0].init.method, 'GET');
});

test('HEAD metadata only, never returns a body or forwards credentials', async t => {
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url,'https://ginosega.github.io/fishing/release.json');
    assert.equal(init.method, 'HEAD');
    assert.deepEqual(init.headers, {'Accept':'*/*'});
    return new Response(null,{status:200,headers:{'Content-Type':'application/json','Set-Cookie':'s=secret'}});
  });
  const out = await gatewayResponse(req('/fishing/release.json',{method:'HEAD',headers:{Cookie:'abc'}}));
  assert.equal(out.status,200);
  assert.equal(out.body,null);
  assert.equal(out.headers.get('Content-Type'),'application/json');
  assert.equal(out.headers.get('Set-Cookie'),null);
});

test('rejects all write methods and tricky paths without contacting upstream', async t => {
  let count=0;
  t.mock.method(globalThis,'fetch',async()=>{count++;throw new Error('should not reach upstream')});
  for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS']) {
    const out=await gatewayResponse(req('/fishing/content/gear.json',{method}));
    assert.equal(out.status,405);
    assert.equal(out.headers.get('Allow'),'GET, HEAD');
  }
  for(const name of ['/fishing/a%2Fb','/fishing/a%5cb','/fishing/a%00b']) {
    const out=await gatewayResponse(req(name));
    assert.ok([400,404].includes(out?.status ?? 404), name);
  }
  assert.equal(count,0);
});

test('no open proxy, no auth endpoint shadowing, fixed trailing slash redirect', async t => {
  let count=0;
  t.mock.method(globalThis,'fetch',async()=>{count++;throw Error('no')});
  for(const path of ['/auth/callback','/auth/start','/session','/publications','/https://evil.example'])
    assert.equal(await gatewayResponse(req(path)),null);
  const out=await gatewayResponse(req('/fishing'));
  assert.equal(out.status,308);
  assert.equal(out.headers.get('Location'),'/fishing/');
  assert.equal(count,0);
});

test('does not follow external redirects or cache/stale serve upstream failures', async t => {
  t.mock.method(globalThis,'fetch',async()=>Response.redirect('https://evil.example/steal',302));
  const out=await gatewayResponse(req('/fishing/index.html'));
  assert.equal(out.status,502);
  assert.equal(out.headers.get('Location'),null);
});

test('handles missing upstream file and other upstream failures without reflecting sensitive headers', async t => {
  const mock=t.mock.method(globalThis,'fetch',async()=>new Response('private info',{status:404,headers:{'Set-Cookie':'s=1'}}));
  let out=await gatewayResponse(req('/fishing/no-such-file'));
  assert.equal(out.status,404);
  assert.equal(await out.text(),'Public file not found');
  assert.equal(out.headers.get('Set-Cookie'),null);
  mock.mock.mockImplementation(async()=>new Response('origin debug',{status:500}));
  out=await gatewayResponse(req('/fishing/index.html'));
  assert.equal(out.status,502);
  assert.equal(await out.text(),'Public gateway upstream error');
  mock.mock.mockImplementation(async()=>{throw new Error('origin stack trace')});
  out=await gatewayResponse(req('/fishing/index.html'));
  assert.equal(out.status,502);
  assert.equal(await out.text(),'Public gateway upstream unavailable');
});

test('there is no hidden auth, publishing, CORS or credential capability in the read-only proxy module', async () => {
  const nonGateway=await gatewayResponse(req('/session'));
  assert.equal(nonGateway,null);
  const disallowed=await gatewayResponse(req('/fishing/publications',{method:'POST'}));
  assert.equal(disallowed.status,405);
  assert.equal(disallowed.headers.get('Access-Control-Allow-Origin'),null);
});
