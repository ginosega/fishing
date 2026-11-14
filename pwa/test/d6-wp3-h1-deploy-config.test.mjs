import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {D6_WP3_H1_WORKER_ORIGIN} from '../server/d6-wp3-h1-read-only-worker.mjs';
import {D6_WP3_ISOLATED_PAGES_BASE}
 from '../server/d6-pages-path-gateway.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const filename=path.resolve(here,'../wrangler.wp3-h1.jsonc');
const config=async()=>JSON.parse(await fs.readFile(filename,'utf8'));
const flags=[
 'D6_WP3_RUNTIME_ENABLED','D6_WP3_WRITE_ENABLED',
 'D6_WP3_MOUNT_ENABLED','D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED',
];
test('WP3-H1DEPLOY01 deploy config pins only the dedicated origin, entry and two owned D1s',async()=>{
 const c=await config();
 assert.equal(c.name,'fishing-v3-wp3-test');
 assert.equal(c.main,'./server/d6-wp3-h1-read-only-worker.mjs');
 assert.equal(c.workers_dev,true);
 assert.equal(c.vars.D6_ORIGIN,D6_WP3_H1_WORKER_ORIGIN);
 assert.equal(c.vars.D6_OWNER_GITHUB_ID,'265665562');
 assert.equal(c.vars.D6_REPOSITORY_ID,'1350909744');
 assert.equal(D6_WP3_ISOLATED_PAGES_BASE,'https://fishing-v3-wp3-test.pages.dev/fishing/');
 assert.deepEqual(c.d1_databases,[
  {binding:'AUTH_DB',database_name:'fishing-v3-wp3-auth-test',
   database_id:'0d8da698-87b8-4b5e-a1e7-fe6de49e5afc'},
  {binding:'WP3_DB',database_name:'fishing-v3-wp3-operations-test',
   database_id:'5a47841e-7874-4ec8-9fa8-be0315f6a802'},
 ]);
 for(const name of ['routes','route','triggers','services','assets','kv_namespaces','r2_buckets'])
  assert.equal(c[name],undefined,'forbid unrelated worker resources: '+name);
});
test('WP3-H1DEPLOY02 no issuer secrets or credentials in config, all writer controls off',async()=>{
 const c=await config();
 for(const k of flags)assert.equal(c.vars[k],'false');
 for(const k of ['D6_SESSION_ENABLED','D6_OAUTH_ENABLED','D6_SOURCE_ENABLED',
  'D6_READ_TOKEN_ENABLED','D6_SIGNER_ENABLED','D6_SIGNOUT_ENABLED',
  'D6_HOSTED_PREFLIGHT_ENABLED'])assert.equal(c.vars[k],'false');
 for(const k of ['D6_WP3_H1_READ_ONLY_ENABLED','D6_PRODUCTION_ENABLED',
  'D6_GATEWAY_ENABLED','D6_WP3_ISOLATED_READ_ENABLED',
  'D6_WP3_ISOLATED_PAGES_ENABLED','D6_WP3_READ_PROFILE_ENABLED',
  'D6_STATIC_ENABLED'])assert.equal(c.vars[k],'true');
 for(const k of ['D6_WP2_STAGING_ENABLED','D6_ISOLATED_PAGES_ENABLED'])
  assert.equal(c.vars[k],'false');
 const raw=JSON.stringify(c);
 for(const term of ['PRIVATE_KEY','OAUTH_CLIENT_SECRET','CSRF_KEY',
  'MEDIA_TICKET_SECRET','authorization','access_token','contents:write',
  'pull_requests:write'])assert(!raw.includes(term),'config has forbidden secret or write scope: '+term);
});
test('WP3-H1DEPLOY03 reject missing or swapped pins in checked config contract',async()=>{
 const c=await config();
 assert.equal(c.d1_databases.length,2);
 assert.equal(Object.keys(c.vars).length,22);
 const src=await fs.readFile(path.resolve(here,
  '../server/d6-wp3-h1-read-only-worker.mjs'),'utf8');
 assert(!/import [^\n]*(?:step-writer|publisher|write-token|write-composition)/i.test(src));
 assert.match(src,/writeFlags\.every\(name=>env\[name\]!=='true'\)/);
 assert.match(src,/if\(writePath\(url.pathname\)\)return missing\(\)/);
});
