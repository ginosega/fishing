import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createD3OwnerPilotEntry,D3PilotEntryError}
 from '../src/d3-owner-pilot-entry.mjs';
import {D3_OWNER_PILOT_HTML,D3_OWNER_PILOT_PATH,
 D3_OWNER_PILOT_SCRIPT} from '../src/d3-owner-pilot-page.mjs';

const origin='https://fishing.example';
const ID='a'.repeat(32);
const release=()=>({id:ID,sourceRevision:'b'.repeat(40),
 manifest:'releases/'+ID+'/manifest.json'});
const sourceManifest=()=>({format:'fishing-companion-release-v2',
 releaseId:ID,sourceRevision:'b'.repeat(40),base:'/fishing/',
 schemaVersions:{gear:2,kb:2,catches:2},
 files:[{path:'releases/'+ID+'/styles.css'}]});
const reply=v=>new Response(JSON.stringify(v),{status:200,
 headers:{'Content-Type':'application/json'}});
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
function fixture({enabled=true,online=true,wrongDigest=false,
 wrongBase=false,missingCss=false,invalidOwnerShell=false}={}){
 const pointer=release();
 let manifest=sourceManifest();
 if(wrongBase)manifest.base='/fishing/v2-preview/';
 if(missingCss)manifest.files=[];
 pointer.manifestSha256=wrongDigest?'f'.repeat(64):hash(manifest);
 const network=[],css=[],calls=[],global={};
 const document={
  head:{append:node=>css.push(node)},
  createElement:tag=>({tag}),
  getElementById:id=>({id}),
 };
 const pilot=createD3OwnerPilotEntry({
  origin,enabled:()=>enabled,online:()=>online,
  request:async(url,options)=>{
   network.push({url,options});
   if(url===origin+'/fishing/release.json')return reply(pointer);
   if(url===origin+'/fishing/'+pointer.manifest)return reply(manifest);
   assert.fail('Unallowlisted fetch: '+url);
  },
  windowObject:global,documentObject:document,
  bootstrapApp:async()=>assert.fail('Shell stub owns bootstrap'),
  shellFactory:options=>{
   calls.push(options);
   if(invalidOwnerShell)return {};
   return {start:async settings=>{calls.push(settings);
    assert.equal(settings.root,origin+'/fishing/');
    assert.equal(settings.release.id,ID);
    assert.equal(settings.manifest.base,'/fishing/');
   }};
  },
 });
 return {pilot,network,css,calls,global};
}
const denies=c=>e=>e instanceof D3PilotEntryError&&e.code===c;

test('D3-P01 disabled pilot never fetches public or private bytes',async()=>{
 const x=fixture({enabled:false});
 await assert.rejects(x.pilot.start(),denies('NOT_ENABLED'));
 assert.equal(x.network.length,0);
 assert.equal(x.css.length,0);
});
test('D3-P02 exact release manifest hash and same-origin CSS precede pilot shell',async()=>{
 const x=fixture(),res=await x.pilot.start();
 assert.equal(res.sandboxOnly,true);
 assert.equal(res.canonicalLive,false);
 assert.equal(res.publicReleaseId,ID);
 assert.equal(x.network.length,2);
 for(const call of x.network){
  assert(call.url.startsWith(origin+'/fishing/'));
  assert.equal(call.options.method,'GET');
  assert.equal(call.options.credentials,'same-origin');
  assert.equal(call.options.redirect,'manual');
  assert.equal(call.options.cache,'no-store');
 }
 assert.equal(x.css.length,1);
 assert.equal(x.css[0].href,origin+'/fishing/releases/'+ID+'/styles.css');
 assert.equal(x.global.__FISHING_BOOT__.manifest.sourceRevision,'b'.repeat(40));
 assert.equal(x.calls.length,2);
});
test('D3-P03 public manifest tampering prevents any owner shell',async()=>{
 const x=fixture({wrongDigest:true});
 await assert.rejects(x.pilot.start(),denies('MANIFEST_DIGEST_MISMATCH'));
 assert.equal(x.css.length,0);
 assert.equal(x.calls.length,0);
});
test('D3-P04 unexpected base or missing verified CSS fails closed',async()=>{
 for(const options of [{wrongBase:true},{missingCss:true}]){
  const x=fixture(options);
  await assert.rejects(x.pilot.start(),denies('INCOMPATIBLE_PUBLIC_RELEASE'));
  assert.equal(x.calls.length,0);
 }
});
test('D3-P05 offline or repeated activation never starts a second shell',async()=>{
 const off=fixture({online:false});
 await assert.rejects(off.pilot.start(),denies('OFFLINE_DENIED'));
 assert.equal(off.network.length,0);
 const x=fixture();
 await x.pilot.start();
 await assert.rejects(x.pilot.start(),denies('ALREADY_STARTED'));
 assert.equal(x.network.length,2);
});
test('D3-P06 invalid dependency and origin never construct pilot',()=>{
 assert.throws(()=>createD3OwnerPilotEntry({
  origin:'http://fishing.example',request:async()=>{},
  documentObject:{createElement(){},head:{append(){}}},
  windowObject:{},
 }),denies('INVALID_CONFIGURATION'));
});
test('D3-P07 stand-alone HTML only loads protected pilot script; keeps familiar connection UI',()=>{
 assert.equal(D3_OWNER_PILOT_PATH,'/__d3_pilot__/');
 assert.equal(D3_OWNER_PILOT_SCRIPT,'/__d3_pilot__/pilot.js');
 assert(D3_OWNER_PILOT_HTML.includes('src="/__d3_pilot__/pilot.js"'));
 assert(D3_OWNER_PILOT_HTML.includes('id="connection-status"'));
 assert(D3_OWNER_PILOT_HTML.includes('id="connection-dialog"'));
 assert(D3_OWNER_PILOT_HTML.includes('id="app"'));
 assert(!D3_OWNER_PILOT_HTML.includes('src="./loader.js"'));
 assert(!D3_OWNER_PILOT_HTML.includes('src="./app.js"'));
 assert(!D3_OWNER_PILOT_HTML.includes('id="signin"'));
 assert(D3_OWNER_PILOT_HTML.includes('Private Gear / Knowledge Base sandbox'));
});
