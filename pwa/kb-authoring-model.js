import { validateKbBundle, validateCatchBundle, KB_TYPES, KB_DESCRIPTION_MAX_LENGTH } from './kb-model.js';
import { STABLE_ID, uniqueStableId, isHttpUrl, isSafeImageFilename, validatePlainText, stableJson } from './authoring-common.js';
import { materializeKbEntity, kbPictureSource } from './kb-picture-model.js';

export const KB_CHANGE_FORMAT = 'fishing-companion-kb-change-v1';
export const KB_CONTENT_MAX_LENGTH = 100000;
const DIRS = {location:'locations',species:'species',equipment:'equipment',technique:'techniques',knot:'knots'};

export function newKbIdentity(type, name, bundle) {
  if (!KB_TYPES.includes(type)) return '';
  return uniqueStableId(name, (bundle?.entities || []).map(entity => entity.id), `${type}-`);
}
export function newKbContentPath(type, id) {
  if (!KB_TYPES.includes(type) || !STABLE_ID.test(id)) throw new Error('Invalid KB identity.');
  return `./kb-content/${DIRS[type]}/${id}.md`;
}

// Extract authored links, not code examples. The same policy is used in the
// browser, the promotion tool, and the repository build.
export function authoredTargets(markdown, images = false) {
  const text = String(markdown || '').replace(/(^|\n)[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n[ \t]*\2[^\n]*(?=\n|$)/g, '$1')
    .replace(/`+[^`\n]*`+/g, '');
  const pattern = images
    ? /!\[[^\]]*\]\((\S+?)(?:\s+["'][^"']*["'])?\)/g
    : /(?<!!)\[[^\]]+\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  return [...text.matchAll(pattern)].map(match => match[1].replaceAll('&amp;', '&'));
}
export function safeKbPath(value) {
  if (typeof value !== 'string' || !value.startsWith('./')) return false;
  const parts = value.slice(2).split('/');
  return parts.every(part => part && part !== '.' && part !== '..' && /^[a-z0-9._-]+$/i.test(part));
}
function resolveRelative(target, contentPath) {
  try {
    const url = new URL(target, new URL(contentPath.slice(2), 'https://local.invalid/'));
    if (url.origin !== 'https://local.invalid') return null;
    const pathname = decodeURIComponent(url.pathname);
    const normalized = `.${pathname}`;
    return safeKbPath(normalized) ? normalized : null;
  } catch { return null; }
}
export function validateKbMarkdown(markdown, entity, kbBundle, gearBundle, options = {}) {
  const errors = [];
  if (typeof markdown !== 'string' || !markdown.trim()) errors.push('Content Markdown is required.');
  if (typeof markdown !== 'string' || markdown.length > KB_CONTENT_MAX_LENGTH) errors.push(`Content Markdown must be ${KB_CONTENT_MAX_LENGTH.toLocaleString()} characters or fewer.`);
  if (errors.length) return errors;
  const kbIds = new Set(kbBundle.entities.map(row => row.id));
  const gearIds = new Set(gearBundle.items.map(row => row.id));
  const paths = new Set(kbBundle.entities.map(row => row.content));
  for (const target of authoredTargets(markdown)) {
    if (/^kb:\/\//i.test(target)) {
      if (!kbIds.has(target.slice(5))) errors.push(`Unknown Knowledge Base reference: ${target}`);
    } else if (/^gear:\/\//i.test(target)) {
      if (!gearIds.has(target.slice(7))) errors.push(`Unknown My Gear reference: ${target}`);
    } else if (/^https?:\/\//i.test(target)) {
      if (!isHttpUrl(target)) errors.push(`Invalid external link: ${target}`);
    } else if (target.startsWith('#') && !target.startsWith('#/')) {
      continue;
    } else if (/^#\/|^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')) {
      errors.push(`Use safe HTTP(S) or stable-ID links instead of ${target}.`);
    } else {
      const resolved = resolveRelative(target, entity.content);
      if (!resolved) errors.push(`Unsafe relative link: ${target}`);
      else if (/\.md$/i.test(resolved) && !paths.has(resolved)) errors.push(`Unregistered KB Markdown link: ${target}`);
    }
  }
  for (const target of authoredTargets(markdown, true)) {
    if (isHttpUrl(target)) continue;
    const resolved = resolveRelative(target, entity.content);
    if (!resolved) { errors.push(`Unsafe Markdown image: ${target}`); continue; }
    const ownDirectory = entity.content.slice(0, entity.content.lastIndexOf('/') + 1);
    const filename = resolved.slice(ownDirectory.length);
    const sibling = resolved.startsWith(ownDirectory) && !filename.includes('/') &&
      filename.startsWith(`${entity.id}-`) && isSafeImageFilename(filename);
    if (!resolved.startsWith('./assets/kb/') && !sibling) errors.push(`Local image must be in assets/kb/ or a safe ${entity.id}-prefixed sibling: ${target}`);
    else if (!options.allowMissingImages && options.availableAssets && !options.availableAssets.has(resolved)) errors.push(`Missing Markdown image: ${resolved}`);
  }
  return errors;
}

export function prepareKbChange(input) {
  if (!input || typeof input !== 'object') return {valid:false,errors:['A KB change request is required.']};
  const {bundle, gearBundle, catchBundle, original = null, originalMarkdown = '', markdown, picturePlan} = input;
  const sourceBundle = input.sourceBundle || bundle;
  const sourceOriginal = input.sourceOriginal === undefined ? original : input.sourceOriginal;
  const localMedia = input.localMedia || null;
  const availableMedia = input.availableMedia || picturePlan?.availableMedia || [];
  const errors = [];
  const entity = structuredClone(input.entity || {});
  const editing = Boolean(original);
  if (!Array.isArray(bundle?.entities) || !Array.isArray(sourceBundle?.entities) || !Array.isArray(gearBundle?.items) || !Array.isArray(catchBundle?.catches) || !picturePlan || typeof picturePlan !== 'object') return {valid:false,errors:['Current reference data and a picture decision are required.']};
  if (bundle.schemaVersion !== sourceBundle.schemaVersion || bundle.dataVersion !== sourceBundle.dataVersion) errors.push('The source and displayed KB versions do not match.');
  if (editing) {
    if (!sourceOriginal || sourceOriginal.id !== original.id || stableJson(sourceBundle.entities.find(row => row.id === original.id)) !== stableJson(sourceOriginal)) errors.push('The original repository entity does not match the source bundle.');
    else if (localMedia) {
      try { if (stableJson(materializeKbEntity(sourceOriginal,localMedia,availableMedia,gearBundle)) !== stableJson(original)) errors.push('The displayed picture differs from the current repository media mapping.'); }
      catch (error) { errors.push(error.message); }
    }
  }
  if (editing) {
    if (entity.id !== original.id) errors.push('An existing KB ID cannot change.');
    if (entity.content !== original.content) errors.push('An existing Markdown path cannot change.');
    if (!bundle.entities.some(row => row.id === original.id)) errors.push('The original KB entity no longer exists.');
  } else {
    if (!STABLE_ID.test(entity.id || '')) errors.push('A valid stable ID is required.');
    if (typeof entity.id !== 'string' || !entity.id.startsWith(`${entity.type}-`)) errors.push('New IDs must use their initial Type prefix.');
    if (bundle.entities.some(row => row.id === entity.id)) errors.push(`KB ID ${entity.id} already exists.`);
    if (KB_TYPES.includes(entity.type) && STABLE_ID.test(entity.id || '') && entity.content !== newKbContentPath(entity.type, entity.id)) errors.push('New Content path must use the generated stable-ID path.');
  }
  if (!KB_TYPES.includes(entity.type)) errors.push('Select a valid Type.');
  validatePlainText(entity.name, 'Name', 160, errors, true);
  validatePlainText(entity.description || '', 'Description', KB_DESCRIPTION_MAX_LENGTH, errors);
  if (entity.description === '') entity.description = null;
  const picture = normalizePicturePlan({...picturePlan,availableMedia}, original, entity.id, gearBundle, errors);
  entity.picture = picture.desired;
  const sourceEntity = structuredClone(entity);
  if (editing && picture.action === 'keep') sourceEntity.picture = structuredClone(sourceOriginal?.picture ?? null);
  else if (editing && picture.action === 'update' && sourceOriginal?.picture) {
    sourceEntity.picture = {...sourceOriginal.picture,alt:picture.desired.alt,caption:picture.desired.caption,credit:picture.desired.credit,sourceUrl:picture.desired.sourceUrl};
  }
  const candidate = {...bundle,entities:editing ? bundle.entities.map(row => row.id === entity.id ? entity : row) : [...bundle.entities,entity]};
  const sourceCandidate = {...sourceBundle,entities:editing ? sourceBundle.entities.map(row => row.id === entity.id ? sourceEntity : row) : [...sourceBundle.entities,sourceEntity]};
  const sourceValidation = validateKbBundle(sourceCandidate);
  errors.push(...sourceValidation.errors);
  const validation = validateKbBundle(candidate);
  errors.push(...validation.errors);
  if (validation.valid) {
    errors.push(...validateCatchBundle(catchBundle,candidate,gearBundle).errors);
    errors.push(...validateKbMarkdown(markdown,entity,candidate,gearBundle));
  }
  if (errors.length) return {valid:false,errors:[...new Set(errors)]};
  const content = {action:editing ? (markdown === originalMarkdown ? 'keep' : 'update') : 'create',
    path:`pwa/${entity.content.slice(2)}`, markdown};
  const summary = [];
  if (!editing) summary.push(`Add ${entity.type}: ${entity.name}.`);
  else for (const field of ['type','name','description']) if (original[field] !== entity[field]) summary.push(`${field}: ${original[field] || '(blank)'} → ${entity[field] || '(blank)'}`);
  if (content.action !== 'keep') summary.push(`Content: ${content.action} ${content.path}.`);
  if (!['none','keep'].includes(picture.action)) summary.push(`Picture: ${picture.action}${picture.uploadPath ? ` ${picture.uploadPath}` : ''}.`);
  if (!summary.length) summary.push('No changes detected.');
  const prepared = {format:KB_CHANGE_FORMAT,operation:editing?'edit':'add',kbId:entity.id,
    base:{schemaVersion:bundle.schemaVersion,dataVersion:bundle.dataVersion,entity:editing?structuredClone(original):null,sourceEntity:editing?structuredClone(sourceOriginal):null,localMedia:editing?structuredClone(kbPictureSource(original.id,localMedia)):null,markdown:editing?originalMarkdown:null},
    summary,entity,sourceEntity,content,picture};
  return {valid:true,errors:[],package:prepared};
}

function normalizePicturePlan(plan, original, id, gearBundle, errors) {
  const current = original?.picture ?? null;
  const action = plan.action;
  const allowed = current ? ['keep','update','remove','replace','reuse'] : ['none','add','reuse'];
  if (!allowed.includes(action)) errors.push('Select a valid picture action.');
  const result = {action, current:structuredClone(current), desired:current ? structuredClone(current) : null};
  const meta = plan.desired || plan;
  if (action === 'none' || action === 'remove') result.desired = null;
  if (action === 'keep') return result;
  if (action === 'update') {
    result.desired = {...current, alt:meta.alt || '', caption:meta.caption || null, credit:meta.credit || null, sourceUrl:meta.sourceUrl || null};
    if (typeof result.desired.alt !== 'string' || !result.desired.alt.trim()) errors.push('Picture alternative text is required.');
    if (meta.sourceUrl && !isHttpUrl(meta.sourceUrl)) errors.push('Picture source URL must use HTTP(S).');
    return result;
  }
  if (action === 'none' || action === 'remove') return result;
  if (action === 'reuse') {
    const media = (plan.availableMedia || []).find(row => row.id === plan.gearMediaId);
    const owner = media?.owners?.find(row => row.gearItemId === meta.gearItemId && gearBundle.items.some(item => item.id === row.gearItemId)) ||
      (!meta.gearItemId ? media?.owners?.find(row => gearBundle.items.some(item => item.id === row.gearItemId)) : null);
    if (!media?.asset || !owner) errors.push('Select an available, explicitly owned Gear picture.');
    else {
      result.gearMediaId = media.id;
      result.desired = {src:media.asset,alt:meta.alt || media.alt || id,caption:meta.caption || null,credit:meta.credit || null,sourceUrl:meta.sourceUrl || null,gearItemId:owner.gearItemId};
    }
  } else if (action === 'add' || action === 'replace') {
    const filename = plan.filename || plan.desired?.src?.split('/').pop() || '';
    const currentFilename = current?.src?.split('/').pop();
    if (!isSafeImageFilename(filename) || (!(filename.startsWith(`${id}-`) || filename.startsWith(`${id}.`)) && !(current?.src?.startsWith('./assets/kb/') && filename === currentFilename))) errors.push('Use a safe, stable-ID-prefixed image filename (or the exact current filename for replacement).');
    const sameSource = current?.src?.startsWith('./assets/kb/') && filename === currentFilename;
    const src = sameSource ? current.src : `./assets/kb/entries/${filename}`;
    result.filename = filename;
    result.uploadPath = `pwa/${src.slice(2)}`;
    result.desired = {src,alt:meta.alt || '',caption:meta.caption || null,credit:meta.credit || null,sourceUrl:meta.sourceUrl || null};
    if (meta.gearItemId) result.desired.gearItemId = meta.gearItemId;
    if (typeof result.desired.alt !== 'string' || !result.desired.alt.trim()) errors.push('Picture alternative text is required.');
    if (meta.sourceUrl && !isHttpUrl(meta.sourceUrl)) errors.push('Picture source URL must use HTTP(S).');
    if (meta.gearItemId && !gearBundle.items.some(item => item.id === meta.gearItemId)) errors.push('Picture references an unknown Gear item.');
  }
  return result;
}

export function validateKbChangePackage(pkg, bundle, gearBundle, catchBundle, originalMarkdown = null, availableMedia = [], options = {}) {
  if (!pkg || pkg.format !== KB_CHANGE_FORMAT || !pkg.entity || typeof pkg.entity !== 'object' || !pkg.content || !pkg.picture || !pkg.base || !bundle || !Array.isArray(bundle.entities) || !gearBundle || !catchBundle) return {valid:false,errors:['Unsupported or incomplete KB change package.']};
  const sourceBundle = options.sourceBundle || bundle;
  const localMedia = options.localMedia || null;
  const errors = [];
  if (!['add','edit'].includes(pkg.operation) || pkg.kbId !== pkg.entity?.id) errors.push('Invalid operation or identity.');
  if (pkg.base?.schemaVersion !== bundle.schemaVersion || pkg.base?.dataVersion !== bundle.dataVersion) errors.push('The KB data version has changed; reload the editor before preparing this change.');
  const sourceOriginal = sourceBundle.entities?.find(row => row.id === pkg.kbId) || null;
  let original = bundle.entities.find(row => row.id === pkg.kbId) || null;
  if (pkg.operation === 'edit' && localMedia && sourceOriginal) {
    try { original = materializeKbEntity(sourceOriginal,localMedia,availableMedia,gearBundle); }
    catch (error) { errors.push(error.message); }
  }
  if (stableJson(sourceOriginal) !== stableJson(pkg.base.sourceEntity)) errors.push('The repository source entity has changed since this package was prepared.');
  if (localMedia && stableJson(kbPictureSource(pkg.kbId,localMedia)) !== stableJson(pkg.base.localMedia)) errors.push('The KB media mapping has changed since this package was prepared.');
  if (pkg.operation === 'edit') {
    if (!original || stableJson(original) !== stableJson(pkg.base.entity)) errors.push('The existing entity has changed since this package was prepared.');
    if (originalMarkdown !== pkg.base.markdown) errors.push('The authored Markdown has changed since this package was prepared.');
  } else if (original) errors.push('The proposed ID is already in use.');
  const plan = {...pkg.picture,availableMedia};
  if (pkg.picture?.action === 'reuse') plan.gearMediaId = pkg.picture.gearMediaId;
  const result = prepareKbChange({bundle,gearBundle,catchBundle,original:pkg.operation === 'edit'?original:null,
    originalMarkdown:originalMarkdown ?? '',entity:pkg.entity,markdown:pkg.content?.markdown,picturePlan:plan,sourceBundle,sourceOriginal,localMedia,availableMedia});
  errors.push(...result.errors);
  if (result.valid) {
    if (stableJson(result.package.entity) !== stableJson(pkg.entity) || stableJson(result.package.sourceEntity) !== stableJson(pkg.sourceEntity) || stableJson(result.package.picture) !== stableJson(pkg.picture) ||
        stableJson(result.package.content) !== stableJson(pkg.content) || stableJson(result.package.summary) !== stableJson(pkg.summary)) errors.push('Package data does not match the validated change.');
  }
  return {valid:errors.length===0,errors};
}
