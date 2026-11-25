import test from 'node:test';
import assert from 'node:assert/strict';
import {readD6BoundedJson,D6BoundedJsonError}
 from '../../experiments/p3/preview/src/d6-bounded-json-response.mjs';
const denied=(value,code)=>assert.rejects(value,error=>
 error instanceof D6BoundedJsonError&&error.code===code);
test('D6-BOUNDED01 valid bounded JSON parses',async()=>{
 assert.deepEqual(await readD6BoundedJson(new Response('{"ok":true}'),64),
  {ok:true});
});
test('D6-BOUNDED02 inflated or invalid Content-Length denied',async()=>{
 for(const length of ['9999','99999999999999999999999','not-a-length']){
  await denied(readD6BoundedJson(new Response('{}',{
   headers:{'Content-Length':length},
  }),32),'TOO_LARGE');
 }
});
test('D6-BOUNDED03 overflow cancels streaming response early',async()=>{
 let pulled=0,canceled=false;
 const response=new Response(new ReadableStream({
  pull(controller){
   pulled++;
   controller.enqueue(new Uint8Array(1024));
   if(pulled===12)controller.close();
  },
  cancel(){canceled=true;},
 }));
 await denied(readD6BoundedJson(response,2048),'TOO_LARGE');
 assert.equal(canceled,true);
 assert(pulled<12);
});
test('D6-BOUNDED04 invalid JSON, UTF-8 and configuration fail closed',async()=>{
 await denied(readD6BoundedJson(new Response('{bad'),128),'INVALID_RESPONSE');
 await denied(readD6BoundedJson(new Response(Uint8Array.of(0xff,0xfe)),
  128),'INVALID_RESPONSE');
 await denied(readD6BoundedJson(new Response('{}'),0),'INVALID_RESPONSE');
});
