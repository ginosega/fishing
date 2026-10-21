import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {digest} from './library.mjs';
import {safePath} from '../src/shared.mjs';

/**
 * Build-only, deterministic, disposable previews for card grids.
 * Canonical Gear/KB/Catches pictures (including animated originals) are not edited.
 * The 512x270 box provides up to 2x density at the current card display height.
 * A GIF's first frame is sufficient for a static card; full animation is preserved
 * on the detail page. Transparent source pixels remain transparent.
 */
export async function generateCardThumbnails({data,source,destination}){
 const pictures=[
  ...data.gear.items.map(item=>item.picture?.src),
  ...data.kb.entities.map(entity=>entity.picture?.src)
 ].filter(Boolean);
 const originals=[...new Set(pictures)].sort((a,b)=>a.localeCompare(b,'en'));
 const mapping={};let sourceBytes=0,generatedBytes=0;
 await fs.mkdir(destination,{recursive:true});
 for(const src of originals){
  safePath(src);
  const original=await fs.readFile(path.join(source,src));
  const file=digest(Buffer.from(src,'utf8'))+'.webp';
  const derivative=await sharp(original,{page:0,failOn:'error',limitInputPixels:36000000})
   .rotate().resize({width:512,height:270,fit:'inside',withoutEnlargement:true})
   .webp({quality:80,alphaQuality:90,effort:4}).toBuffer();
  mapping[src]=file;
  await fs.writeFile(path.join(destination,file),derivative);
  sourceBytes+=original.length;generatedBytes+=derivative.length;
 }
 return {mapping,originals:originals.length,sourceBytes,generatedBytes};
}
