import test from 'node:test';
import assert from 'node:assert/strict';
import {validD6Catalog,D6_MIGRATED_MINIMUMS}
 from '../src/d6-catalog-invariants.mjs';

test('V3 catalog: historic counts are floors and additional records are valid',()=>{
 for(const domain of ['gear','kb','catches']){
  const n=D6_MIGRATED_MINIMUMS[domain];
  const original=Array.from({length:n},(_,i)=>({id:'original-'+i}));
  const ids=new Set(original.map(x=>x.id));
  assert.equal(validD6Catalog(domain,{items:original,count:n,requiredIds:ids}),true);
  const grown=[...original,{id:'new-owner-item'}];
  assert.equal(validD6Catalog(domain,{items:grown,count:n+1,requiredIds:ids}),true);
  assert.equal(validD6Catalog(domain,{items:grown.slice(1),requiredIds:ids}),false);
  assert.equal(validD6Catalog(domain,{items:grown,count:n}),false);
  assert.equal(validD6Catalog(domain,{items:[...original,original[0]]}),false);
  assert.equal(validD6Catalog(domain,{items:original.slice(1)}),false);
 }
});
test('V3 catalog rejects malformed or duplicate record IDs',()=>{
 const items=Array.from({length:100},(_,i)=>({id:'record-'+i}));
 assert.equal(validD6Catalog('gear',{items}),true);
 for(const id of ['../escape','UPPER','has space','x'.repeat(161)]){
  assert.equal(validD6Catalog('gear',{items:[...items.slice(0,99),{id}]}),false);
 }
 assert.equal(validD6Catalog('unknown',{items}),false);
});
