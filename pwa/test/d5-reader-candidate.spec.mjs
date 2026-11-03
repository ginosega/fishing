import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {startCandidateServer} from '../tools/serve-v3-reader-candidate.mjs';
import {V3_READER_CANDIDATE_BASE as BASE} from '../src/v3-reader-candidate.mjs';

// Actual browser + actual scoped service worker, not mock DOM or simulated
// mode messages. The source-only Actions job serves loopback and never deploys.
// Every browser lane must construct the same independently verified, isolated
// reader candidate. The P3-only workflow once prepared a fixed /tmp fixture;
// the required FISH108 full lane does not. Never trust an absent/stale fixture.
const pwaRoot=fileURLToPath(new URL('..',import.meta.url));
const run=(script,args)=>{
 const result=spawnSync(process.execPath,[fileURLToPath(new URL(script,import.meta.url)),...args],
  {cwd:pwaRoot,encoding:'utf8',maxBuffer:8*1024*1024});
 if(result.status!==0)throw new Error(result.stdout+'\n'+result.stderr);
};
let root,server,base,pointer,banks,garmin;
test.beforeAll(async()=>{
 root=await fs.mkdtemp(path.join(os.tmpdir(),'fishing-v3-reader-browser-'));
 run('../tools/build.mjs',['--v3-reader-candidate','--v3-reading-mode',
  '--base='+BASE,'--out='+root]);
 run('../tools/verify.mjs',['--out='+root,'--source='+pwaRoot]);
 pointer=JSON.parse(await fs.readFile(path.join(root,'release.json'),'utf8'));
 const kb=JSON.parse(await fs.readFile(
  path.join(root,'releases',pointer.id,'content/KB/kb.json'),'utf8'));
 banks=kb.entities.find(e=>e.content==='KB/Locations/content/banks-lake.md');
 if(!banks)throw new Error('Real Banks Lake KB article not found');
 const gear=JSON.parse(await fs.readFile(
  path.join(root,'releases',pointer.id,'content/Gear/gear.json'),'utf8'));
 garmin=gear.items.find(e=>e.notes?.startsWith(
  'Gear/Equipment/content/Garmin Force Current Kayak Trolling Motor'));
 if(!garmin)throw new Error('Real Garmin motor Gear article not found');
 server=await startCandidateServer({root,port:0});
 base='http://127.0.0.1:'+server.address().port+BASE;
});
test.afterAll(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 if(root)await fs.rm(root,{recursive:true,force:true});
});
async function loaded(page,hash=''){
 await page.goto(base+hash,{waitUntil:'domcontentloaded'});
 await expect.poll(()=>page.evaluate(()=>globalThis.__FISHING_V2__?.releaseId),
  {timeout:45000}).toBe(pointer.id);
}

