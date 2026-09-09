import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'../..');
const v2=path.join(repo,'v2');
const prefix='/fishing/v2-preview/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'};
let server,base,temporary,initial,next,fixture;
const state={current:'initial',fail:new Set(),corrupt:new Set(),writes:[]};
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
 await fs.mkdir(path.join(source,'pwa'),{recursive:true});await fs.copyFile(path.join(repo,'pwa/icon.svg'),path.join(source,'pwa/icon.svg'));
 const data=await sourceData();const article=data.kb.entities.find(x=>x.content);
 fixture={articleId:article.id,articlePath:article.content,marker:'Browser release upgrade fixture'};
 await fs.appendFile(path.join(source,article.content),'\n\n## '+fixture.marker+'\n\nThe second release is independently verified.\n');
 next={root:path.join(temporary,'next')};
 run(path.join(v2,'tools/build.mjs'),['--pending-media','--source='+source,'--out='+next.root,'--source-revision='+initial.pointer.sourceRevision+'-browser-next']);
 run(path.join(v2,'tools/verify.mjs'),['--out='+next.root,'--source='+source]);
 next.pointer=await readJson(path.join(next.root,'release.json'));next.id=next.pointer.id;
 if(next.id===initial.id)throw new Error('Upgrade fixture has the same release ID');
}

async function serve(request,response){
 try{
  if(request.method!=='GET'&&request.method!=='HEAD'){state.writes.push(request.method+' '+request.url);response.writeHead(405);response.end();return;}
  const url=new URL(request.url,'http://localhost');
  if(url.pathname==='/fishing/legacy-check'){response.writeHead(200,{'Content-Type':'text/plain'});response.end('v1 scope sentinel');return;}
  if(!url.pathname.startsWith(prefix)){response.writeHead(404);response.end();return;}
  const relative=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';
  if(relative.includes('\\')||relative.split('/').some(x=>x==='..'))throw new Error('Unsafe test path');
  const release=relative.startsWith('releases/'+initial.id+'/')?initial:relative.startsWith('releases/'+next.id+'/')?next:state.current==='next'?next:initial;
  if(state.fail.has(relative)){response.writeHead(503);response.end('Injected unavailable asset');return;}
  const file=path.resolve(release.root,relative);if(!file.startsWith(release.root+path.sep))throw new Error('Unsafe test path');
  let bytes=await fs.readFile(file);if(state.corrupt.has(relative)){bytes=Buffer.from(bytes);bytes[bytes.length-1]^=1;}
  response.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':bytes.length,'Cache-Control':'no-store'});
  response.end(request.method==='HEAD'?undefined:bytes);
 }catch{response.writeHead(404);response.end();}
}

async function openReady(page,release=initial){
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await expect.poll(()=>page.evaluate(()=>window.__FISHING_V2__?.releaseId),{timeout:120000}).toBe(release.id);
 await expect(page.locator('#offline-status')).toContainText('Offline ready',{timeout:120000});
 await expect(page.locator('#app h1').first()).toHaveText('Fishing Companion');
}
const heading=(page,name)=>page.locator('#app h1').filter({hasText:name});
async function route(page,hash,title){await page.goto(base+hash,{waitUntil:'domcontentloaded'});await expect(heading(page,title)).toBeVisible();}
async function packageFrom(page){await page.getByRole('button',{name:'Prepare Changes'}).click();await expect(page.locator('.package-text')).toBeVisible();return JSON.parse(await page.locator('.package-text').inputValue());}
async function cacheInfo(page){return page.evaluate(async()=>{const names=(await caches.keys()).filter(x=>x.startsWith('fishing-v2:'));const result=[];for(const name of names){const c=await caches.open(name);const r=await c.match(new URL('__fishing_complete__',location.href));if(r)result.push(await r.json());}return result;});}

