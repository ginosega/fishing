import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

test('O02-BUILD01 private O02 application builds only behind a source identity gate',async()=>{
 const entry=fileURLToPath(new URL('../src/entry.mjs',import.meta.url));
 const defs={
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
 };
 const bundle=async(enabled)=>build({
  entryPoints:[entry],bundle:true,write:false,
  format:'iife',platform:'browser',target:'es2022',minify:true,
  define:{...defs,'__FISHING_D6_O02_OFFLINE_CONTENT__':
   enabled?'true':'false'},
 });
 const disabled=await bundle(false);
 const enabled=await bundle(true);
 const content=output=>output.outputFiles[0].text;
 assert.doesNotMatch(content(disabled),
  /api\/v3\/content\/offline-snapshot/);
 assert.match(content(enabled),
  /api\/v3\/content\/offline-snapshot/);
 const builder=readFileSync(new URL('../tools/build.mjs',import.meta.url),'utf8');
 assert.match(builder,/--d6-o02-offline-content/);
 assert.match(builder,/d6OfflineContentPreparation/);
 assert.match(builder,/__FISHING_D6_O02_OFFLINE_CONTENT__/);
 const worker=readFileSync(new URL(
  '../wrangler.direct-gear-private.jsonc',import.meta.url),'utf8');
 assert.doesNotMatch(worker,/D6_O02_OFFLINE_SNAPSHOT_ENABLED/,
  'existing owner Worker deployment does not enable the new endpoint');
});
