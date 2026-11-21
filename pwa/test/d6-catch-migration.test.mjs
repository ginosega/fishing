import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {prepareD6CatchMigration} from '../tools/d6-catch-migration.mjs';

let cached;
const source=async()=>cached??=await prepareD6CatchMigration();
test('V3-CATCH-MIG01 frozen 12 original Catch records and 12 Notes',async()=>{
 const {sql,report}=await source();
 assert.equal(report.format,'d6-direct-catch-import-v1');
 assert.equal(report.source.catchGitBlobSha1,
  '1522cf990f3ac6422ef17970793ec86604007a5a');
 assert.deepEqual(report.counts,{
  records:12,newInserts:12,linkedMarkdown:12,
  imageAssets:8,usedImages:8,inlineImageRefs:10,
 });
 assert.equal(report.records.length,12);
 assert.equal(new Set(report.records.map(x=>x.id)).size,12);
 assert.equal(new Set(report.records.map(x=>x.notesPath)).size,12);
 assert.equal(report.assets.length,8);
 assert.equal((sql.match(/^INSERT INTO d6_catch_records\(/gm)||[]).length,12);
});
test('V3-CATCH-MIG02 SQL inserts only; Gear and KB untouched',async()=>{
 const {sql}=await source();
 assert.match(sql,/^CREATE TABLE IF NOT EXISTS d6_catch_records/m);
 assert.equal((sql.match(/ON CONFLICT\(id\) DO NOTHING;/g)||[]).length,12);
 assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|DROP|REPLACE)\s+d6_/i);
 assert.doesNotMatch(sql,/d6_gear_records|d6_kb_records/);
});
test('V3-CATCH-MIG03 original photo links, hashes and CRLF are preserved',async()=>{
 const {report}=await source();
 const assets=new Set(report.assets.map(x=>x.path));
 for(const row of report.records){
  assert.match(row.recordSha256,/^[a-f0-9]{64}$/);
  assert.match(row.notesSha256,/^[a-f0-9]{64}$/);
  assert.equal(row.notesPath,'Catches/content/'+row.id+'.md');
  for(const ref of row.inlineImagePaths)assert.ok(assets.has(ref));
 }
 const git=(name)=>execFileSync('git',['show','HEAD:pwa/'+name],{
  cwd:new URL('..',import.meta.url),windowsHide:true,
 });
 const base=git('Catches/catches.json');
 const sha=bytes=>createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes,
 ])).digest('hex');
 assert.equal(sha(base),'1522cf990f3ac6422ef17970793ec86604007a5a');
 const original=git(report.records[0].notesPath);
 assert.equal(createHash('sha256').update(original).digest('hex'),
  report.records[0].notesSha256);
});
