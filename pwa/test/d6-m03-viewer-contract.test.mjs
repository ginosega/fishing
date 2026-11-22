import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const viewer=readFileSync(new URL('../src/viewer.mjs',import.meta.url),'utf8');
const notes=readFileSync(new URL('../src/notes-markdown-editor.mjs',import.meta.url),'utf8');
const icons=readFileSync(new URL('../src/notes-toolbar-icons.mjs',import.meta.url),'utf8');
test('M03 fullscreen uses exactly Notes editor expand and restore icons',()=>{
 assert.match(notes,/import \{setNotesToolbarIcon\}/);
 assert.match(viewer,/import \{setNotesToolbarIcon\}/);
 assert.match(icons,/expand:'M8 3H3v5/);
 assert.match(icons,/restore:'M3 9h6V3/);
 assert.match(viewer,/requestFullscreen\(\)/);
 assert.match(viewer,/document\.exitFullscreen\(\)/);
 assert.match(viewer,/fullscreenchange/);
 assert.match(viewer,/fullscreenSurface\(dialog,view,controls,stop\)/);
 assert.match(viewer,/fullscreenSurface\(dialog,view,controls\)/);
});
