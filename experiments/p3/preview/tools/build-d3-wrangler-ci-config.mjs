#!/usr/bin/env node
/**
 * FISH118 D3 CI-only Wrangler deployment DRY-RUN configuration.
 * Never read live bindings/secrets. Dummy, obviously non-production D1 IDs.
 * This source emits a local gitignored config to exercise Wrangler's
 * Text module import and Worker packaging. No deploy credentials/actions.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const template=path.join(root,'wrangler.d3-production-origin.example.jsonc');
const result=path.join(root,'wrangler.d3-ci-generated.jsonc');
const meta=path.join(root,'src/generated/d3-pilot.bundle.sha256.json');
const src=await fs.readFile(template,'utf8');
const manifest=JSON.parse(await fs.readFile(meta,'utf8'));
if(!/^[a-f0-9]{64}$/.test(manifest.sha256))
 throw Error('Unsigned/invalid pilot build manifest');
const rewrites=[
 ['REPLACE_WITH_VERIFIED_EXISTING_AUTH_D1_UUID',
  '00000000-0000-4000-8000-000000000001'],
 ['REPLACE_WITH_VERIFIED_EXISTING_OPERATIONS_D1_UUID',
  '00000000-0000-4000-8000-000000000002'],
 ['REPLACE_WITH_LOCAL_PILOT_SHA256',manifest.sha256],
];
let text=src;
for(const [needle,replacement]of rewrites){
 if(text.split(needle).length!==2)throw Error('Template seam mismatch: '+needle);
 text=text.replace(needle,replacement);
}
if(!text.includes('"main": "src/d3-owner-runtime.mjs"')||
 !text.includes('"D3_WRITE_ENABLED": "false"')||
 !text.includes('"D3_RUNNER_ENABLED": "false"')||
 !text.includes('"D3_PILOT_ENABLED": "false"')||
 !/"crons"\s*:\s*\[\s*\]/.test(text)||
 !text.includes('"type": "Text"')||
 text.includes('REPLACE_WITH_'))
 throw Error('Unsafe D3 Wrangler CI dry-run configuration');
await fs.writeFile(result,text);
process.stdout.write('D3_CI_WRANGLER_CONFIG_READY: dummy D1 UUIDs only; no deploy\n');
