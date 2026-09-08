import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const oldVersion='2026-09-08-kb-v1-rods-reels-caption-1';
const newVersion='2026-09-08-kb-v1-cranberry-lake-picture-1';
const release='RELEASE_2026-09-08_CRANBERRY_COPY.md';
const oldRelease='RELEASE_2026-09-08_JOYRIDE_RODS_CAPTION.md';
const merge='ecd9f3d52ca8180ea4f48ec888e7574105deafda';
const read=p=>fs.readFile(p,'utf8');
const write=(p,s)=>fs.writeFile(p,s);
function once(s,oldText,newText){assert.equal(s.split(oldText).length,2,`Expected one occurrence: ${oldText.slice(0,120)}`);return s.replace(oldText,newText);}
function section(s,start,end,body){const a=s.indexOf(start),b=s.indexOf(end,a+start.length);assert.ok(a>=0&&b>a);assert.equal(s.indexOf(start,a+1),-1);return s.slice(0,a)+body+s.slice(b);}
function tail(s,start,body){const a=s.indexOf(start);assert.ok(a>=0);assert.equal(s.indexOf(start,a+1),-1);return s.slice(0,a)+body;}
const latest=`PR60, final head \`cd47dc9ce39660840de493346e7df9fda72a14e5\`, normal CI #307 / \`34191643311\`, merge \`${merge}\`, production #308 / \`34191692935\`, including actual GitHub Pages deployment. Gear schema4/66 uses \`2026-09-08-my-gear-v4-perception-joyride-1\`; KB schema1/54 uses \`${newVersion}\`; Catch schema2/5 remains \`2026-09-04-catches-v2-external-notes-1\`. FISH069 and FISH070 are DONE; FISH063 remains OPEN. No application release is pending. See \`pwa/${release}\`.\n`;

let s=await read('README.md');
s=section(s,'## Current state\n','## Authoritative project records',`## Current state\n\n**Production healthy; Cranberry Lake picture and page-copy corrections deployed.** ${latest}\nPR60 registered the user-uploaded Cranberry Lake PNG and its exact alt/caption, preserving all authored Markdown and other entity facts. Home/KB, Gear Guides, Techniques and Catch Log subtitles now match the requested wording. Earlier Joyride, Dagger, hero-media and Gear/Catch data remain preserved. No Planner or speculative relationships were added.\n\nLive site: [Fishing Companion](https://ginosega.github.io/fishing/). See [latest release closeout](pwa/${release}) for exact evidence. Previous PR58 and earlier records remain historical evidence.\n\n`);
s=once(s,`- [Latest release](pwa/${oldRelease}) — PR58 Joyride/caption release.`,`- [Latest release](pwa/${release}) — PR60 Cranberry Lake picture and page-copy release.\n- [Previous Joyride/caption release](pwa/${oldRelease}) — PR58 historical evidence.`);
await write('README.md',s);

s=await read('Fishing_Context.md');
s=section(s,'**Status:','## Authority and operating mode',`**Status: ACTIVE / production healthy.** Reconciled September 8, 2026. Latest application release: ${latest}\n`);
s=once(s,`dataVersion \`${oldVersion}\``,`dataVersion \`${newVersion}\``);
s=once(s,'## Release and validation\n',`## Current Cranberry Lake and page-copy release\n\nCranberry Lake retains stable ID \`location-cranberry-lake-deception-pass\`, its original description/content path and complete authored Markdown. Its new picture is \`./assets/kb/entries/location-cranberry-lake-deception-pass.png\`, alt/caption \`Cranberry Lake\`, null credit/sourceUrl; matching local-media registration, no inferred ownership. The source PNG is blob \`201852612f8985fba057bfe224292bfe2a24d69d\` (1,981,945 bytes). The source and published bytes are validated without a permanent historical hash lock.\n\nHome and KB root share \`Fishing reference and catch log\`; Gear Guides uses \`Equipment, rig, and presentation reference\`; Catch Log uses \`Recorded catches\`; Techniques uses \`Strategy, conditions, and species reference\` without a final period. Category metadata is shared by card/page. No other runtime facts or authored narrative changed. FISH069/070 DONE, FISH063 OPEN.\n\n## Release and validation\n`);
s=tail(s,'PR58 final head ',`PR60 final head \`cd47dc9ce39660840de493346e7df9fda72a14e5\` passed normal CI #307 / \`34191643311\` against main \`894586f3aac1c4f44a00917ad4071ee5ace2f9c4\`. Merge \`${merge}\` passed production #308 / \`34191692935\`, including the actual Pages deploy. All existing permanent tests, build, authored media/Notes, transformed-data checks and final-bundle validation passed. Temporary promotion machinery was removed before PR CI; no migration was rerun. Prior PR58 and earlier release evidence remains in historical release files.\n\nThe live site is \`https://ginosega.github.io/fishing/\`. GitHub Pages deployment is verified; independent browser/HTTP acceptance is not claimed. Start future work from current main and the canonical TODO. Preserve direct-main edits and coordinate releases around \`fishing-pages\` concurrency. Exact evidence is in \`pwa/${release}\`; prior release files remain historical.\n`);
await write('Fishing_Context.md',s);

