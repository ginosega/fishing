import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {inspectContent,prepareBackup} from '../../backups/prepare.mjs';
const bytes=Buffer.from('synthetic original');
const digest=createHash('sha256').update(bytes).digest('hex');
const revision='a'.repeat(40);
function fixture({media=true,extra='',refs=true}={}){
 return Buffer.from(`
CREATE TABLE d6_gear_records (id TEXT PRIMARY KEY, notes_text TEXT);
CREATE TABLE d6_kb_records (id TEXT PRIMARY KEY);
CREATE TABLE d6_catch_records (id TEXT PRIMARY KEY);
CREATE TABLE d6_media_objects (sha256 TEXT PRIMARY KEY, storage_key TEXT UNIQUE, mime TEXT, bytes INTEGER);
CREATE TABLE d6_media_refs (logical_path TEXT, domain TEXT, record_id TEXT, sha256 TEXT REFERENCES d6_media_objects(sha256));
CREATE INDEX d6_media_refs_owner_idx ON d6_media_refs(domain,record_id);
CREATE INDEX d6_media_refs_path_idx ON d6_media_refs(logical_path);
CREATE TRIGGER d6_media_same_path_sha BEFORE INSERT ON d6_media_refs BEGIN SELECT 1; END;
INSERT INTO d6_gear_records VALUES('test','Café – fishing 🎣');
${media?`INSERT INTO d6_media_objects VALUES('${digest}','original/${digest}','image/jpeg',${bytes.length});`:''}
${media&&refs?`INSERT INTO d6_media_refs VALUES('Gear/test.jpg','gear','test','${digest}');`:''}
${extra}
`,'utf8');
}
test('A01 backup preserves exact UTF-8 SQL and all registered original bytes without fixed counts',async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'fish-backup-'));
 try{
  const input=fixture(),stage=path.join(temp,'stage');
  const calls=[];
  const manifest=await prepareBackup({input,stage,sourceRevision:revision,fetchOriginal:async row=>{calls.push(row.storage_key);return bytes;}});
  assert.equal(manifest.database.gear,1);
  assert.equal(manifest.database.kb,0);
  assert.equal(manifest.database.mediaRefs,1);
  assert.equal(manifest.imageCount,1);
  assert.equal(manifest.imageBytes,bytes.length);
  assert.deepEqual(calls,['original/'+digest]);
  assert.deepEqual(await fs.readFile(path.join(stage,'content.sql')),input);
  assert.deepEqual(await fs.readFile(path.join(stage,'images',digest)),bytes);
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(stage,'manifest.json'),'utf8')),manifest);
  assert.deepEqual((await fs.readdir(stage)).sort(),['README.txt','content.sql','images','manifest.json']);
 }finally{await fs.rm(temp,{recursive:true,force:true});}
});
test('A01 backup rejects unexpected authentication tables, malformed SQL and broken references',()=>{
 assert.throws(()=>inspectContent(fixture({extra:'CREATE TABLE sessions (secret TEXT);'})),/Unexpected content tables/);
 assert.throws(()=>inspectContent(fixture({media:false,extra:"INSERT INTO d6_media_refs VALUES('x','gear','test','missing');"})),/Foreign key/);
 assert.throws(()=>inspectContent(Buffer.from([0xff])),/encoded data|UTF-8/i);
});
test('A01 backup refuses wrong original bytes before final manifest; handles empty registry',async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'fish-backup-'));
 try{
  const bad=path.join(temp,'bad');
  await assert.rejects(prepareBackup({input:fixture(),stage:bad,sourceRevision:revision,fetchOriginal:async()=>Buffer.alloc(bytes.length)}),/Original integrity mismatch/);
  await assert.rejects(fs.stat(path.join(bad,'manifest.json')),{code:'ENOENT'});
  const empty=await prepareBackup({input:fixture({media:false}),stage:path.join(temp,'empty'),sourceRevision:revision,fetchOriginal:async()=>{throw Error('Unexpected fetch');}});
  assert.equal(empty.imageCount,0);
  assert.equal(empty.imageBytes,0);
 }finally{await fs.rm(temp,{recursive:true,force:true});}
});
