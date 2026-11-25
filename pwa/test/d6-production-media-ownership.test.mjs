import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareChange} from '../src/handoff.mjs';
import {reviewD6CanonicalMediaOwnership,D6MediaOwnershipError}
 from '../../experiments/p3/preview/src/d6-production-media-ownership.mjs';

const MAIN='a'.repeat(40),SHA='b'.repeat(64);
const json=()=>({
 gear:{schemaVersion:2,items:[]},
 kb:{schemaVersion:2,entities:[]},
 catches:{schemaVersion:2,catches:[]},
});
const meta=path=>({path,bytes:32,sha256:SHA});
const fail=(fn,code)=>assert.throws(fn,
 e=>e instanceof D6MediaOwnershipError&&e.code===code);
const setup=async()=>{
 const item={id:'catch-example',date:'2026-11-12'},
  path='Catches/assets/catch-example/notes/photo.png',
  notesPath='Catches/content/catch-example.md',
  text='A fish\n\n![Original](../assets/catch-example/notes/photo.png)';
 const pkg=await prepareChange({domain:'catches',operation:'add',
  id:item.id,record:item,sourceRevision:MAIN,text,
  notesImages:[meta(path)]});
 const data=json();data.catches.catches=[{...item,notes:notesPath}];
 const sourceFiles=new Set(['Gear/gear.json','KB/kb.json',
  'Catches/catches.json']);
 const candidateFiles=new Set([...sourceFiles,path,notesPath]);
 const candidateMarkdown=new Map([[notesPath,text]]);
 const args={package:pkg,sourceFiles,candidateFiles,candidateMarkdown,
  candidateData:data};
 return {args,path,notesPath};
};

test('WP3-MEDIA06 Catch Notes original must be referenced by owned Markdown',async()=>{
 const {args,path}=await setup();
 const r=reviewD6CanonicalMediaOwnership(args);
 assert.equal(r.verified,true);
 assert.equal(r.canPublish,false);
 assert.equal(r.requiresSignedStaging,true);
 assert.deepEqual(r.paths,[path]);
 assert.equal(r.fileCount,1);
 assert.equal(args.candidateData.catches.catches[0].picture,undefined);
});

test('WP3-MEDIA07 unreferenced images and incorrect narrative owner fail',async()=>{
 const {args}=await setup();
 const notReferenced=structuredClone(args);
 notReferenced.candidateMarkdown=new Map(args.candidateMarkdown);
 notReferenced.candidateMarkdown.set(args.package.notes.path,'No image');
 fail(()=>reviewD6CanonicalMediaOwnership(notReferenced),
  'NARRATIVE_NOT_OWNED');
 const otherOwner=structuredClone(args);
 otherOwner.candidateData.catches.catches[0].notes=
  'Catches/content/someone-else.md';
 fail(()=>reviewD6CanonicalMediaOwnership(otherOwner),
  'NARRATIVE_NOT_OWNED');
 const staleImage=structuredClone(args);
 staleImage.package.notes.body='# Caption only';
 staleImage.candidateMarkdown.set(staleImage.package.notes.path,'# Caption only');
 fail(()=>reviewD6CanonicalMediaOwnership(staleImage),
  'UNREFERENCED_NOTE_IMAGE');
 const linkOnly=structuredClone(args);
 // A Markdown link to the original file is not an embedded image.
 linkOnly.package.notes.body=
  '[Photo](../assets/catch-example/notes/photo.png)';
 linkOnly.candidateMarkdown.set(linkOnly.package.notes.path,
  linkOnly.package.notes.body);
 fail(()=>reviewD6CanonicalMediaOwnership(linkOnly),
  'UNREFERENCED_NOTE_IMAGE');
});

