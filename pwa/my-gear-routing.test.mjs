import assert from 'node:assert/strict';
import fs from 'node:fs';

const gearApp = fs.readFileSync(new URL('./gear-app.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

assert.match(gearApp, /window\.addEventListener\('hashchange',[\s\S]*event\.stopImmediatePropagation\(\);[\s\S]*}, true\);/,
  'Structured My Gear must capture inventory hash changes before other route handlers.');
assert.match(gearApp, /data-gear-item=.*?navigate\(`#\/inventory\/item\//s,
  'Gear cards must navigate to structured item routes.');
assert.match(gearApp, /Browse your inventory of equipment, tackle, and bait/,
  'Home/My Gear copy must use the accepted inventory description.');
assert.doesNotMatch(gearApp, /My Gear data|gearExportButton|gearImportButton/,
  'v2 import/export controls must not appear in the current My Gear UI.');
assert.match(gearApp, /class=\"section-title\"><div><h2>[\s\S]*?<\/div>\$\{back \? `<button class=\"back-button\"/,
  'Page header must keep title/subtitle on the left and Back on the right.');

const gearIndex = index.indexOf('./gear-app.js');
const kbIndex = index.indexOf('./kb-app.js');
assert.ok(gearIndex >= 0 && kbIndex > gearIndex,
  'Structured My Gear must load before the Knowledge Base route owner.');
assert.equal(index.includes('<script src="./app.js"'), false,
  'The retired legacy Markdown/planner app must not load.');
assert.equal(index.includes('legacy-app-loader.js'), false,
  'The retired legacy route loader must not load.');

console.log('My Gear routing/layout regression tests passed.');
