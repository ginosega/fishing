#!/usr/bin/env node
// Loopback-only D5 browser acceptance. Serves an independently built candidate
// from an isolated URL scope; NEVER publishes any bytes or calls Cloudflare.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {V3_READER_CANDIDATE_BASE as BASE} from '../src/v3-reader-candidate.mjs';

const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json',
 '.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg',
 '.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml'};
const options=process.argv.slice(2);
const option=name=>options.find(s=>s.startsWith(name+'='))?.slice(name.length+1);
const denied=(res,status=404)=>{
 res.writeHead(status,{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 res.end('Not found');
};
export function candidateHandler({root}={}){
 if(typeof root!=='string'||!path.isAbsolute(root))
  throw new Error('Candidate preview requires an absolute output path');
 const source=path.resolve(root);
 return async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method))return denied(res,405);
  let url;
  try{url=new URL(req.url,'http://localhost');}catch{return denied(res);}
  if(!url.pathname.startsWith(BASE)||url.search)return denied(res);
  const raw=url.pathname.slice(BASE.length);
  // URL-encoded spaces and Unicode filenames are allowed. Encoded path
  // separators, traversal and alternate Windows separators are forbidden.
  if(/%(?:2f|5c|00)/i.test(raw))return denied(res);
  let relative;
  try{relative=decodeURIComponent(raw)||'index.html';}
  catch{return denied(res);}
  const segments=relative.split('/');
  if(segments.some(s=>s===''||s==='.'||s==='..'||s.includes('\\')||
   s.includes('\0')||s.includes(':')))return denied(res);
  const target=path.resolve(source,relative);
  if(!target.startsWith(source+path.sep))return denied(res);
  let file;
  try{
   const realRoot=await fs.realpath(source),realFile=await fs.realpath(target);
   if(!realFile.startsWith(realRoot+path.sep))return denied(res);
   const stat=await fs.stat(realFile);
   if(!stat.isFile())return denied(res);
   file=await fs.readFile(realFile);
  }catch{return denied(res);}
  res.writeHead(200,{
   'Content-Type':TYPES[path.extname(target).toLowerCase()]||'application/octet-stream',
   'Cache-Control':'no-store',
   'X-Content-Type-Options':'nosniff',
   'Referrer-Policy':'no-referrer',
  });
  res.end(req.method==='HEAD'?undefined:file);
 };
}
export async function startCandidateServer({root,port=4173}={}){
 const pointer=JSON.parse(await fs.readFile(path.join(root,'release.json'),'utf8'));
 const manifest=JSON.parse(await fs.readFile(path.join(root,pointer.manifest),'utf8'));
 if(manifest.base!==BASE||manifest.v3ReaderCandidate!==true||
  manifest.releaseId!==pointer.id||manifest.sourceRevision!==pointer.sourceRevision)
  throw new Error('Refusing to serve a build not marked as the isolated V3 reader candidate');
 const server=http.createServer(candidateHandler({root:path.resolve(root)}));
 await new Promise((resolve,reject)=>{
  server.once('error',reject);
  server.listen(port,'127.0.0.1',resolve);
 });
 return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=option('--out'),port=Number(option('--port')||4173);
 if(!root||!path.isAbsolute(root)||!Number.isInteger(port)||port<1024||port>65535)
  throw new Error('Use --out=ABSOLUTE_PATH [--port=4173]');
 startCandidateServer({root,port}).then(()=>{
  console.log('Local only: http://127.0.0.1:'+port+BASE);
  console.log('Ctrl+C stops preview; no internet or Cloudflare deployment.');
 }).catch(error=>{console.error(error.message);process.exitCode=1;});
}
