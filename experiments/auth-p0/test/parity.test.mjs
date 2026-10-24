import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import editor from '../cloudflare-editor-worker.js';

const read = name => readFileSync(new URL(name, import.meta.url));
const text = name => read(name).toString('utf8');
const ORIGIN = 'https://fishing-auth-p0.example.workers.dev';
const env = {APP_ORIGIN:ORIGIN, OWNER_GITHUB_ID:'1111', GITHUB_CLIENT_ID:'Iv1.test', GITHUB_CLIENT_SECRET:'test', DB:{}};

test('dashboard gateway implementation exactly matches the standalone gateway source', () => {
  const modular=text('../gateway.mjs').trimEnd().replace('export async function gatewayResponse(', 'async function gatewayResponse(');
  assert.ok(text('../cloudflare-editor-worker.js').includes(modular),
    'dashboard gateway differs from reviewed standalone gateway source');
});

test('dashboard authentication and session logic matches the modular Worker exactly', () => {
  const modular=text('../src/worker.mjs');
  const expected=modular.slice(modular.indexOf('const FLOW_COOKIE'));
  let dashboard=text('../cloudflare-editor-worker.js');
  dashboard=dashboard.slice(dashboard.indexOf('const FLOW_COOKIE'));
  const assetStart=dashboard.indexOf('// Self-contained dashboard-editor build:');
  const assetEnd=dashboard.indexOf('function withCookies(res, values)');
  assert.ok(assetStart>0 && assetEnd>assetStart);
  dashboard=dashboard.slice(0,assetStart)+dashboard.slice(assetEnd);
  const assetRoutes="      const staticAsset = p0Static(req, path);\n      if (staticAsset) return staticAsset;\n";
  assert.ok(dashboard.includes(assetRoutes));
  dashboard=dashboard.replace(assetRoutes,'');
  assert.equal(dashboard,expected,'dash editor owner auth logic has drifted from modular Worker');
});

test('dashboard inline manifest, service worker and icons match original test PWA assets byte-for-byte', async () => {
  for(const [path,orig] of [['/manifest.webmanifest','../public/manifest.webmanifest'],['/sw.js','../public/sw.js'],['/icon-192.png','../public/icon-192.png'],['/icon-512.png','../public/icon-512.png']]){
    const resp=await editor.fetch(new Request(ORIGIN+path),env);
    assert.equal(resp.status,200,path);
    assert.deepEqual(Buffer.from(await resp.arrayBuffer()),read(orig),path);
  }
});
