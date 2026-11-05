import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 D5_AUTH_RETURN_KEY,D5_OWNER_SCOPE,isD5ReadOnlyReturnHash,
 rememberD5OwnerAuthReturn,restoreD5OwnerAuthReturn,
} from '../src/d5-auth-return.mjs';
const store=()=>{
 const data=new Map();
 return {data,setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)??null,
  removeItem:k=>data.delete(k)};
};
function harness(hash='',current=''){
 const storage=store(),calls=[];
 const history={state:{test:true},replaceState:(s,t,h)=>calls.push([s,t,h])};
 return {storage,history,calls,pathname:D5_OWNER_SCOPE,hash,current};
}
test('D5-AUTH01 signed-out KB Rainbow Trout returns to exact article after OAuth',()=>{
 const x=harness('#/kb/species-rainbow-trout');
 assert.equal(rememberD5OwnerAuthReturn({...x,now:10000}),true);
 assert(x.storage.getItem(D5_AUTH_RETURN_KEY));
 assert.equal(restoreD5OwnerAuthReturn({
  ...x,hash:'',now:20000
 }), '#/kb/species-rainbow-trout');
 assert.deepEqual(x.calls,[[{test:true},'', '#/kb/species-rainbow-trout']]);
 assert.equal(x.storage.getItem(D5_AUTH_RETURN_KEY),null);
 assert.equal(restoreD5OwnerAuthReturn({...x,hash:'',now:20001}),null);
});
test('D5-AUTH02 stored return rejects editors, external and malformed routes',()=>{
 for(const hash of ['#/inventory/add/lures','#/inventory/edit/p3-test',
  '#/kb/edit/species-rainbow-trout','#/catches/add','#/catches/edit/id',
  '#//example.com','javascript:alert(1)','#/kb/%2fother',
  '#/kb/../../auth/callback','#/unknown-route','#/kb/ABC',
  '#/kb/species-rainbow-trout?return=https://evil.test']){
  assert.equal(isD5ReadOnlyReturnHash(hash),false,hash);
  assert.equal(rememberD5OwnerAuthReturn({...harness(hash),now:10000}),false,hash);
 }
});
test('D5-AUTH03 only the exact owner scope can store or restore bookmarks',()=>{
 const a=harness('#/kb/species-rainbow-trout');
 assert.equal(rememberD5OwnerAuthReturn({...a,pathname:'/fishing/',now:500}),false);
 assert.equal(rememberD5OwnerAuthReturn({...a,now:500}),true);
 assert.equal(restoreD5OwnerAuthReturn({...a,pathname:'/fishing/',hash:'',now:550}),null);
 assert(a.storage.getItem(D5_AUTH_RETURN_KEY),'wrong scope must not consume marker');
 assert.equal(restoreD5OwnerAuthReturn({...a,hash:'',now:550}),a.hash);
});
test('D5-AUTH04 stale state, existing navigation and storage errors fail closed',()=>{
 const a=harness('#/kb/species-rainbow-trout');
 assert.equal(rememberD5OwnerAuthReturn({...a,now:100}),true);
 assert.equal(restoreD5OwnerAuthReturn({...a,hash:'',now:10*60*1000+101}),null);
 assert.equal(a.storage.getItem(D5_AUTH_RETURN_KEY),null);
 assert.equal(rememberD5OwnerAuthReturn({...a,now:100}),true);
 assert.equal(restoreD5OwnerAuthReturn({...a,hash:'#/catches',now:150}),null);
 assert.equal(rememberD5OwnerAuthReturn({
  ...a,storage:{setItem(){throw Error('blocked')}}
 }),false);
 assert.equal(restoreD5OwnerAuthReturn({
  ...a,storage:{getItem(){throw Error('blocked')}}
 }),null);
});
test('D5-AUTH05 browser sign-in and authorized startup use the bounded helper',()=>{
 const connection=readFileSync(new URL('../src/v3-connection-experience.mjs',import.meta.url),'utf8');
 const candidate=readFileSync(new URL('../src/d5-owner-candidate.mjs',import.meta.url),'utf8');
 assert.match(connection,/rememberD5OwnerAuthReturn/);
 assert.match(candidate,/restoreD5OwnerAuthReturn/);
 assert(candidate.indexOf('restoreD5OwnerAuthReturn(')>candidate.indexOf('session?.authorized!==true'));
 assert(candidate.indexOf('restoreD5OwnerAuthReturn(')<candidate.indexOf('return shell.start(settings)'));
});
