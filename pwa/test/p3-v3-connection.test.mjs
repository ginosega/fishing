import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createD3ConnectionController,D3ConnectionError,mountD3ConnectionPanel,
} from '../src/v3-connection.mjs';

const OP='p3_01234567-1234-4234-8234-123456789abc';
const fails=code=>e=>e instanceof D3ConnectionError&&e.code===code;
function build({enabled=true,online=true,authenticated=true,authorized=true,
 throwSession=false,throwSignout=false,operationId=OP,publicLive=false,
 discoveredId=OP}={}){
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
   discover:async()=>{lookups++;return {
    operationId:discoveredId,phase:discoveredId?'Live':'Idle',
    sandboxVerified:Boolean(discoveredId),publicLive:false};},
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
 assert.equal(link.href,'/auth/start?return=%2Ffishing%2F');
 assert.equal(link.textContent,'Sign in with GitHub');
 await x.controller.restore();panel.paint();
 assert.equal(tools.children[0].href,'/auth/start?return=%2Ffishing%2F');
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

test('D3-C08 private owner pilot returns OAuth to pilot only on its exact path',()=>{
 const prior=Object.getOwnPropertyDescriptor(globalThis,'location');
 Object.defineProperty(globalThis,'location',{configurable:true,
  value:{pathname:'/__d3_pilot__/'}});
 try{
  const x=build({authenticated:false,authorized:false}),dialog=new Element('dialog');
  const panel=mountD3ConnectionPanel({
   dialog,controller:x.controller,documentObject,
  });
  const link=dialog.children[0].children[2].children[0];
  assert.equal(link.href,'/auth/start?return=%2F__d3_pilot__%2F');
  panel.remove();
 }finally{
  if(prior)Object.defineProperty(globalThis,'location',prior);
  else delete globalThis.location;
 }
});


test('D3-C09 Android has no local receipt, button obtains latest owner D1 status',async()=>{
 const x=build({operationId:null,discoveredId:OP});
 await x.controller.restore();
 assert.equal(x.controller.current().operationId,null);
 await x.controller.refreshPublication();
 const result=x.controller.current();
 assert.equal(result.operationId,OP);
 assert.equal(result.publication,'Live');
 assert.equal(result.sandboxVerified,true);
 assert.equal(result.publicLive,false);
 assert.equal(x.lookups,1);
 const dialog=new Element('dialog');
 const panel=mountD3ConnectionPanel({dialog,controller:x.controller,documentObject});
 const desc=dialog.children[0].children[1];
 assert(desc.children[0].textContent.includes('sandbox verified'));
 const toolbar=dialog.children[0].children[2];
 assert(toolbar.children.some(c=>c.textContent==='Check publication status'));
 panel.remove();
});
test('D3-C10 no owner operation returns None, never a fabricated Live',async()=>{
 const x=build({operationId:null,discoveredId:null});
 await x.controller.restore();
 await x.controller.refreshPublication();
 assert.equal(x.controller.current().publication,'None');
 assert.equal(x.controller.current().operationId,null);
 assert.equal(x.controller.current().sandboxVerified,false);
});


const NEXT_OP='p3_abcdef01-1234-4234-8234-123456789abc';
function pollingFixture(){
 const scheduled=new Map();
 let nextId=0,lookups=0,phase='Accepted',tracked=OP;
 let pending=null;
 const doc={
  ...documentObject,visibilityState:'visible',handlers:{},
  addEventListener(name,fn){this.handlers[name]=fn;},
  removeEventListener(name){delete this.handlers[name];},
 };
 const win={handlers:{},
  addEventListener(name,fn){this.handlers[name]=fn;},
  removeEventListener(name){delete this.handlers[name];},
 };
 const dialog=new Element('dialog');
 dialog.open=true;
 const auth={session:async()=>({authenticated:true,authorized:true}),
  signOut:async()=>true};
 const lifecycle={
  tracking:()=>({operationId:tracked}),
  refresh:async()=>{
   lookups++;
   if(pending)return new Promise(resolve=>{pending.push(resolve);});
   return {operationId:tracked,phase,sandboxVerified:phase==='Live',
    publicLive:false};
  },
 };
 let connected=true;
 const controller=createD3ConnectionController({
  auth,lifecycle,enabled:()=>true,online:()=>connected,
 });
 const clock={
  setTimer:(fn,ms)=>{
   const id=++nextId;scheduled.set(id,{fn,ms});return id;
  },
  clearTimer:id=>scheduled.delete(id),
  async fire(){
   const entry=scheduled.entries().next().value;
   assert(entry,'Expected a scheduled owner status read');
   const [id,job]=entry;scheduled.delete(id);
   await job.fn();
  },
  get count(){return scheduled.size;},
  get delay(){return [...scheduled.values()][0]?.ms;},
 };
 const mount=()=>mountD3ConnectionPanel({
  dialog,controller,documentObject:doc,windowObject:win,
  online:()=>connected,
  setTimer:clock.setTimer,clearTimer:clock.clearTimer,
 });
 return {controller,clock,mount,doc,win,dialog,
  get lookups(){return lookups;},
  setPhase:v=>{phase=v;},
  setTracked:v=>{tracked=v;},
  setOnline:v=>{connected=v;},
  hold:()=>{pending=[];},
  resolveHeld:result=>{
   const queue=pending;pending=null;
   for(const release of queue)release(result);
  },
 };
}

test('D3-C11 visible owner polls about every five seconds and stops at Live',async()=>{
 const x=pollingFixture();
 await x.controller.restore();
 await x.controller.refreshPublication();
 const panel=x.mount();
 assert.equal(x.clock.count,1);
 assert.equal(x.clock.delay,5000);
 assert.equal(x.controller.current().publication,'Accepted');
 x.setPhase('Checking');
 const refreshing=x.clock.fire();
 assert.equal(x.controller.current().publication,'Accepted',
  'A pending GET must not flash Checking before receiving a new state');
 await refreshing;
 assert.equal(x.controller.current().publication,'Checking');
 assert.equal(x.clock.count,1);
 x.setPhase('Live');
 await x.clock.fire();
 assert.equal(x.controller.current().publication,'Live');
 assert.equal(x.controller.current().sandboxVerified,true);
 assert.equal(x.controller.current().publicLive,false);
 assert.equal(x.clock.count,0,'Terminal Live must not poll');
 panel.remove();
});

test('D3-C12 manual and automatic GETs share one in-flight request',async()=>{
 const x=pollingFixture();
 await x.controller.restore();
 await x.controller.refreshPublication();
 const panel=x.mount();
 x.hold();
 const before=x.lookups;
 const poll=x.clock.fire();
 assert.equal(x.lookups,before+1);
 const toolbar=x.dialog.children[0].children[2];
 const manual=toolbar.children.find(c=>c.textContent==='Check publication status');
 manual.handlers.click();
 assert.equal(x.lookups,before+1,'Manual refresh must reuse polling GET');
 x.resolveHeld({operationId:OP,phase:'Live',
  sandboxVerified:true,publicLive:false});
 await poll;
 assert.equal(x.controller.current().publication,'Live');
 assert.equal(x.clock.count,0);
 panel.remove();
});

test('D3-C13 hidden, offline and closed screens suspend and safely resume',async()=>{
 const x=pollingFixture();
 await x.controller.restore();
 await x.controller.refreshPublication();
 const panel=x.mount();
 assert.equal(x.clock.count,1);
 x.doc.visibilityState='hidden';x.doc.handlers.visibilitychange();
 assert.equal(x.clock.count,0);
 x.doc.visibilityState='visible';x.doc.handlers.visibilitychange();
 assert.equal(x.clock.count,1);
 x.setOnline(false);x.win.handlers.offline();
 assert.equal(x.clock.count,0);
 x.setOnline(true);x.win.handlers.online();
 assert.equal(x.clock.count,1);
 x.dialog.open=false;x.dialog.handlers.close();
 assert.equal(x.clock.count,0);
 x.dialog.open=true;panel.paint();
 assert.equal(x.clock.count,1);
 panel.remove();
 assert.equal(x.clock.count,0);
 assert.equal(x.doc.handlers.visibilitychange,undefined,
  'Unmount must remove lifecycle listeners');
});

test('D3-C14 an outstanding status result cannot restore a signed-out owner',async()=>{
 const x=pollingFixture();
 await x.controller.restore();
 await x.controller.refreshPublication();
 const panel=x.mount();
 x.hold();
 const polling=x.clock.fire();
 assert.equal(x.lookups,2);
 await x.controller.signOut();
 panel.paint();
 assert.equal(x.controller.current().authorized,false);
 assert.equal(x.clock.count,0);
 x.resolveHeld({operationId:OP,phase:'Live',
  sandboxVerified:true,publicLive:false});
 await polling;
 assert.equal(x.controller.current().authorized,false);
 assert.equal(x.controller.current().publication,'None');
 panel.remove();
});

test('D3-C15 a changed operation does not accept a stale status reply',async()=>{
 const x=pollingFixture();
 await x.controller.restore();
 await x.controller.refreshPublication();
 const panel=x.mount();
 x.hold();
 const polling=x.clock.fire();
 x.setTracked(NEXT_OP);
 x.resolveHeld({operationId:OP,phase:'Live',
  sandboxVerified:true,publicLive:false});
 await polling;
 assert.equal(x.controller.current().operationId,OP);
 assert.equal(x.controller.current().publication,'Accepted');
 panel.remove();
});

test('D3-C16 transient read failure retains progress with bounded backoff',async()=>{
 const x=pollingFixture();
 await x.controller.restore();
 await x.controller.refreshPublication();
 const panel=x.mount();
 x.hold();
 const polling=x.clock.fire();
 x.resolveHeld(Promise.reject(new Error('temporary network failure')));
 await polling;
 assert.equal(x.controller.current().publication,'Accepted');
 assert.equal(x.controller.current().statusReadError,true);
 assert.equal(x.clock.delay,10000);
 x.setPhase('Verifying');
 await x.clock.fire();
 assert.equal(x.controller.current().publication,'Verifying');
 assert.equal(x.controller.current().statusReadError,false);
 assert.equal(x.clock.delay,5000);
 panel.remove();
});


test('D3-C17 reopening during an older GET rechecks after stale request settles',async()=>{
 const x=pollingFixture();
 await x.controller.restore();
 await x.controller.refreshPublication();
 const panel=x.mount();
 x.hold();
 const oldPoll=x.clock.fire();
 await x.controller.restore();
 const reopened=x.controller.refreshPublication();
 assert.equal(x.lookups,2,'Only the old status GET may be in flight');
 x.setPhase('Merging');
 x.resolveHeld({operationId:OP,phase:'Checking',
  sandboxVerified:false,publicLive:false});
 await Promise.all([oldPoll,reopened]);
 assert.equal(x.lookups,3,'Reopened owner must receive a fresh status GET');
 assert.equal(x.controller.current().publication,'Merging');
 panel.remove();
});

test('D3-C18 closing during a GET ignores its update and resumes on reopen',async()=>{
 const x=pollingFixture();
 await x.controller.restore();
 await x.controller.refreshPublication();
 const panel=x.mount();
 x.hold();
 const polling=x.clock.fire();
 x.dialog.open=false;x.dialog.handlers.close();
 x.resolveHeld({operationId:OP,phase:'Live',
  sandboxVerified:true,publicLive:false});
 await polling;
 assert.equal(x.controller.current().publication,'Accepted');
 assert.equal(x.clock.count,0);
 x.dialog.open=true;panel.paint();
 assert.equal(x.clock.count,1);
 x.setPhase('Live');
 await x.clock.fire();
 assert.equal(x.controller.current().publication,'Live');
 assert.equal(x.clock.count,0);
 panel.remove();
});

test('D3-C19 Failed and Conflict are terminal and never self-republish',async()=>{
 for(const terminal of ['Failed','Conflict']){
  const x=pollingFixture();
  await x.controller.restore();
  await x.controller.refreshPublication();
  const panel=x.mount();
  x.setPhase(terminal);
  await x.clock.fire();
  assert.equal(x.controller.current().publication,terminal);
  assert.equal(x.clock.count,0);
  assert.equal(x.lookups,2);
  panel.remove();
 }
});


test('D3-C20 a server-accepted receipt remains pending after first GET fails',async()=>{
 let reads=0;
 const controller=createD3ConnectionController({
  enabled:()=>true,online:()=>true,
  auth:{session:async()=>({authenticated:true,authorized:true}),
   signOut:async()=>true},
  lifecycle:{
   tracking:()=>({operationId:OP,phase:'Accepted'}),
   refresh:async()=>{reads++;throw Error('temporary status timeout');},
  },
 });
 await controller.restore();
 await controller.refreshPublication();
 const state=controller.current();
 assert.equal(reads,1);
 assert.equal(state.operationId,OP);
 assert.equal(state.publication,'Accepted');
 assert.equal(state.statusReadError,true);
 assert.equal(state.sandboxVerified,false);
 assert.equal(state.publicLive,false);
});
