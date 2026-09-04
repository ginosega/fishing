export const GEAR_SCHEMA_VERSION = 3;
export const GEAR_CATEGORIES = ['rods-reels','line','weights','snaps-swivels','hooks','lures','bait'];

const ROOT_FIELDS = ['schemaVersion','dataVersion','items'];
const PRODUCT_FIELDS = ['id','category','type','name','manufacturer','model','specifications','links'];
const SETUP_FIELDS = ['id','category','type','name','rod','reel'];
const COMPONENT_FIELDS = ['manufacturer','model','specifications','links'];
const MANUFACTURER_FIELDS = ['name','url'];
const SPECIFICATION_FIELDS = ['label','value'];
const LINK_FIELDS = ['kind','label','url'];

export function validateGearBundle(bundle) {
  const errors = [];
  if (!isObject(bundle)) return { valid:false, errors:['Root value must be an object.'] };
  validateExactFields(bundle, ROOT_FIELDS, 'root', errors);
  if (bundle.schemaVersion !== GEAR_SCHEMA_VERSION) errors.push(`schemaVersion must be ${GEAR_SCHEMA_VERSION}.`);
  if (!isText(bundle.dataVersion)) errors.push('dataVersion is required.');
  if (!Array.isArray(bundle.items)) errors.push('items must be an array.');

  const ids = new Set();
  for (const [index,item] of (bundle.items || []).entries()) {
    const at = `items[${index}]`;
    if (!isObject(item)) { errors.push(`${at} must be an object.`); continue; }

    const isSetup = item.category === 'rods-reels';
    validateExactFields(item, isSetup ? SETUP_FIELDS : PRODUCT_FIELDS, at, errors);
    validateIdentity(item, at, ids, errors);

    if (isSetup) {
      validateComponent(item.rod, `${at}.rod`, errors);
      validateComponent(item.reel, `${at}.reel`, errors);
    } else {
      validateManufacturer(item.manufacturer, `${at}.manufacturer`, errors);
      if (!isText(item.model)) errors.push(`${at}.model is required.`);
      validateSpecifications(item.specifications, `${at}.specifications`, errors, true);
      validateLinks(item.links, `${at}.links`, errors, true);
    }

  }
  return { valid: errors.length === 0, errors };
}

export function gearDisplayModel(item) {
  if (item.category === 'rods-reels') return item.name;
  return [item.manufacturer?.name, item.model].filter(Boolean).join(' / ');
}

export function gearSpecificationText(item) {
  return (item.specifications || []).map(spec => spec.label ? `${spec.label}: ${spec.value}` : spec.value).filter(Boolean).join(', ');
}

export function gearLinks(item) {
  const links = [];
  if (item.category !== 'rods-reels' && item.manufacturer?.url) links.push({ kind:'manufacturer', label:item.manufacturer.name, url:item.manufacturer.url });
  for (const link of item.links || []) links.push(link);
  return dedupeLinks(links);
}

export function diffGearBundles(currentBundle, importedBundle) {
  const current = new Map((currentBundle.items || []).map(item => [item.id,item]));
  const incoming = new Map((importedBundle.items || []).map(item => [item.id,item]));
  const added = [], modified = [], deleted = [], unchanged = [];
  for (const [id,item] of incoming) {
    if (!current.has(id)) added.push(id);
    else if (stableJson(current.get(id)) !== stableJson(item)) modified.push(id);
    else unchanged.push(id);
  }
  for (const id of current.keys()) if (!incoming.has(id)) deleted.push(id);
  return { added, modified, deleted, unchanged };
}

function validateIdentity(item, at, ids, errors) {
  if (!isText(item.id)) errors.push(`${at}.id is required.`);
  else if (!/^[a-z0-9][a-z0-9-]*$/.test(item.id)) errors.push(`${at}.id must use lowercase letters, numbers, and hyphens only.`);
  else if (ids.has(item.id)) errors.push(`${at}.id duplicates ${item.id}.`);
  else ids.add(item.id);
  if (!GEAR_CATEGORIES.includes(item.category)) errors.push(`${at}.category must be one of ${GEAR_CATEGORIES.join(', ')}.`);
  if (!isText(item.type)) errors.push(`${at}.type is required.`);
  if (!isText(item.name)) errors.push(`${at}.name is required.`);
}

function validateComponent(component, at, errors) {
  if (!isObject(component)) { errors.push(`${at} is required.`); return; }
  validateExactFields(component, COMPONENT_FIELDS, at, errors);
  validateManufacturer(component.manufacturer, `${at}.manufacturer`, errors);
  if (!isText(component.model)) errors.push(`${at}.model is required.`);
  validateSpecifications(component.specifications, `${at}.specifications`, errors, true);
  validateLinks(component.links, `${at}.links`, errors, true);
}

function validateManufacturer(manufacturer, at, errors) {
  if (!isObject(manufacturer)) { errors.push(`${at} is required.`); return; }
  validateExactFields(manufacturer, MANUFACTURER_FIELDS, at, errors);
  if (!isText(manufacturer.name)) errors.push(`${at}.name is required.`);
  validateUrl(manufacturer.url, `${at}.url`, errors);
}

function validateSpecifications(specs, at, errors, required=false) {
  if (specs == null) { if (required) errors.push(`${at} is required.`); return; }
  if (!Array.isArray(specs)) { errors.push(`${at} must be an array.`); return; }
  specs.forEach((spec,index) => {
    const row = `${at}[${index}]`;
    if (!isObject(spec)) { errors.push(`${row} must be an object.`); return; }
    validateExactFields(spec, SPECIFICATION_FIELDS, row, errors);
    if (!isText(spec.value)) errors.push(`${row}.value is required.`);
    if (spec.label != null && !isText(spec.label)) errors.push(`${row}.label must be text.`);
  });
}

function validateLinks(links, at, errors, required=false) {
  if (links == null) { if (required) errors.push(`${at} is required.`); return; }
  if (!Array.isArray(links)) { errors.push(`${at} must be an array.`); return; }
  links.forEach((link,index) => {
    const row = `${at}[${index}]`;
    if (!isObject(link)) { errors.push(`${row} must be an object.`); return; }
    validateExactFields(link, LINK_FIELDS, row, errors);
    if (!isText(link.label)) errors.push(`${row}.label is required.`);
    if (!['retailer','resource','other'].includes(link.kind || 'other')) errors.push(`${row}.kind is invalid.`);
    validateUrl(link.url, `${row}.url`, errors, true);
  });
}


function validateExactFields(value, allowed, at, errors) {
  if (!isObject(value)) return;
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) if (!allowedSet.has(key)) errors.push(`${at}.${key} is not an allowed field.`);
}

function validateUrl(value, at, errors, required=false) {
  if (!value) { if (required) errors.push(`${at} is required.`); return; }
  try { const url = new URL(value); if (!['http:','https:'].includes(url.protocol)) throw new Error(); }
  catch { errors.push(`${at} must be an http(s) URL.`); }
}

function dedupeLinks(links) {
  const seen = new Set();
  return links.filter(link => {
    if (!link?.url || seen.has(link.url)) return false;
    seen.add(link.url); return true;
  });
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
function isText(value) { return typeof value === 'string' && value.trim().length > 0; }