test('D5-browser mode control responds after verified offline library preparation',async({page})=>{
 test.setTimeout(300000);
 const jsErrors=[];page.on('pageerror',err=>jsErrors.push(err.message));
 await loaded(page);
 await page.getByRole('button',{name:'Connection status'}).click();
 const dialog=page.locator('#connection-dialog');
 await expect(dialog.getByRole('heading',{name:'Mode'})).toBeVisible();
 const auto=dialog.getByRole('button',{name:'Automatic',exact:true});
 const work=dialog.getByRole('button',{name:'Work Offline',exact:true});
 await expect(auto).toBeEnabled({timeout:20000});
 await expect(work).toBeEnabled();
 await expect(auto).toHaveAttribute('aria-pressed','true');
 // Preserve current content and scroll while status is opened and modes change.
 await page.evaluate(()=>{
  const marker=document.createElement('span');marker.id='d5-render-stability';
  document.querySelector('#app .page').append(marker);
 });
 await expect(page.locator('#d5-render-stability')).toHaveCount(1);
 await expect(dialog.getByRole('button',{name:'Reload',exact:true})).toHaveCount(0);
 await dialog.getByRole('button',{name:'Prepare',exact:true}).click();
 await expect(page.locator('#offline-status'))
  .toHaveAttribute('data-state','Ready',{timeout:210000});
 await expect(dialog.getByRole('button',{name:'Update',exact:true})).toBeVisible();
 await expect(page.locator('#d5-render-stability')).toHaveCount(1);
 await expect(work).toBeEnabled();
 await work.click();
 await expect(work).toHaveAttribute('aria-pressed','true',{timeout:200000});
 await expect(work).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#connection-status')).toHaveAttribute(
  'data-reading-mode','work-offline');
 await expect(page.locator('#connection-status')).toHaveAttribute(
  'data-publication-indicator','network');
 await expect(page.locator('#connection-status')).toHaveAttribute(
  'data-online','false');
 await expect(page.locator('#connection-status')).toHaveAttribute(
  'title','Connection status: Offline');
 await expect(page.locator('#connection-network')).toHaveText('Offline');
 await expect(page.locator('#d5-render-stability')).toHaveCount(1);
 await dialog.getByRole('button',{name:'Close'}).click();
 await page.reload();
 await expect.poll(()=>page.evaluate(()=>globalThis.__FISHING_V2__?.releaseId),
  {timeout:45000}).toBe(pointer.id);
 await page.getByRole('button',{name:'Connection status'}).click();
 await expect(page.getByRole('button',{name:'Work Offline',exact:true}))
  .toHaveAttribute('aria-pressed','true',{timeout:20000});
 await expect(page.locator('#connection-status')).toHaveAttribute(
  'data-reading-mode','work-offline');
 await page.getByRole('button',{name:'Automatic',exact:true}).click();
 await expect(page.getByRole('button',{name:'Automatic',exact:true}))
  .toHaveAttribute('aria-pressed','true',{timeout:20000});
 await expect(page.locator('#connection-status')).toHaveAttribute(
  'data-reading-mode','automatic');
 await expect(page.locator('#connection-status')).toHaveAttribute('data-online','true');
 await expect(page.locator('#connection-status')).toHaveAttribute('title','Connection status: Online');
 expect(jsErrors).toEqual([]);
});

test('D5-browser Banks Lake untagged Markdown images remain ordinary',async({page})=>{
 test.setTimeout(90000);
 await loaded(page,'#/kb/'+banks.id);
 await expect(page.locator('#app h1')).toContainText('Banks Lake');
 await expect(page.locator('.markdown-body img')).toHaveCount(2);
 await expect(page.locator('.markdown-body .markdown-image-button')).toHaveCount(0);
 await expect(page.getByRole('dialog',{name:'Image viewer'})).toHaveCount(0);
});

test('D5-browser Garmin motor percent-encoded images display without auto viewer',async({page})=>{
 test.setTimeout(90000);
 await loaded(page,'#/inventory/item/'+garmin.id);
 await expect(page.locator('#app h1')).toContainText('Garmin Force Current');
 await expect(page.locator('.markdown-body img')).toHaveCount(3);
 await expect(page.locator('.markdown-body .markdown-image-button')).toHaveCount(0);
});

test('D5-browser cached Work Offline retains untagged Banks Lake and Garmin images',async({page})=>{
 test.setTimeout(300000);
 await loaded(page);
 await page.getByRole('button',{name:'Connection status'}).click();
 await expect(page.getByRole('button',{name:'Work Offline'})).toBeEnabled();
 await expect(page.getByRole('button',{name:'Reload',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Prepare',exact:true}).click();
 await expect(page.locator('#offline-status'))
  .toHaveAttribute('data-state','Ready',{timeout:210000});
 await page.getByRole('button',{name:'Work Offline',exact:true}).click();
 await expect(page.getByRole('button',{name:'Work Offline',exact:true}))
  .toHaveAttribute('aria-pressed','true',{timeout:200000});
 await page.getByRole('button',{name:'Close'}).click();
 for(const [hash,count] of [
  ['#/kb/'+banks.id,2],
  ['#/inventory/item/'+garmin.id,3]
 ]){
  await page.goto(base+hash,{waitUntil:'domcontentloaded'});
  await expect(page.locator('.markdown-body img')).toHaveCount(count);
  await expect(page.locator('.markdown-image-button')).toHaveCount(0);
 }
 await expect(page.locator('#connection-status'))
  .toHaveAttribute('data-reading-mode','work-offline');
});
