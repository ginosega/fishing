import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'../..');
const v2=path.join(repo,'pwa');
const prefix=process.env.FISHING_BASE||'/fishing/v2-preview/';
const production=prefix==='/fishing/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'};
let server,base,temporary,initial,next,fixture;
const state={legacy:false,disconnected:false,current:'initial',fail:new Set(),corrupt:new Set(),writes:[]};
const readJson=file=>fs.readFile(file,'utf8').then(JSON.parse);
const sourceData=async()=>({gear:await readJson(path.join(repo,'Gear/gear.json')),kb:await readJson(path.join(repo,'KB/kb.json')),catches:await readJson(path.join(repo,'Catches/catches.json'))});
const encoded=value=>value.split('/').map(encodeURIComponent).join('/');
const urlFor=(release,file)=>base+'releases/'+release.id+'/content/'+encoded(file);
const run=(script,args)=>{const result=spawnSync(process.execPath,[script,...args],{cwd:repo,encoding:'utf8',maxBuffer:8*1024*1024});if(result.status!==0)throw new Error(result.stdout+'\n'+result.stderr);};

async function prepare(){
 temporary=await fs.mkdtemp(path.join(os.tmpdir(),'fishing-browser-'));
 initial={root:path.resolve(process.env.FISHING_DIST||path.join(v2,'dist'))};
 initial.pointer=await readJson(path.join(initial.root,'release.json'));initial.id=initial.pointer.id;
 const source=path.join(temporary,'source');
 for(const dir of ['Gear','KB','Catches'])await fs.cp(path.join(repo,dir),path.join(source,dir),{recursive:true});
 await fs.mkdir(path.join(source,'pwa'),{recursive:true});await fs.copyFile(path.join(repo,'pwa/revised-icon.png'),path.join(source,'pwa/revised-icon.png'));
 const data=await sourceData();const article=data.kb.entities.find(x=>x.content);
 fixture={articleId:article.id,articlePath:article.content,marker:'Browser release upgrade fixture'};
 await fs.appendFile(path.join(source,article.content),'\n\n## '+fixture.marker+'\n\nThe second release is independently verified.\n');
 next={root:path.join(temporary,'next')};
 run(path.join(v2,'tools/build.mjs'),[...(production?[]:['--pending-media']),'--base='+prefix,'--source='+source,'--out='+next.root,'--source-revision='+initial.pointer.sourceRevision+'-browser-next']);
 run(path.join(v2,'tools/verify.mjs'),['--out='+next.root,'--source='+source]);
 next.pointer=await readJson(path.join(next.root,'release.json'));next.id=next.pointer.id;
 if(next.id===initial.id)throw new Error('Upgrade fixture has the same release ID');
}

async function serve(request,response){
 if(state.disconnected){request.socket.destroy();return;}
 try{
  if(request.method!=='GET'&&request.method!=='HEAD'){state.writes.push(request.method+' '+request.url);response.writeHead(405);response.end();return;}
  const url=new URL(request.url,'http://localhost');
  if(url.pathname==='/fishing/legacy-page'){response.writeHead(200,{'Content-Type':'text/html'});response.end('<!doctype html><title>V1 fixture</title><p>v1 scope sentinel</p>');return;}
  if(url.pathname==='/fishing/parent-worker.js'){response.writeHead(200,{'Content-Type':'text/javascript'});response.end(`self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(new URL(e.request.url).pathname.endsWith('/v2-preview/release.json'))e.respondWith(new Response('unverified parent cache'));});`);return;}
  if(url.pathname==='/outside-scope/legacy-check'){response.writeHead(200,{'Content-Type':'text/plain'});response.end('v1 scope sentinel');return;}
  if(!url.pathname.startsWith(prefix)){response.writeHead(404);response.end();return;}
  const relative=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';
  if(relative.includes('\\')||relative.split('/').some(x=>x==='..'))throw new Error('Unsafe test path');
  if(state.legacy){const bytes=await fs.readFile(path.join(process.env.FISHING_V1_DIST,relative));response.writeHead(200,{'Content-Type':mime[path.extname(relative)]||'application/octet-stream','Cache-Control':'no-store'});response.end(bytes);return;}
  const release=relative.startsWith('releases/'+initial.id+'/')?initial:relative.startsWith('releases/'+next.id+'/')?next:state.current==='next'?next:initial;
  if(state.fail.has(relative)){response.writeHead(503);response.end('Injected unavailable asset');return;}
  const file=path.resolve(release.root,relative);if(!file.startsWith(release.root+path.sep))throw new Error('Unsafe test path');
  let bytes=await fs.readFile(file);if(state.corrupt.has(relative)){bytes=Buffer.from(bytes);bytes[bytes.length-1]^=1;}
  response.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':bytes.length,'Cache-Control':'no-store'});
  response.end(request.method==='HEAD'?undefined:bytes);
 }catch{response.writeHead(404);response.end();}
}

