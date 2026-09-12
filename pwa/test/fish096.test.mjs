import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {validateRecords,collectPaths} from '../src/validation.mjs';
import {prepareChange,validatePackage,promoteChange,ChangeConflictError} from '../src/handoff.mjs';
import {inventorySource} from '../tools/library.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../..');
const readJson=file=>fs.readFile(file,'utf8').then(JSON.parse);
async function sourceData(){return {gear:await readJson(path.join(repo,'Gear/gear.json')),kb:await readJson(path.join(repo,'KB/kb.json')),catches:await readJson(path.join(repo,'Catches/catches.json'))};}
const sequenceRecord=()=>({id:'knot-test-sequence',type:'knot',name:'Test Sequence',content:'KB/Knots/content/test-sequence.md',picture:{src:'KB/Knots/assets/knot-test-sequence/step-03.png',caption:'Test caption'},pictureSequence:['KB/Knots/assets/knot-test-sequence/step-01.png','KB/Knots/assets/knot-test-sequence/step-02.png','KB/Knots/assets/knot-test-sequence/step-03.png']});

async function withRecord(record){const data=await sourceData();data.kb.entities.push(record);return data;}

test('FISH096 sequence semantics are Knot-only, contiguous, explicit and representative-final',async()=>{
 const valid=await withRecord(sequenceRecord());validateRecords(valid);
 const paths=collectPaths(valid);for(const file of sequenceRecord().pictureSequence)assert(paths.has(file));
 const nonKnot=structuredClone(valid);nonKnot.kb.entities.at(-1).type='technique';assert.throws(()=>validateRecords(nonKnot),/Knot-only/);
 const gap=structuredClone(valid);gap.kb.entities.at(-1).pictureSequence[1]='KB/Knots/assets/knot-test-sequence/step-03.png';assert.throws(()=>validateRecords(gap));
 const wrongFolder=structuredClone(valid);wrongFolder.kb.entities.at(-1).pictureSequence[0]='KB/Knots/assets/other/step-01.png';assert.throws(()=>validateRecords(wrongFolder),/sequence folder/);
 const wrongFinal=structuredClone(valid);wrongFinal.kb.entities.at(-1).picture.src=wrongFinal.kb.entities.at(-1).pictureSequence[1];assert.throws(()=>validateRecords(wrongFinal),/final sequence frame/);
});

test('FISH096 handoff carries sequence paths/files and promotes picture plus sequence atomically',async()=>{
 const record=sequenceRecord(),files=record.pictureSequence.map((file,index)=>({path:file,bytes:100+index,sha256:String(index+1).padStart(64,'a').slice(-64)}));
 // Replace synthetic hashes with valid lowercase hex.
 files.forEach((file,index)=>file.sha256=(index+1).toString(16).repeat(64).slice(0,64));
 const pkg=await prepareChange({domain:'kb',operation:'add',id:record.id,record,baseRecord:null,text:'TODO',sourceRevision:'fish096-test',notesPath:record.content,pictureAction:'add',picturePath:record.picture.src,pictureSequenceAction:'set',pictureSequencePaths:record.pictureSequence,pictureSequenceFiles:files});
 validatePackage(pkg);assert.equal(pkg.picture.file,undefined);assert.equal(pkg.pictureSequence.action,'set');assert.deepEqual(pkg.pictureSequence.paths,record.pictureSequence);assert.equal(pkg.pictureSequence.files.length,3);
 const promoted=await promoteChange({package:pkg,currentRecord:null,sourceRevision:'current',validate:value=>{assert.equal(value.picture.src,value.pictureSequence.at(-1));}});assert.deepEqual(promoted.record.pictureSequence,record.pictureSequence);assert.equal(promoted.record.picture.src,record.picture.src);
 const oldCompatible=structuredClone(pkg);delete oldCompatible.pictureSequence;oldCompatible.picture={action:'add',path:'KB/Knots/assets/static.png'};oldCompatible.record={id:'knot-old-package',type:'knot',name:'Old package'};oldCompatible.notes={action:'create',path:'KB/Knots/content/old.md',body:'TODO',baseSha256:null};validatePackage(oldCompatible);
});

test('FISH096 edit promotion detects stale sequence state independently of picture state',async()=>{
 const base=sequenceRecord(),replacement=structuredClone(base);replacement.pictureSequence=['KB/Knots/assets/knot-test-sequence/step-01.png','KB/Knots/assets/knot-test-sequence/step-02.png','KB/Knots/assets/knot-test-sequence/step-04.png'];replacement.picture.src=replacement.pictureSequence.at(-1);
 const pkg=await prepareChange({domain:'kb',operation:'edit',id:base.id,baseRecord:base,record:replacement,baseText:'TODO',text:'TODO',sourceRevision:'fish096-base',pictureAction:'replace',picturePath:replacement.picture.src,pictureSequenceAction:'set',pictureSequencePaths:replacement.pictureSequence,pictureSequenceFiles:replacement.pictureSequence.map((file,index)=>({path:file,bytes:200+index,sha256:(index+4).toString(16).repeat(64).slice(0,64)}))});
 const current=structuredClone(base);current.pictureSequence=[...base.pictureSequence];current.pictureSequence[0]='KB/Knots/assets/knot-test-sequence/step-00.png';
 await assert.rejects(()=>promoteChange({package:pkg,currentRecord:current,currentText:'TODO',sourceRevision:'now'}),error=>error instanceof ChangeConflictError&&error.conflicts.includes('pictureSequence'));
});

test('FISH096 source inventory includes every explicit frame exactly once and fails when one is missing',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'fish096-source-'));
 try{
  for(const dir of ['Gear','KB/Knots/content','KB/Knots/assets/knot-test-sequence','Catches'])await fs.mkdir(path.join(root,dir),{recursive:true});
  await fs.writeFile(path.join(root,'Gear/gear.json'),JSON.stringify({schemaVersion:2,items:[]}));
  await fs.writeFile(path.join(root,'Catches/catches.json'),JSON.stringify({schemaVersion:2,catches:[]}));
  const record=sequenceRecord();await fs.writeFile(path.join(root,'KB/kb.json'),JSON.stringify({schemaVersion:2,entities:[record]}));await fs.writeFile(path.join(root,record.content),'TODO');
  for(let i=1;i<=3;i++)await sharp({create:{width:10+i,height:10+i,channels:4,background:{r:20*i,g:30*i,b:40*i,alpha:1}}}).png().toFile(path.join(root,`KB/Knots/assets/knot-test-sequence/step-0${i}.png`));
  const inventory=await inventorySource(root);for(const frame of record.pictureSequence)assert.equal(inventory.files.filter(x=>x.path===frame).length,1);
  await fs.rm(path.join(root,'KB/Knots/assets/knot-test-sequence/step-02.png'));await assert.rejects(()=>inventorySource(root));
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
