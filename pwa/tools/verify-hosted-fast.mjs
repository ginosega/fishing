#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const args=Object.fromEntries(process.argv.slice(2).map(value=>{
 const [key,...rest]=value.replace(/^--/,'').split('=');return [key,rest.join('=')];
}));
const root=args.url||'https://ginosega.github.io/fishing/';
const dist=path.resolve(args.dist||'dist');
const expectedSource=args['source-revision'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const encode=file=>file.split('/').map(encodeURIComponent).join('/');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const retryableStatuses=new Set([404,408,425,429,500,502,503,504]);

async function get(url){
 const attempts=9;
 let lastError;
 for(let attempt=1;attempt<=attempts;attempt++){
  try{
   const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(30000)});
   if(response.status===200)return Buffer.from(await response.arrayBuffer());
   const error=new Error(`${url}\n${response.status} !== 200`);
   error.status=response.status;
   if(!retryableStatuses.has(response.status)||attempt===attempts)throw error;
   lastError=error;
  }catch(error){
   if(error?.status&&!retryableStatuses.has(error.status))throw error;
   lastError=error;
   if(attempt===attempts)throw error;
  }
  await sleep(Math.min(500*(2**(attempt-1)),5000));
 }
 throw lastError;
}
async function tree(dir){
 const result=[];
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const absolute=path.join(dir,entry.name);
  if(entry.isDirectory())for(const file of await tree(absolute))result.push(entry.name+'/'+file);
  else if(entry.isFile())result.push(entry.name);
  else throw new Error('Unsupported generated file: '+absolute);
 }
 return result.sort();
}

const files=await tree(dist);
let verified=0;
for(let index=0;index<files.length;index+=12){
 await Promise.all(files.slice(index,index+12).map(async file=>{
  const expected=await fs.readFile(path.join(dist,file));
  const actual=await get(new URL(encode(file),root));
  assert.equal(hash(actual),hash(expected),'Hosted byte mismatch: '+file);
  verified++;
 }));
}

const pointer=JSON.parse(await fs.readFile(path.join(dist,'release.json'),'utf8'));
if(expectedSource)assert.equal(pointer.sourceRevision,expectedSource,'Built release source revision does not match deployed main');
const manifest=JSON.parse(await fs.readFile(path.join(dist,pointer.manifest),'utf8'));
assert.equal(manifest.releaseId,pointer.id,'Release pointer/manifest ID mismatch');
assert.equal(manifest.sourceRevision,pointer.sourceRevision,'Release pointer/manifest source mismatch');
assert.equal(manifest.pendingMedia,false,'Production content release cannot contain pending media');

const report={
 url:root,
 checkedAt:new Date().toISOString(),
 mode:'fast-content',
 releaseId:pointer.id,
 sourceRevision:pointer.sourceRevision,
 files:verified,
 counts:manifest.counts,
 hostedBytesMatch:true
};
await fs.mkdir('hosted-evidence',{recursive:true});
await fs.writeFile('hosted-evidence/content-verification.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
