export const KB_SCHEMA_VERSION = 1;
export const CATCH_SCHEMA_VERSION = 1;
export const KB_DESCRIPTION_MAX_LENGTH = 80;
export const KB_TYPES = ['location', 'species', 'technique', 'knot'];

const ENTITY_FIELDS = ['id', 'type', 'name', 'description', 'picture', 'content'];
const CATCH_FIELDS = ['id', 'date', 'time', 'size', 'speciesId', 'locationId', 'exactSpotNotes', 'rodReelSetupId', 'techniqueId', 'lureOrBait', 'picture', 'notes', 'source'];

export function validateKbBundle(bundle) {
  const errors = [];
  if (!isObject(bundle)) return invalid('Root value must be an object.');
  if (bundle.schemaVersion !== KB_SCHEMA_VERSION) errors.push(`schemaVersion must be ${KB_SCHEMA_VERSION}.`);
  if (!isText(bundle.dataVersion)) errors.push('dataVersion is required.');
  if (!Array.isArray(bundle.entities)) errors.push('entities must be an array.');

  const ids = new Set();
  const contentPaths = new Set();
  for (const [index, entity] of (bundle.entities || []).entries()) {
    const at = `entities[${index}]`;
    if (!isObject(entity)) { errors.push(`${at} must be an object.`); continue; }
    validateExactFields(entity, ENTITY_FIELDS, at, errors);
    validateStableId(entity.id, at, errors, ids);
    if (!KB_TYPES.includes(entity.type)) errors.push(`${at}.type must be one of ${KB_TYPES.join(', ')}.`);
    if (KB_TYPES.includes(entity.type) && isText(entity.id) && !entity.id.startsWith(`${entity.type}-`)) errors.push(`${at}.id must start with ${entity.type}-.`);
    if (!isText(entity.name)) errors.push(`${at}.name is required.`);
    if (entity.description != null && !isText(entity.description)) errors.push(`${at}.description must be text or null.`);
    else if (entity.description?.length > KB_DESCRIPTION_MAX_LENGTH) errors.push(`${at}.description must be ${KB_DESCRIPTION_MAX_LENGTH} characters or fewer.`);
    validatePicture(entity.picture, `${at}.picture`, errors);
    if (!isText(entity.content) || !/^\.\/kb-content\/[a-z0-9/_-]+\.md$/.test(entity.content)) errors.push(`${at}.content must be a repository-relative ./kb-content/... Markdown path.`);
    else if (contentPaths.has(entity.content)) errors.push(`${at}.content duplicates ${entity.content}.`);
    else contentPaths.add(entity.content);
  }
  return { valid: errors.length === 0, errors };
}

export function validateCatchBundle(bundle, kbBundle, gearBundle) {
  const errors = [];
  if (!isObject(bundle)) return invalid('Root value must be an object.');
  if (bundle.schemaVersion !== CATCH_SCHEMA_VERSION) errors.push(`schemaVersion must be ${CATCH_SCHEMA_VERSION}.`);
  if (!isText(bundle.dataVersion)) errors.push('dataVersion is required.');
  if (!Array.isArray(bundle.catches)) errors.push('catches must be an array.');

  const entities = new Map((kbBundle?.entities || []).map(entity => [entity.id, entity]));
  const gear = new Map((gearBundle?.items || []).map(item => [item.id, item]));
  const ids = new Set();
  for (const [index, record] of (bundle.catches || []).entries()) {
    const at = `catches[${index}]`;
    if (!isObject(record)) { errors.push(`${at} must be an object.`); continue; }
    validateExactFields(record, CATCH_FIELDS, at, errors);
    validateStableId(record.id, at, errors, ids, 'catch-');
    if (!isIsoDate(record.date)) errors.push(`${at}.date must be a valid ISO date.`);
    if (record.time != null && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(record.time)) errors.push(`${at}.time must be HH:MM or null.`);
    validateSize(record.size, `${at}.size`, errors);
    validateEntityReference(record.speciesId, 'species', `${at}.speciesId`, entities, errors, true);
    validateEntityReference(record.locationId, 'location', `${at}.locationId`, entities, errors, true);
    if (record.exactSpotNotes != null && !isText(record.exactSpotNotes)) errors.push(`${at}.exactSpotNotes must be Markdown text or null.`);
    validateGearReference(record.rodReelSetupId, 'rods-reels', `${at}.rodReelSetupId`, gear, errors, false);
    validateEntityReference(record.techniqueId, 'technique', `${at}.techniqueId`, entities, errors, false);
    validateLureOrBait(record.lureOrBait, `${at}.lureOrBait`, gear, errors);
    validatePicture(record.picture, `${at}.picture`, errors);
    if (record.notes != null && !isText(record.notes)) errors.push(`${at}.notes must be Markdown text or null.`);
    if (!isText(record.source)) errors.push(`${at}.source is required.`);
  }
  return { valid: errors.length === 0, errors };
}

