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


test('Mixed Notes cell: intro, unordered list and marked bold NOTE paragraph',()=>{
 const html=render('| Status | Meaning |\n|---|---|\n'+
  '| MOB tag | Man Overboard (MOB) tag:<br>- **Solid green:** Connected.<br>- **Flashing red:** Connection lost.<br>- **Solid red:** Not connected.<br>- **Flashing yellow:** Override on.<br>- **NOTE:** Example note. |');
 assert.match(html,/<td><p>Man Overboard \(MOB\) tag:<\/p><ul><li><strong>Solid green:<\/strong> Connected\.<\/li><li><strong>Flashing red:<\/strong> Connection lost\.<\/li><li><strong>Solid red:<\/strong> Not connected\.<\/li><li><strong>Flashing yellow:<\/strong> Override on\.<\/li><\/ul><p><strong>NOTE:<\/strong> Example note\.<\/p><\/td>/);
 assert.doesNotMatch(html,/&lt;\/?br/);
});

test('Mixed Notes cell: ordered list starting at 3, with intro and unmarked trailing paragraph',()=>{
 const html=render('| Name | Steps |\n|---|---|\n'+
  '| Example | Procedure:<br/>3. **Open** the menu<br />4. Choose a level</br>**NOTE:** Finish here. |');
 assert.match(html,/<p>Procedure:<\/p><ol start="3"><li><strong>Open<\/strong> the menu<\/li><li>Choose a level<\/li><\/ol><p><strong>NOTE:<\/strong> Finish here\.<\/p>/);
});

test('Mixed Notes cell: numbered NOTE marker is not a numbered step',()=>{
 const html=render('| Steps |\n|---|\n| 1. First<br>2. Second<br>3. **Note:** Separate paragraph. |');
 assert.match(html,/<ol><li>First<\/li><li>Second<\/li><\/ol><p><strong>Note:<\/strong> Separate paragraph\.<\/p>/);
});

test('Mixed lists support alternate bullet markers, ordered parenthesis and plain suffix',()=>{
 const html=render('| Steps |\n|---|\n| Intro<br>* First<br>+ Second<br>7) Third<br>8) Fourth<br>Done. |');
 assert.match(html,/<p>Intro<\/p><ul><li>First<\/li><li>Second<\/li><\/ul><ol start="7"><li>Third<\/li><li>Fourth<\/li><\/ol><p>Done\.<\/p>/);
});

test('Table lists preserve code span and escaped break literals and reference links',()=>{
 const html=render('| Steps |\n|---|\n| Intro<br>- `literal <br>` and \\<br><br>- [Manual][ref] |\n\n[ref]: https://example.org/manual');
 assert.match(html,/<ul><li><code>literal &lt;br&gt;<\/code> and &lt;br&gt;<\/li><li><a href="https:\/\/example.org\/manual"/);
});

test('Table list text still receives ordinary link/image validation and HTML escaping',()=>{
 const source='| Steps |\n|---|\n| Intro<br>- [Manual](https://example.org/manual)<br>- ![Diagram](../assets/diagram.png)<br>- <script>bad()</script><br>**NOTE:** End. |';
 const result=parseMarkdown(source,{
  owner:'Gear/Equipment/content/humminbird-fish-finder.md',
  maps:{gear:new Map(),kb:new Map(),catches:new Map()},
 });
 assert.deepEqual(result.references.map(x=>x.source),['https://example.org/manual','../assets/diagram.png']);
 assert.match(result.html,/&lt;script&gt;bad\(\)&lt;\/script&gt;/);
 assert.doesNotMatch(result.html,/<script>/);
 assert.throws(()=>render('| Steps |\n|---|\n| Intro<br>- ![Bad](https://example.org/image.png)<br>- Second |'),/Remote or unsafe Markdown image/);
});

test('Ordinary paragraphs and code-like breaks without a table list stay unchanged',()=>{
 assert.match(render('| Text |\n|---|\n| One<br>Two |'),/<td>One&lt;br&gt;Two<\/td>/);
 assert.match(render('Normal <br> - not a table list.'),/Normal &lt;br&gt; - not a table list/);
});
