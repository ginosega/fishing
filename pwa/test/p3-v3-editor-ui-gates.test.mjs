import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const editor=readFileSync(new URL('../src/editor.mjs',import.meta.url),'utf8');
const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
const entry=readFileSync(new URL('../src/entry.mjs',import.meta.url),'utf8');

test('FISH118 D3 beta editor Save/Publish is strictly opt-in; v2 manual authoring remains',()=>{
 assert.match(editor,/publishChange=null/);
 assert.match(editor,/publishChange\?'Save and Publish':'Prepare Changes'/);
 assert.match(editor,/if\(publishChange\)/);
 assert.match(editor,/const receipt=await publishChange\(prepared,files\)/);
 assert.match(editor,/if\(publishChange&&!ctx\.v3\?\.stageMedia\)/);
 assert.match(editor,/receipt\?\.accepted!==true/);
 assert.match(editor,/saveAccepted=true/);
 assert.match(editor,/const dirty=\(\)=>!saveAccepted/);
 assert.match(editor,/if\(savePending\|\|saveAccepted\)return/);
 assert.match(editor,/Your edit is preserved/);
 assert.match(editor,/Publication accepted\. Verification and publishing are in progress\./);
 assert.match(editor,/actions\.replaceChildren\(button\('Exit'/);
 assert.match(editor,/Copy Changes/); // historic v2 remains for current public app
 assert.match(editor,/onPrepared\?\.\(receipt\)/);
});

test('FISH118 D3 inactive owner UI hides Add/Edit and rejects deep-link editor when anonymous',()=>{
 assert.match(ui,/const v3Mode=ctx\.v3\?\.enabled===true/);
 assert.match(ui,/const canAuthor=\(\)=>!v3Mode\|\|\(ctx\.v3\?\.authorized===true&&typeof ctx\.v3\?\.publish==='function'\)/);
 assert.match(ui,/if\(!canAuthor\(\)\)return missing\('Owner sign-in is required to edit/);
 assert.match(ui,/page\.append\(categories,searchResults,\.\.\.\(canAuthor\(\)\?/);
 assert.match(ui,/page\.append\(list\.element,\.\.\.\(canAuthor\(\)\?/);
 assert.match(ui,/if\(canAuthor\(\)&&\(domain!==\x27catches\x27\|\|v3Mode\)\)page\.append\(anchor\('Edit item'/);
 assert.match(ui,/if\(v3Mode&&canAuthor\(\)\)page\.querySelector\('\.page-actions'\)\.prepend\(anchor\('Add Catch'/);
 assert.match(ui,/if\(!v3Mode\|\|!canAuthor\(\)\)return missing\('Owner sign-in is required to edit Catches/);
 assert.match(ui,/publishChange:v3Mode\?ctx\.v3\.publish:null/);
 assert.match(ui,/ctx\.v3\.onPublicationReceipt=receipt=>/);
 assert.match(ui,/ownerController\.refreshPublication\(\)/);
 assert(!app.includes('ctx.v3='));
 assert(!entry.includes('v3:{enabled:true'));
});
