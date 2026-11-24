import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('O03-BUILD01 source build requires a distinct private O03 flag on app and SW',async()=>{
 const source=read('../tools/build.mjs');
 const entry=read('../src/entry.mjs');
 const worker=read('../src/sw.mjs');
 assert.match(source,/--d6-o03-offline-reading/);
 assert.match(source,/d6OfflineContentReading/);
 assert.match(source,/__FISHING_D6_O03_OFFLINE_READING__/);
 assert.match(source,/if\(d6OfflineContentReading&&!d6OfflineContentPreparation\)/);
 assert.match(entry,/privateOfflineContentRead&&/);
 assert.match(entry,/settings\.manifest\?\.d6OfflineContentReading!==true/);
 assert.match(entry,/settings\.release\?\.d6OfflineContentReading!==true/);
 assert.match(worker,/o03OfflineContent&&/);
 assert.match(worker,/readD6OfflineImage/);
 const base={
  'process.env.NODE_ENV':'"production"',
  '__FISHING_D6_PUBLIC_READER__':'true',
  '__FISHING_D6_STATIC_STAGING__':'false',
  '__FISHING_D6_OWNER_CONNECTION__':'true',
  '__FISHING_D6_WP2_STAGING__':'true',
  '__FISHING_D6_OWNER_EDITOR_PREVIEW__':'true',
  '__FISHING_D6_DIRECT_GEAR_SAVE__':'true',
  '__FISHING_D6_DIRECT_KB_SAVE__':'true',
  '__FISHING_D6_DIRECT_CATCH_SAVE__':'true',
  '__FISHING_D6_OWNER_MEDIA_UPLOAD__':'true',
  '__FISHING_D6_R2_CARD_THUMBNAILS__':'true',
  '__FISHING_D6_O02_OFFLINE_CONTENT__':'true',
 };
 const entryPath=fileURLToPath(new URL('../src/entry.mjs',import.meta.url));
 const swPath=fileURLToPath(new URL('../src/sw.mjs',import.meta.url));
 const bundle=(file,enabled)=>build({
  entryPoints:[file],bundle:true,write:false,
  format:'iife',platform:'browser',target:'es2022',minify:true,
  define:{...base,
   '__FISHING_V3_READING_MODE__':'true',
   '__FISHING_D6_O03_OFFLINE_READING__':enabled?'true':'false'},
 });
 const [appBefore,appAfter,swBefore,swAfter]=await Promise.all([
  bundle(entryPath,false),bundle(entryPath,true),
  bundle(swPath,false),bundle(swPath,true),
 ]);
 assert.notEqual(appBefore.outputFiles[0].text,appAfter.outputFiles[0].text);
 assert.notEqual(swBefore.outputFiles[0].text,swAfter.outputFiles[0].text);
});
test('O03-BUILD02 UI keeps cached Markdown local and no D1 catalog mixing',()=>{
 const app=read('../src/app.mjs'),ui=read('../src/ui.mjs');
 assert.match(app,/selected\.source==='v3-content'/);
 assert.match(app,/offlineMarkdown:offlineContent\?\.markdown/);
 assert.match(ui,/ctx\.offlineMarkdown\.get\(pathValue\)/);
 assert.match(ui,/ctx\.v3\?\.contentSource==='v3-content'/);
 assert.match(ui,/verifyContent:readerOnly/);
 assert.match(ui,/needsContentModeReload\(\{source:ctx\.v3\?\.contentSource,mode,/);
 const transition=read('../src/d6-content-mode-reload.mjs');
 assert.match(transition,/\['release','v3-content'\]\.includes\(source\)&&mode==='Automatic'/);
});
