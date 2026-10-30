import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyCatchField,catchFieldValue,speciesCatchChoices,
 lureCatchChoices} from '../src/catch-fields.mjs';
import {validateRecords} from '../src/validation.mjs';
import {suggestedCatchId} from '../src/catch-editor.mjs';
import {suggestedItemId,ID_PATTERN} from '../src/shared.mjs';
const entries=[
 {id:'species-test-bass',name:'Test Bass',type:'species',
  content:'KB/Species/content/Test Bass.md'},
 {id:'location-test-lake',name:'Test Lake',type:'location',
  content:'KB/Locations/content/Test Lake.md'},
];
const gear=[{id:'p3-test-spinner',category:'lures',type:'Spoons',
 name:'Test Spinner'}];
const source={gear:{schemaVersion:2,items:gear},
 kb:{schemaVersion:2,entities:entries},
 catches:{schemaVersion:2,catches:[]}};
test('D4-UX01 species linked vs freely typed, case-insensitive autocomplete',()=>{
 const c={id:'p3-test-catch-one',date:'2026-10-29'};
 applyCatchField(c,'species','test bass',speciesCatchChoices(source).linked);
 assert.equal(c.speciesId,'species-test-bass');
 assert.equal(c.speciesName,undefined);
 applyCatchField(c,'species','Synthetic New Fish',speciesCatchChoices(source).linked);
 assert.equal(c.speciesId,undefined);
 assert.equal(c.speciesName,'Synthetic New Fish');
 assert.equal(catchFieldValue(c,'species'),'Synthetic New Fish');
 const choices=speciesCatchChoices({...source,catches:{catches:[c]}});
 assert(choices.suggestions.includes('Synthetic New Fish'));
 validateRecords({...source,catches:{schemaVersion:2,catches:[c]}});
});
test('D4-UX02 location is editable plain text yet preserves existing KB match',()=>{
 const c={id:'p3-test-catch-two',date:'2026-10-29'};
 applyCatchField(c,'location','Test Lake',entries);
 assert.equal(c.locationId,'location-test-lake');
 applyCatchField(c,'location','Synthetic North Cove',entries);
 assert.equal(c.locationId,undefined);
 assert.equal(c.locationName,'Synthetic North Cove');
 validateRecords({...source,catches:{schemaVersion:2,catches:[c]}});
});
test('D4-UX03 Lure typeahead, Other and unlisted entries are canonical names',()=>{
 const c={id:'p3-test-catch-three',date:'2026-10-29'};
 const options=lureCatchChoices(source);
 assert(options.suggestions.includes('Test Spinner'));
 assert(options.suggestions.includes('Other'));
 applyCatchField(c,'lureOrBait','test spinner',options.linked);
 assert.equal(c.lureOrBaitId,'p3-test-spinner');
 applyCatchField(c,'lureOrBait','Other',options.linked);
 assert.equal(c.lureOrBaitId,undefined);
 assert.equal(c.lureOrBaitName,'Other');
 validateRecords({...source,catches:{schemaVersion:2,catches:[c]}});
});
test('D4-UX04 only one of Name and Id allowed for each Catch reference',()=>{
 for(const prefix of ['species','location','lureOrBait']){
  const c={id:'p3-test-catch-invalid',date:'2026-10-29',
   [prefix+'Id']:prefix==='lureOrBait'?'p3-test-spinner':
    prefix==='species'?'species-test-bass':'location-test-lake',
   [prefix+'Name']:'Synthetic duplicate'};
  assert.throws(()=>validateRecords({...source,
   catches:{schemaVersion:2,catches:[c]}}));
 }
});
test('D4-UX05 only private sandbox uses special p3-test Catch IDs',()=>{
 const c={date:'2026-10-29',speciesName:'Synthetic Bass',
  locationName:'Synthetic Lake'};
 assert.match(suggestedCatchId(c,new Set(),{sandboxOnly:true}),
  /^p3-test-catch-/);
 assert.match(suggestedCatchId(c,new Set()),/^catch-/);
});
test('D4-UX06 Catch uses Markdown preview and no redundant photo/GPS hint',()=>{
 const editor=readFileSync(new URL('../src/catch-editor.mjs',import.meta.url),'utf8');
 assert(editor.includes("'Preview Markdown'"));
 assert(editor.includes('sanitizeHtml(parsed.html,window)'));
 assert(editor.includes('locationEntry'));
 assert(editor.includes('speciesField,locationField,lureField'));
 assert(!editor.includes("'Existing notes and referenced media stay intact. Catch photos and GPS are not supported.'"));
});
test('D4-UX07 absent Gear picture sequence never leaks to strict record schema',()=>{
 const editor=readFileSync(new URL('../src/editor.mjs',import.meta.url),'utf8');
 assert(editor.includes("if(candidate.pictureSequence===undefined)delete candidate.pictureSequence;"));
 assert(editor.includes("if(baseRecord.pictureSequence===undefined)delete record.pictureSequence;"));
});

