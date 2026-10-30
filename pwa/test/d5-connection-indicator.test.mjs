import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {connectionIndicator} from '../src/connection-indicator.mjs';

test('D5-IND01 network green/yellow regardless of Work Offline selection',()=>{
 for(const readingMode of ['Automatic','Work Offline','Checking']){
  const online=connectionIndicator({online:true,readingMode});
  assert.equal(online.tone,'network');
  assert.equal(online.title,'Connection status: Online');
  const offline=connectionIndicator({online:false,readingMode});
  assert.equal(offline.tone,'network');
  assert.equal(offline.title,'Connection status: Offline');
 }
});
test('D5-IND02 each publication step turns blue and is the mouse hover title',()=>{
 for(const publication of ['Submitting','Accepted','Validating','Checking',
  'Merging','Deploying','Verifying']){
  const d=connectionIndicator({online:false,authorized:true,
   publication,readingMode:'Work Offline'});
  assert.equal(d.tone,'publishing');
  assert.equal(d.title,'Publishing: '+publication);
  assert(!d.title.includes('Work Offline'));
 }
});
test('D5-IND03 transient GET failure never turns red or claims Live',()=>{
 const d=connectionIndicator({online:true,authorized:true,
  publication:'Checking',statusReadError:true});
 assert.equal(d.tone,'publishing');
 assert.equal(d.title,'Publishing: Checking');
});
test('D5-IND04 server terminal Failed/Conflict outrank network and reading',()=>{
 for(const publication of ['Failed','Conflict']){
  for(const online of [true,false]){
   const d=connectionIndicator({online,authorized:true,
    publication,readingMode:'Work Offline'});
   assert.equal(d.tone,'error');
   assert.equal(d.title,'Publishing failed');
  }
 }
});
test('D5-IND05 Live and explicit failure dismissal return to network color',()=>{
 for(const publication of ['Live','None']){
  for(const online of [true,false]){
   const d=connectionIndicator({online,authorized:true,publication});
   assert.equal(d.tone,'network');
  }
 }
 assert.equal(connectionIndicator({online:false,authorized:false,
  publication:'Failed'}).tone,'network','Owner-private terminal state never leaks to anonymous UI');
});
test('D5-IND06 V2 CSS untouched; V3 publication precedence and hover wired',()=>{
 const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(css,/\.connection-status\[data-online="false"\] \.connection-dot/);
 assert.match(css,/data-publication-indicator="publishing"/);
 assert.match(css,/data-publication-indicator="error"/);
 assert.doesNotMatch(css,/data-reading-mode="work-offline"\] \.connection-dot/);
 assert.match(ui,/connection\.title=display\.title/);
 assert.match(ui,/connection\.dataset\.publicationIndicator=display\.tone/);
 assert.match(ui,/paintConnectionIndicator\(\)/);
 assert.match(ui,/ownerPanel\?\.paint\(\);\s*connectionExperience\?\.paint\(\);\s*paintConnectionIndicator\(\)/);
});
