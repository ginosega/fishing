import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');
const gearOut = path.join(dist, 'assets', 'gear');
const config = JSON.parse(await fs.readFile(path.join(here, 'local-media.json'), 'utf8'));
const ownership = JSON.parse(await fs.readFile(path.join(here, 'media-owners.json'), 'utf8'));
const gearMediaPath = path.join(dist, 'gear-media.json');
const gearSeedPath = path.join(dist, 'data', 'gear.seed.json');
const kbSeedPath = path.join(dist, 'data', 'kb.seed.json');
const kbAssetsPath = path.join(dist, 'kb-assets.json');
const gearMedia = JSON.parse(await fs.readFile(gearMediaPath, 'utf8'));
const gearSeed = JSON.parse(await fs.readFile(gearSeedPath, 'utf8'));
const kbSeed = JSON.parse(await fs.readFile(kbSeedPath, 'utf8'));
const kbAssets = new Set(JSON.parse(await fs.readFile(kbAssetsPath, 'utf8')));

if (config.version !== 1) throw new Error('local-media.json version must be 1.');
if (!Array.isArray(config.gear) || !Array.isArray(config.kb) || !Array.isArray(config.staged)) {
  throw new Error('local-media.json gear, kb, and staged must be arrays.');
}

const ownersByMedia = new Map((ownership.items || []).map(record => [record.mediaId, record.owners]));
const gearById = new Map((gearSeed.items || []).map(item => [item.id, item]));
const byMediaId = new Map(gearMedia.map(record => [record.id, record]));
const kbById = new Map((kbSeed.entities || []).map(entity => [entity.id, entity]));
await fs.mkdir(gearOut, { recursive:true });

for (const item of config.gear) {
  const owners = resolveGearOwners(item);
  const source = localSource(item.source, 'assets/gear-source/');
  const bytes = await readValidatedImage(source);
  const extension = imageExtension(source, bytes);
  const filename = `${safeFilename(item.mediaId)}.${extension}`;
  await fs.writeFile(path.join(gearOut, filename), bytes);
  byMediaId.set(item.mediaId, {
    id:item.mediaId,
    owners,
    asset:`./assets/gear/${filename}`,
    alt:item.alt || item.mediaId,
    destination:item.destination || '',
    sourcePage:item.sourcePage || '',
    imageSource:item.source,
    bytes:bytes.length,
    localSource:true
  });
}

for (const item of config.kb) {
  if (!item.entityId) throw new Error('Local KB media entry is missing entityId.');
  const entity = kbById.get(item.entityId);
  if (!entity) throw new Error(`Local KB media references unknown entity ${item.entityId}.`);
  const source = localSource(item.source, 'assets/kb/');
  const bytes = await readValidatedImage(source);
  const relative = normalizeRelative(item.source);
  const built = path.join(dist, relative);
  await fs.mkdir(path.dirname(built), { recursive:true });
  await fs.writeFile(built, bytes);

  const previous = entity.picture?.src;
  if (typeof previous === 'string' && previous.startsWith('./assets/kb/') && previous !== item.source) {
    const oldRelative = normalizeRelative(previous);
    await fs.rm(path.join(dist, oldRelative), { force:true });
    kbAssets.delete(`./${oldRelative}`);
  }

  entity.picture = {
    src:item.source,
    alt:item.alt || entity.name,
    caption:item.caption || entity.name,
    credit:item.credit ?? null,
    sourceUrl:item.sourceUrl ?? null,
    ...(item.gearItemId ? { gearItemId:item.gearItemId } : {})
  };
  kbAssets.add(`./${relative}`);

  const builtBytes = await readValidatedImage(built);
  if (!bytes.equals(builtBytes)) throw new Error(`Built KB asset differs from repository source: ${item.source}`);
}

for (const item of config.staged) {
  const source = localSource(item.source, 'assets/gear-source/');
  await readValidatedImage(source);
}

await fs.writeFile(gearMediaPath, JSON.stringify([...byMediaId.values()], null, 2));
await fs.writeFile(kbSeedPath, JSON.stringify(kbSeed, null, 2));
await fs.writeFile(kbAssetsPath, JSON.stringify([...kbAssets].sort(), null, 2));
console.log(`Local media validated: ${config.gear.length} active Gear, ${config.kb.length} KB, ${config.staged.length} staged.`);

