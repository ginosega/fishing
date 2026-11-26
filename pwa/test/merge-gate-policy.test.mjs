import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(
 new URL('../../.github/workflows/fishing-production.yml',import.meta.url),
 'utf8',
).replace(/\r\n?/g,'\n');

test('FISH118-CI01 required merge check fails closed if V3 fast checks fail',()=>{
 assert.match(workflow,/\n  pull_request:\s*\n/);
 assert.doesNotMatch(workflow,/\n  pull_request:\s*\n\s+paths:/);
 assert.match(workflow,/\n  merge-ready:\n    name: fishing-merge-ready\n/);
 assert.match(workflow,/always\(\) && github\.event_name == 'pull_request'/);
 assert.match(workflow,/needs: \[validate-fast\]/);
 assert.match(workflow,/FAST_RESULT: \$\{\{ needs\.validate-fast\.result \}\}/);
 assert.match(workflow,/\[\[ "\$FAST_RESULT" == 'success' \]\]/);
 assert.equal((workflow.match(/name: fishing-merge-ready/g)||[]).length,1);
});

test('FISH118-CI02 PRs run one fast suite; full browser acceptance is manual',()=>{
 assert.match(workflow,/\n  workflow_dispatch:\s*\n/);
 assert.match(workflow,/\n  validate-fast:\n    name: v3-fast-checks\n/);
 assert.match(workflow,/if: github\.event_name == 'pull_request'/);
 assert.match(workflow,/\n  validate-release:\n    name: v3-release-acceptance\n/);
 assert.match(workflow,/if: github\.event_name == 'workflow_dispatch'/);
 assert.equal((workflow.match(/npm test/g)||[]).length,2);
 assert.equal((workflow.match(/npm run build --/g)||[]).length,2);
 assert.match(workflow,/--out=dist-v3-check/);
 assert.match(workflow,/--out=dist-v3-acceptance/);
 assert.match(workflow,/--project=chromium/);
});

test('FISH118-CI03 no automatic V2 deploy, old content lane, or release on PR',()=>{
 assert.doesNotMatch(workflow,/\n  push:\s*\n/);
 assert.doesNotMatch(workflow,/\n  (?:deploy-full|deploy-content|validate-content|classify):\n/);
 assert.doesNotMatch(workflow,/v1-production\.zip|recovery\/v1-|deploy-d6-stage-a/);
 assert.match(workflow,/cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}/);
 assert.match(workflow,/github\.base_ref != 'governance\/project-ops'/);
 assert.match(workflow,/TARGET_BRANCH.*\n[\s\S]*'governance\/project-ops'/);
});

test('FISH118-CI04 no CI job changes provider or content state',()=>{
 assert.doesNotMatch(workflow,/\b(?:wrangler\s+(?:deploy|d1|secret)|gh\s+pr\s+(?:merge|create)|git\s+push|pages\s+deploy)\b/i);
 assert.doesNotMatch(workflow,/\n\s*environment: production/);
});