test('D4-UX08 accepted Gear/KB and Catch retain visible form and replace only actions',()=>{
 const gear=readFileSync(new URL('../src/editor.mjs',import.meta.url),'utf8');
 const catchSource=readFileSync(new URL('../src/catch-editor.mjs',import.meta.url),'utf8');
 for(const src of [gear,catchSource]){
  assert(!src.includes('form.hidden=true;'));
  assert(src.includes("actions.replaceChildren(button('Exit',onExit,{variant:'primary'}))"));
  assert(src.includes('Publication accepted. Verification and publishing are in progress. You may leave the editor and check publication status in the Connection Status screen.'));
  assert(!src.includes("'Operation ID'"));
  assert(src.includes("control.disabled=true"));
 }
 assert(gear.includes("if(!saveAccepted)prepareButton.disabled=false"));
 assert(catchSource.includes("if(!accepted)submit.disabled=false"));
});
test('D4-UX09 pilot creates prefixed Knot ID and rejects manual unsafe test ID',()=>{
 const gear=readFileSync(new URL('../src/editor.mjs',import.meta.url),'utf8');
 assert(gear.includes('suggestedItemId(domain,c.value'));
 assert(gear.includes('sandboxOnly:ctx.v3?.source?.sandboxOnly===true'));
 assert(gear.includes('readonly:true'));
 assert(!gear.includes("idInput.addEventListener('input'"));
 assert(gear.includes("!record.id.startsWith('p3-')"));
 assert(gear.indexOf("!record.id.startsWith('p3-')") < gear.indexOf('const files=sequenceSet?'));
});
test('D4-UX10 Live owner source revision refresh is pilot-only and editor-safe',()=>{
 const shell=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert(shell.includes('sourceRefreshChecked'));
 assert(shell.includes("state.publication==='Live'&&state.sandboxVerified===true"));
 assert(shell.includes("['Failed','Conflict'].includes(state.publication)"));
 assert(shell.includes('latest!==ctx.release.sourceRevision'));
 assert(shell.includes("window.location.reload()"));
 assert(shell.includes("'kb-edit','kb-add'"));
});

test('D4-UX11 all Gear and KB subtypes use non-editable ID input',()=>{
 const editor=readFileSync(new URL('../src/editor.mjs',import.meta.url),'utf8');
 const catchEditor=readFileSync(new URL('../src/catch-editor.mjs',import.meta.url),'utf8');
 assert(editor.includes('suggestedItemId(domain,c.value'));
 assert(editor.includes("readonly:true"));
 assert(editor.includes("'ID (generated automatically)'"));
 assert(!editor.includes("idInput.addEventListener('input'"));
 assert(catchEditor.includes("readonly:true,value:record.id"));
 assert(catchEditor.includes("baseRecord?'ID':'ID (generated automatically)'"));
 assert(editor.includes("field(editing?'ID':"));
 assert(!editor.includes('fixed after publication'));
 assert(!catchEditor.includes('fixed after publication'));
});
test('D4-UX12 generated Gear and KB IDs are collision-safe, stable and capped at schema limit',()=>{
 for(const domain of ['gear','kb']){
  const existing=new Set(['p3-test-knot','p3-test-knot-2']);
  const id=suggestedItemId(domain,'Test Knot',existing,{sandboxOnly:true});
  assert.equal(id,'p3-test-knot-3');
  assert(!existing.has(id));
  assert(ID_PATTERN.test(id));
  assert.equal(suggestedItemId(domain,'Rod & Reel!',new Set()),'rod-reel');
  const long='A'.repeat(320);
  const truncated=suggestedItemId(domain,long,new Set());
  assert.equal(truncated.length,160);
  assert(ID_PATTERN.test(truncated));
  const colliding=suggestedItemId(domain,long,new Set([truncated]));
  assert.equal(colliding.length,160);
  assert(colliding.endsWith('-2'));
  assert(ID_PATTERN.test(colliding));
 }
 assert.throws(()=>suggestedItemId('catches','Test',new Set()));
});
test('D4-UX13 changing new item Name after media selection recalculates image path',()=>{
 const editor=readFileSync(new URL('../src/editor.mjs',import.meta.url),'utf8');
 assert(editor.includes('const path=picturePath(domain,record,fileInfo.name);'));
 assert(editor.includes('record.picture.src=path;picturePathInput.value=path;'));
 assert(editor.includes('recalcSequencePaths();'));
});
test('D4-UX14 Catch detail displays owner-only Edit item before early return',()=>{
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 const start=ui.indexOf("if(domain==='catches'){",ui.indexOf('async function renderDetail'));
 const stop=ui.indexOf('appendPicture(page,record,domain);',start);
 assert(start>=0&&stop>start);
 const branch=ui.slice(start,stop);
 assert.match(branch,/if\(v3Mode&&canAuthor\(\)\)/);
 assert(branch.includes("page.append(anchor('Edit item',`#/catches/edit/${record.id}`,'page-edit-link'))"));
 assert(branch.indexOf("page.append(anchor('Edit item'")<branch.lastIndexOf('return page;'));
 assert(ui.includes("case 'catch-edit':page=await renderCatchEditor(route.id)"));
 assert(ui.includes("if(!v3Mode||!canAuthor())return missing('Owner sign-in is required to edit Catches."));
});
