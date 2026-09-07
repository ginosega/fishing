import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const edit=async(p,fn)=>fs.writeFile(p,fn(await fs.readFile(p,'utf8')));
const rep=(s,a,b)=>{assert.ok(s.includes(a),`Missing expected source: ${a.slice(0,100)}`);return s.replace(a,b);};
const version='2026-09-06-my-gear-v4-ordered-links-1';
await edit('pwa/gear-model.js',s=>{
  const anchor='export function diffGearBundles(currentBundle, importedBundle) {';
  assert.ok(s.includes(anchor));
  return s.replace(anchor,`// Upgrade a validated legacy handoff or non-seed local store without losing owned records.
export function upgradeGearBundle(bundle) {
  if (bundle?.schemaVersion === GEAR_SCHEMA_VERSION) return structuredClone(bundle);
  if (bundle?.schemaVersion !== 3 || !Array.isArray(bundle.items)) throw new Error('Unsupported Gear schema version.');
  const next = structuredClone(bundle);
  next.schemaVersion = GEAR_SCHEMA_VERSION;
  next.dataVersion = \`\${bundle.dataVersion}-v4\`;
  const convert = part => {
    if (!part) return;
    const links = (part.links || []).map(({kind,...link}) => link);
    if (part.manufacturer?.url) {
      links.unshift({label:part.manufacturer.name,url:part.manufacturer.url});
      delete part.manufacturer.url;
    }
    if (links.length || Object.hasOwn(part,'links')) part.links = links;
  };
  for (const item of next.items) {
    if (item.category === 'accessories' && item.type === 'Miscellaneous') item.type = 'Accessories';
    if (item.category === 'rods-reels') { convert(item.rod); convert(item.reel); }
    else convert(item);
  }
  const result=validateGearBundle(next);
  if (!result.valid) throw new Error(\`Legacy Gear migration failed: \${result.errors.join(' ')}\`);
  return next;
}

`+anchor);
});
await edit('pwa/gear-store.js',s=>{
  s=rep(s,"import { GEAR_SCHEMA_VERSION, validateGearBundle } from './gear-model.js';","import { GEAR_SCHEMA_VERSION, validateGearBundle, upgradeGearBundle } from './gear-model.js';");
  s=rep(s,"    if (localIsSeedManaged && (meta?.schemaVersion !== GEAR_SCHEMA_VERSION || meta?.dataVersion !== seed.dataVersion)) {\n      await this.replace(seed, { source:'seed' });\n    }","    if (localIsSeedManaged && (meta?.schemaVersion !== GEAR_SCHEMA_VERSION || meta?.dataVersion !== seed.dataVersion)) {\n      await this.replace(seed, { source:'seed' });\n    } else if (!localIsSeedManaged && meta?.schemaVersion === 3) {\n      const upgraded = upgradeGearBundle(await this.exportBundle());\n      await this.replace(upgraded, { source:meta.source });\n    }");
  s=rep(s,"      schemaVersion: GEAR_SCHEMA_VERSION,\n      dataVersion: metaRecord?.dataVersion || 'local',","      schemaVersion: metaRecord?.schemaVersion || GEAR_SCHEMA_VERSION,\n      dataVersion: metaRecord?.dataVersion || 'local',");
  return s;
});
await edit('pwa/gear-model.test.mjs',s=>{
  s=rep(s,"GEAR_SCHEMA_VERSION, gearLinks }","GEAR_SCHEMA_VERSION, gearLinks, upgradeGearBundle }");
  s=rep(s,"assert.equal(seed.schemaVersion, 3);","assert.equal(seed.schemaVersion, 4);");
  s=rep(s,"2026-09-06-my-gear-v3-bonafide-rvr119-1",version);
  s=s.replaceAll("'Storage','Miscellaneous'","'Storage','Accessories'");
  s=rep(s,"assert.deepEqual(rvr119.manufacturer, {name:'Bonafide',url:'https://bonafidefishing.com/products/rvr119'});","assert.deepEqual(rvr119.manufacturer, {name:'Bonafide'});");
  s=rep(s,"assert.deepEqual(rvr119.links, [{kind:'retailer',label:'Eco Fishing',url:'https://ecofishingshop.com/products/bonafide-rvr119-fishing-kayak?variant=41430925508742'}]);","assert.deepEqual(rvr119.links, [\n  {label:'Bonafide',url:'https://bonafidefishing.com/products/rvr119'},\n  {label:'Eco Fishing',url:'https://ecofishingshop.com/products/bonafide-rvr119-fishing-kayak?variant=41430925508742'}\n]);");
  s=rep(s,"  assert.equal(links[0]?.kind, 'manufacturer', `${id} manufacturer link kind`);","  assert.ok(!links.some(link => Object.hasOwn(link,'kind')), `${id} links must not have classifications`);");
  s=rep(s,"const legacyFields = ['notes'","const legacyFields = ['notes'");
  const anchor="const clone = value => structuredClone(value);";
  s=rep(s,anchor,`const legacy = {schemaVersion:3,dataVersion:'legacy',items:[{id:'test-legacy',category:'accessories',type:'Miscellaneous',name:'Legacy',manufacturer:{name:'Maker',url:'https://example.com/maker'},links:[{kind:'retailer',label:'Shop',url:'https://example.com/shop'}]}]};
const upgraded = upgradeGearBundle(legacy);
assert.equal(upgraded.schemaVersion,4);
assert.equal(upgraded.items[0].type,'Accessories');
assert.deepEqual(upgraded.items[0].links,[{label:'Maker',url:'https://example.com/maker'},{label:'Shop',url:'https://example.com/shop'}]);
const invalidKind = structuredClone(seed); invalidKind.items.find(item=>item.id==='bonafide-rvr119').links[0].kind='retailer';
assert.equal(validateGearBundle(invalidKind).valid,false,'Link classifications must be rejected.');
const invalidManufacturerUrl = structuredClone(seed); invalidManufacturerUrl.items.find(item=>item.id==='bonafide-rvr119').manufacturer.url='https://example.com';
assert.equal(validateGearBundle(invalidManufacturerUrl).valid,false,'Manufacturer URLs must live in ordered Links.');

`+anchor);
  return s;
});
await edit('pwa/my-gear-routing.test.mjs',s=>{
  s=rep(s,"accessories: { label:'Accessories', iconHtml:ACCESSORIES_ICON }","accessories: { label:'Equipment', iconHtml:ACCESSORIES_ICON }");
  s=rep(s,"assert.match(gearApp, /data-link-kind/, 'Links must provide a link type field.');","assert.doesNotMatch(gearApp, /data-link-kind|gearManufacturerUrl/, 'Links must not expose classification or a separate manufacturer URL.');");
  s=rep(s,"assert.match(gearApp, /data-link-label/, 'Links must provide Link Text.');","assert.match(gearApp, /Create a new Gear item entry for handoff\./);\nassert.match(gearApp, /data-link-label/, 'Links must provide Link Text.');");
  return s;
});
await edit('pwa/kb-routing.test.mjs',s=>rep(s,"equipment: \\{ label:'Equipment', icon:'🧰', description:'Rigs, presentations, and gear guides\\.' \\}","equipment: \\{ label:'Gear Guides', icon:'🧰', description:'Equipment, rigs, and presentations reference' \\}"));
await edit('pwa/final-content.test.mjs',s=>{
  s=rep(s,'assert.equal(gear.schemaVersion, 3);','assert.equal(gear.schemaVersion, 4);');
  s=rep(s,'2026-09-06-my-gear-v3-bonafide-rvr119-1',version);
  return s;
});
console.log('Compatibility and regression edits completed.');
