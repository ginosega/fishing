import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createD3ConnectionController,D3ConnectionError,mountD3ConnectionPanel,
} from '../src/v3-connection.mjs';

const OP='p3_01234567-1234-4234-8234-123456789abc';
const fails=code=>e=>e instanceof D3ConnectionError&&e.code===code;
function build({enabled=true,online=true,authenticated=true,authorized=true,
 throwSession=false,throwSignout=false,operationId=OP,publicLive=false}={}){
 const updates=[];
 let activeOnline=online,active=enabled,signouts=0,lookups=0;
 const service={
  auth:{
   session:async()=>{
    if(throwSession)throw Error('network');
    return {authenticated,authorized,csrfToken:'NOT_FOR_UI'};
   },
   signOut:async()=>{signouts++;if(throwSignout)throw Error('unknown');return true;},
  },
  lifecycle:{
   tracking:()=>({operationId}),
   refresh:async()=>{lookups++;return {operationId,
    phase:'Live',sandboxVerified:true,publicLive};},
  },
 };
 const controller=createD3ConnectionController({
  ...service,enabled:()=>active,online:()=>activeOnline,
  onChange:s=>updates.push(s),
 });
 return {controller,updates,service,
  get signouts(){return signouts;},
  get lookups(){return lookups;},
  setOnline:v=>{activeOnline=v;},setEnabled:v=>{active=v;}};
}

test('D3-C01 disabled controller refuses before ever consulting owner session',async()=>{
 const x=build({enabled:false});
 await assert.rejects(x.controller.restore(),fails('NOT_ENABLED'));
 assert.equal(x.updates.length,0);
});

test('D3-C02 silent valid session restores single owner without exposing CSRF',async()=>{
 const x=build();
 assert.equal(x.controller.current().authorized,false);
 await x.controller.restore();
 assert.equal(x.controller.current().authorized,true);
 assert.equal(x.controller.current().phase,'Owner');
 assert(!JSON.stringify(x.controller.current()).includes('NOT_FOR_UI'));
 await x.controller.refreshPublication();
 const state=x.controller.current();
 assert.equal(state.publication,'Live');
 assert.equal(state.sandboxVerified,true);
 assert.equal(state.publicLive,false);
 assert.equal(x.lookups,1);
});

test('D3-C03 anonymous owner denial, invalid session and lost network fail closed',async()=>{
 for(const opt of [
  {authenticated:false,authorized:false,phase:'Anonymous'},
  {authenticated:false,authorized:true,phase:'Unavailable'},
  {throwSession:true,phase:'Unavailable'},
  {online:false,phase:'Offline'},
 ]){
  const x=build(opt);
  await x.controller.restore();
  assert.equal(x.controller.current().authorized,false);
  assert.equal(x.controller.current().phase,opt.phase);
  await assert.rejects(x.controller.refreshPublication(),
   e=>e instanceof D3ConnectionError);
 }
});

test('D3-C04 Sign out revokes visible owner immediately, even on uncertainty',async()=>{
 const ok=build();await ok.controller.restore();
 await ok.controller.signOut();
 assert.equal(ok.signouts,1);
 assert.equal(ok.controller.current().authorized,false);
 assert.equal(ok.controller.current().phase,'Anonymous');
 const ambiguous=build({throwSignout:true});await ambiguous.controller.restore();
 await assert.rejects(ambiguous.controller.signOut(),fails('SIGNOUT_UNCONFIRMED'));
 assert.equal(ambiguous.controller.current().authorized,false);
});

test('D3-C05 offline signout refused and backend cannot assert public Live',async()=>{
 const offline=build();await offline.controller.restore();
 offline.setOnline(false);
 await assert.rejects(offline.controller.signOut(),fails('OFFLINE'));
 const forged=build({publicLive:true});
 await forged.controller.restore();
 await forged.controller.refreshPublication();
 assert.equal(forged.controller.current().publication,'Unknown');
 assert.equal(forged.controller.current().publicLive,false);
});

class Element {
 constructor(tag){
  this.tagName=tag;this.children=[];this.handlers={};
  this.textContent='';this.className='';this.href='';
 }
 append(...children){this.children.push(...children);}
 appendChild(child){this.children.push(child);return child;}
 replaceChildren(...children){this.children=children;}
 addEventListener(name,fn){this.handlers[name]=fn;}
 setAttribute(name,v){this[name]=v;}
 remove(){this.removed=true;}
}
const documentObject={createElement:tag=>new Element(tag)};
test('D3-C06 GitHub sign-in link occurs only inside Connection Status dialog',async()=>{
 const x=build({authenticated:false,authorized:false});
 const dialog=new Element('dialog');
 const panel=mountD3ConnectionPanel({
  dialog,controller:x.controller,documentObject,
 });
 assert.equal(dialog.children.length,1);
 const section=dialog.children[0];
 assert.equal(section.tagName,'section');
 const tools=section.children[2];
 assert.equal(tools.children.length,1);
 const link=tools.children[0];
 assert.equal(link.tagName,'a');
 assert.equal(link.href,'/auth/start');
 assert.equal(link.textContent,'Sign in with GitHub');
 await x.controller.restore();panel.paint();
 assert.equal(tools.children[0].href,'/auth/start');
 panel.remove();assert.equal(section.removed,true);
});

test('D3-C07 authenticated panel exposes Sign out and status but no public Live claim',async()=>{
 const x=build(),dialog=new Element('dialog');
 const panel=mountD3ConnectionPanel({dialog,controller:x.controller,documentObject});
 await x.controller.restore();
 await x.controller.refreshPublication();
 panel.paint();
 const section=dialog.children[0];
 const desc=section.children[1],toolbar=section.children[2];
 assert(desc.textContent.includes('Signed in as owner'));
 assert(desc.children[0].textContent.includes('sandbox verified'));
 assert(toolbar.children.some(x=>x.textContent==='Sign out'));
 assert(!toolbar.children.some(x=>x.tagName==='a'));
});
