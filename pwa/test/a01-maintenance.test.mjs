import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileInventory} from '../../backups/maintenance.mjs';
const a='a'.repeat(64),b='b'.repeat(64),c='c'.repeat(64);
const row=(sha256,bytes)=>({sha256,storage_key:'staged/v1/sha256/'+sha256,bytes});
const phys=r=>({key:r.storage_key,bytes:r.bytes});
const owner={domain:'gear',recordId:'g'};
test('maintenance preserves shared referenced originals and distinguishes uncertain physical objects',()=>{
 const rows=[row(a,10),row(b,20)],refs=[
  {domain:'gear',record_id:'g',logical_path:'Gear/a.jpg',sha256:a},
  {domain:'kb',record_id:'k',logical_path:'Gear/a.jpg',sha256:a},
  {domain:'gear',record_id:'g',logical_path:'Gear/b.jpg',sha256:b,historical:1}
 ];
 const graph={images:[{sha256:a,logicalPath:'Gear/a.jpg',owners:[owner,{domain:'kb',recordId:'k'}]}]};
 const r=reconcileInventory({rows,refs,graph},[...rows.map(phys),phys(row(c,30))]);
 assert.deepEqual(r.registeredUnlinked,[rows[1]]);
 assert.deepEqual(r.unlinkedRefs,[refs[2]]);
 assert.equal(r.unregistered[0].key,row(c,30).storage_key);
 assert.equal(r.summary.candidateBytes,50);
 assert.equal(r.summary.linkedOriginals,1);
 assert.equal(r.summary.missing,0);
});
test('maintenance detects missing, size mismatch and invalid repeated listings',()=>{
 const rows=[row(a,10),row(b,20)],refs=[],graph={images:[]};
 const r=reconcileInventory({rows,refs,graph},[phys(row(a,11))]);
 assert.equal(r.summary.missing,1);
 assert.equal(r.summary.wrongSize,1);
 assert.throws(()=>reconcileInventory({rows,refs,graph},[phys(rows[0]),phys(rows[0])]),/duplicate/);
});
