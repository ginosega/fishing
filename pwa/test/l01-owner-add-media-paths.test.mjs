import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {picturePath,newNarrativePath} from '../src/d6-v3-content-paths.mjs';
import {validateD6MediaOwnerPath} from '../src/d6-content-media-contract.mjs';

test('L01 new Gear and KB covers are record-owned despite matching upload names',()=>{
 for(const [domain,kind] of [['gear','lures'],['kb','species']]){
  const record=id=>({id,name:'Duplicate Label',
   ...(domain==='gear'?{category:kind}:{type:kind})});
  const a=record('duplicate-label'),b=record('duplicate-label-2');
  assert.notEqual(picturePath(domain,a,'image.jpg'),
   picturePath(domain,b,'image.jpg'));
  assert.equal(picturePath(domain,a,'another-file.jpg'),
   picturePath(domain,a,'image.jpg'));
  for(const item of [a,b]){
   const path=picturePath(domain,item,'image.jpg');
   assert.equal(validateD6MediaOwnerPath({domain,record:item,
    logicalPath:path,role:'cover'}).logicalPath,path);
   assert.match(newNarrativePath(domain,item),
    new RegExp('/content/'+item.id+'\\.md$'));
  }
  assert.notEqual(newNarrativePath(domain,a),newNarrativePath(domain,b),
   'two same-name records must not share an editable D1 Notes path');
 }
});

test('L01 cover paths recalculate when category/type changes',()=>{
 const gear={id:'same-name',name:'Test',category:'lures'};
 assert.equal(picturePath('gear',gear,'selected.png'),
  'Gear/Lures/assets/same-name-cover.png');
 assert.equal(picturePath('gear',{...gear,category:'accessories'},
  'selected.png'),'Gear/Equipment/assets/same-name-cover.png');
 const kb={id:'same-name',name:'Test',type:'species'};
 assert.equal(picturePath('kb',kb,'selected.png'),
  'KB/Species/assets/same-name-cover.png');
 assert.equal(picturePath('kb',{...kb,type:'technique'},
  'selected.png'),'KB/Techniques/assets/same-name-cover.png');
 assert.match(picturePath('gear',{...gear,id:'a'.repeat(160)},'x.webp'),
  /a{160}-cover\.webp$/);
 assert.throws(()=>picturePath('gear',{...gear,id:''},'x.png'),
  /Enter an item name/);
 assert.throws(()=>picturePath('gear',gear,'untrusted.svg'),
  /Unsupported picture/);
});

test('L01 direct editor offers file upload, not an editable GitHub repository path',()=>{
 const source=readFileSync(new URL('../src/d6-approved-owner-editor-preview.mjs',
  import.meta.url),'utf8');
 assert.doesNotMatch(source,/field\('Repository picture path'/);
 assert.doesNotMatch(source,/Repository-relative picture path/);
 assert.match(source,/refreshSelectedPicturePath\(\)/);
 assert.match(source,/newNarrativePath\(domain,candidate\)/);
 assert.match(source,/The original picture uploads with Save/);
});
