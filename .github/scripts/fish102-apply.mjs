import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promoteChange,validatePackage} from '../../pwa/src/handoff.mjs';
import {validateRecords,validateLibraryPaths} from '../../pwa/src/validation.mjs';
import {inventorySource} from '../../pwa/tools/library.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const readJson=async file=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const writeText=(file,text)=>fs.writeFile(path.join(root,file),text);
const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
const pkg={
  format:'fishing-companion-change-v2',domain:'kb',operation:'add',id:'line-tackle-knot-reference',
  base:{schemaVersion:2,sourceRevision:'360d71ff2bfaf075ad498d18f05126268f6606f1',recordHash:null},
  record:{id:'line-tackle-knot-reference',name:'Line-Tackle-Knot Reference',type:'knot',description:'Recommended knots for line, lure, and tackle combinations'},
  notes:{action:'create',path:'KB/Knots/content/Line-Tackle-Knot Reference.md',body:'**Braided line**\n- To leader: FG knot, or Albright when on the water\n- To swivel: N/A (the swivel is in the leader)\n- To snap: Palomar\n- To hook: N/A (use leader)\n- To lure: Palomar or Modified Uni (topwater fishing only, otherwise use leader)\n\n**Fluorocarbon**\n- To swivel: Trilene\n- To snap: Trilene\n- To hook: Improved Clinch, or Palomar for heavier tackle\n- To lure: Use snap for more action, otherwise Palomar\n\n**Monofilament**\n- To swivel: Improved Clinch\n- To snap: Improved Clinch\n- To hook: Improved Clinch, or Palomar for heavier tackle\n- To lure: Use snap for more action, otherwise Palomar',baseSha256:null},
  picture:{action:'add',path:'KB/Knots/assets/Line-Tackle-Knot Reference.png',file:{bytes:2603991,sha256:'520957564ae81f5f0bdee377785f35a31026366260b4822216b1a537ef851072'}},
  pictureSequence:{action:'keep'}
};
validatePackage(pkg);

const gear=await readJson('Gear/gear.json');
const kb=await readJson('KB/kb.json');
const catches=await readJson('Catches/catches.json');
assert(!kb.entities.some(x=>x.id===pkg.id),'ID already exists before apply');
const promoted=await promoteChange({package:pkg,currentRecord:undefined,sourceRevision:'1b421ac67d27fb6279b4e5f5a7db9402596323ea',validate:record=>{
  const next=structuredClone(kb);next.entities.push(record);validateRecords({gear,kb:next,catches});
}});
kb.entities.push(promoted.record);
await writeText('KB/kb.json',JSON.stringify(kb,null,2)+'\n');
await writeText(pkg.notes.path,pkg.notes.body);

let ui=await fs.readFile(path.join(root,'pwa/src/ui.mjs'),'utf8');
const rootMarker="const ROOT_SUBTITLES={gear:'Browse your inventory of equipment, tackle, and bait',kb:'Fishing reference library'};\nconst CATEGORY_PRESENTATION=";
assert(ui.includes(rootMarker),'UI root marker missing');
ui=ui.replace(rootMarker,"const ROOT_SUBTITLES={gear:'Browse your inventory of equipment, tackle, and bait',kb:'Fishing reference library'};\nconst KB_PINNED_FIRST={knot:'line-tackle-knot-reference'};\nconst CATEGORY_PRESENTATION=");
const signature="function listControls(domain,records,{search=false,filter=false,sort='name',title=''}={}){";
assert(ui.includes(signature),'listControls signature missing');
ui=ui.replace(signature,"function listControls(domain,records,{search=false,filter=false,sort='name',title='',pinnedId=''}={}){");
const drawMarker="items=sort==='gear'?sortGear(items):sortNames(items);count.textContent";
assert(ui.includes(drawMarker),'listControls draw marker missing');
ui=ui.replace(drawMarker,"items=sort==='gear'?sortGear(items):sortNames(items);if(pinnedId){const index=items.findIndex(r=>r.id===pinnedId);if(index>0)items.unshift(...items.splice(index,1));}count.textContent");
const listMarker="const list=listControls(domain,records,{title:definition[1],search:gear?key==='lures':key==='equipment',filter:gear,sort:gear?'gear':'name'});";
assert(ui.includes(listMarker),'renderList marker missing');
ui=ui.replace(listMarker,"const list=listControls(domain,records,{title:definition[1],search:gear?key==='lures':key==='equipment',filter:gear,sort:gear?'gear':'name',pinnedId:gear?'':KB_PINNED_FIRST[key]||''});");
await writeText('pwa/src/ui.mjs',ui);

