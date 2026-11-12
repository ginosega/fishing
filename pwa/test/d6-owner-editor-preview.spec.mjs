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

test('WP1-EDITOR-B05 owner local text draft survives reload without publishing',async({page})=>{
 session={authenticated:true,authorized:true,ownerLogin:'ginosega'};
 const errors=await open(page);
 await ownerReady(page);
 const gear=real.gear.items.find(x=>x.name)||real.gear.items[0];
 const route='#/inventory/edit/'+gear.id;
 await page.evaluate(hash=>{location.hash=hash;},route);
 const name=page.getByRole('textbox',{name:'Name',exact:true});
 await expect(name).toHaveValue(gear.name,{timeout:25000});
 const changedName=gear.name+' (unpublished WP1 draft)';
 await name.fill(changedName);
 await expect(page.locator('#app .editor-notice[aria-live="polite"]')).toContainText(
  'Draft saved on this device. Nothing has been published.',{timeout:25000});
 const dialogs=[];
 page.on('dialog',async dlg=>{
  dialogs.push({type:dlg.type(),message:dlg.message()});
  await dlg.accept();
 });
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('#app .page-header h1')).toHaveText(
  'Edit '+gear.name,{timeout:35000});
 await expect(page.getByRole('textbox',{name:'Name',exact:true}))
  .toHaveValue(changedName);
 expect(dialogs.some(d=>d.type==='confirm'&&
  d.message.includes('An unsent draft is saved on this device'))).toBe(true);
 await expect(page.getByRole('button',{
  name:'Save and Publish unavailable in WP1 preview',
 })).toBeDisabled();
 expect(logs.writes).toEqual([]);
 expect(errors).toEqual([]);
});


test('WP1-EDITOR-B06 disconnection retains unsent draft, denies fresh editor and no writes',async({page,context})=>{
 session={authenticated:true,authorized:true,ownerLogin:'ginosega'};
 const errors=await open(page);
 await ownerReady(page);
 const gear=real.gear.items[0],kb=real.kb.entities[0];
 await page.evaluate(h=>location.hash=h,'#/inventory/edit/'+gear.id);
 const name=page.getByRole('textbox',{name:'Name',exact:true});
 await expect(name).toHaveValue(gear.name,{timeout:30000});
 const changedName=gear.name+' (offline unsent WP1 draft)';
 await name.fill(changedName);
 await expect(page.locator('#app .editor-notice[aria-live="polite"]'))
  .toContainText('Draft saved on this device. Nothing has been published.',
   {timeout:25000});
 const sourcesBefore=logs.sources;
 await context.setOffline(true);
 await expect(name).toHaveValue(changedName);
 await expect(page.getByRole('button',{
  name:'Save and Publish unavailable in WP1 preview',
 })).toBeDisabled();
 const dialogs=[];
 page.on('dialog',async dialog=>{
  dialogs.push(dialog.message());
  await dialog.accept();
 });
 await page.evaluate(h=>location.hash=h,'#/kb/edit/'+kb.id);
 await expect(page.locator('#app')).toContainText(
  'Owner editor preview is unavailable',{timeout:25000});
 expect(dialogs).toContain(
  'Your changes have not been saved. Discard this edit and leave?');
 expect(logs.sources).toBe(sourcesBefore);
 expect(logs.writes).toEqual([]);
 expect(errors).toEqual([]);
 await context.setOffline(false);
});

test('WP1-EDITOR-B07 Notes page picker and manual Catch links preview as real routes',async({page})=>{
 session={authenticated:true,authorized:true,ownerLogin:'ginosega'};
 const errors=await open(page);
 await ownerReady(page);
 const gear=real.gear.items.find(x=>x.notes)||real.gear.items[0];
 const catchRecord=real.catches.catches[0];
 await page.evaluate(h=>location.hash=h,'#/inventory/edit/'+gear.id);
 const notes=page.locator('#app .notes-editor .markdown-editor');
 await expect(notes).toBeVisible({timeout:30000});
 await notes.fill('[Existing Catch](catches://'+catchRecord.id+')');
 await page.getByRole('button',{name:'Insert Link'}).click();
 const picker=page.locator('#app .notes-link-panel');
 await expect(picker).toBeVisible();
 // Individual Catches are deliberately excluded from the chooser.
 await expect(picker.locator('option[value^="catches://"]')).toHaveCount(0);
 await picker.locator('select[aria-label="Link to page"]')
  .selectOption('site://home');
 await picker.getByRole('button',{name:'Insert',exact:true}).click();
 await expect(notes).toHaveValue(/site:\/\/home/);
 await page.getByRole('button',{name:'Preview',exact:true}).click();
 const preview=page.locator('#app .notes-editor .markdown-preview');
 await expect(preview).toBeVisible();
 await expect(preview.getByRole('link',{name:'Home'})).toHaveAttribute('href','#/');
 await expect(preview.getByRole('link',{name:'Existing Catch'}))
  .toHaveAttribute('href','#/catches/'+catchRecord.id);
 await expect(page.getByRole('button',{name:'Insert Link'})).toBeDisabled();
 await expect(page.getByRole('button',{name:'Insert Image'})).toBeDisabled();
 await expect(page.getByRole('button',{
  name:'Save and Publish unavailable in WP1 preview',
 })).toBeDisabled();
 expect(logs.writes).toEqual([]);
 expect(errors).toEqual([]);
});

