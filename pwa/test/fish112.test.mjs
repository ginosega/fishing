import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const here=path.dirname(fileURLToPath(import.meta.url));
const pwa=path.resolve(here,'..');
const icons=[
 'home-my-gear.png','home-knowledge-base.png','home-catch-log.png',
 'gear-rods-reels.png','gear-line.png','gear-weights.png','gear-snaps-swivels.png','gear-hooks.png','gear-lures.png','gear-bait.png','gear-equipment.png',
 'kb-locations.png','kb-species.png','kb-techniques.png','kb-knots.png','kb-gear-guides.png'
];

test('FISH112 bundles the 16 approved transparent fixed card icons',async()=>{
 const sourceDir=path.join(pwa,'assets/card-icons');
 const sourceNames=(await fs.readdir(sourceDir)).sort();
 assert.deepEqual(sourceNames,[...icons].sort());
 for(const name of icons){
  const metadata=await sharp(path.join(sourceDir,name)).metadata();
  assert.equal(metadata.format,'png',name);
  assert.equal(metadata.hasAlpha,true,name+' must retain transparency');
 }

 const css=await fs.readFile(path.join(pwa,'src/card-icons.css'),'utf8');
 for(const name of icons)assert.match(css,new RegExp(`url\\("\\./card-icons/${name.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}"\\)`));
 assert.match(css,/\.card-icon\{[\s\S]*font-size:0;[\s\S]*background-size:contain;/);

 const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'fish112-build-'));
 try{
  const out=path.join(temporary,'dist');
  const result=spawnSync(process.execPath,[path.join(pwa,'tools/build.mjs'),'--base=/fishing/','--source='+pwa,'--out='+out,'--source-revision=fish112-test'],{encoding:'utf8',maxBuffer:8*1024*1024});
  assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
  const release=JSON.parse(await fs.readFile(path.join(out,'release.json'),'utf8'));
  const releaseRoot=path.join(out,'releases',release.id);
  const manifest=JSON.parse(await fs.readFile(path.join(out,release.manifest),'utf8'));
  const releaseCss=await fs.readFile(path.join(releaseRoot,'styles.css'),'utf8');
  for(const name of icons){
   assert.deepEqual(await fs.readFile(path.join(releaseRoot,'card-icons',name)),await fs.readFile(path.join(sourceDir,name)),name);
   assert.ok(manifest.files.some(file=>file.path===`releases/${release.id}/card-icons/${name}`),name+' missing from release manifest');
   assert.ok(releaseCss.includes(`./card-icons/${name}`),name+' missing from release stylesheet');
  }
 }finally{await fs.rm(temporary,{recursive:true,force:true});}
});
