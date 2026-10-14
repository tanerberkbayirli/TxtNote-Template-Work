import json,sys,fitz
id=sys.argv[1] if len(sys.argv)>1 else 'SRC09'
ours=json.load(open(f'orchestration/engine-work/mission07/t9/{id}.pages.json',encoding='utf8'))
doc=fitz.open(f'orchestration/engine-work/mission01/references/{id}/word.pdf')
def ow(p): return [w for _,w in sorted(p['words'],key=lambda a:a[0])]
W=[[w[4] for w in sorted(pg.get_text('words'),key=lambda w:(round(w[1]),w[0]))] for pg in doc]
print('word',len(W),'ours',len(ours))
# flat streams, find where each Word page begins in ours
flat=[(i,w) for i,p in enumerate(ours) for _,w in sorted(p['words'],key=lambda a:a[0])]
for i in list(range(0,12))+list(range(40,46)):
    print('W',i+1,' '.join(W[i][:10]))
print('---')
for i in list(range(0,14)):
    print('O',i+1,len(ours[i]['words']),' '.join(ow(ours[i])[:10]))
import re
def norm(ws): return re.sub(r'[\W_]+','',''.join(ws).lower())
OS=[norm(ow(p)) for p in ours]
WS=[norm(w) for w in W]
# align: for each word page with text, find ours page whose first 25 normalized chars start there (anywhere within normalized ours text)
big=''.join(OS); pos=[];c=0
for s in OS: pos.append(c); c+=len(s)
def pageof(off):
    import bisect;return bisect.bisect_right(pos,off)-1
print('\nWord page -> our page where its opening text appears, and our offset in page (0=starts page)')
last=0;res=[]
for i,s in enumerate(WS):
    if len(s)<30: res.append((i+1,None,None));continue
    k=big.find(s[:30],max(0,pos[last]-5000) if False else 0)
    if k<0: res.append((i+1,-1,None));continue
    pg=pageof(k);res.append((i+1,pg+1,k-pos[pg]))
bad=0
for w,o,off in res:
    if o is None: continue
    flag='' if off==0 else '  <-- mid-page'
    if o==-1: flag='  <-- NOT FOUND'
    if flag: bad+=1
    if flag and bad<60: print(w,o,off,flag)
print('mismatches',bad,'of',len([r for r in res if r[1] is not None]))
print('\n=== ours->word')
wbig=''.join(WS);wpos=[];c=0
for s in WS: wpos.append(c);c+=len(s)
import bisect
cur=0
for i,s in enumerate(OS):
    if len(s)<30: print(i+1,'blank/short',len(s),s[:20]);continue
    k=wbig.find(s[:30])
    if k<0: print(i+1,'NOTFOUND',ow(ours[i])[:8]);continue
    pg=bisect.bisect_right(wpos,k)-1
    print(i+1,'-> word',pg+1,'off',k-wpos[pg],'len',len(s),'wordlen',len(WS[pg]))
