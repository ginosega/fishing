import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {encodedPath} from '../src/shared.mjs';
import {noteImageReference} from '../src/notes-markdown-editor.mjs';
import {D6_MEDIA_SCHEMA_SQL} from '../tools/d6-media-schema.mjs';
import {createD2UnifiedOwnerSession}
 from '../../experiments/p3/preview/src/d2-unified-owner-session.mjs';
import {createD6SharedMediaLive,publishD6MediaRevision,
 isD6NotesImageLinked} from '../server/d6-shared-media-live.mjs';

const origin='https://fishing-d6-wp2-test.ginosega.workers.dev';
const cookie='__Host-fish_p0_session='+'A'.repeat(43);
const image=Uint8Array.from(Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+i1ZkAAAAASUVORK5CYII=','base64'));
const sha=createHash('sha256').update(image).digest('hex');
const key='staged/v1/sha256/'+sha;
const pathOf=domain=>domain==='gear'?
 'Gear/Lures/assets/lure-media-test/notes/tiny.png':
 domain==='kb'?'KB/Species/assets/species-media-test/notes/tiny.png':
 'Catches/assets/catch-media-test/notes/tiny.png';
const recordOf=domain=>domain==='gear'?
 {id:'lure-media-test',category:'lures',type:'spinner',
  name:'Test Lure',notes:'Gear/Lures/content/Test Lure.md'}:
 domain==='kb'?
 {id:'species-media-test',type:'species',name:'Test Fish',
  content:'KB/Species/content/Test Fish.md'}:
 {id:'catch-media-test',date:'2026-11-20',
  notes:'Catches/content/catch-media-test.md'};
const dbOf=domain=>domain==='gear'?'d6_gear_records':
 domain==='kb'?'d6_kb_records':'d6_catch_records';
const fieldOf=domain=>domain==='kb'?'content_text':'notes_text';
const markdownOf=domain=>'A real linked image\n\n![Catch detail]('+
 noteImageReference(pathOf(domain))+')';
const manifestOf=domain=>[{logicalPath:pathOf(domain),sha256:sha,
 bytes:image.length,contentType:'image/png'}];

function fixture(){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec('PRAGMA foreign_keys=ON');
 for(const name of ['d6_gear_records','d6_catch_records']){
  sqlite.exec('CREATE TABLE '+name+' ('+
   'id TEXT PRIMARY KEY,revision INTEGER NOT NULL,'+
   'record_json TEXT NOT NULL,notes_text TEXT NOT NULL,'+
   'updated_at INTEGER NOT NULL)');
 }
 sqlite.exec('CREATE TABLE d6_kb_records ('+
  'id TEXT PRIMARY KEY,revision INTEGER NOT NULL,'+
  'record_json TEXT NOT NULL,content_text TEXT NOT NULL,'+
  'updated_at INTEGER NOT NULL)');
 sqlite.exec(D6_MEDIA_SCHEMA_SQL);
 let beforeBatch=()=>{},batches=0;
 function seed(domain,revision=1,record=recordOf(domain),markdown='Original notes'){
  sqlite.prepare('INSERT INTO '+dbOf(domain)+
   ' (id,revision,record_json,'+fieldOf(domain)+',updated_at)'+
   ' VALUES(?,?,?,?,?)').run(record.id,revision,
    JSON.stringify(record),markdown,1234);
 }
 function count(table){
  return sqlite.prepare('SELECT COUNT(*) AS n FROM '+table).get().n;
 }
 const CONTENT_DB={
  prepare(sql){
   return {bind(...args){
    return {sql,args,
     async first(){return sqlite.prepare(sql).get(...args)??null;},
     async all(){return {results:sqlite.prepare(sql).all(...args)};},
     async run(){
      const info=sqlite.prepare(sql).run(...args);
      return {success:true,meta:{changes:Number(info.changes)}};
     },
    };
   }};
  },
  async batch(statements){
   batches++;beforeBatch();
   sqlite.exec('BEGIN IMMEDIATE');
   const result=[];
   try{
    for(const statement of statements){
     const sql=statement.sql,args=statement.args;
     if(sql.trimStart().startsWith('SELECT')){
      result.push({success:true,
       results:sqlite.prepare(sql).all(...args),meta:{changes:0}});
     }else{
      const info=sqlite.prepare(sql).run(...args);
      result.push({success:true,results:[],
       meta:{changes:Number(info.changes)}});
     }
    }
    sqlite.exec('COMMIT');
    return result;
   }catch(error){
    sqlite.exec('ROLLBACK');throw error;
   }
  },
 };
 const objects=new Map();
 objects.set(key,{
  key,size:image.length,bytes:image,
  httpMetadata:{contentType:'image/png'},
  customMetadata:{sha256:sha},
 });
 const R2={
  async head(k){const item=objects.get(k);return item?{...item}:null;},
  async get(k){const item=objects.get(k);return item?{...item,body:item.bytes}:null;},
 };
 const AUTH_DB={prepare(){
  return {bind(){return {first:async()=>({
   github_id:265665562,expires_at:1003600,
  })};}};
 }};
 const csrfKey='S'.repeat(64),now=()=>1000000;
 const auth=createD2UnifiedOwnerSession({AUTH_DB,
  ownerGitHubId:265665562,csrfKey,origin,now});
 const params={CONTENT_DB,R2,AUTH_DB,csrfKey,origin,now};
 const live=options=>createD6SharedMediaLive({...params,...options});
 const publish=(domain,options={})=>
  publishD6MediaRevision({...params,domain,record:recordOf(domain),
   markdown:markdownOf(domain),expectedRevision:1,
   media:manifestOf(domain),...options});
 const query=(sql,...args)=>sqlite.prepare(sql).get(...args);
 const url=domain=>origin+'/api/v3/media/live/'+encodedPath(pathOf(domain));
 return {sqlite,seed,count,query,R2,objects,CONTENT_DB,params,
  live,publish,url,auth,now,batches:()=>batches,
  beforeBatch:fn=>{beforeBatch=fn;}};
}
test('V3-MEDIA-LIVE01 default OFF; existing record and metadata untouched',async()=>{
 const f=fixture();f.seed('gear');
 const svc=f.live();
 assert.equal((await svc.handle(new Request(f.url('gear')))).status,503);
 assert.equal((await svc.handle(new Request(origin+'/api/v3/media/publish',{
  method:'POST',headers:{'Content-Type':'application/json'},
  body:'{}',
 }))).status,503);
 assert.equal(f.count('d6_media_refs'),0);
 assert.equal(f.batches(),0);
});
test('V3-MEDIA-LIVE02 real SQLite batch atomically commits all 3 domains',async()=>{
 const f=fixture();
 for(const domain of ['gear','kb','catches'])f.seed(domain);
 for(const domain of ['gear','kb','catches']){
  const published=await f.publish(domain);
  assert.equal(published.status,200,domain+': '+published.error);
  assert.equal(published.result.revision,2);
  assert.equal(published.result.published,true);
  assert.equal(f.query('SELECT revision FROM '+dbOf(domain)+
   ' WHERE id=?',recordOf(domain).id).revision,2);
  assert.equal((await f.live({enabled:()=>true}).handle(
   new Request(f.url(domain)))).status,200);
 }
 assert.equal(f.count('d6_media_objects'),1);
 assert.equal(f.count('d6_media_refs'),3);
 const got=await f.live({enabled:()=>true}).handle(new Request(f.url('kb')));
 assert.equal(got.headers.get('Content-Type'),'image/png');
 assert.equal(got.headers.get('Cache-Control'),'private, no-store');
 assert.equal(got.headers.get('ETag'),'"'+sha+'"');
 assert.deepEqual(new Uint8Array(await got.arrayBuffer()),image);
 assert.equal((await f.live({enabled:()=>true}).handle(
  new Request(f.url('kb'),{method:'HEAD'}))).status,200);
});
test('V3-MEDIA-LIVE03 missing D1 ref never exposes staged R2 bytes',async()=>{
 const f=fixture();f.seed('gear');
 const service=f.live({enabled:()=>true});
 assert.equal((await service.handle(new Request(f.url('gear')))).status,404);
 assert.equal((await service.handle(new Request(origin+
  '/api/v3/media/live/staged/v1/sha256/'+sha))).status,404);
 assert.equal(f.count('d6_media_refs'),0);
});
test('V3-MEDIA-LIVE04 stale Save and path collision roll back all D1 edits',async()=>{
 const f=fixture();f.seed('gear');
 let outcome=await f.publish('gear',{expectedRevision:2});
 assert.equal(outcome.status,409);
 assert.equal(f.count('d6_media_refs'),0);
 assert.equal(f.query('SELECT revision FROM d6_gear_records').revision,1);
 // Simulated concurrent edit between readback and BEGIN transaction.
 f.beforeBatch(()=>{f.sqlite.prepare(
  'UPDATE d6_gear_records SET revision=revision+1').run();});
 outcome=await f.publish('gear');
 assert.equal(outcome.status,409);
 assert.equal(f.query('SELECT revision FROM d6_gear_records').revision,2);
 assert.equal(f.count('d6_media_refs'),0);
 assert.equal(f.count('d6_media_objects'),0);
 f.beforeBatch(()=>{});
 outcome=await f.publish('gear',{expectedRevision:2});
 assert.equal(outcome.status,200);
 const first=f.query('SELECT revision,record_json FROM d6_gear_records');
 outcome=await f.publish('gear',{expectedRevision:3,
  record:{...recordOf('gear'),name:'This update must roll back'}});
 assert.equal(outcome.status,503);
 assert.deepEqual(f.query('SELECT revision,record_json FROM d6_gear_records'),
  first);
 assert.equal(f.count('d6_media_refs'),1);
});
test('V3-MEDIA-LIVE05 unlinked or missing/corrupt staged bytes denied',async()=>{
 const f=fixture();f.seed('kb');
 let result=await f.publish('kb',{markdown:'Only a normal URL: '+
  noteImageReference(pathOf('kb'))});
 assert.equal(result.status,503);
 assert.equal(f.count('d6_media_refs'),0);
 f.objects.set(key,{...f.objects.get(key),size:image.length+1});
 result=await f.publish('kb');
 assert.equal(result.status,503);
 assert.equal(f.count('d6_media_refs'),0);
 assert.equal(f.query('SELECT revision FROM d6_kb_records').revision,1);
});
test('V3-MEDIA-LIVE06 deleted Markdown image becomes unreadable',async()=>{
 const f=fixture();f.seed('gear');
 assert.equal((await f.publish('gear')).status,200);
 assert.equal((await f.live({enabled:()=>true}).handle(
  new Request(f.url('gear')))).status,200);
 f.sqlite.prepare('UPDATE d6_gear_records SET notes_text=?')
  .run('Image no longer linked');
 assert.equal((await f.live({enabled:()=>true}).handle(
  new Request(f.url('gear')))).status,404);
});
test('V3-MEDIA-LIVE07 Catch Add with expectedRevision 0 is atomic',async()=>{
 const f=fixture();
 const added=await f.publish('catches',{expectedRevision:0});
 assert.equal(added.status,200);
 assert.equal(added.result.revision,1);
 assert.equal(f.count('d6_media_refs'),1);
 assert.equal(f.query('SELECT revision FROM d6_catch_records').revision,1);
 assert.equal((await f.publish('catches',{expectedRevision:0})).status,409);
 assert.equal(f.count('d6_media_refs'),1);
});
test('M02 Gear and KB revision-zero media Add is insert-only and readable',async()=>{
 for(const domain of ['gear','kb']){
  const f=fixture();
  const created=await f.publish(domain,{expectedRevision:0});
  assert.equal(created.status,200,domain+': '+created.error);
  assert.equal(created.result.revision,1);
  assert.equal(f.count(dbOf(domain)),1);
  assert.equal(f.count('d6_media_refs'),1);
  assert.equal((await f.live({enabled:()=>true}).handle(
   new Request(f.url(domain)))).status,200);
  const duplicate=await f.publish(domain,{expectedRevision:0});
  assert.equal(duplicate.status,409,'revision zero must never edit');
  assert.equal(f.count(dbOf(domain)),1);
  assert.equal(f.count('d6_media_refs'),1);
 }
});
test('M02 new Gear/KB cover images insert atomically with owner records',async()=>{
 for(const domain of ['gear','kb']){
  const f=fixture();
  const path=domain==='gear'?
   'Gear/Lures/assets/new-cover.png':
   'KB/Species/assets/new-cover.png';
  const record={...recordOf(domain),picture:{src:path}};
  const result=await f.publish(domain,{record,expectedRevision:0,
   markdown:'An owner record with a new cover',
   media:[{logicalPath:path,sha256:sha,bytes:image.length,
    contentType:'image/png'}]});
  assert.equal(result.status,200,domain+': '+result.error);
  assert.equal(result.result.revision,1);
  assert.equal(f.count('d6_media_refs'),1);
  assert.equal((await f.live({enabled:()=>true}).handle(new Request(
   origin+'/api/v3/media/live/'+encodedPath(path)))).status,200);
 }
});
test('M02 Gear/KB duplicate Markdown-path Add rolls back media metadata',async()=>{
 for(const domain of ['gear','kb']){
  const f=fixture();f.seed(domain);
  const record={...recordOf(domain),id:'other-owner-id'};
  const path=domain==='gear'?
   'Gear/Lures/assets/other-owner-id/notes/tiny.png':
   'KB/Species/assets/other-owner-id/notes/tiny.png';
  const result=await f.publish(domain,{record,expectedRevision:0,
   markdown:'![New image]('+noteImageReference(path)+')',
   media:[{logicalPath:path,sha256:sha,bytes:image.length,
    contentType:'image/png'}]});
  assert.notEqual(result.status,200);
  assert.equal(f.count(dbOf(domain)),1,'no duplicate owner created');
  assert.equal(f.count('d6_media_refs'),0,'no orphan image link committed');
  assert.equal(f.count('d6_media_objects'),0,'no partial D1 media object');
  assert.equal(f.query('SELECT id FROM '+dbOf(domain)+' WHERE id=?',
   record.id),undefined);
 }
});
test('V3-MEDIA-LIVE08 owner HTTP gate, CSRF, scope and canonical paths',async()=>{
 const f=fixture();f.seed('gear');
 const svc=f.live({enabled:()=>true});
 const token=(await f.auth.describe(new Request(origin+'/fishing/',{
  headers:{Cookie:cookie,'Sec-Fetch-Site':'same-origin'},
 }))).csrfToken;
 const body=JSON.stringify({domain:'gear',record:recordOf('gear'),
  markdown:markdownOf('gear'),expectedRevision:1,media:manifestOf('gear')});
 const goodHeaders={
  Cookie:cookie,Origin:origin,'Sec-Fetch-Site':'same-origin',
  'Content-Type':'application/json',
  'X-Fish-V3-Intent':'save-gear','X-Fish-V3-CSRF':token,
  'X-Fish-V3-Media-Domain':'gear',
 };
 for(const headers of [
  {...goodHeaders,'X-Fish-V3-CSRF':'A'.repeat(43)},
  {...goodHeaders,'Sec-Fetch-Site':'cross-site'},
  {...goodHeaders,'X-Fish-V3-Intent':'save-catch'},
  {...goodHeaders,Cookie:'not-a-session'},
 ]){
  assert.equal((await svc.handle(new Request(origin+'/api/v3/media/publish',{
   method:'POST',headers,body}))).status,403);
 }
 assert.equal(f.count('d6_media_refs'),0);
 const allowed=await svc.handle(new Request(origin+'/api/v3/media/publish',{
  method:'POST',headers:goodHeaders,body,
 }));
 assert.equal(allowed.status,200);
 assert.equal(f.count('d6_media_refs'),1);
 assert.equal((await svc.handle(new Request(f.url('gear')+'?r=1'))).status,404);
 assert.equal((await svc.handle(new Request(origin+'/api/v3/media/live/'))).status,404);
 assert.equal((await svc.handle(new Request(f.url('gear'),{
  headers:{Range:'bytes=0-3'},
 }))).status,416);
});
test('V3-MEDIA-LIVE09 plain link/comment is not an image reference',()=>{
 const path=pathOf('gear'),ref=noteImageReference(path);
 assert.equal(isD6NotesImageLinked('only '+ref,path),false);
 assert.equal(isD6NotesImageLinked('[link]('+ref+')',path),false);
 assert.equal(isD6NotesImageLinked('![alt]('+ref+')',path),true);
 assert.equal(isD6NotesImageLinked('![alt](https://elsewhere.invalid/a)',path),false);
});

test('V3-MEDIA-LIVE10 two images publish together or both roll back',async()=>{
 const f=fixture();f.seed('gear');
 const first=pathOf('gear');
 const second=first.replace('/tiny.png','/second.png');
 const markdown='![One]('+noteImageReference(first)+')'+
  '\n\n![Two]('+noteImageReference(second)+')';
 const multi=[...manifestOf('gear'),{...manifestOf('gear')[0],
  logicalPath:second}];
 let result=await f.publish('gear',{markdown,media:multi});
 assert.equal(result.status,200);
 assert.equal(f.count('d6_media_objects'),1);
 assert.equal(f.count('d6_media_refs'),2);
 assert.equal(f.query('SELECT revision FROM d6_gear_records').revision,2);

 const g=fixture();g.seed('gear');
 // An existing logical path must not be overwritten, even if its blob
 // already has the same SHA. Failure of the second INSERT rolls back the
 // first INSERT and the record revision update in one transaction.
 g.sqlite.prepare('INSERT INTO d6_media_objects'+
  ' (sha256,storage_key,mime,bytes,created_at) VALUES(?,?,?,?,?)')
  .run(sha,key,'image/png',image.length,1);
 g.sqlite.prepare('INSERT INTO d6_media_refs'+
  ' (logical_path,domain,record_id,sha256,created_at)'+
  ' VALUES(?,?,?,?,?)').run(second,'gear',
   recordOf('gear').id,sha,1);
 result=await g.publish('gear',{markdown,media:multi});
 assert.equal(result.status,503);
 assert.equal(g.count('d6_media_refs'),1);
 assert.equal(g.query('SELECT logical_path FROM d6_media_refs').logical_path,
  second);
 assert.equal(g.query('SELECT revision FROM d6_gear_records').revision,1);
 assert.equal(g.query('SELECT notes_text FROM d6_gear_records').notes_text,
  'Original notes');
});
test('V3-MEDIA-LIVE11 unmounted service does not alter deployed Worker routes',()=>{
 const worker=readFileSync(new URL('../server/d6-direct-gear-worker.mjs',
  import.meta.url),'utf8');
 assert.doesNotMatch(worker,/d6-shared-media-live/);
 assert.doesNotMatch(worker,/d6-shared-media-stage/);
 assert.doesNotMatch(worker,/\/api\/v3\/media\//);
});

test('V3-M02-05 record-linked Gear and KB cover images publish and read privately',async()=>{
 const f=fixture();
 for(const [domain,cover] of [
  ['gear','Gear/Lures/assets/new-gear-cover.png'],
  ['kb','KB/Species/assets/new-fish-cover.png'],
 ]){
  const original=recordOf(domain),record={...original,picture:{src:cover}};
  f.seed(domain,1,original,'Original notes');
  const result=await f.publish(domain,{
   record,markdown:'Valid owner content',
   media:[{logicalPath:cover,sha256:sha,bytes:image.length,
    contentType:'image/png'}],
  });
  assert.equal(result.status,200,domain+': '+result.error);
  assert.equal(result.result.media[0].role,'cover');
  const response=await f.live({enabled:()=>true}).handle(
   new Request(origin+'/api/v3/media/live/'+encodedPath(cover)));
  assert.equal(response.status,200);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()),image);
  // The private reader denies a removed cover even while stale D1 metadata
  // and staged R2 bytes physically remain.
  f.sqlite.prepare('UPDATE '+dbOf(domain)+' SET record_json=? WHERE id=?')
   .run(JSON.stringify(original),original.id);
  assert.equal((await f.live({enabled:()=>true}).handle(
   new Request(origin+'/api/v3/media/live/'+encodedPath(cover)))).status,404);
 }
});
test('V3-M02-06 ordered Knot steps are atomic and exactly linked before read',async()=>{
 const f=fixture();
 const frames=[
  'KB/Knots/assets/knot-media-test/step-01.png',
  'KB/Knots/assets/knot-media-test/step-02.png',
 ];
 const record={id:'knot-media-test',type:'knot',name:'Owner Knot',
  content:'KB/Knots/content/Owner Knot.md',picture:{src:frames[1]},
  pictureSequence:frames};
 f.seed('kb',1,record,'Original article');
 const staged=frames.map(logicalPath=>({
  logicalPath,sha256:sha,bytes:image.length,contentType:'image/png',
 }));
 let result=await f.publish('kb',{record,markdown:'Owner Knot text',
  media:[staged[0]]});
 assert.notEqual(result.status,200,'no partial Knot publishing');
 assert.equal(f.count('d6_media_refs'),0);
 assert.equal(f.query('SELECT revision FROM d6_kb_records WHERE id=?',
  record.id).revision,1);
 result=await f.publish('kb',{record,markdown:'Owner Knot text',media:staged});
 assert.equal(result.status,200,result.error);
 assert.equal(f.count('d6_media_refs'),2);
 assert.deepEqual(result.result.media.map(x=>x.role),
  ['knot-step','knot-step']);
 const live=f.live({enabled:()=>true});
 for(const frame of frames){
  assert.equal((await live.handle(new Request(origin+
   '/api/v3/media/live/'+encodedPath(frame)))).status,200);
 }
 const edited={...record,pictureSequence:[frames[1],frames[0]],
  picture:{src:frames[0]}};
 f.sqlite.prepare('UPDATE d6_kb_records SET record_json=? WHERE id=?')
  .run(JSON.stringify(edited),record.id);
 for(const frame of frames)
  assert.equal((await live.handle(new Request(origin+
   '/api/v3/media/live/'+encodedPath(frame)))).status,404);
});
test('V3-M02-07 non-owned cover and forged Knot paths do not reach D1 batch',async()=>{
 const f=fixture(),original=recordOf('gear');
 f.seed('gear',1,original,'Original');
 const bad='Gear/Lures/assets/nonowned-cover.png';
 let outcome=await f.publish('gear',{record:original,
  markdown:'Original',media:[{logicalPath:bad,sha256:sha,
   bytes:image.length,contentType:'image/png'}]});
 assert.notEqual(outcome.status,200);
 assert.equal(f.batches(),0);
 assert.equal(f.count('d6_media_refs'),0);
 const kb=f.publish('kb',{record:{...recordOf('kb'),
  picture:{src:'KB/Species/assets/cover.png'}},
  markdown:'Text',media:[{logicalPath:'KB/Knots/assets/fake/step-01.png',
   sha256:sha,bytes:image.length,contentType:'image/png'}]});
 outcome=await kb;
 assert.notEqual(outcome.status,200);
 assert.equal(f.count('d6_media_refs'),0);
});

