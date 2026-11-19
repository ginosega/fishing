import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareD6GearMigration} from '../tools/d6-gear-migration.mjs';

let cached;
const prepare=async()=>cached??=(await prepareD6GearMigration());

test('V3-GEAR-MIG01 frozen 100 Gear catalog and all media are inventoried',async()=>{
 const {sql,report}=await prepare();
 assert.equal(report.format,'d6-direct-gear-import-v1');
 assert.equal(report.source.gearGitBlobSha1,
  '741ba8f19c06834eb6e92fea84404fdb2ac58f88');
 assert.deepEqual(report.counts,{
  records:100,newInserts:99,linkedNotes:63,
  referencedPictures:100,gearImageAssets:112,
 });
 assert.equal(report.records.length,100);
 assert.equal(report.assets.length,112);
 assert.equal(new Set(report.records.map(r=>r.id)).size,100);
 assert.equal(new Set(report.assets.map(r=>r.path)).size,112);
 assert.equal(Object.values(report.categories).reduce((a,b)=>a+b,0),100);
 assert.equal(report.records.filter(r=>r.notesPath).length,63);
 for(const row of report.records){
  assert.match(row.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.match(row.recordSha256,/^[a-f0-9]{64}$/);
  assert.match(row.pictureSha256,/^[a-f0-9]{64}$/);
  if(row.notesPath)assert.match(row.notesSha256,/^[a-f0-9]{64}$/);
 }
 assert.equal(report.pilot.id,'daiwa-tatula-xt-rod');
 assert.equal(report.pilot.policy,'preserve-existing-row-and-revision');
 assert.equal((sql.match(/^INSERT INTO d6_gear_records\(/gm)||[]).length,99);
});

test('V3-GEAR-MIG02 prepared import never updates or deletes live pilot data',async()=>{
 const {sql}=await prepare();
 assert.doesNotMatch(sql,/INSERT INTO d6_gear_records\(id,revision,record_json,notes_text,updated_at\) VALUES\('daiwa-tatula-xt-rod'/);
 assert.match(sql,/ON CONFLICT\(id\) DO NOTHING;/);
 assert.equal(sql.split('\n').some(line=>
  /^\s*(?:UPDATE|DELETE|DROP|ALTER|REPLACE|CREATE|BEGIN|COMMIT)\b/i.test(line)),false);
 assert.equal((sql.match(/ON CONFLICT\(id\) DO NOTHING;/g)||[]).length,99);
 assert.match(sql,/"value":"7''"/); // SQL escaping protects apostrophes inside Gear JSON
});

test('V3-GEAR-MIG03 provenance and hashed asset entries are deterministic',async()=>{
 const {report}=await prepare();
 const original=report.records.find(x=>x.id==='daiwa-tatula-xt-rod');
 assert.equal(original.notesPath,'Gear/Rods-Reels/content/Daiwa Tatula XT.md');
 assert.equal(original.picturePath,'Gear/Rods-Reels/assets/daiwa-tatula-xt.webp');
 assert.equal(report.assets.find(x=>x.path===original.picturePath)?.sha256,
  original.pictureSha256);
 assert.equal(report.assets.every(x=>x.bytes>0),true);
});
