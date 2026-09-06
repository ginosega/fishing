import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const RUNTIME_MODULES = ['gear-app.js', 'kb-app.js', 'gear-store.js', 'gear-model.js', 'kb-model.js', 'markdown-render.js', 'media-ui.js'];
const MODULE_SET = new Set(RUNTIME_MODULES);

export function versionModuleSource(source, version) {
  const suffix = `?v=${encodeURIComponent(version)}`;
  return source.replace(/((?:\bfrom\s*|\bimport\s*\(|\bimport\s*)['"])(\.\/([a-z][a-z0-9-]*\.js))(['"])/g, (match, before, target, filename, after) =>
    MODULE_SET.has(filename) ? `${before}${target}${suffix}${after}` : match);
}

export function versionRuntimeIndex(source, version) {
  const suffix = `?v=${encodeURIComponent(version)}`;
  // The main builder already versions entry scripts. Replace those values rather
  // than accumulating query strings on repeated or incremental builds.
  return source.replace(/((?:src|href)=["']\.\/)(styles\.css|gear-app\.js|kb-app\.js|media-ui\.js)(?:\?v=[^"']*)?(["'])/g,
    (match, before, filename, after) => `${before}${filename}${suffix}${after}`);
}

export function versionServiceWorker(source, version) {
  const suffix = `?v=${encodeURIComponent(version)}`;
  const core = RUNTIME_MODULES.map(filename => `./${filename}${suffix}`);
  const marker = "const CORE = [";
  if (!source.includes(marker)) throw new Error('Service worker CORE manifest not found.');
  // Add versioned module URLs to the existing offline manifest. Keep unversioned
  // entries for older pages and direct navigation while they are still open.
  const declaration = `const VERSIONED_MODULES = ${JSON.stringify(core)};\n`;
  let result = source.replace(marker, declaration + marker);
  result = result.replace('await cache.addAll(CORE);', 'await cache.addAll([...CORE, ...VERSIONED_MODULES]);');
  if (!result.includes('...VERSIONED_MODULES')) throw new Error('Service worker module precache hook not found.');
  // Never satisfy a current release request from an older release's cache.
  result = result.replace('const cached = await caches.match(request);', 'const cached = await (await caches.open(CACHE_NAME)).match(request);');
  result = result.replace('return (await caches.match(request)) || (fallbackPath ? await caches.match(fallbackPath) : undefined)',
    'return (await (await caches.open(CACHE_NAME)).match(request)) || (fallbackPath ? await (await caches.open(CACHE_NAME)).match(fallbackPath) : undefined)');
  return result;
}

export async function versionRuntime(out, version) {
  if (!/^[a-zA-Z0-9_-]+$/.test(version)) throw new Error('Invalid runtime build version.');
  const modules = new Map();
  for (const filename of RUNTIME_MODULES) {
    const source = await fs.readFile(path.join(out, filename), 'utf8');
    const transformed = versionModuleSource(source, version);
    modules.set(filename, transformed);
    // Assert every local runtime dependency is versioned, including dependencies
    // shared by the Gear and Knowledge Base entry points.
    for (const match of transformed.matchAll(/(?:\bfrom\s*|\bimport\s*\(|\bimport\s*)['"](\.\/([a-z][a-z0-9-]*\.js)(?:\?v=([^'"]+))?)['"]/g)) {
      if (MODULE_SET.has(match[2]) && match[3] !== version) throw new Error(`Unversioned runtime dependency in ${filename}: ${match[1]}`);
    }
    await fs.writeFile(path.join(out, filename), transformed);
  }
  const index = await fs.readFile(path.join(out, 'index.html'), 'utf8');
  await fs.writeFile(path.join(out, 'index.html'), versionRuntimeIndex(index, version));
  const sw = await fs.readFile(path.join(out, 'sw.js'), 'utf8');
  await fs.writeFile(path.join(out, 'sw.js'), versionServiceWorker(sw, version));
  for (const entry of ['gear-app.js', 'kb-app.js', 'media-ui.js']) {
    const indexSource = await fs.readFile(path.join(out, 'index.html'), 'utf8');
    if (!indexSource.includes(`./${entry}?v=${version}`)) throw new Error(`Entry point ${entry} is not versioned.`);
  }
  console.log(`Runtime module graph versioned and validated: ${version}.`);
}

// Also supports explicit rechecking of an already-built bundle.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] ? path.resolve(process.argv[2]) : path.join(here, 'dist');
  const build = JSON.parse(await fs.readFile(path.join(out, 'build.json'), 'utf8'));
  await versionRuntime(out, build.buildVersion);
}
