import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canReadD6DirectNotes} from '../src/d6-direct-notes-readiness.mjs';

const verified={online:true,contentSource:'d1',contentReadingMode:'Automatic'};
test('L01-EXIT-503 after reload initial verified D1 reads Notes before SW controls are ready',()=>{
 assert.equal(canReadD6DirectNotes({...verified,modeAvailable:false}),true);
 assert.equal(canReadD6DirectNotes({...verified,modeAvailable:true,mode:'Automatic'}),true);
 assert.equal(canReadD6DirectNotes({...verified,modeAvailable:true,mode:'Work Offline'}),false);
 assert.equal(canReadD6DirectNotes({...verified,online:false}),false);
});
test('L01-EXIT-503 unavailable or offline content never enables D1 Notes',()=>{
 assert.equal(canReadD6DirectNotes({online:true,contentSource:'v3-content',
  contentReadingMode:'Work Offline',modeAvailable:false}),false);
 assert.equal(canReadD6DirectNotes({online:true,contentSource:'release',
  contentReadingMode:'Automatic',modeAvailable:false}),false);
 assert.equal(canReadD6DirectNotes({online:true,contentSource:'d1',
  contentReadingMode:'Checking',modeAvailable:false}),false);
 assert.equal(canReadD6DirectNotes(),false);
});
test('L01-EXIT-503 standby renders transient network errors distinctly from missing records',()=>{
 const source=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(source,/canReadD6DirectNotes\(\{/);
 assert.match(source,/contentSource:ctx\.v3\?\.contentSource/);
 assert.match(source,/contentReadingMode:ctx\.v3\?\.contentReadingMode/);
 assert.match(source,/if\(ctx\.release\.standaloneV3===true\)\s*throw Error\('Verified V3 Notes are unavailable/);
 assert.match(source,/function loadError\(message\)/);
 assert.match(source,/loadError\('Unable to display this page: '\+error\.message\)/);
 assert.match(source,/if\(!record\)return missing/);
});
