#!/usr/bin/env node
/**
 * FISH118 D3: compile canonical AJV 2020 schema at BUILD TIME.
 * Strict private owner pilot CSP excludes unsafe-eval, so it must NEVER
 * instantiate the Ajv runtime compiler in the browser.
 * Unmodified semantic rules still come from pwa/src/validation.mjs.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import standaloneCode from 'ajv/dist/standalone/index.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const schemaFile=path.join(root,'contracts/schema.json');
const validationFile=path.join(root,'src/validation.mjs');
const generatedDir=path.join(root,'src/generated');
const validatorsFile=path.join(generatedDir,'d3-validators.mjs');
const originalFile=await fs.readFile(validationFile,'utf8');
const schema=JSON.parse(await fs.readFile(schemaFile,'utf8'));
const ajv=new Ajv2020({allErrors:true,strict:true,
 code:{source:true,esm:true}});
const definitions={
 gear:'gearBundle',kb:'kbBundle',catches:'catchBundle',
 gearItem:'gearItem',kbEntity:'kbEntity',catch:'catch',
};
const validators={};
for(const [key,definition]of Object.entries(definitions)){
 if(!Object.hasOwn(schema.$defs,definition))
  throw Error('Missing canonical schema definition: '+definition);
 validators[key]=ajv.compile({$ref:'#/$defs/'+definition,$defs:schema.$defs});
}
const code=standaloneCode(ajv,validators);
if(!code.includes('export')||code.includes('new Function('))
 throw Error('Generated CSP validators contain unsafe compilation');
await fs.mkdir(generatedDir,{recursive:true});
await fs.writeFile(validatorsFile,code,'utf8');

const from=[
 "import Ajv2020 from 'ajv/dist/2020.js';",
 "import schema from '../contracts/schema.json' with {type:'json'};"
].join('\n');
const to="import {gear,kb,catches,gearItem,kbEntity,catch as catchValidator} from './generated/d3-validators.mjs';";
const oldInit=[
 'const ajv=new Ajv2020({allErrors:true,strict:true});',
 "const validators=Object.fromEntries(Object.entries(DOMAIN).map(([key,d])=>[key,ajv.compile({$ref:'#/$defs/'+d.definition,$defs:schema.$defs})]));",
].join('\n');
const newInit=[
 'const validators={gear,kb,catches};',
 'const itemValidators={gear:gearItem,kb:kbEntity,catches:catchValidator};',
 "const schemaErrors=errors=>(errors??[]).map(e=>(e.instancePath||'/')+' '+(e.message??'schema violation')).join('; ');",
].join('\n');
const oldRecord=[
 "const definition={gear:'gearItem',kb:'kbEntity',catches:'catch'}[domain];",
 " const validate=ajv.compile({$ref:'#/$defs/'+definition,$defs:schema.$defs});",
].join('\n');
const newRecord='const validate=itemValidators[domain];';
let safe=originalFile;
for(const [needle,replacement]of [
 [from,to],
 [oldInit,newInit],
 [oldRecord,newRecord],
 ["ajv.errorsText(validate.errors,{separator:'; '})","schemaErrors(validate.errors)"],
 ["ajv.errorsText(validate.errors)","schemaErrors(validate.errors)"],
]){
 if(safe.split(needle).length!==2)
  throw Error('Validation source changed; review CSP transform: '+needle.slice(0,60));
 safe=safe.replace(needle,replacement);
}
if(/\bAjv2020\b|\bajv\.|ajv\/dist/.test(safe))
 throw Error('Runtime AJV compiler leaked into owner pilot validation');
const digest=s=>createHash('sha256').update(s).digest('hex');
process.stdout.write(JSON.stringify({
 generated:true,canonicalSchemaSha256:digest(JSON.stringify(schema)),
 originalValidationSha256:digest(originalFile),
 staticCodeBytes:Buffer.byteLength(code),
 cspSafeValidationBytes:Buffer.byteLength(safe),
 noDeployment:true,
})+'\n');

export function ownerPilotCspValidationPlugin(){
 return {name:'fishing-d3-csp-ajv',setup(build){
  build.onLoad({filter:/[/\\]pwa[/\\]src[/\\]validation\.mjs$/},
   async()=>({contents:safe,loader:'js',
     resolveDir:path.dirname(validationFile)}));
 }};
}
