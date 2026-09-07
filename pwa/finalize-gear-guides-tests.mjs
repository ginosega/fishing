import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const edit=async(file,fn)=>fs.writeFile(file,fn(await fs.readFile(file,'utf8')));
const rep=(s,a,b)=>{assert.ok(s.includes(a),`Missing expected source: ${a.slice(0,100)}`);return s.replace(a,b);};
await edit('pwa/my-gear-routing.test.mjs',source=>{
  source=rep(source,'fill="#76c8ef"[\\s\\S]*fill="#a9afb2"|fill="#a9afb2"[\\s\\S]*fill="#76c8ef"','stop-color="#76c8ef"[\\s\\S]*fill="#a9afb2"|fill="#a9afb2"[\\s\\S]*stop-color="#76c8ef"');
  source=rep(source,"assert.match(gearApp, /pwa\\/gear-content\\/\\$\\{id\\}\\.md/", "assert.match(gearApp, /pwa\\/gear-content\\/\\$\\{id\\}\\.md/");
  source=rep(source,"assert.match(gearApp, /fishing-companion-gear-change-v1/", "assert.match(gearApp, /name=\"gearPictureAction\" value=\"keep\" checked/);\nassert.match(gearApp, /name=\"gearPictureAction\" value=\"replace\"/);\nassert.match(gearApp, /sourcePath/);\nassert.match(gearApp, /fishing-companion-gear-change-v1/");
  return source;
});
await edit('Fishing_TODO.md',source=>{
  const row=source.split('\n').find(line=>line.startsWith('| FISH-TODO-058 |'));
  assert.ok(row);
  source=source.replace(row+'\n','');
  const header='| ID | Completed | Area | Resolution |\n|---|---|---|---|';
  source=rep(source,header,header+'\n'+row);
  return source;
});
await edit('.github/workflows/fishing-pwa-build.yml',source=>{
  source=rep(source,'          node --check pwa/apply-local-media.mjs','          node --check pwa/apply-local-media.mjs\n          node --check pwa/image-validation.mjs\n          node --check pwa/verify-final-bundle.mjs');
  source=rep(source,'      - name: Test unified Knowledge Base model','      - name: Test Gear Notes and picture replacement policy\n        run: node pwa/gear-media-policy.test.mjs\n      - name: Test unified Knowledge Base model');
  source=rep(source,'      - name: Verify bundle\n','      - name: Validate final transformed data and assets\n        run: node pwa/verify-final-bundle.mjs\n      - name: Verify bundle\n');
  source=source.replaceAll('2026-09-06-my-gear-v3-bonafide-rvr119-1','2026-09-06-my-gear-v4-ordered-links-1');
  return source;
});
console.log('Final release regression and workflow updates applied.');
