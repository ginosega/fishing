import fs from 'node:fs/promises';

const file = new URL('./build.mjs', import.meta.url);
let source = await fs.readFile(file, 'utf8');
const importAnchor = "import { validateKbBundle, validateCatchBundle } from './kb-model.js';";
if (!source.includes(importAnchor)) throw new Error('Expected build import anchor missing.');
if (source.includes("import { versionRuntime } from './version-runtime.mjs';")) throw new Error('Runtime versioning is already integrated.');
source = source.replace(importAnchor, `${importAnchor}\nimport { versionRuntime } from './version-runtime.mjs';`);
const anchor = 'const missingMedia = mediaItems.filter(item => !successfulMedia.some(result => result.id === item.id));';
if (!source.includes(anchor)) throw new Error('Expected build completion anchor missing.');
source = source.replace(anchor, `await import('./runtime-versioning.test.mjs');\nawait versionRuntime(out, buildVersion);\n\n${anchor}`);
await fs.writeFile(file, source);
console.log('Integrated runtime module versioning into the normal PWA build.');
