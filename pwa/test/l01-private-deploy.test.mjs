import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const script=read('../tools/d6-l01-private-deploy.ps1');
const pilot=JSON.parse(read('../wrangler.l01-private.jsonc'));
const o02=JSON.parse(read('../wrangler.o02-private.jsonc'));
const baseline=JSON.parse(read('../wrangler.direct-gear-private.jsonc'));

test('L01 source-pinned private deploy uses the same O02 host and bindings with the canonical build definition',()=>{
 for(const term of ["$ConfigFile='wrangler.l01-private.jsonc'",
  'git rev-parse HEAD','git status --porcelain',
  '--d6-standalone-v3','--d6-o03-offline-reading',
  '--d6-o02-offline-content','fishing-companion-software-v3',
  "'d6OfflineContentReading','standaloneV3'",
  '$null -ne $Manifest.counts','tools/verify.mjs','--dry-run',
  'd1 execute fishing-v3-wp3-operations-test --remote --json --command',
  'if(-not $Deploy)', 'L01 PRIVATE PREFLIGHT PASS',
  'L01 PRIVATE DEPLOYMENT SMOKE PASS',
  'Require-Equal $Remote.standaloneV3 $true']){
  assert.ok(script.includes(term),'Missing gated L01 step: '+term);
 }
 assert.ok(script.indexOf('if(-not $Deploy)')<
  script.lastIndexOf('deploy --config $ConfigFile'));
 assert.match(script, /Set-Location \(Split-Path -Parent \$PSScriptRoot\)/);
 assert.equal(pilot.name,'fishing-d6-wp2-test');
 assert.equal(pilot.routes,undefined);
 assert.equal(pilot.vars.D6_O02_OFFLINE_SNAPSHOT_ENABLED,'true');
 assert.equal(baseline.vars.D6_O02_OFFLINE_SNAPSHOT_ENABLED,undefined);
 assert.equal(pilot.keep_vars,true);
 const {D6_O02_OFFLINE_SNAPSHOT_ENABLED,...vars}=pilot.vars;
 const {define,...config}=pilot;
 assert.deepEqual(define,{__FISHING_D6_STANDALONE_V3__:'true'});
 assert.deepEqual(config,o02,'L01 changes only the compile-time define');
 assert.deepEqual({...config,vars},baseline,
  'no new Worker, binding, authority, R2 bucket or public route');
 assert.match(script,/Canonical D1 migration is not verified/);
 assert.match(script,/d6-normalized-id-ledger\.mjs/);
 assert.ok(script.indexOf('Canonical D1 migration is not verified')<script.lastIndexOf('deploy --config $ConfigFile'));
});

// Windows PowerShell 5.1 does not enumerate JSON array output by default.
// Keep the decode assignment distinct from array collection, and retain exact
// membership and count checks rather than treating a parse failure as PASS.
test('L01 canonical ID guard flattens the decoded array before checking membership',()=>{
 assert.match(script,/\$DecodedIds=ConvertFrom-Json -InputObject \(\[string\]\$D1\.\$idField\)/);
 assert.match(script,/\$ActualIds=@\(\$DecodedIds\)/);
 assert.match(script,/\$ActualIds\.Count -ne \[int\]\$D1\.\$domain/);
 assert.match(script,/\$ActualIds -cnotcontains \$_/);
 assert.match(script,/\$Missing\.Count -ne 0\)\{\$Normalized=\$false\}/);
 assert.doesNotMatch(script,/\$ActualIds=@\(ConvertFrom-Json/);
});
