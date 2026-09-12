// Actual HTTP bytes and browser acceptance for deployed Fishing Companion releases.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
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
 // FISH091: a clean online visit must be usable without provisioning a complete cache.
 await page.getByRole('button',{name:'Connection status',exact:true}).click();
 await page.locator('#offline-status[data-state="Incomplete"]').waitFor({timeout:30000});
 assert.match(await page.locator('#offline-status').innerText(),/not prepared/i);
 assert.equal(await page.getByRole('button',{name:'Update offline library',exact:true}).isEnabled(),true);
 await page.locator('#connection-close').click();
 const completeBefore=await page.evaluate(async()=>{let count=0;for(const name of await caches.keys()){if(!name.startsWith('fishing-v2:'))continue;const cache=await caches.open(name);if(await cache.match(new URL('__fishing_complete__',location.href)))count++;}return count;});
 assert.equal(completeBefore,0,'Clean online visit unexpectedly prepared a complete offline library');
 assert.equal(await page.evaluate(async()=>new URL((await navigator.serviceWorker.getRegistration()).scope).pathname),production?'/fishing/':'/fishing/v2-preview/');
 assert.deepEqual(await page.evaluate(()=>window.__FISHING_V2__.counts),{gear:69,kb:56,catches:5});
 await page.goto(preview+'#/inventory/item/bonafide-rvr119');await page.locator('.markdown-body').waitFor();
 const image=page.locator('#app img').first();await image.evaluate(async img=>{await img.decode();if(!img.naturalWidth)throw Error('Picture did not decode');});
 await page.getByRole('button',{name:/Enlarge/}).click();await page.getByRole('dialog',{name:'Image viewer'}).waitFor();await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).last().click();
 // Explicit user action is the only point at which the complete library is prepared.
 await page.getByRole('button',{name:'Connection status',exact:true}).click();await page.getByRole('button',{name:'Update offline library',exact:true}).click();
 await page.locator('#offline-status[data-state="Ready"]').waitFor({timeout:180000});await page.locator('#connection-close').click();
 const completeAfter=await page.evaluate(async()=>{let count=0;for(const name of await caches.keys()){if(!name.startsWith('fishing-v2:'))continue;const cache=await caches.open(name);if(await cache.match(new URL('__fishing_complete__',location.href)))count++;}return count;});assert.equal(completeAfter,1);
 await context.setOffline(true);await page.reload();await page.locator('.markdown-body').waitFor();assert.equal(await page.evaluate(()=>window.__FISHING_V2__.releaseId),pointer.id);await context.setOffline(false);
 if(production){assert.equal(await page.locator('#release-details').count(),0);assert.equal(pointer.pendingMedia,false);await page.goto(root+'#/kb/species-perch');await page.getByRole('heading',{name:'Yellow Perch',exact:true,level:1}).waitFor();await page.locator('.picture img').waitFor();assert.equal(await page.locator('.picture img').count(),1);assert.equal(await page.locator('.picture-empty').isVisible(),false);await page.goto(root+'#/catches');await page.getByRole('heading',{name:'Recorded catches',exact:true}).waitFor();assert.equal(await page.locator('.record-grid .nav-card').count(),5);await page.screenshot({path:'hosted-evidence/production-catches.png',fullPage:true});}else{await page.goto(root);await page.getByRole('button',{name:/My Gear Browse/}).waitFor();}
 report.browser=production?'production online-only default, explicit complete-library preparation, offline reload, navigation, counts, image viewer, absent pictures and no release diagnostics passed':'v1 navigation, preview online-only default, explicit complete-library preparation, offline reload and return to v1 passed';
 if(production){
  await page.goto(root);await page.locator('a[href="#/kb"]').waitFor();assert.equal(await page.locator('a[href="#/kb"] p').textContent(),'Fishing reference library');assert.equal(await page.locator('a[href="#/catches"] p').textContent(),'Recorded catches');
  const icon=await page.evaluate(async()=>await(await fetch('./manifest.webmanifest')).json());assert.equal(icon.icons[0].src,'./icon.png');
  await page.goto(root+'#/inventory');await page.getByPlaceholder('Search My Gear',{exact:true}).waitFor();await page.getByRole('link',{name:'Add Gear',exact:true}).click();await page.getByRole('textbox',{name:'Name',exact:true}).fill('Hosted verification only');await page.getByRole('button',{name:'Prepare Changes',exact:true}).click();await page.locator('.package-text').waitFor();
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__hostedCopy=value;}}}));
  await page.getByRole('button',{name:'Copy Changes',exact:true}).click();await page.getByRole('button',{name:'Exit',exact:true}).waitFor();
  const copied=await page.evaluate(()=>window.__hostedCopy);assert(copied.startsWith('Fishing Companion change package:'));assert.equal(JSON.parse(copied.slice(copied.indexOf('\n\n')+2)).format,'fishing-companion-change-v2');
  let dialogs=0;page.on('dialog',async dialog=>{dialogs++;await dialog.dismiss();});await page.getByRole('button',{name:'Exit',exact:true}).click();await page.getByRole('heading',{name:'My Gear',exact:true}).waitFor();assert.equal(dialogs,0);assert.equal(new URL(page.url()).hash,'#/inventory');
  await page.goto(root+'#/catches');await page.getByRole('heading',{name:'Recorded catches',exact:true}).waitFor();assert.equal(await page.locator('.record-grid h2 + time').count(),5);assert.equal(await page.locator('.catch-date').first().evaluate(e=>getComputedStyle(e).fontWeight),'400');await page.getByRole('button',{name:'Back',exact:true}).waitFor();
  report.refinements='Exact icon bytes, manifest, KB/Catch wording, search, Catch date layout, prefixed valid JSON and post-copy Exit passed; clipboard boundary simulated; no source writes';

  // FISH096 hosted acceptance: exercise the deployed sequence authoring and local preview path without adding canonical test data.
  const seqDir=path.join('hosted-evidence','fish096-sequence');await fs.mkdir(seqDir,{recursive:true});const seqFiles=[];
  for(let i=1;i<=3;i++){const file=path.join(seqDir,`step-0${i}.png`);await sharp({create:{width:100+i,height:70+i,channels:4,background:{r:30*i,g:90,b:120,alpha:1}}}).png().toFile(file);seqFiles.push(file);}
  await page.goto(root+'#/kb/add/knot');const form=page.locator('.editor-form');await form.getByRole('textbox',{name:'Name',exact:true}).fill('Hosted Sequence Verification');await form.locator('.markdown-editor').fill('TODO');await form.getByRole('combobox',{name:'Picture action'}).selectOption('add-sequence');await form.getByLabel('Choose local pictures').setInputFiles(seqFiles);await form.getByText('3 pictures selected',{exact:true}).waitFor();assert.equal(await form.getByRole('textbox',{name:'Repository picture path'}).inputValue(),'KB/Knots/assets/hosted-sequence-verification/step-03.png');
  await form.locator('.picture-button').click();const sequenceDialog=page.getByRole('dialog',{name:'Image sequence viewer'});await sequenceDialog.waitFor();assert.equal(await sequenceDialog.locator('.viewer-frame-indicator').textContent(),'1 of 3');await sequenceDialog.getByRole('button',{name:'Next'}).click();assert.equal(await sequenceDialog.locator('.viewer-frame-indicator').textContent(),'2 of 3');await sequenceDialog.getByRole('button',{name:'Close'}).click();
  await form.getByRole('button',{name:'Prepare Changes'}).click();await page.locator('.package-text').waitFor();const packageText=await page.locator('.package-text').inputValue(),pkg=JSON.parse(packageText.slice(packageText.indexOf('\n\n')+2));assert.equal(pkg.pictureSequence.action,'set');assert.equal(pkg.pictureSequence.paths.length,3);assert.equal(pkg.picture.path,pkg.pictureSequence.paths.at(-1));const upload=page.getByRole('link',{name:'Open the repository upload folder'});assert.equal(await upload.getAttribute('href'),'https://github.com/ginosega/fishing/upload/main/KB/Knots/assets/hosted-sequence-verification');assert.match(await page.locator('.handoff-output').innerText(),/KB\/Knots\/assets\/hosted-sequence-verification\//);
  report.fish096='Hosted Add Knot sequence selection, local sequence preview, ordered package metadata and exact per-Knot GitHub upload link passed; no repository write performed';
 }
 await context.close();
}finally{await browser.close();}
await fs.mkdir('hosted-evidence',{recursive:true});await fs.writeFile('hosted-evidence/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
