import re,sys
s=open('word/document.xml',encoding='utf8').read()
o=s.index('id="Oval 12"')
cap=s.index('Tipik Karar Verme',o)
base=int(sys.argv[1])
seg=s[base:cap]
items=[]
for m in re.finditer(r'<mc:AlternateContent\b[^>]*>(.*?)</mc:AlternateContent>',seg,re.S):
    blk=m.group(1)
    ch=re.search(r'<mc:Choice[^>]*>(.*?)</mc:Choice>',blk,re.S)
    c=ch.group(1) if ch else blk
    off=m.start()+base
    kind='wps' if '<wps:wsp' in c else ('wpg' if 'wpg:wgp' in c else ('pic' if 'pic:pic' in c else 'other'))
    ext=re.search(r'<wp:extent cx="(\d+)" cy="(\d+)"',c)
    ph=re.search(r'<wp:positionH relativeFrom="(\w+)">(.*?)</wp:positionH>',c,re.S)
    pv=re.search(r'<wp:positionV relativeFrom="(\w+)">(.*?)</wp:positionV>',c,re.S)
    geom=re.findall(r'prst="(\w+)"',c)
    rot=re.findall(r'<a:xfrm[^>]*rot="(-?\d+)"',c)
    txt=''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>',c))
    z=re.search(r'relativeHeight="(\d+)"',c)
    items.append((off,kind,ext and (round(int(ext.group(1))/12700,1),round(int(ext.group(2))/12700,1)),ph and (ph.group(1),re.sub('<[^>]+>','',ph.group(2))),pv and (pv.group(1),re.sub('<[^>]+>','',pv.group(2))),geom[:2],rot,z and z.group(1),txt[:40]))
print(len(items), 'pict:',seg.count('<w:pict'))
for it in items: print(it)