// One worker and separate browser contexts keep all service-worker/cache tests isolated.
test.beforeAll(async()=>{await prepare();server=createServer(serve);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}${prefix}`;});
test.afterAll(async()=>{if(server)await new Promise(resolve=>server.close(resolve));if(temporary)await fs.rm(temporary,{recursive:true,force:true});});
test.beforeEach(()=>{state.current='initial';state.fail.clear();state.corrupt.clear();state.writes.length=0;});

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
 await context.setOffline(true);await page.reload();
 await expect(heading(page,'Fishing Companion')).toBeVisible();
 await route(page,'#/inventory/item/daiwa-tatula-xt-rod','Daiwa');
 await expect(page.locator('.markdown-body')).not.toBeEmpty();
 expect(errors).toEqual([]);
 await context.setOffline(false);
});

test('navigation, filters, stable links, Catch History and image viewer',async({page})=>{
 const data=await sourceData();await openReady(page);
 await expect(page.locator('.nav-grid .nav-card')).toHaveCount(3);
 await route(page,'#/inventory','My Gear');
 await page.getByPlaceholder('Search all gear').fill('Tatula');
 await expect(page.locator('.record-grid .nav-card')).toHaveCount(1);
 await page.locator('.record-grid .nav-card').click();
 await expect(heading(page,'Daiwa Tatula')).toBeVisible();
 await page.getByRole('button',{name:'Copy Link'}).click();
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
 await page.getByPlaceholder('Search all Knowledge Base').fill('Silver Lake');
 await expect(page.locator('.record-grid .nav-card').first()).toBeVisible();
 await route(page,'#/kb/species-largemouth-bass','Largemouth Bass');
 await expect(page.locator('#app')).toContainText('Catch History');
 await expect(page.locator('.section').filter({hasText:'Catch History'}).locator('.nav-card')).toHaveCount(data.catches.catches.filter(x=>x.speciesId==='species-largemouth-bass').length);
 await route(page,'#/catches','Catch Log');
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
 await page.getByRole('button',{name:'Update offline library'}).click();
 await expect(page.locator('#offline-status')).toContainText('Offline ready',{timeout:120000});
 await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker.controller?.scriptURL)).toContain('/sw.js');
 expect(await page.evaluate(()=>window.__FISHING_V2__.releaseId)).toBe(initial.id);
 const failed=await cacheInfo(page);expect(failed.some(x=>x.releaseId===initial.id)).toBe(true);expect(failed.some(x=>x.releaseId===next.id)).toBe(false);
 await context.setOffline(true);await page.reload();await expect(heading(page,'Fishing Companion')).toBeVisible();
 await context.setOffline(false);state.corrupt.clear();
 await page.getByRole('button',{name:'Update offline library'}).click();
 await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker.controller?.scriptURL),{timeout:120000}).toContain('/sw.js');
 await page.getByRole('button',{name:'Reload'}).click();
 await expect.poll(()=>page.evaluate(()=>window.__FISHING_V2__?.releaseId),{timeout:120000}).toBe(next.id);
 await route(page,'#/kb/'+fixture.articleId,'');
 await expect(page.locator('.markdown-body')).toContainText(fixture.marker);
 const both=await cacheInfo(page);expect(both.some(x=>x.releaseId===initial.id)).toBe(true);expect(both.some(x=>x.releaseId===next.id)).toBe(true);
 await context.setOffline(true);await page.reload();await expect(page.locator('.markdown-body')).toContainText(fixture.marker);
 const old=await page.evaluate(async url=>{const r=await fetch(url);return {status:r.status,text:await r.text()};},urlFor(initial,fixture.articlePath));
 expect(old.status).toBe(200);expect(old.text).not.toContain(fixture.marker);
});

test('tampered cached content is rejected and repaired only from verified bytes',async({page,context})=>{
 await openReady(page);
 const target=urlFor(initial,fixture.articlePath);const relative='releases/'+initial.id+'/content/'+fixture.articlePath;
 await page.evaluate(async url=>{const names=await caches.keys();const name=names.find(x=>x.endsWith(window.__FISHING_V2__.releaseId));const cache=await caches.open(name);await cache.put(url,new Response('tampered content',{headers:{'Content-Type':'text/markdown'}}));},target);
 state.fail.add(relative);await context.setOffline(true);
 await route(page,'#/kb/'+fixture.articleId,'');
 await expect(page.locator('#app')).toContainText('Unable to display this page');
 await expect(page.locator('#app')).not.toContainText('tampered content');
 await context.setOffline(false);state.fail.clear();
 await route(page,'#/kb/'+fixture.articleId,'');
 await expect(page.locator('.markdown-body')).toBeVisible();
 await expect(page.locator('#app')).not.toContainText('tampered content');
});

test('mobile layout and isolated worker scope',async({browser})=>{
 const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true,deviceScaleFactor:2});const page=await context.newPage();
 try{await openReady(page);await route(page,'#/inventory/category/lures','Lures');
  const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));expect(width.scroll).toBeLessThanOrEqual(width.client+1);
  const legacy=await page.goto(new URL('/fishing/legacy-check',base).href);expect(await legacy.text()).toBe('v1 scope sentinel');
  expect(await page.evaluate(()=>navigator.serviceWorker.controller)).toBeNull();
 }finally{await context.close();}
});
