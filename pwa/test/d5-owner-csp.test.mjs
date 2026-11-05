import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validateRecords,validateRecord} from '../src/validation.mjs';

const read=url=>readFileSync(new URL(url,import.meta.url),'utf8');

test('D5-CSP01 AJV schema validators are static and do not need unsafe-eval',()=>{
 const browserValidation=read('../src/validation.mjs');
 const generated=read('../src/generated/ajv-validators.cjs');
 assert.doesNotMatch(browserValidation,/\b(?:ajv\.compile|new\s+Ajv2020|new\s+Function)\b/);
 assert.doesNotMatch(generated,/\bnew\s+Function\b|\beval\s*\(/);
 for(const name of ['validateGearBundle','validateKbBundle','validateCatchBundle',
   'validateGearItem','validateKbEntity','validateCatch']){
  assert.match(generated,new RegExp('\\b'+name+'\\b'));
 }
});

test('D5-CSP02 static validators preserve canonical checks',()=>{
 const data={
  gear:JSON.parse(read('../Gear/gear.json')),
  kb:JSON.parse(read('../KB/kb.json')),
  catches:JSON.parse(read('../Catches/catches.json')),
 };
 const maps=validateRecords(data);
 assert(maps.gear instanceof Map);
 assert(maps.kb instanceof Map);
 assert(maps.catches instanceof Map);
 assert.throws(()=>validateRecords({...data,gear:{...data.gear,schemaVersion:99}}),
   /gear schema:/);
 const item=data.gear.items[0];
 assert.throws(()=>validateRecord({...item,id:0},'gear',data));
});
