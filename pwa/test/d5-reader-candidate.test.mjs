import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectV3ReaderCandidate,V3_READER_CANDIDATE_BASE} from '../src/v3-reader-candidate.mjs';

const base='https://example.test'+V3_READER_CANDIDATE_BASE;
const release={id:'a'.repeat(32),sourceRevision:'b'.repeat(40)};
const manifest={base:V3_READER_CANDIDATE_BASE,
 v3ReaderCandidate:true,releaseId:release.id,
 sourceRevision:release.sourceRevision};
const select=(overrides={})=>selectV3ReaderCandidate({
 enabled:true,root:base,release,manifest,...overrides,
});

test('D5-RC01 ordinary V2 entry leaves reader candidate disabled',()=>{
 assert.equal(selectV3ReaderCandidate(),null);
 assert.equal(selectV3ReaderCandidate({enabled:false,root:'bad'}),null);
 const entry=readFileSync(new URL('../src/entry.mjs',import.meta.url),'utf8');
 assert.match(entry,/readerCandidate\?\s*bootstrap\(settings,\{v3:/);
 assert.match(entry,/bootstrap\(settings\)\)\.catch/);
 assert.doesNotMatch(entry,/createD3AuthoringClient|createD3OwnerPilotEntry/);
});

test('D5-RC02 candidate opts in V3 reading UI with no owner write or auth',()=>{
 const selected=select();
 assert.deepEqual(selected,{enabled:true,readerOnly:true});
 assert(Object.isFrozen(selected));
 assert.equal(Object.hasOwn(selected,'publish'),false);
 assert.equal(Object.hasOwn(selected,'auth'),false);
 assert.equal(Object.hasOwn(selected,'stageMedia'),false);
 assert.equal(Object.hasOwn(selected,'source'),false);
});

test('D5-RC03 candidate fails closed outside independent verified SW scope',()=>{
 for(const root of [
  'https://example.test/fishing/',
  'https://example.test/fishing/__d3_pilot__/',
  'https://example.test'+V3_READER_CANDIDATE_BASE+'?unsafe=1',
  'https://example.test'+V3_READER_CANDIDATE_BASE+'#/',
  'http://example.test'+V3_READER_CANDIDATE_BASE,
  'https://user@example.test'+V3_READER_CANDIDATE_BASE,
 ]){
  assert.throws(()=>select({root}),/scope mismatch/);
 }
 assert.deepEqual(select({root:'http://localhost'+V3_READER_CANDIDATE_BASE}),
  {enabled:true,readerOnly:true});
});

test('D5-RC04 candidate rejects mismatched or unmarked manifest and release',()=>{
 const cases=[
  {manifest:{...manifest,v3ReaderCandidate:false}},
  {manifest:{...manifest,base:'/fishing/'}},
  {manifest:{...manifest,releaseId:'c'.repeat(32)}},
  {manifest:{...manifest,sourceRevision:'c'.repeat(40)}},
  {release:{...release,id:'c'.repeat(32)}},
  {release:{...release,sourceRevision:'c'.repeat(40)}},
  {manifest:null},
 ];
 for(const c of cases)assert.throws(()=>select(c),/scope mismatch/);
});

test('D5-RC05 build uses distinct release, output and service-worker gates',()=>{
 const build=readFileSync(new URL('../tools/build.mjs',import.meta.url),'utf8');
 assert.match(build,/v3ReaderCandidate=args\.includes\('--v3-reader-candidate'\)/);
 assert.match(build,/base!==V3_READER_CANDIDATE_BASE/);
 assert.match(build,/!v3ReadingMode/);
 assert.match(build,/must not replace the ordinary build output/);
 assert.match(build,/__FISHING_V3_READER_CANDIDATE__/);
 assert.match(build,/v3ReaderCandidate:true/);
 assert.match(build,/__FISHING_V3_READING_MODE__/);
 const app=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(app,/ctx\.v3\?\.authorized===true&&/);
 assert.match(app,/typeof ctx\.v3\?\.publish==='function'/);
 assert.match(app,/v3ReadingMode:v3Mode&&!privatePilot/);
});
