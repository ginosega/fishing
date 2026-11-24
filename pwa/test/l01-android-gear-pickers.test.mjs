import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GEAR_CATEGORIES,gearCategoryKey,gearCategoryChoices} from '../src/shared.mjs';
import {TAXONOMY} from '../src/validation.mjs';

const source=readFileSync(new URL(
 '../src/d6-approved-owner-editor-preview.mjs',import.meta.url),'utf8');

test('L01-ANDROID03 Category and Type are native select lists, never mobile datalist controls',()=>{
 assert.match(source,/const categorySelect=select\(categoryRows,record\.category/);
 assert.match(source,/typeSelect=select\(\[\],record\.type/);
 assert.match(source,/categoryControls\.append\(/);
 assert.match(source,/field\('Category',categorySelect\)/);
 assert.match(source,/field\('Type',typeSelect\)/);
 assert.doesNotMatch(source,/el\('datalist'/);
 assert.doesNotMatch(source,/setAttribute\('list'/);
 assert.match(source,/updateTypes\(false\)/);
 assert.match(source,/if\(record\.type&&!choices\.includes\(record\.type\)\)/);
});

test('L01-ANDROID04 Add new actions preserve native browsing and editable new values',()=>{
 for(const label of ['Category','Type'])
  assert.match(source,new RegExp("addValueControl\\(\\{label:'"+label+"'"));
 assert.match(source,/button\('Add new '\+label\.toLowerCase\(\)/);
 assert.match(source,/button\('Use '\+label\.toLowerCase\(\)/);
 assert.match(source,/button\('Cancel new '\+label\.toLowerCase\(\)/);
 assert.match(source,/const key=gearCategoryKey\(label\)/);
 assert.match(source,/categorySelect\.append\(el\('option'/);
 assert.match(source,/typeSelect\.append\(el\('option'/);
 assert.match(source,/refreshSelectedPicturePath\(\)/);
 assert.match(source,/notesEditor\?\.syncPaths\(\)/);
 assert.equal(gearCategoryKey('Weights'),'weights');
 assert(TAXONOMY.weights.includes('Cannonball sinkers'));
 assert(GEAR_CATEGORIES.some(x=>x[0]==='accessories'&&x[1]==='Equipment'));
 assert(gearCategoryChoices([]).some(x=>x[0]==='weights'));
});
