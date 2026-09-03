import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderMarkdown } from './markdown-render.js';

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
assert.match(kbApp, /type === 'technique'/, 'Techniques list must expose its Search box.');
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

console.log('Knowledge Base routing, Markdown, article layout, and retired Planner regression tests passed.');
