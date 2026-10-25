import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker,{createP3DisabledIngressWorker} from '../src/p3-disabled-ingress-worker.mjs';

test('P3-G01 disabled ingress exports only fetch, no auth/command/publish handlers',()=>{
 assert.deepEqual(Object.keys(createP3DisabledIngressWorker()),['fetch']);
 for(const name of ['accept','publish','merge','deploy','issueToken','scheduled','queue'])
  assert.equal(name in worker,false);
});
test('P3-G02 disabled ingress rejects ALL verbs and paths even if all flags are true',async()=>{
 let privileged=0;
 const env={P3_INGRESS_ENABLED:'true',P3_WRITE_ENABLED:'true',
  P3_COMMAND_BRIDGE_ENABLED:'true',
  get P3_COMMAND_SERVICE(){privileged++;throw Error('COMMAND SERVICE MUST NOT BE READ');},
  get DB(){privileged++;throw Error('D1 MUST NOT BE READ');},
  get P3_BRIDGE_HMAC_SECRET(){privileged++;throw Error('SIGNING SECRET MUST NOT BE READ');},
  get P3_ACCESS_CLIENT_SECRET(){privileged++;throw Error('ACCESS SECRET MUST NOT BE READ');},
 };
 for(const method of ['GET','POST','DELETE','PUT','OPTIONS']){
  for(const path of ['/','/health','/p3/internal/accept','/_p3/internal/command','/publish']){
   const req=new Request('https://fishing-p3-access-ingress-sandbox.ginosega.workers.dev'+path,{
    method,body:method==='GET'||method==='OPTIONS'?undefined:'{"action":"accept"}'});
   const res=await worker.fetch(req,env);
   assert.equal(res.status,503);
   assert.deepEqual(await res.json(),{ok:false,ready:false,mode:'ingress-disabled'});
   assert.equal(res.headers.get('Cache-Control'),'no-store');
  }
 }
 assert.equal(privileged,0);
});
test('P3-G03 no imports, subrequests or source-only active gate dependencies',()=>{
 const source=readFileSync(new URL('../src/p3-disabled-ingress-worker.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/^\s*import\s|\brequire\s*\(/m);
 assert.doesNotMatch(source,/globalThis\.fetch|fetch\s*\(\s*['"`]|createP3AccessIngress|createP3AccessJwtVerifier|createP3NativeAcceptanceService|P3_COMMAND_SERVICE\.fetch/);
});
