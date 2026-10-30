import test from 'node:test';
import assert from 'node:assert/strict';
import {sandbox,sample} from './d1-fixture.mjs';
import {describeD3Operation,createD3AuthoringClient}
 from '../src/d3-authoring-client.mjs';
const id='p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f';
test('D3-UX01 durable D1 summary uses hash-checked owner-scoped snapshot',async()=>{
 const db=sandbox(),store=db.store();
 const data=structuredClone(sample);
 data.package.id='garmin-force-current';
 data.package.changes={set:{name:'Garmin Force Current'},unset:[],baseFields:{}};
 const result=await store.accept({idempotencyKey:db.key,snapshot:data});
 const summary=await store.summary(result.operationId);
 assert.equal(summary.domain,'gear');
 assert.equal(summary.action,'edit');
 assert.equal(summary.itemName,'Garmin Force Current');
 assert.equal(summary.completedAt,null,'Accepted is never labeled completed');
 assert.equal(summary.reasonCode,null);
 assert.equal(await store.summary(id),null,'Cannot expose another operation');
});
test('D3-UX02 sanitized response passes optional summary only on trusted shape',()=>{
 const base={operationId:id,state:'Live'};
 const good={domain:'kb',action:'edit',itemName:'Knots',completedAt:1800000000,reasonCode:null};
 assert.deepEqual(describeD3Operation({...base,summary:good}).summary,good);
 assert.equal(describeD3Operation({...base,summary:{...good,itemName:'x'.repeat(200)}}).summary,undefined);
 assert.equal(describeD3Operation(base).summary,undefined);
});
test('D3-UX03 session only exposes allowlisted authenticated login',async()=>{
 const origin='https://fishing-auth-p0-test.ginosega.workers.dev';
 const csrfToken='c'.repeat(43);
 const make=login=>createD3AuthoringClient({
  origin,enabled:()=>true,request:async()=>new Response(JSON.stringify({
   authenticated:true,authorized:true,csrfToken,ownerLogin:login,
  }),{status:200,headers:{'Content-Type':'application/json'}}),
 });
 assert.equal((await make('ginosega').session()).ownerLogin,'ginosega');
 assert.equal((await make('secret@example.com').session()).ownerLogin,undefined);
 assert.equal((await make('bad name').session()).ownerLogin,undefined);
});
