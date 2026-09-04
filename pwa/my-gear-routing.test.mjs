import assert from 'node:assert/strict';
import fs from 'node:fs';

const gearApp = fs.readFileSync(new URL('./gear-app.js', import.meta.url), 'utf8');
const mediaUi = fs.readFileSync(new URL('./media-ui.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const mediaOverrides = JSON.parse(fs.readFileSync(new URL('./media-overrides.json', import.meta.url), 'utf8'));

assert.match(gearApp, /window\.addEventListener\('hashchange',[\s\S]*event\.stopImmediatePropagation\(\);[\s\S]*}, true\);/,
  'Structured My Gear must capture inventory hash changes before other route handlers.');
assert.match(gearApp, /data-gear-item=.*?navigate\(`#\/inventory\/item\//s,
  'Gear cards must navigate to structured item routes.');
assert.match(gearApp, /Browse your inventory of equipment, tackle, and bait/,
  'Home/My Gear copy must use the accepted inventory description.');
assert.match(gearApp, /const TYPE_LABELS = \{[\s\S]*'Trolling lures':'Trolling'[\s\S]*\};/,
  'Stored Trolling lures records must display with the user-facing Trolling label.');
assert.match(gearApp, /function itemCard\(item\) \{\s*const meta = displayGearType\(item\.type\);/,
  'Second-level My Gear cards must show the user-facing item type as subtext.');
assert.match(gearApp, /function searchableText\(item\)[\s\S]*displayGearType\(item\.type\)/,
  'My Gear Search must index the user-facing type label rather than stale display copy.');
assert.doesNotMatch(gearApp, /function itemCard\(item\)[\s\S]{0,260}gearSpecificationText\(item\)/,
  'Second-level My Gear cards must not include Specifications content.');
assert.match(gearApp, /const SEARCH_THRESHOLD = 10;/,
  'My Gear lists must use the durable 10-entry Search threshold.');
assert.match(gearApp, /const search = items\.length >= SEARCH_THRESHOLD;/,
  'My Gear Search must be based on list size rather than a hard-coded category.');
assert.doesNotMatch(gearApp, /const search = category === 'lures'/,
  'Lures must not be a special-case Search rule.');
assert.match(gearApp, /id:'gearRootSearch'[\s\S]*placeholder:'Search all gear…'/,
  'Root My Gear must provide a search across all owned Gear records.');
assert.match(gearApp, /gearCategoryGrid[\s\S]*gearRootSearchResults/,
  'Root My Gear search must replace the category grid with matching Gear cards while searching.');
assert.match(gearApp, /const TYPE_ORDER = \{\s*'rods-reels':\['Spinning','Baitcasting','Spincasting'\]\s*\};/,
  'Only Rods & Reels should retain second-level type grouping.');
assert.doesNotMatch(gearApp, /['"]line['"]\s*:\s*\[/,
  'Line must render as one flat list without Braided/Fluorocarbon section headings.');
assert.doesNotMatch(gearApp, /My Gear data|gearExportButton|gearImportButton/,
  'v2 import/export controls must not appear in the current My Gear UI.');
assert.match(gearApp, /const searchControl = search \? `<input class="search section-search"/,
  'Page header must render the compact Search control when requested.');
assert.match(gearApp, /section-title-actions">\$\{searchControl\}\$\{back \? `<button class="back-button"/,
  'Page header action area must render Search immediately before Back.');
assert.match(gearApp, /<h3>Notes<\/h3>/, 'Gear leaf narrative section must be titled Notes.');
assert.match(gearApp, /renderMarkdown\(notes\)/, 'Gear Notes must use the shared safe Markdown renderer.');
assert.match(gearApp, /const picture = record\.picture \|\| species\?\.picture \|\| null;/,
  'Gear catch cards must prefer an exact catch picture and otherwise use the Species picture.');
assert.doesNotMatch(gearApp, /How to use it|Knots & connections|resolveGuidance|sanitizeGuidanceHtml/,
  'Legacy guidance/profile rendering must be retired.');

assert.match(mediaUi, /findMediaByOwner\(gearItemId/, 'Gear media must resolve by stable Gear owner identity.');
assert.match(mediaUi, /owner\?\.gearItemId === gearItemId/, 'Gear media lookup must compare exact owner IDs.');
assert.match(mediaUi, /enhanceGearCardImages\(\)/, 'Gear media enhancer must add thumbnails to second-level Gear cards.');
assert.match(mediaUi, /className = 'gear-card-picture'/, 'Gear list thumbnails must use the dedicated thumbnail style.');
assert.match(mediaUi, /findAnyMediaByOwner\(gearItemId\)/,
  'Gear list thumbnails must resolve by exact stable owner ID, including Rod/Reel component media.');
assert.doesNotMatch(mediaUi, /item\.aliases|target\.includes\(a\)|findMedia\(text\)/,
  'Gear media must not infer identity from aliases or rendered text.');

for (const [mediaId, assetName] of [
  ['tsuridamashii-ball-bearing-swivels', 'tsuridamashii-ball-bearing-swivels.webp'],
  ['tsuridamashii-snap-swivels', 'tsuridamashii-snap-swivels.webp']
]) {
  const override = mediaOverrides[mediaId];
  assert.match(override.imageSource, /raw\.githubusercontent\.com\/ginosega\/fishing\/[a-f0-9]{40}\/pwa\/assets\/gear-source\//,
    `${mediaId} must build from the immutable repository copy supplied by the user.`);
  assert.equal(fs.existsSync(new URL(`./assets/gear-source/${assetName}`, import.meta.url)), true,
    `${mediaId} repository source image must exist.`);
}

const gearIndex = index.indexOf('./gear-app.js');
const kbIndex = index.indexOf('./kb-app.js');
assert.ok(gearIndex >= 0 && kbIndex > gearIndex,
  'Structured My Gear must load before the Knowledge Base route owner.');
assert.equal(index.includes('<script src="./app.js"'), false,
  'The retired legacy Markdown/planner app must not load.');
assert.equal(index.includes('legacy-app-loader.js'), false,
  'The retired legacy route loader must not load.');

console.log('My Gear routing/layout/media regression tests passed.');
