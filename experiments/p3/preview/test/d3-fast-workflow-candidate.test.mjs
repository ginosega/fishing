import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const candidate=await fs.readFile(new URL('../design/fishing-production-fast-candidate.yml',import.meta.url),'utf8');
const baseline=await fs.readFile(new URL('../../../../.github/workflows/fishing-production.yml',import.meta.url),'utf8');
const section=(all,a,b)=>{
 const i=all.indexOf(a),j=b?all.indexOf(b,i+a.length):all.length;
 assert.ok(i>=0&&j>i,'missing section '+a);
 return all.slice(i,j);
};
const pr=section(candidate,'  pr-validate:\n','  classify:\n'),
      main=section(candidate,'  main-fast-content:\n');
test('P2-01 single read-only PR job preserves exact required check identity',()=>{
 assert.equal((candidate.match(/name: fishing-merge-ready/g)||[]).length,1);
 assert.match(pr,/if: github.event_name == 'pull_request'/);
 assert.match(pr,/permissions:\n      contents: read/);
 assert.doesNotMatch(pr,/pages:\s*write/);
 assert.doesNotMatch(pr,/id-token:\s*write/);
 assert.match(pr,/persist-credentials: false/);
});
test('P2-02 identical canonical build/verify and documentation coverage',()=>{
 assert.match(pr,/npm run build -- --base=\/fishing\/ --source-revision="\$SOURCE_REVISION"/);
 assert.match(pr,/npm run verify/);
 assert.match(pr,/git diff --check "\$PR_BASE_SHA"\.\.\.HEAD/);
 for(const command of ['npm audit --omit=dev --audit-level=high',
  'npm run test:browser','--pending-media','--base=/fishing/',
  'FISHING_V1_DIST: /tmp/v1-root','Validate core behavior and preview build',
  'Complete production browser and real v1 cutover acceptance']){
  assert.ok(baseline.includes(command),'baseline missing required '+command);
  assert.ok(pr.includes(command),'candidate drops required '+command);
 }
});
test('P2-03 full source-only PR never skips source classification',()=>{
 assert.match(pr,/git diff --name-only "\$base"\.\.\.HEAD/);
 assert.match(pr,/mode='docs'/);
 assert.match(pr,/mode='full'/);
 assert.match(pr,/mode='content'/);
});
test('P3-01 one main-only content build/deploy job with no build artifact transit',()=>{
 assert.match(main,/if: github.event_name == 'push' && github.ref == 'refs\/heads\/main'/);
 assert.match(main,/permissions:\n      contents: read\n      pages: write\n      id-token: write/);
 assert.match(main,/--source-revision="\$GITHUB_SHA"/);
 assert.match(main,/Guard exact current main/);
 assert.match(main,/actions\/deploy-pages@v4/);
 assert.match(main,/tools\/verify-hosted-fast.mjs/);
 assert.doesNotMatch(main,/actions\/download-artifact/);
 assert.doesNotMatch(main,/name: production-bundle-content/);
});
test('P3-02 full application release job and V1 rollback coverage preserved',()=>{
 for(const text of ['  validate-full:', '  deploy-full:',
  'Verify durable v1 recovery and prepare actual cutover fixture',
  'Install Chromium and WebKit',
  'Verify actual hosted production bytes and browser behavior']){
  assert.ok(candidate.includes(text),'full lane missing '+text);
 }
});
test('P3-03 no self-deadlocking duplicated Pages concurrency key',()=>{
 assert.equal((candidate.match(/group: fishing-pages\b/g)||[]).length,0);
 // Top-level group contains an expression yielding fishing-pages for main.
 assert.match(candidate,/fishing-pages/);
});
test('P2P3-04 no production workflow changed on active public branch',()=>{
 assert.match(baseline,/  merge-ready:/);
 assert.match(baseline,/  deploy-content:/);
 assert.doesNotMatch(baseline,/  main-fast-content:/);
 assert.match(candidate,/SOURCE-ONLY candidate/);
});

test('P2P3-05 parse candidate YAML with Ruby/Psych when available',t=>{
 const file=new URL('../design/fishing-production-fast-candidate.yml',import.meta.url).pathname;
 const result=spawnSync('ruby',['-e',
  "require 'yaml'; YAML.parse_file(ARGV[0]); puts 'valid YAML'",file],
  {encoding:'utf8',timeout:10000});
 if(result.error?.code==='ENOENT'){t.skip('Ruby YAML parser not installed locally');return;}
 assert.equal(result.status,0,(result.stderr||result.error?.message||'YAML parsing failed').slice(0,2000));
});
