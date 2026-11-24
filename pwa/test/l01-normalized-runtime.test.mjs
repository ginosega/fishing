import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

// Exercise actual shared/Worker validators with the same compile-time selection
// as the standalone browser and private Worker, not only the archived fixtures.
test('L01 normalized runtime schema, preview, links, media and snapshot version agree',async()=>{
 const pwa=fileURLToPath(new URL('../',import.meta.url));
 const dir=await mkdtemp(join(pwa,'.l01-normalized-test-'));
 try{
  const result=await build({stdin:{resolveDir:pwa,sourcefile:'normalized-test.mjs',contents:
   "export * from './src/shared.mjs';\n"+
   "export * from './src/validation.mjs';\n"+
   "export * from './src/editor-preview.mjs';\n"+
   "export * from './src/d6-original-id-ledger.mjs';\n"+
   "export * from './src/d6-normalized-id-ledger.mjs';\n"+
   "export * from './src/d6-content-media-contract.mjs';\n"+
   "export * from './server/d6-current-content-snapshot.mjs';\n"+
   "export {suggestedCatchId} from './src/d6-direct-catch-editor.mjs';"},
   bundle:true,platform:'node',format:'esm',packages:'external',write:false,
   define:{__FISHING_D6_STANDALONE_V3__:'true'}});
  const file=join(dir,'runtime.mjs');await writeFile(file,result.outputFiles[0].contents);
  const runtime=await import(pathToFileURL(file).href);
  const gear={id:'paddle',name:'Paddle',category:'equipment',type:'Kayaks',notes:'Gear/Equipment/content/paddle.md'};
  const guide={id:'fishing-line',name:'Fishing Line',type:'gear-guides',content:'KB/Gear-Guides/content/fishing-line.md'};
  const location={id:'lake-washington',name:'Lake Washington',type:'locations',content:'KB/Locations/content/lake-washington.md'};
  const species={id:'perch',name:'Perch',type:'species',content:'KB/Species/content/perch.md'};
  const knot={id:'palomar-knot',name:'Palomar Knot',type:'knots',content:'KB/Knots/content/palomar.md',pictureSequence:['KB/Knots/assets/palomar-knot/step-01.jpg','KB/Knots/assets/palomar-knot/step-02.jpg'],picture:{src:'KB/Knots/assets/palomar-knot/step-02.jpg'}};
  const caught={id:'2026-11-24-lake-washington-perch',date:'2026-11-24',speciesId:species.id,locationId:location.id};
  const data={gear:{schemaVersion:2,items:[gear]},kb:{schemaVersion:2,entities:[guide,location,species,knot]},catches:{schemaVersion:2,catches:[caught]}};
  const maps=runtime.validateRecords(data);
  runtime.validateLibraryPaths(data);
  assert.equal(runtime.categoryFolder('gear','equipment'),'Gear/Equipment');
  assert.equal(runtime.internalLink('kb://fishing-line',maps),'#/kb/gear-guides/fishing-line');
  assert.equal(runtime.internalLink('site://gear',maps),'#/gear');
  assert.equal(runtime.draftNotesPreviewOptions({data,maps,base:'https://example.invalid/fishing/'},'kb',guide).pathRoutes.get(guide.content),'#/kb/gear-guides/fishing-line');
  assert.equal(runtime.d6ValidKnotSequence(knot),true);
  assert.equal(runtime.validateD6MediaOwnerPath({domain:'kb',record:knot,logicalPath:knot.picture.src,role:'knot-step'}).role,'knot-step');
  assert.equal(runtime.suggestedCatchId(caught,new Set()),caught.id);
  assert.equal(runtime.newId('Add',new Set()),'add-2');
  assert.throws(()=>runtime.validateRecord({...guide,type:'equipment'},'kb',data));
  assert.throws(()=>runtime.validateRecord({...guide,id:'edit'},'kb',data));
  for(const [domain,ids] of Object.entries(runtime.D6_NORMALIZED_IDS))
   assert(runtime.verifyD6OriginalIds(domain,ids.map(id=>({id}))));
  assert(!runtime.verifyD6OriginalIds('kb',runtime.D6_ORIGINAL_IDS.kb.map(id=>({id}))));
  const snapshot={format:'fishing-content-snapshot-v1',schemaVersions:{gear:2,kb:2,catches:2}};
  assert.equal(runtime.D6_CONTENT_READER_VERSION,2);
  assert(runtime.isD6CurrentContentSnapshotCompatible({...snapshot,readerCompatibility:{min:2,max:2}}));
  assert(!runtime.isD6CurrentContentSnapshotCompatible({...snapshot,readerCompatibility:{min:1,max:1}}));
 }finally{await rm(dir,{recursive:true,force:true});}
});
