import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateGearBundle } from './gear-model.js';
import { validateKbBundle, validateCatchBundle } from './kb-model.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const out = path.join(here, 'dist');
const dataOut = path.join(out, 'data');
const gearOut = path.join(out, 'assets', 'gear');
const buildVersion = (process.env.GITHUB_SHA || new Date().toISOString()).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);

const shellFiles = ['styles.css', 'gear-app.js', 'kb-app.js', 'gear-store.js', 'gear-model.js', 'kb-model.js', 'markdown-render.js', 'media-ui.js', 'manifest.webmanifest', 'icon.svg'];

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(dataOut, { recursive: true });
await fs.mkdir(gearOut, { recursive: true });

for (const file of shellFiles) await fs.copyFile(path.join(here, file), path.join(out, file));

const gearSeed = JSON.parse(await fs.readFile(path.join(here, 'data', 'gear.seed.json'), 'utf8'));
const validation = validateGearBundle(gearSeed);
if (!validation.valid) throw new Error(`Invalid structured My Gear seed:\n${validation.errors.join('\n')}`);
await fs.writeFile(path.join(dataOut, 'gear.seed.json'), JSON.stringify(gearSeed, null, 2));

const kbSeed = JSON.parse(await fs.readFile(path.join(here, 'data', 'kb.seed.json'), 'utf8'));
const kbValidation = validateKbBundle(kbSeed);
if (!kbValidation.valid) throw new Error(`Invalid unified Knowledge Base seed:\n${kbValidation.errors.join('\n')}`);
await fs.writeFile(path.join(dataOut, 'kb.seed.json'), JSON.stringify(kbSeed, null, 2));

const catchSeed = JSON.parse(await fs.readFile(path.join(here, 'data', 'catches.seed.json'), 'utf8'));
const catchValidation = validateCatchBundle(catchSeed, kbSeed, gearSeed);
if (!catchValidation.valid) throw new Error(`Invalid structured Catch Log seed:\n${catchValidation.errors.join('\n')}`);
await fs.writeFile(path.join(dataOut, 'catches.seed.json'), JSON.stringify(catchSeed, null, 2));

const gearIds = new Set(gearSeed.items.map(item => item.id));
const kbIds = new Set(kbSeed.entities.map(entity => entity.id));
for (const item of gearSeed.items) validateGearNotesLinks(item.notes, item.id, gearIds, kbIds);

const indexSource = await fs.readFile(path.join(here, 'index.html'), 'utf8');
const versionedIndex = indexSource
  .replace('./styles.css', `./styles.css?v=${buildVersion}`)
  .replace('./gear-app.js', `./gear-app.js?v=${buildVersion}`)
  .replace('./kb-app.js', `./kb-app.js?v=${buildVersion}`)
  .replace('./media-ui.js', `./media-ui.js?v=${buildVersion}`);
await fs.writeFile(path.join(out, 'index.html'), versionedIndex);

