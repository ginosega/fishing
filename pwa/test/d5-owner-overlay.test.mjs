import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {composeD5OwnerOverlay} from '../src/d5-owner-overlay.mjs';

const canonical=()=>({
 gear:{schemaVersion:2,items:[{id:'real-lure',name:'Real lure',category:'lures'}]},
 kb:{schemaVersion:2,entities:[{id:'species-rainbow-trout',name:'Rainbow Trout',type:'species',
  content:'KB/Species/content/rainbow-trout.md'}]},
 catches:{schemaVersion:2,catches:[{id:'real-catch',speciesId:'species-rainbow-trout'}]},
});
const sandbox=()=>({
 gear:{schemaVersion:2,items:[{id:'p3-test-gear',name:'P3 Rod'}]},
 kb:{schemaVersion:2,entities:[{id:'p3-test-knot',name:'Test Knot'}]},
 catches:{schemaVersion:2,catches:[{id:'p3-test-catch'}]},
});
const canonicalFiles=()=>new Set(['Gear/gear.json','KB/kb.json','Catches/catches.json',
 'KB/Species/content/rainbow-trout.md','Gear/Lures/assets/real-lure.png']);
const sandboxFiles=()=>new Set(['Gear/gear.json','KB/kb.json','Catches/catches.json',
 'Gear/Lures/content/P3 Test.md']);
const make=(extra={})=>composeD5OwnerOverlay({
 canonical:canonical(),sandbox:sandbox(),canonicalFiles:canonicalFiles(),
 sandboxFiles:sandboxFiles(),...extra,
});
test('D5-DISPLAY01 reading union retains genuine and synthetic records with explicit provenance',()=>{
 const x=make();
 assert.equal(x.data.gear.items.length,2);
 assert.equal(x.data.kb.entities.length,2);
 assert.equal(x.data.catches.catches.length,2);
 assert(x.isCanonical('kb','species-rainbow-trout'));
 assert(x.isSandbox('gear','p3-test-gear'));
 assert.equal(x.isSandbox('kb','species-rainbow-trout'),false);
 assert(x.canonicalFiles.has('KB/Species/content/rainbow-trout.md'));
});
test('D5-DISPLAY02 publisher only accepts exact private IDs for edits and new noncanonical IDs',()=>{
 const x=make();
 const pkg=(domain,operation,id)=>({
  domain,operation,id,base:{sourceRevision:'a'.repeat(40)},
 });
 assert(x.mayPublish(pkg('gear','edit','p3-test-gear')));
 assert(x.mayPublish(pkg('kb','edit','p3-test-knot')));
 assert(x.mayPublish(pkg('catches','edit','p3-test-catch')));
 assert(!x.mayPublish(pkg('kb','edit','species-rainbow-trout')));
 assert(!x.mayPublish(pkg('gear','edit','real-lure')));
 assert(!x.mayPublish(pkg('catches','edit','real-catch')));
 assert(!x.mayPublish(pkg('gear','add','real-lure')));
 assert(!x.mayPublish(pkg('gear','add','p3-test-gear')));
 assert(x.mayPublish(pkg('gear','add','p3-new-lure')));
 assert(!x.mayPublish({...pkg('gear','add','p3-new'),base:{}}));
 assert(!x.mayPublish(pkg('unknown','add','p3-new')));
});
test('D5-DISPLAY03 refuse duplicate provenance or overlapping nonindex assets',()=>{
 const a=canonical(),b=sandbox();b.kb.entities[0].id='species-rainbow-trout';
 assert.throws(()=>make({canonical:a,sandbox:b}),/ID collision/);
 const files=sandboxFiles();files.add('KB/Species/content/rainbow-trout.md');
 assert.throws(()=>make({sandboxFiles:files}),/content path collision/);
 const caseFiles=sandboxFiles();caseFiles.add('gear/lures/assets/REAL-lure.png');
 assert.throws(()=>make({sandboxFiles:caseFiles}),/content path collision/);
 assert.throws(()=>make({sandboxFiles:null}),/provenance unavailable/);
});
test('D5-DISPLAY04 original sandbox source arrays remain unchanged',()=>{
 const real=canonical(),privateData=sandbox();
 const before=JSON.stringify(privateData),original=JSON.stringify(real);
 const overlay=make({canonical:real,sandbox:privateData});
 assert.equal(JSON.stringify(privateData),before);
 assert.equal(JSON.stringify(real),original);
 assert.notStrictEqual(overlay.data.kb,privateData.kb);
 assert.equal(privateData.kb.entities.length,1);
});
test('D5-DISPLAY05 implementation keeps sandbox authoring separated from visible reading union',()=>{
 const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 const shell=readFileSync(new URL(
  '../../experiments/p3/preview/src/d3-owner-test-shell.mjs',import.meta.url),'utf8');
 const owner=readFileSync(new URL('../src/d5-owner-candidate.mjs',import.meta.url),'utf8');
 assert.match(app,/displayPublishedLibrary===true/);
 assert.match(app,/sandboxMaps=display\?validateRecords\(sandboxSource.data\)/);
 assert.match(ui,/canEditRecord\(domain,record.id\)/);
 assert.match(ui,/if\(id&&!canEditRecord\(domain,id\)\)/);
 assert.match(ui,/if\(id&&!canEditRecord\('catches',id\)\)/);
 assert.match(ui,/createEditor\(sandboxEditorContext\(\)/);
 assert.match(ui,/createCatchEditor\(sandboxEditorContext\(\)/);
 assert.match(ui,/ownerDisplay.mayPublish\(args\[0\]\)/);
 assert.match(ui,/ownerDisplay.canonicalFiles.has\(pathValue\)/);
 assert.match(ui,/ctx.v3.source.markdown.has\(pathValue\)/);
 assert.match(owner,/displayPublishedLibrary:true/);
 assert.match(shell,/displayPublishedLibrary=false/);
});
