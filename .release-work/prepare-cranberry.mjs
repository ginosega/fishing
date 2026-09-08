import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';

const oldVersion='2026-09-08-kb-v1-rods-reels-caption-1';
const newVersion='2026-09-08-kb-v1-cranberry-lake-picture-1';
const read=p=>fs.readFile(p,'utf8');
const write=(p,s)=>fs.writeFile(p,s);
const replaceOnce=(s,oldText,newText)=>{
  assert.ok(s.includes(oldText),`Expected source fragment missing: ${oldText.slice(0,100)}`);
  return s.replace(oldText,newText);
};

const joyride='pwa/accepted-2026-09-08-joyride-caption.test.mjs';
let s=await read(joyride);
s=s.replaceAll(oldVersion,newVersion);
s=replaceOnce(s,"import crypto from 'node:crypto';\n",'');
s=replaceOnce(s,"import {readValidatedImage} from './image-validation.mjs';","import {readValidatedImage,detectImageType} from './image-validation.mjs';");
s=replaceOnce(s,"const bytes=await readValidatedImage(fileURLToPath(new URL(entry.source,import.meta.url))); const blob=crypto.createHash('sha1').update('blob '+bytes.length+'\\0').update(bytes).digest('hex'); assert.equal(blob,'f24403f79788755e267ee721f5e93c34c3f8f472'); assert.equal(bytes.length,562530);","const bytes=await readValidatedImage(fileURLToPath(new URL(entry.source,import.meta.url))); assert.equal(detectImageType(bytes,entry.source),'png'); assert.ok(bytes.length>0); // User-maintained image bytes are mutable; final output must match the current source.");
await write(joyride,s);

const accepted='pwa/accepted-2026-09-08.test.mjs';
s=await read(accepted);
s=s.replaceAll(oldVersion,newVersion);
s=replaceOnce(s,"import crypto from 'node:crypto';\n",'');
s=replaceOnce(s,"const digest=bytes=>crypto.createHash('sha1').update('blob '+bytes.length+'\\0').update(bytes).digest('hex');\n",'');
s=s.replace(/,"markdownBlob":"[0-9a-f]{40}"/g,'').replace(/,"imageBlob":"[0-9a-f]{40}"/g,'').replace(/,"imageBytes":\d+/g,'');
s=replaceOnce(s,"  assert.equal(bytes.length,p.imageBytes);\n  assert.equal(digest(bytes),p.imageBlob);","  assert.ok(bytes.length>0);");
s=replaceOnce(s,"  assert.equal(digest(markdown),p.markdownBlob);","  assert.ok(markdown.length>0);");
s=replaceOnce(s,"   assert.ok(read('./dist/kb-assets.json').includes('./assets/kb/entries/'+p.filename));","   assert.ok(read('./dist/kb-assets.json').includes('./assets/kb/entries/'+p.filename));\n   assert.deepEqual(fs.readFileSync(new URL('./dist/'+p.path.slice(2),import.meta.url)),fs.readFileSync(new URL('./'+p.path.slice(2),import.meta.url)));");
await write(accepted,s);

const workflow='.github/workflows/fishing-pwa-build.yml';
s=await read(workflow);
s=s.replaceAll(oldVersion,newVersion);
s=replaceOnce(s,'          node --check pwa/accepted-2026-09-08-joyride-caption.test.mjs','          node --check pwa/accepted-2026-09-08-joyride-caption.test.mjs\n          node --check pwa/cranberry-lake-picture.test.mjs');
s=replaceOnce(s,'      - name: Test Dagger Axis source and ownership','      - name: Test Cranberry Lake picture and source preservation\n        run: node pwa/cranberry-lake-picture.test.mjs\n      - name: Test Dagger Axis source and ownership');
s=replaceOnce(s,'      - name: Verify bundle\n','      - name: Verify Cranberry Lake picture in final data\n        run: node pwa/cranberry-lake-picture.test.mjs --dist\n      - name: Verify bundle\n');
s=replaceOnce(s,'          test -f pwa/dist/assets/kb/entries/technique-rods-reels.png','          test -f pwa/dist/assets/kb/entries/technique-rods-reels.png\n          test -f pwa/dist/assets/kb/entries/location-cranberry-lake-deception-pass.png');
await write(workflow,s);

