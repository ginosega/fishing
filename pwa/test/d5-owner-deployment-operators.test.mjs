import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const pages=readFileSync(new URL('../../experiments/p3/preview/tools/update-d5-owner-pages-private.ps1',import.meta.url),'utf8');
const worker=readFileSync(new URL('../../experiments/p3/preview/tools/update-d5-owner-worker-private.ps1',import.meta.url),'utf8');

function ordered(source,fragments){
 let n=-1;
 for(const fragment of fragments){
  const next=source.indexOf(fragment,n+1);
  assert(next>n,`Missing/out-of-order safeguard: ${fragment}`);
  n=next;
 }
}
test('D5-UPDATE01 Pages updates existing isolated project only, never creates new project or deploys by default',()=>{
 assert.match(pages,/\[switch\]\$Deploy/);
 assert.match(pages,/if\(\$Deploy\)/);
 assert.match(pages,/if\(\$Deploy\)\s*\{\s*Need \(-not \(Test-Path -LiteralPath \$marker\)\)/);
 assert.doesNotMatch(pages,/pages project create|pages project delete|workers deploy/i);
 assert.match(pages,/wrangler@4\.153\.0 pages deploy \$site/);
 assert.match(pages,/--branch=d5-owner-test/);
 assert.match(pages,/--commit-hash=\$ExpectedHead/);
 assert.match(pages,/ExpectedNewRelease -ceq \$ptr\.id/);
 assert.match(pages,/IO\.File\]::Open\(\$marker,\[IO\.FileMode\]::CreateNew/);
 ordered(pages,['if($Deploy){','ProofBaseline','[IO.File]::Open($marker','pages deploy $site']);
});
test('D5-UPDATE02 Pages requires exact-head push CI, prior immutable release and public V2 identity',()=>{
 for(const key of ['ExpectedHead','ExpectedCiRun','ExpectedPreviousRelease','PreviousPagesOrigin','ExpectedWorkerVersion','ExpectedPublicV2Digest'])
  assert(pages.includes('$'+key),key);
 for(const key of ['git rev-parse HEAD','git ls-remote origin','git status --porcelain','ci.head_sha','ci.head_branch','ci.conclusion'])
  assert(pages.includes(key),key);
 assert.match(pages,/VerifyPointer|GetText \(\$PreviousPagesOrigin\+\$scope\+'release\.json'\)/);
 assert.match(pages,/HOSTED_SAMPLE_HASHES:/);
 assert.match(pages,/ProofBaseline\s*\n\s*Write-Output/);
 assert.match(pages,/outcome UNKNOWN; inspect remote project/);
});
test('D5-UPDATE03 Worker preserves last private configuration, pilot bytes and D1 bindings',()=>{
 assert.match(worker,/\[switch\]\$Deploy/);
 assert.match(worker,/if\(-not \$Deploy\)\{/);
 assert.match(worker,/NewPagesOrigin/);
 assert.match(worker,/PreviousConfig/);
 assert.match(worker,/PreviousGeneratedDir/);
 assert.match(worker,/\$new=\$source\.Replace\(\$matches\[0\]\.Value,\$newText\)/);
 assert.match(worker,/Unexpected config mutation/);
 assert.match(worker,/D3_PILOT_SHA256/);
 assert.match(worker,/D3_PILOT_CSS_SHA256/);
 assert.match(worker,/Missing preserved pilot artifact/);
 assert.match(worker,/D1 bindings differ/);
 assert.match(worker,/Private secret found in config/);
 assert.match(worker,/git check-ignore -q/);
 assert.match(worker,/wrangler@4\.153\.0 deploy --dry-run/);
});
test('D5-UPDATE04 Worker deploy is one-attempt, version-locked and proves bootstrap/CSP pairing',()=>{
 assert.match(worker,/Worker deploy attempt exists; reconcile remotely before retry/);
 assert.match(worker,/IO\.File\]::Open\(\$marker,\[IO\.FileMode\]::CreateNew/);
 assert.match(worker,/PrivateProof/);
 assert.match(worker,/Public V2 changed: stop/);
 assert.match(worker,/bootstrapHash/);
 assert.match(worker,/Content-Security-Policy/);
 assert.match(worker,/Worker HTML differs from immutable Pages/);
 assert.match(worker,/Old immutable Pages release altered/);
 assert.match(worker,/No distinct Worker version; reconcile before retry/);
 ordered(worker,["if(-not $Deploy){","}else{","[IO.File]::Open($marker","wrangler@4.153.0 deploy --config"]);
 assert.doesNotMatch(worker,/wrangler@4\.153\.0 d1 execute|secret put|pages deploy|caches\.delete|deleteDatabase/);
});
