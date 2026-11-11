import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * WP1 actual bundled D6 + D5 owner editor integration test.
 * Loopback server simulates owner GET session/canonical-source only.
 * Every POST/PATCH, publish/media request is denied and counted.
 * A real production Worker, GitHub App and database are never contacted.
 */
const here=path.dirname(fileURLToPath(import.meta.url));
const setting=process.env.FISHING_D6_OWNER_EDITOR_DIST;
const root=setting?path.resolve(here,'..',setting):null;
const prefix='/fishing/';
const mime={
 '.html':'text/html; charset=utf-8','.js':'text/javascript',
 '.css':'text/css','.json':'application/json',
 '.webmanifest':'application/manifest+json','.png':'image/png',
 '.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp',
 '.gif':'image/gif',
};
let server,base,release,manifest,real,sourceBody,session,logs;
test.skip(!setting,'WP1 owner editor preview requires separate verified opt-in bundle');
const deny=(res,status=404)=>{
 res.writeHead(status,{'Content-Type':'text/plain','Cache-Control':'no-store'});
 res.end('Denied');
};
const send=(res,data)=>{
 const bytes=Buffer.from(JSON.stringify(data));
 res.writeHead(200,{'Content-Type':'application/json; charset=utf-8',
  'Content-Length':bytes.length,'Cache-Control':'no-store'});
 res.end(bytes);
};
async function serve(req,res){
 const url=new URL(req.url,'http://127.0.0.1');
 if(req.method==='GET'&&url.pathname==='/session'){
  logs.sessions++;
  return send(res,session);
 }
 if(req.method==='GET'&&url.pathname==='/api/v3/authoring-source'){
  logs.sources++;
  if(session.authorized!==true)return deny(res,403);
  return send(res,sourceBody);
 }
 if(req.method==='POST'&&url.pathname==='/session/signout'){
  logs.signouts++;
  const expected=new URL(base).origin;
  if(req.headers.origin!==expected||
   req.headers['sec-fetch-site']!=='same-origin'||
   req.headers['x-fish-p0-intent']!=='signout')return deny(res,403);
  session={authenticated:false,authorized:false};
  return send(res,{signedOut:true});
 }
 if(!['GET','HEAD'].includes(req.method)){
  logs.writes.push(req.method+' '+url.pathname);
  return deny(res,403);
 }
 if(!url.pathname.startsWith(prefix))return deny(res);
 let file;
 try{file=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';}
 catch{return deny(res);}
 if(file.startsWith('/')||file.includes('\\')||
  file.split('/').some(x=>x==='.'||x==='..'||x===''))return deny(res);
 const abs=path.resolve(root,file);
 if(!abs.startsWith(root+path.sep))return deny(res);
 try{
  const bytes=await fs.readFile(abs);
  res.writeHead(200,{'Content-Type':mime[path.extname(abs)]||
   'application/octet-stream','Content-Length':bytes.length,
   'Cache-Control':'no-store'});
  res.end(req.method==='HEAD'?undefined:bytes);
 }catch{return deny(res);}
}
test.beforeAll(async()=>{
 release=JSON.parse(await fs.readFile(path.join(root,'release.json'),'utf8'));
 manifest=JSON.parse(await fs.readFile(path.join(root,release.manifest),'utf8'));
 expect(release.d6ReaderCandidate).toBe(true);
 expect(manifest.d6ReaderCandidate).toBe(true);
 expect(release.d6OwnerConnectionCandidate).toBe(true);
 expect(manifest.d6OwnerConnectionCandidate).toBe(true);
 expect(release.d6OwnerEditorPreview).toBe(true);
 expect(manifest.d6OwnerEditorPreview).toBe(true);
 expect(release.d6StaticStaging).not.toBe(true);
 expect(manifest.d6StaticStaging).not.toBe(true);
 expect(manifest.base).toBe(prefix);
 const contentRoot=path.join(root,'releases',release.id,'content');
 real={};
 for(const [domain,file] of Object.entries({
  gear:'Gear/gear.json',kb:'KB/kb.json',catches:'Catches/catches.json',
 }))real[domain]=JSON.parse(await fs.readFile(
  path.join(contentRoot,file),'utf8'));
 const contentPrefix='releases/'+release.id+'/content/';
 const paths=manifest.files.filter(x=>x.path.startsWith(contentPrefix))
  .map(x=>x.path.slice(contentPrefix.length));
 const markdown=[];
 for(const file of paths.filter(x=>x.endsWith('.md'))){
  markdown.push({path:file,body:await fs.readFile(
   path.join(contentRoot,file),'utf8')});
 }
 sourceBody={ok:true,repositoryId:1350909744,
  repositoryFullName:'ginosega/fishing',ref:'refs/heads/main',
  sandboxOnly:false,sourceRevision:release.sourceRevision,
  treeSha:'b'.repeat(40),data:real,files:paths,markdown};
 server=createServer((req,res)=>{void serve(req,res).catch(()=>deny(res,503));});
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 base='http://127.0.0.1:'+server.address().port+prefix;
});
test.afterAll(async()=>{
 if(server)await new Promise(done=>server.close(done));
});
test.beforeEach(()=>{
 session={authenticated:false,authorized:false};
 logs={sessions:0,sources:0,signouts:0,writes:[]};
});
async function open(page){
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e.message)));
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await expect(page.locator('#app h1').first()).toHaveText('Fishing Companion',
  {timeout:45000});
 return errors;
}
async function ownerReady(page){
 await page.locator('#connection-status').click();
 const dlg=page.locator('#connection-dialog');
 await expect(dlg.locator('.v3-account-body')).toContainText(
  'Signed in as ginosega',{timeout:30000});
 await expect(dlg.locator('.offline-mode-select button[aria-pressed="true"]'))
  .toContainText('Automatic',{timeout:30000});
 await dlg.getByRole('button',{name:'Close'}).click();
}
test('WP1-EDITOR-B01 anonymous cannot expose editor or fetch canonical source',async({page})=>{
 const errors=await open(page);
 const gear=real.gear.items[0];
 await page.evaluate(hash=>location.hash=hash,'#/inventory/edit/'+gear.id);
 await expect(page.locator('#app')).toContainText(
  /Owner editor preview is unavailable|Owner editor preview|Unable to display this page/,
  {timeout:20000});
 await expect(page.locator('#app .editor')).toHaveCount(0);
 expect(logs.sources).toBe(0);
 expect(logs.writes).toEqual([]);
 expect(errors).toEqual([]);
});
test('WP1-EDITOR-B02 owner can inspect Gear and KB Notes forms without publishing',async({page})=>{
 session={authenticated:true,authorized:true,ownerLogin:'ginosega'};
 const errors=await open(page);
 await ownerReady(page);
 const gear=real.gear.items.find(x=>x.notes)||real.gear.items[0];
 const kb=real.kb.entities.find(x=>x.content)||real.kb.entities[0];
 // Explicitly accept leaving an unsaved form; Playwright otherwise
 // dismisses the app's protective confirmation and blocks navigation.
 const confirmations=[];
 page.on('dialog',async dialog=>{
  confirmations.push(dialog.message());
  await dialog.accept();
 });
 async function check(domain,id,title){
  const hash=domain==='gear'?'#/inventory/edit/'+id:'#/kb/edit/'+id;
  await page.evaluate(h=>location.hash=h,hash);
  await expect(page.locator('#app .page-header h1')).toHaveText('Edit '+title,
   {timeout:35000});
  await expect(page.locator('#app .notes-editor')).toBeVisible();
  // D5 Notes image and link insertion remains locally inspectable,
  // but no GitHub original bytes or ticket may be staged.
  await expect(page.getByRole('button',{name:'Insert Image'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Preview',exact:true})).toBeVisible();
  const blocked=page.getByRole('button',{
   name:'Save and Publish unavailable in WP1 preview',
  });
  await expect(blocked).toBeDisabled();
  await expect(page.locator('#app')).toContainText(
   'Editor preview only. Save and Publish is disabled');
 }
 await check('gear',gear.id,gear.name);
 await check('kb',kb.id,kb.name);
 expect(confirmations.every(message=>
  message==='Your changes have not been saved. Discard this edit and leave?'
 )).toBe(true);
 expect(logs.sources).toBeGreaterThanOrEqual(2);
 expect(logs.writes).toEqual([]);
 expect(errors).toEqual([]);
});
test('WP1-EDITOR-B03 verified owner Catch Add/Edit has no submit route',async({page})=>{
 session={authenticated:true,authorized:true,ownerLogin:'ginosega'};
 const errors=await open(page);
 await ownerReady(page);
 const first=real.catches.catches[0];
 const confirmations=[];
 page.on('dialog',async dialog=>{
  confirmations.push(dialog.message());
  await dialog.accept();
 });
 for(const hash of ['#/catches/add','#/catches/edit/'+first.id]){
  await page.evaluate(v=>location.hash=v,hash);
  await expect(page.locator('#app .page-header h1')).toHaveText(
   hash==='#/catches/add'?'Add Catch':'Edit Catch',{timeout:35000});
  await expect(page.locator('#app .notes-editor')).toBeVisible();
  await expect(page.getByRole('button',{
   name:'Save and Publish unavailable in WP1 preview',
  })).toBeDisabled();
 }
 // The Add form's generated ID makes it dirty. Verify intentional
 // discard confirmation is honored rather than bypassing unsaved edits.
 expect(confirmations).toContain(
  'Your changes have not been saved. Discard this edit and leave?');
 expect(logs.writes).toEqual([]);
 expect(errors).toEqual([]);
});
test('WP1-EDITOR-B04 owner signout and Work Offline block new editor routes',async({page})=>{
 session={authenticated:true,authorized:true,ownerLogin:'ginosega'};
 const errors=await open(page);
 await ownerReady(page);
 const gear=real.gear.items[0];
 await page.locator('#connection-status').click();
 const dlg=page.locator('#connection-dialog');
 await dlg.getByRole('button',{name:'Sign out'}).click();
 await expect(dlg.locator('.v3-account-body')).toContainText('Not signed in',
  {timeout:20000});
 await dlg.getByRole('button',{name:'Close'}).click();
 await page.evaluate(h=>location.hash=h,'#/inventory/edit/'+gear.id);
 await expect(page.locator('#app .editor')).toHaveCount(0);
 expect(logs.writes).toEqual([]);
 expect(errors).toEqual([]);
});
