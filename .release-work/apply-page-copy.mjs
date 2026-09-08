import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const replaceOnce=(source,oldText,newText)=>{
  assert.equal(source.split(oldText).length,2,`Expected exactly one occurrence: ${oldText}`);
  return source.replace(oldText,newText);
};
const root='pwa/';
let app=await fs.readFile(root+'kb-app.js','utf8');
app=replaceOnce(app,"const TYPE_META = {","const KB_SUBTITLE = 'Fishing reference and catch log';\nconst CATCH_SUBTITLE = 'Recorded catches';\n\nconst TYPE_META = {");
app=replaceOnce(app,"description:'Equipment, rigs, and presentations reference'","description:'Equipment, rig, and presentation reference'");
app=replaceOnce(app,"description:'Strategy, conditions, and species reference.'","description:'Strategy, conditions, and species reference'");
app=replaceOnce(app,'<p>Browse locations, species, equipment, techniques, knots, and catches</p>','<p>${KB_SUBTITLE}</p>');
app=replaceOnce(app,"pageHeader('Knowledge Base', 'Browse your fishing reference by subject.', '#/home'","pageHeader('Knowledge Base', KB_SUBTITLE, '#/home'");
app=replaceOnce(app,"categoryCard('🗒️', 'Catch Log', 'Recorded catches with stable links to species, locations, techniques, setups, lures, and bait'","categoryCard('🗒️', 'Catch Log', CATCH_SUBTITLE");
app=replaceOnce(app,"pageHeader('Catch Log', 'Recorded catches with exact structured relationships.', '#/kb')","pageHeader('Catch Log', CATCH_SUBTITLE, '#/kb')");
await fs.writeFile(root+'kb-app.js',app);

let tests=await fs.readFile(root+'kb-routing.test.mjs','utf8');
tests=replaceOnce(tests,"description:'Equipment, rigs, and presentations reference'","description:'Equipment, rig, and presentation reference'");
tests=replaceOnce(tests,"description:'Strategy, conditions, and species reference\\.'","description:'Strategy, conditions, and species reference'");
const anchor="assert.match(kbApp, /const SEARCH_THRESHOLD = 10;/";
const additions=`assert.match(kbApp, /const KB_SUBTITLE = 'Fishing reference and catch log';/);
assert.match(kbApp, /const CATCH_SUBTITLE = 'Recorded catches';/);
assert.match(kbApp, /<strong>Knowledge Base<\\/strong><p>\\$\\{KB_SUBTITLE\\}<\\/p>/,
  'The home Knowledge Base card must share the page subtitle.');
assert.match(kbApp, /pageHeader\\('Knowledge Base', KB_SUBTITLE, '#\\/home'/,
  'The Knowledge Base page must use the shared subtitle.');
assert.match(kbApp, /categoryCard\\('🗒️', 'Catch Log', CATCH_SUBTITLE, '#\\/kb\\/catches'/,
  'The Catch Log category card must use the shared subtitle.');
assert.match(kbApp, /pageHeader\\('Catch Log', CATCH_SUBTITLE, '#\\/kb'\\)/,
  'The Catch Log page must use the shared subtitle.');
assert.match(kbApp, /pageHeader\\(meta.label, meta.description, '#\\/kb'/,
  'Category page subtitles must reuse the category card descriptions.');
assert.doesNotMatch(kbApp, /Equipment, rigs, and presentations reference|Strategy, conditions, and species reference\\.|Recorded catches with exact structured relationships\\.|Recorded catches with stable links to species|Browse your fishing reference by subject\\.|Browse locations, species, equipment, techniques, knots, and catches/,
  'Superseded page copy must not remain.');
`;
tests=replaceOnce(tests,anchor,additions+anchor);
await fs.writeFile(root+'kb-routing.test.mjs',tests);
console.log('Page-copy changes applied with shared card/header strings and regression coverage.');
