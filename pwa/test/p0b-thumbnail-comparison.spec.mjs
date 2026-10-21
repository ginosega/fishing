import {test,expect} from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import {createServer} from 'node:http';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const buildScript=path.join(repo,'pwa/tools/build.mjs');
const verifyScript=path.join(repo,'pwa/tools/verify.mjs');
const paths={baseline:'/fishing/p0b-baseline/',candidate:'/fishing/p0b-candidate/'};
const rootFor={};
let temp,server,host;
const run=(script,args)=>{
 const out=spawnSync(process.execPath,[script,...args],{cwd:repo,encoding:'utf8',maxBuffer:4*1024*1024});
 if(out.status!==0)throw new Error(out.stdout+'\n'+out.stderr);
};
const readJson=async p=>JSON.parse(await fs.readFile(p,'utf8'));

test.beforeAll(async()=>{
 test.setTimeout(300000);
 temp=await fs.mkdtemp(path.join(os.tmpdir(),'fishing-p0b-comparison-'));
 for(const kind of ['baseline','candidate']){
  const out=rootFor[kind]=path.join(temp,kind);
  const args=['--base='+paths[kind],'--out='+out,'--source-revision=p0b-comparison-source'];
  if(kind==='baseline')args.push('--without-card-thumbnails');
  run(buildScript,args);
  run(verifyScript,['--out='+out]);
 }
 server=createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost');
   const kind=Object.keys(paths).find(k=>url.pathname.startsWith(paths[k]));
   if(!kind){res.writeHead(404).end();return;}
   const relative=decodeURIComponent(url.pathname.slice(paths[kind].length))||'index.html';
   if(relative.includes('\\')||relative.split('/').includes('..')){res.writeHead(400).end();return;}
   const file=path.resolve(rootFor[kind],relative);
   if(!file.startsWith(rootFor[kind]+path.sep)){res.writeHead(400).end();return;}
   const body=await fs.readFile(file);
   const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml'};
   res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-store'});res.end(body);
  }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 host='http://127.0.0.1:'+server.address().port;
});
test.afterAll(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 if(temp)await fs.rm(temp,{recursive:true,force:true});
});
async function measure(browser,kind,sample,testInfo){
 const ctx=await browser.newContext({viewport:{width:sample.width,height:sample.height},serviceWorkers:'allow'});
 try{
  const page=await ctx.newPage();
  // Same controlled network budget for both variants on Chromium.
  // Playwright WebKit has no CDP; measure it without network throttling.
  const chromium=browser.browserType().name()==='chromium';
  if(chromium){
   const session=await ctx.newCDPSession(page);
   await session.send('Network.enable');
   await session.send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:1024*1024,uploadThroughput:1024*1024});
  }
  const url=host+paths[kind]+sample.hash;
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>window.__FISHING_V2__?.releaseId),{timeout:120000}).toMatch(/^[0-9a-f]{32}$/);
  await expect.poll(()=>page.locator('.record-grid img.card-thumbnail').count(),{timeout:30000}).toBeGreaterThan(0);
  const result=await page.evaluate(async()=>{
   const images=[...document.querySelectorAll('.record-grid img.card-thumbnail')];
   const above=images.filter(img=>{const b=img.getBoundingClientRect();return b.top<innerHeight&&b.bottom>0&&b.left<innerWidth&&b.right>0;});
   await Promise.all(above.map(img=>img.decode()));
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   return {elapsedMs:Math.round(performance.now()),count:images.length,above:above.map(img=>({src:img.src,loaded:img.complete&&img.naturalWidth>0,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight}))};
  });
  expect(result.above.length).toBeGreaterThan(0);
  expect(result.above.every(x=>x.loaded)).toBeTruthy();
  const ptr=await readJson(path.join(rootFor[kind],'release.json'));
  const manifest=await readJson(path.join(rootFor[kind],ptr.manifest));
  const sizes=new Map(manifest.files.map(e=>[e.path,e.bytes]));
  const info=result.above.map(x=>({
   name:decodeURIComponent(new URL(x.src).pathname.split('/').at(-1)),
   bytes:sizes.get(decodeURIComponent(new URL(x.src).pathname.slice(paths[kind].length)))||0,
   generated:x.src.includes('/card-thumbnails/')
  }));
  expect(info.every(x=>x.bytes>0)).toBeTruthy();
  expect(info.every(x=>x.generated===(kind==='candidate'))).toBeTruthy();
  const bytes=info.reduce((total,x)=>total+x.bytes,0);
  const screenshot=await page.screenshot({type:'png'});
  await testInfo.attach('p0b-'+sample.name+'-'+kind+'-'+browser.browserType().name(),{body:screenshot,contentType:'image/png'});
  if(kind==='candidate'){
   await page.goto(host+paths[kind]+'#/inventory/item/daiwa-tatula-xt-rod',{waitUntil:'domcontentloaded'});
   await expect(page.locator('.picture img')).toBeVisible();
   expect(await page.locator('.picture img').first().getAttribute('src')).toContain('/content/Gear/');
  }
  return {kind,viewport:sample.width+'x'+sample.height,aboveCount:info.length,totalCards:result.count,originalOrDerivativeBytes:bytes,elapsedMs:result.elapsedMs,screenshot};
 }finally{await ctx.close();}
}
for(const sample of [
 {name:'gear-lures',label:'Gear — Lures',hash:'#/inventory/category/lures',width:1280,height:900},
 {name:'kb-technique',label:'Knowledge Base — Techniques',hash:'#/kb/category/technique',width:390,height:844}
]){
 test('P0-B baseline vs prototype: '+sample.name,async({browser},testInfo)=>{
  test.setTimeout(240000);
  const before=await measure(browser,'baseline',sample,testInfo);
  const after=await measure(browser,'candidate',sample,testInfo);
  const {screenshot:baselineImage,...baseline}=before;
  const {screenshot:candidateImage,...candidate}=after;
  expect(baseline.aboveCount).toBe(candidate.aboveCount);
  expect(candidate.originalOrDerivativeBytes).toBeLessThan(baseline.originalOrDerivativeBytes*0.25);

  // A standalone, self-contained visual comparison suitable for downloaded
  // GitHub Actions artifacts: real Playwright screenshots of BOTH builds.
  // No fabricated images, server, network or build tools are needed to view it.
  const reduction=Math.round(10000*(1-candidate.originalOrDerivativeBytes/baseline.originalOrDerivativeBytes))/100;
  const engine=browser.browserType().name();
  const heading=sample.label+' / '+sample.width+'×'+sample.height+' / '+engine;
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>P0-B Visual Review — ${heading}</title>
<style>
:root{color-scheme:light;}*{box-sizing:border-box}
body{margin:0;background:#f1f4f3;color:#172b26;font:16px/1.5 system-ui,Arial,sans-serif}
header{padding:20px clamp(16px,4vw,40px);background:#154e42;color:white}
h1{font-size:clamp(20px,2.3vw,30px);margin:0 0 8px}
header p{margin:0;max-width:75ch}
main{max-width:2700px;margin:auto;padding:18px clamp(12px,3vw,30px)}
.stats{display:flex;gap:18px;flex-wrap:wrap;padding:12px 0 20px}
.stats span{padding:7px 10px;background:white;border-radius:8px}
.compare{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
figure{min-width:0;margin:0;background:white;border:1px solid #d6e0db;border-radius:9px;overflow:hidden}
figcaption{font-weight:650;padding:12px 16px}
img{display:block;width:100%;height:auto;border-top:1px solid #d6e0db}
.note{max-width:90ch;margin:22px 0;color:#35443f}
@media(max-width:760px){.compare{grid-template-columns:1fr}}
</style></head><body><header><h1>Fishing Companion — ${heading}</h1>
<p>Side-by-side screenshots of the real original-image card grid and manifest-backed WebP card thumbnails. Review clarity, artwork detail, and layout; no canonical images were changed.</p>
</header><main>
<div class="stats"><span>Original: ${(baseline.originalOrDerivativeBytes/1024).toFixed(0)} KiB visible image sources</span>
<span>Prototype: ${(candidate.originalOrDerivativeBytes/1024).toFixed(0)} KiB</span><span>${reduction}% fewer image bytes</span>
<span>CI completion: ${baseline.elapsedMs} ms → ${candidate.elapsedMs} ms</span></div>
<section class="compare" aria-label="Original and thumbnail screens">
<figure><figcaption>Original images — v2 baseline</figcaption><img alt="Original image card grid" src="data:image/png;base64,${baselineImage.toString('base64')}"></figure>
<figure><figcaption>Generated WebP thumbnails — candidate</figcaption><img alt="Thumbnail image card grid" src="data:image/png;base64,${candidateImage.toString('base64')}"></figure>
</section>
<p class="note">These are unmodified browser screenshots recorded after above-fold images decoded. Chromium uses a simulated network profile; WebKit is local/unthrottled. Neither is an Android device performance test. Expand your browser window to see more image detail; images are presented at screenshot-native resolution when each column is wide enough.</p>
</main></body></html>`;
  await testInfo.attach('P0B-OPEN-THIS-visual-review-'+sample.name+'-'+engine,{body:Buffer.from(html),contentType:'text/html'});
  const labels=Buffer.from(`<svg width="${2*sample.width}" height="48" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#154e42"/><text x="14" y="32" font-size="19" fill="white" font-family="sans-serif">ORIGINAL IMAGES</text><text x="${sample.width+14}" y="32" font-size="19" fill="white" font-family="sans-serif">GENERATED THUMBNAILS</text></svg>`);
  const combined=await sharp({create:{width:2*sample.width,height:sample.height+48,channels:4,background:'#ffffff'}})
   .composite([{input:labels,left:0,top:0},{input:baselineImage,left:0,top:48},{input:candidateImage,left:sample.width,top:48}]).png().toBuffer();
  await testInfo.attach('P0B-SIDE-BY-SIDE-'+sample.name+'-'+engine,{body:combined,contentType:'image/png'});

  console.log('P0B_BROWSER_COMPARISON '+JSON.stringify({engine,sample:sample.name,baseline,candidate,byteReductionPct:reduction,speedupRatio:Math.round(100*baseline.elapsedMs/candidate.elapsedMs)/100,networkProfile:engine==='chromium'?'CDP latency 80ms throughput 1MiB/s':'local no throttle',interpretation:'CI simulation; not user Android device'}));
 });
}
