import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const script=read('../tools/d6-o03-private-deploy.ps1');
const prior=read('../tools/d6-o02-private-deploy.ps1');
const config=JSON.parse(read('../wrangler.o02-private.jsonc'));
const original=JSON.parse(read('../wrangler.direct-gear-private.jsonc'));

test('O03-DEPLOY01 source-pinned PowerShell script chooses its own working directory',()=>{
 assert.match(script,/Set-Location \(Split-Path -Parent \$PSScriptRoot\)/);
 assert.match(script,/\[ValidatePattern\('\^\[a-f0-9\]\{40\}\$'\)\]/);
 assert.match(script,/Require-Equal \$Head \$ExpectedRevision 'source revision'/);
 assert.match(script,/git status --porcelain --untracked-files=no/);
 assert.match(script,/-not \$Deploy/);
 assert.ok(script.indexOf('if(-not $Deploy)')<
  script.lastIndexOf('deploy --config $ConfigFile'));
 assert.match(script,/O03 PRIVATE PREFLIGHT PASS/);
 assert.match(script,/O03 PRIVATE DEPLOYMENT SMOKE PASS/);
});
test('O03-DEPLOY02 build and postflight demand O03 release identity',()=>{
 for(const term of ['--d6-o03-offline-reading','--d6-o02-offline-content',
  "'d6OfflineContentReading'",
  'Require-Equal $Remote.d6OfflineContentReading $true',
  'Require-Equal $Remote.sourceRevision $ExpectedRevision',
  'tools/verify.mjs',
  '--dry-run',
  "Require-Equal $SnapshotStatus 403",
  "Require-Equal $Status 403",
  'fishing-v3-wp3-operations-test --remote --json --command',
 ])assert.ok(script.includes(term),'Missing O03 private gate '+term);
 assert.match(script,/Require-Equal \$Manifest\.counts\.gear 100/);
 assert.match(script,/Require-Equal \$Manifest\.counts\.kb 60/);
 assert.match(script,/Require-Equal \$Manifest\.counts\.catches 12/);
 assert.doesNotMatch(script,/d1 migrations apply|r2 bucket (?:create|delete)|delete .*caches/i);
});
test('O03-DEPLOY03 reuse existing private O02 Worker only, no config mutation',()=>{
 assert.match(script,/\$ConfigFile='wrangler\.o02-private\.jsonc'/);
 assert.match(prior,/\$ConfigFile='wrangler\.o02-private\.jsonc'/);
 assert.doesNotMatch(prior,/--d6-o03-offline-reading/);
 assert.doesNotMatch(prior,/d6OfflineContentReading/);
 assert.equal(config.name,'fishing-d6-wp2-test');
 assert.equal(config.keep_vars,true);
 assert.equal(config.routes,undefined);
 assert.equal(config.vars.D6_O02_OFFLINE_SNAPSHOT_ENABLED,'true');
 const {D6_O02_OFFLINE_SNAPSHOT_ENABLED,...vars}=config.vars;
 assert.deepEqual({...config,vars},original);
});
test('O03-DEPLOY04 owner runbook never asks to cd into a working directory',()=>{
 const doc=read('../docs/O03_PRIVATE_DEPLOYMENT.md');
 assert.doesNotMatch(doc,/^\s*(?:cd|Set-Location)\b/m);
 assert.match(doc,/git -C \$Repo/);
 assert.match(doc,/Join-Path \$Repo 'pwa\\tools\\d6-o03-private-deploy\.ps1'/);
});
