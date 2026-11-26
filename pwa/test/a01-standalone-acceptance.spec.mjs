import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {D6_NORMALIZED_IDS} from '../src/d6-normalized-id-ledger.mjs';

// A01 uses the actual standalone software bundle, a fresh Chromium
// context and synthetic catalog responses; never a live Worker or D1/R2.
const setting=process.env.FISHING_A01_DIST;
const root=setting?path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..',setting):null;
const prefix='/fishing/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript',
 '.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json',
 '.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon'};
const catalogs={
 gear:D6_NORMALIZED_IDS.gear.map(id=>({id,name:id,category:'equipment',type:'Accessories'})),
 kb:D6_NORMALIZED_IDS.kb.map(id=>({id,name:id,type:'gear-guides',content:'KB/Gear-Guides/content/'+id+'.md'})),
 catches:D6_NORMALIZED_IDS.catches.map(id=>({id,date:'2026-01-01'})),
};
let server,base,release,manifest,authorized,requests;
function json(res,status,value){
 res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});
 res.end(JSON.stringify(value));
}
async function serve(req,res){
 const url=new URL(req.url,'http://127.0.0.1');
 requests.push({method:req.method,path:url.pathname});
 if(!['GET','HEAD'].includes(req.method))return json(res,403,{ok:false});
 if(url.pathname==='/session')return json(res,200,
  authorized?{authenticated:true,authorized:true,ownerLogin:'ginosega'}:
   {authenticated:false,authorized:false});
 const domain=url.pathname.slice('/api/v3/content/'.length);
 if(url.pathname.startsWith('/api/v3/content/')&&Object.hasOwn(catalogs,domain)){
  const items=catalogs[domain];return json(res,200,{ok:true,count:items.length,items});
 }
 if(url.pathname==='/api/v3/media/manifest')
  return json(res,200,{ok:true,version:1,paths:[]});
 if(!url.pathname.startsWith(prefix))return json(res,403,{ok:false});
 const file=path.resolve(root,decodeURIComponent(url.pathname.slice(prefix.length))||'index.html');
 if(!file.startsWith(root+path.sep))return json(res,403,{ok:false});
 try{
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream',
   'Content-Length':bytes.length,'Cache-Control':'no-store'});
  res.end(req.method==='HEAD'?undefined:bytes);
 }catch{return json(res,404,{ok:false});}
}
test.skip(!setting,'A01 requires a verified standalone V3 build');
test.beforeAll(async()=>{
 release=JSON.parse(await readFile(path.join(root,'release.json'),'utf8'));
 manifest=JSON.parse(await readFile(path.join(root,release.manifest),'utf8'));
 expect(release.sourceRevision).toMatch(/^[a-f0-9]{40}$/);
 for(const flag of ['standaloneV3','d6DirectGearSave','d6DirectKBSave','d6DirectCatchSave',
  'd6OwnerMediaUpload','d6R2CardThumbnails','d6OfflineContentPreparation','d6OfflineContentReading']){
  expect(release[flag],flag).toBe(true);expect(manifest[flag],flag).toBe(true);
 }
 expect(manifest.format).toBe('fishing-companion-software-v3');
 expect(manifest.base).toBe(prefix);
 expect(manifest.counts).toBeUndefined();
 expect(manifest.files.some(x=>/\/(?:content|card-thumbnails)\//.test(x.path))).toBe(false);
 server=createServer((req,res)=>{void serve(req,res).catch(()=>json(res,500,{ok:false}));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port+prefix;
});
test.afterAll(async()=>{if(server)await new Promise(resolve=>server.close(resolve));});
test.beforeEach(()=>{authorized=false;requests=[];});
function assertNoLegacyOrWrites(){
 expect(requests.filter(r=>!['GET','HEAD'].includes(r.method))).toEqual([]);
 expect(requests.filter(r=>/\/releases\/[^/]+\/(?:content|card-thumbnails)\/|\/api\/v3\/authoring-source/.test(r.path))).toEqual([]);
}
test('A01 fresh unsigned standalone browser opens current library without editor or login gate',async({page})=>{
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await expect.poll(()=>page.evaluate(()=>window.__FISHING_V3__?.counts??null),
  {timeout:60000}).toEqual({gear:100,kb:60,catches:12});
 await expect(page.locator('#app h1').first()).toHaveText('Fishing Companion');
 await expect(page.locator('#app .editor')).toHaveCount(0);
 await page.locator('#connection-status').click();
 await expect(page.getByText('Not signed in',{exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:'Sign in with GitHub'})).toHaveAttribute('href','/auth/start');
 await expect(page.locator('#offline-update')).toBeEnabled();
 for(const domain of Object.keys(catalogs))
  expect(requests.some(r=>r.path==='/api/v3/content/'+domain)).toBe(true);
 expect(requests.some(r=>r.path==='/api/v3/media/manifest')).toBe(true);
 expect(requests.some(r=>r.path==='/api/v3/content/offline-snapshot')).toBe(false);
 assertNoLegacyOrWrites();
});
test('A01 fresh authorized standalone browser loads current catalogs without legacy assets',async({page})=>{
 authorized=true;
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await expect.poll(()=>page.evaluate(()=>window.__FISHING_V3__?.counts??null),
  {timeout:60000}).toEqual({gear:100,kb:60,catches:12});
 await expect(page.locator('#app h1').first()).toHaveText('Fishing Companion');
 expect(await page.evaluate(()=>Boolean(window.__FISHING_V2__))).toBe(false);
 for(const domain of Object.keys(catalogs))
  expect(requests.some(r=>r.path==='/api/v3/content/'+domain)).toBe(true);
 expect(requests.some(r=>r.path==='/api/v3/media/manifest')).toBe(true);
 expect(requests.some(r=>r.path==='/api/v3/content/offline-snapshot')).toBe(false);
 assertNoLegacyOrWrites();
 expect(errors).toEqual([]);
});
