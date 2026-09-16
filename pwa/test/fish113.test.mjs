import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {isPageHeroRoute} from '../src/page-hero.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const pwa=path.resolve(here,'..');
const heroName='page-hero.webp';

test('FISH113 limits the shared page hero to the three approved root routes',()=>{
 assert.equal(isPageHeroRoute('#/'),true);
 assert.equal(isPageHeroRoute('#/inventory'),true);
 assert.equal(isPageHeroRoute('#/kb'),true);
 assert.equal(isPageHeroRoute('#/catches'),false);
 assert.equal(isPageHeroRoute('#/inventory/category/lures'),false);
 assert.equal(isPageHeroRoute('#/kb/category/location'),false);
});

test('FISH113 bundles the approved responsive hero artwork into the verified release',async()=>{
 const sourceDir=path.join(pwa,'assets/page-hero');
 assert.deepEqual((await fs.readdir(sourceDir)).sort(),[heroName]);
 const source=path.join(sourceDir,heroName);
 const metadata=await sharp(source).metadata();
 assert.equal(metadata.format,'webp');
 assert.equal(metadata.width,2172);
 assert.equal(metadata.height,724);

 const css=await fs.readFile(path.join(pwa,'src/page-hero.css'),'utf8');
 assert.ok(css.includes(`url("./page-hero/${heroName}")`));
 assert.match(css,/background-size:cover,cover,cover/);
 assert.match(css,/background-position:center,center,58% 50%/);
 const entry=await fs.readFile(path.join(pwa,'src/entry.mjs'),'utf8');
 assert.match(entry,/installPageHero\(\)/);

 const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'fish113-build-'));
 try{
  const out=path.join(temporary,'dist');
  const result=spawnSync(process.execPath,[path.join(pwa,'tools/build.mjs'),'--base=/fishing/','--source='+pwa,'--out='+out,'--source-revision=fish113-test'],{encoding:'utf8',maxBuffer:8*1024*1024});
  assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
  const release=JSON.parse(await fs.readFile(path.join(out,'release.json'),'utf8'));
  const releaseRoot=path.join(out,'releases',release.id);
  const manifest=JSON.parse(await fs.readFile(path.join(out,release.manifest),'utf8'));
  const built=path.join(releaseRoot,'page-hero',heroName);
  assert.deepEqual(await fs.readFile(built),await fs.readFile(source));
  assert.ok(manifest.files.some(file=>file.path===`releases/${release.id}/page-hero/${heroName}`));
  const releaseCss=await fs.readFile(path.join(releaseRoot,'styles.css'),'utf8');
  assert.ok(releaseCss.includes(`./page-hero/${heroName}`));
 }finally{
  await fs.rm(temporary,{recursive:true,force:true});
 }
});
