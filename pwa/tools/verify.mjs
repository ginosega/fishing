#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validatePointer,validateManifest,decodeVerifiedJson,verifyBytes} from '../src/release.mjs';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const args=process.argv.slice(2),option=(key,fallback)=>args.find(x=>x.startsWith(key+'='))?.slice(key.length+1)||fallback;
const output=path.resolve(option('--out',path.join(repo,'pwa/dist-v3-pilot')));
export async function verify(root=output){
 const read=async p=>fs.readFile(path.join(root,p));
 const pointer=validatePointer(JSON.parse(await read('release.json')));
 const manifestBytes=await read(pointer.manifest);
 const manifest=await decodeVerifiedJson(manifestBytes,pointer.manifestSha256);
 const entries=validateManifest(manifest,pointer,manifest.base);
 if(!manifest.base.startsWith('/')||!manifest.base.endsWith('/')||manifest.base.includes('..')||manifest.base.includes('//'))throw new Error('Invalid release base');
 const actual=[];
 async function scan(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const absolute=path.join(dir,entry.name),relative=path.relative(root,absolute).split(path.sep).join('/');
  if(entry.isDirectory())await scan(absolute);else if(entry.isFile())actual.push(relative);else throw new Error('Unexpected generated file type: '+relative);
 }}
 await scan(root);
 const expected=new Set([...entries.keys(),pointer.manifest,'release.json']);
 for(const file of actual)if(!expected.has(file))throw new Error('Unmanifested output: '+file);
 for(const file of expected)if(!actual.includes(file))throw new Error('Missing output: '+file);
 for(const entry of entries.values())await verifyBytes(await read(entry.path),entry);
 if(pointer.standaloneV3!==true||manifest.format!=='fishing-companion-software-v3'||manifest.base!=='/fishing/'||pointer.pendingMedia||manifest.pendingMedia)
  throw Error('Standalone V3 software release required');
 const report={releaseId:pointer.id,sourceRevision:pointer.sourceRevision,files:entries.size,bytes:manifest.totalBytes,counts:null,pendingMedia:0,verified:true};
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))verify().then(x=>console.log(JSON.stringify(x,null,2))).catch(error=>{console.error(error);process.exitCode=1;});
