import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker,{createP3DisabledBridgeWorker} from '../src/p3-disabled-bridge-worker.mjs';

test('P3-B01 deployed bridge exports only a fail-closed fetch',async()=>{
 assert.deepEqual(Object.keys(createP3DisabledBridgeWorker()),['fetch']);
 assert.equal('scheduled' in worker,false);
 assert.equal('merge' in worker,false);
 assert.equal('deploy' in worker,false);
 assert.equal('accept' in worker,false);
});
test('P3-B02 all verbs and routes fail closed even under accidentally enabled flags',async()=>{
 let queries=0,credentials=0;
 const env={P3_WRITE_ENABLED:'true',P3_COMMAND_BRIDGE_ENABLED:'true',
  P3_BRIDGE_HMAC_SECRET:'only-a-test-secret-never-deploy',
  DB:{prepare(){queries++;throw Error('D1 MAY NOT BE QUERIED');},
   batch(){queries++;throw Error('D1 MAY NOT BE WRITTEN');}},
  P3_GITHUB_PRIVATE_KEY:{toString(){credentials++;throw Error('MUST NOT READ')}}};
 for(const method of ['GET','POST','DELETE','PUT']){
  for(const pathname of ['/','/health','/_p3/internal/command','/operations','/publish']){
   const response=await worker.fetch(new Request('https://irrelevant.invalid'+pathname,{method}),env);
   assert.equal(response.status,503,method+' '+pathname);
   assert.deepEqual(await response.json(),{ok:false,ready:false,mode:'bridge-disabled'});
  }
 }
 assert.equal(queries,0);assert.equal(credentials,0);
});
test('P3-B03 disabled Worker never imports write-enabled command handling',()=>{
 const script=readFileSync(new URL('../src/p3-disabled-bridge-worker.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(script,/import\s|require\s*\(|fetch\s*\(/);
 assert.doesNotMatch(script,/createP3NativeAcceptanceService|createP3InternalCommandGate/);
});
