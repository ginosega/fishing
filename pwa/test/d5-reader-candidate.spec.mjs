import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {startCandidateServer} from '../tools/serve-v3-reader-candidate.mjs';
import {V3_READER_CANDIDATE_BASE as BASE} from '../src/v3-reader-candidate.mjs';

// Actual browser + actual scoped service worker, not mock DOM or simulated
// mode messages. The source-only Actions job serves loopback and never deploys.
const root='/tmp/fishing-v3-reader-candidate';
let server,base,pointer,banks;
test.beforeAll(async()=>{
 pointer=JSON.parse(await fs.readFile(path.join(root,'release.json'),'utf8'));
 const kb=JSON.parse(await fs.readFile(
  path.join(root,'releases',pointer.id,'content/KB/kb.json'),'utf8'));
 banks=kb.entities.find(e=>e.content==='KB/Locations/content/banks-lake.md');
 if(!banks)throw new Error('Real Banks Lake KB article not found');
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
 const auto=dialog.getByRole('button',{name:'Automatic',exact:true});
 const work=dialog.getByRole('button',{name:'Work Offline',exact:true});
 await expect(auto).toBeEnabled({timeout:20000});
 await expect(work).toBeEnabled();
 await expect(dialog.locator('.offline-mode-select [role="status"]'))
  .toContainText('Reading mode: Automatic');
 await dialog.getByRole('button',{name:'Update offline library'}).click();
 await expect(page.locator('#offline-status'))
  .toHaveAttribute('data-state','Ready',{timeout:210000});
 await expect(work).toBeEnabled();
 await work.click();
 await expect(dialog.locator('.offline-mode-select [role="status"]'))
  .toContainText('Reading mode: Work Offline',{timeout:200000});
 await expect(work).toHaveAttribute('aria-pressed','true');
 await dialog.getByRole('button',{name:'Close'}).click();
 await page.reload();
 await expect.poll(()=>page.evaluate(()=>globalThis.__FISHING_V2__?.releaseId),
  {timeout:45000}).toBe(pointer.id);
 await page.getByRole('button',{name:'Connection status'}).click();
 await expect(page.locator('.offline-mode-select [role="status"]'))
  .toContainText('Reading mode: Work Offline',{timeout:20000});
 await page.getByRole('button',{name:'Automatic',exact:true}).click();
 await expect(page.locator('.offline-mode-select [role="status"]'))
  .toContainText('Reading mode: Automatic',{timeout:20000});
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
