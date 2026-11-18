import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readdir,readFile,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createD6Wp3H2AtomicJournal}
 from '../tools/d6-wp3-h2-atomic-journal.mjs';

const ID='123e4567-e89b-42d3-a456-426614174000';
const SHA='a'.repeat(40);
const KEY='h2-begin:'+ID+':tree';
const claim={
 mode:'step',operationId:ID,step:'tree',
 sourceRevision:SHA,approvalRef:'H2-20261118-AUTH-0001',
};
const done={
 mode:'step',operationId:ID,step:'tree',
 nextAction:'REQUEST_EXACT_STEP_APPROVAL',prNumber:null,
 checkpoint:{operationId:ID,sourceRevision:SHA,state:'AwaitingAuthorizedWrite',
  step:'branch',verifiedSteps:['tree']},
};
async function inTemp(fn){
 const dir=await mkdtemp(join(tmpdir(),'fish-h2-journal-'));
 try{return await fn(dir);}finally{await rm(dir,{force:true,recursive:true});}
}

test('WP3-H2J01 exclusive flushed claim prevents retry across controller restarts',async()=>{
 await inTemp(async dir=>{
  const a=createD6Wp3H2AtomicJournal({directory:dir});
  assert.equal(await a.claimOnce(KEY,claim),true);
  const b=createD6Wp3H2AtomicJournal({directory:dir});
  assert.equal(await b.claimOnce(KEY,claim),false);
  const files=await readdir(dir);
  assert.equal(files.filter(x=>x.endsWith('.claim.json')).length,1);
  const data=JSON.parse(await readFile(join(dir,files[0]),'utf8'));
  assert.deepEqual(data,claim);
 });
});

test('WP3-H2J02 completed proof stays separate and can never be overwritten',async()=>{
 await inTemp(async dir=>{
  const j=createD6Wp3H2AtomicJournal({directory:dir});
  assert.equal(await j.claimOnce(KEY,claim),true);
  assert.equal(await j.complete(KEY,done),true);
  await assert.rejects(j.complete(KEY,done),
   /refused input/);
  const files=await readdir(dir);
  assert.equal(files.filter(x=>x.endsWith('.claim.json')).length,1);
  assert.equal(files.filter(x=>x.endsWith('.complete.json')).length,1);
  const finish=files.find(x=>x.endsWith('.complete.json'));
  const payload=JSON.parse(await readFile(join(dir,finish),'utf8'));
  assert.equal(payload.nextAction,'REQUEST_EXACT_STEP_APPROVAL');
  assert.deepEqual(payload.checkpoint.verifiedSteps,['tree']);
 });
});

test('WP3-H2J03 secrets and extra fields are rejected before filesystem claim',async()=>{
 await inTemp(async dir=>{
  const j=createD6Wp3H2AtomicJournal({directory:dir});
  for(const bad of [
   {...claim,token:'private'},
   {...claim,cookie:'session=secret'},
   {...claim,approvalRef:'x'},
   {...claim,mode:'publish'},
   {...claim,sourceRevision:'not-sha'},
  ])await assert.rejects(j.claimOnce(KEY,bad),/refused input/);
  assert.deepEqual(await readdir(dir),[]);
 });
});

test('WP3-H2J04 malformed lifecycle completion fails without final audit artifact',async()=>{
 await inTemp(async dir=>{
  const j=createD6Wp3H2AtomicJournal({directory:dir});
  await j.claimOnce(KEY,claim);
  for(const bad of [
   {...done,token:'should-not-persist'},
   {...done,checkpoint:{...done.checkpoint,state:'Live'}},
   {...done,checkpoint:{...done.checkpoint,verifiedSteps:['branch']}},
   {...done,nextAction:'Live'},
   {...done,prNumber:-1},
  ])await assert.rejects(j.complete(KEY,bad),/refused input/);
  assert.equal((await readdir(dir)).length,1);
 });
});

test('WP3-H2J05 distinct phase keys do not alias; original key remains burned',async()=>{
 await inTemp(async dir=>{
  const j=createD6Wp3H2AtomicJournal({directory:dir});
  assert.equal(await j.claimOnce('h2-intake:WP3-H2-SYNTH-KB-001',{
   mode:'intake',operationId:null,step:null,
   sourceRevision:SHA,approvalRef:'H2-20261118-AUTH-0001',
  }),true);
  assert.equal(await j.claimOnce(KEY,claim),true);
  assert.equal(await j.claimOnce(KEY,claim),false);
  assert.equal((await readdir(dir)).length,2);
 });
});

test('WP3-H2J06 symbolic-link journal directory is rejected',async()=>{
 await inTemp(async dir=>{
  const target=join(dir,'real'),link=join(dir,'link');
  const journal=createD6Wp3H2AtomicJournal({directory:target});
  assert.equal(await journal.claimOnce(KEY,claim),true);
  await symlink(target,link,'dir');
  const linked=createD6Wp3H2AtomicJournal({directory:link});
  await assert.rejects(linked.claimOnce('h2-begin:'+ID+':branch',
   {...claim,step:'branch'}),/refused input/);
 });
});
