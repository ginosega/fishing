#!/usr/bin/env python3
"""Read-only Fishing source snapshot and migration inventory. Python stdlib only.
The output directory is disposable. No source files are modified.
"""
import collections, hashlib, json, os, pathlib, re, struct, subprocess, zipfile
from urllib.parse import unquote, urlsplit
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'audit-output'
OUT.mkdir(exist_ok=True)
def git(*args): return subprocess.check_output(['git',*args],cwd=ROOT).decode().strip()
def read(p): return (ROOT/p).read_bytes()
def obj(p): return json.loads(read(p))
def digest(b): return hashlib.sha256(b).hexdigest()
def blob(b): return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def image_info(b):
    if b.startswith(b'\x89PNG\r\n\x1a\n') and len(b)>=24: return 'png',*struct.unpack('>II',b[16:24])
    if b[:3] in (b'GIF',) and len(b)>=10: return 'gif',*struct.unpack('<HH',b[6:10])
    if b[:2]==b'\xff\xd8':
        i=2
        while i<len(b)-3:
            if b[i]!=255: i+=1; continue
            while i<len(b) and b[i]==255: i+=1
            if i>=len(b): break
            mark=b[i];i+=1
            if mark in (0xd9,0xda): break
            if mark in (0x01,) or 0xd0<=mark<=0xd7: continue
            if i+2>len(b):break
            size=int.from_bytes(b[i:i+2],'big')
            if size<2 or i+size>len(b):break
            if mark in (0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf) and size>=7:
                return 'jpeg',int.from_bytes(b[i+3:i+5],'big'),int.from_bytes(b[i+5:i+7],'big')
            i+=size
        return 'jpeg',None,None
    if b[:4]==b'RIFF' and b[8:12]==b'WEBP' and len(b)>=30:
        chunk=b[12:16]
        if chunk==b'VP8X':return 'webp',1+int.from_bytes(b[24:27],'little'),1+int.from_bytes(b[27:30],'little')
        if chunk==b'VP8L' and b[20]==47:
            v=int.from_bytes(b[21:25],'little');return 'webp',1+(v&16383),1+((v>>14)&16383)
        if chunk==b'VP8 ' and b[23:26]==b'\x9d\x01\x2a':return 'webp',int.from_bytes(b[26:28],'little')&16383,int.from_bytes(b[28:30],'little')&16383
        return 'webp',None,None
    if b.startswith(b'\x00\x00\x00') and b[4:8]==b'ftyp':return 'isobmff',None,None
    if b.lstrip().startswith(b'<svg'):return 'svg',None,None
    return None,None,None
files=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0')
files=[p for p in files if p and not p.startswith('audit-output/')]
file_set=set(files)
manifest=[];images=[];source_text={};graph=[];errors=[]
for p in files:
    b=read(p); ext=pathlib.PurePosixPath(p).suffix.lower()
    row={'path':p,'bytes':len(b),'sha256':digest(b),'gitBlob':blob(b)}
    if ext in ('.jpg','.jpeg','.png','.webp','.gif','.avif','.heic','.heif','.svg'):
        typ,w,h=image_info(b)
        row.update(format=typ,width=w,height=h)
        row['policyIssues']=[]
        if typ is None:row['policyIssues'].append('unrecognized image')
        if typ not in ('jpeg','png','webp','gif'):row['policyIssues'].append('unsupported P1 format')
        if len(b)>10*1024*1024:row['policyIssues'].append('over 10 MiB')
        if w is None or h is None:row['policyIssues'].append('dimensions not decoded')
        elif w>6000 or h>6000 or w*h>36000000:row['policyIssues'].append('dimensions exceed limit')
        if typ and ext not in ({'jpeg':('.jpg','.jpeg')}.get(typ,('.'+typ,))):row['policyIssues'].append('extension mismatch')
        images.append(row)
    elif ext in ('.js','.mjs','.cjs','.json','.md','.html','.css','.yml','.yaml','.webmanifest'):
        try:source_text[p]=b.decode('utf-8')
        except UnicodeDecodeError: errors.append({'path':p,'issue':'non-UTF8 source'})
    manifest.append(row)
for p,text in source_text.items():
    if not p.startswith('pwa/') and not p.startswith('.github/'):continue
    for match in re.finditer(r'\b(?:import\s*(?:[^;\n]*?\sfrom\s*)?|export\s+[^;\n]*?\sfrom\s*|import\s*\(|require\s*\()\s*[\'\"]([^\'\"]+)[\'\"]',text):
        spec=match.group(1);resolved=None
        if spec.startswith('.'):
            resolved=os.path.normpath(str(pathlib.PurePosixPath(p).parent.joinpath(spec))).replace('\\','/')
        graph.append({'from':p,'kind':'module','specifier':spec,'resolved':resolved,'exists':resolved in file_set if resolved else None})
    for match in re.finditer(r'\b(?:fetch|importScripts|navigator\.serviceWorker\.register)\s*\(\s*[\'\"]([^\'\"]+)[\'\"]',text):
        graph.append({'from':p,'kind':'runtime-resource','specifier':match.group(1)})
    if p.endswith('.html'):
        for match in re.finditer(r'\b(?:src|href)\s*=\s*[\'\"]([^\'\"]+)[\'\"]',text):graph.append({'from':p,'kind':'html-resource','specifier':match.group(1)})
    if p.endswith('.css'):
        for match in re.finditer(r'url\(\s*[\'\"]?([^\)\'\"]+)',text):graph.append({'from':p,'kind':'css-resource','specifier':match.group(1)})