// Chromium additionally receives the browser offline signal. WebKit's emulated
// offline reload fails inside the automation engine (run 34372041635), so it uses
// a real refused origin connection. Neither engine can obtain bytes from the server.
async function disconnect(context,offline){
 state.disconnected=offline;
 if(context.browser().browserType().name()!=='webkit')await context.setOffline(offline);
 if(offline)await expect(fetch(base+'release.json',{signal:AbortSignal.timeout(3000)})).rejects.toThrow();
}

async function openReady(page,release=initial){
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await expect.poll(()=>page.evaluate(()=>window.__FISHING_V2__?.releaseId),{timeout:120000}).toBe(release.id);
 await expect(page.locator('#offline-status')).toContainText('Offline ready',{timeout:120000});
 await expect(page.locator('#offline-status')).not.toContainText('null');
 await expect(page.locator('#app h1').first()).toHaveText('Fishing Companion');
}
const heading=(page,name)=>page.locator('#app .page-header h1').filter({hasText:name});
async function route(page,hash,title){await page.goto(base+hash,{waitUntil:'domcontentloaded'});await expect(heading(page,title)).toBeVisible();}
async function updateLibrary(page){await page.getByRole('button',{name:'Connection status',exact:true}).click();await page.getByRole('button',{name:'Update offline library',exact:true}).click();await page.locator('#connection-close').click();}
async function reloadLibrary(page){await page.getByRole('button',{name:'Connection status',exact:true}).click();await page.getByRole('button',{name:'Reload',exact:true}).click();if(await page.locator('#connection-dialog').isVisible())await page.locator('#connection-close').click();}
function parsePackage(value){expect(value).toMatch(/^Fishing Companion change package:/);return JSON.parse(value.slice(value.indexOf('\n\n')+2));}
async function packageFrom(page){await page.getByRole('button',{name:'Prepare Changes'}).click();await expect(page.locator('.package-text')).toBeVisible();return parsePackage(await page.locator('.package-text').inputValue());}
async function cacheInfo(page){return page.evaluate(async()=>{const names=(await caches.keys()).filter(x=>x.startsWith('fishing-v2:'));const result=[];for(const name of names){const c=await caches.open(name);const r=await c.match(new URL('__fishing_complete__',location.href));if(r)result.push(await r.json());}return result;});}

