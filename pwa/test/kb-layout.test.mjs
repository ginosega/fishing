import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),root=path.join(repo,'pwa');
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

test('every KB article stays in its category content folder',async()=>{
 const library=JSON.parse(await fs.readFile(path.join(root,'KB/kb.json'),'utf8'));
 for(const entity of library.entities){
  const folder=folders[entity.type];
  assert(folder,`Unknown KB type: ${entity.type}`);
  assert(entity.content.startsWith(`KB/${folder}/content/`),`${entity.id} content must be under KB/${folder}/content/`);
 }
});
