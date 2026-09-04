import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'dist');
const notesDir = path.join(here, 'gear-content');
const gear = JSON.parse(await fs.readFile(path.join(here, 'data', 'gear.seed.json'), 'utf8'));
const kb = JSON.parse(await fs.readFile(path.join(here, 'data', 'kb.seed.json'), 'utf8'));

const gearIds = new Set((gear.items || []).map(item => item.id));
const kbIds = new Set((kb.entities || []).map(entity => entity.id));
const legacyNoteIds = new Set((gear.items || []).filter(item => typeof item.notes === 'string' && item.notes.trim()).map(item => item.id));
const noteFiles = (await fs.readdir(notesDir, { withFileTypes:true }))
  .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
  .map(entry => entry.name)
  .sort();

const externalNoteIds = new Set();
const assets = new Set();

for (const filename of noteFiles) {
  const id = filename.replace(/\.md$/i, '');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`Invalid Gear Notes filename: ${filename}`);
  if (!gearIds.has(id)) throw new Error(`Gear Notes file ${filename} does not match a current Gear stable ID.`);
  if (externalNoteIds.has(id)) throw new Error(`Duplicate Gear Notes stable ID: ${id}`);
  externalNoteIds.add(id);

  const relativeContentPath = `gear-content/${filename}`;
  const sourcePath = path.join(notesDir, filename);
  const markdown = await fs.readFile(sourcePath, 'utf8');
  if (!markdown.trim()) throw new Error(`Gear Notes file ${filename} is empty.`);

  validateLinks(markdown, id);
  await copyBuildFile(sourcePath, relativeContentPath);
  assets.add(`./${relativeContentPath}`);

  for (const imageTarget of extractMarkdownImages(markdown)) {
    if (/^https?:\/\//i.test(imageTarget)) continue;
    const imagePath = normalizeBuildPath(path.posix.join(path.posix.dirname(relativeContentPath), imageTarget));
    if (!imagePath.startsWith('assets/gear-notes/')) {
      throw new Error(`${relativeContentPath} references local image outside ./assets/gear-notes/: ${imageTarget}`);
    }
    await copyBuildFile(safePwaPath(imagePath), imagePath);
    assets.add(`./${imagePath}`);
  }
}

for (const id of legacyNoteIds) {
  if (!externalNoteIds.has(id)) throw new Error(`Legacy inline Notes for ${id} have not been migrated to gear-content/${id}.md.`);
}

await fs.writeFile(path.join(out, 'gear-notes-assets.json'), JSON.stringify([...assets].sort(), null, 2));
console.log(`External Gear Notes: ${externalNoteIds.size} Markdown files validated and materialized (${assets.size} offline assets).`);

function validateLinks(markdown, itemId) {
  for (const target of extractMarkdownLinks(markdown)) {
    if (/^gear:\/\//i.test(target)) {
      const id = target.slice(7);
      if (!gearIds.has(id)) throw new Error(`Gear Notes ${itemId} reference unknown My Gear ID ${id}.`);
      continue;
    }
    if (/^kb:\/\//i.test(target)) {
      const id = target.slice(5);
      if (!kbIds.has(id)) throw new Error(`Gear Notes ${itemId} reference unknown KB ID ${id}.`);
      continue;
    }
    if (/^#\/(?:inventory|kb)(?:\/|$)/i.test(target)) {
      throw new Error(`Gear Notes ${itemId} store a raw application route; use gear:// or kb:// instead: ${target}`);
    }
    if (/^(?:https?:\/\/|#)/i.test(target)) continue;
    if (/\.md(?:[?#].*)?$/i.test(target)) {
      throw new Error(`Gear Notes ${itemId} link directly to Markdown; use gear:// or kb:// stable-ID navigation instead: ${target}`);
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

async function copyBuildFile(sourcePath, relativePath) {
  const destination = path.join(out, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive:true });
  try { await fs.copyFile(sourcePath, destination); }
  catch (error) { throw new Error(`Missing required Gear Notes asset ${path.relative(here, sourcePath)}: ${error.message}`); }
}
