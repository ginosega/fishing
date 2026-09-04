import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderMarkdown, renderCatchCard } from './markdown-render.js';

const kbApp = fs.readFileSync(new URL('./kb-app.js', import.meta.url), 'utf8');
const gearApp = fs.readFileSync(new URL('./gear-app.js', import.meta.url), 'utf8');
const markdownRender = fs.readFileSync(new URL('./markdown-render.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

for (const type of ['location', 'species', 'equipment', 'technique', 'knot']) assert.ok(kbApp.includes(`${type}:`), `Knowledge Base app must expose the ${type} type.`);
for (const route of ['#/kb/catches', '#/kb/catch/', '#/kb/entity/']) assert.ok(kbApp.includes(route), `Knowledge Base app must expose ${route}.`);
assert.match(kbApp, /`#\/kb\/\$\{plural\(type\)\}`/, 'Entity categories must route from the unified type discriminator.');
assert.match(kbApp, /equipment: \{ label:'Equipment', icon:'🧰', description:'Rigs, presentations, and gear guides\.' \}/,
  'Equipment card must use the approved description.');
assert.match(kbApp, /technique: \{ label:'Techniques', icon:'🧭', description:'Strategy, conditions, and species reference\.' \}/,
  'Techniques card must use the approved description.');
assert.match(kbApp, /const SEARCH_THRESHOLD = 10;/, 'Browsable KB lists must use the durable 10-entry Search threshold.');
assert.match(kbApp, /const searchable = entities\.length >= SEARCH_THRESHOLD;/,
  'KB Search must be based on list size rather than special-casing a type.');
assert.doesNotMatch(kbApp, /type === 'technique'/, 'Techniques must not receive a special-case Search control.');
assert.match(kbApp, /id:'kbRootSearch'[\s\S]*placeholder:'Search all knowledge…'/,
  'Root Knowledge Base must provide a search across all KB entities.');
assert.match(kbApp, /kbCategoryGrid[\s\S]*kbRootSearchResults/,
  'Root Knowledge Base search must replace the category grid with matching entity cards while searching.');
assert.match(kbApp, /function pageHeader\(title, subtitle, back, search = null\)|function pageHeader\(title,subtitle,back,search = null\)/,
  'Knowledge Base page header must accept an optional Search control.');
assert.match(kbApp, /const searchControl = search \? `<input class="search section-search"/,
  'Knowledge Base page header must render the compact Search control when requested.');
assert.match(kbApp, /section-title-actions">\$\{searchControl\}\$\{back \? `<button class="back-button"/,
  'Knowledge Base header action area must render Search immediately before Back.');
assert.match(kbApp, /function renderCatchList\(\)[\s\S]*?bindRoutes\(\);\s*\}/,
  'Catch Log must bind its Back button after rendering.');
assert.match(kbApp, /const catchPicture = record\.picture \|\| species\?\.picture \|\| null;/,
  'Catch leaf pages must prefer an exact catch picture and fall back to the species picture.');
assert.match(kbApp, /const picture = record\.picture \|\| species\?\.picture \|\| null;/,
  'Catch cards must prefer an exact catch picture and fall back to the species picture.');
assert.match(kbApp, /picture\.gearItemId[\s\S]*?#\/inventory\/item\//,
  'Owned-item KB pictures must caption-link to the exact Gear leaf page.');
assert.match(kbApp, /My catch history/, 'Location and Species KB pages must retain catch-history backlinks.');
assert.match(kbApp, /function catchField\(type\) \{ return \(\{ location:'locationId', species:'speciesId' \}\)\[type\] \|\| ''; \}/, 'Catch-history backlinks must be limited to Location and Species KB pages.');
assert.doesNotMatch(kbApp, /technique:'techniqueId'|equipment:'[^']*Id'|knot:'[^']*Id'/, 'Equipment, Technique, and Knot KB pages must not render catch-history backlinks.');
assert.match(markdownRender, /export function renderCatchCard/, 'Catch cards must have one shared renderer.');
assert.match(kbApp, /renderCatchCard\(record/, 'KB catch cards must use the shared renderer.');
assert.match(gearApp, /renderCatchCard\(record/, 'Gear catch cards must use the shared renderer.');
assert.doesNotMatch(kbApp, /planner|sessionId|Planner Attributes/i, 'Planner and session concepts must stay retired.');
assert.match(gearApp, /\.\/data\/catches\.seed\.json/, 'My Gear catch backlinks must use structured catches.');
assert.doesNotMatch(gearApp, /Trip_Logs_Field_Observations|Gear used/, 'My Gear must not parse legacy catch Markdown.');
assert.doesNotMatch(index, /class="eyebrow"|>\s*Fishing knowledge base\s*</i, 'Site header must display only the site title.');

const catchHtml = renderCatchCard({ id:'catch-test', date:'2026-09-03', time:null, size:{ length:{value:12,unit:'in'}, weight:null, display:null } }, {
  speciesName:'Yellow Perch',
  locationName:'Lake Sammamish',
  pictureSrc:'./assets/kb/yellow-perch.jpg',
  pictureAlt:'Yellow Perch'
});
assert.match(catchHtml, /class="catch-card-picture"/);
assert.match(catchHtml, /<strong>Yellow Perch<\/strong>/);
assert.match(catchHtml, /href="#\/kb\/catch\/catch-test"/);

const contentMap = new Map([['./kb-content/knots/palomar.md', { id:'knot-palomar' }]]);
const html = renderMarkdown('## Rigging\n\n![Rig](../../assets/kb/rig.png)\n\n[Palomar](../knots/palomar.md) [Gear](gear://sample-hook) [KB](kb://technique-ned-rig) [Site](https://example.com)\n\n| A | B |\n|---|---|\n| 1 | 2 |', {
  contentPath:'./kb-content/techniques/example.md',
  entityByContentPath:contentMap
});
assert.match(html, /<h3>Rigging<\/h3>/);
assert.match(html, /src="\.\/assets\/kb\/rig\.png"/);
assert.match(html, /href="#\/kb\/entity\/knot-palomar"/);
assert.match(html, /href="#\/inventory\/item\/sample-hook"/);
assert.match(html, /href="#\/kb\/entity\/technique-ned-rig"/);
assert.match(html, /target="_blank" rel="noopener"/);
assert.match(html, /<table>/);
assert.doesNotMatch(renderMarkdown('[bad](javascript:alert(1))'), /href=/);

const nestedListHtml = renderMarkdown([
  '- Parent',
  '  - Child one',
  '  - Child two',
  '- Sibling',
  '1. Ordered parent',
  '   1. Ordered child'
].join('\n'));
assert.match(nestedListHtml, /<ul><li>Parent<ul><li>Child one<\/li><li>Child two<\/li><\/ul><\/li><li>Sibling<\/li><\/ul>/,
  'Indented unordered Markdown list items must remain nested.');
assert.match(nestedListHtml, /<ol><li>Ordered parent<ol><li>Ordered child<\/li><\/ol><\/li><\/ol>/,
  'Indented ordered Markdown list items must remain nested.');

console.log('Knowledge Base routing, Markdown, article layout, and retired Planner regression tests passed.');