const regression=`import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validateKbBundle,validateCatchBundle} from './kb-model.js';
import {materializeKbEntity,validateKbMediaBundle} from './kb-picture-model.js';
import {readValidatedImage,detectImageType} from './image-validation.mjs';

const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const kb=read('./data/kb.seed.json');
const gear=read('./data/gear.seed.json');
const catches=read('./data/catches.seed.json');
const local=read('./local-media.json');
const id='location-cranberry-lake-deception-pass';
const src='./assets/kb/entries/'+id+'.png';
const picture={src,alt:'Cranberry Lake',caption:'Cranberry Lake',credit:null,sourceUrl:null};
const expected={id,type:'location',name:'Cranberry Lake, Deception Pass State Park',description:'Freshwater fishing at Deception Pass State Park.',picture,content:'./kb-content/locations/cranberry-lake-deception-pass.md'};
assert.ok(validateKbBundle(kb).valid);
assert.ok(validateCatchBundle(catches,kb,gear).valid);
assert.equal(kb.dataVersion,'2026-09-08-kb-v1-cranberry-lake-picture-1');
assert.equal(kb.entities.length,54);
assert.deepEqual(kb.entities.filter(e=>e.id===id),[expected]);
assert.deepEqual(local.kb.filter(e=>e.entityId===id),[{entityId:id,source:src,alt:'Cranberry Lake',caption:'Cranberry Lake',credit:null,sourceUrl:null}]);
const source=await readValidatedImage(fileURLToPath(new URL(src,import.meta.url)));
assert.equal(detectImageType(source,src),'png');
assert.ok(source.length>0);
const markdown=fs.readFileSync(new URL('./'+expected.content.slice(2),import.meta.url));
assert.ok(markdown.length>0);
// User-maintained prose and image bytes are not fixed snapshots. Verify the
// current source and exact published copies rather than historical hashes.
if(process.argv.includes('--dist')) {
 const built=read('./dist/data/kb.seed.json');
 const builtGear=read('./dist/data/gear.seed.json');
 const media=read('./dist/gear-media.json');
 assert.ok(validateKbBundle(built).valid);
 assert.ok(validateCatchBundle(catches,built,builtGear).valid);
 assert.deepEqual(built.entities.find(e=>e.id===id),materializeKbEntity(expected,local,media,gear));
 assert.equal(built.entities.length,kb.entities.length);
 assert.deepEqual(fs.readFileSync(new URL('./dist/'+src.slice(2),import.meta.url)),source);
 assert.deepEqual(fs.readFileSync(new URL('./dist/'+expected.content.slice(2),import.meta.url)),markdown);
 assert.ok(read('./dist/kb-assets.json').includes(src));
}
console.log('Cranberry Lake identity, picture metadata, format and source-to-published preservation passed.');
`;
await write('pwa/cranberry-lake-picture.test.mjs',regression);

// The release records retain historical fingerprints; executable tests must
// not silently keep an obsolete source data version after a source promotion.
async function scan(dir){
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  if(entry.name==='dist'||entry.name==='node_modules')continue;
  const p=path.join(dir,entry.name);
  if(entry.isDirectory())await scan(p);
  else if(/\.(?:js|mjs|yml|yaml)$/.test(entry.name)){
   const text=await read(p);
   assert.ok(!text.includes(oldVersion),`Obsolete KB version remains in executable file: ${p}`);
  }
 }
}
await scan('pwa');
assert.ok(!(await read(workflow)).includes(oldVersion));
console.log('Cranberry release tests prepared; current user media and authored content remain untouched.');
