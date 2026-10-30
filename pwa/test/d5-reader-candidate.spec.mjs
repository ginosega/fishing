import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {startCandidateServer} from '../tools/serve-v3-reader-candidate.mjs';
import {V3_READER_CANDIDATE_BASE as BASE} from '../src/v3-reader-candidate.mjs';

// Actual browser + actual scoped service worker, not mock DOM or simulated
// mode messages. The source-only Actions job serves loopback and never deploys.
const root='/tmp/fishing-v3-reader-candidate';
let server,base,pointer,banks,garmin;
test.beforeAll(async()=>{
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
 await dialog.getByRole('button',{name:'Update',exact:true}).click();
 await expect(page.locator('#offline-status'))
  .toHaveAttribute('data-state','Ready',{timeout:210000});
 await expect(work).toBeEnabled();
 await work.click();
 await expect(work).toHaveAttribute('aria-pressed','true',{timeout:200000});
 await expect(work).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#connection-status')).toHaveAttribute(
  'data-reading-mode','work-offline');
 await expect(page.locator('#connection-status')).toHaveAttribute(
  'data-publication-indicator','network');
 await expect(page.locator('#connection-status')).toHaveAttribute(
  'title','Connection status: Online');
 await expect(page.locator('#connection-network')).toHaveText('Online');
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
 expect(jsErrors).toEqual([]);
});

test('D5-browser Banks Lake Markdown PNGs open original viewer on loopback',async({page})=>{
 test.setTimeout(90000);
 await loaded(page,'#/kb/'+banks.id);
 await expect(page.locator('#app h1')).toContainText('Banks Lake');
 const imageButtons=page.locator('.markdown-body .markdown-image-button');
 await expect(imageButtons).toHaveCount(2);
 await imageButtons.first().click();
 await expect(page.getByRole('dialog',{name:'Image viewer'})).toBeVisible();
 await page.getByRole('dialog',{name:'Image viewer'})
  .getByRole('button',{name:'Close'}).last().click();
 await expect(page.getByRole('dialog',{name:'Image viewer'})).toHaveCount(0);
});


test('D5-browser real Garmin motor percent-encoded images open the original viewer',async({page})=>{
 test.setTimeout(90000);
 await loaded(page,'#/inventory/item/'+garmin.id);
 await expect(page.locator('#app h1')).toContainText('Garmin Force Current');
 const imageButtons=page.locator('.markdown-body .markdown-image-button');
 await expect(imageButtons).toHaveCount(3);
 for(const alt of ['Power Steer Foot Pedals','Stern Motor Mount',
  'Redodo 24V 50Ah Bluetooth Lithium Trolling Motor Battery']){
  await page.getByRole('button',{name:'Enlarge '+alt,exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Image viewer'})).toBeVisible();
  await page.getByRole('dialog',{name:'Image viewer'})
   .getByRole('button',{name:'Close'}).last().click();
 }
});

test('D5-browser cached Work Offline mode still opens Banks Lake and Garmin viewer',async({page})=>{
 test.setTimeout(300000);
 await loaded(page);
 await page.getByRole('button',{name:'Connection status'}).click();
 await expect(page.getByRole('button',{name:'Work Offline'})).toBeEnabled();
 await page.getByRole('button',{name:'Update',exact:true}).click();
 await expect(page.locator('#offline-status'))
  .toHaveAttribute('data-state','Ready',{timeout:210000});
 await page.getByRole('button',{name:'Work Offline',exact:true}).click();
 await expect(page.locator('.offline-mode-select [role="status"]'))
  .toContainText('Reading mode: Work Offline',{timeout:200000});
 await page.getByRole('button',{name:'Close'}).click();
 for(const [hash,count] of [
  ['#/kb/'+banks.id,2],
  ['#/inventory/item/'+garmin.id,3]
 ]){
  await page.goto(base+hash,{waitUntil:'domcontentloaded'});
  await expect(page.locator('.markdown-image-button')).toHaveCount(count);
  await page.locator('.markdown-image-button').first().click();
  await expect(page.getByRole('dialog',{name:'Image viewer'})).toBeVisible();
  await page.getByRole('dialog',{name:'Image viewer'})
   .getByRole('button',{name:'Close'}).last().click();
 }
 await expect(page.locator('#connection-status'))
  .toHaveAttribute('data-reading-mode','work-offline');
});
