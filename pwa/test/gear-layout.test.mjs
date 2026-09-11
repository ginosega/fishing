import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const folders=[
 'Bait',
 'Equipment',
 'Hooks',
 'Line',
 'Lures',
 'Rods-Reels',
 'Snaps-Swivels',
 'Weights'
];

test('every Gear category exposes canonical assets and content directories',async()=>{
 for(const folder of folders){
  for(const child of ['assets','content']){
   const stat=await fs.stat(path.join(root,'Gear',folder,child));
   assert(stat.isDirectory(),`Gear/${folder}/${child} must be a directory`);
  }
 }
});