const kbMarkdown = [];
const kbAssets = new Set();
const knownContentPaths = new Set(kbSeed.entities.map(entity => normalizeBuildPath(entity.content)));
for (const entity of kbSeed.entities) {
  const contentPath = normalizeBuildPath(entity.content);
  const sourcePath = safePwaPath(contentPath);
  const markdown = await fs.readFile(sourcePath, 'utf8');
  kbMarkdown.push(markdown);
  await copyBuildFile(sourcePath, contentPath);
  kbAssets.add(`./${contentPath}`);
  validateContentLinks(markdown, entity, knownContentPaths, gearIds, kbIds);
  for (const imageTarget of extractMarkdownImages(markdown)) {
    if (/^https?:\/\//i.test(imageTarget)) continue;
    const imagePath = normalizeBuildPath(path.posix.join(path.posix.dirname(contentPath), imageTarget));
    if (!imagePath.startsWith('assets/kb/')) throw new Error(`${entity.content} references local image outside ./assets/kb/: ${imageTarget}`);
    await copyBuildFile(safePwaPath(imagePath), imagePath);
    kbAssets.add(`./${imagePath}`);
  }
  if (entity.picture?.src && !/^https?:\/\//i.test(entity.picture.src)) {
    const picturePath = normalizeBuildPath(entity.picture.src);
    if (!picturePath.startsWith('assets/kb/')) throw new Error(`${entity.id}.picture.src must be inside ./assets/kb/.`);
    await copyBuildFile(safePwaPath(picturePath), picturePath);
    kbAssets.add(`./${picturePath}`);
  }
}
for (const record of catchSeed.catches) if (record.picture?.src && !/^https?:\/\//i.test(record.picture.src)) {
  const picturePath = normalizeBuildPath(record.picture.src);
  if (!picturePath.startsWith('assets/kb/')) throw new Error(`${record.id}.picture.src must be inside ./assets/kb/.`);
  await copyBuildFile(safePwaPath(picturePath), picturePath);
  kbAssets.add(`./${picturePath}`);
}
await fs.writeFile(path.join(out, 'kb-assets.json'), JSON.stringify([...kbAssets].sort(), null, 2));

const mediaManifest = JSON.parse(await fs.readFile(path.join(here, 'media-sources.json'), 'utf8'));
const mediaOwnershipManifest = JSON.parse(await fs.readFile(path.join(here, 'media-owners.json'), 'utf8'));
let mediaOverrides = {};
try { mediaOverrides = JSON.parse(await fs.readFile(path.join(here, 'media-overrides.json'), 'utf8')); } catch {}
const mediaOwners = validateMediaOwnership(mediaManifest, mediaOwnershipManifest, gearSeed);
const mediaItems = (mediaManifest.items || [])
  .filter(item => mediaOwners.has(item.id))
  .map(item => ({ ...item, ...(mediaOverrides[item.id] || {}), owners:mediaOwners.get(item.id) }));
const mediaResults = await mapLimit(mediaItems, 6, buildGearMedia);
const successfulMedia = mediaResults.filter(Boolean);
await fs.writeFile(path.join(out, 'gear-media.json'), JSON.stringify(successfulMedia, null, 2));

const youtubeCorpus = [...kbMarkdown, JSON.stringify(gearSeed), JSON.stringify(catchSeed)];
const youtubeIds = [...new Set(youtubeCorpus.flatMap(extractYoutubeIds))];
const videoEntries = await mapLimit(youtubeIds, 8, fetchVideoTitle);
const videoTitles = Object.fromEntries(videoEntries.filter(Boolean).map(entry => [entry.id, entry]));
await fs.writeFile(path.join(out, 'video-titles.json'), JSON.stringify(videoTitles, null, 2));

const sw = await fs.readFile(path.join(here, 'sw.js'), 'utf8');
await fs.writeFile(path.join(out, 'sw.js'), sw.replaceAll('__BUILD_VERSION__', buildVersion));
await fs.writeFile(path.join(out, 'build.json'), JSON.stringify({
  buildVersion,
  builtAt: new Date().toISOString(),
  source: 'Structured IndexedDB-backed My Gear + unified Markdown-content Knowledge Base + structured Catch Log',
  gearSchemaVersion: gearSeed.schemaVersion,
  gearRecords: gearSeed.items.length,
  kbSchemaVersion: kbSeed.schemaVersion,
  kbEntities: kbSeed.entities.length,
  catchSchemaVersion: catchSeed.schemaVersion,
  catches: catchSeed.catches.length,
  kbOfflineAssets: kbAssets.size,
  gearImages: successfulMedia.length,
  requestedGearImages: mediaItems.length,
  videoTitles: Object.keys(videoTitles).length
}, null, 2));

const missingMedia = mediaItems.filter(item => !successfulMedia.some(result => result.id === item.id));
console.log(`Fishing Companion built at ${out}`);
console.log(`Structured My Gear: ${gearSeed.items.length} records validated.`);
console.log(`Unified Knowledge Base: ${kbSeed.entities.length} entities and ${catchSeed.catches.length} catches validated.`);
console.log(`Knowledge Base offline assets: ${kbAssets.size}.`);
console.log(`Gear media: ${successfulMedia.length}/${mediaItems.length} cached locally.`);
if (missingMedia.length) console.warn(`Gear media unavailable this build: ${missingMedia.map(item => item.id).join(', ')}`);
console.log(`Video titles: ${Object.keys(videoTitles).length}/${youtubeIds.length} resolved.`);

async function buildGearMedia(item) {
  try {
    let imageUrl = item.imageSource || '';
    let imageResponse = imageUrl ? await fetchWithTimeout(imageUrl, { binary: true }) : null;
    if (!imageResponse?.ok || !isImageResponse(imageResponse)) {
      imageUrl = await discoverImage(item.sourcePage);
      imageResponse = imageUrl ? await fetchWithTimeout(imageUrl, { binary: true }) : null;
    }
    if (!imageResponse?.ok || !isImageResponse(imageResponse)) {
      console.warn(`No usable image for ${item.id}`);
      return null;
    }
    const bytes = Buffer.from(await imageResponse.arrayBuffer());
    if (!bytes.length || bytes.length > 10 * 1024 * 1024) {
      console.warn(`Skipped ${item.id}: image size ${bytes.length} bytes`);
      return null;
    }
    const contentType = (imageResponse.headers.get('content-type') || '').split(';')[0].toLowerCase();
    const extension = extensionFor(contentType, imageUrl);
    const filename = `${safeFilename(item.id)}.${extension}`;
    await fs.writeFile(path.join(gearOut, filename), bytes);
    return {
      id: item.id,
      owners: item.owners,
      asset: `./assets/gear/${filename}`,
      alt: item.alt || item.id,
      destination: item.destination || item.sourcePage || '',
      sourcePage: item.sourcePage || '',
      imageSource: imageUrl,
      bytes: bytes.length
    };
  } catch (error) {
    console.warn(`Gear media failed for ${item.id}: ${error.message}`);
    return null;
  }
}

async function discoverImage(pageUrl) {
  if (!pageUrl) return '';
  const response = await fetchWithTimeout(pageUrl);
  if (!response?.ok) return '';
  const html = await response.text();
  for (const rawTag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attrs = parseAttributes(rawTag);
    const key = (attrs.property || attrs.name || '').toLowerCase();
    if (!['og:image', 'og:image:secure_url', 'twitter:image', 'twitter:image:src'].includes(key)) continue;
    if (attrs.content) return absoluteUrl(decodeHtml(attrs.content), pageUrl);
  }
  for (const rawTag of html.match(/<link\b[^>]*>/gi) || []) {
    const attrs = parseAttributes(rawTag);
    if ((attrs.rel || '').toLowerCase().split(/\s+/).includes('image_src') && attrs.href) return absoluteUrl(decodeHtml(attrs.href), pageUrl);
  }
  const jsonLdImage = /"image"\s*:\s*(?:\[\s*)?"(https?:\\?\/\\?\/[^"\\]+(?:\\.[^"\\]*)?)"/i.exec(html)?.[1];
  if (jsonLdImage) return decodeHtml(jsonLdImage.replaceAll('\\/', '/'));
  return '';
}

function parseAttributes(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  return attrs;
}
function decodeHtml(value) { return String(value || '').replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>'); }
function absoluteUrl(value, base) { try { return new URL(value, base).href; } catch { return ''; } }

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    return await fetch(url, { redirect:'follow', signal:controller.signal, headers:{ 'user-agent':'Mozilla/5.0 FishingCompanionBuild/1.0', 'accept':options.binary ? 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' : 'text/html,application/xhtml+xml,*/*;q=0.8' } });
  } catch { return null; }
  finally { clearTimeout(timeout); }
}
function isImageResponse(response) { return (response?.headers.get('content-type') || '').toLowerCase().startsWith('image/'); }
function extensionFor(contentType, imageUrl) {
  const known = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/avif':'avif','image/svg+xml':'svg'};
  if (known[contentType]) return known[contentType];
  try { const ext = path.extname(new URL(imageUrl).pathname).replace('.', '').toLowerCase(); if (['jpg','jpeg','png','webp','gif','avif','svg'].includes(ext)) return ext === 'jpeg' ? 'jpg' : ext; } catch {}
  return 'jpg';
}
function safeFilename(value) { return String(value || 'gear').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100) || 'gear'; }
function extractYoutubeIds(text) {
  const ids = [];
  for (const match of String(text || '').matchAll(/https?:\/\/(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^)\s\"']*&)?v=|shorts\/|embed\/))([A-Za-z0-9_-]{6,})/g)) ids.push(match[1]);
  return ids;
}
async function fetchVideoTitle(id) {
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`;
    const response = await fetchWithTimeout(endpoint);
    if (!response?.ok) return null;
    const data = await response.json();
    if (!data?.title) return null;
    return { id, title:data.title, author:data.author_name || '', playbackUrl:`https://www.youtube.com/watch?v=${id}` };
  } catch { return null; }
}
async function mapLimit(items, limit, worker) {
  const results = new Array(items.length); let next = 0;
  async function run() { while (true) { const index = next++; if (index >= items.length) return; results[index] = await worker(items[index], index); } }
  await Promise.all(Array.from({length:Math.min(limit,items.length)}, run));
  return results;
}

function normalizeBuildPath(value) {
  const normalized = path.posix.normalize(String(value || '').replace(/^\.\//, ''));
  if (!normalized || normalized === '.' || normalized.startsWith('../') || path.posix.isAbsolute(normalized)) throw new Error(`Unsafe build path: ${value}`);
  return normalized;
}

function safePwaPath(relativePath) {
  const resolved = path.resolve(here, relativePath);
  if (resolved !== here && !resolved.startsWith(`${here}${path.sep}`)) throw new Error(`Path escapes pwa/: ${relativePath}`);
  return resolved;
}

async function copyBuildFile(sourcePath, relativePath) {
  const destination = path.join(out, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive:true });
  try { await fs.copyFile(sourcePath, destination); }
  catch (error) { throw new Error(`Missing required Knowledge Base asset ${path.relative(repoRoot, sourcePath)}: ${error.message}`); }
}

function extractMarkdownImages(markdown) {
  return [...String(markdown || '').matchAll(/!\[[^\]]*\]\((\S+?)(?:\s+["'][^"']*["'])?\)/g)].map(match => match[1].replaceAll('&amp;', '&'));
}

function extractMarkdownLinks(markdown) {
  return [...String(markdown || '').matchAll(/(?<!!)\[[^\]]+\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)].map(match => match[1].replaceAll('&amp;', '&'));
}

function validateGearNotesLinks(markdown, itemId, gearIds, kbIds) {
  if (!markdown) return;
  for (const target of extractMarkdownLinks(markdown)) {
    if (/^gear:\/\//i.test(target)) {
      const id = target.slice(7);
      if (!gearIds.has(id)) throw new Error(`My Gear ${itemId} notes reference unknown My Gear ID ${id}.`);
      continue;
    }
    if (/^kb:\/\//i.test(target)) {
      const id = target.slice(5);
      if (!kbIds.has(id)) throw new Error(`My Gear ${itemId} notes reference unknown KB ID ${id}.`);
      continue;
    }
    if (/^#\/(?:inventory|kb)(?:\/|$)/i.test(target)) throw new Error(`My Gear ${itemId} notes store a raw application route; use gear:// or kb:// instead: ${target}`);
  }
}

function validateContentLinks(markdown, entity, knownContentPaths, gearIds, kbIds) {
  for (const target of extractMarkdownLinks(markdown)) {
    if (/^gear:\/\//i.test(target)) {
      const id = target.slice(7);
      if (!gearIds.has(id)) throw new Error(`${entity.content} references unknown My Gear ID ${id}.`);
      continue;
    }
    if (/^kb:\/\//i.test(target)) {
      const id = target.slice(5);
      if (!kbIds.has(id)) throw new Error(`${entity.content} references unknown KB ID ${id}.`);
      continue;
    }
    if (/^(?:https?:\/\/|#)/i.test(target)) continue;
    const contentPath = normalizeBuildPath(entity.content);
    const resolved = normalizeBuildPath(path.posix.join(path.posix.dirname(contentPath), target.split(/[?#]/)[0]));
    if (/\.md$/i.test(resolved) && !knownContentPaths.has(resolved)) throw new Error(`${entity.content} links to unregistered KB Markdown ${target}.`);
  }
}

function validateMediaOwnership(mediaManifest, ownershipManifest, gearBundle) {
  if (!ownershipManifest || typeof ownershipManifest !== 'object' || Array.isArray(ownershipManifest)) throw new Error('media-owners.json must contain an object.');
  if (ownershipManifest.version !== 1) throw new Error('media-owners.json version must be 1.');
  if (!Array.isArray(ownershipManifest.items)) throw new Error('media-owners.json items must be an array.');

  const sourceIds = new Set();
  for (const item of mediaManifest.items || []) {
    if (!item?.id) throw new Error('media-sources.json contains an item without id.');
    if (sourceIds.has(item.id)) throw new Error(`media-sources.json duplicates media ID ${item.id}.`);
    sourceIds.add(item.id);
  }

  const gearById = new Map(gearBundle.items.map(item => [item.id,item]));
  const ownersByMedia = new Map();
  for (const [index,record] of ownershipManifest.items.entries()) {
    const at = `media-owners.items[${index}]`;
    if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error(`${at} must be an object.`);
    const fields = Object.keys(record);
    if (fields.some(field => !['mediaId','owners'].includes(field))) throw new Error(`${at} contains an unknown field.`);
    if (typeof record.mediaId !== 'string' || !record.mediaId) throw new Error(`${at}.mediaId is required.`);
    if (!sourceIds.has(record.mediaId)) throw new Error(`${at}.mediaId references unknown media source ${record.mediaId}.`);
    if (ownersByMedia.has(record.mediaId)) throw new Error(`${at}.mediaId duplicates ${record.mediaId}.`);
    if (!Array.isArray(record.owners) || !record.owners.length) throw new Error(`${at}.owners must be a non-empty array.`);

    const normalizedOwners = [];
    for (const [ownerIndex,owner] of record.owners.entries()) {
      const ownerAt = `${at}.owners[${ownerIndex}]`;
      if (!owner || typeof owner !== 'object' || Array.isArray(owner)) throw new Error(`${ownerAt} must be an object.`);
      if (Object.keys(owner).some(field => !['gearItemId','component'].includes(field))) throw new Error(`${ownerAt} contains an unknown field.`);
      const gearItem = gearById.get(owner.gearItemId);
      if (!gearItem) throw new Error(`${ownerAt}.gearItemId references unknown Gear ID ${owner.gearItemId}.`);
      if (owner.component != null) {
        if (!['rod','reel'].includes(owner.component)) throw new Error(`${ownerAt}.component must be rod or reel.`);
        if (gearItem.category !== 'rods-reels') throw new Error(`${ownerAt}.component is only valid for a Rods & Reels setup.`);
      } else if (gearItem.category === 'rods-reels') {
        throw new Error(`${ownerAt} must specify component for a Rods & Reels setup.`);
      }
      normalizedOwners.push({ gearItemId:owner.gearItemId, ...(owner.component ? {component:owner.component} : {}) });
    }
    ownersByMedia.set(record.mediaId, normalizedOwners);
  }
  return ownersByMedia;
}
