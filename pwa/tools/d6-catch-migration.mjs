/**
 * FISH-TODO-118: original 12 Catch records, source-only D1 import preparation.
 * Never contacts Cloudflare or mutates D1. Original Git blobs are authoritative
 * on Windows (working-copy CRLF is not).
 */
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile,readdir,stat,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import MarkdownIt from 'markdown-it';
import {resolveMarkdownTarget} from '../src/markdown.mjs';
import {safePath} from '../src/shared.mjs';
import schema from '../contracts/schema.json' with {type:'json'};

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const FROZEN='1522cf990f3ac6422ef17970793ec86604007a5a';
const IMAGE=/\.(?:jpe?g|png|webp|gif)$/i;
const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const md=new MarkdownIt({html:false,linkify:false});
const validate=new Ajv2020({strict:true}).compile({
 $ref:'#/$defs/catchBundle',$defs:schema.$defs,
});
const digest=(bytes,algo='sha256')=>createHash(algo).update(bytes).digest('hex');
const blobHash=bytes=>digest(Buffer.concat([
 Buffer.from('blob '+bytes.length+'\0'),bytes,
]),'sha1');
const quote=v=>"'"+String(v).replaceAll("'","''")+"'";
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
function gitBytes(root,rel){
 const name='pwa/'+safePath(rel);
 try{return execFileSync('git',['show','HEAD:'+name],{
  cwd:path.dirname(root),windowsHide:true,maxBuffer:16*1024*1024,
 });}catch{throw Error('Missing immutable Git blob: '+name);}
}
function gitTree(root){
 const raw=execFileSync('git',['ls-tree','-r','-z','HEAD','--','pwa/Catches'],{
  cwd:path.dirname(root),windowsHide:true,maxBuffer:4*1024*1024,
 });
 const result=new Map();
 for(const line of raw.toString('utf8').split('\0').filter(Boolean)){
  const match=/^100644 blob ([a-f0-9]{40})\tpwa\/(Catches\/.*)$/.exec(line);
  check(match,'Unexpected Catch Git tree entry');
  const file=safePath(match[2]);
  check(!result.has(file),'Duplicate Catch file: '+file);
  result.set(file,match[1]);
 }
 return result;
}
async function localFiles(root,rel='Catches'){
 const entries=await readdir(path.join(root,...rel.split('/')),{withFileTypes:true});
 const files=[];
 for(const e of entries){
  const name=safePath(rel+'/'+e.name);
  if(e.isDirectory())files.push(...await localFiles(root,name));
  else if(e.isFile())files.push(name);
  else throw Error('Unsupported Catch source file: '+name);
 }
 return files.sort();
}
function imagePaths(markdown,owner){
 const result=new Set();
 const visit=tokens=>{for(const token of tokens){
  if(token.type==='image'){
   const ref=resolveMarkdownTarget(token.attrGet('src'),{
    owner,assetBase:'https://example.invalid/fishing/releases/test/',
   });
   check(ref.kind==='local','External/invalid Catch Notes image: '+owner);
   result.add(ref.local);
  }
  if(token.children)visit(token.children);
 }};
 visit(md.parse(markdown,{}));
 return [...result];
}
export async function prepareD6CatchMigration({root=ROOT}={}){
 root=path.resolve(root);
 const tree=gitTree(root);
 const catalog=gitBytes(root,'Catches/catches.json');
 const blob=blobHash(catalog);
 check(tree.get('Catches/catches.json')===blob&&blob===FROZEN,
  'Frozen original Catch source differs: '+blob);
 const bundle=JSON.parse(catalog.toString('utf8'));
 check(validate(bundle),'Original Catch bundle schema invalid');
 check(bundle.catches.length===12,'Original Catch count differs');
 const files=await localFiles(root);
 check(files.length===tree.size&&files.every(file=>tree.has(file)),
  'Catch working tree differs from committed file inventory');
 const assets=[];
 for(const file of files.filter(f=>IMAGE.test(f))){
  const absolute=path.resolve(root,...file.split('/'));
  check(absolute.startsWith(root+path.sep)&&
   (await stat(absolute)).isFile(),'Catch image missing: '+file);
  const bytes=await readFile(absolute);
  check(blobHash(bytes)===tree.get(file),
   'Catch image byte mismatch: '+file);
  assets.push({path:file,bytes:bytes.length,sha256:digest(bytes)});
 }
 check(assets.length===8,'Expected eight unique original Catch photographs');
 const assetPaths=new Set(assets.map(x=>x.path));
 const usedNotes=new Set(),ids=new Set(),images=new Set();
 const rows=[],statements=[];
 for(const record of bundle.catches){
  check(typeof record.id==='string'&&ID.test(record.id)&&
   !ids.has(record.id),'Invalid or duplicate Catch ID');
  ids.add(record.id);
  check(record.notes==='Catches/content/'+record.id+'.md'&&
   tree.has(record.notes)&&!usedNotes.has(record.notes),
   'Missing, shared or renamed original Catch Notes: '+record.id);
  usedNotes.add(record.notes);
  const bytes=gitBytes(root,record.notes);
  check(blobHash(bytes)===tree.get(record.notes)&&
   Buffer.from(bytes.toString('utf8'),'utf8').equals(bytes),
   'Canonical Catch Markdown bytes differ: '+record.id);
  const notes=bytes.toString('utf8');
  check(notes.trim().length>0,'Empty original Catch Notes: '+record.id);
  const refs=imagePaths(notes,record.notes);
  for(const ref of refs){
   check(assetPaths.has(ref),'Original Catch photo missing: '+ref);
   images.add(ref);
  }
  const json=JSON.stringify(record);
  rows.push({id:record.id,notesPath:record.notes,
   recordSha256:digest(Buffer.from(json)),
   notesSha256:digest(bytes),inlineImagePaths:refs});
  statements.push('INSERT INTO d6_catch_records(id,revision,record_json,notes_text,updated_at) VALUES('+
   [quote(record.id),'1',quote(json),quote(notes),
    "CAST(strftime('%s','now') AS INTEGER)"].join(',')+
   ') ON CONFLICT(id) DO NOTHING;');
 }
 check(ids.size===12&&usedNotes.size===12&&statements.length===12,
  'Original Catch Notes/record completeness failed');
 check(images.size===8,'Original Catch photos not all referenced');
 const report={format:'d6-direct-catch-import-v1',
  source:{catchGitBlobSha1:blob,catchSha256:digest(catalog)},
  counts:{records:12,newInserts:12,linkedMarkdown:12,
   imageAssets:8,usedImages:images.size,
   inlineImageRefs:rows.reduce((sum,r)=>sum+r.inlineImagePaths.length,0)},
  records:rows,assets};
 const sql=[
  '-- Original 12 Catches. SOURCE ONLY until separate owner approval.',
  '-- Requires read-only D1 preflight, full current D1 export and approval.',
  '-- Insert-only: never overwrite Gear, KB, or already edited Catches.',
  'CREATE TABLE IF NOT EXISTS d6_catch_records (id TEXT PRIMARY KEY, revision INTEGER NOT NULL CHECK(revision >= 1), record_json TEXT NOT NULL, notes_text TEXT NOT NULL, updated_at INTEGER NOT NULL);',
  ...statements,'',
 ].join('\n');
 return {sql,report};
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==2||args[0]!=='--out')
  throw Error('Usage: node tools/d6-catch-migration.mjs --out <new-local-folder>');
 const {sql,report}=await prepareD6CatchMigration();
 const output=path.resolve(args[1]);
 await mkdir(output,{recursive:true});
 await writeFile(path.join(output,'catch-import.sql'),sql,{flag:'wx'});
 await writeFile(path.join(output,'catch-integrity.json'),
  JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log('SOURCE ONLY: 12 Catches, 12 Markdown Notes, 8 referenced original photos.');
 console.log('Prepared table schema and 12 insert-only statements. NO D1 CHANGES.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(error=>{console.error(error.message);process.exitCode=1;});
