import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mergeD5SandboxBaseline} from '../src/d5-sandbox-baseline.mjs';

const make=()=>({
 gear:{schemaVersion:2,items:[{id:'real-rod',name:'Rod'}]},
 kb:{schemaVersion:2,entities:[{id:'species-rainbow-trout',type:'species'}]},
 catches:{schemaVersion:2,catches:[{id:'real-catch'}]},
});
const sandbox=()=>({
 gear:{schemaVersion:2,items:[{id:'p3-test-gear',name:'Synthetic'}]},
 kb:{schemaVersion:2,entities:[{id:'p3-test-knot',type:'knot'}]},
 catches:{schemaVersion:2,catches:[{id:'p3-test-catch'}]},
});
test('D5-BASE01 additive merge retains canonical and synthetic ID sets',()=>{
 const c=make(),s=sandbox();
 const result=mergeD5SandboxBaseline(c,s);
 assert.deepEqual(result.data.gear.items,[...c.gear.items,...s.gear.items]);
 assert.deepEqual(result.data.kb.entities,[...c.kb.entities,...s.kb.entities]);
 assert.deepEqual(result.data.catches.catches,[...c.catches.catches,...s.catches.catches]);
 assert.equal(result.summary.gear.canonical,1);
 assert.equal(result.summary.gear.sandboxPreserved,1);
 assert.deepEqual(result.summary.kb.sandboxIds,['p3-test-knot']);
 assert.deepEqual(s.gear.items,[{id:'p3-test-gear',name:'Synthetic'}]);
});
test('D5-BASE02 fail-closed on colliding IDs and mismatched schema',()=>{
 const base=make(),s=sandbox();
 s.gear.items[0].id='real-rod';
 assert.throws(()=>mergeD5SandboxBaseline(base,s),/collision/);
 s.gear.items[0].id='p3-test-gear';
 s.kb.schemaVersion=3;
 assert.throws(()=>mergeD5SandboxBaseline(base,s),/Incompatible kb/);
});
test('D5-BASE03 refuse duplicate IDs from the same source',()=>{
 const base=make();
 base.catches.catches.push({id:'real-catch'});
 assert.throws(()=>mergeD5SandboxBaseline(base,sandbox()),/duplicate canonical catches/);
});

test('D5-BASE04 read-only planner parses and fails closed without pinned inputs',()=>{
 const file=fileURLToPath(new URL('../tools/plan-d5-sandbox-baseline.mjs',import.meta.url));
 const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
 const noInputs=spawnSync(process.execPath,[file],{encoding:'utf8'});
 assert.notEqual(noInputs.status,0,'a missing source must not stage any merge');
 assert.match(noInputs.stderr,/Missing --canonical/);
});
