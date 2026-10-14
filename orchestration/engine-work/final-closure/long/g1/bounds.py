import json,re,sys,bisect
import fitz
case=sys.argv[1]; src=sys.argv[2]
ours=json.load(open(src,encoding='utf8'))
doc=fitz.open(f'orchestration/engine-work/mission01/references/{case}/word.pdf')
norm=lambda t:re.sub(r'[\W_]+','',t.lower())
O=[norm(''.join(w for _,w in sorted(p['words'],key=lambda a:a[0]))) for p in ours]
W=[norm(''.join(w[4] for w in sorted(pg.get_text('words'),key=lambda w:(round(w[1]),w[0])))) for pg in doc]
print('word',len(W),'ours',len(O),'chars',sum(map(len,W)),sum(map(len,O)))
# Boundary offsets in each stream; compare cumulative offsets page by page (monotone alignment on first-N-chars unique anchoring)
big=''.join(O);pos=[];c=0
for s in O: pos.append(c);c+=len(s)
cur=0;bad=[]
for i,s in enumerate(W):
    if len(s)<25: continue
    k=big.find(s[:25],max(0,cur-3000))
    if k<0: bad.append((i+1,'NOTFOUND'));continue
    cur=k
    pg=bisect.bisect_right(pos,k)-1
    off=k-pos[pg]
    if pg!=i or off!=0: bad.append((i+1,pg+1,off,len(O[pg])-off))
print('mismatching openings',len(bad))
for b in bad[:40]: print(b)
