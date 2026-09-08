import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const target = new URL('./2026-09-08-batch.mjs', import.meta.url);
let source = await fs.readFile(target, 'utf8');
const imports = [
  ["import { readValidatedImage } from '../image-validation.mjs';", "import { readValidatedImage as readImageFile } from '../image-validation.mjs';\nimport {fileURLToPath} from 'node:url';\nconst readValidatedImage = filename => readImageFile(filename instanceof URL ? fileURLToPath(filename) : filename);"],
  ["import {readValidatedImage} from './image-validation.mjs';", "import {readValidatedImage as readImageFile} from './image-validation.mjs';\nimport {fileURLToPath} from 'node:url';\nconst readValidatedImage=filename=>readImageFile(filename instanceof URL?fileURLToPath(filename):filename);"]
];
for (const [before, after] of imports) {
  if (!source.includes(before)) throw new Error('Expected source import not found.');
  source = source.replace(before, after);
}
const marker = "for (const p of pictures) {\n  const bundle = await read('pwa/data/kb.seed.json');";
if (!source.includes(marker)) throw new Error('Expected KB promotion loop not found.');
source = source.replace(marker, "const {execFileSync} = await import('node:child_process');\nfor (const command of ['build.mjs','apply-authored-notes.mjs','apply-local-media.mjs']) execFileSync(process.execPath, ['pwa/' + command], {cwd:new URL('../../',import.meta.url).pathname,stdio:'inherit'});\nconst availableMedia = await read('pwa/dist/gear-media.json');\n" + marker);
source = source.replaceAll('availableMedia:[]', 'availableMedia');
await fs.writeFile(target, source);
await import(target.href);
await fs.rm(fileURLToPath(import.meta.url));
