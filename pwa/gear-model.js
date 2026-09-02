export const GEAR_SCHEMA_VERSION = 1;
export const GEAR_CATEGORIES = ['rods-reels','line','weights','snaps-swivels','hooks','lures','bait'];

export function validateGearBundle(bundle) {
  const errors = [];
  if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) return { valid:false, errors:['Root value must be an object.'] };
  if (bundle.schemaVersion !== GEAR_SCHEMA_VERSION) errors.push(`schemaVersion must be ${GEAR_SCHEMA_VERSION}.`);
  if (!Array.isArray(bundle.items)) errors.push('items must be an array.');
  validateProfiles(bundle.profiles, errors);
  const connectionProfiles = new Set(Object.keys(bundle.profiles?.connections || {}));
  const usageProfiles = new Set(Object.keys(bundle.profiles?.usage || {}));
  const ids = new Set();
  for (const [index,item] of (bundle.items || []).entries()) {
    const at = `items[${index}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) { errors.push(`${at} must be an object.`); continue; }
    if (!isText(item.id)) errors.push(`${at}.id is required.`);
    else if (!/^[a-z0-9][a-z0-9-]*$/.test(item.id)) errors.push(`${at}.id must use lowercase letters, numbers, and hyphens only.`);
    else if (ids.has(item.id)) errors.push(`${at}.id duplicates ${item.id}.`);
    else ids.add(item.id);
    if (!GEAR_CATEGORIES.includes(item.category)) errors.push(`${at}.category must be one of ${GEAR_CATEGORIES.join(', ')}.`);
    if (!isText(item.type)) errors.push(`${at}.type is required.`);
    if (!isText(item.name)) errors.push(`${at}.name is required.`);
    if (item.category === 'rods-reels') {
      validateComponent(item.rod, `${at}.rod`, errors);
      validateComponent(item.reel, `${at}.reel`, errors);
    } else {
      if (!item.manufacturer || !isText(item.manufacturer.name)) errors.push(`${at}.manufacturer.name is required.`);
      if (!isText(item.model)) errors.push(`${at}.model is required.`);
      validateUrl(item.manufacturer?.url, `${at}.manufacturer.url`, errors);
    }
    validateSpecifications(item.specifications, `${at}.specifications`, errors);
    validateLinks(item.links, `${at}.links`, errors);
    if (item.connectionProfileId != null) {
      if (!isText(item.connectionProfileId)) errors.push(`${at}.connectionProfileId must be text.`);
      else if (!connectionProfiles.has(item.connectionProfileId)) errors.push(`${at}.connectionProfileId references unknown profile ${item.connectionProfileId}.`);
    }
    if (item.usageProfileId != null) {
      if (!isText(item.usageProfileId)) errors.push(`${at}.usageProfileId must be text.`);
      else if (!usageProfiles.has(item.usageProfileId)) errors.push(`${at}.usageProfileId references unknown profile ${item.usageProfileId}.`);
    }
    validateGuidance(item.connections, `${at}.connections`, errors);
    validateGuidance(item.usage, `${at}.usage`, errors);
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

export function resolveGuidance(bundle, item, kind) {
  const direct = Array.isArray(item?.[kind]) ? item[kind] : [];
  const profileId = kind === 'connections' ? item?.connectionProfileId : item?.usageProfileId;
  const profile = profileId ? bundle?.profiles?.[kind]?.[profileId] : null;
  return direct.length ? direct : (Array.isArray(profile) ? profile : []);
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

function validateComponent(component, at, errors) {
  if (!component || typeof component !== 'object') { errors.push(`${at} is required.`); return; }
  if (!component.manufacturer || !isText(component.manufacturer.name)) errors.push(`${at}.manufacturer.name is required.`);
  if (!isText(component.model)) errors.push(`${at}.model is required.`);
  validateUrl(component.manufacturer?.url, `${at}.manufacturer.url`, errors);
  validateSpecifications(component.specifications, `${at}.specifications`, errors);
  validateLinks(component.links, `${at}.links`, errors);
}

function validateSpecifications(specs, at, errors) {
  if (specs == null) return;
  if (!Array.isArray(specs)) { errors.push(`${at} must be an array.`); return; }
  specs.forEach((spec,index) => {
    if (!spec || typeof spec !== 'object' || !isText(spec.value)) errors.push(`${at}[${index}].value is required.`);
    if (spec?.label != null && !isText(spec.label)) errors.push(`${at}[${index}].label must be text.`);
  });
}

function validateLinks(links, at, errors) {
  if (links == null) return;
  if (!Array.isArray(links)) { errors.push(`${at} must be an array.`); return; }
  links.forEach((link,index) => {
    if (!link || typeof link !== 'object') { errors.push(`${at}[${index}] must be an object.`); return; }
    if (!isText(link.label)) errors.push(`${at}[${index}].label is required.`);
    if (!['retailer','resource','other'].includes(link.kind || 'other')) errors.push(`${at}[${index}].kind is invalid.`);
    validateUrl(link.url, `${at}[${index}].url`, errors, true);
  });
}

function validateGuidance(sections, at, errors) {
  if (sections == null) return;
  if (!Array.isArray(sections)) { errors.push(`${at} must be an array.`); return; }
  sections.forEach((section,index) => {
    if (!section || typeof section !== 'object') { errors.push(`${at}[${index}] must be an object.`); return; }
    if (section.title != null && !isText(section.title)) errors.push(`${at}[${index}].title must be text.`);
    if (section.html != null && !isText(section.html)) errors.push(`${at}[${index}].html must be text.`);
    if (section.text != null && !isText(section.text)) errors.push(`${at}[${index}].text must be text.`);
    if (section.html == null && section.text == null) errors.push(`${at}[${index}] must contain html or text.`);
  });
}

function validateProfiles(profiles, errors) {
  if (profiles == null) return;
  if (typeof profiles !== 'object' || Array.isArray(profiles)) { errors.push('profiles must be an object.'); return; }
  for (const kind of ['connections','usage']) {
    const group = profiles[kind] || {};
    if (typeof group !== 'object' || Array.isArray(group)) { errors.push(`profiles.${kind} must be an object.`); continue; }
    for (const [id,sections] of Object.entries(group)) validateGuidance(sections, `profiles.${kind}.${id}`, errors);
  }
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

function isText(value) { return typeof value === 'string' && value.trim().length > 0; }
