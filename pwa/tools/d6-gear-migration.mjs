/**
 * One-time FISH118 V3 Gear import preparation. No network or database writes.
 * Run locally only with the frozen Gear/ files in the checked out source.
 * Output SQL + an integrity report for owner review, never run the SQL here.
 */
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile,readdir,stat,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import schema from '../contracts/schema.json' with {type:'json'};
import {safePath,GEAR_CATEGORIES} from '../src/shared.mjs';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT=path.resolve(HERE,'..');
const EXPECTED_BLOB='741ba8f19c06834eb6e92fea84404fdb2ac58f88';
const PILOT='daiwa-tatula-xt-rod';
const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE=/\.(?:jpe?g|png|webp|gif|svg)$/i;
const validate=new Ajv2020({strict:true}).compile({
 $ref:'#/$defs/gearBundle',$defs:schema.$defs,
});
const digest=(bytes,algorithm='sha256')=>createHash(algorithm).update(bytes).digest('hex');
const blobHash=bytes=>digest(Buffer.concat([
 Buffer.from('blob '+bytes.length+'\0'),bytes,
]),'sha1');
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
const assert=(value,message)=>{if(!value)throw Error(message);};

async function scanFiles(root,relative='Gear'){
 const entries=await readdir(path.join(root,...relative.split('/')),{
  withFileTypes:true,
 });
 const files=[];
 for(const ent of entries){
  const rel=relative+'/'+ent.name;
  if(ent.isDirectory())files.push(...await scanFiles(root,rel));
  else if(ent.isFile())files.push(safePath(rel));
  else throw Error('Unexpected source symlink or special file: '+rel);
 }
 return files.sort();
}
function gitBytes(root,relative){
 const name='pwa/'+safePath(relative);
 try{
  // Git stores canonical LF text even if Windows checked it out as CRLF.
  // Retrieve the exact committed bytes; never import checkout conversions.
  return execFileSync('git',['show','HEAD:'+name],{
   cwd:path.dirname(root),windowsHide:true,maxBuffer:16*1024*1024,
  });
 }catch{throw Error('Could not read immutable Git blob: '+name);}
}
function trackedTree(root){
 let raw;
 try{
  raw=execFileSync('git',['ls-tree','-r','-z','HEAD','--','pwa/Gear'],{
   cwd:path.dirname(root),windowsHide:true,maxBuffer:4*1024*1024,
  });
 }catch{throw Error('Could not inspect committed Gear tree');}
 const blobs=new Map();
 for(const entry of raw.toString('utf8').split('\0').filter(Boolean)){
  const match=/^100644 blob ([a-f0-9]{40})\tpwa\/(Gear\/.*)$/.exec(entry);
  if(!match)throw Error('Unexpected committed Gear tree entry');
  const rel=safePath(match[2]);
  assert(!blobs.has(rel),'Duplicate tracked Gear path: '+rel);
  blobs.set(rel,match[1]);
 }
 return blobs;
}
async function checkedFile(root,relative){
 const name=safePath(relative),absolute=path.resolve(root,...name.split('/'));
 assert(absolute.startsWith(root+path.sep),'Gear path outside checked root');
 const fileInfo=await stat(absolute);
 assert(fileInfo.isFile(),'Missing Gear file: '+name);
 const bytes=await readFile(absolute);
 return {path:name,sha256:digest(bytes),size:bytes.length,bytes};
}

