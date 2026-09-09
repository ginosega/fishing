#!/usr/bin/env python3
"""One-time, non-mutating v1 -> v2 source migration. Never downloads images.

Requires an exact v1 source checkout, the archived verified Pages bundle, and
an explicit media decision file. A pending-media preview is not a cutover.
"""
import argparse, csv, hashlib, json, re, shutil, unicodedata
from collections import Counter
from pathlib import Path, PurePosixPath
from PIL import Image, ImageFile

SOURCE_REVISION = '79f36144abad39a9515b8f2d7710852f1c7e7114'
ARCHIVE_REVISION = '4f2fe70f47da9cca3704722de87f7282bcc00f83'
FOLDERS = {'rods-reels':'Rods-Reels','line':'Line','weights':'Weights',
 'snaps-swivels':'Snaps-Swivels','hooks':'Hooks','lures':'Lures','bait':'Bait','accessories':'Equipment'}
KB_FOLDERS = {'location':'Locations','species':'Species','equipment':'Gear-Guides','technique':'Techniques','knot':'Knots'}
SPLITS = {
 'setup-spinning': [('rod','daiwa-tatula-xt-rod','Spinning rod','Daiwa Tatula XT.md','daiwa-tatula-xt'),('reel','daiwa-exceler-lt-reel','Spinning reel','Daiwa Exceler LT.md','daiwa-exceler-lt')],
 'setup-baitcasting': [('rod','shimano-zodias-rod','Baitcasting rod','Shimano Zodias.md','shimano-zodias'),('reel','shimano-slx-dc-xt-71hg-reel','Baitcasting reel','Shimano 22 SLX DC XT 71HG.md','shimano-slx-dc-xt-71hg')],
 'setup-spincasting': [('rod','pflueger-president-spincast-rod','Spincasting rod','Pflueger President Spincast Combo - Rod.md',None),('reel','pflueger-president-spincast-reel','Spincasting reel','Pflueger President Spincast Combo - Reel.md','pflueger-president-spincast')]
}

def digest(data): return hashlib.sha256(data).hexdigest()
def read_json(path): return json.loads(Path(path).read_text(encoding='utf-8'))
def write_json(path, value):
 path.parent.mkdir(parents=True,exist_ok=True)
 path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def clean(path): return path.removeprefix('./')
def safe(path):
 p=PurePosixPath(path)
 if p.is_absolute() or '\\' in path or any(x in ('','.','..') for x in path.split('/')) or re.search(r'[\x00-\x1f\x7f]',path): raise ValueError(f'Unsafe path: {path}')
 if len(path.encode())>240: raise ValueError(f'Path too long: {path}')
 return path