test('WP1-EDITOR-B08 unknown internal Notes targets fail closed',async({page})=>{
 session={authenticated:true,authorized:true,ownerLogin:'ginosega'};
 const errors=await open(page);
 await ownerReady(page);
 const gear=real.gear.items[0];
 await page.evaluate(h=>location.hash=h,'#/inventory/edit/'+gear.id);
 const notes=page.locator('#app .notes-editor .markdown-editor');
 await expect(notes).toBeVisible({timeout:30000});
 for(const invalid of ['site://unapproved','catches://wp1-no-such-catch-000']){
  await notes.fill('[Missing]('+invalid+')');
  await page.getByRole('button',{name:'Preview',exact:true}).click();
  await expect(page.locator('#app .notes-editor-message'))
   .toContainText('Unknown internal reference: '+invalid);
  await expect(notes).toBeVisible();
 }
 expect(logs.writes).toEqual([]);
 expect(errors).toEqual([]);
});

// WP1 VIEW-01/02/03 integrated regression: exercise the production-shaped
// reader against a real canonical record/original, with a browser-only Notes
// fixture. No repository files, media bytes or provider routes are changed.
test('WP1-VIEWER-B09 opt-in Notes viewer loads original and missing art fails safely',async({page})=>{
 const errors=await open(page);
 const known=new Set(manifest.files.map(x=>x.path));
 const gear=real.gear.items.find(item=>item.notes&&item.picture?.src&&
  known.has('releases/'+release.id+'/content/'+item.notes)&&
  known.has('releases/'+release.id+'/content/'+item.picture.src));
 expect(gear,'A real Gear Notes record with its original picture is required')
  .toBeDefined();
 const notes=await fs.readFile(path.join(root,'releases',release.id,
  'content',gear.notes),'utf8');
 const toMarkdownPath=target=>path.posix.relative(
  path.posix.dirname(gear.notes),target).split('/').map(segment=>
   segment==='..'?'..':encodeURIComponent(segment).replace(/[()]/g,ch=>
    '%'+ch.charCodeAt(0).toString(16).toUpperCase())).join('/');
 const original=toMarkdownPath(gear.picture.src);
 const missing=toMarkdownPath(path.posix.join(
  path.posix.dirname(gear.picture.src),'wp1-unavailable-image.png'));
 const body=notes+'\n\n![WP1 original image]('+original+
  ' "viewer: WP1 original caption")\n\n'+
  '![WP1 missing image]('+missing+' "viewer")\n';
 const wanted='releases/'+release.id+'/content/'+gear.notes;
 // Override only the page's Markdown fetch for this test. Mutating served
 // release bytes makes the service worker correctly fail asset verification.
 // This exercises the real renderer against canonical originals without
 // weakening immutable release validation or changing source content.
 await page.evaluate(({wanted,body})=>{
  const originalFetch=window.fetch.bind(window);
  let fixtureHits=0;
  window.__wp1ViewerFixtureHits=()=>fixtureHits;
  window.fetch=(input,init)=>{
   const target=input instanceof Request?input.url:String(input);
   let url;
   try{url=new URL(target,document.baseURI);}catch{return originalFetch(input,init);}
   if(decodeURIComponent(url.pathname).endsWith('/'+wanted)){
    fixtureHits++;
    return Promise.resolve(new Response(body,{status:200,
     headers:{'Content-Type':'text/markdown; charset=utf-8'}}));
   }
   return originalFetch(input,init);
  };
 },{wanted,body});
 await page.evaluate(h=>location.hash=h,'#/inventory/item/'+gear.id);
 await expect(page.locator('#app .page-header h1')).toHaveText(gear.name,
  {timeout:30000});
 expect(await page.evaluate(()=>window.__wp1ViewerFixtureHits())).toBe(1);
 const trigger=page.getByRole('button',{name:'Enlarge WP1 original image'});
 await expect(trigger).toBeVisible({timeout:30000});
 const image=trigger.locator('img');
 await expect.poll(()=>image.evaluate(img=>img.naturalWidth),
  {timeout:30000}).toBeGreaterThan(0);
 const source=await image.getAttribute('src');
 expect(decodeURIComponent(new URL(source,base).pathname))
  .toContain('/content/'+gear.picture.src);
 expect(source).not.toContain('/card-thumbnails/');
 await expect(page.locator('.markdown-image-unavailable'))
  .toContainText('Picture unavailable: WP1 missing image');
 await expect(page.getByRole('button',{name:'Enlarge WP1 missing image'}))
  .toHaveCount(0);
 await trigger.click();
 const viewer=page.getByRole('dialog',{name:'Image viewer'});
 await expect(viewer).toBeVisible();
 await expect(viewer.locator('.viewer-caption')).toHaveText('WP1 original caption');
 await expect(viewer.locator('.image-stage img')).toHaveAttribute('src',source);
 await viewer.getByRole('button',{name:'Zoom in'}).click();
 await expect(viewer.locator('.zoom-label')).not.toHaveText('100%');
 await viewer.getByRole('button',{name:'Close'}).click();
 await expect(viewer).toHaveCount(0);
 await expect(trigger).toBeFocused();
 expect(logs.writes).toEqual([]);
 expect(errors).toEqual([]);
});

