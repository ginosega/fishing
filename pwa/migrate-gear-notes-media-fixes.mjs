import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const edit = async (file, transform) => fs.writeFile(file,transform(await fs.readFile(file,'utf8')));
const replace = (source,before,after) => {assert.ok(source.includes(before),`Missing expected source: ${before.slice(0,100)}`);return source.replace(before,after);};
await edit('pwa/image-validation.mjs',source => replace(source,
  '  const bytes = await fs.readFile(filename);',
  "  let bytes;\n  try { bytes = await fs.readFile(filename); }\n  catch (error) { if (error.code === 'ENOENT') throw new Error(`Missing required image asset ${filename}.`); throw error; }"));
await edit('pwa/apply-authored-notes.mjs',source => {
  source = replace(source,
    "      if (/^https?:\\/\\//i.test(imageTarget)) continue;\n      const imagePath = normalizeBuildPath",
    "      if (/^https?:\\/\\//i.test(imageTarget)) continue;\n      if (/^(?:\\/|\\\\|[a-z][a-z0-9+.-]*:)/i.test(imageTarget)) throw new Error(`Unsafe Notes image target: ${imageTarget}`);\n      const imagePath = normalizeBuildPath");
  return source;
});
await edit('pwa/gear-media-policy.test.mjs',source => {
  source=replace(source,"  failed('Missing required Gear Notes asset');","  failed('Missing required image asset');");
  source=replace(source,"  await write('gear-content/test-kayak.md','![Missing](test-kayak-missing.png)\\n');",
    "  await write('gear-content/test-kayak.md','![Absolute](/test-kayak-bow.png)\\n');\n  failed('Unsafe Notes image target');\n  await write('gear-content/test-kayak.md','![Missing](test-kayak-missing.png)\\n');");
  return source;
});
console.log('Notes image path and diagnostic hardening applied.');
