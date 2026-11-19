import test from 'node:test';
import assert from 'node:assert/strict';
import {makeD6H2OffCommand,createD6H2OffRestoration,D6H2OffError}
 from '../tools/d6-wp3-h2-off-restoration.mjs';

const OFF='b552efc6-a24c-4ca1-ab6c-b88a68c99ff0';
const ON='11a3a0c1-1518-45d6-8541-70012b0dac4f';
const WORKER='fishing-v3-wp3-test';
const version=v=>({verified:true,workerName:WORKER,version:v,traffic:100});
const denial=(code)=>Object.assign(new Error('no detail'),{code});
const opts=({approved=true,alreadyOff=false,commandStatus=0,
 readbackGood=true,unknown=false}={})=>{
 const events=[];let attempts=0;
 const adapter=createD6H2OffRestoration({
  async authorizeOff(x){
   events.push('grant');
   assert.equal(x.workerName,WORKER);
   return {approved,scope:'h2-safety-off-only',
    offVersion:x.offVersion,workerName:WORKER};
  },
  async readDeployment({expectedVersion}){
   events.push('read');
   assert.equal(expectedVersion,OFF);
   if(unknown)throw denial('NETWORK_UNAVAILABLE');
   attempts++;
   if(!alreadyOff&&attempts===1)throw denial('VERSION_MISMATCH');
   if(!readbackGood)throw denial('VERSION_MISMATCH');
   return version(OFF);
  },
  async runWrangler(call){
   events.push('off');
   assert.equal(call.shell,false);
   assert.equal(call.expectedWorker,WORKER);
   assert.equal(call.executable,'wrangler');
   assert.deepEqual(call.args,
    ['versions','deploy',OFF+'@100','--name',WORKER,'--yes',
     '--message','WP3 H2 approved safety OFF restoration']);
   return {exitCode:commandStatus};
  },
 });
 return {adapter,events};
};

test('WP3-H2OFF01 only one exact version can be restored at 100 percent',()=>{
 const x=makeD6H2OffCommand({offVersion:OFF});
 assert.equal(x.executable,'wrangler');
 assert.deepEqual(x.args.slice(0,5),[
  'versions','deploy',OFF+'@100','--name',WORKER]);
 assert.equal(Object.isFrozen(x),true);
 assert.equal(Object.isFrozen(x.args),true);
 for(const v of ['anything','',ON+' --name other',null])
  assert.throws(()=>makeD6H2OffCommand({offVersion:v}),
   D6H2OffError);
});

test('WP3-H2OFF02 already OFF requires readback only, no provider write',async()=>{
 const h=opts({alreadyOff:true});
 const r=await h.adapter.restore({offVersion:OFF,reason:'deadline'});
 assert.equal(r.version,OFF);
 assert.equal(r.restorationExecuted,false);
 assert.deepEqual(h.events,['grant','read']);
});

test('WP3-H2OFF03 authorized ON -> exactly one OFF -> independent readback',async()=>{
 const h=opts();
 const r=await h.adapter.restore({offVersion:OFF,reason:'phase-abort'});
 assert.equal(r.verified,true);
 assert.equal(r.restorationExecuted,true);
 assert.equal(r.traffic,100);
 assert.deepEqual(h.events,['grant','read','off','read']);
});

test('WP3-H2OFF04 no owner OFF authority never queries provider or writes',async()=>{
 const h=opts({approved:false});
 await assert.rejects(h.adapter.restore({
  offVersion:OFF,reason:'deadline',
 }),e=>e instanceof D6H2OffError&&e.code==='OFF_NOT_AUTHORIZED');
 assert.deepEqual(h.events,['grant']);
});

test('WP3-H2OFF05 unknown prior traffic or provider error blocks rollback',async()=>{
 const h=opts({unknown:true});
 await assert.rejects(h.adapter.restore({
  offVersion:OFF,reason:'phase-complete',
 }),e=>e.code==='PREFLIGHT_UNAVAILABLE');
 assert.deepEqual(h.events,['grant','read']);
});

test('WP3-H2OFF06 uncertain CLI return does not claim OFF even after success exit',async()=>{
 for(const h of [opts({commandStatus:1}),opts({readbackGood:false})]){
  await assert.rejects(h.adapter.restore({
   offVersion:OFF,reason:'deadline',
  }),D6H2OffError);
  assert.equal(h.events.filter(x=>x==='off').length,1);
 }
});

test('WP3-H2OFF07 no arbitrary target or mode can invoke command',async()=>{
 const h=opts();
 for(const req of [
  {offVersion:ON,reason:'deploy'},
  {offVersion:'bad',reason:'deadline'},
  {offVersion:OFF,reason:'publish'},
  {offVersion:OFF},
 ])await assert.rejects(h.adapter.restore(req),D6H2OffError);
 assert.deepEqual(h.events,[]);
});

test('WP3-H2OFF08 missing real adapters cannot accidentally enable OFF command',()=>{
 assert.throws(()=>createD6H2OffRestoration({
  readDeployment:()=>version(OFF),
 }),D6H2OffError);
});
