import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const script=read('../tools/d6-l01-private-deploy.ps1');
const pilot=JSON.parse(read('../wrangler.l01-private.jsonc'));
test('A01 private deployment pins source, verified software, bindings and owner approval',()=>{
 for(const term of ["$ConfigFile='wrangler.l01-private.jsonc'",
  'git rev-parse HEAD','git status --porcelain',
  'tools/build.mjs','--source-revision=$ExpectedRevision',
  'fishing-companion-software-v3','tools/verify.mjs','--dry-run',
  'd1 execute fishing-v3-wp3-operations-test --remote --json --command',
  'if(-not $Deploy)','Require-Equal $Remote.standaloneV3 $true',
  'd6-normalized-id-ledger.mjs','Canonical D1 migration is not verified']){
  assert.ok(script.includes(term),'Missing guarded step: '+term);
 }
 assert.doesNotMatch(script,/--d6-(?:reader-candidate|standalone-v3)/);
 assert.ok(script.indexOf('if(-not $Deploy)')<script.lastIndexOf('deploy --config $ConfigFile'));
 assert.match(script,/Set-Location \(Split-Path -Parent \$PSScriptRoot\)/);
 assert.equal(pilot.name,'fishing-d6-wp2-test');
 assert.equal(pilot.routes,undefined);
 assert.equal(pilot.vars.D6_O02_OFFLINE_SNAPSHOT_ENABLED,'true');
 assert.deepEqual(pilot.define,{__FISHING_D6_STANDALONE_V3__:'true'});
 assert.equal(pilot.keep_vars,true);
});
test('A01 canonical ID guard flattens the decoded array before checking membership',()=>{
 assert.match(script,/\$DecodedIds=ConvertFrom-Json -InputObject \(\[string\]\$D1\.\$idField\)/);
 assert.match(script,/\$ActualIds=@\(\$DecodedIds\)/);
 assert.match(script,/\$ActualIds\.Count -ne \[int\]\$D1\.\$domain/);
 assert.match(script,/\$ActualIds -cnotcontains \$_/);
 assert.match(script,/\$Missing\.Count -ne 0\)\{\$Normalized=\$false\}/);
 assert.doesNotMatch(script,/\$ActualIds=@\(ConvertFrom-Json/);
});

test('A01 production and temporary acceptance bind exactly the same retained resources',()=>{
 const prod=JSON.parse(read('../wrangler.jsonc'));
 assert.equal(prod.name,'fishing');
 assert.equal(prod.vars.D6_ORIGIN,'https://fishing.ginosega.workers.dev');
 assert.equal(prod.keep_vars,false);
 assert.deepEqual(prod.secrets.required,['D6_CSRF_KEY','D6_OAUTH_CLIENT_SECRET','D6_OAUTH_CLIENT_ID']);
 const normalized={...prod,name:pilot.name,vars:{...prod.vars,D6_ORIGIN:pilot.vars.D6_ORIGIN},keep_vars:pilot.keep_vars,secrets:pilot.secrets};
 assert.deepEqual(normalized,pilot);
 assert.deepEqual(prod.assets.run_worker_first,['/api/*','/auth/*','/session','/session/signout']);
 for(const name of ['D6_GATEWAY_ENABLED','D6_REPOSITORY_ID','D6_WP2_STAGING_ENABLED','D6_ISOLATED_PAGES_ENABLED','D6_STATIC_ENABLED','D6_SOURCE_ENABLED','D6_READ_TOKEN_ENABLED','D6_SIGNER_ENABLED','D6_HOSTED_PREFLIGHT_ENABLED'])
  assert.equal(prod.vars[name],undefined);
 assert.equal(prod.routes,undefined);
});
