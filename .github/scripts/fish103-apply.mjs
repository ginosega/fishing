import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=file=>fs.readFile(path.join(repo,file),'utf8');
const write=(file,text)=>fs.writeFile(path.join(repo,file),text);
const assert=(ok,message)=>{if(!ok)throw new Error(message);};

async function replace(file,from,to,{count=1}={}){
 let text=await read(file),seen=0,index=0;
 while((index=text.indexOf(from,index))!==-1){seen++;index+=from.length;}
 assert(seen===count,`${file}: expected ${count} matches, found ${seen}: ${from.slice(0,100)}`);
 text=text.split(from).join(to);
 await write(file,text);
}

// Physical canonical PWA source now lives entirely under pwa/. Logical content paths
// remain Gear/..., KB/... and Catches/... so release URLs and stored record paths remain stable.
await replace('pwa/tools/build.mjs',
 "const source=path.resolve(option('--source',repo)),output=path.resolve(option('--out',path.join(repo,'pwa/dist')));",
 "const source=path.resolve(option('--source',path.join(repo,'pwa'))),output=path.resolve(option('--out',path.join(repo,'pwa/dist')));");
await replace('pwa/tools/library.mjs',"path.join(root,'pwa/migration/reconciliation.json')","path.join(root,'migration/reconciliation.json')");
await replace('pwa/tools/library.mjs',"path.join(root,'pwa/migration/media-decisions.json')","path.join(root,'migration/media-decisions.json')");
await replace('.github/workflows/fishing-production.yml',
 "paths: ['pwa/**', '!pwa/docs/**', '!pwa/README.md', 'Gear/**', 'KB/**', 'Catches/**', '.github/workflows/**']",
 "paths: ['pwa/**', '!pwa/docs/**', '!pwa/README.md', '.github/workflows/**']",{count:2});

// External Markdown links open in a new tab; internal app links, anchors and local links stay same-tab.
await replace('pwa/src/markdown.mjs',
 "const rawLink=md.renderer.rules.link_open||((tokens,i,options,env,self)=>self.renderToken(tokens,i,options));\nmd.renderer.rules.link_open=(tokens,i,options,env,self)=>{tokens[i].attrSet('target','_self');return rawLink(tokens,i,options,env,self);};\n",
 "");
await replace('pwa/src/markdown.mjs',
 "  references.push({owner,kind:image?'image':'link',source:original,...resolved});token.attrSet(attr,resolved.target);",
 "  references.push({owner,kind:image?'image':'link',source:original,...resolved});token.attrSet(attr,resolved.target);if(!image&&resolved.kind==='external'){token.attrSet('target','_blank');token.attrSet('rel','noopener noreferrer');}");
await replace('pwa/src/markdown.mjs',
 "return purifier.sanitize(html,{USE_PROFILES:{html:true},FORBID_TAGS:['iframe','object','embed','script','style','form','input','button','video','audio','source','svg','math'],FORBID_ATTR:['style','srcset','onerror','onclick','onload'],ALLOW_DATA_ATTR:false});",
 "return purifier.sanitize(html,{USE_PROFILES:{html:true},ADD_ATTR:['target','rel'],FORBID_TAGS:['iframe','object','embed','script','style','form','input','button','video','audio','source','svg','math'],FORBID_ATTR:['style','srcset','onerror','onclick','onload'],ALLOW_DATA_ATTR:false});");

// Structured Gear Links are external Web links and must open in a new tab.
await replace('pwa/src/ui.mjs',
 "...record.links.map(l=>el('a',{href:l.url,rel:'noopener noreferrer'},l.label,' ↗'))",
 "...record.links.map(l=>el('a',{href:l.url,target:'_blank',rel:'noopener noreferrer'},l.label,' ↗'))");

// Repository upload destinations now include the physical pwa/ source root.
await replace('pwa/src/editor.mjs',
 "function linkToUpload(path){const dir=path.split('/').slice(0,-1).map(encodeURIComponent).join('/');return `https://github.com/ginosega/fishing/tree/main/${dir}`;}\nfunction linkToSequenceUpload(folder){return `https://github.com/ginosega/fishing/upload/main/${encodedPath(folder)}`;}",
 "function linkToUpload(path){const dir=path.split('/').slice(0,-1).map(encodeURIComponent).join('/');return `https://github.com/ginosega/fishing/tree/main/pwa/${dir}`;}\nfunction linkToSequenceUpload(folder){return `https://github.com/ginosega/fishing/upload/main/pwa/${encodedPath(folder)}`;}");

