import test from 'node:test';
import assert from 'node:assert/strict';
import {createD3BenchmarkOwnerRoute} from '../src/d3-benchmark-owner-route.mjs';
import {D2SessionError} from '../src/d2-unified-owner-session.mjs';
const origin='https://fishing-auth-p0-test.ginosega.workers.dev';
const version='bench_'+'a'.repeat(32),sha='b'.repeat(64);
function fixture({enabled=true,owner=true}={}){
 const calls={status:0,write:0,storage:0,current:0,run:0};
 let authorized=owner;
 const route=createD3BenchmarkOwnerRoute({
  origin,enabled:()=>enabled,ownerSession:{
   authorizeStatus:async()=>{
    calls.status++;if(!authorized)throw new D2SessionError('SESSION_DENIED');return {authorized:true};
   },
   authorizeWrite:async()=>{
    calls.write++;if(!authorized)throw new D2SessionError('SESSION_DENIED');return {authorized:true};
   },
  },R2:{},D1:{},storageFactory:()=>{
   calls.storage++;
   return {
    current:async()=>{calls.current++;return {
     state:'ActivatedTestOnly',testOnly:true,version,
     sha256:sha,bytes:new Uint8Array([1,2,3]),
    };},
    stageAndActivate:async()=>{calls.run++;return {
     state:'ActivatedTestOnly',testOnly:true,canonicalLive:false,
     version,runId:version,sha256:sha,sizeBytes:1024,
    };},
   };
  },
 });
 const fetch=(path,{method='GET',body=null}={})=>route.handle(new Request(
  origin+path,{method,headers:method==='POST'?
   {'Content-Type':'application/json'}:{},body:body===null?undefined:
    JSON.stringify(body),
 }));
 return {calls,fetch};
}
test('BENCH-ROUTE-01 separate feature flag returns Not Found before auth/storage',async()=>{
 const f=fixture({enabled:false});
 const r=await f.fetch('/__d3_benchmark__/current');
 assert.equal(r.status,404);
 assert.deepEqual(f.calls,{status:0,write:0,storage:0,current:0,run:0});
});
test('BENCH-ROUTE-02 authenticated active test can read synthetic status',async()=>{
 const f=fixture(),r=await f.fetch('/__d3_benchmark__/current');
 assert.equal(r.status,200);
 const body=await r.json();
 assert.equal(body.canonicalLive,false);
 assert.equal(body.version,version);
 assert.equal('bytes' in body,false);
 assert.equal(f.calls.status,1);
 assert.equal(r.headers.get('Cache-Control'),'private, no-store, max-age=0');
});
test('BENCH-ROUTE-03 asset delivery is private and byte-addressed',async()=>{
 const f=fixture(),r=await f.fetch('/__d3_benchmark__/asset');
 assert.equal(r.status,200);
 assert.equal(r.headers.get('X-D3-Benchmark-Version'),version);
 assert.equal(r.headers.get('X-D3-Test-Only'),'true');
 assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[1,2,3]);
});
test('BENCH-ROUTE-04 unauthorized caller sees no benchmark information',async()=>{
 const f=fixture({owner:false});
 for(const path of ['/__d3_benchmark__/current','/__d3_benchmark__/asset']){
  const r=await f.fetch(path);assert.equal(r.status,404);
 }
 assert.equal(f.calls.current,0);
});
test('BENCH-ROUTE-05 synthetic POST must be owner-guarded',async()=>{
 const f=fixture();
 const r=await f.fetch('/__d3_benchmark__/run',{
  method:'POST',body:{runId:version,expectedVersion:null,sizeBytes:1024},
 });
 assert.equal(r.status,200);
 assert.equal((await r.json()).canonicalLive,false);
 assert.equal(f.calls.write,1);
 assert.equal(f.calls.run,1);
});
test('BENCH-ROUTE-06 unknown path, extra query, invalid payload always denied',async()=>{
 const f=fixture();
 assert.equal((await f.fetch('/__d3_benchmark__/unknown')).status,404);
 assert.equal((await f.fetch('/__d3_benchmark__/current?next=true')).status,404);
 assert.equal((await f.fetch('/__d3_benchmark__/run',{
  method:'POST',body:{runId:'evil',expectedVersion:null,sizeBytes:1024},
 })).status,400);
 assert.equal(f.calls.run,0);
});
