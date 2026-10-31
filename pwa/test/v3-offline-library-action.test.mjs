import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {v3OfflineLibraryActionLabel} from '../src/v3-offline-library-action.mjs';

test('V3-OL01 not-yet-verified library displays Prepare',()=>{
 for(const state of ['Incomplete','OnlineOnly',null,undefined]){
  assert.equal(v3OfflineLibraryActionLabel(state?{state}:null),'Prepare');
 }
 assert.equal(v3OfflineLibraryActionLabel({state:'Incomplete',message:'Needs update'}),'Prepare');
});
test('V3-OL02 Ready library displays Update',()=>{
 assert.equal(v3OfflineLibraryActionLabel({state:'Ready',files:577}),'Update');
 assert.equal(v3OfflineLibraryActionLabel({state:'Ready',releaseId:'older'}),'Update');
});
test('V3-OL03 preparing state and V3-only Reload removal',()=>{
 assert.equal(v3OfflineLibraryActionLabel({state:'Downloading',completed:30,files:577}),'Preparing…');
 assert.equal(v3OfflineLibraryActionLabel({state:'Ready',updating:true}),'Preparing…');
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/v3OfflineLibraryActionLabel\(state\)/);
 assert.match(ui,/v3OfflineLibraryActionLabel\(offline\.getStatus\(\)\)/);
 assert.match(ui,/document\.getElementById\('offline-reload'\)\.remove\(\)/);
 assert.match(ui,/document\.getElementById\('offline-reload'\)\?\.addEventListener/);
 assert.match(ui,/else document\.getElementById\('offline-reload'\)\.disabled/);
 assert.match(ui,/document\.getElementById\('offline-update'\)\.disabled=privatePilot\|\|Boolean\(state\.updating\)/);
 const html=readFileSync(new URL('../tools/build.mjs',import.meta.url),'utf8');
 assert(html.includes('offline-reload'),'V2 keeps its Reload control');
});