// Caption typing updates only the preview caption, rather than detaching/reinserting the focused input.
await replace('pwa/src/editor.mjs',
 " captionInput.addEventListener('input',()=>{if(record.picture)optional(record.picture,'caption',captionInput.value);renderPicture();changed();});",
 " function refreshCaptionPreview(){const figure=pictureInfo.querySelector('figure.picture');if(!figure)return;let caption=figure.querySelector('figcaption');if(captionInput.value){if(!caption){caption=el('figcaption',{});figure.append(caption);}caption.textContent=captionInput.value;}else caption?.remove();}\n captionInput.addEventListener('input',()=>{if(record.picture)optional(record.picture,'caption',captionInput.value);refreshCaptionPreview();changed();});");

// New KB records need a provisional content path before whole-library validation during Markdown preview.
await replace('pwa/src/editor.mjs',
 "  try{const {maps,routes}=editorMaps(ctx,domain,record);const owner=record[key]||narrativePath(domain,record);const parsed=parseMarkdown(body,{owner,maps,assetBase:ctx.base,exists:knownPaths(ctx),pathRoutes:routes,allowMissing:true});",
 "  try{const owner=record[key]||narrativePath(domain,record),previewRecord=clone(record);if(!previewRecord[key])previewRecord[key]=owner;const {maps,routes}=editorMaps(ctx,domain,previewRecord);const parsed=parseMarkdown(body,{owner,maps,assetBase:ctx.base,exists:knownPaths(ctx),pathRoutes:routes,allowMissing:true});");

// Core tests use pwa/ as the canonical physical source root and enforce absence of root duplicates.
await replace('pwa/test/core.test.mjs',
 "const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');",
 "const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),root=path.join(repo,'pwa');");
await replace('pwa/test/core.test.mjs',"read('pwa/migration/reconciliation.json')","read('migration/reconciliation.json')");
await replace('pwa/test/core.test.mjs',"read('pwa/migration/media-decisions.json')","read('migration/media-decisions.json')");
await replace('pwa/test/core.test.mjs',
 "test('all six independent components retain their own identity',()=>{",
 "test('canonical PWA source folders live only under pwa',async()=>{for(const dir of ['Gear','KB','Catches']){await fs.access(path.join(root,dir));await assert.rejects(fs.access(path.join(repo,dir)),error=>error?.code==='ENOENT');}});\ntest('all six independent components retain their own identity',()=>{");
await replace('pwa/test/core.test.mjs',
 "test('Markdown resolves internal, relative and heading links without double encoding',()=>{",
 "test('Markdown external links open a new tab while internal links remain same-tab',()=>{const owner=data.kb.entities[0].content;const result=parseMarkdown('[External](https://example.com) [Internal](gear://daiwa-tatula-xt-rod)',{owner,maps,pathRoutes:routes});assert.match(result.html,/href=\"https:\/\/example\\.com\" target=\"_blank\" rel=\"noopener noreferrer\"/);assert.match(result.html,/href=\"#\\/inventory\\/item\\/daiwa-tatula-xt-rod\"/);assert.doesNotMatch(result.html,/href=\"#\\/inventory\\/item\\/daiwa-tatula-xt-rod\"[^>]*target=\"_blank\"/);});\ntest('Markdown resolves internal, relative and heading links without double encoding',()=>{");

// FISH096 unit fixture reads the physical source from pwa/.
await replace('pwa/test/fish096.test.mjs',
 "const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../..');\nconst readJson=file=>fs.readFile(file,'utf8').then(JSON.parse);\nasync function sourceData(){return {gear:await readJson(path.join(repo,'Gear/gear.json')),kb:await readJson(path.join(repo,'KB/kb.json')),catches:await readJson(path.join(repo,'Catches/catches.json'))};}",
 "const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../..'),sourceRoot=path.join(repo,'pwa');\nconst readJson=file=>fs.readFile(file,'utf8').then(JSON.parse);\nasync function sourceData(){return {gear:await readJson(path.join(sourceRoot,'Gear/gear.json')),kb:await readJson(path.join(sourceRoot,'KB/kb.json')),catches:await readJson(path.join(sourceRoot,'Catches/catches.json'))};}");

