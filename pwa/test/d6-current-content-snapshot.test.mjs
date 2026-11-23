import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createD6CurrentContentSnapshot,isD6CurrentContentSnapshotCompatible}
 from '../server/d6-current-content-snapshot.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const specs=[
 {domain:'gear',bundle:'Gear/gear.json',array:'items',table:'d6_gear_records',column:'notes_text',text:'notes'},
 {domain:'kb',bundle:'KB/kb.json',array:'entities',table:'d6_kb_records',column:'content_text',text:'content'},
 {domain:'catches',bundle:'Catches/catches.json',array:'catches',table:'d6_catch_records',column:'notes_text',text:'notes'},
];
const file=p=>readFileSync(path.join(root,p));
const inventory=JSON.parse(gunzipSync(file(
 'migration/d6-historic-media-inventory.json.gz')).toString('utf8'));
const mimeOf=p=>{
 const ext=p.split('.').at(-1).toLowerCase();
 return {jpg:'image/jpeg',jpeg:'image/jpeg',
  png:'image/png',webp:'image/webp',gif:'image/gif'}[ext];
};

function fixture(){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec('PRAGMA foreign_keys=ON');
 for(const spec of specs)sqlite.exec(
  'CREATE TABLE '+spec.table+' (id TEXT PRIMARY KEY,revision INTEGER NOT NULL,'+
  'record_json TEXT NOT NULL,'+spec.column+' TEXT NOT NULL)'
 );
 sqlite.exec(
  'CREATE TABLE d6_media_objects ('+
  'sha256 TEXT PRIMARY KEY,storage_key TEXT,mime TEXT,bytes INTEGER)');
 sqlite.exec(
  'CREATE TABLE d6_media_refs ('+
  'logical_path TEXT,domain TEXT,record_id TEXT,sha256 TEXT,historical INTEGER,'+
  'PRIMARY KEY(logical_path,domain,record_id))');
 for(const spec of specs){
  const data=JSON.parse(file(spec.bundle).toString('utf8'));
  const insert=sqlite.prepare('INSERT INTO '+spec.table+
   ' (id,revision,record_json,'+spec.column+') VALUES (?,?,?,?)');
  for(const item of data[spec.array]){
   const markdown=item[spec.text]?
    file(item[spec.text]).toString('utf8'):'';
   insert.run(item.id,1,JSON.stringify(item),markdown);
  }
 }
 const putObject=sqlite.prepare('INSERT OR IGNORE INTO d6_media_objects '+
  '(sha256,storage_key,mime,bytes) VALUES (?,?,?,?)');
 const putRef=sqlite.prepare('INSERT OR IGNORE INTO d6_media_refs '+
  '(logical_path,domain,record_id,sha256,historical) VALUES (?,?,?,?,?)');
 for(const asset of inventory.assets){
  putObject.run(asset.sha256,'staged/v1/sha256/'+asset.sha256,
   mimeOf(asset.path),asset.bytes);
  for(const source of asset.references)putRef.run(
   asset.path,source.domain,source.id,asset.sha256,1);
 }
 let batchCalls=0,onRead=()=>{},statementsSeen=[];
 const CONTENT_DB={
  prepare(sql){return {sql};},
  async batch(statements){
   batchCalls++;statementsSeen=statements.map(x=>x.sql);
   sqlite.exec('BEGIN');
   try{
    const result=statements.map(x=>({
     success:true,results:sqlite.prepare(x.sql).all(),
    }));
    sqlite.exec('COMMIT');
    onRead();
    return result;
   }catch(e){sqlite.exec('ROLLBACK');throw e;}
  },
 };
 return {
  sqlite,CONTENT_DB,
  reads:()=>({batchCalls,statementsSeen}),
  afterRead:fn=>{onRead=fn;},
  close:()=>sqlite.close(),
 };
}

test('O01 reads one coherent D1 transaction and hashes current content independently of software',async()=>{
 const f=fixture();
 try{
  const first=await createD6CurrentContentSnapshot(f);
  const second=await createD6CurrentContentSnapshot(f);
  assert.equal(first.format,'fishing-content-snapshot-v1');
  assert.deepEqual(first.readerCompatibility,{min:1,max:1});
  assert.deepEqual(first.schemaVersions,{gear:2,kb:2,catches:2});
  assert.deepEqual([first.counts.gear,first.counts.kb,first.counts.catches],
   [100,60,12]);
  assert.equal(first.records.length,172);
  assert.ok(first.images.length>=250);
  assert.ok(first.counts.imageObjects<=272);
  assert.match(first.contentId,/^[a-f0-9]{64}$/);
  assert.equal(second.contentId,first.contentId);
  assert.equal(first.mediaVerification,'registry-only');
  assert.equal(isD6CurrentContentSnapshotCompatible(first),true);
  assert.equal(isD6CurrentContentSnapshotCompatible(first,2),false);
  assert.equal(isD6CurrentContentSnapshotCompatible({...first,
   readerCompatibility:{min:2,max:3}}),false);
  const reads=f.reads();
  assert.equal(reads.batchCalls,2);
  assert.equal(reads.statementsSeen.length,5);
  assert.ok(reads.statementsSeen.every(s=>/^\s*SELECT\b/i.test(s)));
  assert.ok(first.images.every(x=>x.owners.length>0&&
   x.storageKey==='staged/v1/sha256/'+x.sha256));
 }finally{f.close();}
});