export function groupEntitiesByType(bundle) {
  return Object.fromEntries(KB_TYPES.map(type => [type, (bundle?.entities || []).filter(entity => entity.type === type)]));
}

export function catchesForEntity(catchBundle, field, id) {
  return (catchBundle?.catches || []).filter(record => record?.[field] === id);
}

function validateLureOrBait(value, at, gear, errors) {
  if (!isObject(value)) { errors.push(`${at} is required.`); return; }
  validateExactFields(value, ['type', 'itemId', 'nameSnapshot'], at, errors);
  if (!['lure', 'bait'].includes(value.type)) errors.push(`${at}.type must be lure or bait.`);
  const expectedCategory = value.type === 'lure' ? 'lures' : value.type === 'bait' ? 'bait' : null;
  if (expectedCategory) validateGearReference(value.itemId, expectedCategory, `${at}.itemId`, gear, errors, true);
  if (!isText(value.nameSnapshot)) errors.push(`${at}.nameSnapshot is required.`);
}

function validateSize(value, at, errors) {
  if (!isObject(value)) { errors.push(`${at} is required.`); return; }
  validateExactFields(value, ['length', 'weight', 'display'], at, errors);
  validateMeasurement(value.length, `${at}.length`, errors, ['in', 'cm']);
  validateMeasurement(value.weight, `${at}.weight`, errors, ['oz', 'lb', 'g']);
  if (value.display != null && !isText(value.display)) errors.push(`${at}.display must be text or null.`);
  if (value.length == null && value.weight == null && value.display == null) errors.push(`${at} must contain length, weight, or display.`);
}

function validateMeasurement(value, at, errors, units) {
  if (value == null) return;
  if (!isObject(value)) { errors.push(`${at} must be an object or null.`); return; }
  validateExactFields(value, ['value', 'unit'], at, errors);
  if (typeof value.value !== 'number' || !Number.isFinite(value.value) || value.value <= 0) errors.push(`${at}.value must be a positive number.`);
  if (!isText(value.unit)) errors.push(`${at}.unit is required.`);
  else if (!units.includes(value.unit)) errors.push(`${at}.unit must be one of ${units.join(', ')}.`);
}

function validatePicture(value, at, errors) {
  if (value == null) return;
  if (!isObject(value)) { errors.push(`${at} must be an object or null.`); return; }
  validateExactFields(value, ['src', 'alt', 'caption', 'credit', 'sourceUrl'], at, errors);
  if (!isText(value.src) || !isSafeAssetSource(value.src)) errors.push(`${at}.src must be a safe local path or http(s) URL.`);
  if (!isText(value.alt)) errors.push(`${at}.alt is required.`);
  for (const field of ['caption', 'credit']) if (value[field] != null && !isText(value[field])) errors.push(`${at}.${field} must be text or null.`);
  if (value.sourceUrl != null && !isHttpUrl(value.sourceUrl)) errors.push(`${at}.sourceUrl must be an http(s) URL or null.`);
}

function validateEntityReference(id, type, at, entities, errors, required) {
  if (id == null) { if (required) errors.push(`${at} is required.`); return; }
  if (!isText(id)) { errors.push(`${at} must be text${required ? '' : ' or null'}.`); return; }
  const entity = entities.get(id);
  if (!entity) errors.push(`${at} references unknown entity ${id}.`);
  else if (entity.type !== type) errors.push(`${at} must reference a ${type} entity.`);
}

function validateGearReference(id, category, at, gear, errors, required) {
  if (id == null) { if (required) errors.push(`${at} is required.`); return; }
  if (!isText(id)) { errors.push(`${at} must be text${required ? '' : ' or null'}.`); return; }
  const item = gear.get(id);
  if (!item) errors.push(`${at} references unknown My Gear record ${id}.`);
  else if (item.category !== category) errors.push(`${at} must reference My Gear category ${category}.`);
}

function validateStableId(id, at, errors, ids, prefix = '') {
  if (!isText(id)) errors.push(`${at}.id is required.`);
  else if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) errors.push(`${at}.id must use lowercase letters, numbers, and hyphens only.`);
  else if (prefix && !id.startsWith(prefix)) errors.push(`${at}.id must start with ${prefix}.`);
  else if (ids.has(id)) errors.push(`${at}.id duplicates ${id}.`);
  else ids.add(id);
}

function validateExactFields(value, fields, at, errors) {
  const allowed = new Set(fields);
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${at}.${key} is not part of the schema.`);
  for (const key of fields) if (!(key in value)) errors.push(`${at}.${key} must be present.`);
}

function isSafeAssetSource(value) { return /^https?:\/\//i.test(value) || /^\.\/assets\/kb\/[a-z0-9/_.-]+$/i.test(value); }
function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function isHttpUrl(value) { try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; } }
function isObject(value) { return value != null && typeof value === 'object' && !Array.isArray(value); }
function isText(value) { return typeof value === 'string' && value.trim().length > 0; }
function invalid(message) { return { valid: false, errors: [message] }; }
