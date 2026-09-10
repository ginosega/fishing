import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {safePath,pathKey,encodedPath,parseRoute,routeFor,internalLink,catchHistory,sortGear,localDateValid} from '../src/shared.mjs';
import {validateRecords,validateRecord,validateLibraryPaths,checkPathCollisions} from '../src/validation.mjs';
import {parseMarkdown,markdownRouteMap} from '../src/markdown.mjs';
import {prepareChange,promoteChange,ChangeConflictError} from '../src/handoff.mjs';
import {inventorySource,validateImage,digest,unresolvedMedia} from '../tools/library.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const data=await (async()=>({gear:await read('Gear/gear.json'),kb:await read('KB/kb.json'),catches:await read('Catches/catches.json')}))();
const maps=validateRecords(data),routes=markdownRouteMap(data);
const clone=x=>structuredClone(x);
test('complete migrated library validates its schemas, types and references',()=>{
 assert.deepEqual([data.gear.items.length,data.kb.entities.length,data.catches.catches.length],[69,54,5]);
 assert.equal(maps.gear.size,69);assert.equal(maps.kb.size,54);assert.equal(maps.catches.size,5);
 assert.equal(validateLibraryPaths(data).size,104);
});
test('all six independent components retain their own identity',()=>{
 const ids=['daiwa-tatula-xt-rod','daiwa-exceler-lt-reel','shimano-zodias-rod','shimano-slx-dc-xt-71hg-reel','pflueger-president-spincast-rod','pflueger-president-spincast-reel'];
 for(const id of ids)assert(maps.gear.has(id));
 for(const id of ['setup-spinning','setup-baitcasting','setup-spincasting'])assert(!maps.gear.has(id));
 assert.equal(maps.gear.get('pflueger-president-spincast-rod').picture,undefined);
});
test('strict schema rejects unknown fields, duplicate IDs, invalid dates and broken references',()=>{
 const bad=clone(data);bad.gear.items[0].quantity=1;assert.throws(()=>validateRecords(bad),/additional properties|schema/i);
 const dup=clone(data);dup.gear.items.push(clone(dup.gear.items[0]));assert.throws(()=>validateRecords(dup),/Duplicate/);
 const invalid=clone(data);invalid.catches.catches[0].date='2026-02-30';assert.throws(()=>validateRecords(invalid),/date/);
 const ref=clone(data);ref.catches.catches[0].speciesId='retired-species';assert.throws(()=>validateRecords(ref),/speciesId/);
 const wrong=clone(data);wrong.catches.catches[0].lureOrBaitId='daiwa-tatula-xt-rod';assert.throws(()=>validateRecords(wrong),/lure\/bait/);
});
test('dates and ordered domain sorting are deterministic',()=>{
 assert(localDateValid('2024-02-29'));assert(!localDateValid('2025-02-29'));assert(!localDateValid('2026-13-01'));
 assert.deepEqual(sortGear([{type:'B',name:'Z'},{type:'A',name:'Z'},{type:'A',name:'A'}]).map(x=>x.name),['A','Z','Z']);
});
test('canonical paths reject traversal, controls, Windows names and Unicode collisions',()=>{
 for(const bad of ['../x','./x','/x','a//b','a/./b','a/../b','a\\b','a:invalid','Gear/CON.txt','Gear/LPT1.png','Gear/name.','Gear/name ','Gear/hello\u202e.jpg','Gear/hello\u200f.jpg','Gear/'+ 'a'.repeat(181),'Gear/'+ 'é'.repeat(121)])assert.throws(()=>safePath(bad));
 assert.equal(safePath('Gear/Equipment/assets/La pêche été.png'),'Gear/Equipment/assets/La pêche été.png');
 assert.equal(encodedPath('Gear/Equipment/assets/La pêche été.png'),'Gear/Equipment/assets/La%20p%C3%AAche%20%C3%A9t%C3%A9.png');
 assert.throws(()=>checkPathCollisions(['Gear/A.png','gear/a.png']),/collision/);
 assert.equal(pathKey('Gear/Été.png'),pathKey('gear/Été.png'));
});
test('stable routes preserve existing identities and missing references fail closed',()=>{
 assert.deepEqual(parseRoute('#/inventory/item/daiwa-tatula-xt-rod'),{page:'gear-detail',id:'daiwa-tatula-xt-rod'});
 assert.deepEqual(parseRoute('#/kb/technique/ned-rig'),{page:'kb-detail',id:'ned-rig'});
 assert.equal(internalLink('gear://daiwa-tatula-xt-rod',maps),routeFor('gear','daiwa-tatula-xt-rod'));
 assert.throws(()=>internalLink('gear://setup-spinning',maps),/Unknown/);
 assert.deepEqual(parseRoute('#/inventory/item/a%2Fb'),{page:'gear-detail',id:'a/b'});
});
test('Catch History is derived only from three approved forward references',()=>{
 for(const c of data.catches.catches){
  if(c.speciesId)assert(catchHistory(data,'kb',c.speciesId).some(x=>x.id===c.id));
  if(c.locationId)assert(catchHistory(data,'kb',c.locationId).some(x=>x.id===c.id));
  if(c.lureOrBaitId)assert(catchHistory(data,'gear',c.lureOrBaitId).some(x=>x.id===c.id));
 }
 assert.deepEqual(catchHistory(data,'gear','daiwa-tatula-xt-rod'),[]);
 assert.deepEqual(catchHistory(data,'kb','technique-ned-rig'),[]);
});
test('Markdown preserves tables, lists and code while escaping executable HTML',()=>{
 const owner=data.kb.entities[0].content;
 const result=parseMarkdown('# Heading\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n- Parent\n  - Child\n\n```html\n<script>alert(1)</script>\n```\n\n<script>alert(1)</script>',{owner,maps,pathRoutes:routes});
 assert.match(result.html,/<table>/);assert.match(result.html,/<ul>/);assert.match(result.html,/&lt;script&gt;/);assert.doesNotMatch(result.html,/<script>/);
 assert.match(result.html,/id="heading"/);
});
test('Markdown resolves internal, relative and heading links without double encoding',()=>{
 const owner=data.kb.entities[0].content;
 const result=parseMarkdown('[Gear](gear://daiwa-tatula-xt-rod) [Section](#Fishing%20Tips) [Local](../assets/La%20p%C3%AAche.png)',{owner,maps,pathRoutes:routes});
 assert.equal(result.references[0].target,routeFor('gear','daiwa-tatula-xt-rod'));
 assert.match(result.references[1].target,/section=Fishing%20Tips/);
 assert.match(result.references[2].target,/La%20p%C3%AAche.png/);
});
test('Markdown refuses remote images, unsafe URLs, missing resources and empty alt',()=>{
 const owner=data.kb.entities[0].content;
 for(const source of ['![Remote](https://example.com/image.png)','![](../assets/a.png)','[bad](%2e%2e%2fsecret)','[bad](../%2Fsecret)'])assert.throws(()=>parseMarkdown(source,{owner,maps,exists:new Set(),pathRoutes:routes}));
 for(const source of ['[bad](javascript:alert%281%29)','![bad](data:image/png;base64,AA)']){const unsafe=parseMarkdown(source,{owner,maps});assert.doesNotMatch(unsafe.html,/<(?:a|img)\b/i);}
 assert.throws(()=>parseMarkdown('[Missing](gear://retired)',{owner,maps}),/Unknown/);
});
test('handoff includes only changed fields and preserves unrelated concurrent edits',async()=>{
 const base=maps.gear.get('daiwa-tatula-xt-rod');const record=clone(base);record.model='Updated model';
 const pkg=await prepareChange({domain:'gear',operation:'edit',id:base.id,baseRecord:base,record,sourceRevision:'a'.repeat(40)});
 assert.deepEqual(Object.keys(pkg.changes.set),['model']);assert.deepEqual(pkg.changes.unset,[]);assert.equal(pkg.notes.action,'keep');assert.equal(pkg.picture.action,'keep');
 const current=clone(base);current.name='Independent name change';
 const result=await promoteChange({package:pkg,currentRecord:current,sourceRevision:'b'.repeat(40)});
 assert.equal(result.record.model,'Updated model');assert.equal(result.record.name,'Independent name change');
 const conflict=clone(current);conflict.model='Another model';
 await assert.rejects(promoteChange({package:pkg,currentRecord:conflict}),ChangeConflictError);
 const resolved=await promoteChange({package:pkg,currentRecord:conflict,conflictPolicy:'overwrite'});assert.equal(resolved.record.model,'Updated model');assert.deepEqual(resolved.conflicts,['model']);
});
test('handoff preserves whole Markdown documents and reports concurrent narrative conflicts',async()=>{
 const base=maps.kb.get(data.kb.entities[0].id);const record=clone(base);
 const pkg=await prepareChange({domain:'kb',operation:'edit',id:base.id,baseRecord:base,record,baseText:'old\n',text:'new\n',sourceRevision:'a'.repeat(40)});
 assert.equal(pkg.notes.action,'replace');assert(!('content' in (pkg.changes?.set||{})));
 await assert.rejects(promoteChange({package:pkg,currentRecord:base,currentText:'concurrent\n'}),ChangeConflictError);
 const result=await promoteChange({package:pkg,currentRecord:base,currentText:'old\n'});assert.equal(result.writes[0].body,'new\n');
});
test('identity, deletion and schema conflicts do not silently mutate source',async()=>{
 const base=maps.gear.get('daiwa-tatula-xt-rod');const record=clone(base);record.name='Another name';
 const pkg=await prepareChange({domain:'gear',operation:'edit',id:base.id,baseRecord:base,record,sourceRevision:'a'.repeat(40)});
 await assert.rejects(promoteChange({package:pkg,currentRecord:null}),/Deleted/);
 assert.throws(()=>validateRecord({...base,category:'unknown'},'gear',data));
});
test('the complete source inventory hashes and fully decodes all referenced assets',async()=>{
 const result=await inventorySource(root,{pendingMedia:true});
 assert.equal(result.data.gear.items.length,69);assert.equal(result.images.size,81);assert.equal(result.pending.length,0);
 assert.deepEqual(result.migration.exceptions.filter(x=>!x.optional).map(x=>x.id).sort(),['tsuridamashii-snap-swivels','rapala-original-floating-f3','species-perch','technique-popper','technique-whopper-plopper','macks-pee-wee-hoochie','river2sea-whopper-plopper-60'].sort());
 assert.deepEqual(result.migration.exceptions.filter(x=>x.optional).map(x=>x.id),['generic-1-inline-spinner']);assert.equal(result.references.length,235);
 for(const file of result.files){const bytes=await fs.readFile(path.join(root,file.path));assert.equal(digest(bytes),file.sha256);}
});
test('malformed images and unsupported formats are rejected',async()=>{
 await assert.rejects(validateImage(Buffer.from('not an image'),'Gear/Lures/assets/bad.png'));
 await assert.rejects(validateImage(Buffer.from('GIF89a'),'Gear/Lures/assets/bad.avif'),/Unsupported/);
});

test('explicit absent-picture decisions resolve only the approved historical exceptions',async()=>{
 const migration=await read('v2/migration/reconciliation.json'),decisions=await read('v2/migration/media-decisions.json');
 assert.equal(unresolvedMedia(migration,null,data).length,7);
 assert.equal(unresolvedMedia(migration,decisions,data).length,0);
 const missing=clone(decisions);missing.absentPictures.pop();assert.equal(unresolvedMedia(migration,missing,data).length,1);
 const invalid=clone(decisions);invalid.absentPictures[0].exceptionId='unapproved';assert.throws(()=>unresolvedMedia(migration,invalid,data),/Unknown required/);
 const changed=clone(data);changed.gear.items.find(x=>x.id==='rapala-original-floating').picture={src:'Gear/Lures/assets/future-user-picture.png'};
 assert.equal(unresolvedMedia(migration,decisions,changed).length,0); // Future supplied pictures still pass the normal path/decode checks.
});
