import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const base='531f04a84c0d75e2a7f23dc368149de5026b607b';
assert.equal(execFileSync('git',['rev-parse',`${base}^{tree}`],{encoding:'utf8'}).trim(),'750f83b4585893dfa2c97eb70b30390b4324bfed');
const files=['README.md','Fishing_Context.md','Fishing_TODO.md','Fishing_Decision_Log.md','Fishing_New_Chat_Bootstrap_Prompt.md','pwa/README.md','pwa/DAGGER_AXIS_RELEASE_2026-09-08.md'];
const old=new Map();
for(const p of files){const s=await fs.readFile(p,'utf8');old.set(p,s);const archive=path.join('History/2026-09-08-pre-three-kb-images',p);await fs.mkdir(path.dirname(archive),{recursive:true});await fs.writeFile(archive,s);}
const read=p=>old.get(p);
const write=(p,s)=>fs.writeFile(p,s);
const between=(s,start,end,replacement)=>{const a=s.indexOf(start),b=s.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,`Missing section ${start}`);return s.slice(0,a)+replacement+'\n\n'+s.slice(b);};
const replace=(s,a,b)=>{assert.ok(s.includes(a),`Missing expected text: ${a}`);return s.replace(a,b);};
const g='2026-09-08-my-gear-v4-dagger-length-1';
const k='2026-09-08-kb-v1-three-hero-images-1';
const release='pwa/RELEASE_2026-09-08_KAYAK_KB_IMAGES.md';
const evidence='PR56, head `d17d7b0c52955c06ef55659d6062e8b6f4a44759`, normal CI #284 / `34188600391` against main `5265a393cce601a59540de2a17f5b7c56b4d3535`, merge `531f04a84c0d75e2a7f23dc368149de5026b607b`, production #285 / `34188668110`';
const summary='The Dagger Axis 10.5 Length is corrected to the user-confirmed `10\' 6"`. Fishing Line, Walking Bait and Rods & Reels now have the three requested hero pictures, with exact source bytes and unchanged authored Markdown. Fishing Line retains explicit Gear link `sufix-832-15`; no Gear association is inferred for the other two. The latest user-replaced Dagger PNG is preserved at its existing source path and owner. Gear schema4/65, KB schema1/54 and Catch schema2/5 remain intact.';
const versions=`Gear dataVersion \`${g}\`; KB dataVersion \`${k}\`; Catch dataVersion \`2026-09-04-catches-v2-external-notes-1\`.`;
const status=`**Production healthy; latest content release deployed.** ${evidence} passed all required checks and actual GitHub Pages deployment on September 8, 2026. ${summary} ${versions} FISH065 and FISH066 are DONE. FISH063 remains open for KB image-filename usability; browser acceptance and independent live HTTP verification are separate. No application release is pending.`;

let s=read('README.md');
s=between(s,'## Current state','## Authoritative project records',`## Current state\n\n${status}\n\nLive site: [Fishing Companion](https://ginosega.github.io/fishing/). See [latest release closeout](${release}) and [Dagger addition history](pwa/DAGGER_AXIS_RELEASE_2026-09-08.md). Earlier releases PR47–55 remain closed historical evidence.`);
s=s.replaceAll('FISH064 completion and FISH065 confirmation','FISH065/066 completion and remaining open work').replaceAll('Dagger closeout](pwa/DAGGER_AXIS_RELEASE_2026-09-08.md) — latest application release evidence','Latest release closeout]('+release+') — verified correction and three KB pictures');
await write('README.md',s);

s=read('Fishing_Context.md');
s=between(s,'**Status: ACTIVE','## Authority and operating mode',`**Status: ACTIVE / production healthy.** Reconciled September 8, 2026. ${evidence} succeeded. ${summary} See \`${release}\`. No application release is pending.`);
s=s.replaceAll('2026-09-08-my-gear-v4-dagger-axis-1',g).replaceAll('2026-09-04-kb-v1-final-content-1',k);
s=between(s,'## Equipment and media state','## Release and validation',`## Equipment and media state\n\n${summary}\n\nThe current Dagger source is \`pwa/assets/gear-source/dagger-axis-10-5.png\`, Git blob \`17ad66ac19cc0a71f3ca4c3fd4ea6ec5e881ac51\` (393226 bytes), uploaded on main in commit \`5265a393cce601a59540de2a17f5b7c56b4d3535\`. The prior image blob \`b6b9c96057adda124b7369952e851b13cf2f3b7b\` remains in Git history. Existing ownership, source metadata, all other Dagger specifications, links and no-Notes state are preserved.\n\nThe three KB pictures use the exact approved entry paths and metadata, including null provenance fields where the user supplied none. All three authored Markdown source blobs remain unchanged. Prior Buzzbait/Jack Hammer media and every unrelated domain record are preserved. FISH063 remains the separate filename/destination usability task.`);
s=between(s,'## Release and validation','', '');
await write('Fishing_Context.md',s);
