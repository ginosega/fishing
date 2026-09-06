import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { RUNTIME_MODULES, versionModuleSource, versionRuntimeIndex, versionServiceWorker, versionRuntime } from './version-runtime.mjs';

const version = 'test-release-123';
const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'fishing-runtime-'));
try {
  // Reproduce the PR #42 failure: a new entry importing a new named export
  // cannot load against the pre-#42 model held by the old service worker.
  await fs.writeFile(path.join(fixture, 'gear-model.mjs'), 'export const GEAR_SCHEMA_VERSION = 3;\n');
  await fs.writeFile(path.join(fixture, 'gear-app.mjs'), "import { GEAR_ACCESSORY_TYPES } from './gear-model.mjs';\nexport const types = GEAR_ACCESSORY_TYPES;\n");
  await assert.rejects(import(pathToFileURL(path.join(fixture, 'gear-app.mjs')).href), /does not provide an export named 'GEAR_ACCESSORY_TYPES'/);

  const source = "import { GEAR_ACCESSORY_TYPES } from './gear-model.js';\nimport './gear-store.js';\nexport { x } from './kb-model.js';\n";
  const transformed = versionModuleSource(source, version);
  assert.match(transformed, /gear-model\.js\?v=test-release-123/);
  assert.match(transformed, /gear-store\.js\?v=test-release-123/);
  assert.match(transformed, /kb-model\.js\?v=test-release-123/);
  assert.equal(versionModuleSource(transformed, version), transformed, 'Versioning must be idempotent.');
  assert.match(versionRuntimeIndex('<script src="./gear-app.js?v=old"></script>', version), /gear-app\.js\?v=test-release-123/);

  const swSource = "const CACHE_NAME = 'fishing-companion-test';\nconst CORE = ['./gear-app.js'];\nasync function install(cache) { await cache.addAll(CORE); }\nasync function cacheFirst(request) { const cached = await caches.match(request); return cached; }\nasync function networkFirst(request, fallbackPath) { return (await caches.match(request)) || (fallbackPath ? await caches.match(fallbackPath) : undefined); }\n";
  const sw = versionServiceWorker(swSource, version);
  assert.match(sw, /\.\/gear-model\.js\?v=test-release-123/);
  assert.match(sw, /\.\.\.VERSIONED_MODULES/);
  assert.doesNotMatch(sw, /const cached = await caches\.match\(request\)/);

  // Verify the complete production module graph, not just source-text patterns.
  const root = path.resolve(new URL('.', import.meta.url).pathname);
  for (const filename of RUNTIME_MODULES) await fs.copyFile(path.join(root, filename), path.join(fixture, filename));
  await fs.writeFile(path.join(fixture, 'index.html'), '<script type="module" src="./gear-app.js"></script><script type="module" src="./kb-app.js"></script><script type="module" src="./media-ui.js"></script>');
  await fs.writeFile(path.join(fixture, 'sw.js'), await fs.readFile(path.join(root, 'sw.js'), 'utf8'));
  await versionRuntime(fixture, version);
  for (const filename of RUNTIME_MODULES) {
    const output = await fs.readFile(path.join(fixture, filename), 'utf8');
    for (const match of output.matchAll(/(?:from\s*|import\s*\(|import\s*)['"]\.\/([a-z][a-z0-9-]*\.js)(?:\?v=([^'"]+))?['"]/g)) {
      if (RUNTIME_MODULES.includes(match[1])) assert.equal(match[2], version, `${filename} contains an unversioned dependency.`);
    }
  }
  console.log('Runtime module-cache regression tests passed.');
} finally {
  await fs.rm(fixture, { recursive:true, force:true });
}