// WP1 media picker integrated acceptance: real canonical original bytes are
// selected only in the browser and must never trigger an upload or publish.
test('WP1-MEDIA-B10 Notes original picker previews alt and viewer locally without writes',async({page})=>{
 session={authenticated:true,authorized:true,ownerLogin:'ginosega'};
 const errors=await open(page);
 await ownerReady(page);
 const contentPrefix='releases/'+release.id+'/content/';
 const known=new Set(manifest.files.map(x=>x.path));
 // JPEG is decodable with the ImageBitmap fallback in WebKit. Animated
 // WebP/GIF need ImageDecoder support and correctly fail closed otherwise.
 const gear=real.gear.items.find(row=>row.notes&&row.picture?.src?.endsWith('.jpg')&&
  known.has(contentPrefix+row.notes)&&known.has(contentPrefix+row.picture.src));
 expect(gear,'A real Gear record with Notes and an original JPEG is required')
  .toBeDefined();
 const original=await fs.readFile(path.join(root,contentPrefix,gear.picture.src));
 await page.evaluate(hash=>location.hash=hash,'#/inventory/edit/'+gear.id);
 const notes=page.locator('#app .notes-editor .markdown-editor');
 await expect(notes).toBeVisible({timeout:30000});
 await page.getByRole('button',{name:'Insert Image'}).click();
 const panel=page.locator('#app .notes-image-panel');
 await expect(panel).toBeVisible();
 await panel.locator('input[type="file"]').setInputFiles({
  name:'wp1-inline-original.jpg',mimeType:'image/jpeg',buffer:original,
 });
 await expect(panel.locator('.notes-image-thumb img')).toBeVisible();
 await expect(panel.locator('.notes-image-thumb')).toContainText(/\d+ × \d+/);
 const alt=panel.locator('input[type="text"]').first();
 await alt.fill('');
 const insert=panel.getByRole('button',{name:'Insert',exact:true});
 await insert.click();
 await expect(panel).toContainText('Image alternative text is required.');
 await expect(notes).not.toHaveValue(/wp1-inline-original/);
 await alt.fill('WP1 selected original');
 await panel.locator('input[type="checkbox"]').check();
 const caption=panel.locator('input[type="text"]').nth(1);
 await expect(caption).toBeVisible();
 await caption.fill('WP1 image caption');
 await insert.click();
 await expect(panel).toBeHidden();
 await expect(notes).toHaveValue(/!\[WP1 selected original\]\(\.\.\/assets\/.*wp1-inline-original\.jpg "viewer: WP1 image caption"\)/);
 await page.getByRole('button',{name:'Preview',exact:true}).click();
 const preview=page.locator('#app .notes-editor .markdown-preview');
 await expect(preview).toBeVisible();
 const image=preview.getByRole('img',{name:'WP1 selected original'});
 await expect(image).toBeVisible();
 await expect.poll(()=>image.evaluate(img=>img.naturalWidth),
  {timeout:30000}).toBeGreaterThan(0);
 expect(await image.getAttribute('src')).toMatch(/^blob:/);
 await expect(page.getByRole('button',{name:'Insert Image'})).toBeDisabled();
 await expect(page.getByRole('button',{name:'Insert Link'})).toBeDisabled();
 await expect(page.getByRole('button',{
  name:'Save and Publish unavailable in WP1 preview',
 })).toBeDisabled();
 expect(logs.writes).toEqual([]);
 expect(errors).toEqual([]);
});

