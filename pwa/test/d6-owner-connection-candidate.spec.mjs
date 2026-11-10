import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * Isolated, local-only browser acceptance for the opt-in D6 owner Connection
 * Status build. Never contacts a deployed Worker, GitHub, OAuth provider or
 * production D1. The server emulates safe session READ/SIGNOUT only; there
 * is no canonical writer, media endpoint, real cookie or live credentials.
 *
 * Normal V2 and production browser suites skip this fixture. CI runs it
 * separately after verifying the candidate release and manifest.
 */
const cwd=path.dirname(fileURLToPath(import.meta.url));
const distSetting=process.env.FISHING_D6_OWNER_CONNECTION_DIST;
const root=distSetting?path.resolve(cwd,'..',distSetting):null;
const prefix='/fishing/';
const mime={
 '.html':'text/html; charset=utf-8','.js':'text/javascript',
 '.css':'text/css','.json':'application/json',
 '.webmanifest':'application/manifest+json','.png':'image/png',
 '.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp',
 '.gif':'image/gif',
};
let server,base,session,logs;
test.skip(!distSetting,'D6 owner Connection Status needs a separate isolated candidate release');

const error=(res,status)=>{res.writeHead(status,{
 'Content-Type':'text/plain','Cache-Control':'no-store',
});res.end('Denied');};
async function serve(req,res){
 const u=new URL(req.url,'http://127.0.0.1');
 if(u.pathname==='/session'&&req.method==='GET'){
  logs.sessions++;
  res.writeHead(200,{'Content-Type':'application/json; charset=utf-8',
   'Cache-Control':'private, no-store'});
  res.end(JSON.stringify(session));return;
 }
 if(u.pathname==='/session/signout'&&req.method==='POST'){
  logs.signouts.push({
   origin:req.headers.origin,
   site:req.headers['sec-fetch-site'],
   intent:req.headers['x-fish-p0-intent'],
  });
  const expected=new URL(base).origin;
  if(req.headers.origin!==expected||
     req.headers['sec-fetch-site']!=='same-origin'||
     req.headers['x-fish-p0-intent']!=='signout')
   return error(res,403);
  session={authenticated:false,authorized:false};
  res.writeHead(200,{'Content-Type':'application/json; charset=utf-8',
   'Cache-Control':'private, no-store'});
  res.end(JSON.stringify({signedOut:true}));return;
 }
 if(u.pathname==='/api/v3/authoring-source'){
  logs.sources++;
  return error(res,503);
 }
 if(u.pathname==='/auth/start'){
  logs.oauth++;
  return error(res,503);
 }
 if(!['GET','HEAD'].includes(req.method)){
  logs.writes.push(req.method+' '+u.pathname);
  return error(res,404);
 }
 if(!u.pathname.startsWith(prefix))return error(res,404);
 let relative;
 try{relative=decodeURIComponent(u.pathname.slice(prefix.length))||'index.html';}
 catch{return error(res,404);}
 if(relative.startsWith('/')||relative.includes('\\')||
    relative.split('/').some(p=>p===''||p==='.'||p==='..'))
  return error(res,404);
 const abs=path.resolve(root,relative);
 if(!abs.startsWith(root+path.sep))return error(res,404);
 try{
  const bytes=await fs.readFile(abs);
  res.writeHead(200,{
   'Content-Type':mime[path.extname(abs)]||'application/octet-stream',
   'Cache-Control':'no-store',
   'Content-Length':bytes.length,
  });
  res.end(req.method==='HEAD'?undefined:bytes);
 }catch{return error(res,404);}
}
test.beforeAll(async()=>{
 const release=JSON.parse(await fs.readFile(path.join(root,'release.json'),'utf8'));
 const manifest=JSON.parse(await fs.readFile(path.join(root,release.manifest),'utf8'));
 expect(release.d6ReaderCandidate).toBe(true);
 expect(release.d6OwnerConnectionCandidate).toBe(true);
 expect(release.d6StaticStaging).not.toBe(true);
 expect(manifest.d6ReaderCandidate).toBe(true);
 expect(manifest.d6OwnerConnectionCandidate).toBe(true);
 expect(manifest.d6StaticStaging).not.toBe(true);
 expect(manifest.base).toBe(prefix);
 expect(release.sourceRevision).toMatch(/^[a-f0-9]{40}$/);
 server=createServer((req,res)=>{void serve(req,res).catch(()=>error(res,503));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port+prefix;
});
test.afterAll(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
});
test.beforeEach(()=>{
 session={authenticated:false,authorized:false};
 logs={sessions:0,signouts:[],oauth:0,sources:0,writes:[]};
});
async function open(page){
 const errors=[];page.on('pageerror',e=>errors.push(String(e.message)));
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await expect(page.locator('#app h1').first()).toHaveText('Fishing Companion',
  {timeout:45000});
 await expect(page.locator('#connection-status')).toBeVisible();
 return errors;
}
test('D6-OWNER-BROWSER01 accepted V3 sections display signed-out read-only',async({page})=>{
 const errors=await open(page);
 await page.locator('#connection-status').click();
 const dialog=page.locator('#connection-dialog');
 await expect(dialog).toBeVisible();
 await expect(dialog).toHaveClass(/v3-connection-dialog/);
 await expect(dialog).toHaveCSS('color-scheme','dark');
 await expect(dialog.locator('.v3-network-section')).toContainText('Connection status');
 await expect(dialog.locator('.offline-mode-select')).toContainText('Mode');
 await expect(dialog).toContainText('Offline Library');
 await expect(dialog.locator('.v3-account-body')).toContainText('Not signed in',
  {timeout:30000});
 await expect(dialog.locator('.v3-account-body a')).toHaveAttribute('href','/auth/start');
 await expect(dialog.locator('.v3-publishing-toggle')).toContainText('Publishing Status');
 await expect(dialog.locator('.v3-publication-body')).toContainText(
  'Sign in to view publishing status.');
 await expect(dialog.getByRole('button',{name:'Sign out'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Save & Publish'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Add Catch'})).toHaveCount(0);
 expect(logs.signouts).toHaveLength(0);
 expect(logs.sources).toBe(0);
 expect(logs.writes).toHaveLength(0);
 expect(errors).toEqual([]);
});
test('D6-OWNER-BROWSER02 approved owner view and signout stay read-only',async({page})=>{
 session={authenticated:true,authorized:true,ownerLogin:'ginosega'};
 const errors=await open(page);
 await page.locator('#connection-status').click();
 const dialog=page.locator('#connection-dialog');
 await expect(dialog.locator('.v3-account-body')).toContainText('Signed in as ginosega',
  {timeout:30000});
 const publish=dialog.locator('.v3-publishing');
 await expect(publish).toContainText('No recent publication available.');
 await expect(page.getByRole('button',{name:'Save & Publish'})).toHaveCount(0);
 await dialog.getByRole('button',{name:'Sign out'}).click();
 await expect(dialog.locator('.v3-account-body')).toContainText('Not signed in',
  {timeout:20000});
 await expect(dialog.locator('.v3-account-body a')).toHaveAttribute('href','/auth/start');
 expect(logs.signouts).toHaveLength(1);
 expect(logs.signouts[0].intent).toBe('signout');
 expect(logs.signouts[0].site).toBe('same-origin');
 expect(logs.signouts[0].origin).toBe(new URL(base).origin);
 expect(logs.sources).toBe(0);
 expect(logs.writes).toHaveLength(0);
 expect(errors).toEqual([]);
});
