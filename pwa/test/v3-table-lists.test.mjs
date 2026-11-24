import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMarkdown} from '../src/markdown.mjs';

const render=markdown=>parseMarkdown(markdown,{
 owner:'Gear/Equipment/content/humminbird-fish-finder.md',
 maps:{gear:new Map(),kb:new Map(),catches:new Map()},
}).html;

test('L01 Notes table cells render br-delimited hyphens as unordered lists',()=>{
 const html=render('| Button | Description |\n|---|---|\n'+
  '| Power | - Press to turn on<br>- Hold to turn off</br>- Tap for options |');
 assert.match(html,/<td[^>]*>[\s\S]*?<ul>[\s\S]*?<li>Press to turn on<\/li>[\s\S]*?<li>Hold to turn off<\/li>[\s\S]*?<li>Tap for options<\/li>[\s\S]*?<\/ul>[\s\S]*?<\/td>/);
 assert.doesNotMatch(html,/&lt;\/?br/);
});
test('L01 Notes table cells render numeric breaks as ordered lists',()=>{
 const html=render('| Button | Steps |\n|---|---|\n'+
  '| Zoom | 1. Open map<br/>2. Choose level<br />3. Confirm |');
 assert.match(html,/<ol><li>Open map<\/li><li>Choose level<\/li><li>Confirm<\/li><\/ol>/);
});
test('L01 Notes table lists keep link resolution and never enable arbitrary HTML',()=>{
 const html=render('| Button | Steps |\n|---|---|\n'+
  '| Settings | - [Manual](https://example.org/manual)<br>- <script>alert(1)</script> |');
 assert.match(html,/<ul>/);
 assert.match(html,/href="https:\/\/example.org\/manual"/);
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/&lt;script&gt;/);
 const other=render('Paragraph <br> - not a table list.');
 assert.doesNotMatch(other,/<ul>/);
});