s=await read('Fishing_TODO.md');
s=once(s,'| FISH-TODO-068 |',`| FISH-TODO-070 | 2026-09-08 | PWA page copy | PR60 unified home/KB root, Gear Guides, Techniques and Catch Log card/page subtitles exactly as requested, using shared strings and permanent routing regression coverage. Final head \`cd47dc9ce39660840de493346e7df9fda72a14e5\`; CI #307 / \`34191643311\`; merge \`${merge}\`; production #308 / \`34191692935\` succeeded including Pages deployment. DONE. |\n| FISH-TODO-069 | 2026-09-08 | KB media | PR60 promoted the exact Cranberry Lake picture handoff, preserved authored Markdown/identity, validated the uploaded PNG and final bytes, registered explicit local media and advanced KB dataVersion to \`${newVersion}\` (54 entities). All other domain records preserved. Same CI/merge/production evidence as FISH070. DONE. |\n| FISH-TODO-068 |`);
s=once(s,'The next new canonical task ID is FISH-TODO-069.','The next new canonical task ID is FISH-TODO-071.');
await write('Fishing_TODO.md',s);

s=await read('Fishing_Decision_Log.md');
s=section(s,'## Release authority\n','## Current decisions',`## Release authority\n\nThe latest application release is ${latest} Previous PR58 and earlier releases remain historical evidence.\n\n`);
s=once(s,'| 2026-09-08 | Perception Joyride |',`| 2026-09-08 | Cranberry Lake picture | Accept the exact user-authored add-picture handoff for \`location-cranberry-lake-deception-pass\`. Preserve all existing facts and complete Markdown; register the validated uploaded PNG with alt/caption \`Cranberry Lake\`, null credit/sourceUrl and no inferred ownership. Advance KB dataVersion to \`${newVersion}\`. PR60/FISH069 DONE. |\n| 2026-09-08 | Page-copy consistency | Home/KB root share \`Fishing reference and catch log\`; Gear Guides uses \`Equipment, rig, and presentation reference\`; Catch Log uses \`Recorded catches\`; Techniques uses \`Strategy, conditions, and species reference\` without a period. Reuse category metadata on card/page and retain permanent regression coverage. PR60/FISH070 DONE. |\n| 2026-09-08 | Perception Joyride |`);
await write('Fishing_Decision_Log.md',s);

