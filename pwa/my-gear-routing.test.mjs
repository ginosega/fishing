import assert from 'node:assert/strict';
import fs from 'node:fs';

const gearApp = fs.readFileSync(new URL('./gear-app.js', import.meta.url), 'utf8');
const authoringCommon = fs.readFileSync(new URL('./authoring-common.js', import.meta.url), 'utf8');
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
  'v2/v3 import/export controls must not appear in the current My Gear UI.');
assert.match(gearApp, /const searchControl = search \? `<input class="search section-search"/,
  'Page header must render the compact Search control when requested.');
assert.match(gearApp, /section-title-actions">\$\{searchControl\}\$\{back \? `<button class="back-button"/,
  'Page header action area must render Search immediately before Back.');

assert.match(gearApp, /accessories: \{ label:'Equipment', iconHtml:ACCESSORIES_ICON \}/,
  'My Gear must expose the Accessories category card.');
assert.match(gearApp, /stop-color="#76c8ef"[\s\S]*fill="#a9afb2"|fill="#a9afb2"[\s\S]*stop-color="#76c8ef"/,
  'Accessories card must use the approved light-blue kayak and gray paddle SVG treatment.');
assert.match(gearApp, /accessories:GEAR_ACCESSORY_TYPES/,
  'Accessories Type options must come from the fixed chat-managed taxonomy.');
assert.match(gearApp, /#\/inventory\/new/,
  'My Gear root must expose the New Gear Item route.');
assert.match(gearApp, /#\/inventory\/edit\//,
  'Gear detail pages must expose the Edit Gear Item route.');
assert.match(gearApp, /＋ Add Gear item/,
  'My Gear root must provide the requested Add Gear item link.');
assert.match(gearApp, />Edit Gear item<\/a>/,
  'Gear leaf pages must provide an Edit Gear item link.');
assert.match(gearApp, /name="gearPictureChoice"[\s\S]*value="yes"[\s\S]*value="no"/,
  'Picture authoring must start with required Yes/No choices.');
assert.match(gearApp, /name="gearNotesChoice"[\s\S]*value="yes"[\s\S]*value="no"/,
  'Notes authoring must start with required Yes/No choices.');
assert.match(gearApp, /id="previewNotes"[\s\S]*Preview/,
  'Notes Yes flow must provide Markdown Preview.');
assert.match(gearApp, /data-spec-label/, 'Specifications must provide a Label field.');
assert.match(gearApp, /data-spec-value/, 'Specifications must provide a Value field.');
assert.match(gearApp, /＋ Add specification/, 'Specifications must support repeatable rows.');
assert.doesNotMatch(gearApp, /data-link-kind|gearManufacturerUrl/, 'Links must not expose classification or a separate manufacturer URL.');
assert.match(gearApp, /Create a new Gear item entry for handoff\./);
assert.match(gearApp, /data-link-label/, 'Links must provide Link Text.');
assert.match(gearApp, /data-link-url/, 'Links must provide a URL field.');
assert.match(gearApp, /＋ Add link/, 'Links must support repeatable rows.');
assert.match(gearApp, /id="gearId"[\s\S]*readonly/,
  'Stable Gear ID must be shown read-only in the authoring form.');
assert.match(gearApp, /pwa\/assets\/gear-source\/\$\{filename\}/,
  'Prepared picture additions must identify the repository upload path.');
assert.match(gearApp, /pwa\/gear-content\/\$\{id\}\.md/,
  'Prepared Notes changes must identify the stable-ID Markdown path.');
assert.match(gearApp, /name="gearPictureAction" value="keep" checked/);
assert.match(gearApp, /name="gearPictureAction" value="replace"/);
assert.match(gearApp, /sourcePath/);
assert.match(gearApp, /fishing-companion-gear-change-v1/,
  'Add/Edit must generate a versioned handoff package.');
assert.match(gearApp, /renderPreparedHandoff\(document\.querySelector\('#gearPreparedPanel'\)/,
  'Gear must use the shared authoring handoff renderer.');
assert.match(authoringCommon, /navigator\.clipboard\.writeText\(payload\)/,
  'Prepared Gear changes must support one-click copying into chat.');
assert.doesNotMatch(gearApp, /repo\.(?:merge|replace)\(/,
  'The authoring UI must not create a divergent local Gear database; repository handoff remains authoritative.');
assert.match(authoringCommon, /disallowed executable markup/,
  'Plain structured fields must reject executable markup.');
assert.match(authoringCommon, /\['http:', 'https:'\]\.includes\(new URL\(value\)\.protocol\)/,
  'Entered URLs must be restricted to http(s).');

assert.match(gearApp, /\.\/gear-notes-assets\.json/,
  'My Gear must load the generated external Notes asset manifest.');
assert.match(gearApp, /`\.\/gear-content\/\$\{item\.id\}\.md`/,
  'Gear Notes must resolve deterministically from the stable Gear ID.');
assert.match(gearApp, /renderMarkdown\(result\.markdown, \{ contentPath:result\.contentPath \}\)/,
  'External Gear Notes must use the shared safe Markdown renderer with their source content path.');
assert.match(gearApp, /gearNoteAssets && !gearNoteAssets\.has\(contentPath\)/,
  'Gear pages must avoid requesting Notes files absent from the validated asset manifest.');
assert.doesNotMatch(gearApp, /item\.notes/,
  'My Gear runtime must not retain a fallback to retired inline JSON Notes.');
assert.equal(fs.existsSync(new URL('./gear-content/setup-spinning.md', import.meta.url)), true,
  'External Gear Notes should exist as ordinary Markdown files keyed by stable Gear ID.');

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

assert.match(index, /\.category-card-icon svg/,
  'App shell must include responsive styling for the Accessories kayak SVG.');
assert.match(index, /\.gear-editor/,
  'App shell must include Gear authoring form styles.');
const gearIndex = index.indexOf('./gear-app.js');
const kbIndex = index.indexOf('./kb-app.js');
assert.ok(gearIndex >= 0 && kbIndex > gearIndex,
  'Structured My Gear must load before the Knowledge Base route owner.');
assert.equal(index.includes('<script src="./app.js"'), false,
  'The retired legacy Markdown/planner app must not load.');
assert.equal(index.includes('legacy-app-loader.js'), false,
  'The retired legacy route loader must not load.');

console.log('My Gear routing/layout/media/external-Notes/add-edit authoring regression tests passed.');
