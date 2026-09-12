import {test,expect} from '@playwright/test';
import sharp from 'sharp';
import {createServer} from 'node:http';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../..'),pwa=path.join(repo,'pwa'),prefix='/fish096/';
let temporary,source,out,server,base,pointer,sequenceId,staticId,sequenceFiles,staticFile;const state={disconnected:false,reads:[]};
const readJson=file=>fs.readFile(file,'utf8').then(JSON.parse);
const run=(script,args)=>{const result=spawnSync(process.execPath,[script,...args],{cwd:repo,encoding:'utf8',maxBuffer:8*1024*1024});if(result.status!==0)throw new Error(result.stdout+'\n'+result.stderr);};
const encoded=value=>value.split('/').map(encodeURIComponent).join('/');
function parsePackage(value){expect(value).toMatch(/^Fishing Companion change package:/);return JSON.parse(value.slice(value.indexOf('\n\n')+2));}
async function packageFrom(page){await page.getByRole('button',{name:'Prepare Changes'}).click();await expect(page.locator('.package-text')).toBeVisible();return parsePackage(await page.locator('.package-text').inputValue());}

async function prepare(){
 temporary=await fs.mkdtemp(path.join(os.tmpdir(),'fish096-browser-'));source=path.join(temporary,'source');out=path.join(temporary,'dist');
 for(const dir of ['Gear','KB','Catches'])await fs.cp(path.join(repo,dir),path.join(source,dir),{recursive:true});await fs.mkdir(path.join(source,'pwa'),{recursive:true});await fs.copyFile(path.join(pwa,'icon.png'),path.join(source,'pwa/icon.png'));
 const kbPath=path.join(source,'KB/kb.json'),kb=await readJson(kbPath),knots=kb.entities.filter(x=>x.type==='knot');if(knots.length<2)throw new Error('FISH096 browser fixture requires two Knot records');
 sequenceId=knots[0].id;staticId=knots[1].id;const sequenceFolder=path.join(source,'KB/Knots/assets',sequenceId);await fs.mkdir(sequenceFolder,{recursive:true});sequenceFiles=[];
 for(let i=1;i<=3;i++){const file=path.join(sequenceFolder,`step-0${i}.png`);await sharp({create:{width:120+i,height:80+i,channels:4,background:{r:40*i,g:50,b:90,alpha:1}}}).png().toFile(file);sequenceFiles.push(file);}
 knots[0].picture={src:`KB/Knots/assets/${sequenceId}/step-03.png`,caption:'Sequence browser caption'};knots[0].pictureSequence=[1,2,3].map(i=>`KB/Knots/assets/${sequenceId}/step-0${i}.png`);
 staticFile=path.join(source,'KB/Knots/assets/fish096-static.png');await sharp({create:{width:130,height:90,channels:4,background:{r:20,g:110,b:80,alpha:1}}}).png().toFile(staticFile);knots[1].picture={src:'KB/Knots/assets/fish096-static.png',caption:'Static browser caption'};delete knots[1].pictureSequence;
 await fs.writeFile(kbPath,JSON.stringify(kb,null,2)+'\n');
 run(path.join(pwa,'tools/build.mjs'),['--pending-media','--base='+prefix,'--source='+source,'--out='+out,'--source-revision=fish096-browser']);run(path.join(pwa,'tools/verify.mjs'),['--out='+out,'--source='+source]);pointer=await readJson(path.join(out,'release.json'));
 server=createServer(async(request,response)=>{if(state.disconnected){request.socket.destroy();return;}try{const url=new URL(request.url,'http://localhost');if(!url.pathname.startsWith(prefix)){response.writeHead(404);response.end();return;}const relative=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';state.reads.push(relative);if(relative.includes('\\')||relative.split('/').some(x=>x==='..'))throw new Error('unsafe');const file=path.resolve(out,relative);if(!file.startsWith(out+path.sep))throw new Error('unsafe');const bytes=await fs.readFile(file),ext=path.extname(file);const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'};response.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','Content-Length':bytes.length,'Cache-Control':'no-store'});response.end(bytes);}catch{response.writeHead(404);response.end();}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}${prefix}`;
}
async function openReady(page){await page.goto(base,{waitUntil:'domcontentloaded'});await expect.poll(()=>page.evaluate(()=>window.__FISHING_V2__?.releaseId),{timeout:120000}).toBe(pointer.id);await expect(page.locator('#app h1').first()).toHaveText('Fishing Companion');}
async function route(page,hash,title){await page.goto(base+hash,{waitUntil:'domcontentloaded'});await expect(page.locator('#app .page-header h1')).toContainText(title);}
async function disconnect(context,offline){state.disconnected=offline;if(context.browser().browserType().name()!=='webkit')await context.setOffline(offline);}

test.beforeAll(prepare);test.afterAll(async()=>{if(server)await new Promise(resolve=>server.close(resolve));if(temporary)await fs.rm(temporary,{recursive:true,force:true});});test.beforeEach(()=>{state.disconnected=false;state.reads.length=0;});

test('FISH096 runtime shows final frame, opens frame 1, steps/loops, and remains sequence-capable offline',async({page,context})=>{
 await openReady(page);await route(page,'#/kb/'+sequenceId,knotsTitle(sequenceId));
 const finalName='step-03.png';await expect(page.locator('.picture img')).toHaveAttribute('src',new RegExp(finalName));expect(state.reads.some(x=>x.includes('step-01.png'))).toBeFalsy();expect(state.reads.some(x=>x.includes('step-02.png'))).toBeFalsy();
 await page.locator('.picture-button').click();const dialog=page.getByRole('dialog',{name:'Image sequence viewer'});await expect(dialog).toBeVisible();await expect(dialog.locator('.viewer-frame-indicator')).toHaveText('1 of 3');await expect(dialog.locator('img')).toHaveAttribute('src',/step-01\.png/);await expect(dialog).toContainText('Sequence browser caption');
 await dialog.getByRole('button',{name:'Next'}).click();await expect(dialog.locator('.viewer-frame-indicator')).toHaveText('2 of 3');await dialog.getByRole('button',{name:'Next'}).click();await expect(dialog.locator('.viewer-frame-indicator')).toHaveText('3 of 3');await expect(dialog.getByRole('button',{name:'Next'})).toBeDisabled();
 await dialog.getByRole('button',{name:'Previous'}).click();await dialog.getByRole('button',{name:'Play'}).click();await expect(dialog.locator('.viewer-frame-indicator')).toHaveText('3 of 3',{timeout:2200});await expect(dialog.locator('.viewer-frame-indicator')).toHaveText('1 of 3',{timeout:2200});await dialog.getByRole('button',{name:'Pause'}).click();
 await page.keyboard.press('ArrowRight');await expect(dialog.locator('.viewer-frame-indicator')).toHaveText('2 of 3');await page.keyboard.press('ArrowLeft');await expect(dialog.locator('.viewer-frame-indicator')).toHaveText('1 of 3');await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
 const manifest=await readJson(path.join(out,pointer.manifest));expect(new Set(state.reads.filter(x=>x.startsWith('releases/'+pointer.id+'/'))).size).toBeLessThan(manifest.files.length);
 await page.getByRole('button',{name:'Connection status',exact:true}).click();await page.getByRole('button',{name:'Update offline library',exact:true}).click();await page.locator('#connection-close').click();await expect(page.locator('#offline-status')).toHaveAttribute('data-state','Ready',{timeout:120000});
 await disconnect(context,true);await page.reload();await expect(page.locator('#app .page-header h1')).toBeVisible();await route(page,'#/kb/'+sequenceId,knotsTitle(sequenceId));await page.locator('.picture-button').click();await expect(page.getByRole('dialog',{name:'Image sequence viewer'}).locator('.viewer-frame-indicator')).toHaveText('1 of 3');await page.getByRole('dialog',{name:'Image sequence viewer'}).getByRole('button',{name:'Next'}).click();await expect(page.getByRole('dialog',{name:'Image sequence viewer'}).locator('.viewer-frame-indicator')).toHaveText('2 of 3');await disconnect(context,false);
});

function knotsTitle(id){return id===sequenceId?'':id;}

test('FISH096 Add Knot sequence validates filenames, previews locally, and prepares exact per-Knot upload link',async({page})=>{
 await openReady(page);await route(page,'#/kb/add/knot','Add Entry');const form=page.locator('.editor-form');await form.getByRole('textbox',{name:'Name',exact:true}).fill('Browser Sequence Knot');await form.locator('.markdown-editor').fill('TODO');
 const action=form.getByRole('combobox',{name:'Picture action'});await action.selectOption('add-sequence');const chooser=form.getByLabel('Choose local pictures');await chooser.setInputFiles([sequenceFiles[0],sequenceFiles[2]]);await expect(page.locator('.editor-notice')).toContainText('expected step-02');
 await chooser.setInputFiles(sequenceFiles);await expect(form).toContainText('3 pictures selected');await expect(form).toContainText('First frame: step-01.png');await expect(form).toContainText('Representative picture: step-03.png');await expect(form.getByRole('textbox',{name:'Repository picture path'})).toHaveValue('KB/Knots/assets/browser-sequence-knot/step-03.png');await expect(form.getByRole('textbox',{name:'Repository picture path'})).toHaveAttribute('readonly','');
 await form.locator('.picture-button').click();await expect(page.getByRole('dialog',{name:'Image sequence viewer'}).locator('.viewer-frame-indicator')).toHaveText('1 of 3');await page.keyboard.press('Escape');
 const pkg=await packageFrom(page);expect(pkg.picture.action).toBe('add');expect(pkg.pictureSequence.action).toBe('set');expect(pkg.pictureSequence.paths).toEqual(['KB/Knots/assets/browser-sequence-knot/step-01.png','KB/Knots/assets/browser-sequence-knot/step-02.png','KB/Knots/assets/browser-sequence-knot/step-03.png']);expect(pkg.pictureSequence.files).toHaveLength(3);expect(pkg.picture.path).toBe(pkg.pictureSequence.paths.at(-1));
 const link=page.getByRole('link',{name:'Open the repository upload folder'});await expect(page.locator('.handoff-output')).toContainText('KB/Knots/assets/browser-sequence-knot/');await expect(link).toHaveAttribute('href','https://github.com/ginosega/fishing/upload/main/KB/Knots/assets/browser-sequence-knot');
});

test('FISH096 Edit sequence resolves type-away and supports keeping only representative picture',async({page})=>{
 await openReady(page);await route(page,'#/kb/edit/'+sequenceId,'Edit');const form=page.locator('.editor-form');await form.getByRole('combobox',{name:'Type'}).selectOption('technique');await form.getByRole('button',{name:'Prepare Changes'}).click();await expect(page.locator('.editor-notice')).toContainText('Resolve the sequence');
 const action=form.getByRole('combobox',{name:'Picture action'});await action.selectOption('remove-sequence-keep-picture');const pkg=await packageFrom(page);expect(pkg.pictureSequence.action).toBe('remove');expect(pkg.picture.action).toBe('keep');expect(pkg.changes.set.type).toBe('technique');
});

test('FISH096 Edit converts sequence to new static and static Knot to complete sequence',async({page})=>{
 await openReady(page);await route(page,'#/kb/edit/'+sequenceId,'Edit');let form=page.locator('.editor-form'),action=form.getByRole('combobox',{name:'Picture action'});await action.selectOption('replace-with-static');await form.getByLabel('Choose a local picture').setInputFiles(staticFile);let pkg=await packageFrom(page);expect(pkg.picture.action).toBe('replace');expect(pkg.pictureSequence.action).toBe('remove');expect(pkg.picture.path).toMatch(/KB\/Knots\/assets\/fish096-static\.png$/);
 await route(page,'#/kb/edit/'+staticId,'Edit');form=page.locator('.editor-form');action=form.getByRole('combobox',{name:'Picture action'});await action.selectOption('replace-with-sequence');await form.getByLabel('Choose local pictures').setInputFiles(sequenceFiles);pkg=await packageFrom(page);expect(pkg.picture.action).toBe('replace');expect(pkg.pictureSequence.action).toBe('set');expect(pkg.pictureSequence.paths).toHaveLength(3);expect(pkg.pictureSequence.paths.every(x=>x.includes(`/KB/Knots/assets/${staticId}/`)||x.includes(`KB/Knots/assets/${staticId}/`))).toBeTruthy();expect(pkg.picture.path).toBe(pkg.pictureSequence.paths.at(-1));
});
