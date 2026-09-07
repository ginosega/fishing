// Resolve the repository-owned KB picture overlay without changing the source
// entity. Authoring and the build must use the same source/derived boundary.
import { STABLE_ID } from './authoring-common.js';

export function kbPictureSource(entityId, localMedia) {
  return (localMedia?.kb || []).find(row => row.entityId === entityId) || null;
}

export function materializeKbEntity(source, localMedia, gearMedia = [], gearBundle = null) {
  const entity = structuredClone(source);
  const matches = (localMedia?.kb || []).filter(row => row.entityId === entity.id);
  if (matches.length > 1) throw new Error(`Duplicate KB media mapping for ${entity.id}.`);
  const item = matches[0] || null;
  if (!item) return entity;
  const metadata = {
    alt:item.alt || entity.name,
    caption:item.caption || entity.name,
    credit:item.credit ?? null,
    sourceUrl:item.sourceUrl ?? null
  };
  if (item.gearMediaId) {
    const media = gearMedia.find(row => row.id === item.gearMediaId);
    if (!media?.asset) throw new Error(`KB ${entity.id} references unavailable Gear media ${item.gearMediaId}.`);
    const owner = media.owners?.find(row => row.gearItemId === item.gearItemId);
    if (!owner || !STABLE_ID.test(item.gearItemId) || (gearBundle && !gearBundle.items.some(row => row.id === item.gearItemId)))
      throw new Error(`KB ${entity.id} must reuse an explicitly owned Gear picture.`);
    entity.picture = {src:media.asset,...metadata,alt:item.alt || media.alt || entity.name,gearItemId:item.gearItemId};
  } else {
    if (typeof item.source !== 'string' || !/^\.\/assets\/kb\/[a-z0-9/_.-]+$/i.test(item.source) || item.source.slice(2).split('/').some(part => part === '.' || part === '..' || part === ''))
      throw new Error(`Unsafe KB image source for ${entity.id}.`);
    if (item.gearItemId && (!STABLE_ID.test(item.gearItemId) || (gearBundle && !gearBundle.items.some(row => row.id === item.gearItemId))))
      throw new Error(`KB ${entity.id} references unknown Gear owner ${item.gearItemId}.`);
    entity.picture = {src:item.source,...metadata,...(item.gearItemId ? {gearItemId:item.gearItemId} : {})};
  }
  return entity;
}

// Verify the complete overlay before materializing any source data. The
// source index remains authoritative; the overlay contains only image state.
export function validateKbMediaBundle(config, kbBundle, gearBundle, gearMedia = []) {
  const errors = [];
  if (!config || config.version !== 1 || !Array.isArray(config.kb)) return {valid:false,errors:['Invalid KB media manifest.']};
  const ids = new Set((kbBundle?.entities || []).map(row => row.id));
  const seen = new Set();
  for (const item of config.kb) {
    if (!item || !ids.has(item.entityId)) { errors.push(`Unknown KB media owner ${item?.entityId}.`); continue; }
    if (seen.has(item.entityId)) errors.push(`Duplicate KB media mapping for ${item.entityId}.`);
    seen.add(item.entityId);
    if (Object.keys(item).some(key => !['entityId','source','gearMediaId','gearItemId','alt','caption','credit','sourceUrl'].includes(key))) errors.push(`Unknown KB media field for ${item.entityId}.`);
    if (Boolean(item.source) === Boolean(item.gearMediaId)) errors.push(`KB ${item.entityId} needs exactly one image source.`);
    if (typeof item.alt !== 'string' || !item.alt.trim()) errors.push(`KB ${item.entityId} needs alternative text.`);
    if (item.sourceUrl != null && !isHttpUrl(item.sourceUrl)) errors.push(`Invalid image source URL for ${item.entityId}.`);
    try { materializeKbEntity(kbBundle.entities.find(row => row.id === item.entityId),config,gearMedia,gearBundle); }
    catch(error) { errors.push(error.message); }
  }
  return {valid:errors.length===0,errors};
}
function isHttpUrl(value) {
  try { return ['http:','https:'].includes(new URL(value).protocol); } catch { return false; }
}
