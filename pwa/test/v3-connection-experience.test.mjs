import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {displayPublicationSummary,publicationGuidance,
 mountV3ConnectionExperience} from '../src/v3-connection-experience.mjs';

class E{
 constructor(tag){this.tagName=tag;this.className='';this.textContent='';
  this.children=[];this.handlers={};this.href='';this.dataset={};this.hidden=false;this.open=false;}
 append(...children){this.children.push(...children);}
 appendChild(child){this.children.push(child);return child;}
 replaceChildren(...children){this.children=children;}
 insertBefore(child,before){const i=this.children.indexOf(before);
  if(i<0)this.children.push(child);else this.children.splice(i,0,child);}
 querySelector(value){if(value==='#connection-close')return this.children.find(c=>c.id==='connection-close')??null;return null;}
 setAttribute(name,value){this[name]=value;}
 addEventListener(event,fn){this.handlers[event]=fn;}
 remove(){this.removed=true;}
}
const doc={createElement:tag=>new E(tag)};
const texts=e=>[e.textContent,...(e.children||[]).flatMap(texts)].filter(Boolean).join(' | ');
const screen=state=>{
 const dialog=new E('dialog'),close=new E('button');close.id='connection-close';dialog.append(close);
 let snapshot={...state};
 const calls={signOut:0,refresh:0,ack:0};
 const controller={
  current:()=>snapshot,
  signOut:async()=>{calls.signOut++;snapshot={phase:'Anonymous',authorized:false,publication:'None'};},
  refreshPublication:async()=>{calls.refresh++;},
  acknowledgeFailedPublication:()=>{calls.ack++;snapshot={...snapshot,operationId:null,publication:'Cleared'};},
 };
 const view=mountV3ConnectionExperience({dialog,controller,documentObject:doc});
 return {dialog,view,calls,update(value){snapshot={...snapshot,...value};view.paint();},
  account:dialog.children[0],publishing:dialog.children[1]};
};
const OP='p3_01234567-1234-4234-8234-123456789abc';
const summary={domain:'gear',action:'edit',itemName:'Garmin Force Current',
 completedAt:1793360000,reasonCode:null};
test('V3-UX01 signed-out account and publishing do not expose owner details',()=>{
 const x=screen({phase:'Anonymous',authorized:false,publication:'Live',
  ownerLogin:'ginosega',summary});
 assert.match(texts(x.account),/Not signed in/);
 assert.match(texts(x.account),/Sign in with GitHub/);
 assert.match(texts(x.publishing),/Sign in to view publishing status/);
 assert(!texts(x.publishing).includes('Garmin'));
 x.view.remove();
});
test('V3-UX02 verified username and latest server Live summary remain visible',()=>{
 const x=screen({phase:'Owner',authorized:true,ownerLogin:'ginosega',
  publication:'Live',sandboxVerified:true,summary,operationId:OP});
 assert.match(texts(x.account),/Signed in as ginosega/);
 assert.match(texts(x.publishing),/Completed · Sandbox Live/);
 assert.match(texts(x.publishing),/Garmin Force Current/);
 assert.match(texts(x.publishing),/Gear · Updated/);
 assert.match(texts(x.publishing),/Completed/);
 assert(!texts(x.publishing).includes(OP));
 x.view.remove();
});
test('V3-UX03 failed operation displays actionable source conflict and Clear',()=>{
 const x=screen({phase:'Owner',authorized:true,ownerLogin:'ginosega',
  publication:'Conflict',operationId:OP,summary:{...summary,reasonCode:'SOURCE_CONFLICT'}});
 assert.match(texts(x.publishing),/Source conflict/);
 assert.match(texts(x.publishing),/reconcile your edit/);
 const clear=x.publishing.children[1].children.find(e=>e.textContent==='Clear');
 assert(clear);
 clear.handlers.click();
 assert.equal(x.calls.ack,1);
 x.view.paint();
 assert.match(texts(x.publishing),/Failed status cleared/);
 x.view.remove();
});
test('V3-UX04 unknown status offers Check again; active normal never does',()=>{
 const x=screen({phase:'Owner',authorized:true,publication:'Checking',
  operationId:OP,summary,statusReadError:false});
 assert.match(texts(x.publishing),/Publishing: Checking/);
 assert(!texts(x.publishing).includes('Check again'));
 x.update({statusReadError:true});
 assert.match(texts(x.publishing),/Check again/);
 x.update({publication:'Unknown'});
 assert.match(texts(x.publishing),/outcome could not be verified/);
 x.view.remove();
});
test('V3-UX05 unknown failures are never called correctable or auto retried',()=>{
 assert.match(publicationGuidance('Failed','D3_SCHEDULED_FAILURE').message,/Contact ChatGPT/);
 assert.match(publicationGuidance('Failed',null).message,/does not repair/);
 assert.equal(displayPublicationSummary({...summary,itemName:''}),null);
 assert.equal(displayPublicationSummary({...summary,itemName:'a'}).name,'a');
});

