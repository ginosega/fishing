/**
 * FISH-TODO-118 WP3 H2 — deterministic synthetic KB intake, SOURCE ONLY.
 *
 * NOT A LIVE RECORD OR A WRITER. This fixture is prepared ONLY against a
 * separately read-and-verified canonical main source and collision inventory.
 * It must not be committed into KB/kb.json or published without the distinct
 * H2 owner grants and exact hosted readback acceptance.
 */
import {prepareChange,validatePackage}
 from '../src/handoff.mjs';
import {safePath,sha256}
 from '../src/shared.mjs';

export const D6_WP3_H2_SYNTHETIC_TEST_NAME='WP3-H2-SYNTH-KB-001';
export const D6_WP3_H2_SYNTHETIC_RECORD_ID=
 'h2-synthetic-kb-publishing-proof';
export const D6_WP3_H2_SYNTHETIC_NOTES_PATH=
 'KB/Techniques/content/'+D6_WP3_H2_SYNTHETIC_RECORD_ID+'.md';
export const D6_WP3_H2_SYNTHETIC_IDEMPOTENCY_KEY=
 'wp3_h2_synthetic_kb_001';
const SHA40=/^[a-f0-9]{40}$/;
const notes=[
 '# WP3 H2 synthetic publishing proof',
 '',
 '**Test-only record. Not fishing advice. Do not merge this PR.**',
 '',
 'This record verifies one controlled KB Markdown and index update',
 'through a durable GitHub pull request, without changing main.',
 '',
].join('\n');
const record=Object.freeze({
 id:D6_WP3_H2_SYNTHETIC_RECORD_ID,
 type:'technique',
 name:'WP3 H2 Synthetic Publishing Proof',
 description:'Synthetic WP3 H2 source publishing acceptance record; do not merge',
});

export async function createD6Wp3H2SyntheticKbFixture({
 sourceRevision,existingIds,existingPaths,
}={}){
 // Both collision inventories must come from a freshly verified main
 // snapshot; a caller-supplied Set is NOT trusted provider evidence.
 if(!SHA40.test(sourceRevision??'')||
  !(existingIds instanceof Set)||!(existingPaths instanceof Set))
  throw Error('H2 canonical-main preflight unavailable');
 const path=safePath(D6_WP3_H2_SYNTHETIC_NOTES_PATH);
 if(existingIds.has(record.id)||existingPaths.has(path))
  throw Error('H2 synthetic record or Markdown path already exists');
 const pkg=await prepareChange({
  domain:'kb',operation:'add',
  id:record.id,record,
  sourceRevision,notesPath:path,text:notes,
 });
 validatePackage(pkg);
 if(pkg.id!==record.id||pkg.notes.action!=='create'||
  pkg.notes.path!==path||pkg.notes.body!==notes||
  pkg.base.sourceRevision!==sourceRevision||
  pkg.base.recordHash!==null||
  pkg.picture.action!=='keep'||
  pkg.pictureSequence.action!=='keep')
  throw Error('H2 fixture deviated from reviewed source package');
 const envelope=Object.freeze({
  idempotencyKey:D6_WP3_H2_SYNTHETIC_IDEMPOTENCY_KEY,
  snapshot:Object.freeze({package:pkg,media:Object.freeze([])}),
 });
 const bytes=JSON.stringify(envelope);
 const bodySha256=await sha256(bytes);
 return Object.freeze({
  testName:D6_WP3_H2_SYNTHETIC_TEST_NAME,
  recordId:record.id,
  notesPath:path,
  sourceRevision,
  idempotencyKey:D6_WP3_H2_SYNTHETIC_IDEMPOTENCY_KEY,
  body:bytes,
  bodySha256,
  package:pkg,
  // Not a provider receipt; NEVER claim Accepted, VerifiedPr or Live.
  sourceOnly:true,canPublish:false,isLive:false,
 });
}
