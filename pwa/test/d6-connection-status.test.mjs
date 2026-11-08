import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {connectionIndicator,effectiveConnectionOnline} from '../src/connection-indicator.mjs';

test('D6-IND01 only verified Automatic with a connection is Online',()=>{
 for(const readingMode of ['Automatic',null]){
  const online=connectionIndicator({online:true,readingMode});
  assert.equal(online.tone,'network');
  assert.equal(online.title,'Connection status: Online');
  assert.equal(online.label,online.title);
  assert(effectiveConnectionOnline({online:true,readingMode}));
  const offline=connectionIndicator({online:false,readingMode});
  assert.equal(offline.tone,'network');
  assert.equal(offline.title,'Connection status: Offline');
 }
 for(const readingMode of ['Work Offline','Checking']){
  for(const online of [true,false]){
   const status=connectionIndicator({online,readingMode});
   assert.equal(status.tone,'network');
   assert.equal(status.title,online&&readingMode==='Checking'?
    'Connection status: Checking':'Connection status: Offline');
   assert.equal(status.label,status.title);
   assert.equal(effectiveConnectionOnline({online,readingMode}),false);
  }
 }
});
test('D6-IND02 each publication step turns blue and is the mouse hover title',()=>{
 for(const publication of ['Submitting','Accepted','Validating','Checking',
  'Merging','Deploying','Verifying']){
  const d=connectionIndicator({online:false,authorized:true,
   publication,readingMode:'Work Offline'});
  assert.equal(d.tone,'publishing');
  assert.equal(d.title,'Publishing: '+publication);
  assert(!d.title.includes('Work Offline'));
 }
});
test('D6-IND03 transient GET failure never turns red or claims Live',()=>{
 const d=connectionIndicator({online:true,authorized:true,
  publication:'Checking',statusReadError:true});
 assert.equal(d.tone,'publishing');
 assert.equal(d.title,'Publishing: Checking');
});
test('D6-IND04 server terminal Failed/Conflict outrank network and reading',()=>{
 for(const publication of ['Failed','Conflict']){
  for(const online of [true,false]){
   const d=connectionIndicator({online,authorized:true,
    publication,readingMode:'Work Offline'});
   assert.equal(d.tone,'error');
   assert.equal(d.title,'Publishing failed');
  }
 }
});
test('D6-IND05 Live and explicit failure dismissal return to network color',()=>{
 for(const publication of ['Live','None']){
  for(const online of [true,false]){
   const d=connectionIndicator({online,authorized:true,publication});
   assert.equal(d.tone,'network');
  }
 }
 assert.equal(connectionIndicator({online:false,authorized:false,
  publication:'Failed'}).tone,'network','Owner-private terminal state never leaks to anonymous UI');
});

import {v3OfflineLibraryActionLabel} from '../src/v3-offline-library-action.mjs';

test('D6-CON06 status reads only verified mode and never claims Online in Work Offline',()=>{
 assert.equal(effectiveConnectionOnline({online:true,readingMode:'Work Offline'}),false);
 assert.equal(effectiveConnectionOnline({online:true,readingMode:'Checking'}),false);
 assert.equal(effectiveConnectionOnline({online:true,readingMode:'Automatic'}),true);
 for(const state of [null,{state:'Incomplete'},{state:'OnlineOnly'}])
  assert.equal(v3OfflineLibraryActionLabel(state),'Prepare');
 assert.equal(v3OfflineLibraryActionLabel({state:'Ready'}),'Update');
 assert.equal(v3OfflineLibraryActionLabel({state:'Downloading'}),'Preparing…');
});

test('D6-CON07 reading controls are only enabled in isolated candidate, never V2',()=>{
 const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
 const build=read('../tools/build.mjs'),sw=read('../src/sw.mjs'),ui=read('../src/ui.mjs'),offline=read('../src/offline.mjs');
 assert.match(build,/__FISHING_V3_READING_MODE__/);
 assert.match(build,/d6ReaderCandidate\?'true':'false'/);
 assert.match(sw,/if\(!v3ReadingMode\)return 'Automatic'/);
 assert.match(sw,/setReadingMode\(message.mode,message.expectedReleaseId\)/);
 assert.match(sw,/resolveSelected\(\{verify:true\}\)/);
 assert.match(offline,/expectedReleaseId:releaseId/);
 assert.match(ui,/v3ReadingMode:readerOnly/);
 assert.match(ui,/connection\.dataset\.online=String\(confirmed\)/);
 assert.match(ui,/if\(!readerOnly\)document\.getElementById\('offline-reload'\)/);
 assert.match(ui,/if\(readerOnly\)void offline\.refreshMode\(\)/);
 assert.match(ui,/if\(readerOnly\)update\.textContent=v3OfflineLibraryActionLabel\(state\)/);
});