function resolveGearOwners(item) {
  if (!item.mediaId) throw new Error('Local Gear media entry is missing mediaId.');
  const explicit = item.owners;
  if (explicit != null) {
    if (!Array.isArray(explicit) || !explicit.length) throw new Error(`Local Gear media ${item.mediaId} owners must be a non-empty array.`);
    return explicit.map((owner, index) => validateGearOwner(owner, `${item.mediaId}.owners[${index}]`));
  }
  const mapped = ownersByMedia.get(item.mediaId);
  if (!mapped?.length) throw new Error(`Local Gear media ${item.mediaId} has no explicit owner mapping.`);
  return mapped.map((owner, index) => validateGearOwner(owner, `${item.mediaId}.mappedOwners[${index}]`));
}

function validateGearOwner(owner, at) {
  if (!owner || typeof owner !== 'object' || Array.isArray(owner)) throw new Error(`${at} must be an object.`);
  if (Object.keys(owner).some(field => !['gearItemId','component'].includes(field))) throw new Error(`${at} contains an unknown field.`);
  const gearItem = gearById.get(owner.gearItemId);
  if (!gearItem) throw new Error(`${at}.gearItemId references unknown Gear ID ${owner.gearItemId}.`);
  if (owner.component != null) {
    if (!['rod','reel'].includes(owner.component)) throw new Error(`${at}.component must be rod or reel.`);
    if (gearItem.category !== 'rods-reels') throw new Error(`${at}.component is only valid for Rods & Reels.`);
  } else if (gearItem.category === 'rods-reels') {
    throw new Error(`${at} must specify component for a Rods & Reels setup.`);
  }
  return { gearItemId:owner.gearItemId, ...(owner.component ? { component:owner.component } : {}) };
}

function localSource(value, requiredPrefix) {
  const relative = normalizeRelative(value);
  if (!relative.startsWith(requiredPrefix)) throw new Error(`Local media path must be inside ${requiredPrefix}: ${value}`);
  const resolved = path.resolve(here, relative);
  if (!resolved.startsWith(`${here}${path.sep}`)) throw new Error(`Local media path escapes pwa/: ${value}`);
  return resolved;
}

function normalizeRelative(value) {
  const relative = path.posix.normalize(String(value || '').replace(/^\.\//, ''));
  if (!relative || relative === '.' || relative.startsWith('../') || path.posix.isAbsolute(relative)) throw new Error(`Unsafe local media path: ${value}`);
  return relative;
}

async function readValidatedImage(filename) {
  const bytes = await fs.readFile(filename);
  if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error(`Invalid image size for ${filename}: ${bytes.length}`);
  const detected = detectImageType(bytes, filename);
  assertExtensionMatches(filename, detected);
  return bytes;
}

function imageExtension(filename, bytes) {
  const detected = detectImageType(bytes, filename);
  return detected === 'jpeg' ? 'jpg' : detected;
}

function detectImageType(bytes, filename='image') {
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9) return 'jpeg';
  const pngSignature = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  const pngEnd = Buffer.from([0x49,0x45,0x4e,0x44,0xae,0x42,0x60,0x82]);
  if (bytes.length >= 20 && bytes.subarray(0,8).equals(pngSignature) && bytes.subarray(-8).equals(pngEnd)) return 'png';
  if (isStructurallyValidWebp(bytes)) return 'webp';
  const gif = bytes.subarray(0,6).toString('ascii');
  if ((gif === 'GIF87a' || gif === 'GIF89a') && bytes.at(-1) === 0x3b) return 'gif';
  throw new Error(`Unsupported or structurally invalid image: ${filename}`);
}

function isStructurallyValidWebp(bytes) {
  if (bytes.length < 20 || bytes.subarray(0,4).toString('ascii') !== 'RIFF' || bytes.subarray(8,12).toString('ascii') !== 'WEBP') return false;
  if (bytes.readUInt32LE(4) + 8 !== bytes.length) return false;
  let offset = 12;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) return false;
    const chunkLength = bytes.readUInt32LE(offset + 4);
    offset += 8 + chunkLength + (chunkLength % 2);
    if (offset > bytes.length) return false;
  }
  return offset === bytes.length;
}

function assertExtensionMatches(filename, detected) {
  const ext = path.extname(filename).toLowerCase();
  const expected = detected === 'jpeg' ? ['.jpg','.jpeg'] : [`.${detected}`];
  if (!expected.includes(ext)) throw new Error(`Image extension does not match content for ${filename}: detected ${detected}`);
}

function safeFilename(value) {
  return String(value || 'gear').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0,100) || 'gear';
}
