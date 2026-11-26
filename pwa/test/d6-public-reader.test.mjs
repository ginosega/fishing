import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectD6PublicReader,D6_READER_ORIGIN,D6_READER_BASE}
 from '../src/d6-public-reader.mjs';

const id='0123456789abcdef0123456789abcdef';
const sha='0123456789abcdef0123456789abcdef01234567';
const good={
 root:D6_READER_ORIGIN+D6_READER_BASE,
 release:{id,sourceRevision:sha,d6ReaderCandidate:true},
 manifest:{base:D6_READER_BASE,releaseId:id,sourceRevision:sha,d6ReaderCandidate:true},
};
test('D6-A01 reader candidate is opt-in, immutable and never supplies a writer',()=>{
 assert.equal(selectD6PublicReader(good),null);
 const result=selectD6PublicReader({...good,enabled:true});
 assert.deepEqual({...result},{enabled:true,readerOnly:true});
 assert.equal(Object.isFrozen(result),true);
 for(const key of ['auth','publish','source','authorized','session','lifecycle'])
  assert.equal(Object.hasOwn(result,key),false,key);
});
test('D6-A02 only selected HTTPS production origin or loopback can enable reader',()=>{
 for(const root of [
  'https://ginosega.github.io/fishing/',
  'https://fishing-auth-p0-test.ginosega.workers.dev/fishing/',
  'https://fishing.ginosega.workers.dev/',
  'https://fishing.ginosega.workers.dev/fishing/__v3_owner_candidate__/',
  'http://fishing.ginosega.workers.dev/fishing/',
  'https://fishing.ginosega.workers.dev/fishing/?test=1',
  'https://fishing.ginosega.workers.dev/fishing/#/kb',
 ]){
  assert.throws(()=>selectD6PublicReader({...good,enabled:true,root}),/D6 reader scope/);
 }
 const result=selectD6PublicReader({...good,enabled:true,root:'http://127.0.0.1:4173/fishing/'});
 assert.equal(result.readerOnly,true);
});
test('D6-A03 mismatched source or manifest mode fails closed',()=>{
 const broken=[
  {release:{...good.release,d6ReaderCandidate:false}},
  {manifest:{...good.manifest,d6ReaderCandidate:false}},
  {manifest:{...good.manifest,base:'/'}},
  {manifest:{...good.manifest,releaseId:'f'.repeat(32)}},
  {manifest:{...good.manifest,sourceRevision:'f'.repeat(40)}},
  {release:{...good.release,sourceRevision:'not-a-real-ref'}},
  {release:{...good.release,id:'bad'}},
 ];
 for(const v of broken)
  assert.throws(()=>selectD6PublicReader({...good,...v,enabled:true}),/D6 reader scope/);
});
test('A01 standalone V3 is the only build',()=>{
 const build=readFileSync(new URL('../tools/build.mjs',import.meta.url),'utf8');
 const entry=readFileSync(new URL('../src/entry.mjs',import.meta.url),'utf8');
 const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
 assert.match(build,/const d6ReaderCandidate=true/);
 assert.match(build,/__FISHING_D6_PUBLIC_READER__/);
 assert.match(entry,/__FISHING_D6_PUBLIC_READER__===true/);
 assert.match(entry,/selectD6PublicReader\(\{enabled:true/);
 assert.match(app,/v3\?\.enabled===true&&v3\?\.readerOnly===true/);
});
test('D6-A05 V2 Add/Edit remains and V3 Add is owner-gated',()=>{
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/const readerOnly=ctx.v3\?\.enabled===true&&ctx.v3\?\.readerOnly===true/);
 assert.match(ui,/if\(readerOnly&&!ownerEditorPreview\)return missing\('V3 reader preview is read-only/);
  assert.match(ui,/page.append\(categories,searchResults/);
 assert.match(ui,/approvedController\?\.current\(\)\?\.authorized===true/);
  assert.match(ui,/page.append\(list.element/);
  const addGate='showEditingLinks()?';
  assert.equal(ui.split(addGate).length-1,2);
 assert.match(ui,/if\(showEditingLinks\(\)\)page.append\(anchor\('Edit item'/);
 assert.match(ui,/viewerImages:readerOnly/);
 assert.match(ui,/if\(readerOnly\)bindMarkdownPictureViewer/);
});

test('D6-A06 WP2 staged build requires dedicated origin and matching markers',()=>{
 const stage='https://fishing-d6-wp2-test.ginosega.workers.dev';
 const staged={...good,enabled:true,wp2Staging:true,
  root:stage+D6_READER_BASE,
  release:{...good.release,d6Wp2Staging:true},
  manifest:{...good.manifest,d6Wp2Staging:true},
 };
 assert.equal(selectD6PublicReader(staged).readerOnly,true);
 for(const bad of [
  {...staged,root:D6_READER_ORIGIN+D6_READER_BASE},
  {...staged,wp2Staging:false},
  {...staged,release:good.release},
  {...staged,manifest:good.manifest},
  {...staged,staticStaging:true},
 ]){
  assert.throws(()=>selectD6PublicReader(bad));
 }
 const source=readFileSync(new URL('../tools/build.mjs',import.meta.url),'utf8');
 assert.match(source,/d6Wp2Staging=true/);
 assert.match(source,/d6Wp2Staging/);
 assert.match(source,/__FISHING_D6_WP2_STAGING__/);
 assert.match(source,/d6Wp2Staging:true/);
});

test('A01 identical standalone software accepts only the two approved hosts and matching release markers',()=>{
 const stage='https://fishing-d6-wp2-test.ginosega.workers.dev';
 const candidate={...good,enabled:true,standalone:true,wp2Staging:true,
  release:{...good.release,d6Wp2Staging:true,standaloneV3:true},
  manifest:{...good.manifest,d6Wp2Staging:true,standaloneV3:true}};
 for(const host of [stage,D6_READER_ORIGIN])
  assert.equal(selectD6PublicReader({...candidate,root:host+D6_READER_BASE}).readerOnly,true);
 for(const host of ['https://evil.invalid','https://ginosega.github.io','https://fishing-d6-static-test.ginosega.workers.dev'])
  assert.throws(()=>selectD6PublicReader({...candidate,root:host+D6_READER_BASE}));
 assert.throws(()=>selectD6PublicReader({...candidate,root:D6_READER_ORIGIN+D6_READER_BASE,release:{...candidate.release,standaloneV3:false}}));
 assert.throws(()=>selectD6PublicReader({...candidate,root:D6_READER_ORIGIN+D6_READER_BASE,manifest:{...candidate.manifest,standaloneV3:false}}));
});
