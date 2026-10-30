import test from 'node:test';
import assert from 'node:assert/strict';
import {displayPublicationSummary,publicationGuidance,
 mountV3ConnectionExperience} from '../src/v3-connection-experience.mjs';

class E{
 constructor(tag){this.tagName=tag;this.className='';this.textContent='';
  this.children=[];this.handlers={};this.href='';}
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
