import Ajv2020 from 'ajv/dist/2020.js';
import schema from '../contracts/schema.json' with {type:'json'};
import {DOMAIN,validateSemantics,safePath,pathKey,assert,sequenceFolder} from './shared.mjs';
import {parseMarkdown,markdownRouteMap} from './markdown.mjs';
export const TAXONOMY={
 line:['Braided','Fluorocarbon','Monofilament'],
 weights:['Cylinder weights','Egg sinkers','Swiveling trolling sinkers','Glass beads','Split shot sinkers'],
 'snaps-swivels':['Snaps','Swivels','Snap swivels'],
 hooks:['Wacky','Ned rig','Drop shot','Soft plastics','Swimbait jighead','Trout/bait'],
 lures:['Chatterbaits / bladed jigs','Spinnerbaits','Crankbaits and hard jerkbaits','Inline spinners','Spoons','Trolling lures','Topwater','Jigs','Soft plastics and swimbaits'],
 bait:['Trout bait'],accessories:['Kayaks','Accessories','Tools','Tackle Management','Electronics','Storage']
};
const ajv=new Ajv2020({allErrors:true,strict:true});
const validators=Object.fromEntries(Object.entries(DOMAIN).map(([key,d])=>[key,ajv.compile({$ref:'#/$defs/'+d.definition,$defs:schema.$defs})]));
export function validateRecords(data){
 for(const [domain,validate] of Object.entries(validators))if(!validate(data[domain]))throw new Error(`${domain} schema: ${ajv.errorsText(validate.errors,{separator:'; '})}`);
 return validateSemantics(data,TAXONOMY);
}
export function validateRecord(record,domain,otherData){
 assert(['gear','kb','catches'].includes(domain),'Unknown domain');
 const definition={gear:'gearItem',kb:'kbEntity',catches:'catch'}[domain];
 const validate=ajv.compile({$ref:'#/$defs/'+definition,$defs:schema.$defs});
 if(!validate(record))throw new Error(ajv.errorsText(validate.errors));
 const data=structuredClone(otherData);const key=DOMAIN[domain].array;
 data[domain][key]=data[domain][key].filter(x=>x.id!==record.id).concat(record);
 return validateRecords(data);
}
export function collectPaths(data){
 const paths=new Set();
 for(const [domain,config] of Object.entries(DOMAIN))for(const r of data[domain][config.array]){
  for(const file of [r.notes,r.content,r.picture?.src,...(r.pictureSequence||[])])if(file)paths.add(safePath(file));
 }
 return paths;
}
export function checkPathCollisions(paths){const seen=new Map();for(const file of paths){const key=pathKey(file);if(seen.has(key)&&seen.get(key)!==file)throw new Error(`Case/Unicode path collision: ${seen.get(key)} / ${file}`);seen.set(key,file);}return seen;}
export function validateMarkdown(text,{owner,maps,exists,assetBase='https://example.invalid/fishing/releases/test/',pathRoutes=new Map()}){return parseMarkdown(text,{owner,maps,exists,assetBase,pathRoutes}).references;}
export function validateLibraryPaths(data){
 const owned=new Map(),routeMap=markdownRouteMap(data);
 for(const [domain,config] of Object.entries(DOMAIN))for(const record of data[domain][config.array]){
  for(const key of ['notes','content'])if(record[key]){
   const file=safePath(record[key]);const prefix=domain==='gear'?'Gear/':domain==='kb'?'KB/':'Catches/content/';
   assert(file.startsWith(prefix)&&file.includes('/content/'),`Invalid narrative location: ${file}`);
   if(owned.has(file)&&owned.get(file)!==record.id)throw new Error(`Narrative path shared by records: ${file}`);
   owned.set(file,record.id);
  }
  if(record.picture){const file=safePath(record.picture.src);assert(/^(Gear|KB)\/.+\/assets\/.+\.(?:jpe?g|png|webp|gif)$/i.test(file),`Invalid picture location: ${file}`);}
  if(record.pictureSequence){
   const prefix=sequenceFolder(record)+'/';
   for(const raw of record.pictureSequence){const file=safePath(raw);assert(file.startsWith(prefix)&&!file.slice(prefix.length).includes('/'),`Invalid sequence location: ${file}`);assert(/\.(?:jpe?g|png|webp|gif)$/i.test(file),`Invalid sequence image extension: ${file}`);}
  }
 }
 return routeMap;
}