test('O01 fails closed when current content has an unregistered image',async()=>{
 const f=fixture();
 try{
  const baseline=await createD6CurrentContentSnapshot(f);
  const media=baseline.images[0],owner=media.owners[0];
  f.sqlite.prepare('DELETE FROM d6_media_refs WHERE logical_path=? AND domain=? AND record_id=?')
   .run(media.logicalPath,owner.domain,owner.recordId);
  await assert.rejects(createD6CurrentContentSnapshot(f),
   /O01_SNAPSHOT_UNVERIFIED: Missing D1 association/);
 }finally{f.close();}
});

test('O01 omits inert historical media associations but leaves them untouched',async()=>{
 const f=fixture();
 try{
  const baseline=await createD6CurrentContentSnapshot(f);
  const photo=baseline.images.find(x=>x.mime==='image/jpeg');
  assert.ok(photo);
  const refsBefore=f.sqlite.prepare('SELECT COUNT(*) AS n FROM d6_media_refs').get().n;
  f.sqlite.prepare('INSERT INTO d6_media_refs VALUES (?,?,?,?,?)')
   .run('Gear/Lures/assets/deleted-image.jpg',
    'gear','berkley-warpig',photo.sha256,1);
  const next=await createD6CurrentContentSnapshot(f);
  assert.equal(next.counts.imagePaths,baseline.counts.imagePaths);
  assert.equal(next.counts.retainedUnlinkedRefs,
   baseline.counts.retainedUnlinkedRefs+1);
  assert.ok(!next.images.some(x=>x.logicalPath==='Gear/Lures/assets/deleted-image.jpg'));
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM d6_media_refs').get().n,
   refsBefore+1,'snapshot must not alter historical D1 refs');
 }finally{f.close();}
});

test('O01 pins a complete transaction snapshot against a later write',async()=>{
 const f=fixture();
 try{
  const before=await createD6CurrentContentSnapshot(f);
  f.afterRead(()=>f.sqlite.prepare(
   'UPDATE d6_gear_records SET revision=revision+1 WHERE id=?'
  ).run('berkley-warpig'));
  const captured=await createD6CurrentContentSnapshot(f);
  f.afterRead(()=>{});
  assert.equal(captured.contentId,before.contentId,
   'write after the D1 transaction cannot enter its snapshot');
  const after=await createD6CurrentContentSnapshot(f);
  assert.notEqual(after.contentId,before.contentId);
 }finally{f.close();}
});

test('O01 refuses malformed D1 record content and no incomplete manifest escapes',async()=>{
 const f=fixture();
 try{
  f.sqlite.prepare('UPDATE d6_gear_records SET record_json=? WHERE id=?')
   .run('{"id":"berkley-warpig"}','berkley-warpig');
  await assert.rejects(createD6CurrentContentSnapshot(f),
   /O01_SNAPSHOT_UNVERIFIED/);
 }finally{f.close();}
});

test('O01 rejects an extra nonhistorical ref but preserves inert historic refs',async()=>{
 const f=fixture();
 try{
  const baseline=await createD6CurrentContentSnapshot(f);
  const photo=baseline.images.find(x=>x.mime==='image/jpeg');
  assert.ok(photo);
  f.sqlite.prepare('INSERT INTO d6_media_refs VALUES (?,?,?,?,?)')
   .run('Gear/Lures/assets/unlinked-new-photo.jpg',
    'gear','berkley-warpig',photo.sha256,0);
  await assert.rejects(createD6CurrentContentSnapshot(f),
   /O01_SNAPSHOT_UNVERIFIED: Unlinked current media association/);
 }finally{f.close();}
});

test('O01 rejects broken Markdown record links and missing local resources',async()=>{
 const f=fixture();
 try{
  const original=f.sqlite.prepare(
   'SELECT content_text FROM d6_kb_records WHERE id=?'
  ).get('bowline-knot').content_text;
  const setMarkdown=text=>f.sqlite.prepare(
   'UPDATE d6_kb_records SET content_text=? WHERE id=?'
  ).run(text,'bowline-knot');
  setMarkdown(original+'\n\n[Missing](kb://missing-record)');
  await assert.rejects(createD6CurrentContentSnapshot(f),
   /O01_SNAPSHOT_UNVERIFIED: Invalid Markdown link/);
  setMarkdown(original+'\n\n[Missing](missing-article.md)');
  await assert.rejects(createD6CurrentContentSnapshot(f),
   /O01_SNAPSHOT_UNVERIFIED: Unresolved Markdown link resource/);
  setMarkdown(original);
  const baseline=await createD6CurrentContentSnapshot(f);
  assert.equal(baseline.counts.kb,60);
 }finally{f.close();}
});
