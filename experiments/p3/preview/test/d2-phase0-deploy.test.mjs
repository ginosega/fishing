import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const template=readFileSync(new URL('../wrangler.d2-phase0.example.jsonc',import.meta.url),'utf8');
const script=readFileSync(new URL('../tools/prepare-d2-phase0.ps1',import.meta.url),'utf8');
test('D2-P0 production-origin first deployment is hard-off, without cron or App credentials',()=>{
 assert.match(template,/"name":\s*"fishing-auth-p0-test"/);
 assert.match(template,/"main":\s*"src\/d2-live-publisher-worker\.mjs"/);
 assert.match(template,/"keep_vars":\s*true/);
 assert.match(template,/"APP_ORIGIN":\s*"https:\/\/fishing-auth-p0-test\.ginosega\.workers\.dev"/);
 for(const flag of ['D2_WRITE_ENABLED','D2_RUNNER_ENABLED',
  'D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED']){
  assert.match(template,new RegExp('"'+flag+'":\\s*"false"'));
 }
 for(const binding of ['"binding": "DB"','"binding": "OPERATIONS_DB"']){
  assert(template.includes(binding));
 }
 assert.match(template,/"database_name":\s*"fishing-auth-p0"/);
 assert.match(template,/"database_name":\s*"fishing-p3-sandbox"/);
 assert(!template.includes('"triggers"'));
 for(const name of ['D2_GITHUB_APP_ID','D2_GITHUB_INSTALLATION_ID',
  'D2_GITHUB_APP_PRIVATE_KEY','GITHUB_CLIENT_SECRET','OWNER_GITHUB_ID']){
  assert(!new RegExp('"'+name+'"\\s*:').test(template),
   'Never reconfigure existing secrets or App grant via phase-0 plaintext vars');
 }
});
test('D2-P1 local preparer reads existing database IDs; cannot deploy or migrate',()=>{
 assert.match(script,/wrangler d1 list --json/);
 assert.match(script,/fishing-auth-p0/);
 assert.match(script,/fishing-p3-sandbox/);
 assert.match(script,/Replace\('REPLACE_EXISTING_AUTH_P0_D1_UUID'/);
 assert.match(script,/Replace\('REPLACE_EXISTING_MIGRATED_P3_D1_UUID'/);
 assert(!/\& npx wrangler (?:deploy|d1 migrations|d1 create|d1 execute)/.test(script));
});
