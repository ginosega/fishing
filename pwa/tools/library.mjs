import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {assert} from '../src/shared.mjs';
const extensions={jpeg:['.jpg','.jpeg'],png:['.png'],webp:['.webp'],gif:['.gif']};
export const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
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
