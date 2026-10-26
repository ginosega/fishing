import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const template=readFileSync(new URL('../wrangler.d2-phase0.example.jsonc',import.meta.url),'utf8');
const script=readFileSync(new URL('../tools/prepare-d2-phase0.ps1',import.meta.url),'utf8');
const reconcile=readFileSync(new URL('../tools/reconcile-d2-phase0.ps1',import.meta.url),'utf8');
const activation=readFileSync(new URL('../wrangler.d2-production-origin.example.jsonc',import.meta.url),'utf8');
test('D2-P0 production-origin first deployment is hard-off, without cron or App credentials',()=>{
 assert.match(template,/"name":\s*"fishing-auth-p0-test"/);
 assert.match(template,/"main":\s*"src\/d2-live-publisher-worker\.mjs"/);
 assert.match(template,/"keep_vars":\s*true/);
 assert.match(template,/"preview_urls":\s*false/);
 assert.match(template,/"observability":\s*\{\s*"enabled":\s*true,\s*"logs":\s*\{\s*"enabled":\s*true/);
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
 for(const name of ['GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET','OWNER_GITHUB_ID',
  'D2_CSRF_KEY','D2_HOST_PROBE_KEY']){
  assert(template.includes('"'+name+'"'),
   'Phase-0 must fail deploy without its required encrypted secret');
 }
 assert.match(template,/"secrets":\s*\{\s*"required":\s*\[/);
 for(const name of ['D2_GITHUB_APP_ID','D2_GITHUB_INSTALLATION_ID',
  'D2_GITHUB_APP_PRIVATE_KEY','GITHUB_CLIENT_SECRET','OWNER_GITHUB_ID']){
  assert(!new RegExp('"'+name+'"\\s*:').test(template),
   'Never reconfigure existing secrets or App grant via phase-0 plaintext vars');
 }
});
test('D2-P1 local preparer reads existing database IDs; cannot deploy or migrate',()=>{
 assert.match(script,/npx\.cmd wrangler d1 list --json/);
 assert.match(script,/\$parsed \| ForEach-Object/);
 assert.match(script,/Get-UniqueDatabaseUuid -items \$databaseEntries -databaseName/);
 assert.match(script,/\$rawJson = \$raw -join \[Environment\]::NewLine/);
 assert.match(script,/ConvertFrom-Json -InputObject \$rawJson/);
 assert(!/\$raw\s*\|\s*ConvertFrom-Json/.test(script));
 assert.match(script,/fishing-auth-p0/);
 assert.match(script,/fishing-p3-sandbox/);
 assert.match(script,/Replace\('REPLACE_EXISTING_AUTH_P0_D1_UUID'/);
 assert.match(script,/Replace\('REPLACE_EXISTING_MIGRATED_P3_D1_UUID'/);
 assert(!/\& npx wrangler (?:deploy|d1 migrations|d1 create|d1 execute)/.test(script));
});

test('D2-P2 local reconciliation retains exact database UUIDs and leaves secrets untouched',()=>{
 assert.match(reconcile,/Get-ExistingDatabaseId \$old 'DB' 'fishing-auth-p0'/);
 assert.match(reconcile,/Get-ExistingDatabaseId \$old 'OPERATIONS_DB' 'fishing-p3-sandbox'/);
 assert.match(reconcile,/\$bindingMatches = \[regex\]::Matches/);
 assert.match(reconcile,/\$new = \$template\.Replace\('REPLACE_EXISTING_AUTH_P0_D1_UUID'/);
 assert.match(reconcile,/\$new = \$new\.Replace\('REPLACE_EXISTING_MIGRATED_P3_D1_UUID'/);
 for(const flag of ['D2_WRITE_ENABLED','D2_RUNNER_ENABLED',
  'D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED']){
  assert(reconcile.includes(flag));
 }
 assert.match(reconcile,/Secret \$name is configured as plaintext/);
 assert.match(reconcile,/No network calls, migrations, secrets, or Cloudflare deployment/);
 // Printed NEXT instructions are harmless; actual executable commands are not.
 assert(!/^\s*(?:&\s*)?(?:npx(?:\.cmd)?\s+)?wrangler\s+(?:deploy|secret|d1\s+execute)/im.test(reconcile));
 assert(!/^\s*(?:&\s*)?(?:Invoke-WebRequest|Invoke-RestMethod|curl|git)\s/im.test(reconcile));
});

test('D2-P3 activation template is still hard-off, secret-required, and ready for public-origin host proof',()=>{
 assert.match(activation,/"name":\s*"fishing-auth-p0-test"/);
 assert.match(activation,/"compatibility_flags":\s*\[\s*"global_fetch_strictly_public"\s*\]/);
 assert.match(activation,/"preview_urls":\s*false/);
 assert.match(activation,/"observability":\s*\{\s*"enabled":\s*true/);
 assert.match(activation,/"keep_vars":\s*true/);
 assert.match(activation,/"triggers":\s*\{\s*"crons":\s*\[\s*"\*\/5 \* \* \* \*"/);
 assert.match(activation,/"secrets":\s*\{\s*"required":\s*\[/);
 assert(activation.includes('"D2_GITHUB_APP_PRIVATE_KEY"'));
 for(const flag of ['D2_WRITE_ENABLED','D2_RUNNER_ENABLED',
   'D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED']){
   assert.match(activation,new RegExp('"'+flag+'":\\s*"false"'));
 }
 assert(activation.includes('1430581407'));
 assert(!activation.includes('P3_GITHUB_PRIVATE_KEY":'));
});
