import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6DirectContentFixture} from './support/d6-online-content-fixture.mjs';
import {D6_ORIGINAL_IDS,verifyD6OriginalIds} from '../src/d6-original-id-ledger.mjs';
import {readFileSync} from 'node:fs';
import {chooseD6BootstrapContent,isD6DirectContentBootstrap,
 readD6VerifiedMode} from '../src/d6-online-content-bootstrap.mjs';

test('V3-ONLINE01 fully flagged owner build reads three D1 catalogs, no frozen fetch',async()=>{
 const h=createD6DirectContentFixture();
 const result=await chooseD6BootstrapContent({
  v3:h.v3,online:true,readMode:async()=> 'Automatic',
  loadRelease:async()=>{throw Error('Frozen release catalogs requested online');},
 });
 assert.equal(result.source,'d1');
 assert.equal(result.readingMode,'Automatic');
 assert.equal(result.data.gear.items.length,100);
 assert.equal(result.data.kb.entities.length,60);
 assert.equal(result.data.catches.catches.length,12);
 assert.deepEqual(h.reads(),['gear','kb','catches']);
});
test('V3-ONLINE02 new Gear, KB, Catch records are online without a frozen baseline',async()=>{
 const h=createD6DirectContentFixture({extra:true});
 const result=await chooseD6BootstrapContent({
  v3:h.v3,online:true,readMode:async()=> 'Automatic',
  loadRelease:async()=>{throw Error('No static content fetch in online D1 mode');},
 });
 assert.equal(result.data.gear.items.length,101);
 assert.equal(result.data.kb.entities.length,61);
 assert.equal(result.data.catches.catches.length,13);
 assert.equal(result.source,'d1');
});
test('V3-ONLINE03 Work Offline uses the established release snapshot, no D1 queries',async()=>{
 const h=createD6DirectContentFixture();
 const staticData={offline:'verified release loader fixture'};
 const result=await chooseD6BootstrapContent({
  v3:h.v3,online:true,readMode:async()=> 'Work Offline',
  loadRelease:async()=>staticData,
 });
 assert.equal(result.source,'release');
 assert.equal(result.readingMode,'Work Offline');
 assert.equal(result.data,staticData);
 assert.deepEqual(h.reads(),[]);
});
test('V3-ONLINE04 disconnected device uses offline release without querying mode or D1',async()=>{
 const h=createD6DirectContentFixture();
 const result=await chooseD6BootstrapContent({
  v3:h.v3,online:false,
  readMode:async()=>{throw Error('Offline device must not query online mode');},
  loadRelease:async()=>({validOffline:true}),
 });
 assert.equal(result.source,'release');
 assert.deepEqual(h.reads(),[]);
});
test('V3-ONLINE05 ordinary V2 or partial V3 build does not change release boot',async()=>{
 for(const v3 of [null,{enabled:true,readerOnly:true},
  {...createD6DirectContentFixture().v3,directCatchEnabled:false}]){
  assert.equal(isD6DirectContentBootstrap(v3),false);
  let used=0;
  const result=await chooseD6BootstrapContent({
   v3,online:true,
   readMode:async()=>{used++;throw Error('V2 never probes V3 mode');},
   loadRelease:async()=>({original:true}),
  });
  assert.equal(result.source,'release');
  assert.equal(used,0);
 }
});
test('V3-ONLINE06 corrupted D1 records or partial catalog fail closed, no static fallback',async()=>{
 for(const kind of ['short','duplicate','badType','missingReference',
  'sameCountSwapGear','sameCountSwapKB','sameCountSwapCatch']){
  const h=createD6DirectContentFixture({fault:kind});
  await assert.rejects(chooseD6BootstrapContent({
   v3:h.v3,online:true,readMode:async()=> 'Automatic',
   loadRelease:async()=>{throw Error('Do not serve stale content in Automatic');},
  }));
 }
});
test('V3-ONLINE07 unknown/unverified reading mode fails closed with no D1 calls',async()=>{
 for(const mode of ['Checking',null,'Offline']){
  const h=createD6DirectContentFixture();
  await assert.rejects(chooseD6BootstrapContent({
   v3:h.v3,online:true,readMode:async()=>mode,
   loadRelease:async()=>{throw Error('Not permitted');},
  }),/V3_READING_MODE_UNAVAILABLE/);
  assert.deepEqual(h.reads(),[]);
 }
});
test('V3-ONLINE08 service-worker reading mode request is read-only and validated',async()=>{
 const calls=[];
 const receiver={postMessage(message,ports){
  calls.push(message);
  ports[0].onmessage({data:{type:'FISHING_V3_MODE',
   available:true,mode:'Automatic'}});
 }};
 const fakeChannel={port1:{close(){}},port2:{close(){},onmessage:null}};
 // Deliver the simulated worker reply on the same port the page listens to.
 const controller={postMessage(message){
  calls.push(message);
  fakeChannel.port1.onmessage({data:{type:'FISHING_V3_MODE',
   available:true,mode:'Automatic'}});
 }};
 const mode=await readD6VerifiedMode({controller,
  channelFactory:()=>fakeChannel,timeoutMs:100});
 assert.equal(mode,'Automatic');
 assert.deepEqual(calls,[{type:'V3_READ_MODE'}]);
 await assert.rejects(readD6VerifiedMode({controller:null,timeoutMs:1}),
  /V3_READING_MODE_UNAVAILABLE/);
});