// One worker and separate browser contexts keep all service-worker/cache tests isolated.
test.beforeAll(async()=>{await prepare();server=createServer(serve);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}${prefix}`;});
test.afterAll(async()=>{if(server)await new Promise(resolve=>server.close(resolve));if(temporary)await fs.rm(temporary,{recursive:true,force:true});});
test.beforeEach(()=>{state.legacy=false;state.disconnected=false;state.current='initial';state.fail.clear();state.corrupt.clear();state.writes.length=0;});

test('complete library installs, verifies and survives an offline reload',async({page,context})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await openReady(page);
 const manifest=await readJson(path.join(initial.root,initial.pointer.manifest));
 const integrity=await page.evaluate(async({manifest,prefix})=>{
  const scope=new URL(prefix,location.origin);const names=(await caches.keys()).filter(x=>x.startsWith('fishing-v2:')&&!x.endsWith(':staging'));
  const cache=await caches.open(names.find(x=>x.endsWith(manifest.releaseId)));
  let total=0;for(const file of manifest.files){const url=new URL(file.path.split('/').map(encodeURIComponent).join('/'),scope);const response=await cache.match(url.href);if(!response)throw new Error('Missing '+file.path);const bytes=await response.arrayBuffer();const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(digest!==file.sha256||bytes.byteLength!==file.bytes)throw new Error('Corrupt '+file.path);total+=bytes.byteLength;}return {files:manifest.files.length,bytes:total};
 },{manifest,prefix});
 expect(integrity).toEqual({files:manifest.files.length,bytes:manifest.totalBytes});
 const info=await cacheInfo(page);expect(info.some(x=>x.releaseId===initial.id&&x.complete)).toBe(true);
 await disconnect(context,true);await page.reload();
 await expect(heading(page,'Fishing Companion')).toBeVisible();
 await route(page,'#/inventory/item/daiwa-tatula-xt-rod','Daiwa');
 await expect(page.locator('.markdown-body')).not.toBeEmpty();
 expect(errors).toEqual([]);
 await disconnect(context,false);
});

test('navigation, filters, stable links, Catch History and image viewer',async({page})=>{
 const data=await sourceData();await openReady(page);
 await expect(page.locator('.nav-grid .nav-card')).toHaveCount(3);
 await route(page,'#/inventory','My Gear');
 await page.getByPlaceholder('Search My Gear').fill('Tatula');
 await expect(page.locator('.record-grid .nav-card')).toHaveCount(1);
 await page.locator('.record-grid .nav-card').click();
 await expect(heading(page,'Daiwa Tatula')).toBeVisible();
 await page.getByRole('link',{name:'Edit item',exact:true}).click();
 await page.getByRole('button',{name:'Create Link'}).click();
 await expect(page.getByRole('dialog')).toContainText('gear://daiwa-tatula-xt-rod');
 await page.getByRole('dialog').getByRole('button',{name:'Close'}).click();
 await route(page,'#/inventory/category/rods-reels','Rods & Reels');
 await expect(page.locator('.record-grid .nav-card')).toHaveCount(6);
 await expect(page.getByRole('combobox',{name:'Type'})).toHaveCount(0);
 await route(page,'#/inventory/category/lures','Lures');
 await expect(page.getByRole('combobox',{name:'Type'})).toBeVisible();
 await expect(page.getByRole('searchbox',{name:'Search'})).toBeVisible();
 const lure=data.gear.items.find(x=>x.category==='lures');
 await page.getByRole('combobox',{name:'Type'}).selectOption({label:lure.type});
 await expect(page.locator('.record-grid .nav-card')).toHaveCount(data.gear.items.filter(x=>x.category==='lures'&&x.type===lure.type).length);
 await route(page,'#/kb','Knowledge Base');
 await page.getByPlaceholder('Search Knowledge Base').fill('Silver Lake');
 await expect(page.locator('.record-grid .nav-card').first()).toBeVisible();
 await route(page,'#/kb/species-largemouth-bass','Largemouth Bass');
 await expect(page.locator('#app')).toContainText('Catch History');
 await expect(page.locator('.section').filter({hasText:'Catch History'}).locator('.nav-card')).toHaveCount(data.catches.catches.filter(x=>x.speciesId==='species-largemouth-bass').length);
 await route(page,'#/catches','Recorded catches');
 await expect(page.locator('.record-grid .nav-card')).toHaveCount(data.catches.catches.length);
 await route(page,'#/catches/'+data.catches.catches[0].id,' · ');
 await expect(page.getByRole('button',{name:'Edit',exact:true})).toHaveCount(0);
 await route(page,'#/inventory/item/bonafide-rvr119','Bonafide');
 await page.getByRole('button',{name:/Enlarge/}).click();
 await expect(page.getByRole('dialog',{name:'Image viewer'})).toBeVisible();
 await page.getByRole('dialog').getByRole('button',{name:'Zoom in'}).click();
 await expect(page.getByRole('dialog').locator('.zoom-label')).not.toHaveText('100%');
 await page.getByRole('dialog').getByRole('button',{name:'Reset'}).click();
 await expect(page.getByRole('dialog').locator('.zoom-label')).toHaveText('100%');
 await page.getByRole('dialog').getByRole('button',{name:'Close'}).last().click();
 await expect(page.getByRole('dialog',{name:'Image viewer'})).toHaveCount(0);
 await route(page,'#/inventory/item/setup-spinning','Not found');
 await expect(page.locator('#app')).toContainText('retired');
});

test('Gear and KB handoffs preserve identity, minimal changes and unsaved work',async({page})=>{
 await openReady(page);
 await route(page,'#/inventory/edit/daiwa-tatula-xt-rod','Edit');
 const form=page.locator('.editor-form');
 const id=await form.getByRole('textbox',{name:'ID'}).inputValue();
 await expect(form.getByRole('textbox',{name:'ID'})).toHaveAttribute('readonly','');
 const name=form.getByRole('textbox',{name:'Name',exact:true});const original=await name.inputValue();
 await name.fill(original+' browser test');
 const markdown=form.locator('.markdown-editor');const originalText=await markdown.inputValue();
 await markdown.fill(originalText+'\n\n## Browser test\n\n[Species](kb://species-largemouth-bass)\n\n<script>alert(1)</script>\n');
 await form.getByRole('button',{name:'Preview Markdown'}).click();
 await expect(form.locator('.markdown-preview')).toContainText('Browser test');
 await expect(form.locator('.markdown-preview script')).toHaveCount(0);
 await form.getByRole('button',{name:'Edit Markdown'}).click();
 const change=await packageFrom(page);
 expect(change.format).toBe('fishing-companion-change-v2');expect(change.domain).toBe('gear');expect(change.operation).toBe('edit');expect(change.id).toBe(id);
 expect(change.changes.set.name).toBe(original+' browser test');
 expect(Object.keys(change.changes.set)).toEqual(['name']);
 expect(JSON.stringify(change)).toContain('Browser test');
 expect(JSON.stringify(change)).not.toContain('data:image');
 page.once('dialog',d=>d.dismiss());await form.getByRole('button',{name:'Cancel'}).click();
 await expect(heading(page,'Edit')).toBeVisible();
 page.once('dialog',d=>d.accept());await form.getByRole('button',{name:'Cancel'}).click();
 await expect(heading(page,'Daiwa Tatula')).toBeVisible();
 await expect(page.locator('#app')).not.toContainText(original+' browser test');
 await route(page,'#/inventory/add/lures','Add');
 await page.locator('.editor-form').getByRole('textbox',{name:'Name',exact:true}).fill('Browser Test Lure');
 const added=await packageFrom(page);expect(added.operation).toBe('add');expect(added.id).toBe('browser-test-lure');expect(added.record?.name||added.item?.name).toBe('Browser Test Lure');
 page.once('dialog',d=>d.accept());await page.locator('.editor-form').getByRole('button',{name:'Cancel'}).click();
 await expect(heading(page,'Lures')).toBeVisible();
 await route(page,'#/kb/add/technique','Add');
 await page.locator('.editor-form').getByRole('textbox',{name:'Name',exact:true}).fill('Browser Test Technique');
 await page.locator('.markdown-editor').fill('# Browser Test Technique\n\nA new article.');
 const kb=await packageFrom(page);expect(kb.domain).toBe('kb');expect(kb.operation).toBe('add');
 expect(state.writes).toEqual([]);
});

test('a failed or corrupt update retains the previous complete release',async({page,context})=>{
 await openReady(page);
 const first=await cacheInfo(page);expect(first.some(x=>x.releaseId===initial.id)).toBe(true);
 state.current='next';const broken='releases/'+next.id+'/content/'+fixture.articlePath;state.corrupt.add(broken);
 await updateLibrary(page);
 await expect(page.locator('#offline-status')).toContainText('Offline ready',{timeout:120000});
 await expect(page.locator('#offline-status')).not.toContainText('null');
 await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker.controller?.scriptURL)).toContain('/sw.js');
 expect(await page.evaluate(()=>window.__FISHING_V2__.releaseId)).toBe(initial.id);
 const failed=await cacheInfo(page);expect(failed.some(x=>x.releaseId===initial.id)).toBe(true);expect(failed.some(x=>x.releaseId===next.id)).toBe(false);
 await disconnect(context,true);await page.reload();await expect(heading(page,'Fishing Companion')).toBeVisible();
 await disconnect(context,false);state.corrupt.clear();
 await updateLibrary(page);
 await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker.controller?.scriptURL),{timeout:120000}).toContain('/sw.js');
 await expect(page.locator('#offline-status')).toHaveAttribute('data-release-id',next.id,{timeout:120000});
 await reloadLibrary(page);
 await expect.poll(()=>page.evaluate(()=>window.__FISHING_V2__?.releaseId),{timeout:120000}).toBe(next.id);
 await route(page,'#/kb/'+fixture.articleId,'');
 await expect(page.locator('.markdown-body')).toContainText(fixture.marker);
 const both=await cacheInfo(page);expect(both.some(x=>x.releaseId===initial.id)).toBe(true);expect(both.some(x=>x.releaseId===next.id)).toBe(true);
 await disconnect(context,true);await page.reload();await expect(page.locator('.markdown-body')).toContainText(fixture.marker);
 const old=await page.evaluate(async url=>{const r=await fetch(url);return {status:r.status,text:await r.text()};},urlFor(initial,fixture.articlePath));
 expect(old.status).toBe(200);expect(old.text).not.toContain(fixture.marker);
});

test('tampered cached content is rejected and repaired only from verified bytes',async({page,context})=>{
 await openReady(page);
 const target=urlFor(initial,fixture.articlePath);const relative='releases/'+initial.id+'/content/'+fixture.articlePath;
 await page.evaluate(async url=>{const names=await caches.keys();const name=names.find(x=>x.endsWith(window.__FISHING_V2__.releaseId));const cache=await caches.open(name);await cache.put(url,new Response('tampered content',{headers:{'Content-Type':'text/markdown'}}));},target);
 state.fail.add(relative);await disconnect(context,true);
 await route(page,'#/kb/'+fixture.articleId,'');
 await expect(page.locator('#app')).toContainText('Unable to display this page');
 await expect(page.locator('#offline-status')).toHaveAttribute('data-state','Incomplete');
 await expect(page.locator('#app')).not.toContainText('tampered content');
 await disconnect(context,false);state.fail.clear();
 await page.getByRole('button',{name:'Retry',exact:true}).click();
 await expect(page.locator('.markdown-body')).toBeVisible();
 await expect(page.locator('#offline-status')).toHaveAttribute('data-state','Ready');
 await expect(page.locator('#app')).not.toContainText('tampered content');
});

test('mobile layout and isolated worker scope',async({browser})=>{
 const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true,deviceScaleFactor:2});const page=await context.newPage();
 try{await openReady(page);await route(page,'#/inventory/category/lures','Lures');
  const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));expect(width.scroll).toBeLessThanOrEqual(width.client+1);
  const legacy=await page.goto(new URL('/outside-scope/legacy-check',base).href);expect(await legacy.text()).toBe('v1 scope sentinel');
  expect(await page.evaluate(()=>navigator.serviceWorker.controller)).toBeNull();
 }finally{await context.close();}
});


test('new release waits for explicit reload and protects a dirty editor',async({page})=>{
 await openReady(page);
 await route(page,'#/inventory/edit/daiwa-tatula-xt-rod','Edit');
 const name=page.locator('.editor-form').getByRole('textbox',{name:'Name',exact:true});
 await name.fill('Unsaved browser edit');
 state.current='next';
 await updateLibrary(page);
 await expect(page.locator('#offline-status')).toHaveAttribute('data-release-id',next.id,{timeout:120000});
 expect(await page.evaluate(()=>window.__FISHING_V2__.releaseId)).toBe(initial.id);
 await expect(name).toHaveValue('Unsaved browser edit');
 page.once('dialog',d=>d.dismiss());await reloadLibrary(page);
 await expect(name).toHaveValue('Unsaved browser edit');
 expect(await page.evaluate(()=>window.__FISHING_V2__.releaseId)).toBe(initial.id);
 // Leaving the editor prompts exactly once and does not persist the unsubmitted edit.
 let dialogs=0;const accept=d=>{dialogs++;return d.accept();};page.on('dialog',accept);
 await page.locator('.editor-form').getByRole('button',{name:'Cancel'}).click();
 await expect(heading(page,'Daiwa Tatula')).toBeVisible();page.off('dialog',accept);expect(dialogs).toBe(1);
 await reloadLibrary(page);
 await expect.poll(()=>page.evaluate(()=>window.__FISHING_V2__?.releaseId)).toBe(next.id);
 await expect(page.locator('#app')).not.toContainText('Unsaved browser edit');
});


test('preview waits for its own verified worker when a v1 parent worker already controls the page',async({page,context})=>{
 await page.goto(new URL('/fishing/legacy-page',base).href);
 await page.evaluate(async()=>{
  await navigator.serviceWorker.register('/fishing/parent-worker.js',{scope:'/fishing/'});
  await navigator.serviceWorker.ready;
  if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  const cache=await caches.open('fishing-companion-preserved-fixture');await cache.put(new URL('/fishing/retained-v1-data',location.origin).href,new Response('retain v1 bytes'));
 });
 const retained=()=>page.evaluate(async()=>{const r=await (await caches.open('fishing-companion-preserved-fixture')).match(new URL('/fishing/retained-v1-data',location.origin).href);return r?.text();});
 expect(await retained()).toBe('retain v1 bytes');
 const preview=await context.newPage();await openReady(preview);
 expect(await preview.evaluate(()=>navigator.serviceWorker.controller.scriptURL)).toBe(base+'sw.js');
 if(!production)await page.reload();expect(await retained()).toBe('retain v1 bytes');
 await preview.close();
});


test('reviewed page layouts, missing pictures, forms and copy feedback',async({page},testInfo)=>{
 await page.emulateMedia({colorScheme:'dark'});await openReady(page);
 await expect(page.locator('.site-header nav')).toHaveCount(0);
 if(production){await expect(page.locator('#release-details')).toHaveCount(0);await expect(page.locator('.preview-banner')).toBeHidden();}
 await expect(page.getByRole('button',{name:'Connection status'})).toHaveAttribute('title','Connection status');
 await page.getByRole('button',{name:'Connection status'}).click();
 await expect(page.getByRole('dialog',{name:'Connection status'})).toBeVisible();
 await expect(page.locator('#offline-status')).toContainText(/Offline ready.*files/);
 await expect(page.getByRole('button',{name:'Update offline library'})).toBeEnabled();
 await page.locator('#connection-close').click();
 await expect(page.locator('.card-arrow')).toHaveCount(0);
 const grid=await page.locator('.home-grid').boundingBox(),main=await page.locator('#app').boundingBox();
 expect(Math.abs(grid.x+grid.width/2-main.x-main.width/2)).toBeLessThan(2);
 await page.screenshot({path:testInfo.outputPath('home.png'),fullPage:true});
 for(const [hash,title,subtitle,add] of [['#/inventory','My Gear','Browse your inventory of equipment, tackle, and bait','Add Gear'],['#/kb','Knowledge Base','Fishing reference library','Add Entry']]){
  await route(page,hash,title);await expect(page.locator('.page-subtitle')).toHaveText(subtitle);
  await expect(page.locator('.page-header input[type=search]')).toBeVisible();await expect(page.locator('.page-header label')).toHaveCount(0);
  await expect(page.locator('.page-header').getByRole('button',{name:'Back'})).toBeVisible();
  const bottom=page.locator('.page').getByRole('link',{name:add,exact:true});await expect(bottom).toBeVisible();
  const positions=await page.locator('.page-actions').evaluate(e=>[...e.children].map(c=>c.tagName));expect(positions.at(-1)).toBe('BUTTON');
  await expect(page.locator('.nav-grid .card-icon')).toHaveCount(hash==='#/inventory'?8:5);
  if(hash==='#/kb')await expect(page.locator('.nav-grid .nav-card p')).toHaveCount(5);
  await page.screenshot({path:testInfo.outputPath(title.replaceAll(' ','-')+'.png'),fullPage:true});
 }
 await route(page,'#/inventory/category/lures','Lures');
 await expect(page.locator('.page-header input')).toBeVisible();await expect(page.locator('.page-header select')).toBeVisible();
 const cards=await page.locator('.record-grid .nav-card').evaluateAll(cards=>cards.map(c=>({top:c.getBoundingClientRect().top,title:c.querySelector('h2').getBoundingClientRect().top,missing:!!c.querySelector('.card-spacer')})));
 const missing=cards.find(c=>c.missing),neighbor=cards.find(c=>!c.missing&&c.top===missing.top);expect(neighbor).toBeTruthy();expect(Math.abs(missing.title-neighbor.title)).toBeLessThan(2);
 await page.screenshot({path:testInfo.outputPath('lures.png'),fullPage:true});
 await route(page,'#/inventory/item/rapala-original-floating','Rapala');await expect(page.locator('.picture img')).toHaveCount(1);await expect(page.locator('.picture img')).toBeVisible();await expect(page.locator('.picture-empty')).toBeHidden();
 await expect(page.locator('.page-subtitle')).toContainText('Lures – ');await expect(page.getByRole('button',{name:'Copy Link'})).toHaveCount(0);
 await expect(page.locator('.page > :last-child')).toHaveText('Edit item');
 await route(page,'#/inventory/item/cylinder-weights','Cylinder');await page.getByRole('button',{name:/Enlarge/}).click();
 const viewer=page.getByRole('dialog',{name:'Image viewer'});await expect(viewer.getByRole('button',{name:'Close',exact:true})).toHaveCount(1);await expect(viewer).not.toContainText('null');await viewer.getByRole('button',{name:'Close',exact:true}).click();
 await route(page,'#/kb/species-largemouth-bass','Largemouth');await expect(page.locator('.page-header .page-subtitle')).toBeVisible();await expect(page.locator('.section>h2').filter({hasText:/^Notes$/})).toBeVisible();
 await page.getByRole('link',{name:'Edit item',exact:true}).click();await expect(page.locator('#app h1')).toHaveCount(1);await expect(page.locator('#app h1')).toHaveText('Edit Largemouth Bass');
 await page.getByRole('button',{name:'Create Link'}).click();const links=page.getByRole('dialog',{name:'Create Link'});await expect(links).toContainText('Internal link');await expect(links.getByRole('button',{name:'Copy internal link'})).toBeVisible();await links.getByRole('button',{name:'Close'}).click();
 await route(page,'#/inventory/add/lures','Add Gear');await expect(page.locator('#app h1')).toHaveCount(1);await expect(page.locator('.picture-empty')).toHaveCount(0);
 await expect(page.locator('.editor-form > :nth-child(3) > h2')).toHaveText('Picture');await expect(page.getByLabel('Choose a local picture',{exact:true})).toBeVisible();
 await expect(page.locator('.editor-form')).toContainText('File must be manually uploaded to repository');
 await page.getByRole('button',{name:'Add specification',exact:true}).click();await page.getByRole('button',{name:'Add link',exact:true}).click();
 await expect(page.locator('.repeat-row label')).toHaveCount(0);await expect(page.getByPlaceholder('URL',{exact:true})).toBeVisible();
 await page.getByRole('textbox',{name:'Name',exact:true}).fill('Review test');await page.getByPlaceholder('Value',{exact:true}).fill('Test');await page.getByPlaceholder('Label',{exact:true}).fill('Test');await page.getByPlaceholder('URL',{exact:true}).fill('https://example.com');
 await page.screenshot({path:testInfo.outputPath('add-gear.png'),fullPage:true});
 await packageFrom(page);
 // Browser clipboard support differs; inject a successful clipboard boundary to
 // verify the click awaits success and displays the confirmation beside the package.
 await page.evaluate(()=>{window.__copied='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__copied=value;}}});});
 await page.getByRole('button',{name:'Copy Changes',exact:true}).click();await expect(page.locator('.copy-notice')).toContainText('Changes copied to clipboard');await expect(page.locator('.copy-notice')).toContainText('implementation and deployment');
 expect(parsePackage(await page.evaluate(()=>window.__copied)).id).toBe('review-test');
 await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied');}}});});
 await page.getByRole('button',{name:'Copy Changes',exact:true}).click();await expect(page.locator('.copy-notice')).toContainText('Clipboard unavailable');await expect(page.locator('.copy-notice')).not.toContainText('Changes copied');
});

test('initial loading shell is styled before the library or application can load',async({browser},testInfo)=>{
 const context=await browser.newContext({javaScriptEnabled:false,colorScheme:'dark'});const page=await context.newPage();
 try{await page.goto(base);await expect(page.locator('#app')).toContainText('Loading Fishing Companion');
  const style=await page.locator('body').evaluate(e=>({background:getComputedStyle(e).backgroundColor,font:getComputedStyle(e).fontFamily}));
  expect(style.background).toBe('rgb(16, 27, 24)');expect(style.font).toContain('system-ui');
  await page.screenshot({path:testInfo.outputPath('initial-shell.png'),fullPage:true});
 }finally{await context.close();}
});

test('production replaces the actual v1 worker at the same URL and retains its stores',async({page,context})=>{
 test.skip(!production,'Production-only cutover scenario; preview isolation is covered separately');
 expect(process.env.FISHING_V1_DIST).toBeTruthy();state.legacy=true;
 await page.goto(base);await page.getByRole('button',{name:/My Gear Browse/}).waitFor();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 expect(await page.evaluate(()=>navigator.serviceWorker.controller.scriptURL)).toBe(base+'sw.js');
 const snapshot=()=>page.evaluate(async()=>{
  const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('fishing-companion');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
  const result={};for(const name of db.objectStoreNames)result[name]=await new Promise((resolve,reject)=>{const q=db.transaction(name).objectStore(name).getAll();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});db.close();return result;
 });
 await page.getByRole('button',{name:/My Gear Browse/}).click();await page.getByRole('button',{name:'Rods & Reels',exact:true}).waitFor();
 const before=await snapshot();expect(Object.keys(before).length).toBeGreaterThan(0);
 const legacyCaches=await page.evaluate(()=>caches.keys());expect(legacyCaches.some(x=>x.startsWith('fishing-companion-'))).toBe(true);
 state.legacy=false;await openReady(page);
 expect(await snapshot()).toEqual(before);
 const after=await page.evaluate(()=>caches.keys());for(const name of legacyCaches)expect(after).toContain(name);
 expect(await page.evaluate(async()=>new URL((await navigator.serviceWorker.getRegistration()).scope).pathname)).toBe('/fishing/');
 await disconnect(context,true);await page.reload();await expect(heading(page,'Fishing Companion')).toBeVisible();
 await route(page,'#/kb/species-perch','Yellow Perch');await expect(page.locator('.picture-button')).toHaveCount(1);await expect(page.locator('.picture img')).toHaveCount(1);await expect(page.locator('.picture img')).toBeVisible();await expect(page.locator('.picture-empty')).toBeHidden();
 expect(await snapshot()).toEqual(before);
});

test('FISH084 wording, search, catch date and exact icon',async({page})=>{
 await openReady(page);
 await expect(page.locator('a[href="#/kb"]')).toContainText('Fishing reference library');
 await expect(page.locator('a[href="#/catches"] p')).toHaveText('Recorded catches');
 const manifest=await page.evaluate(async()=>await(await fetch('./manifest.webmanifest')).json());
 expect(manifest.icons[0]).toEqual({src:'./revised-icon.png',sizes:'1254x1254',type:'image/png',purpose:'any'});
 expect(Buffer.from(await(await page.request.get(base+'revised-icon.png')).body())).toEqual(await fs.readFile(path.join(v2,'revised-icon.png')));
 for(const [hash,title] of [['#/inventory','My Gear'],['#/inventory/category/lures','Lures'],['#/kb','Knowledge Base'],['#/kb/category/equipment','Gear Guides']]){
  await route(page,hash,title);await expect(page.getByPlaceholder('Search '+title,{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Back',exact:true})).toBeVisible();
 }
 await route(page,'#/catches','Recorded catches');
 const data=await sourceData();const catches=data.catches.catches;
 const cards=page.locator('.record-grid .nav-card');
 for(let i=0;i<catches.length;i++){
  const c=catches[i],card=cards.filter({has:page.locator('h2')}).and(page.locator(`a[href="#/catches/${c.id}"]`));await expect(card.locator('h2')).toHaveText(data.kb.entities.find(x=>x.id===c.speciesId)?.name||'Catch');await expect(card.locator('h2 + time')).toHaveText(c.date);await expect(card.locator('time')).toHaveCSS('font-weight','400');
 }
});

test('FISH084 copied packages exit to their origin and subsequent edits stay protected',async({page})=>{
 await openReady(page);let dialogs=0;page.on('dialog',async d=>{dialogs++;await d.dismiss();});
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__copied=value;}}}));
 for(const [hash,title,add,domain] of [['#/inventory','My Gear','Add Gear','gear'],['#/inventory/category/lures','Lures','Add Gear','gear'],['#/kb','Knowledge Base','Add Entry','kb'],['#/kb/category/technique','Techniques','Add Entry','kb']]){
  await route(page,hash,title);await page.getByRole('link',{name:add,exact:true}).click();await page.getByRole('textbox',{name:'Name',exact:true}).fill('Exit regression');if(domain==='kb')await page.locator('.markdown-editor').fill('Required notes.');
  await packageFrom(page);await expect(page.getByRole('button',{name:'Exit',exact:true})).toBeHidden();await page.getByRole('button',{name:'Copy Changes',exact:true}).click();await expect(page.getByRole('button',{name:'Exit',exact:true})).toBeVisible();
  expect(parsePackage(await page.evaluate(()=>window.__copied)).domain).toBe(domain);await page.getByRole('button',{name:'Exit',exact:true}).click();await expect(page).toHaveURL(new RegExp(hash+'$'));await expect(heading(page,title)).toBeVisible();
 }
 const data=await sourceData();
 for(const [domain,record,prefix] of [['gear',data.gear.items[0],'#/inventory/item/'],['kb',data.kb.entities[0],'#/kb/']]){
  await route(page,prefix+record.id,record.name);await page.getByRole('link',{name:'Edit item',exact:true}).click();await page.getByRole('textbox',{name:'Name',exact:true}).fill(record.name+' changed');await packageFrom(page);await page.getByRole('button',{name:'Copy Changes',exact:true}).click();await expect(page.getByRole('button',{name:'Exit',exact:true})).toBeVisible();
  await page.getByRole('textbox',{name:'Name',exact:true}).fill(record.name+' changed again');await expect(page.getByRole('button',{name:'Exit',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(heading(page,'Edit')).toBeVisible();
  await packageFrom(page);await page.getByRole('button',{name:'Copy Changes',exact:true}).click();await page.getByRole('button',{name:'Exit',exact:true}).click();await expect(page).toHaveURL(new RegExp(prefix+record.id+'$'));await expect(heading(page,record.name)).toBeVisible();
 }
 expect(dialogs).toBe(2);
});
