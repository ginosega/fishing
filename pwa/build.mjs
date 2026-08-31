import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const out = path.join(here, 'dist');
const kbOut = path.join(out, 'kb');

const shellFiles = ['index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'icon.svg'];
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

for (const file of shellFiles) {
  await fs.copyFile(path.join(here, file), path.join(out, file));
}

for (const [src, dest] of kbFiles) {
  await fs.copyFile(path.join(repoRoot, src), path.join(kbOut, dest));
}

const buildVersion = (process.env.GITHUB_SHA || new Date().toISOString()).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
const sw = await fs.readFile(path.join(here, 'sw.js'), 'utf8');
await fs.writeFile(path.join(out, 'sw.js'), sw.replaceAll('__BUILD_VERSION__', buildVersion));
await fs.writeFile(path.join(out, 'build.json'), JSON.stringify({
  buildVersion,
  builtAt: new Date().toISOString(),
  source: 'GitHub Markdown knowledge base'
}, null, 2));

console.log(`Fishing Companion built at ${out}`);
