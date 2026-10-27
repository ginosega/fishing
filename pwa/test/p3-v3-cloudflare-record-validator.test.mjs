import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import {validateRecord,validateRecords} from '../src/validation.mjs';

// Cloudflare permits startup-time code generation but rejects runtime
// Function/eval when accepting a Worker request. Keep schema generation out
// of validateRecord(), which runs both in the browser editor and in the
// sandbox D3 server publication pipeline.
const fixture=()=>({
 gear:{schemaVersion:2,items:[{
  id:'p3-test-rod',category:'rods-reels',type:'Spinning rod',
  name:'P3 Test Rod D2 Verification',manufacturer:'Fixture Only',
 }]},
 kb:{schemaVersion:2,entities:[{
  id:'location-p3-test-lake',type:'location',name:'P3 Test Lake',
  content:'KB/Locations/content/P3 Test Lake.md',
 }]},
 catches:{schemaVersion:2,catches:[]},
});
test('P3-V3-CF01 record validation does not compile schemas during a Worker request',()=>{
 const data=fixture();
 const updated={...data.gear.items[0],
  name:'P3 Test Rod D3 Verification',specifications:[],links:[]};
 const original=Object.getOwnPropertyDescriptor(Ajv2020.prototype,'compile');
 // Any post-import schema compilation simulates disallowed request-time
 // dynamic-code generation. Module-init compilation already took place.
 Object.defineProperty(Ajv2020.prototype,'compile',{
  configurable:true,writable:true,
  value(){throw new Error('CLOUDFLARE_RUNTIME_CODE_GENERATION_DENIED');},
 });
 try{
  assert.doesNotThrow(()=>validateRecord(updated,'gear',data));
  assert.doesNotThrow(()=>validateRecord(data.kb.entities[0],'kb',data));
  assert.doesNotThrow(()=>validateRecords(data));
  assert.throws(
   ()=>validateRecord({...updated,name:''},'gear',data),
   /name|must NOT|fewer than/i);
 }finally{
  if(original)Object.defineProperty(Ajv2020.prototype,'compile',original);
  else delete Ajv2020.prototype.compile;
 }
});
