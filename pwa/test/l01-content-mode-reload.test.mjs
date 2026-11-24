import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {needsContentModeReload} from '../src/d6-content-mode-reload.mjs';
test('L01 deferred editor exit and both content source transitions require a fresh bootstrap',()=>{
 assert.equal(needsContentModeReload({source:'d1',mode:'Work Offline'}),true);
 assert.equal(needsContentModeReload({source:'v3-content',mode:'Automatic',online:true,direct:true}),true);
 assert.equal(needsContentModeReload({source:'v3-content',mode:'Automatic',online:false,direct:true}),false);
 assert.equal(needsContentModeReload({source:'d1',mode:'Automatic',online:true,direct:true}),false);
 assert.equal(needsContentModeReload({source:'v3-content',mode:'Work Offline'}),false);
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/if\(offline\?\.getModeAvailable\?\.\(\)!==true\|\|dirty\(\)\)return false/);
 assert.match(ui,/if\(ticket!==serial\|\|reloadForContentMode\(\)\)return;disposeEditor\(\)/);
 assert.match(ui,/if\(reloadForContentMode\(\)\)return;/);
 assert.match(ui,/contentBootReloadPending=true;\s*location\.reload\(\)/);
});
