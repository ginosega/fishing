import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {prepareD6Wp3H1Migrations}
 from '../tools/prepare-d6-wp3-h1-migrations.mjs';
import {D6_WP3_D1_SCHEMA_PLAN}
 from '../../experiments/p3/preview/src/d6-production-wp3-d1-readiness.mjs';

const SHA='b73a2cb0fc8b474aec3c3623b9a728a1aba0ad83';
const digest=b=>createHash('sha256').update(b).digest('hex');
async function fixture(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'fish-wp3-h1-sql-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 return {root,dest:path.join(root,'prepared')};
}

test('WP3-H1SQL01 only two AUTH-P0 and ten source-owned operation tables',async t=>{
 const x=await fixture(t);
 const report=await prepareD6Wp3H1Migrations({
  destination:x.dest,sourceRevision:SHA,
 });
 assert.equal(report.prepared,true);
 assert.equal(report.executed,false);
 assert.equal(report.hostedVerified,false);
 assert.equal(report.canPublish,false);
 assert.equal(report.writeAuthorized,false);
 assert.equal(report.sourceRevision,SHA);
 assert.equal(report.targetAuthDb,'fishing-v3-wp3-auth-test');
 assert.equal(report.targetOperationsDb,'fishing-v3-wp3-operations-test');
 assert.equal(report.auth.tables.length,2);
 assert.equal(report.operations.tables.length,10);
 const names=(await fs.readdir(x.dest)).sort();
 assert.deepEqual(names,['auth.sql','manifest.json','operations.sql']);
 const auth=await fs.readFile(path.join(x.dest,'auth.sql'),'utf8');
 const op=await fs.readFile(path.join(x.dest,'operations.sql'),'utf8');
 const manifest=JSON.parse(await fs.readFile(
  path.join(x.dest,'manifest.json'),'utf8'));
 assert.deepEqual(manifest,report);
 assert.equal(digest(auth),report.auth.sha256);
 assert.equal(digest(op),report.operations.sha256);
 for(const [name,sql]of [
  ['auth_flows',auth],['sessions',auth],
  ...D6_WP3_D1_SCHEMA_PLAN.map(x=>[x.table,op]),
 ])
  assert.match(sql,new RegExp('CREATE TABLE IF NOT EXISTS '+name+' \\('));
});

test('WP3-H1SQL02 operations SQL is identical to canonical runtime source and preserves uniqueness',async t=>{
 const x=await fixture(t);
 await prepareD6Wp3H1Migrations({
  destination:x.dest,sourceRevision:SHA,
 });
 const actual=await fs.readFile(path.join(x.dest,'operations.sql'),'utf8');
 assert.equal(actual,D6_WP3_D1_SCHEMA_PLAN.map(x=>
  x.sql.trim()).join('\n\n')+'\n');
 assert.match(actual,/UNIQUE\(owner_github_id,idempotency_key\)/);
 assert.match(actual,/CREATE UNIQUE INDEX IF NOT EXISTS d6_operation_active_record/);
 assert.equal((actual.match(/\bCREATE TABLE IF NOT EXISTS\b/g)||[]).length,10);
 for(const verb of ['DROP TABLE','DELETE FROM','ALTER TABLE','UPDATE '])
  assert(!actual.includes(verb));
});

test('WP3-H1SQL03 never overwrite, accept an unknown SHA or produce a Cloudflare mutation',async t=>{
 const x=await fixture(t);
 for(const bad of [undefined,'',null,'HEAD','f'.repeat(41)]){
  await assert.rejects(prepareD6Wp3H1Migrations({
   destination:x.dest,sourceRevision:bad,
  }),/denied/);
 }
 assert.deepEqual(await fs.readdir(x.root),[]);
 await prepareD6Wp3H1Migrations({destination:x.dest,sourceRevision:SHA});
 await assert.rejects(prepareD6Wp3H1Migrations({
  destination:x.dest,sourceRevision:SHA,
 }),/already exists/);
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
 for(const inside of [root,path.join(root,'pwa/dist-wp3-demo')]){
  await assert.rejects(prepareD6Wp3H1Migrations({
   destination:inside,sourceRevision:SHA,
  }),/outside the repository/);
 }
});