// Main browser fixture copies canonical source from pwa/ and adds regression coverage for all three authoring/link issues.
await replace('pwa/test/browser.spec.mjs',
 "const sourceData=async()=>({gear:await readJson(path.join(repo,'Gear/gear.json')),kb:await readJson(path.join(repo,'KB/kb.json')),catches:await readJson(path.join(repo,'Catches/catches.json'))});",
 "const sourceData=async()=>({gear:await readJson(path.join(v2,'Gear/gear.json')),kb:await readJson(path.join(v2,'KB/kb.json')),catches:await readJson(path.join(v2,'Catches/catches.json'))});");
await replace('pwa/test/browser.spec.mjs',
 " for(const dir of ['Gear','KB','Catches'])await fs.cp(path.join(repo,dir),path.join(source,dir),{recursive:true});\n await fs.mkdir(path.join(source,'pwa'),{recursive:true});await fs.copyFile(path.join(repo,'pwa/icon.png'),path.join(source,'pwa/icon.png'));",
 " for(const dir of ['Gear','KB','Catches'])await fs.cp(path.join(v2,dir),path.join(source,dir),{recursive:true});");
const browserAppend=`\n\ntest('FISH103 external links, caption focus and new-KB Markdown preview regressions',async({page})=>{\n await openReady(page);\n await route(page,'#/inventory/item/daiwa-tatula-xt-rod','Daiwa Tatula');\n const webLink=page.locator('.links-list a').first();await expect(webLink).toHaveAttribute('target','_blank');await expect(webLink).toHaveAttribute('rel','noopener noreferrer');\n const internalGear=page.locator('.markdown-body a').filter({hasText:'Sufix 832'});await expect(internalGear).not.toHaveAttribute('target','_blank');\n await route(page,'#/kb/knot-palomar','Palomar Knot');const markdownWeb=page.getByRole('link',{name:'Palomar Knot',exact:true});await expect(markdownWeb).toHaveAttribute('target','_blank');await expect(markdownWeb).toHaveAttribute('rel','noopener noreferrer');\n await route(page,'#/inventory/edit/daiwa-tatula-xt-rod','Edit');let form=page.locator('.editor-form'),caption=form.getByLabel('Caption (optional)',{exact:true});await caption.click();await caption.pressSequentially('Gear caption focus');expect(await caption.evaluate(el=>document.activeElement===el)).toBeTruthy();await expect(caption).toHaveValue('Gear caption focus');await expect(form.locator('.picture figcaption')).toHaveText('Gear caption focus');page.once('dialog',dialog=>dialog.accept());await form.getByRole('button',{name:'Cancel',exact:true}).click();\n await route(page,'#/kb/edit/knot-palomar','Edit');form=page.locator('.editor-form');caption=form.getByLabel('Caption (optional)',{exact:true});await caption.fill('');await caption.click();await caption.pressSequentially('KB caption focus');expect(await caption.evaluate(el=>document.activeElement===el)).toBeTruthy();await expect(caption).toHaveValue('KB caption focus');await expect(form.locator('.picture figcaption')).toHaveText('KB caption focus');page.once('dialog',dialog=>dialog.accept());await form.getByRole('button',{name:'Cancel',exact:true}).click();\n await route(page,'#/kb/add/knot','Add Entry');form=page.locator('.editor-form');await form.getByRole('textbox',{name:'Name',exact:true}).fill('FISH103 Preview Test');await form.locator('.markdown-editor').fill('Preview body with [Internal](kb://knot-palomar) and [External](https://example.com).');await form.getByRole('button',{name:'Preview Markdown',exact:true}).click();const preview=form.locator('.markdown-preview');await expect(preview).toBeVisible();await expect(preview).toContainText('Preview body');await expect(page.locator('.editor-notice')).not.toContainText('schema');await expect(preview.getByRole('link',{name:'External',exact:true})).toHaveAttribute('target','_blank');await expect(preview.getByRole('link',{name:'Internal',exact:true})).not.toHaveAttribute('target','_blank');\n});\n`;
let browser=await read('pwa/test/browser.spec.mjs');assert(!browser.includes("FISH103 external links, caption focus"),'Browser FISH103 test already exists');await write('pwa/test/browser.spec.mjs',browser+browserAppend);

// Dedicated FISH096 browser fixture copies source from pwa/ and expects the physical upload destination.
await replace('pwa/test/fish096.spec.mjs',
 " for(const dir of ['Gear','KB','Catches'])await fs.cp(path.join(repo,dir),path.join(source,dir),{recursive:true});await fs.mkdir(path.join(source,'pwa'),{recursive:true});await fs.copyFile(path.join(pwa,'icon.png'),path.join(source,'pwa/icon.png'));",
 " for(const dir of ['Gear','KB','Catches'])await fs.cp(path.join(pwa,dir),path.join(source,dir),{recursive:true});");