export async function prepareD6GearMigration({root=DEFAULT_ROOT}={}){
 root=path.resolve(root);
 const tree=trackedTree(root);
 const catalogBytes=gitBytes(root,'Gear/gear.json');
 const actualBlob=blobHash(catalogBytes);
 assert(tree.get('Gear/gear.json')===actualBlob,
  'Frozen Gear catalog Git tree mismatch');

 assert(actualBlob===EXPECTED_BLOB,
  'Frozen Gear catalog differs from original V2 source: '+actualBlob);
 let bundle;
 try{bundle=JSON.parse(catalogBytes.toString('utf8'));}
 catch{throw Error('Gear source JSON is invalid');}
 assert(validate(bundle),'Frozen Gear schema invalid');
 const rows=bundle.items;
 assert(rows.length===100,'Unexpected Gear count: '+rows.length);
 const allFiles=await scanFiles(root),available=new Set(allFiles);
 assert(allFiles.length===tree.size&&allFiles.every(name=>tree.has(name)),
  'Working Gear file set differs from committed Gear tree');

 // Preserve all image files, including inline Notes images in /content/.
 const allAssets=allFiles.filter(name=>IMAGE.test(name));
 assert(allAssets.length===112,'Unexpected image asset count: '+allAssets.length);
 const images=[];
 for(const name of allAssets){
  const f=await checkedFile(root,name);
  assert(blobHash(f.bytes)===tree.get(name),
   'Gear image bytes differ from immutable Git source: '+name);
  images.push({path:f.path,sha256:f.sha256,bytes:f.size});
 }
 const imageByPath=new Map(images.map(item=>[item.path,item]));
 const encountered=new Set(),usedNotes=new Set();
 const reportRows=[],inserts=[],categories=Object.fromEntries(
  GEAR_CATEGORIES.map(([id])=>[id,0]));
 for(const record of rows){
  assert(typeof record.id==='string'&&ID.test(record.id)&&
   !encountered.has(record.id),'Duplicate/invalid Gear ID');
  encountered.add(record.id);
  assert(Object.hasOwn(categories,record.category),
   'Unrecognized Gear category: '+record.id);
  categories[record.category]++;
  assert(record.picture?.src&&
   imageByPath.has(record.picture.src),'Gear image missing: '+record.id);
  let notes='',notesSha256=null;
  if(record.notes){
   assert(available.has(record.notes)&&record.notes.includes('/content/'),
    'Gear notes missing: '+record.id);
   assert(!usedNotes.has(record.notes),'Notes path shared: '+record.notes);
   usedNotes.add(record.notes);
   const bytes=gitBytes(root,record.notes);
   assert(blobHash(bytes)===tree.get(record.notes),
    'Notes Git blob differs from committed tree: '+record.id);
   notes=bytes.toString('utf8');
   assert(Buffer.from(notes,'utf8').equals(bytes),
    'Notes contain non-UTF8 data: '+record.id);
   notesSha256=digest(bytes);
  }
  const recordJSON=JSON.stringify(record);
  reportRows.push({
   id:record.id,category:record.category,
   recordSha256:digest(Buffer.from(recordJSON)),
   notesPath:record.notes||null,notesSha256,
   picturePath:record.picture.src,
   pictureSha256:imageByPath.get(record.picture.src).sha256,
  });
  // Preserve the live approved pilot row and revision (potentially 3+).
  // All other source records are new inserts only, never updates.
  if(record.id!==PILOT)inserts.push(
   'INSERT INTO d6_gear_records(id,revision,record_json,notes_text,updated_at) VALUES('+
   [quote(record.id),'1',quote(recordJSON),quote(notes),
    "CAST(strftime('%s','now') AS INTEGER)"].join(',')+
   ') ON CONFLICT(id) DO NOTHING;');
 }
 assert(encountered.has(PILOT),'Pilot record missing');
 assert(usedNotes.size===63,'Unexpected linked Notes count');
 assert(inserts.length===99,'Unexpected insert count');
 const report={
  format:'d6-direct-gear-import-v1',
  source:{gearGitBlobSha1:actualBlob,gearSha256:digest(catalogBytes)},
  pilot:{id:PILOT,policy:'preserve-existing-row-and-revision'},
  counts:{records:rows.length,newInserts:inserts.length,
   linkedNotes:usedNotes.size,referencedPictures:rows.length,
   gearImageAssets:images.length},
  categories,records:reportRows,assets:images,
 };
 const sql=[
  '-- Generated from frozen V2 Gear catalog. No network calls or Cloudflare writes.',
  '-- Verify the independent D1 backup and existing pilot row before execution.',
  '-- Expected source Gear blob '+EXPECTED_BLOB,
  '-- Expected 99 inserts; the already-tested pilot row is NOT overwritten.',
  '-- Never run without explicit owner approval for this bulk migration.',
  ...inserts,'',
 ].join('\n');
 return {sql,report};
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==2||args[0]!=='--out')
  throw Error('Usage: node tools/d6-gear-migration.mjs --out <local-folder>');
 const out=path.resolve(args[1]);
 const {sql,report}=await prepareD6GearMigration();
 await mkdir(out,{recursive:true});
 await writeFile(path.join(out,'gear-import.sql'),sql,{flag:'wx'});
 await writeFile(path.join(out,'gear-integrity.json'),
  JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log('SOURCE ONLY: 100 records; 63 Notes; 100 referenced pictures; 112 image assets.');
 console.log('SQL prepared for 99 inserts; existing pilot row untouched.');
 console.log('Wrote gear-import.sql and gear-integrity.json; no Cloudflare changes.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(error=>{console.error(error.message);process.exitCode=1;});