g=obj('pwa/data/gear.seed.json');k=obj('pwa/data/kb.seed.json');c=obj('pwa/data/catches.seed.json')
registries={}
for name in ['media-sources.json','media-owners.json','media-overrides.json','local-media.json']:
    registries[name]=obj('pwa/'+name)
gear=g['items'];kb=k['entities'];catches=c['catches']
gids={x['id'] for x in gear};kids={x['id'] for x in kb};cids={x['id'] for x in catches}
for label,items in [('Gear',gear),('KB',kb),('Catch',catches)]:
    ids=[x['id'] for x in items]
    if len(ids)!=len(set(ids)):errors.append({'issue':'duplicate IDs','domain':label})
notes={};links=[];media_refs=[]
def add_ref(owner,field,source):
    if source:media_refs.append({'owner':owner,'field':field,'source':source})
for x in gear:
    p='pwa/gear-content/'+x['id']+'.md'
    if p in file_set:notes[x['id']]=p
for x in kb:
    p='pwa/'+x['content'].removeprefix('./')
    if p not in file_set:errors.append({'issue':'missing KB content','id':x['id'],'path':p})
    add_ref(x['id'],'picture',(x.get('picture') or {}).get('src'))
for x in catches:
    p='pwa/catch-content/'+x['id']+'.md'
    if p in file_set:notes[x['id']]=p
    for field,ids in [('speciesId',kids),('locationId',kids),('rodReelSetupId',gids),('techniqueId',kids)]:
        if x.get(field) and x[field] not in ids:errors.append({'issue':'unknown catch ref','id':x['id'],'field':field,'value':x[field]})
    lure=(x.get('lureOrBait') or {}).get('itemId')
    if lure and lure not in gids:errors.append({'issue':'unknown catch lure','id':x['id'],'value':lure})
    add_ref(x['id'],'picture',(x.get('picture') or {}).get('src'))
for name,config in registries.items():
    for item in config.get('items',[]) if isinstance(config,dict) else []:
        for key in ('source','imageSource'):
            if item.get(key):add_ref(name+':'+str(item.get('id',item.get('mediaId'))),key,item[key])
    for section in ('gear','kb','staged'):
        for item in config.get(section,[]) if isinstance(config,dict) else []:
            if item.get('source'):add_ref(name+':'+section+':'+str(item.get('mediaId',item.get('entityId'))),'source',item['source'])
for p,text in source_text.items():
    if not p.startswith('pwa/') or not p.endswith('.md'):continue
    for m in re.finditer(r'(!?)\[([^\]]*)\]\(([^\)\n]+)\)',text):
        raw=m.group(3).strip();target=raw.split(' "')[0].split(" '")[0].strip('<>')
        if not target:continue
        kind='image' if m.group(1) else 'link'
        row={'source':p,'line':text.count('\n',0,m.start())+1,'kind':kind,'target':target}
        if target.startswith('gear://'):row['resolvedId']=target[7:];row['valid']=row['resolvedId'] in gids
        elif target.startswith('kb://'):row['resolvedId']=target[5:];row['valid']=row['resolvedId'] in kids
        elif target.startswith(('http://','https://')):row['remote']=True
        elif not target.startswith('#'):
            q=urlsplit(target).path
            dest=os.path.normpath(str(pathlib.PurePosixPath(p).parent.joinpath(unquote(q)))).replace('\\','/')
            row['resolvedPath']=dest;row['valid']=dest in file_set
        links.append(row)
        if kind=='image':add_ref(p,'markdown',target)
for r in media_refs:
    s=r['source']
    if s.startswith(('http://','https://')):r['remote']=True;continue
    s=s.removeprefix('./')
    candidate='pwa/'+s
    if candidate in file_set:r['resolvedPath']=candidate;r['exists']=True
    else:r['exists']=False
summary={'commit':git('rev-parse','HEAD'),'parent':git('rev-parse','HEAD^'),'trackedFiles':len(files),'trackedBytes':sum(x['bytes'] for x in manifest),'imageFiles':len(images),'imageBytes':sum(x['bytes'] for x in images),'imagePolicyIssues':sum(bool(x['policyIssues']) for x in images),'gear':len(gear),'kb':len(kb),'catches':len(catches),'gearCategories':dict(collections.Counter(x['category'] for x in gear)),'kbTypes':dict(collections.Counter(x['type'] for x in kb)),'sourceMarkdown':len([p for p in files if p.startswith('pwa/') and p.endswith('.md') and ('content/' in p)]),'missingMarkdownTargets':len([x for x in links if x.get('valid') is False]),'remoteMarkdownImages':len([x for x in links if x['kind']=='image' and x.get('remote')]),'remoteMediaReferences':sum(bool(x.get('remote')) for x in media_refs),'missingMediaReferences':sum(x.get('exists') is False for x in media_refs),'issues':len(errors)}
result={'summary':summary,'files':manifest,'images':images,'dependencies':graph,'domain':{'gear':g,'kb':k,'catches':c},'registries':registries,'notes':notes,'markdownReferences':links,'mediaReferences':media_refs,'errors':errors}
(OUT/'inventory.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
with zipfile.ZipFile(OUT/'source-snapshot.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in files:z.write(ROOT/p,p)
print(json.dumps(summary,indent=2))
print('Source snapshot and inventory written to audit-output/')