await replace('pwa/test/fish096.spec.mjs',
 "https://github.com/ginosega/fishing/upload/main/KB/Knots/assets/browser-sequence-knot",
 "https://github.com/ginosega/fishing/upload/main/pwa/KB/Knots/assets/browser-sequence-knot");

// Hosted verifier checks physical layout and the revised live behavior.
await replace('pwa/tools/verify-hosted.mjs',
 "assert.deepEqual(await page.evaluate(()=>window.__FISHING_V2__.counts),{gear:69,kb:56,catches:5});",
 "assert.deepEqual(await page.evaluate(()=>window.__FISHING_V2__.counts),{gear:69,kb:56,catches:5});for(const dir of ['Gear','KB','Catches']){await fs.access(dir);await assert.rejects(fs.access(path.join('..',dir)),error=>error?.code==='ENOENT');}");
await replace('pwa/tools/verify-hosted.mjs',
 "assert.equal(await upload.getAttribute('href'),'https://github.com/ginosega/fishing/upload/main/KB/Knots/assets/hosted-sequence-verification');",
 "assert.equal(await upload.getAttribute('href'),'https://github.com/ginosega/fishing/upload/main/pwa/KB/Knots/assets/hosted-sequence-verification');");
await replace('pwa/tools/verify-hosted.mjs',
 "  report.fish096='Hosted Add Knot sequence selection, local sequence preview, ordered package metadata and exact per-Knot GitHub upload link passed; no repository write performed';",
 "  report.fish096='Hosted Add Knot sequence selection, local sequence preview, ordered package metadata and exact per-Knot GitHub upload link passed; no repository write performed';\n  await page.goto(root+'#/inventory/item/daiwa-tatula-xt-rod');const hostedWeb=page.locator('.links-list a').first();assert.equal(await hostedWeb.getAttribute('target'),'_blank');assert.equal(await hostedWeb.getAttribute('rel'),'noopener noreferrer');const hostedInternal=page.locator('.markdown-body a').filter({hasText:'Sufix 832'});assert.notEqual(await hostedInternal.getAttribute('target'),'_blank');\n  await page.goto(root+'#/kb/knot-palomar');const hostedMarkdownWeb=page.getByRole('link',{name:'Palomar Knot',exact:true});assert.equal(await hostedMarkdownWeb.getAttribute('target'),'_blank');\n  await page.goto(root+'#/kb/add/knot');const previewForm=page.locator('.editor-form');await previewForm.getByRole('textbox',{name:'Name',exact:true}).fill('Hosted FISH103 Preview');await previewForm.locator('.markdown-editor').fill('Preview [Internal](kb://knot-palomar) and [External](https://example.com).');await previewForm.getByRole('button',{name:'Preview Markdown',exact:true}).click();await previewForm.locator('.markdown-preview').waitFor();assert.equal(await previewForm.locator('.markdown-preview').isVisible(),true);assert.equal(await previewForm.locator('.markdown-preview').getByRole('link',{name:'External'}).getAttribute('target'),'_blank');assert.notEqual(await previewForm.locator('.markdown-preview').getByRole('link',{name:'Internal'}).getAttribute('target'),'_blank');\n  await page.goto(root+'#/inventory/edit/daiwa-tatula-xt-rod');const caption=page.locator('.editor-form').getByLabel('Caption (optional)',{exact:true});await caption.click();await caption.pressSequentially('Hosted caption focus');assert.equal(await caption.evaluate(el=>document.activeElement===el),true);assert.equal(await caption.inputValue(),'Hosted caption focus');\n  report.fish103='Physical PWA source folders under pwa only, external-link new-tab behavior, internal-link same-tab behavior, stable Caption focus and new-KB Markdown preview passed';");

// Assert physical layout after git mv and active-source edits.
for(const dir of ['Gear','KB','Catches']){
 await fs.access(path.join(repo,'pwa',dir));
 await assert((await fs.stat(path.join(repo,'pwa',dir))).isDirectory(),`pwa/${dir} is not a directory`);
 try{await fs.access(path.join(repo,dir));throw new Error(`Root ${dir}/ still exists`);}catch(error){if(error.code!=='ENOENT')throw error;}
}
console.log(JSON.stringify({fish103:true,physicalSourceRoot:'pwa',logicalPathsPreserved:true},null,2));
