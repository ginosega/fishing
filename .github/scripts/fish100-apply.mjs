import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fingerprint,sha256,canonical} from '../../pwa/src/shared.mjs';
import {validatePackage} from '../../pwa/src/handoff.mjs';

const pkg={
  format:'fishing-companion-change-v2',domain:'kb',operation:'edit',id:'knot-palomar',
  base:{schemaVersion:2,sourceRevision:'4bd0d4694490b93c19bb910736dff0bc868b648e',recordHash:'d09e83e7cfc3ddd6531389fc460620c66b23cfafb5a1b4866f6c20c89be8e94a'},
  changes:{set:{},unset:[],baseFields:{}},
  notes:{action:'replace',path:'KB/Knots/content/palomar.md',body:`- Works with braid, fluorocarbon, and mono
- Very strong, easy to tie even with small hooks or light line, keeps hook straight
- Double up line, push doubled end through eye from back side of hook, tie an overhand knot above the eye, then push the hook point first through the doubled up end, moisten and tighten
- Make sure the loop cinches evenly and completely above the eye — don’t cross lines, and don't leave any of the line caught below the eye

Video: [Palomar Knot](https://youtube.com/shorts/IlQDI4bi694?is=zoKRljv9K4l7K5yp)
`,baseSha256:'05a439f4d5b2a5db6b37666c20dc742e29685cd11aaffce351ae7cc0e7ff8580'},
  picture:{action:'keep'},pictureSequence:{action:'keep'}
};
validatePackage(pkg);
const kb=JSON.parse(await fs.readFile('KB/kb.json','utf8'));
const record=kb.entities.find(x=>x.id===pkg.id);
assert(record,'Palomar record missing');
assert.equal(await fingerprint(record),pkg.base.recordHash,'Palomar record fingerprint changed since package base');
assert.equal(record.content,pkg.notes.path,'Palomar content path changed');
const text=await fs.readFile(pkg.notes.path,'utf8');
assert.equal(await sha256(text),pkg.notes.baseSha256,'Palomar Markdown changed since package base');
const pictureBefore=canonical(record.picture), sequenceBefore=canonical(record.pictureSequence);
assert(record.picture && Array.isArray(record.pictureSequence),'Palomar picture/sequence unexpectedly absent');
assert.equal(record.picture.src,record.pictureSequence.at(-1),'Palomar representative frame mismatch');
await fs.writeFile(pkg.notes.path,pkg.notes.body);
const kbAfter=JSON.parse(await fs.readFile('KB/kb.json','utf8'));
const after=kbAfter.entities.find(x=>x.id===pkg.id);
assert.equal(canonical(after.picture),pictureBefore,'Picture changed despite keep');
assert.equal(canonical(after.pictureSequence),sequenceBefore,'Picture sequence changed despite keep');
assert.equal(await fingerprint(after),pkg.base.recordHash,'Structured Palomar record changed');
assert.equal(await sha256(await fs.readFile(pkg.notes.path,'utf8')),await sha256(pkg.notes.body),'Replacement Markdown write mismatch');
console.log(JSON.stringify({id:pkg.id,recordHash:pkg.base.recordHash,baseSha256:pkg.notes.baseSha256,picture:record.picture.src,sequenceFrames:record.pictureSequence.length},null,2));
