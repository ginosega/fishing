import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const path=new URL('../fixtures/publishing-stage-baseline-2026-10.json',import.meta.url);
const {postMerge,prToHosted,privateSandbox}=JSON.parse(await fs.readFile(path,'utf8'));
const mid=v=>{
 const sorted=[...v].sort((a,b)=>a-b),n=sorted.length;
 return n%2?sorted[(n-1)/2]:(sorted[n/2-1]+sorted[n/2])/2;
};
test('BASE-01 all nine public release total seconds reproduce non-overlapping intervals',()=>{
 assert.equal(postMerge.length,9);
 for(const x of postMerge){
  assert.equal(x.queue+x.classify+x.classificationHandoff+
   x.validateJob+x.validationHandoff+x.deployToProof,x.total);
  assert.ok(x.buildStep<=x.validateJob);
  assert.ok(x.deployPages+x.hostVerify<=x.deployToProof);
 }
 assert.equal(mid(postMerge.map(x=>x.total)),100);
 assert.equal(Math.min(...postMerge.map(x=>x.total)),85);
 assert.equal(Math.max(...postMerge.map(x=>x.total)),183);
 assert.equal(postMerge.filter(x=>x.total<=60).length,0);
});
test('BASE-02 PR cohort must exclude 3 direct push samples',()=>{
 assert.equal(postMerge.filter(x=>x.pr===null).length,3);
 assert.deepEqual(postMerge.map(x=>x.pr).filter(Boolean).sort((a,b)=>a-b),
  prToHosted.map(x=>x.pr).sort((a,b)=>a-b));
 for(const x of prToHosted){
  assert.equal(x.ciComplete+x.ciToMerge+x.mergeToHosted,x.total);
 }
 assert.equal(mid(prToHosted.map(x=>x.total)),180);
 assert.equal(mid(prToHosted.map(x=>x.ciComplete)),47);
 assert.equal(mid(prToHosted.map(x=>x.ciToMerge)),15);
 assert.equal(mid(prToHosted.map(x=>x.ciComplete+x.ciToMerge)),65);
});
test('BASE-03 actual Pages deploy action is not the 48s overall job',()=>{
 assert.equal(mid(postMerge.map(x=>x.deployPages)),13);
 assert.equal(mid(postMerge.map(x=>x.deployToProof)),48);
 assert.equal(mid(postMerge.map(x=>x.validateJob)),32);
 assert.equal(mid(postMerge.map(x=>x.hostVerify)),10);
});
test('BASE-04 private sandbox cannot be merged into public baseline',()=>{
 assert.equal(privateSandbox.length,2);
 for(const x of privateSandbox){
  assert.equal(x.notPublic,true);
  assert.equal(x.createdToCiComplete+x.ciCompleteToMerge,x.createdToMerge);
 }
});
test('BASE-05 every production PR already uses more than 60 sec pre-public',()=>{
 assert.ok(prToHosted.every(x=>x.total>60));
 assert.ok(prToHosted.every(x=>x.ciComplete+x.ciToMerge>=58));
});
