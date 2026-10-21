import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {generateStaticPageArtwork} from '../tools/static-page-artwork.mjs';
import {digest} from '../tools/library.mjs';

const pwa=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const assets=path.join(pwa,'assets');

test('static page art conversion retains source PNGs and generates complete deterministic tiny WebP assets',async()=>{
 const source=[];
 for(const dir of ['card-icons','page-hero'])
  for(const filename of (await fs.readdir(path.join(assets,dir))).filter(x=>x.endsWith('.png'))){
   const bytes=await fs.readFile(path.join(assets,dir,filename));
   source.push({dir,filename,sha:digest(bytes)});
  }
 assert.equal(source.length,18);
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'fishing-static-page-art-test-'));
 try{
  const first=await generateStaticPageArtwork({assets,destination:path.join(tmp,'one')});
  const second=await generateStaticPageArtwork({assets,destination:path.join(tmp,'two')});
  assert.deepEqual(first,second);
  assert.equal(first.files,18);
  assert(first.generatedBytes<first.sourceBytes/10,'Optimized display images should be substantially smaller than original artwork');
  assert.equal(first.outputs.filter(x=>x.startsWith('card-icons/')).length,16);
  assert.equal(first.outputs.filter(x=>x.startsWith('page-hero/')).length,2);
  for(const {dir,filename,sha} of source){
   assert.equal(digest(await fs.readFile(path.join(assets,dir,filename))),sha,'source PNG is unchanged');
   const output=filename.replace(/\.png$/,'.webp');
   const a=await fs.readFile(path.join(tmp,'one',dir,output));
   const b=await fs.readFile(path.join(tmp,'two',dir,output));
   assert.deepEqual(a,b,'deterministic build derivative');
   const data=await sharp(a).metadata();
   assert.equal(data.format,'webp');
   const originalStats=await sharp(path.join(assets,dir,filename)).stats();
   if(originalStats.channels[3]?.min<255)assert.equal(data.hasAlpha,true,'actual transparent pixels must be preserved');
   if(dir==='card-icons')assert.deepEqual([data.width,data.height],[128,128]);
   else assert(data.width<=(filename.includes('wide')?2560:1440));
  }
  for(const [css,dir] of [['card-icons.css','card-icons'],['page-hero.css','page-hero']]){
   const text=await fs.readFile(path.join(pwa,'src',css),'utf8');
   const referenced=[...text.matchAll(/url\(["']?\.\/([^)"']+)["']?\)/g)].map(m=>m[1]).filter(x=>x.startsWith(dir+'/'));
   assert.equal(referenced.length,dir==='card-icons'?16:2);
   for(const file of referenced)assert(first.outputs.includes(file),'CSS points to generated WebP: '+file);
   assert(!referenced.some(file=>file.endsWith('.png')),'no original PNG fetched by CSS');
  }
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
});
