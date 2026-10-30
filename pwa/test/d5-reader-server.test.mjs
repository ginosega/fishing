import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {startCandidateServer} from '../tools/serve-v3-reader-candidate.mjs';
import {V3_READER_CANDIDATE_BASE as BASE} from '../src/v3-reader-candidate.mjs';

test('D5-RS01 loopback candidate serves only its own scope and original bytes',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'d5-reader-server-'));
 let server;
 try{
  const id='a'.repeat(32),revision='b'.repeat(40);
  await fs.writeFile(path.join(tmp,'index.html'),'Private V3 reader');
  await fs.mkdir(path.join(tmp,'pictures'));
  await fs.writeFile(path.join(tmp,'pictures','test image.jpg'),Buffer.from([0,1,2,255]));
  await fs.writeFile(path.join(tmp,'release.json'),JSON.stringify({
   id,sourceRevision:revision,manifest:'manifest.json',
  }));
  await fs.writeFile(path.join(tmp,'manifest.json'),JSON.stringify({
   base:BASE,v3ReaderCandidate:true,releaseId:id,sourceRevision:revision,
  }));
  server=await startCandidateServer({root:tmp,port:0});
  const port=server.address().port,root='http://127.0.0.1:'+port;
  const index=await fetch(root+BASE);
  assert.equal(index.status,200);
  assert.equal(await index.text(),'Private V3 reader');
  assert.equal(index.headers.get('Cache-Control'),'no-store');
  const original=await fetch(root+BASE+'pictures/test%20image.jpg');
  assert.equal(original.status,200);
  assert.deepEqual(new Uint8Array(await original.arrayBuffer()),
   Uint8Array.from([0,1,2,255]));
  const head=await fetch(root+BASE+'pictures/test%20image.jpg',{method:'HEAD'});
  assert.equal(head.status,200);
  assert.equal((await head.arrayBuffer()).byteLength,0);
  for(const url of [
   '/fishing/', '/__d3_pilot__/',BASE+'../index.html',
   BASE+'pictures%2Ftest%20image.jpg',
   BASE+'pictures/%5cwin',BASE+'missing.jpg',
  ]){
   const response=await fetch(root+url);
   assert.equal(response.status,404,url+' must be unavailable');
  }
  const denied=await fetch(root+BASE,{method:'POST'});
  assert.equal(denied.status,405);
 }finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  await fs.rm(tmp,{recursive:true,force:true});
 }
});

test('D5-RS02 preview refuses ordinary V2 or incorrectly scoped release',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'d5-reader-deny-'));
 try{
  await fs.writeFile(path.join(tmp,'release.json'),JSON.stringify({
   id:'a'.repeat(32),sourceRevision:'b'.repeat(40),manifest:'manifest.json',
  }));
  await fs.writeFile(path.join(tmp,'manifest.json'),JSON.stringify({
   base:'/fishing/',releaseId:'a'.repeat(32),sourceRevision:'b'.repeat(40),
  }));
  await assert.rejects(startCandidateServer({root:tmp,port:0}),
   /Refusing to serve/);
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
});