test('WP3-MEDIA08 missing media and existing filename collisions fail',async()=>{
 const {args,path}=await setup();
 const missing=structuredClone(args);missing.candidateFiles.delete(path);
 fail(()=>reviewD6CanonicalMediaOwnership(missing),
  'MISSING_MEDIA_CANDIDATE');
 const occupied=structuredClone(args);occupied.sourceFiles.add(path);
 fail(()=>reviewD6CanonicalMediaOwnership(occupied),
  'EXISTING_MEDIA_COLLISION');
 const differentCase=structuredClone(args);
 differentCase.sourceFiles.add(path.replace('photo.png','PHOTO.PNG'));
 fail(()=>reviewD6CanonicalMediaOwnership(differentCase),
  'INVALID_CANDIDATE');
});

test('WP3-MEDIA09 Gear representative and inline Notes both bind owner',async()=>{
 const item={id:'example-jig',category:'lures',type:'Jigs',
  name:'Example Jig'};
 const pic='Gear/Lures/assets/example.png',
  note='Gear/Lures/assets/example-jig/notes/detail.png',
  notesPath='Gear/Lures/content/Example Jig.md',
  text='![Detail](../assets/example-jig/notes/detail.png)';
 const pkg=await prepareChange({domain:'gear',operation:'add',
  id:item.id,record:item,sourceRevision:MAIN,text,
  pictureAction:'add',picturePath:pic,pictureFile:meta(pic),
  notesImages:[meta(note)]});
 const data=json();data.gear.items=[{...item,notes:notesPath,
  picture:{src:pic}}];
 const sourceFiles=new Set(['Gear/gear.json','KB/kb.json',
  'Catches/catches.json']);
 const candidateFiles=new Set([...sourceFiles,pic,note,notesPath]);
 const candidateMarkdown=new Map([[notesPath,text]]);
 const args={package:pkg,sourceFiles,candidateFiles,
  candidateMarkdown,candidateData:data};
 assert.deepEqual(reviewD6CanonicalMediaOwnership(args).paths,[pic,note]);
 const wrong=structuredClone(args);
 wrong.candidateData.gear.items[0].picture.src='Gear/Lures/assets/other.png';
 fail(()=>reviewD6CanonicalMediaOwnership(wrong),'PICTURE_NOT_OWNED');
});

test('WP3-MEDIA10 Knot ordered frames must match candidate ownership',async()=>{
 const item={id:'example-knot',type:'knot',name:'Example Knot'};
 const frames=['step-01.png','step-02.png'].map(x=>
  'KB/Knots/assets/example-knot/'+x);
 const content='KB/Knots/content/Example Knot.md',text='# Example Knot';
 const pkg=await prepareChange({domain:'kb',operation:'add',
  id:item.id,record:item,sourceRevision:MAIN,text,
  pictureAction:'add',picturePath:frames[1],
  pictureFile:meta(frames[1]),
  pictureSequenceAction:'set',pictureSequencePaths:frames,
  pictureSequenceFiles:frames.map(meta)});
 const data=json();data.kb.entities=[{...item,content,
  picture:{src:frames[1]},pictureSequence:frames}];
 const sourceFiles=new Set(['Gear/gear.json','KB/kb.json',
  'Catches/catches.json']);
 const candidateFiles=new Set([...sourceFiles,...frames,content]);
 const candidateMarkdown=new Map([[content,text]]);
 const args={package:pkg,sourceFiles,candidateFiles,
  candidateMarkdown,candidateData:data};
 assert.deepEqual(reviewD6CanonicalMediaOwnership(args).paths,frames);
 const reversed=structuredClone(args);
 reversed.candidateData.kb.entities[0].pictureSequence.reverse();
 // Canonical sequence validation rejects out-of-order frames first.
 fail(()=>reviewD6CanonicalMediaOwnership(reversed),'INVALID_CANDIDATE');
 const altered=structuredClone(args);
 altered.candidateData.kb.entities[0].pictureSequence[0]=
  'KB/Knots/assets/example-knot/step-01.jpg';
 // Individually valid frame names still cannot differ from this operation.
 fail(()=>reviewD6CanonicalMediaOwnership(altered),'SEQUENCE_NOT_OWNED');
});
