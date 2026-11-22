import assert from 'node:assert/strict';
import {test} from 'node:test';
import {prepareM01D1MediaPlan}
 from '../tools/d6-m01-d1-media-plan.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const reportFile=path.join(root,'migration','d6-historic-media-inventory.json.gz');
// The source inventory's portable archive is gzip; regenerate a temporary
// exact JSON report in memory rather than depending on a downloaded file.
import {prepareM01OriginalMediaInventory} from '../tools/d6-historic-media-inventory.mjs';
import {writeFile,mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
test('M01 D1 metadata plan is source-only and preserves shared references',async()=>{
 const folder=await mkdtemp(path.join(os.tmpdir(),'fish-m01-'));
 try{
  const report=await prepareM01OriginalMediaInventory();
  const file=path.join(folder,'inventory.json');
  await writeFile(file,JSON.stringify(report,null,2)+'\n');
  const plan=await prepareM01D1MediaPlan({reportFile:file});
  assert.equal(plan.expected.storedObjects,272);
  assert.equal(plan.expected.originalPaths,274);
  assert.equal(plan.expected.referencedPaths,265);
  assert.equal(plan.expected.unreferencedPaths,9);
  assert.ok(plan.expected.ownerAssociations>=265);
  assert.ok(plan.objectBatches.length>0);
  assert.ok(plan.referenceBatches.length>0);
  assert.match(plan.preflightSQL,/d6_catch_records/);
  assert.ok(plan.referenceBatches.every(s=>
   !/UPDATE|DELETE|DROP|REPLACE/.test(s)));
 }finally{await rm(folder,{recursive:true,force:true});}
});
