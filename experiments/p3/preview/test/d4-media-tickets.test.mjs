import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareChange} from '../../../../pwa/src/handoff.mjs';
import {sha256} from '../../../../pwa/src/shared.mjs';
import {expectedD4Media,validateD4MediaTickets,D4TicketError}
 from '../src/d4-media-tickets.mjs';
const SHA='a'.repeat(40),BYTES=new Uint8Array([255,216,255,1,2,3]);
const path='Gear/Lures/assets/Picture.jpg',hash=await sha256(BYTES);
const record={id:'synth',name:'Test',type:'Spoons',category:'lures',
 picture:{src:path}};
const pkg=await prepareChange({domain:'gear',operation:'add',
 id:record.id,record,sourceRevision:SHA,pictureAction:'add',
 picturePath:path,pictureFile:{bytes:BYTES.length,sha256:hash}});
const proof={path,bytes:BYTES.length,sha256:hash,
 blobSha:'b'.repeat(40),mime:'image/jpeg'};
const fail=c=>e=>e instanceof D4TicketError&&e.code===c;
const verify=async p=>p;
test('D4-T01 one signed metadata proof matches exact original picture',async()=>{
 assert.equal(expectedD4Media(pkg).length,1);
 assert.deepEqual(await validateD4MediaTickets({
  package:pkg,media:[proof],verifyTicket:verify,
 }),[proof]);
});
test('D4-T02 missing staged bytes, extra staged bytes and changed hash fail',async()=>{
 await assert.rejects(validateD4MediaTickets({
  package:pkg,media:[],verifyTicket:verify,
 }),fail('MEDIA_COUNT_MISMATCH'));
 await assert.rejects(validateD4MediaTickets({
  package:pkg,media:[{...proof,sha256:'c'.repeat(64)}],
  verifyTicket:verify,
 }),fail('MEDIA_METADATA_MISMATCH'));
 await assert.rejects(validateD4MediaTickets({
  package:pkg,media:[{...proof,path:'Gear/Lures/assets/Other.jpg'}],
  verifyTicket:verify,
 }),fail('MEDIA_METADATA_MISMATCH'));
});
test('D4-T03 no pictures allowed on Catch and keep requires no staging',async()=>{
 const unchanged=await prepareChange({domain:'catches',operation:'add',
  id:'catch-synthetic',record:{id:'catch-synthetic',date:'2026-10-29'},
  sourceRevision:SHA});
 assert.deepEqual(await validateD4MediaTickets({
  package:unchanged,media:[],verifyTicket:verify,
 }),[]);
 await assert.rejects(validateD4MediaTickets({
  package:unchanged,media:[proof],verifyTicket:verify,
 }),fail('MEDIA_COUNT_MISMATCH'));
});
test('D4-T04 an untrusted browser cannot substitute unverified receipt',async()=>{
 const reject=async()=>{throw Error('INVALID_SIGNATURE');};
 await assert.rejects(validateD4MediaTickets({
  package:pkg,media:[proof],verifyTicket:reject,
 }),/INVALID_SIGNATURE/);
});
