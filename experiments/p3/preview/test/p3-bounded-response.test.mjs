import test from 'node:test';
import assert from 'node:assert/strict';
import {readP3BoundedResponseText,P3BoundedResponseError} from '../src/p3-bounded-response.mjs';

const reader=(body,headers)=>readP3BoundedResponseText(new Response(body,{headers}),16);
test('P3-B01 bounded reader accepts strict UTF-8 receipt at byte limit',async()=>{
 assert.equal(await reader('1234567890123456'),'1234567890123456');
 assert.equal(await reader('🍀'),'🍀');
});
test('P3-B02 early Content-Length denial and dishonest declared length both fail',async()=>{
 await assert.rejects(reader('12345678901234567'),P3BoundedResponseError);
 await assert.rejects(reader('12345678901234567',{'Content-Length':'1'}),P3BoundedResponseError);
 await assert.rejects(reader('ok',{'Content-Length':'999'}),P3BoundedResponseError);
 await assert.rejects(reader('ok',{'Content-Length':'NaN'}),P3BoundedResponseError);
});
test('P3-B03 chunked stream above limit cancels without consuming further bytes',async()=>{
 let produced=0,cancelled=false;
 const stream=new ReadableStream({
  pull(controller){
   produced++;
   controller.enqueue(new Uint8Array(12).fill(65));
  },
  cancel(){cancelled=true;},
 });
 await assert.rejects(reader(stream),P3BoundedResponseError);
 assert.equal(cancelled,true);
 assert.ok(produced<=3);
});
test('P3-B04 invalid UTF-8, absent body and unsupported maxima reject',async()=>{
 await assert.rejects(reader(new Uint8Array([0xc3,0x28])),P3BoundedResponseError);
 await assert.rejects(readP3BoundedResponseText(new Response(null),16),P3BoundedResponseError);
 await assert.rejects(readP3BoundedResponseText(new Response('ok'),50000),P3BoundedResponseError);
});
test('P3-B05 stream provider error is not converted into a successful receipt',async()=>{
 const stream=new ReadableStream({start(c){c.error(Error('sensitive-provider-message'));}});
 await assert.rejects(reader(stream),/sensitive-provider-message/);
});
