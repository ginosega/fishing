import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {v3OfflineLibraryDisplay}
 from '../src/v3-offline-library-status.mjs';
import {v3OfflineLibraryActionLabel}
 from '../src/v3-offline-library-action.mjs';

const context={online:true,currentReleaseId:'abc123'};
const status=(contentPreparation,state='Ready')=>({
 state,releaseId:'abc123',files:575,bytes:11000,contentPreparation,
});

test('O02-UX01 existing FISH091 two-line copy remains exactly unchanged',()=>{
 const display=v3OfflineLibraryDisplay({
  state:'Downloading',completed:16,files:575,
  message:'Checking the current production release…',
 },context);
 assert.deepEqual(display,{
  label:'Preparing offline library · 16/575 files',
  message:'Checking the current production release…',
  busy:true,
 });
 assert.deepEqual(v3OfflineLibraryDisplay({
  state:'Ready',releaseId:'abc123',files:575,
 },context),{
  label:'Offline library ready · current · 575 files',
  message:'',busy:false,
 });
 assert.equal(v3OfflineLibraryDisplay({state:'Incomplete'},context).label,
  'Offline library not prepared');
});

test('O02-UX02 approved two-line phases have incrementing distinct image count',()=>{
 const checking=v3OfflineLibraryDisplay(status({
  phase:'checking',completed:0,total:272,
 }),context);
 assert.deepEqual(checking,{
  label:'Preparing offline library',
  message:'Checking for offline library updates…',busy:true,
 });
 const progress=[0,1,147,272].map(completed=>
  v3OfflineLibraryDisplay(status({
   phase:'images',completed,total:272,
  }),context));
 assert.deepEqual(progress.map(x=>x.label),[
  'Preparing offline library · 0/272 images',
  'Preparing offline library · 1/272 images',
  'Preparing offline library · 147/272 images',
  'Preparing offline library · 272/272 images',
 ]);
 assert(progress.every(x=>x.message===
  'Reusing existing images and downloading changes…'&&x.busy));
 assert.deepEqual(v3OfflineLibraryDisplay(status({
  phase:'verifying',completed:272,total:272,
 }),context),{
  label:'Preparing offline library · 272/272 images',
  message:'Verifying offline library integrity…',busy:true,
 });
});

test('O02-UX03 completion or no changes is not Ready before combined integrity gate',()=>{
 for(const phase of ['complete','unchanged']){
  const unconfirmed=v3OfflineLibraryDisplay(status({
   phase,completed:272,total:272,libraryReady:false,
  }),context);
  assert.equal(unconfirmed.label,
   'Preparing offline library · 272/272 images');
  assert.equal(unconfirmed.busy,true);
  assert.match(unconfirmed.message,/Verifying offline library integrity/);
  const verified=v3OfflineLibraryDisplay(status({
   phase,completed:272,total:272,libraryReady:true,
  }),context);
  assert.equal(verified.label,'Offline library ready · current · 575 files');
  assert.equal(verified.message,phase==='unchanged'?
   'Offline library is already up to date.':
   'Offline library is ready for offline use.');
  assert.equal(verified.busy,false);
 }
 assert.equal(v3OfflineLibraryDisplay(status({
  phase:'complete',completed:272,total:272,libraryReady:true,
 },'Incomplete'),context).busy,true,'No false Ready without FISH091 release');
});

test('O02-UX04 failure messages preserve last-good and give retry guidance',()=>{
 const expected={
  network:'Connection lost. Previous offline library retained. Reconnect and try again.',
  image:'An image could not be verified. Previous offline library retained. Try updating again.',
  storage:'Not enough storage to complete the update. Previous offline library retained.',
  content:'Offline library update could not be completed. Previous offline library retained.',
 };
 for(const [reason,message] of Object.entries(expected)){
  const display=v3OfflineLibraryDisplay(status({
   phase:'error',reason,previousVerified:true,
  }),context);
  assert.deepEqual(display,{
   label:'Offline library ready · current · 575 files',message,busy:false,
  });
 }
});

test('O02-UX05 failed first preparation cannot claim a ready previous library',()=>{
 const expected={
  network:/Connection lost.*Reconnect/,
  image:/An image could not be verified.*Try preparing/,
  storage:/Not enough storage to prepare/,
  content:/Offline library could not be prepared/,
 };
 for(const [reason,message] of Object.entries(expected)){
  const view=v3OfflineLibraryDisplay(status({
   phase:'error',reason,previousVerified:false,
  },'Incomplete'),context);
  assert.equal(view.label,'Offline library not prepared');
  assert.match(view.message,message);
  assert.doesNotMatch(view.message,/Previous offline library retained/);
  assert.equal(view.busy,false);
 }
 assert.equal(v3OfflineLibraryDisplay(status({
  phase:'error',reason:'unknown',previousVerified:false,
 },'Incomplete'),context).message,
 'Offline library could not be prepared. Try again.');
});

test('O02-UX06 UI keeps existing two spans without a new progress panel',()=>{
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/import \{v3OfflineLibraryDisplay\}/);
 assert.match(ui,/const display=v3OfflineLibraryDisplay\(state/);
 assert.match(ui,/offlineHost\.replaceChildren\(text\('span',display\.label\)/);
 assert.match(ui,/display\.message\?\[text\('span',display\.message,'hint'\)\]/);
 assert.match(ui,/const busy=display\.busy/);
 assert.doesNotMatch(ui,/O02_PROGRESS_BAR|v3-new-offline-progress-bar/);
});

test('O02-UX11 Prepare/Update button stays disabled until combined verification',()=>{
 for(const phase of ['checking','images','verifying','complete','unchanged']){
  assert.equal(v3OfflineLibraryActionLabel(status({
   phase,libraryReady:false,
  })),'Preparing…');
 }
 assert.equal(v3OfflineLibraryActionLabel(status({
  phase:'complete',libraryReady:true,
 })),'Update');
 assert.equal(v3OfflineLibraryActionLabel(status({
  phase:'error',reason:'storage',previousVerified:true,
 })),'Update');
 assert.equal(v3OfflineLibraryActionLabel(status({
  phase:'error',reason:'network',previousVerified:false,
 },'Incomplete')),'Prepare');
});
