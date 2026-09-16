import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const css=await fs.readFile(path.resolve(here,'../src/styles.css'),'utf8');

test('FISH111 aligns shared header and long-form content edges',()=>{
 assert.match(css,/\/\* FISH111: align the shared header and long-form content to the page content edges\. \*\//);
 assert.match(css,/\.site-header\{padding-inline:0\}\.header-inner\{padding-inline:24px\}\.section,\.markdown-body\{width:100%;max-width:none\}/);
 assert.match(css,/@media\(max-width:650px\)\{\.site-header\{padding-inline:0\}\.header-inner\{padding-inline:16px\}\}/);
});
