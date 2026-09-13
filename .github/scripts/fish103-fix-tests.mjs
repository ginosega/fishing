import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=file=>fs.readFile(path.join(repo,file),'utf8');
const write=(file,text)=>fs.writeFile(path.join(repo,file),text);
const replace=async(file,from,to)=>{let text=await read(file);if(!text.includes(from))throw new Error(`${file}: expected fragment missing`);text=text.replace(from,to);await write(file,text);};

await replace('pwa/test/core.test.mjs',
`test('Markdown external links open a new tab while internal links remain same-tab',()=>{const owner=data.kb.entities[0].content;const result=parseMarkdown('[External](https://example.com) [Internal](gear://daiwa-tatula-xt-rod)',{owner,maps,pathRoutes:routes});assert.match(result.html,/href="https://example\\.com" target="_blank" rel="noopener noreferrer"/);assert.match(result.html,/href="#\\/inventory\\/item\\/daiwa-tatula-xt-rod"/);assert.doesNotMatch(result.html,/href="#\\/inventory\\/item\\/daiwa-tatula-xt-rod"[^>]*target="_blank"/);});`,
`test('Markdown external links open a new tab while internal links remain same-tab',()=>{const owner=data.kb.entities[0].content;const result=parseMarkdown('[External](https://example.com) [Internal](gear://daiwa-tatula-xt-rod)',{owner,maps,pathRoutes:routes});assert(result.html.includes('href="https://example.com" target="_blank" rel="noopener noreferrer"'));assert(result.html.includes('href="#/inventory/item/daiwa-tatula-xt-rod"'));assert(!result.html.includes('href="#/inventory/item/daiwa-tatula-xt-rod" target="_blank"'));});`);

await replace('pwa/test/gear-layout.test.mjs',
"const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');",
"const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),root=path.join(repo,'pwa');");
await replace('pwa/test/kb-layout.test.mjs',
"const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');",
"const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),root=path.join(repo,'pwa');");

// Keep each new browser regression in its own clean page/context state. The previous
// combined fixture deliberately dirtied two editors before navigating to Add KB,
// which exercised the navigation-discard guard rather than the feature under test.
let browser=await read('pwa/test/browser.spec.mjs');
const marker="test('FISH103 external links, caption focus and new-KB Markdown preview regressions'";
const start=browser.indexOf(marker),endStart=browser.indexOf('\n});\n',start);
if(start<0||endStart<0)throw new Error('FISH103 combined browser regression fixture missing');
const replacement=`test('FISH103 external and internal link targets',async({page})=>{\n await openReady(page);\n await route(page,'#/inventory/item/daiwa-tatula-xt-rod','Daiwa Tatula');\n const webLink=page.locator('.links-list a').first();await expect(webLink).toHaveAttribute('target','_blank');await expect(webLink).toHaveAttribute('rel','noopener noreferrer');\n const internalGear=page.locator('.markdown-body a').filter({hasText:'Sufix 832'});await expect(internalGear).not.toHaveAttribute('target','_blank');\n await route(page,'#/kb/knot-palomar','Palomar Knot');const markdownWeb=page.getByRole('link',{name:'Palomar Knot',exact:true});await expect(markdownWeb).toHaveAttribute('target','_blank');await expect(markdownWeb).toHaveAttribute('rel','noopener noreferrer');\n});\n\ntest('FISH103 Gear caption typing retains focus',async({page})=>{\n await openReady(page);await route(page,'#/inventory/edit/daiwa-tatula-xt-rod','Edit');const form=page.locator('.editor-form'),caption=form.getByLabel('Caption (optional)',{exact:true});await caption.click();await caption.pressSequentially('Gear caption focus');expect(await caption.evaluate(el=>document.activeElement===el)).toBeTruthy();await expect(caption).toHaveValue('Gear caption focus');await expect(form.locator('.picture figcaption')).toHaveText('Gear caption focus');\n});\n\ntest('FISH103 KB caption typing retains focus',async({page})=>{\n await openReady(page);await route(page,'#/kb/edit/knot-palomar','Edit');const form=page.locator('.editor-form'),caption=form.getByLabel('Caption (optional)',{exact:true});await caption.fill('');await caption.click();await caption.pressSequentially('KB caption focus');expect(await caption.evaluate(el=>document.activeElement===el)).toBeTruthy();await expect(caption).toHaveValue('KB caption focus');await expect(form.locator('.picture figcaption')).toHaveText('KB caption focus');\n});\n\ntest('FISH103 new KB Markdown preview validates provisional content path',async({page})=>{\n await openReady(page);await route(page,'#/kb/add/knot','Add Entry');const form=page.locator('.editor-form');await form.getByRole('textbox',{name:'Name',exact:true}).fill('FISH103 Preview Test');await form.locator('.markdown-editor').fill('Preview body with [Internal](kb://knot-palomar) and [External](https://example.com).');await form.getByRole('button',{name:'Preview Markdown',exact:true}).click();const preview=form.locator('.markdown-preview');await expect(preview).toBeVisible();await expect(preview).toContainText('Preview body');expect(await form.textContent()).not.toContain('kb schema:');await expect(preview.getByRole('link',{name:'External',exact:true})).toHaveAttribute('target','_blank');await expect(preview.getByRole('link',{name:'Internal',exact:true})).not.toHaveAttribute('target','_blank');\n});`;
browser=browser.slice(0,start)+replacement+browser.slice(endStart+5);
await write('pwa/test/browser.spec.mjs',browser);

// Hosted acceptance also moves between deliberately dirty authoring forms. Accept
// the expected discard confirmation so verification measures FISH103 behavior.
await replace('pwa/tools/verify-hosted.mjs',
"  await page.goto(root+'#/inventory/edit/daiwa-tatula-xt-rod');const caption=page.locator('.editor-form').getByLabel('Caption (optional)',{exact:true});",
"  page.once('dialog',dialog=>dialog.accept());await page.goto(root+'#/inventory/edit/daiwa-tatula-xt-rod');const caption=page.locator('.editor-form').getByLabel('Caption (optional)',{exact:true});");
console.log('FISH103 regression fixtures repaired');
