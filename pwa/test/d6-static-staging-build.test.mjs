import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 selectD6PublicReader,D6_READER_BASE,D6_READER_ORIGIN,
 D6_STATIC_STAGING_ORIGIN,
} from '../src/d6-public-reader.mjs';

const ID='1234567890abcdef1234567890abcdef';
const REV='a'.repeat(40);
const base={id:ID,sourceRevision:REV,d6ReaderCandidate:true};
const make=({staticStaging=true,root=D6_STATIC_STAGING_ORIGIN+D6_READER_BASE,
 release={...base,d6StaticStaging:true},
 manifest={...base,releaseId:ID,base:D6_READER_BASE,d6StaticStaging:true},
}={})=>({enabled:true,staticStaging,root,release,manifest});
const allowed=x=>selectD6PublicReader(make(x));
const denied=x=>assert.throws(()=>allowed(x),/D6 reader scope/);

test('D6-STAGE01 explicit staging release works at one nonproduction hostname',()=>{
 const r=allowed();
 assert.deepEqual({...r},{enabled:true,readerOnly:true});
 assert(Object.isFrozen(r));
 for(const capability of ['auth','ownerReadiness','canonicalSource',
  'publish','media','writeToken','csrfToken','sourceRevision'])
  assert.equal(Object.hasOwn(r,capability),false);
});

test('D6-STAGE02 staging origin is never silently accepted by production reader',()=>{
 denied({staticStaging:false});
 denied({staticStaging:false,root:D6_READER_ORIGIN+'/fishing/'});
 denied({root:D6_READER_ORIGIN+'/fishing/'});
 for(const root of [
  'https://ginosega.github.io/fishing/',
  'https://fishing-auth-p0-test.ginosega.workers.dev/fishing/',
  'http://fishing-d6-static-test.ginosega.workers.dev/fishing/',
  D6_STATIC_STAGING_ORIGIN+'/',
  D6_STATIC_STAGING_ORIGIN+'/fishing/index.html',
  D6_STATIC_STAGING_ORIGIN+'/fishing/?mode=owner',
  'https://fishing-d6-static-test.ginosega.workers.dev.evil.invalid/fishing/',
 ])denied({root});
});

test('D6-STAGE03 release and manifest must both opt into static staging',()=>{
 denied({release:{...base}});
 denied({manifest:{...base,releaseId:ID,base:D6_READER_BASE}});
 denied({release:{...base,d6StaticStaging:true},manifest:{
  ...base,releaseId:ID,base:'/',d6StaticStaging:true,
 }});
 denied({release:{...base,d6StaticStaging:true,sourceRevision:'bad'}});
 denied({manifest:{...base,base:D6_READER_BASE,releaseId:ID,
  d6StaticStaging:true,sourceRevision:'bad'}});
 const nonstage=selectD6PublicReader({
  enabled:true,root:D6_READER_ORIGIN+'/fishing/',
  release:base,manifest:{...base,releaseId:ID,base:D6_READER_BASE},
 });
 assert.equal(nonstage.readerOnly,true);
 assert.equal(selectD6PublicReader({...make(),enabled:false}),null);
});

test('D6-STAGE04 stage bootstrap bypasses all owner and canonical source probes',()=>{
 const entry=readFileSync(new URL('../src/entry.mjs',import.meta.url),'utf8');
 assert.match(entry,/__FISHING_D6_STATIC_STAGING__===true/);
 assert.match(entry,/staticStaging:d6StaticStaging/);
 const stop=entry.indexOf('if(d6StaticStaging){');
 assert.match(entry,/if\(d6EditorPreview\)throw Error\('D6 editor preview cannot use static staging'\)/);
 assert.match(entry,/return \{v3:\{\.\.\.reader\}\}/);
 const session=entry.indexOf('createD6OwnerSessionReadiness({');
 const source=entry.indexOf('createD6CanonicalSourceClient({');
 assert(stop>0&&session>stop&&source>stop);
 assert.match(entry,/if\(!d6Reader\)return \{\}/);
});

test('D6-STAGE05 staging build has strict CLI guard and no default change',()=>{
 const build=readFileSync(new URL('../tools/build.mjs',import.meta.url),'utf8');
 assert.match(build,/args\.includes\('--d6-static-staging'\)/);
 assert.match(build,/d6StaticStaging&&!d6ReaderCandidate/);
 assert(build.includes("d6ReaderCandidate&&(base!=='/fishing/'"));
 assert(build.includes("!args.some(x=>x.startsWith('--out='))"));
 assert.match(build,/__FISHING_D6_STATIC_STAGING__/);
 assert(build.includes('d6StaticStaging?{d6StaticStaging:true}'));
 assert.match(build,/sourceRevision,base,pendingMedia,d6ReaderCandidate,d6StaticStaging/);
});

test('D6-STAGE06 nonproduction hostname is a proposal, not an installed Worker',()=>{
 const entry=readFileSync(new URL('../src/entry.mjs',import.meta.url),'utf8');
 const reader=readFileSync(new URL('../src/d6-public-reader.mjs',import.meta.url),'utf8');
 const build=readFileSync(new URL('../tools/build.mjs',import.meta.url),'utf8');
 assert(reader.includes('https://fishing-d6-static-test.ginosega.workers.dev'));
 for(const s of [entry,reader,build]){
  assert.doesNotMatch(s,/issueWriteToken|publishChange|D2_GITHUB_APP_PRIVATE_KEY/);
  assert(!s.includes('export default')&&!s.includes("addEventListener('fetch'"));
 }
});
