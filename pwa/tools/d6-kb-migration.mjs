/**
 * FISH-TODO-118: one-time Knowledge Base import PREPARATION ONLY.
 * No network or Cloudflare writes. Frozen Git blobs avoid Windows CRLF drift.
 * SQL is a proposal; schema creation / bulk import require owner approval.
 */
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile,readdir,stat,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import schema from '../contracts/schema.json' with {type:'json'};
import {KB_TYPES,safePath} from '../src/shared.mjs';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const FROZEN_KB_BLOB='39217633803ad3969d710fa8d770197c0e83b2a3';
const IMAGE=/\.(?:jpe?g|png|webp|gif|svg)$/i;
const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const validate=new Ajv2020({strict:true}).compile({
 $ref:'#/$defs/kbBundle',$defs:schema.$defs,
});
const hash=(bytes,algorithm='sha256')=>createHash(algorithm).update(bytes).digest('hex');
const gitBlob=bytes=>hash(Buffer.concat([
 Buffer.from('blob '+bytes.length+'\0'),bytes,
]),'sha1');
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
function requireOK(ok,message){if(!ok)throw Error(message);}
function gitBytes(root,relative){
 const name='pwa/'+safePath(relative);
 try{return execFileSync('git',['show','HEAD:'+name],{
  cwd:path.dirname(root),windowsHide:true,maxBuffer:16*1024*1024,
 });}catch{throw Error('Could not read canonical Git blob: '+name);}
}
function committedTree(root){
 let raw;
 try{raw=execFileSync('git',['ls-tree','-r','-z','HEAD','--','pwa/KB'],{
  cwd:path.dirname(root),windowsHide:true,maxBuffer:8*1024*1024,
 });}catch{throw Error('Could not inspect frozen KB source tree');}
 const result=new Map();
 for(const entry of raw.toString('utf8').split('\0').filter(Boolean)){
  const match=/^100644 blob ([a-f0-9]{40})\tpwa\/(KB\/.*)$/.exec(entry);
  requireOK(match,'Unexpected committed KB tree file');
  const name=safePath(match[2]);
  requireOK(!result.has(name),'Duplicate KB path: '+name);
  result.set(name,match[1]);
 }
 return result;
}
async function localFiles(root,relative='KB'){
 const entries=await readdir(path.join(root,...relative.split('/')),{withFileTypes:true});
 const files=[];
 for(const entry of entries){
  const name=safePath(relative+'/'+entry.name);
  if(entry.isDirectory())files.push(...await localFiles(root,name));
  else if(entry.isFile())files.push(name);
  else throw Error('Unexpected KB symlink or special file: '+name);
 }
 return files.sort();
}
export async function prepareD6KBMigration({root=ROOT}={}){
 root=path.resolve(root);
 const tree=committedTree(root);
 const catalog=gitBytes(root,'KB/kb.json');
 const catalogBlob=gitBlob(catalog);
 requireOK(tree.get('KB/kb.json')===catalogBlob&&
  catalogBlob===FROZEN_KB_BLOB,
  'Frozen original KB catalog Git blob differs: '+catalogBlob);
 const bundle=JSON.parse(catalog.toString('utf8'));
 requireOK(validate(bundle),'Frozen KB catalog schema invalid');
 requireOK(bundle.entities.length===60,'Expected exactly 60 original KB entries');
 const available=await localFiles(root);
 requireOK(available.length===tree.size&&available.every(name=>tree.has(name)),
  'KB checkout differs from immutable Git tree');
 const images=[];
 for(const name of available.filter(name=>IMAGE.test(name))){
  const local=path.resolve(root,...name.split('/'));
  requireOK(local.startsWith(root+path.sep),'Unsafe KB image path');
  requireOK((await stat(local)).isFile(),'Missing KB image: '+name);
  const bytes=await readFile(local);
  requireOK(gitBlob(bytes)===tree.get(name),
   'KB media bytes differ from committed Git source: '+name);
  images.push({path:name,sha256:hash(bytes),bytes:bytes.length});
 }
 requireOK(images.length===154,'Original KB image count differs');
 const media=new Map(images.map(x=>[x.path,x]));
 const ids=new Set(),contents=new Set(),records=[],sql=[];
 const types=Object.fromEntries(KB_TYPES.map(([id])=>[id,0]));
 for(const record of bundle.entities){
  requireOK(typeof record.id==='string'&&ID.test(record.id)&&
   !ids.has(record.id),'Duplicate or invalid KB entry ID');
  ids.add(record.id);
  requireOK(Object.hasOwn(types,record.type),
   'Unexpected KB entry type: '+record.id);
  types[record.type]++;
  requireOK(typeof record.content==='string'&&
   record.content.endsWith('.md')&&
   available.includes(record.content)&&!contents.has(record.content),
   'Missing or shared KB Markdown: '+record.id);
  contents.add(record.content);
  const mdBytes=gitBytes(root,record.content);
  requireOK(gitBlob(mdBytes)===tree.get(record.content)&&
   Buffer.from(mdBytes.toString('utf8'),'utf8').equals(mdBytes),
   'KB Markdown Git blob or UTF-8 mismatch: '+record.id);
  const pictures=[...(record.picture?.src?[record.picture.src]:[]),
   ...(record.pictureSequence||[])];
  for(const pic of pictures)requireOK(media.has(pic),
   'KB image / knot sequence frame missing: '+record.id+' / '+pic);
  if(record.pictureSequence)requireOK(record.type==='knot'&&
   record.picture?.src===record.pictureSequence.at(-1),
   'Invalid KB knot sequence: '+record.id);
  const json=JSON.stringify(record),markdown=mdBytes.toString('utf8');
  records.push({id:record.id,type:record.type,contentPath:record.content,
   recordSha256:hash(Buffer.from(json)),markdownSha256:hash(mdBytes),
   picturePath:record.picture?.src??null,
   sequencePaths:record.pictureSequence??[]});
  sql.push('INSERT INTO d6_kb_records(id,revision,record_json,content_text,updated_at) VALUES('+
   [quote(record.id),'1',quote(json),quote(markdown),
    "CAST(strftime('%s','now') AS INTEGER)"].join(',')+
   ') ON CONFLICT(id) DO NOTHING;');
 }
 requireOK(contents.size===60&&sql.length===60,
  'KB content count mismatch');
 const report={format:'d6-direct-kb-import-v1',
  source:{kbGitBlobSha1:catalogBlob,kbSha256:hash(catalog)},
  counts:{records:60,newInserts:60,linkedMarkdown:60,
   kbImageAssets:images.length,
   recordPictureRefs:records.filter(x=>x.picturePath).length,
   knotSequenceFrames:records.reduce((a,x)=>a+x.sequencePaths.length,0)},
  types,records,assets:images,
 };
 const generated=[
  '-- FISH-TODO-118: original 60 KB entries; SOURCE ONLY until explicit owner approval.',
  '-- Requires full existing isolated D1 export, target check and separate approval.',
  '-- Do not blindly retry a provider write or overwrite existing rows.',
  'CREATE TABLE IF NOT EXISTS d6_kb_records (id TEXT PRIMARY KEY, revision INTEGER NOT NULL CHECK(revision >= 1), record_json TEXT NOT NULL, content_text TEXT NOT NULL, updated_at INTEGER NOT NULL);',
  ...sql,'',
 ].join('\n');
 return {sql:generated,report};
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==2||args[0]!=='--out')
  throw Error('Usage: node tools/d6-kb-migration.mjs --out <new-local-folder>');
 const {sql,report}=await prepareD6KBMigration();
 const out=path.resolve(args[1]);
 await mkdir(out,{recursive:true});
 await writeFile(path.join(out,'kb-import.sql'),sql,{flag:'wx'});
 await writeFile(path.join(out,'kb-integrity.json'),
  JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log('SOURCE ONLY: 60 KB entries, 60 Markdown articles, 154 image assets.');
 console.log('Prepared table schema and 60 insert-only statements. NO D1 CHANGES.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(e=>{console.error(e.message);process.exitCode=1;});
