import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');
const gearOut = path.join(dist, 'assets', 'gear');
const config = JSON.parse(await fs.readFile(path.join(here, 'local-media.json'), 'utf8'));
const ownership = JSON.parse(await fs.readFile(path.join(here, 'media-owners.json'), 'utf8'));
const gearMediaPath = path.join(dist, 'gear-media.json');
const gearMedia = JSON.parse(await fs.readFile(gearMediaPath, 'utf8'));

if (config.version !== 1) throw new Error('local-media.json version must be 1.');
if (!Array.isArray(config.gear) || !Array.isArray(config.kb) || !Array.isArray(config.staged)) {
  throw new Error('local-media.json gear, kb, and staged must be arrays.');
}

const ownersByMedia = new Map((ownership.items || []).map(record => [record.mediaId, record.owners]));
const byMediaId = new Map(gearMedia.map(record => [record.id, record]));
await fs.mkdir(gearOut, { recursive:true });

for (const item of config.gear) {
  const owners = ownersByMedia.get(item.mediaId);
  if (!owners?.length) throw new Error(`Local Gear media ${item.mediaId} has no explicit owner mapping.`);
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
  const source = localSource(item.source, 'assets/kb/');
  const bytes = await readValidatedImage(source);
  const relative = normalizeRelative(item.source);
  const built = path.join(dist, relative);
  const builtBytes = await readValidatedImage(built);
  if (!bytes.equals(builtBytes)) throw new Error(`Built KB asset differs from repository source: ${item.source}`);
}

for (const item of config.staged) {
  const source = localSource(item.source, 'assets/gear-source/');
  await readValidatedImage(source);
}

await fs.writeFile(gearMediaPath, JSON.stringify([...byMediaId.values()], null, 2));
console.log(`Local media validated: ${config.gear.length} active Gear, ${config.kb.length} KB, ${config.staged.length} staged.`);

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
  detectImageType(bytes, filename);
  return bytes;
}

function imageExtension(filename, bytes) {
  const detected = detectImageType(bytes, filename);
  return detected === 'jpeg' ? 'jpg' : detected;
}

function detectImageType(bytes, filename='image') {
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9) return 'jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return 'png';
  if (bytes.length >= 12 && bytes.subarray(0,4).toString('ascii') === 'RIFF' && bytes.subarray(8,12).toString('ascii') === 'WEBP') return 'webp';
  const gif = bytes.subarray(0,6).toString('ascii');
  if (gif === 'GIF87a' || gif === 'GIF89a') return 'gif';
  throw new Error(`Unsupported or structurally invalid image: ${filename}`);
}

function safeFilename(value) {
  return String(value || 'gear').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0,100) || 'gear';
}
