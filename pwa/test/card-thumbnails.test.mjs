import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {generateCardThumbnails} from '../tools/card-thumbnails.mjs';
import {digest} from '../tools/library.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('P0-B card thumbnail generation is deterministic and leaves canonical originals unchanged',async()=>{
 const gear=JSON.parse(await fs.readFile(path.join(root,'Gear/gear.json'),'utf8'));
 const kb=JSON.parse(await fs.readFile(path.join(root,'KB/kb.json'),'utf8'));
 const picture=gear.items.find(x=>x.picture?.src)?.picture.src;
 const sample={gear:{items:[{picture:{src:picture}},{picture:{src:picture}}]},kb:{entities:[{picture:{src:kb.entities.find(x=>x.picture?.src).picture.src}}]}};
 const paths=[picture,sample.kb.entities[0].picture.src];
 const originals=await Promise.all(paths.map(x=>fs.readFile(path.join(root,x))));
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'fishing-thumbnail-test-'));
 try{
  const first=await generateCardThumbnails({data:sample,source:root,destination:path.join(temp,'one')});
  const second=await generateCardThumbnails({data:sample,source:root,destination:path.join(temp,'two')});
  assert.equal(first.originals,2);
  assert.deepEqual(first,second);
  for(let i=0;i<paths.length;i++){
   const name=digest(Buffer.from(paths[i],'utf8'))+'.webp';
   assert.equal(first.mapping[paths[i]],name);
   const generated=await fs.readFile(path.join(temp,'one',name));
   const repeat=await fs.readFile(path.join(temp,'two',name));
   assert.deepEqual(generated,repeat);
   const metadata=await sharp(generated).metadata();
   assert.equal(metadata.format,'webp');
   assert(metadata.width<=512&&metadata.height<=270);
   assert.deepEqual(await fs.readFile(path.join(root,paths[i])),originals[i]);
  }
 }finally{await fs.rm(temp,{recursive:true,force:true});}
});

test('P0-B release builds automatically cover added/replaced Gear, KB, Knot and Catch-species card pictures',async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'fishing-new-media-thumbs-'));
 const source=path.join(temp,'source');
 const destA=path.join(temp,'thumb-a'),destB=path.join(temp,'thumb-b');
 const images=[
  'Gear/Rods-Reels/assets/Vision TEST.png',
  'Gear/Lures/assets/New lure.png',
  'KB/Species/assets/Synthetic Bass.png',
  'KB/Knots/assets/p3-synthetic-knot/step-02.png',
 ];
 const make=async(r,g,b)=>sharp({create:{width:960,height:640,channels:4,
  background:{r,g,b,alpha:1}}}).png().toBuffer();
 const bytes=await Promise.all([
  make(25,75,150),make(60,155,20),make(180,80,45),make(10,170,175),
 ]);
 try{
  for(let i=0;i<images.length;i++){
   const file=path.join(source,images[i]);
   await fs.mkdir(path.dirname(file),{recursive:true});
   await fs.writeFile(file,bytes[i]);
  }
  const data={gear:{items:[
   {picture:{src:images[0]}},{picture:{src:images[1]}},
  ]},kb:{entities:[
   {type:'species',picture:{src:images[2]}},
   {type:'knot',picture:{src:images[3]},pictureSequence:[
    'KB/Knots/assets/p3-synthetic-knot/step-01.png',images[3],
   ]},
  ]},catches:{catches:[{speciesId:'p3-species'}]}};
  const before=await generateCardThumbnails({data,source,destination:destA});
  assert.equal(before.originals,4);
  assert.equal(Object.keys(before.mapping).length,4);
  for(let i=0;i<images.length;i++){
   const thumbnail=path.join(destA,before.mapping[images[i]]);
   assert.deepEqual(await fs.readFile(path.join(source,images[i])),bytes[i],
    'Original image must be preserved');
   const meta=await sharp(await fs.readFile(thumbnail)).metadata();
   assert.equal(meta.format,'webp');
   assert(meta.width<=512&&meta.height<=270);
  }
  // A replacement reuses the canonical picture URL; the next release must
  // regenerate derivative *bytes* from the new original, not cache an old
  // preview. Release identity includes both original/derivative byte hashes.
  const updated=await make(245,10,220);
  await fs.writeFile(path.join(source,images[0]),updated);
  const after=await generateCardThumbnails({data,source,destination:destB});
  assert.equal(after.mapping[images[0]],before.mapping[images[0]]);
  assert.notDeepEqual(
   await fs.readFile(path.join(destA,before.mapping[images[0]])),
   await fs.readFile(path.join(destB,after.mapping[images[0]])));
  assert.deepEqual(await fs.readFile(path.join(source,images[0])),updated);
  for(const image of images.slice(1))
   assert.deepEqual(
    await fs.readFile(path.join(destA,before.mapping[image])),
    await fs.readFile(path.join(destB,after.mapping[image])));
 }finally{await fs.rm(temp,{recursive:true,force:true});}
});
