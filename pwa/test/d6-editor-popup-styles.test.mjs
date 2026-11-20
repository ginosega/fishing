import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');

test('V3-UX-POP01 owner Notes and Catch panels have opaque themed surfaces',()=>{
 const css=read('styles.css');
 assert.match(css,/\.catch-lure-panel,\.notes-link-panel,\.notes-image-panel/);
 assert.match(css,/background:var\(--surface\);color:var\(--ink\)/);
 assert.match(css,/border:1px solid var\(--border\);border-radius:14px/);
 assert.match(css,/position:relative;isolation:isolate/);
 assert.match(css,/@media\(max-width:650px\)[\s\S]*\.catch-lure-panel/);
});
test('V3-UX-POP02 picker radio buttons align with their source labels',()=>{
 const css=read('styles.css');
 assert.match(css,/\.notes-link-kind,\.catch-lure-kind\)>label/);
 assert.match(css,/display:inline-flex;align-items:center;gap:9px/);
 assert.match(css,/\.notes-link-kind,\.catch-lure-kind\) input\[type="radio"\]/);
 assert.match(css,/width:18px;min-width:18px;max-width:18px;height:18px/);
});
test('V3-UX-POP03 lure Choose has spacing and edit actions have consistent layout',()=>{
 const css=read('styles.css');
 assert.match(css,/\.catch-lure-summary\{display:flex;flex-direction:column;align-items:flex-start;gap:10px/);
 assert.match(css,/\.catch-lure-summary>\.btn\{align-self:flex-start;margin-top:2px/);
 assert.match(css,/\.notes-image-actions\{\s*display:flex/);
});
test('V3-UX-POP04 Catch exposes unsupported media honestly, never activates upload',()=>{
 const catchSource=read('d6-direct-catch-editor.mjs');
 const approved=read('notes-markdown-editor.mjs');
 assert.match(catchSource,/allowUpload:false/);
 assert.match(catchSource,/const unavailable=insertImage\.cloneNode\(true\)/);
 assert.match(catchSource,/unavailable\.hidden=false;unavailable\.disabled=true/);
 assert.match(catchSource,/New Catch image uploads are not yet available/);
 assert.match(approved,/imageButton\.hidden=!allowUpload/);
 assert.match(approved,/imageButton\.disabled=showPreview/);
});
