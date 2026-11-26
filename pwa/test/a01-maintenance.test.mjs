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

import {D6_NORMALIZED_IDS} from '../src/d6-normalized-id-ledger.mjs';
import {inspectGraph,auditAndPrepare} from '../../backups/maintenance.mjs';
import {createHash} from 'node:crypto';
import {mkdtemp,rm,stat,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const image=Buffer.from('synthetic image bytes');
const digest=createHash('sha256').update(image).digest('hex');
const key='staged/v1/sha256/'+digest;
const other=Buffer.from('unlinked private original');
const otherHash=createHash('sha256').update(other).digest('hex');
const otherKey='staged/v1/sha256/'+otherHash;
const sqlQuote=s=>"'"+String(s).replaceAll("'","''")+"'";
function normalizedFixture({privateOriginal=false,broken=false}={}){
 const sql=[
 'CREATE TABLE d6_gear_records (id TEXT PRIMARY KEY,revision INTEGER,record_json TEXT,notes_text TEXT);',
 'CREATE TABLE d6_kb_records (id TEXT PRIMARY KEY,revision INTEGER,record_json TEXT,content_text TEXT);',
 'CREATE TABLE d6_catch_records (id TEXT PRIMARY KEY,revision INTEGER,record_json TEXT,notes_text TEXT);',
 'CREATE TABLE d6_media_objects (sha256 TEXT PRIMARY KEY,storage_key TEXT UNIQUE,mime TEXT,bytes INTEGER);',
 'CREATE TABLE d6_media_refs (logical_path TEXT,domain TEXT,record_id TEXT,sha256 TEXT REFERENCES d6_media_objects(sha256),historical INTEGER);',
 'CREATE INDEX d6_media_refs_owner_idx ON d6_media_refs(domain,record_id);',
 'CREATE INDEX d6_media_refs_path_idx ON d6_media_refs(logical_path);',
 'CREATE TRIGGER d6_media_same_path_sha BEFORE INSERT ON d6_media_refs BEGIN SELECT 1; END;'
 ];
 const gearID=D6_NORMALIZED_IDS.gear[0],cover='Gear/Equipment/assets/'+gearID+'.jpg';
 for(const domain of ['gear','kb','catches']){
  const table=domain==='gear'?'d6_gear_records':domain==='kb'?'d6_kb_records':'d6_catch_records';
  for(const id of D6_NORMALIZED_IDS[domain]){
   let record,markdown='';
   if(domain==='gear'){
    record={id,name:'Fixture '+id,category:'equipment',type:'Kayaks',specifications:[],links:[],notes:'Gear/Equipment/content/'+id+'.md'};
    if(id===gearID){record.picture={src:cover}; if(broken)markdown='[Missing](kb://missing-record)';}
   }else if(domain==='kb'){
    record={id,name:'Fixture '+id,type:'gear-guides',content:'KB/Gear-Guides/content/'+id+'.md'};
   }else record={id,date:'2026-11-20',notes:'Catches/content/'+id+'.md'};
   sql.push('INSERT INTO '+table+' VALUES ('+[sqlQuote(id),1,sqlQuote(JSON.stringify(record)),sqlQuote(markdown)].join(',')+');');
  }
 }
 sql.push('INSERT INTO d6_media_objects VALUES ('+[sqlQuote(digest),sqlQuote(key),"'image/jpeg'",image.length].join(',')+');');
 sql.push('INSERT INTO d6_media_refs VALUES ('+[sqlQuote(cover),"'gear'",sqlQuote(gearID),sqlQuote(digest),0].join(',')+');');
 if(privateOriginal)sql.push('INSERT INTO d6_media_objects VALUES ('+[sqlQuote(otherHash),sqlQuote(otherKey),"'image/jpeg'",other.length].join(',')+');');
 return Buffer.from(sql.join('\n'),'utf8');
}
test('maintenance uses actual normalized production graph and rejects broken content links',async()=>{
 const g=await inspectGraph(normalizedFixture());
 assert.equal(g.graph.readerCompatibility.min,2);
 assert.deepEqual([g.counts.d6_gear_records,g.counts.d6_kb_records,g.counts.d6_catch_records],[100,60,12]);
 assert.equal(g.graph.images[0].sha256,digest);
 await assert.rejects(inspectGraph(normalizedFixture({broken:true})),/Invalid Markdown link/);
});
test('maintenance produces full recovery stage despite R2-only candidates, but withholds non-public registered originals',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'fish-maint-'));
 try{
  const physical=[{key,bytes:image.length},{key:otherKey,bytes:other.length}];
  const fetchOriginal=async r=>r.sha256===digest?image:other;
  const reports=[];
  const args={physical,fetchOriginal,sourceRevision:'d'.repeat(40),report:async r=>reports.push({...r})};
  const stage=join(temp,'stage');
  const result=await auditAndPrepare({...args,input:normalizedFixture(),stage,mode:'complete'});
  assert.equal(result.audit,'REVIEW NEEDED');
  assert.equal(result.unregistered,1);
  assert.equal(result.backup,'PREPARED');
  const manifest=JSON.parse(await readFile(join(stage,'manifest.json'),'utf8'));
  assert.equal(manifest.imageCount,1);
  const blocked=join(temp,'blocked');
  await assert.rejects(auditAndPrepare({...args,input:normalizedFixture({privateOriginal:true}),stage:blocked,mode:'complete'}),/withheld/);
  assert.equal(reports.at(-1).registeredUnlinked,1);
  assert.equal(reports.at(-1).verifiedOriginals,2);
  await assert.rejects(stat(blocked),{code:'ENOENT'});
  const only=await auditAndPrepare({...args,input:normalizedFixture({privateOriginal:true}),stage:blocked,mode:'audit'});
  assert.equal(only.backup,'NOT REQUESTED');
  await assert.rejects(stat(blocked),{code:'ENOENT'});
  await assert.rejects(auditAndPrepare({...args,input:normalizedFixture(),stage:blocked,mode:'complete',fetchOriginal:async()=>Buffer.alloc(image.length)}),/verification failed/);
  assert.equal(reports.at(-1).audit,'INTEGRITY FAILURE');
 }finally{await rm(temp,{recursive:true,force:true});}
});
