import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const out = path.join(here, 'dist');
const kbOut = path.join(out, 'kb');
const gearOut = path.join(out, 'assets', 'gear');
const buildVersion = (process.env.GITHUB_SHA || new Date().toISOString()).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);

const shellFiles = ['styles.css', 'app.js', 'media-ui.js', 'manifest.webmanifest', 'icon.svg'];
const kbFiles = [
  ['Fishing_Gear_Registry.md', 'Fishing_Gear_Registry.md'],
  ['Fishing_Tackle_Inventory.md', 'Fishing_Tackle_Inventory.md'],
  ['Topics/Rods_Reels_Line_Knots.md', 'Rods_Reels_Line_Knots.md'],
  ['Topics/Fishing_Techniques.md', 'Fishing_Techniques.md'],
  ['Topics/Local_Waters_Locations.md', 'Local_Waters_Locations.md'],
  ['Topics/Trip_Logs_Field_Observations.md', 'Trip_Logs_Field_Observations.md']
];

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(kbOut, { recursive: true });
await fs.mkdir(gearOut, { recursive: true });

for (const file of shellFiles) {
  await fs.copyFile(path.join(here, file), path.join(out, file));
}

const indexSource = await fs.readFile(path.join(here, 'index.html'), 'utf8');
const versionedIndex = indexSource
  .replace('./styles.css', `./styles.css?v=${buildVersion}`)
  .replace('./app.js', `./app.js?v=${buildVersion}`)
  .replace('./media-ui.js', `./media-ui.js?v=${buildVersion}`);
await fs.writeFile(path.join(out, 'index.html'), versionedIndex);

const kbMarkdown = [];
for (const [src, dest] of kbFiles) {
  const sourcePath = path.join(repoRoot, src);
  const markdown = await fs.readFile(sourcePath, 'utf8');
  kbMarkdown.push(markdown);
  await fs.writeFile(path.join(kbOut, dest), markdown);
}

const mediaManifest = JSON.parse(await fs.readFile(path.join(here, 'media-sources.json'), 'utf8'));
let mediaOverrides = {};
try {
  mediaOverrides = JSON.parse(await fs.readFile(path.join(here, 'media-overrides.json'), 'utf8'));
} catch {}
const mediaItems = (mediaManifest.items || []).map(item => ({ ...item, ...(mediaOverrides[item.id] || {}) }));
const mediaResults = await mapLimit(mediaItems, 6, buildGearMedia);
const successfulMedia = mediaResults.filter(Boolean);
await fs.writeFile(path.join(out, 'gear-media.json'), JSON.stringify(successfulMedia, null, 2));

const youtubeIds = [...new Set(kbMarkdown.flatMap(extractYoutubeIds))];
const videoEntries = await mapLimit(youtubeIds, 8, fetchVideoTitle);
const videoTitles = Object.fromEntries(videoEntries.filter(Boolean).map(entry => [entry.id, entry]));
await fs.writeFile(path.join(out, 'video-titles.json'), JSON.stringify(videoTitles, null, 2));

const sw = await fs.readFile(path.join(here, 'sw.js'), 'utf8');
await fs.writeFile(path.join(out, 'sw.js'), sw.replaceAll('__BUILD_VERSION__', buildVersion));
await fs.writeFile(path.join(out, 'build.json'), JSON.stringify({
  buildVersion,
  builtAt: new Date().toISOString(),
  source: 'GitHub Markdown knowledge base',
  gearImages: successfulMedia.length,
  requestedGearImages: mediaItems.length,
  videoTitles: Object.keys(videoTitles).length
}, null, 2));

const missingMedia = mediaItems.filter(item => !successfulMedia.some(result => result.id === item.id));
console.log(`Fishing Companion built at ${out}`);
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
      aliases: item.aliases || [],
      asset: `./assets/gear/${filename}`,
      alt: item.alt || item.aliases?.[0] || item.id,
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
    if ((attrs.rel || '').toLowerCase().split(/\s+/).includes('image_src') && attrs.href) {
      return absoluteUrl(decodeHtml(attrs.href), pageUrl);
    }
  }

  const jsonLdImage = /"image"\s*:\s*(?:\[\s*)?"(https?:\\?\/\\?\/[^"\\]+(?:\\.[^"\\]*)?)"/i.exec(html)?.[1];
  if (jsonLdImage) return decodeHtml(jsonLdImage.replaceAll('\\/', '/'));
  return '';
}

function parseAttributes(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return attrs;
}

function decodeHtml(value) {
  return String(value || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function absoluteUrl(value, base) {
  try { return new URL(value, base).href; } catch { return ''; }
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    return await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 FishingCompanionBuild/1.0',
        'accept': options.binary ? 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' : 'text/html,application/xhtml+xml,*/*;q=0.8'
      }
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function isImageResponse(response) {
  return (response?.headers.get('content-type') || '').toLowerCase().startsWith('image/');
}

function extensionFor(contentType, imageUrl) {
  const known = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/svg+xml': 'svg'
  };
  if (known[contentType]) return known[contentType];
  try {
    const ext = path.extname(new URL(imageUrl).pathname).replace('.', '').toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'].includes(ext)) return ext === 'jpeg' ? 'jpg' : ext;
  } catch {}
  return 'jpg';
}

function safeFilename(value) {
  return String(value || 'gear').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100) || 'gear';
}

function extractYoutubeIds(markdown) {
  const ids = [];
  for (const match of String(markdown || '').matchAll(/https?:\/\/(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^)\s]*&)?v=|shorts\/|embed\/))([A-Za-z0-9_-]{6,})/g)) {
    ids.push(match[1]);
  }
  return ids;
}

async function fetchVideoTitle(id) {
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`;
    const response = await fetchWithTimeout(endpoint);
    if (!response?.ok) return null;
    const data = await response.json();
    if (!data?.title) return null;
    return { id, title: data.title, author: data.author_name || '', playbackUrl: `https://www.youtube.com/watch?v=${id}` };
  } catch {
    return null;
  }
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}
