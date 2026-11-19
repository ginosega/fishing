import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareD6GearMigration} from '../tools/d6-gear-migration.mjs';
import {reconcileD6Gear} from '../tools/d6-gear-reconcile.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ORIGIN='https://fishing-d6-wp2-test.ginosega.workers.dev';
const RELEASE='a'.repeat(32);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=value=>new Response(JSON.stringify(value),{
 status:200,headers:{'Content-Type':'application/json; charset=utf-8'},
});
let prepared;
async function setup({corruptId=null,missingAsset=false,omittedAssetPath=null,corruptAssetPath=null}={}){
 prepared??=await prepareD6GearMigration();
 const {report}=prepared;
 const bundle=JSON.parse(await readFile(path.join(ROOT,'Gear','gear.json'),'utf8'));
 const records=new Map(bundle.items.map(row=>[row.id,row]));
 const absent=missingAsset?report.records[0].picturePath:omittedAssetPath;
 const manifest={releaseId:RELEASE,d6DirectGearSave:true,base:'/fishing/',
  files:report.assets.filter(x=>x.path!==absent).map(x=>({
   path:'releases/'+RELEASE+'/content/'+x.path,
   sha256:x.path===corruptAssetPath?'0'.repeat(64):x.sha256,bytes:x.bytes,
  })),
 };
 const manifestBytes=Buffer.from(JSON.stringify(manifest));
 const pointer={id:RELEASE,manifest:'releases/'+RELEASE+'/manifest.json',
  manifestSha256:digest(manifestBytes),d6DirectGearSave:true};
 let reads=0;
 const fetchImpl=async url=>{
  reads++;
  const pathname=new URL(url).pathname;
  if(pathname==='/fishing/release.json')return json(pointer);
  if(pathname==='/fishing/releases/'+RELEASE+'/manifest.json')
   return new Response(manifestBytes,{status:200});
  if(pathname==='/api/v3/content/gear')
   return json({ok:true,count:100,items:bundle.items});
  const match=/^\/api\/v3\/content\/gear\/([a-z0-9-]+)$/.exec(pathname);
  if(!match)return new Response('Unavailable',{status:404});
  const row=records.get(match[1]);
  if(!row)return new Response('Unavailable',{status:404});
  let notes=row.notes?await readFile(path.join(ROOT,...row.notes.split('/')),'utf8'):'';
  if(row.id===corruptId)notes+='tampered';
  return json({ok:true,record:row,
   notes,revision:row.id==='daiwa-tatula-xt-rod'?3:1});
 };
 return {report,fetchImpl,reads:()=>reads};
}

test('V3-GEAR-RECON01 100 records, 63 Notes and all images reconcile read-only',async()=>{
 const x=await setup();
 const result=await reconcileD6Gear({report:x.report,fetchImpl:x.fetchImpl});
 assert.equal(result.outcome,'PASS');
 assert.equal(result.records,100);
 assert.equal(result.notes,63);
 assert.equal(result.pictures,100);
 assert.equal(result.sourceImageFiles,112);
 assert.equal(result.publishedImageFiles,112);
 assert.deepEqual(result.unreferencedSourceImages,[]);
 assert.equal(result.pilotRevision,3);
 assert.equal(x.reads(),103);
});

test('V3-GEAR-RECON02 any Notes or media mismatch fails before acceptance',async()=>{
 const x=await setup({corruptId:'shimano-zodias-rod'});
 await assert.rejects(
  reconcileD6Gear({report:x.report,fetchImpl:x.fetchImpl}),
  /Gear Notes differ/);
 const missing=await setup({missingAsset:true});
 await assert.rejects(
  reconcileD6Gear({report:missing.report,fetchImpl:missing.fetchImpl}),
  /Referenced Gear image missing from hosted release/);
});

test('V3-GEAR-RECON03 only the exact approved isolated origin is accepted',async()=>{
 const x=await setup();
 await assert.rejects(reconcileD6Gear({report:x.report,
  origin:'https://fishing.ginosega.workers.dev',fetchImpl:x.fetchImpl}),
  /Only the approved private origin/);
});

test('V3-GEAR-RECON04 unreferenced original Gear images are reported but not required in release',async()=>{
 const absent='Gear/Equipment/content/Garmin Force Current.png';
 const x=await setup({omittedAssetPath:absent});
 const result=await reconcileD6Gear({report:x.report,fetchImpl:x.fetchImpl});
 assert.equal(result.outcome,'PASS');
 assert.equal(result.records,100);
 assert.equal(result.sourceImageFiles,112);
 assert.equal(result.publishedImageFiles,111);
 assert.deepEqual(result.unreferencedSourceImages,[absent]);
});

test('V3-GEAR-RECON05 missing linked Notes image fails',async()=>{
 const absent='Gear/Equipment/content/Wireless Foot Pedals.png';
 const x=await setup({omittedAssetPath:absent});
 await assert.rejects(
  reconcileD6Gear({report:x.report,fetchImpl:x.fetchImpl}),
  /Referenced Gear image missing from hosted release/);
});

test('V3-GEAR-RECON06 altered hosted Gear image digest fails',async()=>{
 const x=await setup({corruptAssetPath:'Gear/Equipment/content/Wireless Foot Pedals.png'});
 await assert.rejects(
  reconcileD6Gear({report:x.report,fetchImpl:x.fetchImpl}),
  /Gear media changed/);
});
