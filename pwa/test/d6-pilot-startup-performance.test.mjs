import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8')
 .replace(/^import .*;$/gm,'')
 .replace('export async function bootstrap','async function bootstrap');
const roots={root:'https://fishing-d6-wp2-test.ginosega.workers.dev/fishing/',
 release:{id:'0123456789abcdef0123456789abcdef',sourceRevision:'a'.repeat(40)}};
const DOMAIN={gear:{file:'Gear/gear.json'},kb:{file:'KB/kb.json'},
 catches:{file:'Catches/catches.json'}};
function setup({bad=null}={}){
 const pending=new Map(),started=[],accepted=[];
 const context={
  URL,Promise,Error,Object,DOMAIN,
  encodedPath:value=>value,
  validateRecords:()=>({valid:true}),
  createApp:ctx=>accepted.push(ctx),
  globalThis:{__FISHING_BOOT__:{manifest:{cardThumbnails:{}}}},
  window:{},
  fetch:url=>{
   const name=[...Object.entries(DOMAIN)]
    .find(([,item])=>String(url).includes('/'+item.file))?.[0];
   assert.ok(name,'unexpected catalog URL '+url);
   started.push(name);
   return new Promise(resolve=>pending.set(name,()=>resolve({
    ok:name!==bad,status:name===bad?503:200,
    json:async()=>name==='gear'?{items:[{id:'rod'}]}:
     name==='kb'?{entities:[{id:'knots'}]}:
      {catches:[{id:'catch'}]},
   })));
  },
 };
 vm.runInNewContext(source+'\nthis.bootstrap=bootstrap;',context,
  {timeout:1000});
 return {context,pending,started,accepted};
}

test('V3-START01 catalogs start concurrently and preserve domain order',async()=>{
 const x=setup();
 const task=x.context.bootstrap(roots);
 // All three requests must be started before any response is resolved.
 assert.deepEqual(x.started,['gear','kb','catches']);
 assert.equal(x.pending.size,3);
 // Out-of-order responses must not change the record map ordering.
 x.pending.get('catches')();
 x.pending.get('kb')();
 x.pending.get('gear')();
 await task;
 assert.equal(x.accepted.length,1);
 assert.deepEqual(Object.keys(x.accepted[0].data),['gear','kb','catches']);
 assert.equal(x.accepted[0].data.gear.items[0].id,'rod');
 assert.equal(x.accepted[0].data.kb.entities[0].id,'knots');
 assert.equal(x.accepted[0].data.catches.catches[0].id,'catch');
});

test('V3-START02 any rejected catalog blocks application startup',async()=>{
 const x=setup({bad:'kb'});
 const task=x.context.bootstrap(roots);
 for(const finish of x.pending.values())finish();
 await assert.rejects(task,/Unable to load kb: HTTP 503/);
 assert.equal(x.accepted.length,0);
});
