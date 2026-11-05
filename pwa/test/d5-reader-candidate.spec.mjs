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

// The integrated owner gateway enforces this same no-eval script policy.
// Exercise a real browser with a CSP response instead of relying on
// source-string checks or the permissive loopback server defaults.
test('D5-browser strict owner-gateway CSP boots static schema validators',async({page})=>{
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.route(base,async route=>{
  const upstream=await route.fetch();
  await route.fulfill({response:upstream,headers:{
   ...upstream.headers(),
   'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  }});
 });
 await loaded(page);
 await expect(page.locator('#app .nav-grid .nav-card')).toHaveCount(3);
 expect(errors).toEqual([]);
});

test('D5-browser mode control responds after verified offline library preparation',async({page})=>{
 test.setTimeout(300000);
 const jsErrors=[];page.on('pageerror',err=>jsErrors.push(err.message));
 await loaded(page);
 await expect(page.locator('#app .page')).toBeVisible({timeout:45000});
 // Preserve current content and scroll while status is opened and modes change.
 await page.evaluate(()=>{
  const marker=document.createElement('span');marker.id='d5-render-stability';
  document.querySelector('#app .page').append(marker);
 });
 await expect(page.locator('#d5-render-stability')).toHaveCount(1);
 await page.getByRole('button',{name:'Connection status'}).click();
 await expect(page.locator('#d5-render-stability')).toHaveCount(1);
 const dialog=page.locator('#connection-dialog');
 await expect(dialog.getByRole('heading',{name:'Mode'})).toBeVisible();
 const auto=dialog.getByRole('button',{name:'Automatic',exact:true});
 const work=dialog.getByRole('button',{name:'Work Offline',exact:true});
 await expect(auto).toBeEnabled({timeout:20000});
 await expect(work).toBeEnabled();
 await expect(auto).toHaveAttribute('aria-pressed','true');
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

test('D5-browser offline warning spacing matches Notes editor messages',async({page})=>{
 // The green Markdown-preview notice is separated from the Notes preview by
 // .notes-editor's existing 12px gap. Match that gap between the red in-form
 // edit restriction and the amber sibling global Work Offline warning.
 const css=await fs.readFile(path.join(pwaRoot,'src/styles.css'),'utf8');
 for(const width of [1180,390]){
  await page.setViewportSize({width,height:900});
  await page.setContent(`<style>${css}</style>
    <main id="app" class="site-main">
      <div class="editor">
        <form class="editor-form">
          <div class="toolbar"><button class="btn">Save and Publish</button></div>
          <div class="editor-notice">
            <p class="notice error">Editing is only available when Online.</p>
          </div>
        </form>
      </div>
    </main>
    <aside id="app-notice" class="site-main"
      style="min-height:0;padding-top:0;padding-bottom:0">
      <p class="notice warning">The unsaved editor stays open.</p>
    </aside>
    <div class="notes-editor" id="reference-notes">
      <div class="markdown-preview">TEST</div>
      <div class="notes-editor-message">
        <p class="notice success">Markdown preview is local and has not been saved.</p>
      </div>
    </div>`);
  const positions=await page.evaluate(()=>{
   const rect=selector=>document.querySelector(selector).getBoundingClientRect();
   const end=rect('.editor-notice .notice.error');
   const next=rect('#app-notice .notice.warning');
   const note=rect('#reference-notes .markdown-preview');
   const previewNotice=rect('#reference-notes .notice.success');
   return {
    offlineGap:next.top-end.bottom,
    referenceGap:previewNotice.top-note.bottom,
    editorPadding:getComputedStyle(document.querySelector('#app')).paddingBottom
   };
  });
  expect(positions.referenceGap).toBeGreaterThanOrEqual(10);
  expect(positions.referenceGap).toBeLessThanOrEqual(14);
  expect(Math.abs(positions.offlineGap-positions.referenceGap))
   .toBeLessThanOrEqual(1);
  expect(positions.editorPadding).toBe('12px');
  // Other reading pages retain the original desktop/mobile bottom padding.
  await page.locator('.editor').evaluate(node=>node.classList.remove('editor'));
  const normalPadding=await page.locator('#app').evaluate(node=>
   getComputedStyle(node).paddingBottom);
  expect(normalPadding).toBe(width<=650?'50px':'70px');
 }
});