test('M02 D1 manifest is owner-only and includes only published linked paths',async()=>{
 const f=fixture(),url=origin+'/api/v3/media/manifest';
 const live=f.live({enabled:()=>true});
 assert.equal((await f.live().handle(new Request(url))).status,503);
 assert.equal((await live.handle(new Request(url))).status,403);
 assert.equal((await live.handle(new Request(url,{method:'POST',
  headers:{Cookie:cookie,'Sec-Fetch-Site':'same-origin'}}))).status,405);
 const owner=()=>new Request(url,{
  headers:{Cookie:cookie,'Sec-Fetch-Site':'same-origin'},
 });
 const empty=await live.handle(owner());
 assert.equal(empty.status,200);
 assert.deepEqual(await empty.json(),{ok:true,version:1,paths:[]});
 f.seed('gear');
 assert.equal((await f.publish('gear')).status,200);
 const published=await live.handle(owner());
 assert.equal(published.status,200);
 assert.deepEqual(await published.json(),
  {ok:true,version:1,paths:[pathOf('gear')]});
 assert.equal(published.headers.get('Cache-Control'),
  'private, no-store, max-age=0');
});
test('M02 D1 manifest refuses unlinked or incomplete media refs',async()=>{
 const f=fixture(),url=origin+'/api/v3/media/manifest';
 f.seed('gear');
 const live=f.live({enabled:()=>true});
 const owner=()=>new Request(url,{
  headers:{Cookie:cookie,'Sec-Fetch-Site':'same-origin'},
 });
 f.sqlite.prepare('INSERT INTO d6_media_objects'+
  ' (sha256,storage_key,mime,bytes,created_at) VALUES(?,?,?,?,?)')
  .run(sha,key,'image/png',image.length,1);
 f.sqlite.prepare('INSERT INTO d6_media_refs'+
  ' (logical_path,domain,record_id,sha256,created_at)'+
  ' VALUES(?,?,?,?,?)')
  .run(pathOf('gear'),'gear',recordOf('gear').id,sha,1);
 // The D1 record has no Markdown image token: a raw media ref is insufficient.
 assert.equal((await live.handle(owner())).status,503);
 f.sqlite.prepare('UPDATE d6_gear_records SET notes_text=?')
  .run(markdownOf('gear'));
 assert.equal((await live.handle(owner())).status,200);
 // No matching media object makes the registry unverifiable, not complete.
 f.sqlite.prepare('DELETE FROM d6_media_refs').run();
 f.sqlite.prepare('DELETE FROM d6_media_objects').run();
 const fakeSha='a'.repeat(64);
 f.sqlite.exec('PRAGMA foreign_keys=OFF');
 f.sqlite.prepare('INSERT INTO d6_media_refs'+
  ' (logical_path,domain,record_id,sha256,created_at)'+
  ' VALUES(?,?,?,?,?)')
  .run(pathOf('gear'),'gear',recordOf('gear').id,fakeSha,1);
 assert.equal((await live.handle(owner())).status,503);
});
