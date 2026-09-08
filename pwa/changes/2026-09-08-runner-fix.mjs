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
await fs.writeFile(target, source);
await import(target.href);
await fs.rm(fileURLToPath(import.meta.url));