s=await read('Fishing_New_Chat_Bootstrap_Prompt.md');
s=once(s,`6. \`pwa/${oldRelease}\` (latest release evidence)`,`6. \`pwa/${release}\` (latest release evidence)`);
s=section(s,'## Verified baseline\n','## Architecture and safety',`## Verified baseline\n\nAs of September 8, 2026, the latest application release is ${latest}\nPR60 registered the exact Cranberry Lake picture handoff at \`pwa/assets/kb/entries/location-cranberry-lake-deception-pass.png\`, blob \`201852612f8985fba057bfe224292bfe2a24d69d\` (1,981,945 bytes), alt/caption \`Cranberry Lake\`, with no inferred owner or provenance. Its existing facts and complete authored Markdown are preserved. Home/KB root, Gear Guides, Techniques and Catch Log copy now matches the requested wording.\n\nPrevious PR58 added owned Gear/media ID \`perception-joyride-10-0\` exactly as supplied, with no Notes, and changed only the Rods & Reels hero caption to \`Baitcasting reel\`. Its historical source blob was \`f24403f79788755e267ee721f5e93c34c3f8f472\` (562530 bytes); current media must be validated rather than compared with a frozen historical hash. Dagger Axis 10.5 remains at confirmed Length \`10' 6"\`, with the latest user source replacement preserved. Earlier hero images and explicit ownership remain unchanged. PR58 and all earlier release details remain in their historical records.\n\n`);
s=once(s,`dataVersion \`${oldVersion}\``,`dataVersion \`${newVersion}\``);
await write('Fishing_New_Chat_Bootstrap_Prompt.md',s);

s=await read('pwa/README.md');
s=section(s,'**Status:','## Architecture',`**Status: production healthy.** Latest application release ${latest}\n`);
s=once(s,`dataVersion \`${oldVersion}\``,`dataVersion \`${newVersion}\``);
s=once(s,'node pwa/accepted-2026-09-08-joyride-caption.test.mjs\n','node pwa/accepted-2026-09-08-joyride-caption.test.mjs\nnode pwa/cranberry-lake-picture.test.mjs\n');
s=once(s,'node pwa/accepted-2026-09-08-joyride-caption.test.mjs --dist\n','node pwa/accepted-2026-09-08-joyride-caption.test.mjs --dist\nnode pwa/cranberry-lake-picture.test.mjs --dist\n');
s=once(s,'source blob/size, byte-identical built image','actual source format and byte-identical built image');
s=once(s,'## Media and current release\n',`## Media and current release\n\nPR60 registered Cranberry Lake hero media at \`assets/kb/entries/location-cranberry-lake-deception-pass.png\`, alt/caption \`Cranberry Lake\`, with null credit/sourceUrl and no inferred ownership. The PNG is blob \`201852612f8985fba057bfe224292bfe2a24d69d\` (1,981,945 bytes) at release time. The KB dataVersion is \`${newVersion}\`. Its exact authored Markdown and other entity facts are unchanged. The permanent Cranberry regression checks source identity, metadata, actual format and exact published image/Markdown copies. Historical hashes are evidence, not locks on user-maintained sources.\n\nHome and KB root share \`Fishing reference and catch log\`; Gear Guides uses \`Equipment, rig, and presentation reference\`; Catch Log uses \`Recorded catches\`; Techniques uses \`Strategy, conditions, and species reference\` without a period. The existing KB routing test enforces card/page consistency. See [latest release](${release}).\n\n`);
s=once(s,'FISH063 remains OPEN for clearer KB image filename/upload-destination guidance; PR58 did not alter that editor usability issue.','FISH063 remains OPEN for clearer KB image filename/upload-destination guidance; PR60 did not alter that editor usability issue. FISH069/070 are DONE.');
await write('pwa/README.md',s);

// Reconcile the authoritative current-state references. Historical PR58 details
// remain intact in their archived snapshots and historical release records.
for(const p of ['README.md','Fishing_Context.md','Fishing_TODO.md','Fishing_Decision_Log.md','Fishing_New_Chat_Bootstrap_Prompt.md','pwa/README.md']){
 const text=await read(p);assert.ok(text.includes(release),`${p} missing current release`);assert.ok(!text.includes('No application release is pending.\n\nPR58'),`${p} retains a stale current-release claim`);
}
assert.ok((await read('Fishing_TODO.md')).includes('FISH-TODO-071'));
assert.ok((await read('Fishing_New_Chat_Bootstrap_Prompt.md')).includes('Use Chat mode by default.'));
console.log('Authoritative project records reconciled; prior source snapshots preserved.');
