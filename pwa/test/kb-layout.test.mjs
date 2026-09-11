import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const folders={
 location:'Locations',
 species:'Species',
 equipment:'Gear-Guides',
 technique:'Techniques',
 knot:'Knots'
};

test('every KB category exposes canonical content and assets directories',async()=>{
 for(const folder of Object.values(folders)){
  for(const child of ['content','assets']){
   const stat=await fs.stat(path.join(root,'KB',folder,child));
   assert(stat.isDirectory(),`KB/${folder}/${child} must be a directory`);
  }
 }
});

test('KB content and representative pictures stay in their category folders',async()=>{
 const library=JSON.parse(await fs.readFile(path.join(root,'KB/kb.json'),'utf8'));
 for(const entity of library.entities){
  const folder=folders[entity.type];
  assert(folder,`Unknown KB type: ${entity.type}`);
  assert(entity.content.startsWith(`KB/${folder}/content/`),`${entity.id} content must be under KB/${folder}/content/`);
  if(entity.picture?.src)assert(entity.picture.src.startsWith(`KB/${folder}/assets/`),`${entity.id} representative picture must be under KB/${folder}/assets/`);
 }
});