class Migration:
 def __init__(self,args):
  self.a=args;self.source=Path(args.source).resolve();self.archive=Path(args.archive).resolve();self.out=Path(args.output).resolve()
  if self.out.exists() and any(self.out.iterdir()):raise ValueError('Migration output must be an empty directory')
  self.report={'sourceRevision':args.source_revision,'archiveRevision':ARCHIVE_REVISION,'approval':'pending-media-preview' if args.allow_pending else 'cutover-candidate','counts':{},'files':[],'fieldTransformations':[],'splitMappings':{},'exceptions':[],'references':[]}
  self.pathmap={};self.media={};self.used={};self.newpaths={};self.mapped_ids={}
  self.decisions={r['mediaId']:r['decision'] for r in csv.DictReader(open(args.decisions,newline='',encoding='utf-8-sig'))}
  self.review={r['mediaId']:r for r in read_json(args.review)['records']}
  if set(self.decisions)!=set(self.review):raise ValueError('Image decision coverage does not match the reviewed 51 captures')
  if Counter(self.decisions.values())!=Counter({'ADOPT':49,'REPLACE':2}):raise ValueError('Unexpected image decisions; review required')
  self.local=read_json(self.source/'pwa/local-media.json')
  self.published=read_json(self.archive/'gear-media.json')
  self.source_media={r['id']:r for r in self.published}
  self.owner_media={}
  for r in self.published:
   for owner in r.get('owners',[]):
    key=(owner['gearItemId'],owner.get('component'))
    if key in self.owner_media:raise ValueError(f'Ambiguous published media owner: {key}')
    self.owner_media[key]=r['id']
  self.kb_published={r['id']:r for r in read_json(self.archive/'data/kb.seed.json')['entities']}
  self.source_hashes={r['path']:r['sha256'] for r in read_json(args.inventory)['files']} if args.inventory else {}
  if self.source_hashes:
   for filename in ('gear.seed.json','kb.seed.json','catches.seed.json'):
    rel='pwa/data/'+filename
    if digest((self.source/rel).read_bytes())!=self.source_hashes[rel]:raise ValueError('Audited source changed: '+rel)
  self.source_assets={r['id']:r for r in self.published}
  self.original_by_hash={}
  for f in (self.source/'pwa/assets').rglob('*'):
   if f.is_file() and f.suffix.lower() in ('.jpg','.jpeg','.png','.webp','.gif'):
    self.original_by_hash.setdefault(digest(f.read_bytes()),[]).append(f)
  self.gear_source=read_json(self.source/'pwa/data/gear.seed.json')['items']
  self.kb_source=read_json(self.source/'pwa/data/kb.seed.json')['entities']
  self.catch_source=read_json(self.source/'pwa/data/catches.seed.json')['catches']
  self.gear=[];self.kb=[];self.catches=[]
 def copy(self,src,dest,expected=None):
  dest=safe(dest);src=Path(src)
  if src.is_symlink() or not src.is_file():raise ValueError(f'Invalid source file: {src}')
  if self.out.is_relative_to(src):raise ValueError('Migration output cannot contain the source')
  data=src.read_bytes();h=digest(data)
  if expected and h!=expected:raise ValueError(f'Hash mismatch: {src}')
  if src.suffix.lower() in ('.jpg','.jpeg','.png','.webp','.gif'):
   with Image.open(src) as image:
    if image.format not in ('JPEG','PNG','WEBP','GIF'):raise ValueError(f'Unsupported image format: {src}')
    if len(data)>10*1024*1024 or max(image.size)>6000 or image.width*image.height>36000000:raise ValueError(f'Image exceeds policy: {src}')
    for frame in range(getattr(image,'n_frames',1)):
     image.seek(frame);image.load()
  rel=str(src.relative_to(self.source)) if src.is_relative_to(self.source) else None
  if rel in self.source_hashes and self.source_hashes[rel]!=h:raise ValueError(f'Source changed from audited input: {rel}')
  key=unicodedata.normalize('NFC',dest).casefold()
  if key in self.newpaths and self.newpaths[key]!=dest:raise ValueError(f'Case/Unicode collision: {dest}')
  self.newpaths[key]=dest
  target=self.out/dest;target.parent.mkdir(parents=True,exist_ok=True)
  if target.exists() and target.read_bytes()!=data:raise ValueError(f'Conflicting file destination: {dest}')
  target.write_bytes(data)
  source_ref=('source:'+rel) if rel else ('production:'+src.relative_to(self.archive).as_posix() if src.is_relative_to(self.archive) else None)
  if source_ref is None:raise ValueError('Migration input is outside the pinned source and archive')
  if not any(r['path']==dest for r in self.report['files']):self.report['files'].append({'path':dest,'bytes':len(data),'sha256':h,'source':source_ref})
  return dest
 def source_path(self,relative):return self.source/'pwa'/clean(relative)
 def media_path(self,media_id):
  if media_id in self.media:return self.media[media_id]
  r=self.source_media.get(media_id)
  if not r:return None
  local=next((x for x in self.local['gear'] if x['mediaId']==media_id),None)
  source=None;expected=None;dest=None
  if media_id in self.decisions:
   row=self.review[media_id]
   if self.decisions[media_id]=='ADOPT':
    source=self.archive/clean(row['archivedPath']);expected=row['sha256'];dest=row['proposedPath']
   else:
    self.exception('replacement-required',media_id,{'archivedSha256':row['sha256'],'source':row['archivedPath']})
    self.media[media_id]=None;return None
  elif local:
   source=self.source_path(local['source']);dest='Gear/'+FOLDERS[self.gear_by_owner(r)['category']]+'/assets/'+Path(local['source']).name
  else:
   published=self.archive/clean(r['asset'])
   matches=self.original_by_hash.get(digest(published.read_bytes()),[]) if published.exists() else []
   if matches:
    source=sorted(matches,key=lambda f:(not str(f).startswith(str(self.source/'pwa/assets/gear-source')),str(f)))[0]
    dest='Gear/'+FOLDERS[self.gear_by_owner(r)['category']]+'/assets/'+source.name
   else:
    self.exception('unapproved-remote-media',media_id,{'source':r['asset']});self.media[media_id]=None;return None
  if media_id=='tsuridamashii-snap-swivels':
   self.exception('malformed-active-image',media_id,{'source':'pwa/assets/gear-source/tsuridamashii-snap-swivels.webp'});self.media[media_id]=None;return None
  if not source.exists():raise ValueError(f'Approved image missing: {source}')
  if not expected and self.source_hashes:
   expected=self.source_hashes.get(str(source.relative_to(self.source))) if source.is_relative_to(self.source) else None
  self.media[media_id]=self.copy(source,dest,expected)
  return self.media[media_id]
 def gear_by_owner(self,media):
  owner=media['owners'][0];return next(i for i in self.gear_source if i['id']==owner['gearItemId'])
 def exception(self,kind,id,details=None):
  value={'kind':kind,'id':id,**(details or {})}
  if value not in self.report['exceptions']:self.report['exceptions'].append(value)
 def picture(self,media_id,caption=None):
  path=self.media_path(media_id) if media_id else None
  return {'src':path,**({'caption':caption} if caption else {})} if path else None
 def add_notes(self,old,folder,filename=None):
  src=self.source/'pwa/gear-content'/f'{old}.md'
  if not src.exists():return None
  dest=f'Gear/{folder}/content/{filename or src.name}'
  self.pathmap['pwa/gear-content/'+src.name]=dest
  return self.copy(src,dest)
 def migrate_gear(self):
  for old in self.gear_source:
   if old['id'] in SPLITS:
    mapping=[]
    for component,id,type,filename,media_id in SPLITS[old['id']]:
     part=old[component];m=part['manufacturer'];name=m['name']+' '+part['model']
     if old['id']=='setup-spincasting':name+=' - '+component.capitalize()
     item={'id':id,'category':'rods-reels','type':type,'name':name,'manufacturer':m['name'],'model':part['model'],'specifications':part['specifications'],'links':part['links']}
     notes=self.add_notes(old['id'],'Rods-Reels',filename)
     if notes:item['notes']=notes
     pic=self.picture(media_id)
     if pic:item['picture']=pic
     self.gear.append(item);mapping.append(id)
     for field in ('manufacturer','model','specifications','links'):
      self.report['fieldTransformations'].append({'from':old['id']+'.'+component+'.'+field,'to':id+'.'+field,'preservation':'exact'})
    self.report['splitMappings'][old['id']]=mapping
    continue
   item={k:old[k] for k in ('id','category','type','name')}
   for field in ('manufacturer','model','specifications','links'):
    if field in old and old[field] is not None:item[field]=old[field]['name'] if field=='manufacturer' and isinstance(old[field],dict) else old[field]
   notes=self.add_notes(old['id'],FOLDERS[old['category']])
   if notes:item['notes']=notes
   mid=self.owner_media.get((old['id'],None))
   if mid:
    pic=self.picture(mid)
    if pic:item['picture']=pic
   self.gear.append(item)
  for r in self.local['gear']:
   if r['mediaId']=='tsuridamashii-snap-swivels':self.exception('malformed-active-image',r['mediaId'],{'source':r['source']})
  self.exception('missing-original-picture','rapala-original-floating-f3',{'gearId':'rapala-original-floating','optional':True})
  self.exception('absent-original-picture','generic-1-inline-spinner',{'optional':True})
  self.report['counts']['gear']={'source':len(self.gear_source),'destination':len(self.gear)}
 def migrate_kb(self):
  for old in self.kb_source:
   item={k:old[k] for k in ('id','type','name')}
   if old.get('description'):item['description']=old['description']
   src=self.source_path(old['content']);dest=f"KB/{KB_FOLDERS[old['type']]}/content/{src.name}"
   item['content']=self.copy(src,dest);self.pathmap['pwa/'+clean(old['content'])]=dest
   pic=self.kb_published[old['id']].get('picture') or old.get('picture')
   if pic and pic.get('src'):
    s=pic['src'];p=None
    if s.startswith(('http:','https:')):
     self.exception('remote-kb-picture',old['id'],{'source':s})
    elif pic.get('gearItemId'):
     owner=next((g for g in self.gear if g['id']==pic['gearItemId']),None)
     if owner:p=owner.get('picture')
     if not p:self.exception('shared-picture-pending',old['id'],{'gearId':pic['gearItemId']})
    else:
     src=self.source_path(s)
     if src.exists():
      dest=f"KB/{KB_FOLDERS[old['type']]}/assets/{src.name}"
      path=self.copy(src,dest);p={'src':path}
     else:self.exception('missing-kb-image',old['id'],{'source':s})
    if p:item['picture']={'src':p['src'],**({'caption':pic['caption']} if pic.get('caption') else {})}
   self.kb.append(item)
  self.report['counts']['kb']={'source':len(self.kb_source),'destination':len(self.kb)}
 def migrate_catches(self):
  for old in self.catch_source:
   item={k:old[k] for k in ('id','date')}
   if old.get('time'):item['time']=old['time']
   size=old.get('size')
   if size:
    if size.get('display'):item['size']=size['display']
    else:
     parts=[]
     for key in ('length','weight'):
      v=size.get(key)
      if v:parts.append(f"{v['value']} {v['unit']}")
     if parts:item['size']=', '.join(parts)
   for key in ('speciesId','locationId'):
    if old.get(key):item[key]=old[key]
   if old.get('lureOrBait') and old['lureOrBait'].get('itemId'):item['lureOrBaitId']=old['lureOrBait']['itemId']
   src=self.source/'pwa/catch-content'/f"{old['id']}.md"
   if src.exists():
    dest='Catches/content/'+src.name;item['notes']=self.copy(src,dest);self.pathmap['pwa/catch-content/'+src.name]=dest
   self.catches.append(item)
   self.report['fieldTransformations'].append({'from':old['id']+'.size','to':item.get('size'),'preservation':'original measurement values/units; original object retained in archive'})
  self.report['counts']['catches']={'source':len(self.catch_source),'destination':len(self.catches)}
 def rewrite_relative_markdown(self):
  # Preserve authored bytes. Report any physical relative links that require an explicit relocation decision.
  all_ids={'gear':{r['id'] for r in self.gear},'kb':{r['id'] for r in self.kb}}
  for r in self.report['files']:
   if not r['path'].endswith('.md'):continue
   text=(self.out/r['path']).read_text(encoding='utf-8')
   for domain,id in re.findall(r'\b(gear|kb)://([a-z0-9-]+)',text):
    if id in self.report['splitMappings']:
     self.exception('retired-setup-link',id,{'document':r['path'],'targets':self.report['splitMappings'][id]})
    elif id not in all_ids[domain]:raise ValueError(f'Dangling {domain} reference {id} in {r["path"]}')
   # The full Markdown-aware validator runs in the v2 build. This pass is only an inventory.
 def finish(self):
  self.migrate_gear();self.migrate_kb();self.migrate_catches();self.rewrite_relative_markdown()
  write_json(self.out/'Gear/gear.json',{'schemaVersion':2,'items':self.gear})
  write_json(self.out/'KB/kb.json',{'schemaVersion':2,'entities':self.kb})
  write_json(self.out/'Catches/catches.json',{'schemaVersion':2,'catches':self.catches})
  self.report['files'].sort(key=lambda x:x['path'])
  self.report['exceptions'].sort(key=lambda x:(x['kind'],x['id']))
  self.report['sourceIds']={'gear':[r['id'] for r in self.gear_source],'kb':[r['id'] for r in self.kb_source],'catches':[r['id'] for r in self.catch_source]}
  self.report['destinationIds']={'gear':[r['id'] for r in self.gear],'kb':[r['id'] for r in self.kb],'catches':[r['id'] for r in self.catches]}
  self.report['pathMappings']=self.pathmap
  self.report['mediaDecisions']=self.decisions
  self.report['originalCatches']=self.catch_source
  self.report['sourceStructuredHashes']={d:digest((self.source/'pwa/data'/f).read_bytes()) for d,f in [('gear','gear.seed.json'),('kb','kb.seed.json'),('catches','catches.seed.json')]}
  write_json(self.out/'v2/migration/reconciliation.json',self.report)
  if self.report['exceptions'] and not self.a.allow_pending:raise ValueError('Unresolved exceptions remain; cutover migration is not accepted')
  print(json.dumps({'counts':self.report['counts'],'adopted':sum(1 for v in self.decisions.values() if v=='ADOPT'),'exceptions':self.report['exceptions']},indent=2))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--archive',required=True);p.add_argument('--output',required=True)
 p.add_argument('--decisions',required=True);p.add_argument('--review',required=True);p.add_argument('--inventory');p.add_argument('--source-revision',default=SOURCE_REVISION);p.add_argument('--allow-pending',action='store_true')
 a=p.parse_args();Migration(a).finish()
