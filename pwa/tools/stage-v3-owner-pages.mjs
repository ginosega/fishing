#!/usr/bin/env node
/**
 * D5 owner candidate: offline, byte-verified Pages staging only.
 * This script never authenticates, writes to Cloudflare, or deploys a route.
 * It stages only the exact isolated /fishing/__v3_owner_candidate__/ scope.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const UNDER='fishing/__v3_owner_candidate__';
const BASE='/'+UNDER+'/';
const HEX32=/^[a-f0-9]{32}$/;
const HEX40=/^[a-f0-9]{40}$/;
const HEX64=/^[a-f0-9]{64}$/;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const guard=(condition,message)=>{if(!condition)throw Error(message);};
const ROBOTS='User-agent: *\nDisallow: /\n';
const NOT_FOUND='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>404</title><body><h1>Not Found</h1></body></html>\n';
const HEADERS=String.raw`/fishing/__v3_owner_candidate__/*
  X-Robots-Tag: noindex, nofollow, noarchive
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: DENY
`;
function safeRelative(name){
 guard(typeof name==='string'&&name.length>0&&name.length<512&&
  !name.startsWith('/')&&!name.includes('\\')&&!name.includes('\0')&&
  !name.includes(':')&&
  name.split('/').every(p=>p&&p!=='.'&&p!=='..'&&!['_worker.js','_headers','_routes.json','_redirects'].includes(p)),
  'Unsafe owner candidate path');
 return name;
}
async function walk(directory){
 const found=[];
 async function scan(parent,relative=''){
  for(const entry of await fs.readdir(parent,{withFileTypes:true})){
   const name=safeRelative(relative?relative+'/'+entry.name:entry.name);
   guard(!entry.isSymbolicLink()&&(entry.isFile()||entry.isDirectory()),
    'Owner candidate contains unsafe filesystem entry');
   if(entry.isDirectory())await scan(path.join(parent,entry.name),name);
   else found.push(name);
  }
 }
 await scan(directory);
 return found.sort();
}
export async function stageV3OwnerPages({candidateDir,destinationDir,expectedSource}={}){
 guard(typeof candidateDir==='string'&&typeof destinationDir==='string'&&
  HEX40.test(expectedSource??''),'Exact input/output and source SHA required');
 const source=path.resolve(candidateDir),out=path.resolve(destinationDir);
 guard(source!==out&&!source.startsWith(out+path.sep)&&
  !out.startsWith(source+path.sep)&&out!==path.parse(out).root&&
  source!==path.parse(source).root&&
  !(path.basename(out)==='dist'&&path.basename(path.dirname(out))==='pwa'),
  'Unsafe owner Pages staging destination');
 try{await fs.lstat(out);throw Error('Refusing to overwrite existing Pages directory');}
 catch(error){if(error?.code!=='ENOENT')throw error;}
 const pointer=JSON.parse(await fs.readFile(path.join(source,'release.json'),'utf8'));
 guard(HEX32.test(pointer.id??'')&&pointer.sourceRevision===expectedSource&&
  HEX64.test(pointer.manifestSha256??'')&&
  pointer.manifest===`releases/${pointer.id}/manifest.json`&&
  pointer.pendingMedia===false,'Untrusted owner Pages source pointer');
 const manifestBytes=await fs.readFile(path.join(source,pointer.manifest));
 guard(digest(manifestBytes)===pointer.manifestSha256,
  'Owner manifest digest mismatch');
 const manifest=JSON.parse(manifestBytes.toString('utf8'));
 guard(manifest.base===BASE&&manifest.v3OwnerCandidate===true&&
  manifest.v3ReaderCandidate!==true&&
  manifest.releaseId===pointer.id&&
  manifest.sourceRevision===expectedSource&&
  manifest.pendingMedia===false&&
  Array.isArray(manifest.files)&&manifest.files.length>0&&
  manifest.files.length<=20000&&manifest.unresolvedMedia?.length===0,
  'Untrusted owner candidate release/manifest');
 const webmanifest=JSON.parse(await fs.readFile(path.join(source,'manifest.webmanifest'),'utf8'));
 guard(webmanifest.start_url==='./'&&webmanifest.scope==='./'&&
  webmanifest.display==='standalone','Owner install scope mismatch');
 const html=await fs.readFile(path.join(source,'index.html'),'utf8');
 guard(html.includes('Isolated V3 owner sandbox candidate')&&
  !html.includes('Isolated V3 reader candidate'),
  'Owner candidate identity banner missing');
 const entries=new Map();let total=0;
 for(const entry of manifest.files){
  const name=safeRelative(entry.path);
  guard(!entries.has(name)&&HEX64.test(entry.sha256??'')&&
   Number.isSafeInteger(entry.bytes)&&entry.bytes>=0&&
   entry.bytes<=25*1024*1024,
   'Invalid/duplicate owner manifest asset');
  entries.set(name,entry);total+=entry.bytes;
 }
 for(const required of ['index.html','loader.js','sw.js',
   'manifest.webmanifest','icon.png','icon-maskable.png',
   `releases/${pointer.id}/app.js`,
   `releases/${pointer.id}/styles.css`])
  guard(entries.has(required),'Missing owner candidate asset: '+required);
 guard(Number.isSafeInteger(total)&&total===manifest.totalBytes,
  'Owner asset total mismatch');
 const list=await walk(source);
 const expected=[...entries.keys(),'release.json',pointer.manifest].sort();
 guard(list.length===expected.length&&list.every((x,i)=>x===expected[i]),
  'Owner Pages candidate has unlisted/missing assets');
 const parent=path.dirname(out);
 await fs.mkdir(parent,{recursive:true});
 const temp=await fs.mkdtemp(path.join(parent,'.d5-owner-pages-'));
 try{
  const nested=path.join(temp,UNDER);
  for(const entry of entries.values()){
   const bytes=await fs.readFile(path.join(source,entry.path));
   guard(bytes.length===entry.bytes&&digest(bytes)===entry.sha256,
    'Owner asset byte mismatch: '+entry.path);
   const target=path.join(nested,entry.path);
   await fs.mkdir(path.dirname(target),{recursive:true});
   await fs.writeFile(target,bytes);
  }
  for(const p of ['release.json',pointer.manifest]){
   const target=path.join(nested,p);
   await fs.mkdir(path.dirname(target),{recursive:true});
   await fs.copyFile(path.join(source,p),target);
  }
  for(const [filename,contents] of [
   ['_headers',HEADERS],['404.html',NOT_FOUND],['robots.txt',ROBOTS]])
   await fs.writeFile(path.join(temp,filename),contents);
  guard((await walk(nested)).length===expected.length,
   'Incomplete owner candidate staging');
  await fs.rename(temp,out);
  return Object.freeze({releaseId:pointer.id,sourceRevision:expectedSource,
   stagedAssets:entries.size,bytes:total,siteDir:out});
 }catch(error){await fs.rm(temp,{recursive:true,force:true});throw error;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const flags=new Map(process.argv.slice(2).map(arg=>{
  const match=/^(--candidate|--out|--expected-source)=(.+)$/.exec(arg);
  if(!match)throw Error('Unexpected owner staging argument');
  return [match[1],match[2]];
 }));
 if(flags.size!==3)throw Error('Owner staging requires three exact arguments');
 stageV3OwnerPages({candidateDir:flags.get('--candidate'),
  destinationDir:flags.get('--out'),
  expectedSource:flags.get('--expected-source')})
  .then(result=>console.log(JSON.stringify(result)),
   error=>{console.error(error);process.exitCode=1;});
}
