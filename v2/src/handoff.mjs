import {canonical,fingerprint,sha256,safePath,assert,DOMAIN,categoryFolder,suggestedFilename} from './shared.mjs';
export const HANDOFF_FORMAT='fishing-companion-change-v2';
const ABSENT=Object.freeze({$absent:true});
const narrativeKey=domain=>domain==='gear'?'notes':'content';
const clone=value=>value===undefined?undefined:structuredClone(value);
export function equal(a,b){return canonical(a)===canonical(b);}
const previousValue=(object,key)=>Object.hasOwn(object,key)?clone(object[key]):ABSENT;
const unpack=value=>value&&typeof value==='object'&&value.$absent===true?undefined:value;
export function narrativePath(domain,record){return categoryFolder(domain,domain==='gear'?record.category:record.type)+'/content/'+suggestedFilename(record.name);}
export function picturePath(domain,record,filename){return safePath(categoryFolder(domain,domain==='gear'?record.category:record.type)+'/assets/'+filename);}
export class ChangeConflictError extends Error{constructor(conflicts){super(`Change requires review: ${conflicts.join(', ')}`);this.name='ChangeConflictError';this.conflicts=conflicts;}}
export async function prepareChange({domain,operation,id,baseRecord,record,baseText='',text='',sourceRevision,notesPath,pictureAction='keep',picturePath:requestedPicturePath,baseFileHash,pictureFile}={}){
 assert(['gear','kb'].includes(domain),'Only Gear and KB authoring is P1');
 assert(['add','edit'].includes(operation),'Unsupported operation');
 assert(record?.id===id,'Identity cannot be edited');
 assert(typeof sourceRevision==='string'&&sourceRevision.length>0,'Source revision required');
 const key=narrativeKey(domain),base={schemaVersion:2,sourceRevision,recordHash:baseRecord?await fingerprint(baseRecord):null};
 const result={format:HANDOFF_FORMAT,domain,operation,id,base};
 if(operation==='add'){
  assert(!baseRecord,'Add cannot contain a base record');
  result.record=clone(record);delete result.record[key];delete result.record.picture;
 }else{
  assert(baseRecord?.id===id,'Edit requires matching base identity');
  const set={},unset=[],baseFields={};
  for(const field of new Set([...Object.keys(baseRecord),...Object.keys(record)])){
   if(['id',key,'picture'].includes(field)||equal(baseRecord[field],record[field]))continue;
   baseFields[field]=previousValue(baseRecord,field);
   if(Object.hasOwn(record,field))set[field]=clone(record[field]);else unset.push(field);
  }
  result.changes={set,unset,baseFields};
 }
 const previous=baseRecord?.[key];
 if(operation==='add'||text!==baseText||(!previous&&notesPath&&text)){
  if(text){
   const file=safePath(notesPath||previous||narrativePath(domain,record));
   result.notes={action:previous?'replace':'create',path:file,body:text,baseSha256:previous?(baseFileHash||await sha256(baseText)):null};
  }else if(previous)result.notes={action:'remove',path:previous,baseSha256:baseFileHash||await sha256(baseText)};
  else result.notes={action:'keep'};
 }else result.notes={action:'keep'};
 assert(['keep','add','replace','remove'].includes(pictureAction),'Invalid picture action');
 if(pictureAction==='keep'&&operation==='edit'&&!equal(baseRecord.picture,record.picture))throw new Error('Picture changes require an explicit action');
 if(pictureAction==='keep'&&operation==='add'&&record.picture)throw new Error('New pictures require an explicit action');
 if(['add','replace'].includes(pictureAction)){
  const file=safePath(requestedPicturePath||record.picture?.src);
  result.picture={action:pictureAction,path:file,...(record.picture?.caption?{caption:record.picture.caption}:{})};
  if(pictureFile){assert(Number.isSafeInteger(pictureFile.bytes)&&pictureFile.bytes>0&&/^[a-f0-9]{64}$/.test(pictureFile.sha256),'Invalid picture file metadata');result.picture.file={bytes:pictureFile.bytes,sha256:pictureFile.sha256};}
 }else result.picture={action:pictureAction};
 if(operation==='edit'&&pictureAction!=='keep')result.picture.base=previousValue(baseRecord,'picture');
 return result;
}
export function validatePackage(pkg){
 assert(pkg?.format===HANDOFF_FORMAT,'Unsupported handoff format');
 assert(pkg.base?.schemaVersion===2,'Incompatible schema');
 assert(['gear','kb'].includes(pkg.domain),'Unsupported domain');
 assert(['add','edit'].includes(pkg.operation),'Unsupported operation');
 assert(typeof pkg.id==='string'&&/^[a-z0-9][a-z0-9-]*$/.test(pkg.id),'Invalid identity');
 assert(typeof pkg.base.sourceRevision==='string'&&pkg.base.sourceRevision.length>0,'Missing base revision');
 assert(pkg.operation!=='edit'||(pkg.changes&&pkg.changes.baseFields&&typeof pkg.changes.baseFields==='object'),'Missing edit base fields');
 assert(['keep','create','replace','remove'].includes(pkg.notes?.action),'Invalid narrative action');
 assert(['keep','add','replace','remove'].includes(pkg.picture?.action),'Invalid picture action');
 if(pkg.notes.action!=='keep')safePath(pkg.notes.path);
 if(['add','replace'].includes(pkg.picture.action))safePath(pkg.picture.path);
 return pkg;
}
export async function promoteChange({package:pkg,currentRecord,currentText='',sourceRevision,validate,conflictPolicy='review'}={}){
 validatePackage(pkg);assert(['review','overwrite'].includes(conflictPolicy),'Invalid conflict policy');
 const key=narrativeKey(pkg.domain),conflicts=[],writes=[];
 if(pkg.operation==='add'){
  assert(!currentRecord,'ID already exists');
  const record={...clone(pkg.record),id:pkg.id};
  if(pkg.notes.action==='create'){record[key]=pkg.notes.path;writes.push({path:pkg.notes.path,body:pkg.notes.body,baseSha256:null});}
  if(['add','replace'].includes(pkg.picture.action))record.picture={src:pkg.picture.path,...(pkg.picture.caption?{caption:pkg.picture.caption}:{})};
  if(pkg.domain==='kb'&&pkg.notes.action!=='create')throw new Error('Knowledge Base Content is required');
  validate?.(record);return {record,text:pkg.notes.body||'',writes,conflicts,sourceRevision};
 }
 assert(currentRecord?.id===pkg.id,'Deleted or mismatched record');
 const record=clone(currentRecord);
 for(const field of new Set([...Object.keys(pkg.changes?.set||{}),...(pkg.changes?.unset||[])])){
  assert(!['id',key,'picture'].includes(field),'Invalid structured change');
  assert(Object.hasOwn(pkg.changes.baseFields,field),`Missing base field: ${field}`);
  const base=unpack(pkg.changes.baseFields[field]);
  if(!equal(base,currentRecord[field]))conflicts.push(field);
  if(Object.hasOwn(pkg.changes.set,field))record[field]=clone(pkg.changes.set[field]);else delete record[field];
 }
 let text=currentText;
 if(pkg.notes.action!=='keep'){
  if(pkg.notes.action==='create'){
   if(record[key])conflicts.push(key);
   else {record[key]=pkg.notes.path;text=pkg.notes.body;writes.push({path:pkg.notes.path,body:text,baseSha256:null});}
  }else{
   assert(record[key]===pkg.notes.path,'Narrative path conflict');
   if(await sha256(currentText)!==pkg.notes.baseSha256)conflicts.push(key);
   if(pkg.notes.action==='remove'){delete record[key];text='';writes.push({path:pkg.notes.path,remove:true,baseSha256:pkg.notes.baseSha256});}
   else {text=pkg.notes.body;writes.push({path:pkg.notes.path,body:text,baseSha256:pkg.notes.baseSha256});}
  }
 }
 if(pkg.picture.action!=='keep'){
  assert(Object.hasOwn(pkg.picture,'base'),'Missing picture base');
  if(!equal(unpack(pkg.picture.base),currentRecord.picture))conflicts.push('picture');
  if(pkg.picture.action==='remove')delete record.picture;
  else record.picture={src:pkg.picture.path,...(pkg.picture.caption?{caption:pkg.picture.caption}:{})};
 }
 if(conflicts.length&&conflictPolicy==='review')throw new ChangeConflictError([...new Set(conflicts)]);
 validate?.(record);
 return {record,text,writes,conflicts:[...new Set(conflicts)],sourceRevision};
}