let browser=await fs.readFile(path.join(root,'pwa/test/browser.spec.mjs'),'utf8');
const browserMarker=" await route(page,'#/kb','Knowledge Base');\n await page.getByPlaceholder('Search Knowledge Base').fill('Silver Lake');";
assert(browser.includes(browserMarker),'Browser navigation marker missing');
browser=browser.replace(browserMarker," await route(page,'#/kb','Knowledge Base');\n await route(page,'#/kb/category/knot','Knots');\n const knotNames=await page.locator('.record-grid .nav-card h2').allTextContents();expect(knotNames[0]).toBe('Line-Tackle-Knot Reference');expect(knotNames.slice(1)).toEqual([...knotNames.slice(1)].sort((a,b)=>a.localeCompare(b)));\n await route(page,'#/kb','Knowledge Base');\n await page.getByPlaceholder('Search Knowledge Base').fill('Silver Lake');");
await writeText('pwa/test/browser.spec.mjs',browser);

const data={gear,kb,catches};
validateRecords(data);
const routeCount=validateLibraryPaths(data).size;
const inventory=await inventorySource(root,{pendingMedia:true});
const referenceCount=inventory.references.length;
let core=await fs.readFile(path.join(root,'pwa/test/core.test.mjs'),'utf8');
for(const [from,to] of [
  ['[69,55,5]',`[69,${kb.entities.length},5]`],
  ['maps.kb.size,55',`maps.kb.size,${kb.entities.length}`],
  ['validateLibraryPaths(data).size,105',`validateLibraryPaths(data).size,${routeCount}`],
  ['result.references.length,235',`result.references.length,${referenceCount}`]
]){assert(core.includes(from),`Core fixture marker missing: ${from}`);core=core.replace(from,to);}
await writeText('pwa/test/core.test.mjs',core);

let hosted=await fs.readFile(path.join(root,'pwa/tools/verify-hosted.mjs'),'utf8');
const countMarker="assert.deepEqual(await page.evaluate(()=>window.__FISHING_V2__.counts),{gear:69,kb:55,catches:5});";
assert(hosted.includes(countMarker),'Hosted count marker missing');
hosted=hosted.replace(countMarker,"assert.deepEqual(await page.evaluate(()=>window.__FISHING_V2__.counts),{gear:69,kb:56,catches:5});\n await page.goto(preview+'#/kb/category/knot');await page.getByRole('heading',{name:'Knots',exact:true,level:1}).waitFor();const hostedKnotNames=await page.locator('.record-grid .nav-card h2').allTextContents();assert.equal(hostedKnotNames[0],'Line-Tackle-Knot Reference');assert.deepEqual(hostedKnotNames.slice(1),[...hostedKnotNames.slice(1)].sort((a,b)=>a.localeCompare(b)));");
hosted=hosted.replace("production online-only default, explicit complete-library preparation, offline reload, navigation, counts, image viewer, absent pictures and no release diagnostics passed","production online-only default, explicit complete-library preparation, offline reload, navigation, counts, pinned Knot ordering, image viewer, absent pictures and no release diagnostics passed");
await writeText('pwa/tools/verify-hosted.mjs',hosted);

console.log(JSON.stringify({applied:true,kbRecords:kb.entities.length,validatedLibraryPaths:routeCount,referencedSourceFiles:referenceCount,pinnedId:pkg.id},null,2));
