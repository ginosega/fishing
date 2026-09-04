import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'dist');
const gear = JSON.parse(await fs.readFile(path.join(here, 'data', 'gear.seed.json'), 'utf8'));
const catches = JSON.parse(await fs.readFile(path.join(here, 'data', 'catches.seed.json'), 'utf8'));
const kb = JSON.parse(await fs.readFile(path.join(here, 'data', 'kb.seed.json'), 'utf8'));

const gearIds = new Set((gear.items || []).map(item => item.id));
const catchIds = new Set((catches.catches || []).map(record => record.id));
const kbIds = new Set((kb.entities || []).map(entity => entity.id));
const authoredMarkdown = [];

if ((gear.items || []).some(item => Object.hasOwn(item, 'notes'))) {
  throw new Error('Structured My Gear seed must not contain inline notes; use pwa/gear-content/<gear-id>.md.');
}
for (const record of catches.catches || []) {
  for (const field of ['exactSpotNotes', 'notes', 'source']) {
    if (Object.hasOwn(record, field)) throw new Error(`Structured Catch ${record.id} must not contain ${field}; use pwa/catch-content/<catch-id>.md for authored notes.`);
  }
}

await materializeNotes({
  label:'Gear Notes',
  sourceDir:'gear-content',
  ids:gearIds,
  localAssetRoot:'assets/gear-notes/',
  manifest:'gear-notes-assets.json'
});
await materializeNotes({
  label:'Catch Notes',
  sourceDir:'catch-content',
  ids:catchIds,
  localAssetRoot:'assets/catch-notes/',
  manifest:'catch-notes-assets.json'
});
await extendVideoTitles(authoredMarkdown);

async function materializeNotes(config) {
  const notesDir = path.join(here, config.sourceDir);
  let entries = [];
  try { entries = await fs.readdir(notesDir, { withFileTypes:true }); }
  catch (error) {
    if (error.code === 'ENOENT') entries = [];
    else throw error;
  }
  const noteFiles = entries
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map(entry => entry.name)
    .sort();

  const externalIds = new Set();
  const assets = new Set();
  for (const filename of noteFiles) {
    const id = filename.replace(/\.md$/i, '');
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`Invalid ${config.label} filename: ${filename}`);
    if (!config.ids.has(id)) throw new Error(`${config.label} file ${filename} does not match a current stable ID.`);
    if (externalIds.has(id)) throw new Error(`Duplicate ${config.label} stable ID: ${id}`);
    externalIds.add(id);

    const relativeContentPath = `${config.sourceDir}/${filename}`;
    const sourcePath = path.join(notesDir, filename);
    const markdown = await fs.readFile(sourcePath, 'utf8');
    if (!markdown.trim()) throw new Error(`${config.label} file ${filename} is empty.`);
    authoredMarkdown.push(markdown);
    validateLinks(markdown, config.label, id);
    await copyBuildFile(sourcePath, relativeContentPath, config.label);
    assets.add(`./${relativeContentPath}`);

    for (const imageTarget of extractMarkdownImages(markdown)) {
      if (/^https?:\/\//i.test(imageTarget)) continue;
      const imagePath = normalizeBuildPath(path.posix.join(path.posix.dirname(relativeContentPath), imageTarget));
      if (!imagePath.startsWith(config.localAssetRoot)) {
        throw new Error(`${relativeContentPath} references local image outside ./${config.localAssetRoot}: ${imageTarget}`);
      }
      await copyBuildFile(safePwaPath(imagePath), imagePath, config.label);
      assets.add(`./${imagePath}`);
    }
  }

  await fs.writeFile(path.join(out, config.manifest), JSON.stringify([...assets].sort(), null, 2));
  console.log(`${config.label}: ${externalIds.size} Markdown files validated and materialized (${assets.size} offline assets).`);
}

function validateLinks(markdown, label, recordId) {
  for (const target of extractMarkdownLinks(markdown)) {
    if (/^gear:\/\//i.test(target)) {
      const id = target.slice(7);
      if (!gearIds.has(id)) throw new Error(`${label} ${recordId} reference unknown My Gear ID ${id}.`);
      continue;
    }
    if (/^kb:\/\//i.test(target)) {
      const id = target.slice(5);
      if (!kbIds.has(id)) throw new Error(`${label} ${recordId} reference unknown KB ID ${id}.`);
      continue;
    }
    if (/^#\/(?:inventory|kb)(?:\/|$)/i.test(target)) {
      throw new Error(`${label} ${recordId} store a raw application route; use gear:// or kb:// instead: ${target}`);
    }
    if (/^(?:https?:\/\/|#)/i.test(target)) continue;
    if (/\.md(?:[?#].*)?$/i.test(target)) {
      throw new Error(`${label} ${recordId} link directly to Markdown; use gear:// or kb:// stable-ID navigation instead: ${target}`);
    }
  }
}

function extractMarkdownImages(markdown) {
  return [...String(markdown || '').matchAll(/!\[[^\]]*\]\((\S+?)(?:\s+["'][^"']*["'])?\)/g)]
    .map(match => match[1].replaceAll('&amp;', '&'));
}

function extractMarkdownLinks(markdown) {
  return [...String(markdown || '').matchAll(/(?<!!)\[[^\]]+\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)]
    .map(match => match[1].replaceAll('&amp;', '&'));
}

async function extendVideoTitles(markdownCorpus) {
  const file = path.join(out, 'video-titles.json');
  let existing = {};
  try { existing = JSON.parse(await fs.readFile(file, 'utf8')); } catch {}
  const ids = [...new Set(markdownCorpus.flatMap(extractYoutubeIds))].filter(id => !existing[id]);
  if (!ids.length) return;
  const entries = await mapLimit(ids, 8, fetchVideoTitle);
  for (const entry of entries.filter(Boolean)) existing[entry.id] = entry;
  await fs.writeFile(file, JSON.stringify(existing, null, 2));
  console.log(`Authored Notes video titles: ${entries.filter(Boolean).length}/${ids.length} additional titles resolved.`);
}

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

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    return await fetch(url, { redirect:'follow', signal:controller.signal, headers:{ 'user-agent':'Mozilla/5.0 FishingCompanionBuild/1.0' } });
  } catch { return null; }
  finally { clearTimeout(timeout); }
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
  await Promise.all(Array.from({length:Math.min(limit, items.length)}, run));
  return results;
}

function normalizeBuildPath(value) {
  const normalized = path.posix.normalize(String(value || '').replace(/^\.\//, ''));
  if (!normalized || normalized === '.' || normalized.startsWith('../') || path.posix.isAbsolute(normalized)) {
    throw new Error(`Unsafe build path: ${value}`);
  }
  return normalized;
}

function safePwaPath(relativePath) {
  const resolved = path.resolve(here, relativePath);
  if (resolved !== here && !resolved.startsWith(`${here}${path.sep}`)) throw new Error(`Path escapes pwa/: ${relativePath}`);
  return resolved;
}

async function copyBuildFile(sourcePath, relativePath, label) {
  const destination = path.join(out, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive:true });
  try { await fs.copyFile(sourcePath, destination); }
  catch (error) { throw new Error(`Missing required ${label} asset ${path.relative(here, sourcePath)}: ${error.message}`); }
}
