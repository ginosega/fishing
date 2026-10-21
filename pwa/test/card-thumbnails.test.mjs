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
