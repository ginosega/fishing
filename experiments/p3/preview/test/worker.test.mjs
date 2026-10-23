import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';
const ORIGIN='https://fishing-p3-sandbox-preview.example.workers.dev';
const env=()=>({APP_ORIGIN:ORIGIN,DB:{prepare(sql){assert.equal(sql,'SELECT 1 AS alive');return {first:async()=>({alive:1})}}}});
const send=(path,config={})=>worker.fetch(new Request(ORIGIN+path,config),env());

test('P3-I01 health succeeds only with sandbox D1 and stays not ready for publishing',async()=>{
 const r=await send('/health');assert.equal(r.status,200);
 assert.deepEqual(await r.json(),{ok:true,ready:false,mode:'preview-no-publishing'});
 assert.equal(r.headers.get('Cache-Control'),'no-store');
});
test('P3-I02 anonymous session always returns no publishing authority',async()=>{
 const r=await send('/session',{headers:{Cookie:'__Host-fish_p0_session=fake',Authorization:'Bearer bad'}});
 assert.equal(r.status,200);assert.deepEqual(await r.json(),{authenticated:false,authorized:false});
});
test('P3-I03 publication, operation, auth and sign-out routes never permit use',async()=>{
 for(const path of ['/publications','/publications/123','/operations/123','/auth/start','/session/revoke-all']){
  const response=await send(path,{method:'POST',body:'{"repo":"ginosega/fishing"}'});
  assert.equal(response.status,503,path);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
 }
});
test('P3-I04 missing/misconfigured DB or origin fails closed',async()=>{
 for(const altered of [{...env(),DB:undefined},{...env(),APP_ORIGIN:'https://other.invalid'},{...env(),DB:{prepare(){throw Error('secret DB failure')}}}]){
  const r=await worker.fetch(new Request(ORIGIN+'/health'),altered);
  assert.equal(r.status,503);
  assert.doesNotMatch(await r.text(),/secret/);
 }
});
test('P3-I05 method and hostname restrictions',async()=>{
 assert.equal((await send('/health',{method:'POST'})).status,405);
 assert.equal((await worker.fetch(new Request('https://attacker.example/health'),env())).status,503);
 assert.equal((await send('/arbitrary')).status,404);
});
