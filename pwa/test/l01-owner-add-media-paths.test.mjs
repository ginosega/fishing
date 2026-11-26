import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {picturePath,newNarrativePath} from '../src/d6-v3-content-paths.mjs';
import {validateD6MediaOwnerPath} from '../src/d6-content-media-contract.mjs';
import {saveD6OwnerEditorMedia} from '../src/d6-owner-media-editor-save.mjs';
import {noteImagePath,noteImageReference} from '../src/notes-markdown-editor.mjs';

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

test('L01 Gear and KB Add stage a generated cover and Notes picture in one revision-zero Save',async()=>{
 for(const [domain,kind] of [['gear','lures'],['kb','species']]){
  const record={id:'new-owner',name:'New Owner',
   ...(domain==='gear'?{category:kind,type:'Spoons',
    specifications:[],links:[]}:{type:kind})};
  const cover=picturePath(domain,record,'my-picture.png');
  const notes=noteImagePath(domain,record,'detail.png');
  record.picture={src:cover};
  record[domain==='gear'?'notes':'content']=newNarrativePath(domain,record);
  const calls=[];
  const coordinator={
   ready:()=>true,
   stage:async({logicalPath,role})=>{
    calls.push({stage:logicalPath,role});
    return {logicalPath,role};
   },
   publish:async({record:saved,expectedRevision,staged})=>{
    assert.equal(expectedRevision,0,'Add must be insert-only');
    assert.equal(staged.length,2);
    calls.push({publish:saved.id});
    return {verified:true,record:saved,revision:1};
   },
  };
  const file={name:'upload.png',arrayBuffer:async()=>new ArrayBuffer(4)};
  const markdown='![Detail]('+noteImageReference(notes)+')';
  const result=await saveD6OwnerEditorMedia({
   domain,record,markdown,expectedRevision:0,
   uploads:[{path:cover,role:'cover',file},
    {path:notes,role:'notes',file}],
   capabilities:{canUploadNewImages:true},coordinator,
  });
  assert.equal(result.revision,1);
  assert.deepEqual(calls,[{stage:cover,role:'cover'},
   {stage:notes,role:'notes'},{publish:record.id}]);
 }
});
