import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {prepareD6KBMigration} from '../tools/d6-kb-migration.mjs';

let cached;
const source=async()=>cached??=(await prepareD6KBMigration());
test('V3-KB-MIG01 original KB source, 60 Markdown and all 154 images',async()=>{
 const {sql,report}=await source();
 assert.equal(report.format,'d6-direct-kb-import-v1');
 assert.equal(report.source.kbGitBlobSha1,'39217633803ad3969d710fa8d770197c0e83b2a3');
 assert.deepEqual(report.counts,{records:60,newInserts:60,linkedMarkdown:60,
  kbImageAssets:154,recordPictureRefs:55,knotSequenceFrames:111});
 assert.deepEqual(report.types,{location:10,species:8,equipment:23,technique:9,knot:10});
 assert.equal(report.records.length,60);
 assert.equal(new Set(report.records.map(r=>r.id)).size,60);
 assert.equal(new Set(report.records.map(r=>r.contentPath)).size,60);
 assert.equal(report.assets.length,154);
 assert.equal(new Set(report.assets.map(x=>x.path)).size,154);
 assert.equal((sql.match(/^INSERT INTO d6_kb_records\(/gm)||[]).length,60);
});
test('V3-KB-MIG02 insert-only, no update/delete of prior Gear or KB rows',async()=>{
 const {sql}=await source();
 assert.match(sql,/^CREATE TABLE IF NOT EXISTS d6_kb_records/m);
 assert.equal((sql.match(/ON CONFLICT\(id\) DO NOTHING;/g)||[]).length,60);
 assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|DROP|REPLACE)\s+d6_/i);
 assert.doesNotMatch(sql,/d6_gear_records/);
 assert.ok(sql.includes("INSERT INTO d6_kb_records"));
});
test('V3-KB-MIG03 knot sequence frame paths preserved exactly',async()=>{
 const {report}=await source();
 const fg=report.records.find(r=>r.id==='knot-fg');
 assert.equal(fg.sequencePaths.length,29);
 assert.equal(fg.picturePath,fg.sequencePaths.at(-1));
 assert.equal(fg.contentPath,'KB/Knots/content/fg-knot.md');
 for(const entry of report.records){
  assert.match(entry.recordSha256,/^[a-f0-9]{64}$/);
  assert.match(entry.markdownSha256,/^[a-f0-9]{64}$/);
  for(const frame of entry.sequencePaths)
   assert.ok(report.assets.some(x=>x.path===frame));
 }
});
test('V3-KB-MIG04 Windows checkout CRLF cannot change canonical KB import',async()=>{
 const git=(name)=>execFileSync('git',['show','HEAD:pwa/'+name],{
  cwd:new URL('..',import.meta.url),windowsHide:true,
 });
 const blob=bytes=>createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes,
 ])).digest('hex');
 const base=git('KB/kb.json'),crlf=Buffer.from(base.toString('utf8').replace(/\n/g,'\r\n'));
 assert.equal(blob(base),'39217633803ad3969d710fa8d770197c0e83b2a3');
 assert.notEqual(blob(base),blob(crlf));
 const {report}=await source();
 const first=report.records[0];
 const md=git(first.contentPath);
 assert.equal(first.markdownSha256,createHash('sha256').update(md).digest('hex'));
});
