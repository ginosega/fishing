import assert from 'node:assert/strict';
import fs from 'node:fs';

const gearApp = fs.readFileSync(new URL('./gear-app.js', import.meta.url), 'utf8');
const mediaUi = fs.readFileSync(new URL('./media-ui.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

assert.match(gearApp, /window\.addEventListener\('hashchange',[\s\S]*event\.stopImmediatePropagation\(\);[\s\S]*}, true\);/,
  'Structured My Gear must capture inventory hash changes before other route handlers.');
assert.match(gearApp, /data-gear-item=.*?navigate\(`#\/inventory\/item\//s,
  'Gear cards must navigate to structured item routes.');
assert.match(gearApp, /Browse your inventory of equipment, tackle, and bait/,
  'Home/My Gear copy must use the accepted inventory description.');
assert.match(gearApp, /function itemCard\(item\) \{\s*const meta = item\.type \|\| '';/,
  'Second-level My Gear cards must show only the item type as subtext.');
assert.doesNotMatch(gearApp, /function itemCard\(item\)[\s\S]{0,260}gearSpecificationText\(item\)/,
  'Second-level My Gear cards must not include Specifications content.');
assert.doesNotMatch(gearApp, /My Gear data|gearExportButton|gearImportButton/,
  'v2 import/export controls must not appear in the current My Gear UI.');
assert.match(gearApp, /class="section-title"><div><h2>[\s\S]*?<\/div>\$\{back \? `<button class="back-button"/,
  'Page header must keep title/subtitle on the left and Back on the right.');
assert.match(gearApp, /<h3>Notes<\/h3>/, 'Gear leaf narrative section must be titled Notes.');
assert.match(gearApp, /renderMarkdown\(notes\)/, 'Gear Notes must use the shared safe Markdown renderer.');
assert.doesNotMatch(gearApp, /How to use it|Knots & connections|resolveGuidance|sanitizeGuidanceHtml/,
  'Legacy guidance/profile rendering must be retired.');

assert.match(mediaUi, /findMediaByOwner\(gearItemId/, 'Gear media must resolve by stable Gear owner identity.');
assert.match(mediaUi, /owner\?\.gearItemId === gearItemId/, 'Gear media lookup must compare exact owner IDs.');
assert.doesNotMatch(mediaUi, /item\.aliases|target\.includes\(a\)|findMedia\(text\)/,
  'Gear media must not infer identity from aliases or rendered text.');

const gearIndex = index.indexOf('./gear-app.js');
const kbIndex = index.indexOf('./kb-app.js');
assert.ok(gearIndex >= 0 && kbIndex > gearIndex,
  'Structured My Gear must load before the Knowledge Base route owner.');
assert.equal(index.includes('<script src="./app.js"'), false,
  'The retired legacy Markdown/planner app must not load.');
assert.equal(index.includes('legacy-app-loader.js'), false,
  'The retired legacy route loader must not load.');

console.log('My Gear routing/layout/media regression tests passed.');
