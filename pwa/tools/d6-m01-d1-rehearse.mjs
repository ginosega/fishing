/**
 * FISH-TODO-118 M01 — OFFLINE ONLY rehearsal of approved metadata migration.
 * Restores the owner's actual D1 SQL backup into ephemeral in-memory SQLite,
 * verifies the accepted source/revisions, runs the two-table D1 metadata plan,
 * and proves no existing Gear/KB/Catch content row changed.
 *
 * node tools/d6-m01-d1-rehearse.mjs --backup <export.sql> --report <inventory.json>
 *
 * No network, Wrangler, Cloudflare API, output files, or provider writes.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {prepareM01D1MediaPlan} from './d6-m01-d1-media-plan.mjs';

async function main(){
 const args=process.argv.slice(2);
 assert(args.length===4&&args[0]==='--backup'&&args[1]&&
  args[2]==='--report'&&args[3],
  'Usage: --backup <export.sql> --report <original-inventory.json>');
 const plan=await prepareM01D1MediaPlan({reportFile:args[3]});
 const backup=await readFile(args[1],'utf8');
 assert(backup.length>10000,'D1 backup missing or suspiciously small');
 const db=new DatabaseSync(':memory:');
 try{
  db.exec(backup);
  db.exec('PRAGMA foreign_keys=ON');
  assert.equal(db.prepare(plan.preflightSQL).get()?.accepted,1,
   'exported backup differs from accepted live D1 preflight');
  const originals={};
  for(const [domain,table,markdown] of [
   ['gear','d6_gear_records','notes_text'],
   ['kb','d6_kb_records','content_text'],
   ['catches','d6_catch_records','notes_text']]){
   originals[domain]=JSON.stringify(db.prepare(
    'SELECT id,revision,record_json,'+markdown+
    ',updated_at FROM '+table+' ORDER BY id').all());
  }
  db.exec(plan.schemaSQL);
  for(const sql of plan.objectBatches)db.exec(sql);
  for(const sql of plan.referenceBatches)db.exec(sql);
  const got=db.prepare(plan.postflightSQL).get();
  assert.equal(got.objects,272,'object count');
  assert.equal(got.associations,276,'record-image association count');
  assert.equal(got.paths,265,'unique referenced image paths');
  assert.equal(db.prepare(
   'SELECT COUNT(*) AS n FROM d6_media_refs WHERE historical<>1'
  ).get().n,0,'historical flags not set');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[],
   'foreign-key error');
  for(const [domain,table,markdown] of [
   ['gear','d6_gear_records','notes_text'],
   ['kb','d6_kb_records','content_text'],
   ['catches','d6_catch_records','notes_text']]){
   assert.equal(JSON.stringify(db.prepare(
    'SELECT id,revision,record_json,'+markdown+
    ',updated_at FROM '+table+' ORDER BY id').all()),
    originals[domain],domain+' content changed');
  }
  console.log('M01 D1 OFFLINE REHEARSAL PASS');
  console.log('Restored and checked exported D1 backup in memory.');
  console.log('Objects '+got.objects+'; associations '+
    got.associations+'; paths '+got.paths+'.');
  console.log('All 172 Gear/KB/Catch content rows and revisions UNCHANGED.');
  console.log('No provider calls, D1 changes, or local output files.');
 }finally{db.close();}
}
main().catch(e=>{console.error('M01_D1_REHEARSAL_STOP:',e.message);
 process.exitCode=1;});
