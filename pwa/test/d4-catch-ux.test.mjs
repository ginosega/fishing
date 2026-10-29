import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyCatchField,catchFieldValue,speciesCatchChoices,
 lureCatchChoices} from '../src/catch-fields.mjs';
import {validateRecords} from '../src/validation.mjs';
import {suggestedCatchId} from '../src/catch-editor.mjs';
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

test('D4-UX08 server-accepted Gear/KB and Catch hide Save/Cancel form and offer Exit',()=>{
 const gear=readFileSync(new URL('../src/editor.mjs',import.meta.url),'utf8');
 const catchSource=readFileSync(new URL('../src/catch-editor.mjs',import.meta.url),'utf8');
 assert(gear.includes('form.hidden=true;'));
 assert(catchSource.includes('form.hidden=true;'));
 for(const source of [gear,catchSource]){
  assert(source.includes("toolbar(button('Exit',onExit,{variant:'primary'}))"));
  assert(source.indexOf('form.hidden=true;') > source.indexOf("accepted=true") ||
    source.includes('saveAccepted=true'));
 }
 assert(gear.includes("if(!saveAccepted)prepareButton.disabled=false"));
 assert(catchSource.includes("if(!accepted)submit.disabled=false"));
});
