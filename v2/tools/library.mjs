import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {DOMAIN,safePath,assert} from '../src/shared.mjs';
import {validateRecords,collectPaths,checkPathCollisions,validateLibraryPaths} from '../src/validation.mjs';
import {parseMarkdown} from '../src/markdown.mjs';
const extensions={jpeg:['.jpg','.jpeg'],png:['.png'],webp:['.webp'],gif:['.gif']};
export const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export async function loadSource(root){const data={};for(const [domain,d] of Object.entries(DOMAIN))data[domain]=JSON.parse(await fs.readFile(path.join(root,d.file),'utf8'));return data;}
export async function fileUnder(root,relative){
 safePath(relative);const absolute=path.resolve(root,relative),realRoot=await fs.realpath(root);
 assert(absolute.startsWith(path.resolve(root)+path.sep),'Path escapes repository root');
 const real=await fs.realpath(absolute);assert(real.startsWith(realRoot+path.sep),'Symlink escapes repository root');return real;
}
export async function validateImage(bytes,filename){
 const suffix=path.extname(filename).toLowerCase();assert(Object.values(extensions).some(e=>e.includes(suffix)),`Unsupported image extension: ${filename}`);
 assert(bytes.length<=10*1024*1024,`Image exceeds 10 MiB: ${filename}`);
 const meta=await sharp(bytes,{animated:true,failOn:'error',limitInputPixels:36000000}).metadata();
 assert(extensions[meta.format]?.includes(suffix),`Image format mismatch: ${filename}`);
 const width=meta.width,height=meta.pageHeight||meta.height,frames=meta.pages||1;
 assert(width>0&&height>0&&width<=6000&&height<=6000&&width*height<=36000000,`Image dimensions exceed policy: ${filename}`);
 assert(frames<=512&&width*height*frames<=512000000,`Animation decode budget exceeded: ${filename}`);
 for(let page=0;page<frames;page++)await sharp(bytes,{page,pages:1,failOn:'error',limitInputPixels:36000000}).raw().toBuffer();
 return {format:meta.format,width,height,frames};
}
export function unresolvedMedia(migration,decisions,data){
 const exceptions=migration?.exceptions||[],accepted=new Set();
 for(const item of decisions?.absentPictures||[]){
  assert(!accepted.has(item.exceptionId),'Duplicate media decision');
  const exception=exceptions.find(x=>x.id===item.exceptionId);
  assert(exception&&!exception.optional,'Unknown required media exception: '+item.exceptionId);
  assert(item.id===(exception.gearId||(exception.id==='tsuridamashii-snap-swivels'?'tsuridamashii-ball-bearing-snap-swivels':exception.id)),'Media decision identity mismatch');
  const records=item.domain==='gear'?data.gear.items:item.domain==='kb'?data.kb.entities:[];
  assert(records.some(x=>x.id===item.id),'Media decision record missing: '+item.id);
  accepted.add(item.exceptionId);
 }
 return exceptions.filter(x=>!x.optional&&!accepted.has(x.id));
}
export async function inventorySource(root,{pendingMedia=false}={}){
 const data=await loadSource(root),maps=validateRecords(data),routes=validateLibraryPaths(data),files=collectPaths(data),allPaths=[];
 async function scan(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const absolute=path.join(dir,entry.name);if(entry.isDirectory())await scan(absolute);else if(entry.isFile())allPaths.push(path.relative(root,absolute).split(path.sep).join('/'));else throw new Error(`Symlink or special source file: ${absolute}`);}}
 for(const folder of ['Gear','KB','Catches'])await scan(path.join(root,folder));checkPathCollisions(allPaths);
 const exists=new Set(allPaths),docs=new Map(),images=new Map(),references=[];
 for(const file of [...files]){
  const bytes=await fs.readFile(await fileUnder(root,file));
  if(file.endsWith('.md'))docs.set(file,bytes);else images.set(file,await validateImage(bytes,file));
 }
 for(const [owner,bytes] of docs){
  const parsed=parseMarkdown(bytes.toString('utf8'),{owner,maps,exists,pathRoutes:routes});references.push(...parsed.references);
  for(const ref of parsed.references)if(ref.local)files.add(ref.local);
 }
 for(const file of files)if(/\.(?:jpe?g|png|webp|gif)$/i.test(file)&&!images.has(file))images.set(file,await validateImage(await fs.readFile(await fileUnder(root,file)),file));
 let migration=null;try{migration=JSON.parse(await fs.readFile(path.join(root,'v2/migration/reconciliation.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
 let decisions=null;try{decisions=JSON.parse(await fs.readFile(path.join(root,'v2/migration/media-decisions.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
 const pending=unresolvedMedia(migration,decisions,data);
 if(pending.length&&!pendingMedia)throw new Error(`Migration has ${pending.length} unresolved media exceptions; pending-media preview only`);
 const manifest=[];for(const file of [...files].sort()){const bytes=await fs.readFile(await fileUnder(root,file));manifest.push({path:file,bytes:bytes.length,sha256:digest(bytes)});}
 return {data,maps,files:manifest,images,references,migration,pending,routes};
}
