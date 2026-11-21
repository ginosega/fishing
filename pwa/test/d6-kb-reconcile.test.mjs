import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reconcileD6KB} from '../tools/d6-kb-reconcile.mjs';

const origin='https://fishing-d6-wp2-test.ginosega.workers.dev';
const release='b'.repeat(32);
const hash=x=>createHash('sha256').update(x).digest('hex');
const kb=i=>({id:'kb-test-'+i,type:'location',name:'Lake '+i,
 content:'KB/Locations/content/test-'+i+'.md',
 ...(i===0?{picture:{src:'KB/Locations/assets/test-0.jpg'}}:{})});
function setup({omitPicture=false,alterMarkdown=false,partial=false}={}){
 const entries=Array.from({length:60},(_,i)=>kb(i));
 const report={format:'d6-direct-kb-import-v1',
  source:{kbGitBlobSha1:'39217633803ad3969d710fa8d770197c0e83b2a3'},
  records:entries.map((item,i)=>({
   id:item.id,type:item.type,contentPath:item.content,
   picturePath:item.picture?.src??null,sequencePaths:[],
   recordSha256:hash(Buffer.from(JSON.stringify(item))),
   markdownSha256:hash(Buffer.from('Text '+i)),
  })),
  assets:Array.from({length:154},(_,i)=>({
   path:'KB/Locations/assets/test-'+i+'.jpg',
   sha256:hash('asset'+i),bytes:100+i,
  })),
  externalAssets:Array.from({length:8},(_,i)=>({
   path:'Gear/Lures/assets/external-'+i+'.jpg',
   sha256:hash('external'+i),bytes:200+i,
  })),
 };
 const files=(omitPicture?[]:[report.assets[0]]).map(x=>({
  path:'releases/'+release+'/content/'+x.path,
  sha256:x.sha256,bytes:x.bytes,
 }));
 const manifest={releaseId:release,base:'/fishing/',d6DirectKBSave:true,files};
 const bytes=Buffer.from(JSON.stringify(manifest));
 const pointer={id:release,manifest:'releases/'+release+'/manifest.json',
  manifestSha256:hash(bytes),d6DirectGearSave:true,d6DirectKBSave:true};
 const rows=entries.map((item,i)=>({
  ok:true,record:item,revision:1,markdown:alterMarkdown&&i===0?'tampered':'Text '+i,
 }));
 const fetchImpl=async url=>{
  let data;
  if(url===origin+'/fishing/release.json')data=pointer;
  else if(url===origin+'/fishing/releases/'+release+'/manifest.json')
   return new Response(bytes,{status:200,headers:{'Content-Type':'application/json'}});
  else if(url===origin+'/api/v3/content/kb')data={ok:true,count:partial?59:60,
   items:partial?entries.slice(0,59):entries};
  else{
   const id=url.split('/').at(-1);
   data=rows.find(row=>row.record.id===id);
  }
  return data?new Response(JSON.stringify(data),{
   status:200,headers:{'Content-Type':'application/json'},
  }):new Response('Not found',{status:404});
 };
 return {report,fetchImpl};
}
test('V3-KB-RECON01 exact 60 rows and referenced images pass with unused source assets',async()=>{
 const fixture=setup();
 const out=await reconcileD6KB(fixture);
 assert.equal(out.outcome,'PASS');
 assert.equal(out.records,60);
 assert.equal(out.markdown,60);
 assert.equal(out.pictures,1);
 assert.equal(out.sourceKBImageFiles,154);
 assert.equal(out.externalGearImageFiles,8);
 assert.equal(out.publishedImageFiles,1);
 assert.equal(out.unusedSourceImages.length,161);
});
test('V3-KB-RECON02 missing referenced picture fails, not ignored as unused',async()=>{
 const fixture=setup({omitPicture:true});
 await assert.rejects(reconcileD6KB(fixture),/Linked KB image not published/);
});
test('V3-KB-RECON03 data corruption and partial migration cannot reconcile',async()=>{
 await assert.rejects(reconcileD6KB(setup({alterMarkdown:true})),
  /KB Markdown differs/);
 await assert.rejects(reconcileD6KB(setup({partial:true})),
  /collection incomplete/);
});
