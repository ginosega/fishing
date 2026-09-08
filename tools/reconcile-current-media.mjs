import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const old='17ad66ac19cc0a71f3ca4c3fd4ea6ec5e881ac51';
const latest='cfb44c09b6ab3d79a53d50e626664dde5e148a3a';
const commit='2c79f685f5d3fc1020930874cfea486425840c3c';
const read=p=>fs.readFile(p,'utf8');
const write=(p,s)=>fs.writeFile(p,s);
const replace=(s,a,b)=>{assert.ok(s.includes(a),'Expected current-state text missing: '+a);return s.replace(a,b);};
const replacements=[
 ['Fishing_Context.md',`Git blob \`${old}\`, 393226 bytes, from the user's main replacement commit \`5265a393cce601a59540de2a17f5b7c56b4d3535\``,`Git blob \`${latest}\`, 259840 bytes, from the user's latest main replacement commit \`${commit}\``],
 ['Fishing_Decision_Log.md',`latest direct-main Dagger PNG replacement, blob \`${old}\``,`latest direct-main Dagger PNG replacement, blob \`${latest}\``],
 ['Fishing_New_Chat_Bootstrap_Prompt.md',`The latest source image is Git blob \`${old}\``,`The latest source image is Git blob \`${latest}\``],
 ['pwa/README.md',`The current source blob is \`${old}\` (393226 bytes), from the user's direct-main replacement`,`The current source blob is \`${latest}\` (259840 bytes), from the user's latest direct-main replacement \`${commit}\``],
 ['pwa/DAGGER_AXIS_RELEASE_2026-09-08.md',`Current source blob \`${old}\` is 393226 bytes`,`Current source blob \`${latest}\` is 259840 bytes`]
];
for(const [p,a,b] of replacements){await write(p,replace(await read(p),a,b));}
let s=await read('README.md');
s=replace(s,'The latest user-replaced Dagger PNG is retained.','The latest user-replaced Dagger PNG is retained, including the subsequent source replacement in commit `'+commit+'`. The image regression now validates actual source format, identity, ownership and byte-identical output without freezing a user-maintained image hash.');
await write('README.md',s);
s=await read('Fishing_TODO.md');
s=replace(s,'| FISH-TODO-066 | 2026-09-08 | KB media |','| FISH-TODO-067 | 2026-09-08 | Media regression | PR57 accepts validated user replacements of the Dagger PNG without freezing a historical image hash, while preserving exact source-to-bundle bytes and ownership. Latest source blob '+latest+' (259840 bytes) and the concurrent Perception Joyride image are preserved. Production confirmation is recorded in the latest release closeout. |\n| FISH-TODO-066 | 2026-09-08 | KB media |');
s=replace(s,'The next new canonical task ID is FISH-TODO-067.','The next new canonical task ID is FISH-TODO-068.');
await write('Fishing_TODO.md',s);
s=await read('Fishing_Decision_Log.md');
s=replace(s,'## Current decisions','## Current decisions\n\n| Date | Area | Decision / status |\n|---|---|---|\n| 2026-09-08 | Mutable source media | A user-maintained image is not a frozen historical hash fixture. Validate actual format, size, stable identity, explicit owner and exact transformed bytes. Preserve accepted prior hashes in release history. PR57/FISH067. |\n');
// Remove the duplicate table heading introduced by the new decision.
s=s.replace('| 2026-09-08 | Mutable source media | A user-maintained image is not a frozen historical hash fixture. Validate actual format, size, stable identity, explicit owner and exact transformed bytes. Preserve accepted prior hashes in release history. PR57/FISH067. |\n\n\n| Date | Area | Decision / status |\n|---|---|---|','| 2026-09-08 | Mutable source media | A user-maintained image is not a frozen historical hash fixture. Validate actual format, size, stable identity, explicit owner and exact transformed bytes. Preserve accepted prior hashes in release history. PR57/FISH067. |');
await write('Fishing_Decision_Log.md',s);
s=await read('Fishing_Context.md');
s=replace(s,'The original blob `b6b9c96057adda124b7369952e851b13cf2f3b7b` remains in Git history.','The previous replacement blob `'+old+'` and original blob `b6b9c96057adda124b7369952e851b13cf2f3b7b` remain in Git history.');
s=replace(s,'## Release and validation','The concurrent user upload `pwa/assets/gear-source/perception-joyride-10.png`, blob `f24403f79788755e267ee721f5e93c34c3f8f472` (562530 bytes), is preserved without inventing an owned Gear record or media association. The Dagger regression validates actual replacement bytes and ownership rather than locking a historical hash.\n\n## Release and validation');
await write('Fishing_Context.md',s);
s=await read('Fishing_New_Chat_Bootstrap_Prompt.md');
s=replace(s,'with the original preserved in history.','with the previous and original images preserved in history. The concurrent Perception Joyride source upload is preserved without inferred ownership. User-maintained image regression tests validate actual bytes and identity, not a frozen historical hash.');
await write('Fishing_New_Chat_Bootstrap_Prompt.md',s);
s=await read('pwa/README.md');
s=replace(s,'the previous source remains in Git history.','the previous and original sources remain in Git history. The current source and built image are checked byte-for-byte rather than requiring an obsolete source hash. The unregistered Perception Joyride source upload is preserved without inferred ownership.');
await write('pwa/README.md',s);
s=await read('pwa/DAGGER_AXIS_RELEASE_2026-09-08.md');
s+='\n\n## Subsequent source replacement\n\nThe user replaced the PNG again in commit `'+commit+'`. Current source blob `'+latest+'` is 259840 bytes. The earlier replacement blob `'+old+'` and original blob remain in Git history. PR57 updates the regression to validate the actual image, existing stable owner and byte-identical transformed asset, rather than rejecting legitimate user-maintained image replacements. All product facts and the confirmed length remain unchanged.\n';
await write('pwa/DAGGER_AXIS_RELEASE_2026-09-08.md',s);
s=await read('pwa/RELEASE_2026-09-08_KAYAK_KB_IMAGES.md');
s+='\n\n## Subsequent concurrent media and regression maintenance\n\nAfter production #285, the user replaced the Dagger source again at commit `'+commit+'`, blob `'+latest+'` (259840 bytes), and uploaded `pwa/assets/gear-source/perception-joyride-10.png`, blob `f24403f79788755e267ee721f5e93c34c3f8f472` (562530 bytes). Both are preserved. The Perception file is unregistered pending an explicit Gear handoff; no ownership is inferred. The earlier Dagger replacement `'+old+'` and original image remain in Git history. PR57/FISH067 removes the frozen source-hash assertion, retaining actual image validation, stable metadata and exact source-to-bundle byte checks. The PR56 historical release hashes above remain accurate for that release.\n';
await write('pwa/RELEASE_2026-09-08_KAYAK_KB_IMAGES.md',s);
for(const p of ['Fishing_Context.md','Fishing_Decision_Log.md','Fishing_New_Chat_Bootstrap_Prompt.md','pwa/README.md','pwa/DAGGER_AXIS_RELEASE_2026-09-08.md'])assert.ok((await read(p)).includes(latest),p);
assert.ok((await read('Fishing_TODO.md')).includes('FISH-TODO-068'));
console.log('Latest media provenance and mutable-image regression records reconciled.');
