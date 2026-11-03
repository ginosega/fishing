#!/usr/bin/env node
// D5 source-only, offline Pages Direct Upload packaging. NEVER deploys.
// The canonical pwa/tools/verify.mjs is mandatory when invoked as a CLI.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const READER_BASE='/fishing/__v3_reader_candidate__/';
const UNDER='fishing/__v3_reader_candidate__';
const HEX32=/^[a-f0-9]{32}$/, HEX40=/^[a-f0-9]{40}$/, HEX64=/^[a-f0-9]{64}$/;
const MAX_FILES=20000, MAX_FILE_BYTES=25*1024*1024;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const forbidden=new Set(['_worker.js','_routes.json','_redirects','_headers']);
const headers=`/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n`;
const notFound='<!doctype html>\n<html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>404 Not Found</title><body><h1>Not Found</h1></body></html>\n';
const robots='User-agent: *\nDisallow: /\n';

function cleanRelative(name){
 if(typeof name!=='string'||!name||name.startsWith('/')||name.includes('\\')||
    name.includes('\0')||name.includes(':'))throw Error('Unsafe candidate path');
 const parts=name.split('/');
 if(parts.some(p=>!p||p==='.'||p==='..'||p==='functions'||forbidden.has(p)))
  throw Error('Forbidden candidate asset path: '+name);
 return name;
}
async function walk(root,{pagesRoot=false}={}){
 const results=[];
 async function recur(dir,relative=''){
  for(const dirent of await fs.readdir(dir,{withFileTypes:true})){
   if(dirent.isSymbolicLink()||(!dirent.isDirectory()&&!dirent.isFile()))
    throw Error('Unsafe candidate filesystem entry');
   const name=relative?relative+'/'+dirent.name:dirent.name;
   if(!(pagesRoot&&!relative&&dirent.name==='_headers'))cleanRelative(name);
   if(dirent.isDirectory())await recur(path.join(dir,dirent.name),name);
   else results.push(name);
  }
 }
 await recur(root);
 return results.sort();
}
async function assertVacant(target){
 try{await fs.lstat(target);throw Error('Refusing to overwrite existing destination: '+target);}
 catch(error){if(error?.code!=='ENOENT')throw error;}
}
async function verifiedCandidate(source,expectedRevision){
 const pointer=JSON.parse(await fs.readFile(path.join(source,'release.json'),'utf8'));
 if(!HEX32.test(pointer?.id)||!HEX40.test(pointer?.sourceRevision)||
    pointer.sourceRevision!==expectedRevision||!HEX64.test(pointer?.manifestSha256)||
    pointer.manifest!==`releases/${pointer.id}/manifest.json`||
    pointer.pendingMedia!==false)throw Error('Incorrect candidate pointer or source revision');
 const manifestBytes=await fs.readFile(path.join(source,pointer.manifest));
 if(sha(manifestBytes)!==pointer.manifestSha256)throw Error('Manifest SHA-256 mismatch');
 const manifest=JSON.parse(manifestBytes.toString('utf8'));
 if(manifest?.format!=='fishing-companion-release-v2'||
    manifest.base!==READER_BASE||manifest.v3ReaderCandidate!==true||
    manifest.releaseId!==pointer.id||manifest.sourceRevision!==pointer.sourceRevision||
    manifest.pendingMedia!==false||manifest.unresolvedMedia?.length>0||
    !Array.isArray(manifest.files)||manifest.files.length===0)
  throw Error('Not an exact isolated, complete V3 reader candidate');
 const expected=new Map();let total=0;
 for(const entry of manifest.files){
  const name=cleanRelative(entry?.path);
  if(expected.has(name)||name==='release.json'||name===pointer.manifest||
     !Number.isSafeInteger(entry.bytes)||entry.bytes<0||entry.bytes>MAX_FILE_BYTES||
     !HEX64.test(entry.sha256))throw Error('Invalid or oversized candidate asset: '+name);
  total+=entry.bytes;expected.set(name,entry);
 }
 for(const required of ['index.html','loader.js','sw.js','manifest.webmanifest',
   'icon.png','icon-maskable.png',`releases/${pointer.id}/app.js`,
   `releases/${pointer.id}/styles.css`,
   ...['Gear/gear.json','KB/kb.json','Catches/catches.json'].map(p=>
    `releases/${pointer.id}/content/${p}`)]){
  if(!expected.has(required))throw Error('Required candidate asset missing: '+required);
 }
 if(expected.size+2>MAX_FILES-3||!Number.isSafeInteger(total)||
    total!==manifest.totalBytes)throw Error('Cloudflare file budget or manifest byte total mismatch');
 const actual=await walk(source);
 const declared=[...expected.keys(),pointer.manifest,'release.json'].sort();
 if(actual.length!==declared.length||actual.some((p,i)=>p!==declared[i]))
  throw Error('Candidate contains unexpected or missing files');
 for(const entry of expected.values()){
  const bytes=await fs.readFile(path.join(source,entry.path));
  if(bytes.length!==entry.bytes||sha(bytes)!==entry.sha256)
   throw Error('Candidate file SHA-256 mismatch: '+entry.path);
 }
 const webmanifest=JSON.parse(await fs.readFile(path.join(source,'manifest.webmanifest'),'utf8'));
 if(webmanifest.start_url!=='./'||webmanifest.scope!=='./'||
    webmanifest.display!=='standalone')throw Error('Candidate install scope mismatch');
 const index=await fs.readFile(path.join(source,'index.html'),'utf8');
 if(!index.includes('Isolated V3 reader candidate')||
    !index.includes('no owner publishing'))throw Error('Reader-only identity banner missing');
 return {pointer,manifest,expected,declared,bytes:total};
}

