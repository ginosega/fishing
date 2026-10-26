#!/usr/bin/env node
/**
 * FISH118 D3: verify strict-CSP owner pilot (source-only).
 * Must run AFTER build-d3-pilot.mjs. No browser, network, cloud or writes.
 * AJV is allowed here in Node for independent parity, but NEVER in pilot.js.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
const pwa=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repo=path.resolve(pwa,'..');
const bundle=await fs.readFile(path.join(repo,
 'experiments/p3/preview/src/generated/d3-pilot.bundle.txt'),'utf8');
const schema=JSON.parse(await fs.readFile(path.join(pwa,'contracts/schema.json'),'utf8'));
const generated=await import(pathToFileURL(path.join(pwa,
 'src/generated/d3-validators.mjs')).href);
const expected=new Ajv2020({allErrors:true,strict:true});
const definitions={gear:'gearBundle',kb:'kbBundle',catches:'catchBundle',
 gearItem:'gearItem',kbEntity:'kbEntity',catchItem:'catch'};
const cases={
 gear:[
  {schemaVersion:2,items:[{id:'test-rod',category:'rods-reels',type:'Rod',name:'Test'}]},
  {schemaVersion:2,items:[{id:'BadID',category:'rods-reels',type:'Rod',name:'Test'}]},
  {schemaVersion:3,items:[]},
  {schemaVersion:2,items:[{id:'test-rod',category:'rods-reels',type:'Rod',name:'Test',unexpected:true}]},
 ],
 kb:[
  {schemaVersion:2,entities:[{id:'test-lake',type:'location',
    name:'Test',content:'KB/Locations/content/Test.md'}]},
  {schemaVersion:2,entities:[{id:'test-lake',type:'unknown',
    name:'Test',content:'KB/Locations/content/Test.md'}]},
  {schemaVersion:2,entities:[{id:'test-lake',type:'location',name:'Test'}]},
 ],
 catches:[
  {schemaVersion:2,catches:[]},
  {schemaVersion:2,catches:[{id:'test-catch',date:'2026-10-26'}]},
  {schemaVersion:2,catches:[{id:'test-catch',date:'bad-date'}]},
 ],
 gearItem:[
  {id:'test-rod',category:'rods-reels',type:'Rod',name:'Test'},
  {id:'test-rod',category:'rods-reels',type:'Rod'},
 ],
 kbEntity:[
  {id:'test-lake',type:'location',name:'Test',
   content:'KB/Locations/content/Test.md'},
  {id:'test-lake',type:'location',name:'Test'},
 ],
 catchItem:[
  {id:'test-catch',date:'2026-10-26'},
  {id:'test-catch',date:'2026/10/26'},
 ],
};
let compared=0;
for(const [key,definition]of Object.entries(definitions)){
 const canonical=expected.compile({$ref:'#/$defs/'+definition,$defs:schema.$defs});
 const precompiled=generated[key];
 assert.equal(typeof precompiled,'function',key+' must be a standalone validator');
 for(const item of cases[key]){
  assert.equal(precompiled(item),canonical(item),
   key+' should have identical validation verdict as the canonical AJV schema');
  compared++;
 }
}
assert(!/\bnew Function\s*\(|\beval\s*\(/.test(bundle),
 'Private pilot cannot invoke browser-time JS source compilation');
assert(!bundle.includes('Error compiling schema'),
 'AJV runtime compiler must not be shipped to private pilot');
const host=await fs.readFile(path.join(repo,
 'experiments/p3/preview/src/d3-owner-pilot-host.mjs'),'utf8');
const page=await fs.readFile(path.join(repo,
 'experiments/p3/preview/src/d3-owner-pilot-page.mjs'),'utf8');
assert(host.includes("script-src 'self'; style-src 'self'"),
 'Strict source-only CSP must remain enabled');
assert(!host.includes("'unsafe-eval'")&&!host.includes("'unsafe-inline'"),
 'Never relax pilot CSP to fix AJV or inline styling');
assert(!/<[^>]+\sstyle\s*=/.test(page),
 'Pilot HTML must not contain CSP-blocked inline style attributes');

// Execute the entire produced IIFE under a simulated browser VM that
// FORBIDS string code-generation. No external fetch, session, D1 or network.
// Initialization is deliberately stopped at missing DOM dependencies.
const messages=[];
const sandbox={
 document:{getElementById:()=>null},
 location:{origin:'https://fishing.example',pathname:'/__d3_pilot__/'},
 navigator:{onLine:true},
 window:{localStorage:null},
 console:{error:(...values)=>messages.push(values.map(String).join(' '))},
};
const context=vm.createContext(sandbox,{
 codeGeneration:{strings:false,wasm:false},
});
new vm.Script(bundle,{filename:'pilot.js'}).runInContext(context,{timeout:5000});
assert(messages.some(x=>x.startsWith('D3_PILOT_BOOTSTRAP_FAILED')),
 'Pilot should reach top-level controlled DOM bootstrap without eval failure');
process.stdout.write(JSON.stringify({
 verified:true,canonicalParityCases:compared,
 evalForbidden:true,inlineStyleForbidden:true,
 cspHeaderPreserved:true,vmStringCodeGenerationDisabled:true,
 browserBundleBytes:Buffer.byteLength(bundle),noDeployment:true,
})+'\n');
