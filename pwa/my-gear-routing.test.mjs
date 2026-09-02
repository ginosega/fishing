import assert from 'node:assert/strict';
import fs from 'node:fs';

const gearApp = fs.readFileSync(new URL('./gear-app.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

assert.match(gearApp, /window\.addEventListener\('hashchange',[\s\S]*event\.stopImmediatePropagation\(\);[\s\S]*}, true\);/,
  'Structured My Gear must capture inventory hash changes before the legacy router.');
assert.match(gearApp, /data-gear-item=.*?navigate\(`#\/inventory\/item\//s,
  'Gear cards must navigate to structured item routes.');
assert.match(gearApp, /Browse your inventory of equipment, tackle, and bait/,
  'Home/My Gear copy must use the accepted inventory description.');
assert.doesNotMatch(gearApp, /My Gear data|gearExportButton|gearImportButton/,
  'v2 import/export controls must not appear in the current My Gear UI.');
assert.match(gearApp, /class=\"section-title\"><div><h2>[\s\S]*?<\/div>\$\{back \? `<button class=\"back-button\"/,
  'Page header must keep title/subtitle on the left and Back on the right.');

const gearIndex = index.indexOf('./gear-app.js');
const loaderIndex = index.indexOf('./legacy-app-loader.js');
assert.ok(gearIndex >= 0 && loaderIndex > gearIndex,
  'Structured My Gear must load before the legacy app loader.');
assert.equal(index.includes('<script src="./app.js"'), false,
  'Legacy app must be loaded through the route-isolating loader, not directly.');

console.log('My Gear routing/layout regression tests passed.');