// A distinct test origin is REQUIRED for later deployment. This stages bytes
// only; it never creates a Cloudflare project or performs any network action.
export async function stageReaderPages({candidateDir,destinationDir,expectedRevision}={}){
 if(typeof candidateDir!=='string'||typeof destinationDir!=='string'||
   !HEX40.test(expectedRevision||''))throw Error('Require input, output and exact expected source SHA');
 const source=path.resolve(candidateDir),out=path.resolve(destinationDir);
 if(source===out||source.startsWith(out+path.sep)||out.startsWith(source+path.sep)||
   out===path.parse(out).root||source===path.parse(source).root||
   (path.basename(out)==='dist'&&path.basename(path.dirname(out))==='pwa'))
  throw Error('Source and output must be separate, non-root directories');
 await assertVacant(out);
 const verified=await verifiedCandidate(source,expectedRevision);
 const parent=path.dirname(out);await fs.mkdir(parent,{recursive:true});
 const temp=await fs.mkdtemp(path.join(parent,'.fishing-d5-pages-'));
 try{
  const nested=path.join(temp,UNDER);
  for(const relative of verified.declared){
   const from=path.join(source,relative),to=path.join(nested,relative);
   await fs.mkdir(path.dirname(to),{recursive:true});
   await fs.copyFile(from,to);
  }
  await fs.writeFile(path.join(temp,'404.html'),notFound);
  await fs.writeFile(path.join(temp,'_headers'),headers);
  await fs.writeFile(path.join(temp,'robots.txt'),robots);
  // Second independent pass catches corruption introduced by staging.
  await verifiedCandidate(nested,expectedRevision);
  const staged=await walk(temp,{pagesRoot:true});
  const expected=[...verified.declared.map(p=>UNDER+'/'+p),
   '404.html','_headers','robots.txt'].sort();
  if(staged.length!==expected.length||staged.some((p,i)=>p!==expected[i]))
   throw Error('Unexpected Pages staging output');
  for(const [name,content] of [['_headers',headers],['404.html',notFound],['robots.txt',robots]])
   if(await fs.readFile(path.join(temp,name),'utf8')!==content)
    throw Error('Pages root guard changed: '+name);
  await assertVacant(out);
  await fs.rename(temp,out);
  return Object.freeze({destination:out,base:READER_BASE,
   sourceRevision:verified.pointer.sourceRevision,
   releaseId:verified.pointer.id,assets:verified.expected.size,
   uploadFiles:staged.length,assetBytes:verified.bytes});
 }catch(error){await fs.rm(temp,{recursive:true,force:true});throw error;}
}

export async function auditReaderPages({siteDir,expectedRevision}={}){
 if(typeof siteDir!=='string'||!HEX40.test(expectedRevision||''))
  throw Error('Require staged site directory and exact expected source SHA');
 const site=path.resolve(siteDir),nested=path.join(site,UNDER);
 const checked=await verifiedCandidate(nested,expectedRevision);
 const expected=[...checked.declared.map(p=>UNDER+'/'+p),
  '404.html','_headers','robots.txt'].sort();
 const actual=await walk(site,{pagesRoot:true});
 if(actual.length!==expected.length||actual.some((p,i)=>p!==expected[i]))
  throw Error('Unexpected Pages staging output');
 for(const [name,content] of [['_headers',headers],['404.html',notFound],['robots.txt',robots]])
  if(await fs.readFile(path.join(site,name),'utf8')!==content)
   throw Error('Pages root guard changed: '+name);
 return Object.freeze({base:READER_BASE,releaseId:checked.pointer.id,
  sourceRevision:checked.pointer.sourceRevision,uploadFiles:actual.length,
  assetBytes:checked.bytes});
}

async function main(){
 const flags=new Map();
 for(const arg of process.argv.slice(2)){
  const match=/^(--candidate|--out|--audit-only|--expected-source)=(.+)$/.exec(arg);
  if(!match||flags.has(match[1]))throw Error('Unknown or duplicate packaging argument');
  flags.set(match[1],match[2]);
 }
 const revision=flags.get('--expected-source');
 if(!HEX40.test(revision||''))throw Error('Require --expected-source=40-hex');
 if(flags.has('--audit-only')){
  if(flags.size!==2||!path.isAbsolute(flags.get('--audit-only')))
   throw Error('Audit requires --audit-only=ABS and --expected-source=40-hex');
  const audit=await auditReaderPages({siteDir:flags.get('--audit-only'),expectedRevision:revision});
  console.log(JSON.stringify({kind:'AUDIT_ONLY_NO_DEPLOY',...audit},null,2));
  return;
 }
 if(flags.size!==3||!path.isAbsolute(flags.get('--candidate')||'')||
    !path.isAbsolute(flags.get('--out')||''))
  throw Error('Stage requires --candidate=ABS --out=ABS --expected-source=40-hex');
 // Mandatory canonical source validation before staging any uploadable folder.
 const {verify}=await import('./verify.mjs');
 const report=await verify(flags.get('--candidate'));
 if(report.verified!==true)throw Error('Canonical verification did not pass');
 const staged=await stageReaderPages({candidateDir:flags.get('--candidate'),
  destinationDir:flags.get('--out'),expectedRevision:revision});
 console.log(JSON.stringify({kind:'PREPARED_ONLY_NO_DEPLOY',...staged},null,2));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1]))
 main().catch(err=>{console.error('FAIL: '+err.message);process.exitCode=1;});
