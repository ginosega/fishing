import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {stageReaderPages,auditReaderPages,READER_BASE} from '../tools/prepare-v3-reader-pages.mjs';
const digest=b=>createHash('sha256').update(b).digest('hex');
const REV='b'.repeat(40),ID='a'.repeat(32);
const base='fishing/__v3_reader_candidate__';
const required=['index.html','loader.js','sw.js','manifest.webmanifest','icon.png','icon-maskable.png',
 `releases/${ID}/app.js`,`releases/${ID}/styles.css`,
 `releases/${ID}/content/Gear/gear.json`,`releases/${ID}/content/KB/kb.json`,
 `releases/${ID}/content/Catches/catches.json`];
async function fixture(){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'d5-reader-stage-test-'));
 const candidate=path.join(root,'candidate'),out=path.join(root,'staged');
 await fs.mkdir(candidate);
 const payload=new Map(required.map(p=>[p,Buffer.from(p==='index.html'?
  '<html>Isolated V3 reader candidate · no owner publishing</html>':
  p==='manifest.webmanifest'?JSON.stringify({start_url:'./',scope:'./',display:'standalone'}):p)]));
 for(const [relative,bytes] of payload){
  const file=path.join(candidate,relative);
  await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,bytes);
 }
 const files=[...payload].map(([p,bytes])=>({path:p,bytes:bytes.length,sha256:digest(bytes)}));
 const manifest={format:'fishing-companion-release-v2',releaseId:ID,sourceRevision:REV,
  pendingMedia:false,v3ReaderCandidate:true,base:READER_BASE,files,
  totalBytes:files.reduce((s,x)=>s+x.bytes,0)};
 const manifestFile=`releases/${ID}/manifest.json`,data=Buffer.from(JSON.stringify(manifest));
 await fs.writeFile(path.join(candidate,manifestFile),data);
 await fs.writeFile(path.join(candidate,'release.json'),JSON.stringify({id:ID,sourceRevision:REV,
  manifest:manifestFile,manifestSha256:digest(data),pendingMedia:false}));
 return {root,candidate,out,manifestFile};
}
async function withFixture(fn){const x=await fixture();try{await fn(x);}finally{await fs.rm(x.root,{recursive:true,force:true});}}

test('D5-PAGES-01 packages exact nested reader and safe root-only static files',()=>withFixture(async x=>{
 const result=await stageReaderPages({candidateDir:x.candidate,destinationDir:x.out,expectedRevision:REV});
 assert.equal(result.releaseId,ID);assert.equal(result.sourceRevision,REV);
 assert.equal(result.base,READER_BASE);assert.equal(result.assets,required.length);
 assert.equal(result.uploadFiles,required.length+2+3);
 const audit=await auditReaderPages({siteDir:x.out,expectedRevision:REV});
 assert.equal(audit.uploadFiles,result.uploadFiles);
 assert.equal(audit.sourceRevision,REV);
 assert.match(await fs.readFile(path.join(x.out,'_headers'),'utf8'),/X-Robots-Tag: noindex/);
 assert.match(await fs.readFile(path.join(x.out,'404.html'),'utf8'),/Not Found/);
 assert.match(await fs.readFile(path.join(x.out,'robots.txt'),'utf8'),/Disallow: \/$/m);
 assert.equal(await fs.readFile(path.join(x.out,base,'index.html'),'utf8'),
  '<html>Isolated V3 reader candidate · no owner publishing</html>');
 await assert.rejects(fs.stat(path.join(x.out,'index.html')), /ENOENT/);
 await assert.rejects(fs.stat(path.join(x.out,'_worker.js')), /ENOENT/);
}));

test('D5-PAGES-02 refuses stale revision without creating a staging site',()=>withFixture(async x=>{
 await assert.rejects(stageReaderPages({candidateDir:x.candidate,destinationDir:x.out,
  expectedRevision:'c'.repeat(40)}),/source revision/);
 await assert.rejects(fs.stat(x.out),/ENOENT/);
}));

test('D5-PAGES-03 refuses extra unverified bytes and corrupted originals',()=>withFixture(async x=>{
 await fs.writeFile(path.join(x.candidate,'extra.js'),'unverified');
 await assert.rejects(stageReaderPages({candidateDir:x.candidate,destinationDir:x.out,
  expectedRevision:REV}),/unexpected or missing/);
 await fs.rm(path.join(x.candidate,'extra.js'));
 await fs.writeFile(path.join(x.candidate,'sw.js'),'corrupt');
 await assert.rejects(stageReaderPages({candidateDir:x.candidate,destinationDir:x.out,
  expectedRevision:REV}),/SHA-256 mismatch/);
}));

test('D5-PAGES-04 refuses server routes, wrong scope and duplicate overwrite',()=>withFixture(async x=>{
 const server=path.join(x.candidate,'_worker.js');
 await fs.writeFile(server,'server code');
 await assert.rejects(stageReaderPages({candidateDir:x.candidate,destinationDir:x.out,
  expectedRevision:REV}),/Forbidden candidate asset path/);
 await fs.rm(server);
 const good=await stageReaderPages({candidateDir:x.candidate,destinationDir:x.out,expectedRevision:REV});
 assert.equal(good.releaseId,ID);
 await assert.rejects(stageReaderPages({candidateDir:x.candidate,destinationDir:x.out,
  expectedRevision:REV}),/overwrite existing destination/);
 await assert.rejects(stageReaderPages({candidateDir:x.candidate,destinationDir:path.join(x.candidate,'subdir'),
  expectedRevision:REV}),/separate/);
}));

test('D5-PAGES-05 rejects symlinks and prototype markers',()=>withFixture(async x=>{
 const link=path.join(x.candidate,'unsafe-link');
 await fs.symlink(path.join(x.candidate,'sw.js'),link);
 await assert.rejects(stageReaderPages({candidateDir:x.candidate,destinationDir:x.out,
  expectedRevision:REV}),/Unsafe candidate filesystem entry/);
 await fs.rm(link);
 const releaseFile=path.join(x.candidate,'release.json');
 const p=JSON.parse(await fs.readFile(releaseFile,'utf8'));p.pendingMedia=true;
 await fs.writeFile(releaseFile,JSON.stringify(p));
 await assert.rejects(stageReaderPages({candidateDir:x.candidate,destinationDir:x.out,
  expectedRevision:REV}),/Incorrect candidate pointer/);
}));

test('D5-PAGES-06 read-only audit refuses modified site or missing scope files',()=>withFixture(async x=>{
 await stageReaderPages({candidateDir:x.candidate,destinationDir:x.out,expectedRevision:REV});
 await fs.writeFile(path.join(x.out,'_headers'),'unsafe');
 await assert.rejects(auditReaderPages({siteDir:x.out,expectedRevision:REV}),/Pages root guard changed/);
 await fs.writeFile(path.join(x.out,'_headers'),
  '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n');
 await fs.rm(path.join(x.out,base,'sw.js'));
 await assert.rejects(auditReaderPages({siteDir:x.out,expectedRevision:REV}),/unexpected or missing/);
}));
