import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {encodedPath} from '../src/shared.mjs';
import {loadD6PublishedMediaPaths,createD6ContentImageResolver,
 d6ResolveImageForDisplay} from '../src/d6-content-image-resolver.mjs';
import {noteImageReference} from '../src/notes-markdown-editor.mjs';
import {D6_MEDIA_SCHEMA_SQL} from '../tools/d6-media-schema.mjs';
import {createD6SharedMediaStage} from '../server/d6-shared-media-stage.mjs';
import {createD6OwnerMediaUploadCoordinator} from '../src/d6-owner-media-upload-client.mjs';
import {saveD6OwnerEditorMedia} from '../src/d6-owner-media-editor-save.mjs';
import {createD2UnifiedOwnerSession}
 from '../../experiments/p3/preview/src/d2-unified-owner-session.mjs';
import {createD6SharedMediaLive,publishD6MediaRevision,
 isD6NotesImageLinked} from '../server/d6-shared-media-live.mjs';

const origin='https://fishing-d6-wp2-test.ginosega.workers.dev';
const cookie='__Host-fish_p0_session='+'A'.repeat(43);
const ownerImageRequest=(url,options={})=>new Request(url,{
 ...options,
 headers:{Cookie:cookie,'Sec-Fetch-Site':'same-origin',...options.headers},
});
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
 assert.equal((await svc.handle(ownerImageRequest(f.url('gear')))).status,503);
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
   ownerImageRequest(f.url(domain)))).status,200);
 }
 assert.equal(f.count('d6_media_objects'),1);
 assert.equal(f.count('d6_media_refs'),3);
 const got=await f.live({enabled:()=>true}).handle(ownerImageRequest(f.url('kb')));
 assert.equal(got.headers.get('Content-Type'),'image/png');
 assert.equal(got.headers.get('Cache-Control'),'private, no-store');
 assert.equal(got.headers.get('ETag'),'"'+sha+'"');
 assert.deepEqual(new Uint8Array(await got.arrayBuffer()),image);
 assert.equal((await f.live({enabled:()=>true}).handle(
  ownerImageRequest(f.url('kb'),{method:'HEAD'}))).status,200);
});
test('V3-MEDIA-LIVE03 missing D1 ref never exposes staged R2 bytes',async()=>{
 const f=fixture();f.seed('gear');
 const service=f.live({enabled:()=>true});
 assert.equal((await service.handle(ownerImageRequest(f.url('gear')))).status,404);
 assert.equal((await service.handle(ownerImageRequest(origin+
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
 // Model a path held by another owner: same-owner replacement is valid,
 // cross-owner takeover must still abort the whole D1 batch.
 f.sqlite.prepare('UPDATE d6_media_refs SET record_id=? WHERE logical_path=?')
  .run('other-gear',pathOf('gear'));
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
  ownerImageRequest(f.url('gear')))).status,200);
 f.sqlite.prepare('UPDATE d6_gear_records SET notes_text=?')
  .run('Image no longer linked');
 assert.equal((await f.live({enabled:()=>true}).handle(
  ownerImageRequest(f.url('gear')))).status,404);
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
   ownerImageRequest(f.url(domain)))).status,200);
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
  assert.equal((await f.live({enabled:()=>true}).handle(ownerImageRequest(
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
 assert.equal((await svc.handle(ownerImageRequest(f.url('gear')+'?r=1'))).status,404);
 assert.equal((await svc.handle(ownerImageRequest(origin+'/api/v3/media/live/'))).status,404);
 assert.equal((await svc.handle(ownerImageRequest(f.url('gear'),{
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
 // The path is registered to a *different* owner. An attempted takeover
 // must fail the second INSERT and roll back the first and the record edit.
 g.sqlite.prepare('INSERT INTO d6_media_objects'+
  ' (sha256,storage_key,mime,bytes,created_at) VALUES(?,?,?,?,?)')
  .run(sha,key,'image/png',image.length,1);
 g.sqlite.prepare('INSERT INTO d6_media_refs'+
  ' (logical_path,domain,record_id,sha256,created_at)'+
  ' VALUES(?,?,?,?,?)').run(second,'gear',
   'other-gear',sha,1);
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
   ownerImageRequest(origin+'/api/v3/media/live/'+encodedPath(cover)));
  assert.equal(response.status,200);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()),image);
  // The private reader denies a removed cover even while stale D1 metadata
  // and staged R2 bytes physically remain.
  f.sqlite.prepare('UPDATE '+dbOf(domain)+' SET record_json=? WHERE id=?')
   .run(JSON.stringify(original),original.id);
  assert.equal((await f.live({enabled:()=>true}).handle(
   ownerImageRequest(origin+'/api/v3/media/live/'+encodedPath(cover)))).status,404);
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
  assert.equal((await live.handle(ownerImageRequest(origin+
   '/api/v3/media/live/'+encodedPath(frame)))).status,200);
 }
 const edited={...record,pictureSequence:[frames[1],frames[0]],
  picture:{src:frames[0]}};
 f.sqlite.prepare('UPDATE d6_kb_records SET record_json=? WHERE id=?')
  .run(JSON.stringify(edited),record.id);
 for(const frame of frames)
  assert.equal((await live.handle(ownerImageRequest(origin+
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

test('M02 end-to-end D1 manifest to verified browser R2 image read',async()=>{
 const f=fixture(),live=f.live({enabled:()=>true});
 const root=origin+'/fishing/';
 const path=pathOf('gear');
 f.seed('gear');
 const result=await f.publish('gear');
 assert.equal(result.status,200,result.error);
 const requests=[];
 // Simulate the browser carrying its existing owner session cookie.
 const request=async(url,options)=>{
  requests.push({url,options});
  return live.handle(new Request(url,{method:options.method,
   headers:{Cookie:cookie,'Sec-Fetch-Site':'same-origin'}}));
 };
 const paths=await loadD6PublishedMediaPaths({root,request,
  enabled:()=>true,readingMode:()=> 'Automatic'});
 assert.deepEqual([...paths],[path]);
 assert.equal(requests.length,1,'one existing D1 manifest endpoint');
 assert.equal(requests[0].url,origin+'/api/v3/media/manifest');
 const resolver=createD6ContentImageResolver({root,
  enabled:()=>true,readingMode:()=> 'Automatic',publishedPaths:paths});
 const url=d6ResolveImageForDisplay(path,{verifiedLive:resolver,
  frozenAsset:()=>{throw Error('No stale release fallback');}});
 assert.equal(url,origin+'/api/v3/media/live/'+encodedPath(path));
 const response=await live.handle(ownerImageRequest(url));
 assert.equal(response.status,200);
 assert.equal(response.headers.get('Content-Type'),'image/png');
 assert.deepEqual(new Uint8Array(await response.arrayBuffer()),image);
 assert.equal(d6ResolveImageForDisplay('Gear/Lures/assets/unpublished.png',{
  verifiedLive:resolver,frozenAsset:()=>{throw Error('No fallback');}}),null);
 assert.equal((await f.live().handle(new Request(
  origin+'/api/v3/media/manifest'))).status,503,
  'no registry when private provider disabled');
});

test('M02 private published R2 originals require the owner session',async()=>{
 const f=fixture();f.seed('gear');
 assert.equal((await f.publish('gear')).status,200);
 const live=f.live({enabled:()=>true});
 const imageUrl=f.url('gear');
 assert.equal((await live.handle(new Request(imageUrl))).status,403);
 assert.equal((await live.handle(new Request(imageUrl,{method:'HEAD'}))).status,403);
 assert.equal((await live.handle(ownerImageRequest(imageUrl))).status,200);
 assert.equal((await live.handle(ownerImageRequest(imageUrl,{method:'HEAD'}))).status,200);
});

test('M02 same-owner image replacement changes only its D1 reference',async()=>{
 const f=fixture();f.seed('gear');
 assert.equal((await f.publish('gear')).status,200);
 // Different staged object receipt; image decoding is tested at stage.
 const replacement=image.slice();
 replacement[replacement.length-1]^=1;
 const secondSha=createHash('sha256').update(replacement).digest('hex');
 const secondKey='staged/v1/sha256/'+secondSha;
 f.objects.set(secondKey,{
  key:secondKey,size:replacement.length,bytes:replacement,
  httpMetadata:{contentType:'image/png'},
  customMetadata:{sha256:secondSha},
 });
 const second=await f.publish('gear',{expectedRevision:2,
  media:[{logicalPath:pathOf('gear'),sha256:secondSha,
   bytes:replacement.length,contentType:'image/png'}]});
 assert.equal(second.status,200,second.error);
 assert.equal(second.result.revision,3);
 assert.equal(f.count('d6_media_refs'),1);
 assert.equal(f.count('d6_media_objects'),2);
 const ref=f.query('SELECT sha256 FROM d6_media_refs WHERE logical_path=?',
  pathOf('gear'));
 assert.equal(ref.sha256,secondSha);
 const response=await f.live({enabled:()=>true}).handle(
  ownerImageRequest(f.url('gear')));
 assert.equal(response.status,200);
 assert.equal(response.headers.get('ETag'),'"'+secondSha+'"');
 assert.deepEqual(new Uint8Array(await response.arrayBuffer()),replacement);
});
test('M02 a different owner cannot steal a published cover reference',async()=>{
 const f=fixture(),cover='Gear/Lures/assets/shared-cover.png';
 const first={...recordOf('gear'),picture:{src:cover}};
 const second={...recordOf('gear'),id:'other-lure',
  name:'Another lure',notes:'Gear/Lures/content/Other Lure.md',
  picture:{src:cover}};
 const uploaded=[{logicalPath:cover,sha256:sha,bytes:image.length,
  contentType:'image/png'}];
 f.seed('gear',1,first,'First');
 assert.equal((await f.publish('gear',{record:first,markdown:'First',
  media:uploaded})).status,200);
 f.seed('gear',1,second,'Second base');
 const conflict=await f.publish('gear',{record:second,markdown:'Second',
  media:uploaded});
 assert.notEqual(conflict.status,200);
 assert.equal(f.query('SELECT revision FROM d6_gear_records WHERE id=?',
  second.id).revision,1,'the other record is not partly saved');
 assert.equal(f.query('SELECT record_id FROM d6_media_refs WHERE logical_path=?',
  cover).record_id,first.id);
 assert.equal(f.count('d6_media_refs'),1);
});

test('M02 different-filename cover replacement retires only the old D1 link',async()=>{
 const f=fixture(),oldPath='Gear/Lures/assets/old-cover.png',
  newPath='Gear/Lures/assets/new-cover.png';
 const oldRecord={...recordOf('gear'),picture:{src:oldPath}};
 const newRecord={...oldRecord,picture:{src:newPath}};
 const media=logicalPath=>[{
  logicalPath,sha256:sha,bytes:image.length,contentType:'image/png',
 }];
 f.seed('gear',1,oldRecord,'Owner notes');
 assert.equal((await f.publish('gear',{record:oldRecord,
  markdown:'Owner notes',media:media(oldPath)})).status,200);
 const result=await f.publish('gear',{record:newRecord,
  markdown:'Owner notes',expectedRevision:2,media:media(newPath)});
 assert.equal(result.status,200,result.error);
 assert.equal(result.result.revision,3);
 assert.equal(f.count('d6_media_refs'),1);
 assert.equal(f.query('SELECT logical_path FROM d6_media_refs').logical_path,newPath);
 const live=f.live({enabled:()=>true});
 const img=path=>ownerImageRequest(origin+'/api/v3/media/live/'+encodedPath(path));
 assert.equal((await live.handle(img(oldPath))).status,404);
 assert.equal((await live.handle(img(newPath))).status,200);
 const manifest=await live.handle(ownerImageRequest(origin+'/api/v3/media/manifest'));
 assert.equal(manifest.status,200);
 assert.deepEqual((await manifest.json()).paths,[newPath]);
 assert.equal(f.count('d6_media_objects'),1,'original object metadata retained');
 assert.deepEqual((await f.R2.get(key)).bytes,image,'original R2 bytes retained');
});
test('M02 picture removal and Notes image deletion retire links without uploads',async()=>{
 for(const mode of ['cover','notes']){
  const f=fixture(),record=mode==='cover'?
   {...recordOf('gear'),picture:{src:'Gear/Lures/assets/cover.png'}}:
   recordOf('gear');
  const logicalPath=mode==='cover'?record.picture.src:pathOf('gear');
  const firstMarkdown=mode==='notes'?markdownOf('gear'):'Owner Notes';
  f.seed('gear',1,record,firstMarkdown);
  const media=[{logicalPath,sha256:sha,bytes:image.length,
   contentType:'image/png'}];
  assert.equal((await f.publish('gear',{record,markdown:firstMarkdown,
   media})).status,200);
  const stale=await f.publish('gear',{record:mode==='cover'?
   recordOf('gear'):record,expectedRevision:1,markdown:'Plain notes',media:[]});
  assert.equal(stale.status,409,'stale revision cannot retire media');
  assert.equal(f.count('d6_media_refs'),1);
  const revised=mode==='cover'?recordOf('gear'):record;
  const saved=await f.publish('gear',{record:revised,
   expectedRevision:2,markdown:'Plain notes',media:[]});
  assert.equal(saved.status,200,saved.error);
  assert.equal(saved.result.revision,3);
  assert.equal(f.count('d6_media_refs'),0);
  assert.equal(f.count('d6_media_objects'),1,'old R2 object metadata remains');
  assert.ok(f.objects.has(key),'original R2 bytes retained');
  const live=f.live({enabled:()=>true});
  assert.equal((await live.handle(ownerImageRequest(
   origin+'/api/v3/media/live/'+encodedPath(logicalPath)))).status,404);
  const manifest=await live.handle(ownerImageRequest(origin+'/api/v3/media/manifest'));
  assert.equal(manifest.status,200);
  assert.deepEqual((await manifest.json()).paths,[]);
 }
});
test('M02 remove Knot sequence keeps representative final frame linked',async()=>{
 const f=fixture();
 const frames=['KB/Knots/assets/knot-media-test/step-01.png',
  'KB/Knots/assets/knot-media-test/step-02.png'];
 const record={id:'knot-media-test',type:'knot',name:'Owner Knot',
  content:'KB/Knots/content/Owner Knot.md',
  picture:{src:frames[1]},pictureSequence:frames};
 const media=frames.map(logicalPath=>({logicalPath,sha256:sha,
  bytes:image.length,contentType:'image/png'}));
 f.seed('kb',1,record,'Original Knot');
 const first=await f.publish('kb',{record,markdown:'Owner Knot',
  media});
 assert.equal(first.status,200,first.error);
 const {pictureSequence,...singlePicture}=record;
 const saved=await f.publish('kb',{record:singlePicture,
  expectedRevision:2,markdown:'Owner Knot',media:[]});
 assert.equal(saved.status,200,saved.error);
 assert.equal(f.count('d6_media_refs'),1);
 assert.equal(f.query('SELECT logical_path FROM d6_media_refs').logical_path,
  frames[1]);
 const live=f.live({enabled:()=>true});
 const img=path=>ownerImageRequest(origin+'/api/v3/media/live/'+encodedPath(path));
 assert.equal((await live.handle(img(frames[0]))).status,404);
 assert.equal((await live.handle(img(frames[1]))).status,200);
 assert.equal(f.count('d6_media_objects'),1);
});



test('M02 M01 historical Catch Notes + shared KB→Gear cover survive live Save',async()=>{
 const f=fixture(),live=f.live({enabled:()=>true});
 const historicalCover='Gear/Lures/assets/legacy-shared.png';
 const gear={...recordOf('gear'),picture:{src:historicalCover}};
 const kb={...recordOf('kb'),picture:{src:historicalCover}};
 const caught={...recordOf('catches')};
 f.seed('gear',1,gear,'Old Gear Notes');
 f.seed('kb',1,kb,'Old KB article');
 f.seed('catches',3,caught,'Original Catch Notes');
 f.sqlite.prepare(
  'INSERT INTO d6_media_objects(sha256,storage_key,mime,bytes,created_at) VALUES(?,?,?,?,?)'
 ).run(sha,key,'image/png',image.length,1);
 const addRef=(logicalPath,domain,recordId)=>{
  f.sqlite.prepare('INSERT INTO d6_media_refs'+
   ' (logical_path,domain,record_id,sha256,created_at,historical)'+
   ' VALUES(?,?,?,?,?,1)').run(logicalPath,domain,recordId,sha,1);
 };
 addRef(historicalCover,'gear',gear.id);
 addRef(historicalCover,'kb',kb.id);
 // The original file extension and image MIME must match.
 // Use a dedicated JPEG-shaped media object entry for Catch.
 const jpgPath='Catches/content/catch-media-test.png';
 const markdown='Old image\n\n![A catch](./catch-media-test.png)';
 f.sqlite.prepare('UPDATE d6_catch_records SET notes_text=? WHERE id=?')
  .run(markdown,caught.id);
 addRef(jpgPath,'catches',caught.id);
 const manifestUrl=origin+'/api/v3/media/manifest';
 const parsed=await (await live.handle(ownerImageRequest(manifestUrl))).json();
 assert.deepEqual(parsed.paths.sort(),[historicalCover,jpgPath].sort(),
  'the D1 reader deduplicates shared historical logical paths');
 const loader=async(url,options)=>live.handle(ownerImageRequest(url,{
  method:options.method,
 }));
 const paths=await loadD6PublishedMediaPaths({
  root:origin+'/fishing/',request:loader,enabled:()=>true,
  readingMode:()=> 'Automatic',
 });
 assert.equal(paths.size,2);
 const browser=createD6ContentImageResolver({root:origin+'/fishing/',
  publishedPaths:paths,enabled:()=>true,readingMode:()=> 'Automatic'});
 for(const path of [historicalCover,jpgPath]){
  const url=browser.resolve(path);
  assert.equal(url,origin+'/api/v3/media/live/'+encodedPath(path));
  const photo=await live.handle(ownerImageRequest(url));
  assert.equal(photo.status,200,path);
  assert.deepEqual(new Uint8Array(await photo.arrayBuffer()),image);
 }
 assert.equal((await live.handle(new Request(browser.resolve(jpgPath)))).status,403,
  'historical photos remain owner-only');
 let saved=await f.publish('kb',{record:kb,expectedRevision:1,
  markdown:'Revised KB article',media:[]});
 assert.equal(saved.status,200,saved.error);
 assert.equal(f.count('d6_media_refs'),3,
  'ordinary KB text edit must preserve cross-domain cover ref');
 saved=await f.publish('catches',{record:caught,expectedRevision:3,
  markdown,media:[]});
 assert.equal(saved.status,200,saved.error);
 assert.equal(f.count('d6_media_refs'),3,
  'ordinary Catch text Save must preserve original relative picture');
 assert.equal((await live.handle(ownerImageRequest(browser.resolve(jpgPath)))).status,200);
 const noCover={...kb};delete noCover.picture;
 saved=await f.publish('kb',{record:noCover,expectedRevision:2,
  markdown:'Revised KB article',media:[]});
 assert.equal(saved.status,200,saved.error);
 assert.equal(f.count('d6_media_refs'),2,
  'removing a KB cover retires only the KB association');
 assert.equal((await live.handle(ownerImageRequest(browser.resolve(historicalCover)))).status,200,
  'Gear remains a valid second owner of shared original');
 saved=await f.publish('gear',{record:gear,expectedRevision:1,
  markdown:'Updated Gear Notes',media:[]});
 assert.equal(saved.status,200,saved.error);
 assert.equal(f.count('d6_media_refs'),2);
 saved=await f.publish('catches',{record:caught,expectedRevision:4,
  markdown:'Photo removed from Notes',media:[]});
 assert.equal(saved.status,200,saved.error);
 assert.equal(f.count('d6_media_refs'),1);
 assert.equal((await live.handle(ownerImageRequest(browser.resolve(jpgPath)))).status,404);
 assert.equal(f.count('d6_media_objects'),1,'immutable R2 object retained');
});

test('M02 source-only owner editor → private stage → atomic D1 Save → R2 readback',async()=>{
 const f=fixture();
 f.seed('gear');
 // Force a new R2 stage rather than reusing the fixture's preseeded object.
 f.objects.clear();
 const cover='Gear/Lures/assets/owner-cover.png';
 const record={...recordOf('gear'),picture:{src:cover}};
 // This test uses in-memory SQLite and a fake, private R2 object store.
 // It never mounts media routes in a Worker or modifies provider state.
 f.R2.put=async(storageKey,bytes,options)=>{
  assert.deepEqual(options.onlyIf,{etagDoesNotMatch:'*'});
  if(f.objects.has(storageKey))return null;
  const stored={key:storageKey,size:bytes.byteLength,
   bytes:new Uint8Array(bytes),
   httpMetadata:options.httpMetadata,
   customMetadata:options.customMetadata};
  f.objects.set(storageKey,stored);
  return stored;
 };
 const stage=createD6SharedMediaStage({...f.params,enabled:()=>true});
 const live=f.live({enabled:()=>true});
 const csrf=(await f.auth.describe(ownerImageRequest(origin+'/fishing/'))).csrfToken;
 assert.match(csrf,/^[A-Za-z0-9_-]{43}$/);
 const calls=[];
 const reply=body=>new Response(JSON.stringify(body),{
  status:200,headers:{'Content-Type':'application/json'},
 });
 const request=async(url,options={})=>{
  calls.push({url,method:options.method});
  if(url.endsWith('-csrf'))return reply({ok:true,csrfToken:csrf});
  if(url===origin+'/api/v3/content/gear/'+record.id){
   const row=f.query('SELECT revision,record_json,notes_text '+
    'FROM d6_gear_records WHERE id=?',record.id);
   return reply({ok:true,revision:row.revision,
    record:JSON.parse(row.record_json),notes:row.notes_text});
  }
  const actual=ownerImageRequest(url,{
   method:options.method,
   headers:{...options.headers,Origin:origin},
   ...(options.body!==undefined?{body:options.body}:{}),
  });
  if(url===origin+'/api/v3/media/stage')
   return stage.handle(actual);
  return live.handle(actual);
 };
 const previousBitmap=globalThis.createImageBitmap;
 // Node has no browser image decoder; use the real PNG bytes and a
 // deterministic 1x1 bitmap for the browser-only dimension probe.
 globalThis.createImageBitmap=async()=>({
  width:1,height:1,close(){},
 });
 try{
  const client=createD6OwnerMediaUploadCoordinator({
   root:origin+'/fishing/',request,enabled:()=>true,
   readingMode:()=> 'Automatic',
  });
  const file=new File([image],'owner-cover.png',{type:'image/png'});
  const saved=await saveD6OwnerEditorMedia({
   domain:'gear',record,markdown:'Updated owner Notes',
   expectedRevision:1,
   uploads:[{path:cover,role:'cover',file}],
   capabilities:{canUploadNewImages:true},
   coordinator:client,
  });
  assert.equal(saved.verified,true);
  assert.equal(saved.revision,2);
  assert.equal(f.count('d6_media_refs'),1);
  assert.equal(f.count('d6_media_objects'),1);
  assert.equal(f.objects.size,1,'one original was actually staged');
  assert.deepEqual(f.objects.get('staged/v1/sha256/'+sha)?.bytes,image);
  assert.equal(f.query('SELECT revision FROM d6_gear_records').revision,2);
  assert.deepEqual(calls.filter(x=>x.method==='POST').map(x=>x.url),[
   origin+'/api/v3/media/stage',origin+'/api/v3/media/publish']);
  assert.equal(calls.filter(x=>x.method==='HEAD').length,1);
  const manifest=await live.handle(ownerImageRequest(
   origin+'/api/v3/media/manifest'));
  assert.equal(manifest.status,200);
  assert.deepEqual((await manifest.json()).paths,[cover]);
  const img=await live.handle(ownerImageRequest(
   origin+'/api/v3/media/live/'+encodedPath(cover)));
  assert.equal(img.status,200);
  assert.deepEqual(new Uint8Array(await img.arrayBuffer()),image);
  assert.equal((await live.handle(new Request(
   origin+'/api/v3/media/live/'+encodedPath(cover)))).status,403,
   'private content images still require the owner session');
  const before=calls.length;
  const offline=createD6OwnerMediaUploadCoordinator({
   root:origin+'/fishing/',request,enabled:()=>true,
   readingMode:()=> 'Work Offline',
  });
  await assert.rejects(offline.stage({
   domain:'gear',record,logicalPath:cover,role:'cover',file,
  }),{code:'DISABLED'});
  assert.equal(calls.length,before,'Work Offline did not call a provider');
 }finally{
  if(previousBitmap===undefined)delete globalThis.createImageBitmap;
  else globalThis.createImageBitmap=previousBitmap;
 }
});


test('M02 Catch Notes and Knot frames use the real stage → D1 Save → R2 reader bridge',async()=>{
 const plans=[
  {domain:'catches',record:recordOf('catches'),
   markdown:'Catch Notes\n\n![Fresh catch]('+
    noteImageReference('Catches/assets/catch-media-test/notes/catch.png')+')',
   files:[{role:'notes',path:'Catches/assets/catch-media-test/notes/catch.png',
    filename:'catch.png'}]},
  {domain:'kb',record:{
    id:'knot-media-test',type:'knot',name:'Owner Knot',
    content:'KB/Knots/content/Owner Knot.md',
    picture:{src:'KB/Knots/assets/knot-media-test/step-02.png'},
    pictureSequence:[
     'KB/Knots/assets/knot-media-test/step-01.png',
     'KB/Knots/assets/knot-media-test/step-02.png',
    ],
   },
   markdown:'Original knot instructions with ordered pictures',
   files:[
    {role:'knot-step',path:'KB/Knots/assets/knot-media-test/step-01.png',
     filename:'step-01.png'},
    {role:'knot-step',path:'KB/Knots/assets/knot-media-test/step-02.png',
     filename:'step-02.png'},
   ]},
 ];
 const bitmap=globalThis.createImageBitmap;
 globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
 try{
  for(const {domain,record,markdown,files} of plans){
   const f=fixture();
   f.seed(domain,1,record,'Original article/notes');
   f.objects.clear();
   let created=0;
   f.R2.put=async(storageKey,bytes,options)=>{
    assert.deepEqual(options.onlyIf,{etagDoesNotMatch:'*'});
    if(f.objects.has(storageKey))return null;
    const stored={key:storageKey,size:bytes.byteLength,
     bytes:new Uint8Array(bytes),
     httpMetadata:options.httpMetadata,
     customMetadata:options.customMetadata};
    f.objects.set(storageKey,stored);created++;
    return stored;
   };
   const stage=createD6SharedMediaStage({...f.params,enabled:()=>true});
   const live=f.live({enabled:()=>true});
   const csrf=(await f.auth.describe(ownerImageRequest(origin+'/fishing/'))).csrfToken;
   const reply=value=>new Response(JSON.stringify(value),{
    status:200,headers:{'Content-Type':'application/json'},
   });
   const requests=[];
   const request=async(url,options={})=>{
    requests.push({url,method:options.method});
    if(url.endsWith('-csrf'))return reply({ok:true,csrfToken:csrf});
    if(url===origin+'/api/v3/content/'+domain+'/'+record.id){
     const saved=f.query('SELECT revision,record_json,'+fieldOf(domain)+
      ' AS content FROM '+dbOf(domain)+' WHERE id=?',record.id);
     return reply({ok:true,revision:saved.revision,
      record:JSON.parse(saved.record_json),
      [domain==='kb'?'markdown':'notes']:saved.content});
    }
    const actual=ownerImageRequest(url,{
     method:options.method,
     headers:{...options.headers,Origin:origin},
     ...(options.body!==undefined?{body:options.body}:{}),
    });
    if(url===origin+'/api/v3/media/stage')return stage.handle(actual);
    return live.handle(actual);
   };
   const coordinator=createD6OwnerMediaUploadCoordinator({
    root:origin+'/fishing/',request,enabled:()=>true,
    readingMode:()=> 'Automatic',
   });
   const uploads=files.map(x=>({path:x.path,role:x.role,
    file:new File([image],x.filename,{type:'image/png'})}));
   const saved=await saveD6OwnerEditorMedia({
    domain,record,markdown,expectedRevision:1,uploads,
    capabilities:{canUploadNewImages:true},coordinator,
   });
   assert.equal(saved.verified,true,domain);
   assert.equal(saved.revision,2,domain);
   assert.equal(f.count('d6_media_refs'),files.length,domain);
   assert.equal(f.count('d6_media_objects'),1,
    'identical originals are stored by SHA, not filename');
   assert.equal(created,1,'R2 staging deduplicates same original');
   assert.equal(requests.filter(x=>x.url.endsWith('/media/stage')).length,
    files.length,domain);
   assert.equal(requests.filter(x=>x.url.endsWith('/media/publish')).length,
    1,'one atomic D1 Save for the whole sequence');
   const paths=await loadD6PublishedMediaPaths({
    root:origin+'/fishing/',request,enabled:()=>true,
    readingMode:()=> 'Automatic',
   });
   assert.deepEqual([...paths].sort(),files.map(x=>x.path).sort());
   const resolver=createD6ContentImageResolver({
    root:origin+'/fishing/',enabled:()=>true,
    readingMode:()=> 'Automatic',publishedPaths:paths,
   });
   for(const x of files){
    const url=resolver.resolve(x.path);
    assert.equal(url,origin+'/api/v3/media/live/'+encodedPath(x.path));
    const response=await live.handle(ownerImageRequest(url));
    assert.equal(response.status,200,x.path);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()),image);
    assert.equal((await live.handle(new Request(url))).status,403);
   }
   const beforeOffline=requests.length;
   const offline=createD6OwnerMediaUploadCoordinator({
    root:origin+'/fishing/',request,enabled:()=>true,
    readingMode:()=> 'Work Offline',
   });
   await assert.rejects(saveD6OwnerEditorMedia({
    domain,record,markdown,expectedRevision:2,uploads,
    capabilities:{canUploadNewImages:true},coordinator:offline,
   }),{code:'MEDIA_DISABLED'});
   assert.equal(requests.length,beforeOffline,'offline refuses every provider call');
  }
 }finally{
  if(bitmap===undefined)delete globalThis.createImageBitmap;
  else globalThis.createImageBitmap=bitmap;
 }
});
