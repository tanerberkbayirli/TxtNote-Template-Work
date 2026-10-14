import json,sys,re,fitz,bisect,unicodedata,difflib,time
id,dirn=sys.argv[1],sys.argv[2]
lim=int(sys.argv[3]) if len(sys.argv)>3 else 60
ours=json.load(open(f'{dirn}/{id}.pages.json',encoding='utf8'))
doc=fitz.open(f'../../mission01/references/{id}/word.pdf')
norm=lambda t:re.sub(r'[\W_]+','',unicodedata.normalize('NFKC',t).lower())
OS=[norm(''.join(w for _,w in sorted(p['words'],key=lambda a:a[0]))) for p in ours]
WS=[norm(''.join(w[4] for w in pg.get_text('words',sort=True) if 58<w[1]<790)) for pg in doc]
O=''.join(OS);W=''.join(WS)
opos=[];c=0
for s in OS: opos.append(c);c+=len(s)
wpos=[];c=0
for s in WS: wpos.append(c);c+=len(s)
t=time.time()
sm=difflib.SequenceMatcher(None,O,W,autojunk=False)
blocks=[b for b in sm.get_matching_blocks() if b.size>=3]
print('pages ours',len(OS),'word',len(WS),'chars',len(O),len(W),'matched',sum(b.size for b in blocks),'time',round(time.time()-t,1))
bw=[b.b for b in blocks]
def to_ours(j):
    k=bisect.bisect_right(bw,j)-1
    # nearest matched position at/after j
    for kk in (k,k+1):
        if 0<=kk<len(blocks):
            b=blocks[kk]
            if b.b<=j<b.b+b.size: return b.a+(j-b.b)
            if b.b>j: return b.a-(b.b-j)
    return None
bad=[];aligned=0
for wi in range(len(WS)):
    if len(WS[wi])<30: continue
    j=wpos[wi]
    o=to_ours(j)
    if o is None: continue
    pg=bisect.bisect_right(opos,o)-1
    off=o-opos[pg]
    if off<=6 or (pg+1<len(OS) and opos[pg+1]-o<=6): aligned+=1
    else: bad.append((wi+1,pg+1,off,len(OS[pg])))
print('aligned',aligned,'misaligned',len(bad))
for b in bad[:lim]: print(b)