test('V3-C03-01 ledger exactly matches pinned original 100/60/12 sources',()=>{
 for(const [domain,file,field] of [
  ['gear','Gear/gear.json','items'],
  ['kb','KB/kb.json','entities'],
  ['catches','Catches/catches.json','catches'],
 ]){
  const raw=JSON.parse(readFileSync(new URL('../'+file,import.meta.url),'utf8'));
  const original=raw[field].map(x=>x.id).sort();
  assert.equal(new Set(original).size,original.length);
  assert.deepEqual([...D6_ORIGINAL_IDS[domain]],original);
  assert.equal(verifyD6OriginalIds(domain,
   original.map(id=>({id}))),true);
  assert.equal(verifyD6OriginalIds(domain,
   [...original.slice(1), 'substitute-not-the-original'].map(id=>({id}))),false);
 }
});
test('V3-C03-02 equal-count substitution fails before displaying D1 graph',async()=>{
 for(const fault of ['sameCountSwapGear','sameCountSwapKB','sameCountSwapCatch']){
  const h=createD6DirectContentFixture({fault});
  await assert.rejects(chooseD6BootstrapContent({
   v3:h.v3,online:true,readMode:async()=> 'Automatic',
   loadRelease:async()=>{throw Error('Never use stale release automatically');},
  }),error=>error.code==='D1_BOOTSTRAP_UNAVAILABLE'&&
    /BASELINE_INCOMPLETE/.test(error.cause?.message??''));
 }
});
test('V3-C03-03 live D1 network failure yields typed recovery, no legacy fallback',async()=>{
 const h=createD6DirectContentFixture();
 h.v3.directGearClient.list=async()=>{throw Error('HTTP 503');};
 await assert.rejects(chooseD6BootstrapContent({
  v3:h.v3,online:true,readMode:async()=> 'Automatic',
  loadRelease:async()=>{throw Error('Unsafe silent fallback');},
 }),error=>error.code==='D1_BOOTSTRAP_UNAVAILABLE'&&
   /Retry online/.test(error.message));
});

test('L01-BOOT01 standalone V3 fails closed rather than loading a frozen release',async()=>{
 const valid=createD6DirectContentFixture().v3;
 let frozenReads=0;
 const args={standalone:true,online:true,
  loadRelease:async()=>{frozenReads++;throw Error('Frozen content requested');},
  readMode:async()=> 'Automatic'};
 await assert.rejects(chooseD6BootstrapContent({...args,v3:null}),
  /STANDALONE_V3_CONTENT_REQUIRED/);
 await assert.rejects(chooseD6BootstrapContent({...args,v3:valid}),
  /STANDALONE_V3_CONTENT_REQUIRED/);
 await assert.rejects(chooseD6BootstrapContent({...args,
  v3:{...valid,offlineContentReader:async()=>{throw Error('not prepared');}},
  online:false}),/not prepared/);
 assert.equal(frozenReads,0);
});
