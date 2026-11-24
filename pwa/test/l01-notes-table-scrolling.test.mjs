import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseMarkdown} from '../src/markdown.mjs';

const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const markdown=source=>parseMarkdown(source,{
 owner:'KB/Gear-Guides/content/swimbait.md',
 maps:{gear:new Map(),kb:new Map(),catches:new Map()},
}).html;
const wide=['| Type of Swimbait | Description | Typical Size | Hook Setup | Best Use | Example Products |',
 '|---|---|---|---|---|---|',
 '| Soft Plastic Swimbait | Made of soft rubber with a paddle-tail or twin-tail. | 3–7 inches | Rigged on jighead with skirt or belly hook | Versatile lakes, rivers and ponds | Swim Jig |'].join('\n');

test('L01-TABLE01 six-column Notes tables render inside independent accessible scroll region',()=>{
 const html=markdown('Before\n\n'+wide+'\n\nAfter');
 assert.match(html,/<div class="markdown-table-scroll" role="region" aria-label="Notes table, scroll horizontally" tabindex="0">\s*<table>/);
 assert.match(html,/<\/table>\s*<\/div>/);
 assert.match(html,/Before/);
 assert.match(html,/After/);
 assert.match(html,/<th>Type of Swimbait<\/th>/);
 assert.match(html,/<td>Made of soft rubber with a paddle-tail or twin-tail\.<\/td>/);
 assert.equal((html.match(/class="markdown-table-scroll"/g)||[]).length,1);
});

test('L01-TABLE02 multiple tables scroll separately; regular Markdown unchanged',()=>{
 const two=markdown(wide+'\n\nText between\n\n'+wide);
 assert.equal((two.match(/class="markdown-table-scroll"/g)||[]).length,2);
 assert.equal((two.match(/<\/table>\s*<\/div>/g)||[]).length,2);
 assert.doesNotMatch(markdown('Just **regular** text and a list:\n\n- One\n- Two'),/markdown-table-scroll/);
});

test('L01-TABLE03 table styling keeps columns readable without expanding the page',()=>{
 assert.match(css,/\.markdown-table-scroll\s*\{[^}]*width:100%;max-width:100%;min-width:0;/);
 assert.match(css,/\.markdown-table-scroll\s*\{[^}]*overflow-x:auto;overflow-y:hidden;/);
 assert.match(css,/\.markdown-body \.markdown-table-scroll>table\s*\{[^}]*display:table;width:max-content;min-width:100%;max-width:none;/);
 assert.match(css,/\.markdown-body \.markdown-table-scroll th,[\s\S]*?\.markdown-body \.markdown-table-scroll td\s*\{[^}]*min-width:10rem;max-width:24rem;/);
 assert.match(css,/\.markdown-body \.markdown-table-scroll td\s*\{[^}]*overflow-wrap:break-word;word-break:normal;/);
 assert.match(css,/\.markdown-table-scroll:focus-visible/);
});

test('L01-TABLE04 horizontal scroll does not interfere with inline lists in table cells',()=>{
 const html=markdown('| Name | Steps |\n|---|---|\n'+
  '| Knots | 1. First<br>2. Second<br>3. Third |');
 assert.match(html,/<div class="markdown-table-scroll"[^>]*><table>/);
 assert.match(html,/<ol><li>First<\/li><li>Second<\/li><li>Third<\/li><\/ol>/);
});
