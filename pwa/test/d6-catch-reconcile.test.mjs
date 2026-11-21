import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reconcileD6Catches} from '../tools/d6-catch-reconcile.mjs';
const origin='https://fishing-d6-wp2-test.ginosega.workers.dev';
const release='c'.repeat(32);
const hash=x=>createHash('sha256').update(x).digest('hex');
const cat=i=>({id:'catch-test-'+i,date:'2026-11-19',
 notes:'Catches/content/catch-test-'+i+'.md'});
function fixture({omitPicture=false,alterNotes=false,partial=false}={}){
 const items=Array.from({length:12},(_,i)=>cat(i));
 const bodies=items.map((r,i)=>'Notes '+i+
  (i<8?'\n\n![Catch photo](./catch-test-'+i+'.png)':''));
 const assets=Array.from({length:8},(_,i)=>({
  path:'Catches/content/catch-test-'+i+'.png',
  sha256:hash('Photo '+i),bytes:100+i,
 }));
 const report={format:'d6-direct-catch-import-v1',
  source:{catchGitBlobSha1:'1522cf990f3ac6422ef17970793ec86604007a5a'},
  records:items.map((r,i)=>({id:r.id,notesPath:r.notes,
   recordSha256:hash(JSON.stringify(r)),notesSha256:hash(bodies[i]),
   inlineImagePaths:i<8?[assets[i].path]:[],
  })),assets};
 const paths=(omitPicture?assets.slice(1):assets).map(x=>({
  path:'releases/'+release+'/content/'+x.path,
  bytes:x.bytes,sha256:x.sha256,
 }));
 const manifest={releaseId:release,base:'/fishing/',
  d6DirectCatchSave:true,files:paths};
 const manifestBytes=Buffer.from(JSON.stringify(manifest));
 const pointer={id:release,
  manifest:'releases/'+release+'/manifest.json',
  manifestSha256:hash(manifestBytes),
  d6DirectGearSave:true,d6DirectKBSave:true,d6DirectCatchSave:true,
 };
 const rows=items.map((record,i)=>({ok:true,record,revision:1,
  notes:alterNotes&&i===0?'tampered':bodies[i]}));
 const fetchImpl=async url=>{
  if(url===origin+'/fishing/releases/'+release+'/manifest.json')
   return new Response(manifestBytes,{status:200,
    headers:{'Content-Type':'application/json'}});
  let data;
  if(url===origin+'/fishing/release.json')data=pointer;
  else if(url===origin+'/api/v3/content/catches')
   data={ok:true,count:partial?11:12,
    items:partial?items.slice(0,11):items};
  else data=rows.find(x=>x.record.id===url.split('/').at(-1));
  return data?new Response(JSON.stringify(data),{
   status:200,headers:{'Content-Type':'application/json'},
  }):new Response('Not found',{status:404});
 };
 return {report,fetchImpl};
}
test('V3-CATCH-RECON01 all 12 Notes and 8 hosted photos reconcile',async()=>{
 const result=await reconcileD6Catches(fixture());
 assert.equal(result.outcome,'PASS');
 assert.equal(result.records,12);
 assert.equal(result.notes,12);
 assert.equal(result.inlineImages,8);
 assert.equal(result.sourceImageFiles,8);
 assert.equal(result.publishedImageFiles,8);
});
test('V3-CATCH-RECON02 missing original Catch photograph blocks acceptance',async()=>{
 await assert.rejects(reconcileD6Catches(fixture({omitPicture:true})),
  /referenced Catch photo not hosted/);
});
test('V3-CATCH-RECON03 corrupt Notes or incomplete D1 blocks acceptance',async()=>{
 await assert.rejects(reconcileD6Catches(fixture({alterNotes:true})),
  /Original Catch Notes differ/);
 await assert.rejects(reconcileD6Catches(fixture({partial:true})),
  /Original Catch migration incomplete/);
});
