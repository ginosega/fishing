import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

// P0 diagnostic only. This estimates prospective disposable thumbnail bytes.
// No source pictures or generated release content are modified.
// Actual image fidelity and physical Android performance remain separate gates.
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const source=path.join(repo,'pwa');
const loadJson=async file=>JSON.parse(await fs.readFile(path.join(source,file),'utf8'));
const mb=bytes=>Math.round(bytes/1048576*100)/100;
test('P0-B diagnostic: 512x270 WebP derivative byte budgets for Lures and Techniques',async()=>{
 const gear=await loadJson('Gear/gear.json'),kb=await loadJson('KB/kb.json');
 const groups=[
  {name:'gear-lures',records:gear.items.filter(x=>x.category==='lures')},
  {name:'kb-techniques',records:kb.entities.filter(x=>x.type==='technique')}
 ];
 for(const group of groups){
  let originalBytes=0,thumbnailBytes=0;
  const results=[];
  for(const record of group.records){
   if(!record.picture?.src)continue;
   const original=await fs.readFile(path.join(source,record.picture.src));
   const candidate=await sharp(original).rotate().resize({width:512,height:270,fit:'inside',withoutEnlargement:true}).webp({quality:80,effort:4}).toBuffer();
   const meta=await sharp(candidate).metadata();
   assert.equal(meta.format,'webp');
   assert(meta.width<=512&&meta.height<=270);
   originalBytes+=original.length;thumbnailBytes+=candidate.length;
   results.push({name:record.name,original:original.length,candidate:candidate.length});
  }
  assert(results.length>0);
  results.sort((a,b)=>b.original-a.original);
  console.log('P0_THUMBNAIL_METRIC '+JSON.stringify({
   group:group.name,count:results.length,originalMiB:mb(originalBytes),
   candidateMiB:mb(thumbnailBytes),savingPct:+(100*(1-thumbnailBytes/originalBytes)).toFixed(2),
   largestOriginals:results.slice(0,6)
  }));
 }
});
