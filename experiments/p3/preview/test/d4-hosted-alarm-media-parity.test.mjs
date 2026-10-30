import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD4TicketVerifier} from '../src/d4-git-blob-stage.mjs';
import {createD3HostedMediaVerifier} from '../src/d3-hosted-media-verifier.mjs';

const origin='https://fishing-auth-p0-test.ginosega.workers.dev';
const secret='z'.repeat(48);
const path='Gear/Rods-Reels/assets/Vision TEST.jpg';
const sha256='b'.repeat(64),blobSha='c'.repeat(40),bytes=2048;
const pkg={
 format:'fishing-companion-change-v2',domain:'gear',operation:'add',
 id:'p3-test-rod-image',
 base:{schemaVersion:2,sourceRevision:'a'.repeat(40),recordHash:null},
 record:{id:'p3-test-rod-image',category:'rods-reels',type:'Spinning rod',
  name:'Synthetic Test Rod'},
 picture:{action:'add',path,file:{bytes,sha256}},
 pictureSequence:{action:'keep'},notes:{action:'keep'},
};
const textPkg={
 ...pkg, picture:{action:'keep'},record:{...pkg.record},
};
function ticket(expiresAt=Math.floor(Date.now()/1000)+3600){
 return {path,bytes,sha256,blobSha,mime:'image/jpeg',expiresAt};
}
test('D4-HM01 signed original accepted by shared hosted verifier for DO and Cron',async()=>{
 const signer=createD4TicketVerifier({origin,secret});
 const token=ticket();
 const signed={...token,signature:await signer.sign(token)};
 const verify=createD3HostedMediaVerifier({origin,secret,enabled:()=>true});
 assert.deepEqual((await verify(pkg,[signed])).map(x=>({
  path:x.path,blobSha:x.blobSha,bytes:x.bytes,sha256:x.sha256,
 })),[{path,blobSha,bytes,sha256}]);
 assert.deepEqual(await verify(textPkg,[]),[]);
});
test('D4-HM02 disabled media fails closed; zero-media text still allowed',async()=>{
 const verify=createD3HostedMediaVerifier({origin,secret,enabled:()=>false});
 await assert.rejects(verify(pkg,[]),/D4_MEDIA_DISABLED/);
 assert.deepEqual(await verify(textPkg,[]),[]);
});
test('D4-HM03 mismatched, unsigned and expired media never produce hosted proof',async()=>{
 const verify=createD3HostedMediaVerifier({origin,secret,enabled:()=>true});
 const signer=createD4TicketVerifier({origin,secret});
 const valid=ticket();
 const signed={...valid,signature:await signer.sign(valid)};
 await assert.rejects(verify(pkg,[{...signed,bytes:bytes+1}]));
 await assert.rejects(verify(pkg,[{...signed,path:path+'.jpg'}]));
 await assert.rejects(verify(pkg,[]));
 const expired=ticket(Math.floor(Date.now()/1000)-1);
 const proof={...expired,signature:await signer.sign(expired)};
 await assert.rejects(verify(pkg,[proof]));
 assert.equal((await verify(pkg,[proof],{allowExpired:true})).length,1);
});
test('D4-HM04 both actual Worker entrypoints explicitly inject shared verifier',()=>{
 const cron=readFileSync(new URL('../src/d3-live-owner-worker.mjs',import.meta.url),'utf8');
 const doAlarm=readFileSync(new URL('../src/d3-fast-wake-do.mjs',import.meta.url),'utf8');
 for(const source of [cron,doAlarm]){
  assert.match(source,/createD3HostedMediaVerifier\(\{/);
  assert.match(source,/enabled:\(\)=>env\.D4_MEDIA_ENABLED==='true'/);
  assert.match(source,/createD3PrivateHostProof\(\{/);
  assert.match(source,/requestHosted,verifyMedia/);
 }
});
