import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const notes=readFileSync(new URL('../src/notes-markdown-editor.mjs',import.meta.url),'utf8');
const offline=readFileSync(new URL('../src/offline.mjs',import.meta.url),'utf8');

test('D5-UX01 Catch Add is a separate left-aligned owner-only row',()=>{
 assert.match(ui,/if\(v3Mode&&canAuthor\(\)\)page\.append\(el\('div',\{class:'catch-add-row'\},anchor\('Add Catch'/);
 assert.match(css,/\.catch-add-row\{display:flex;justify-content:flex-start/);
 assert.doesNotMatch(ui,/page\.querySelector\('\.page-actions'\)\.prepend\(anchor\('Add Catch'/);
});

test('D5-UX02 Offline Library messages stack and wrap only in the V3 dialog',()=>{
 assert.match(ui,/offlineHost\.replaceChildren\(text\('span',label\),\.\.\.\(state\.message/);
 assert.match(css,/\.v3-connection-dialog \.offline-state\{[^}]*flex-direction:column;align-items:stretch;gap:6px/s);
 assert.match(css,/\.v3-connection-dialog \.offline-state>span\{[^}]*overflow-wrap:anywhere/s);
 assert.match(css,/\.offline-state\{font-size:[^}]*display:flex;gap:6px;flex-wrap:wrap\}/);
});

test('D5-UX03 Preview/Edit labels and keyboard-accessible expand/restore',()=>{
 assert.match(notes,/button\('Preview',/);
 assert.match(notes,/previewButton\.textContent='Edit'/);
 assert.match(notes,/previewButton\.textContent='Preview'/);
 assert.match(notes,/setNotesToolbarIcon\(expandButton,'expand','Expand editor'\)/);
 assert.match(notes,/expanded\?'restore':'expand'/);
 assert.match(notes,/expanded\?'Exit full-page editor':'Expand editor'/);
 assert.match(notes,/expandButton\.setAttribute\('aria-expanded',String\(expanded\)\)/);
 assert.match(notes,/if\(event\.key==='Escape'&&expanded\)/);
});

test('D5-UX04 Work Offline verification uses exact copy, preserves mode gates',()=>{
 assert.match(offline,/'Verifying the offline catalog\.'/);
 assert.doesNotMatch(offline,/Verifying every file/);
 assert.match(offline,/modeCommand\('V3_SET_MODE',next\)/);
 assert.match(offline,/180000:12000/);
});

test('D5-UX05 Insert Link/Image icons keep accessible names and actions',()=>{
 assert.match(notes,/setNotesToolbarIcon\(linkButton,'link','Insert Link'\)/);
 assert.match(notes,/setNotesToolbarIcon\(imageButton,'image','Insert Image'\)/);
 assert.match(notes,/document\.createElementNS\(ns,'svg'\)/);
 assert.match(notes,/'aria-hidden':'true',focusable:'false'/);
 assert.match(notes,/control\.setAttribute\('aria-label',label\)/);
 assert.match(notes,/control\.setAttribute\('title',label\)/);
 assert.match(notes,/control\.replaceChildren\(notesToolbarIcon\(kind\)\)/);
 assert.match(css,/\.notes-toolbar \.notes-icon-button\{[^}]*min-width:42px;min-height:42px/s);
 assert.match(notes,/const target=linkSiteRadio\.checked\?selectedLinkTarget\(\)\?\.uri:linkUrl\.value/);
 assert.match(notes,/const file=choose\.files\?\.\[0\]/);
});
