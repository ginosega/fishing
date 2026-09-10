// Actual HTTP bytes and browser acceptance for a deployed combined preview.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';
const args=Object.fromEntries(process.argv.slice(2).map(x=>x.replace(/^--/,'').split('=')));
const root=args.url||'https://ginosega.github.io/fishing/';
const production=args.production==='true';
const preview=production?root:new URL('v2-preview/',root).href;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const encode=p=>p.split('/').map(encodeURIComponent).join('/');
async function get(url){const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,url);return Buffer.from(await r.arrayBuffer());}
async function tree(dir){const result=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())for(const f of await tree(p))result.push(e.name+'/'+f);else if(e.isFile())result.push(e.name);else throw Error('Unsupported file: '+p);}return result.sort();}
async function compare(dir,base){const files=await tree(dir);let count=0;for(let i=0;i<files.length;i+=6)await Promise.all(files.slice(i,i+6).map(async file=>{const expected=await fs.readFile(path.join(dir,file));assert.equal(hash(await get(new URL(encode(file),base))),hash(expected),'Hosted byte mismatch: '+file);count++;}));return count;}
const report={url:root,preview,checkedAt:new Date().toISOString()};
if(args.v1)report.v1Files=await compare(args.v1,root);
if(args['v1-only']){console.log(JSON.stringify(report,null,2));process.exit(0);}
assert(args.dist,'--dist required');report.v2Files=await compare(args.dist,preview);
const pointer=JSON.parse(await fs.readFile(path.join(args.dist,'release.json'),'utf8'));report.releaseId=pointer.id;report.sourceRevision=pointer.sourceRevision;
await fs.mkdir('hosted-evidence',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext();const page=await context.newPage();
 if(!production){await page.goto(root);await page.getByRole('button',{name:/My Gear Browse/}).waitFor();await page.getByRole('button',{name:/My Gear Browse/}).click();await page.getByRole('button',{name:'Rods & Reels',exact:true}).waitFor();}
 await page.goto(preview);await page.waitForFunction(id=>window.__FISHING_V2__?.releaseId===id,pointer.id,{timeout:180000});
 await page.getByRole('button',{name:'Connection status',exact:true}).click();
 await page.locator('#offline-status[data-state="Ready"]').waitFor({timeout:180000});
 await page.locator('#connection-close').click();
 assert.equal(await page.evaluate(async()=>new URL((await navigator.serviceWorker.getRegistration()).scope).pathname),production?'/fishing/':'/fishing/v2-preview/');
 assert.deepEqual(await page.evaluate(()=>window.__FISHING_V2__.counts),{gear:69,kb:54,catches:5});
 await page.goto(preview+'#/inventory/item/bonafide-rvr119');await page.locator('.markdown-body').waitFor();
 const image=page.locator('#app img').first();await image.evaluate(async img=>{await img.decode();if(!img.naturalWidth)throw Error('Picture did not decode');});
 await page.getByRole('button',{name:/Enlarge/}).click();await page.getByRole('dialog',{name:'Image viewer'}).waitFor();await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).last().click();
 await context.setOffline(true);await page.reload();await page.locator('.markdown-body').waitFor();assert.equal(await page.evaluate(()=>window.__FISHING_V2__.releaseId),pointer.id);await context.setOffline(false);
 if(production){assert.equal(await page.locator('#release-details').count(),0);assert.equal(pointer.pendingMedia,false);await page.goto(root+'#/kb/species-perch');await page.getByRole('heading',{name:'Yellow Perch',exact:true}).waitFor();assert.equal(await page.locator('.picture-button').count(),1);assert.equal(await page.locator('.picture img').count(),1);await page.locator('.picture img').waitFor({state:'visible'});assert.equal(await page.locator('.picture-empty:visible').count(),0);await page.goto(root+'#/catches');await page.getByRole('heading',{name:'Catch Log',exact:true}).waitFor();assert.equal(await page.locator('.record-grid .nav-card').count(),5);await page.screenshot({path:'hosted-evidence/production-catches.png',fullPage:true});}else{await page.goto(root);await page.getByRole('button',{name:/My Gear Browse/}).waitFor();}report.browser=production?'production navigation, counts, image viewer, complete offline reload, current Perch picture and no release diagnostics passed':'v1 navigation, preview with existing root worker, image viewer, complete offline reload, return to v1 passed';
 await context.close();
}finally{await browser.close();}
await fs.mkdir('hosted-evidence',{recursive:true});await fs.writeFile('hosted-evidence/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
