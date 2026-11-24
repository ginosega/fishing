/** Standalone V3 bundle boundary: platform-neutral esbuild importer/input paths. */
export function normalizeL01ModulePath(value){
 if(typeof value!=='string')throw Error('L01 module path must be a string');
 return value.replaceAll('\\','/');
}
export function isL01SourceImporter(importer){
 return normalizeL01ModulePath(importer).includes('/pwa/src/');
}
export function assertL01StandaloneModuleBoundary(inputs){
 const activeModules=Object.keys(inputs??{}).map(normalizeL01ModulePath);
 if(activeModules.some(file=>/(?:^|\/)(?:editor|handoff|change-prompt|d6-canonical-authoring-source)\.mjs$/.test(file)))
  throw Error('Standalone V3 must not bundle legacy GitHub handoff/editor modules');
 if(!['d6-legacy-editor-denial.mjs','d6-v3-content-paths.mjs',
  'd6-legacy-source-denial.mjs'].every(name=>
   activeModules.some(file=>file.endsWith('/'+name))))
  throw Error('Standalone V3 legacy editor boundary was not applied');
 return activeModules;
}
