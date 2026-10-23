#!/usr/bin/env node
// Generate a single-file Worker for manual Cloudflare dashboard paste.
// The generated file never includes a private key or other secrets.
import fs from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const header="// GENERATED SINGLE-FILE CLOUDFLARE DASHBOARD BUNDLE; NO GITHUB WRITE OPERATIONS.\n// Source: src/github-app-readonly.mjs + src/worker.mjs.\n// After the diagnostic, delete P3_DIAGNOSTIC_KEY to disable the proof route.\n\n";
const helper=(await fs.readFile(new URL('src/github-app-readonly.mjs',root),'utf8')).replace(/^export async function /gm,'async function ');
const worker=(await fs.readFile(new URL('src/worker.mjs',root),'utf8'))
 .replace(/^import \{verifyReadOnlySandboxInstallation\} from '\.\/github-app-readonly\.mjs';\s*\n/,'')
 .replace(/^export function createWorker/gm,'function createWorker');
if(helper.includes('export ')||worker.startsWith('import ')||!worker.endsWith('export default createWorker();\n'))throw Error('Unexpected source imports/exports');
const output=header+helper+'\n'+worker;
const target=new URL('worker-dashboard-paste.mjs',root);
if(process.argv.includes('--write')){await fs.writeFile(target,output);process.stdout.write('Dashboard bundle generated.\n');}
else {
 const committed=await fs.readFile(target,'utf8');
 if(committed!==output)throw Error('Dashboard bundle diverges from original Worker + GitHub App helper; regenerate before publishing.');
 process.stdout.write('Dashboard bundle matches source exactly.\n');
}