test('V3-UX06 publication dot tracks tone without overriding an open disclosure',()=>{
 const x=screen({phase:'Owner',authorized:true,ownerLogin:'ginosega',
  publication:'Live',sandboxVerified:true,summary,operationId:OP});
 const header=x.publishing.children[0],dot=header.children[0].children[0];
 assert.equal(x.publishing.tagName,'details');
 assert.equal(header.tagName,'summary');
 assert.equal(header.children[0].tagName,'h2');
 assert.equal(x.publishing.open,false);
 assert.equal(dot.hidden,true);
 x.view.paintIndicator({tone:'publishing',title:'Publishing: Checking'});
 x.view.onDialogOpen(); // Opening during publishing defaults to expanded.
 assert.equal(dot.hidden,false);
 assert.equal(dot.dataset.tone,'publishing');
 assert.equal(dot.title,'Publishing: Checking');
 assert.equal(x.publishing.open,true);
 x.view.paintIndicator({tone:'error',title:'Publishing failed'});
 assert.equal(dot.hidden,false);
 assert.equal(dot.dataset.tone,'error');
 assert.equal(x.publishing.open,true);
 x.view.paintIndicator({tone:'network',title:'Connection status: Online'});
 assert.equal(x.publishing.open,true,'Completion cannot collapse while dialog is open');
 assert.equal(dot.hidden,true);
 assert.equal(dot.title,'');
 x.view.remove();
});
test('V3-UX07 headings remain H2s and values are strong text',()=>{
 const x=screen({phase:'Owner',authorized:true,ownerLogin:'ginosega',
  publication:'Live',sandboxVerified:true,summary,operationId:OP});
 assert.equal(x.account.children[0].tagName,'h2');
 assert.equal(x.account.children[1].children[0].tagName,'strong');
 assert.equal(x.publishing.children[1].children[0].tagName,'strong');
 assert.equal(x.publishing.children[1].children[1].tagName,'strong');
 x.view.remove();
});


test('V3-UX08 completed publishing defaults collapsed; manual view survives network refresh',()=>{
 const x=screen({phase:'Owner',authorized:true,ownerLogin:'ginosega',
  publication:'Live',sandboxVerified:true,summary,operationId:OP});
 const dot=x.publishing.children[0].children[0].children[0];
 x.view.paintIndicator({tone:'network',title:'Connection status: Online'});
 x.view.onDialogOpen();
 assert.equal(x.publishing.open,false);
 assert.equal(dot.hidden,true);
 assert.match(texts(x.publishing),/Completed · Sandbox Live/);
 // The browser's native disclosure control lets the owner inspect history.
 x.publishing.open=true;
 x.view.paintIndicator({tone:'network',title:'Connection status: Online'});
 assert.equal(x.publishing.open,true);
 x.view.remove();
});
test('V3-UX09 opening defaults to expanded for active/failed, collapsed after Live or Clear',()=>{
 const x=screen({phase:'Owner',authorized:true,publication:'Checking',
  summary,operationId:OP});
 for(const tone of ['publishing','error']){
  x.view.paintIndicator({tone,title:tone==='error'?'Publishing failed':'Publishing: Checking'});
  x.view.onDialogOpen();
  assert.equal(x.publishing.open,true);
  x.publishing.open=false; // Owner's deliberate collapse while dialog is open.
  x.view.paintIndicator({tone,title:'Polling update'});
  assert.equal(x.publishing.open,false,'Polling must preserve manual collapse');
  x.view.onDialogOpen(); // After close, next open reapplies active default.
  assert.equal(x.publishing.open,true);
 }
 for(const outcome of ['Live','Cleared','None']){
  x.update({publication:outcome,sandboxVerified:outcome==='Live'});
  x.view.paintIndicator({tone:'network',title:'Connection status: Online'});
  assert.equal(x.publishing.open,true,'Completion must not collapse existing view');
  x.view.onDialogOpen(); // Close + reopen, terminal default is collapsed.
  assert.equal(x.publishing.open,false);
  x.publishing.open=true; // Owner may still review history.
 }
 x.view.remove();
});
test('V3-UX11 a pre-expanded completed view is preserved through active and terminal updates',()=>{
 const x=screen({phase:'Owner',authorized:true,publication:'Live',
  sandboxVerified:true,summary,operationId:OP});
 x.view.paintIndicator({tone:'network',title:'Connection status: Online'});
 x.view.onDialogOpen();
 assert.equal(x.publishing.open,false);
 x.publishing.open=true; // User opens the completed disclosure manually.
 x.view.paintIndicator({tone:'publishing',title:'Publishing: Accepted'});
 x.update({publication:'Accepted'});
 assert.equal(x.publishing.open,true);
 x.view.paintIndicator({tone:'network',title:'Connection status: Online'});
 x.update({publication:'Live',sandboxVerified:true});
 assert.equal(x.publishing.open,true);
 x.view.onDialogOpen(); // It collapses only at the next instantiation.
 assert.equal(x.publishing.open,false);
 x.view.remove();
});
test('V3-UX10 unknown read failure never falsely expands or claims publishing failure',()=>{
 const x=screen({phase:'Owner',authorized:true,publication:'Unknown',
  summary,operationId:OP,statusReadError:true});
 x.view.paintIndicator({tone:'network',title:'Connection status: Offline'});
 assert.equal(x.publishing.open,false);
 assert.match(texts(x.publishing),/outcome could not be verified/);
 assert.match(texts(x.publishing),/Check again/);
 x.view.remove();
});

test('V3-UX12 the real Connection Status entry initializes disclosure after opening',()=>{
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/connectionDialog\.showModal\(\);\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*connectionExperience\?\.onDialogOpen\(\)/);
 const presentation=readFileSync(new URL('../src/v3-connection-experience.mjs',import.meta.url),'utf8');
 assert.match(presentation,/function onDialogOpen\(\)\{/);
 assert.doesNotMatch(presentation,/previousIndicatorActive/);
});