for(const sample of [
 {name:'desktop',width:1280,height:900},
 {name:'mobile',width:390,height:844},
]){
 test('WP1-CARD-M01 Gear-card above-fold decode measurement '+sample.name,
 async({page,browserName})=>{
  await page.setViewportSize({width:sample.width,height:sample.height});
  // Fixed network budget for Chromium; WebKit has no CDP throttling,
  // so its values are recorded separately, not compared as equivalents.
  if(browserName==='chromium'){
   const cdp=await page.context().newCDPSession(page);
   await cdp.send('Network.enable');
   await cdp.send('Network.emulateNetworkConditions',{
    offline:false,latency:80,
    downloadThroughput:1024*1024,uploadThroughput:1024*1024,
   });
  }
  await page.goto(base+'#/inventory/category/lures',
   {waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.locator(
   '#app .record-grid img.card-thumbnail').count(),{timeout:30000}
  ).toBeGreaterThan(0);
  const actual=await page.evaluate(async()=>{
   const all=[...document.querySelectorAll(
    '#app .record-grid img.card-thumbnail')];
   const above=all.filter(img=>{
    const r=img.getBoundingClientRect();
    return r.top<innerHeight&&r.bottom>0&&r.left<innerWidth&&r.right>0;
   });
   await Promise.all(above.map(img=>img.decode()));
   await new Promise(resolve=>requestAnimationFrame(()=>
    requestAnimationFrame(resolve)));
   return {decodedMs:Math.round(performance.now()),
    visible:above.length,allCards:all.length,
    images:above.map(img=>({
     url:img.currentSrc,loaded:img.complete&&img.naturalWidth>0,
    }))};
  });
  expect(actual.visible).toBeGreaterThan(0);
  expect(actual.images.every(x=>x.loaded)).toBe(true);
  const fileSizes=new Map(manifest.files.map(f=>[f.path,f.bytes]));
  let visibleBytes=0;
  for(const img of actual.images){
   const file=decodeURIComponent(new URL(img.url).pathname.slice(
    prefix.length));
   expect(file).toContain('/card-thumbnails/');
   const n=fileSizes.get(file);
   expect(n).toBeGreaterThan(0);
   visibleBytes+=n;
  }
  // WP1 approved quantitative CI regression gate. Two independent
  // baseline runs showed 455-720ms on the same actual 42-card page.
  // This is a deterministic developer test threshold, NOT an Android/Edge
  // field p95 or a guarantee about real-world mobile data connections.
  const maxDecodedMs=2000;
  const maxVisibleThumbnailBytes=sample.name==='desktop'?
   96*1024:64*1024;
  console.log('WP1_CARD_BASELINE '+JSON.stringify({
   engine:browserName,viewport:sample.name,
   decodedMs:actual.decodedMs,aboveFoldImages:actual.visible,
   cardCount:actual.allCards,visibleThumbnailBytes:visibleBytes,
   maxDecodedMs,maxVisibleThumbnailBytes,
   networkProfile:browserName==='chromium'?
    '80ms RTT, 1MiB/s download/upload':'local, unthrottled',
  }));
  expect(actual.decodedMs,
   'Above-fold Gear thumbnails must decode within 2 seconds on CI').toBeLessThanOrEqual(maxDecodedMs);
  expect(visibleBytes,
   'Above-fold Gear thumbnails must stay within approved card byte budget').toBeLessThanOrEqual(maxVisibleThumbnailBytes);
  expect(logs.writes).toEqual([]);
 });
}
