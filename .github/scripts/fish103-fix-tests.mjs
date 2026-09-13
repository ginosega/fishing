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
console.log('FISH103 regression fixtures repaired');
