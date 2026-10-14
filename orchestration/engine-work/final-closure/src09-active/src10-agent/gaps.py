import pymupdf,sys,statistics
d=pymupdf.open('orchestration/engine-work/mission01/references/SRC10/word.pdf')
res=[]
for pn in range(len(d)):
    raw=d[pn].get_text('rawdict')
    for b in raw['blocks']:
        for ln in b.get('lines',[]):
            sp=ln['spans']
            if not sp or any(abs(s['size']-12)>.01 or 'TimesNewRomanPS'!=s['font'][:15] for s in sp):continue
            chars=[c for s in sp for c in s['chars']]
            if len(chars)<40:continue
            ws=[];cur=[]
            for c in chars:
                if c['c']==' ':
                    if cur:ws.append(cur);cur=[]
                else:cur.append(c)
            if cur:ws.append(cur)
            if len(ws)<6:continue
            wsum=sum(w[-1]['bbox'][2]-w[0]['bbox'][0] for w in ws)
            x0=ws[0][0]['bbox'][0];x1=ws[-1][-1]['bbox'][2]
            # actual gaps between words
            gaps=[ws[i+1][0]['bbox'][0]-ws[i][-1]['bbox'][2] for i in range(len(ws)-1)]
            res.append((pn+1,round(ln['bbox'][1],1),round(x0,2),round(x1,2),round(statistics.mean(gaps),3),round(max(gaps)-min(gaps),3),len(ws)))
import collections
print(len(res))
c=collections.Counter(round(r[3],1) for r in res);print(sorted(c.items())[-12:])
g=[r[4] for r in res if r[3]>484 and r[2]<72]
print('x1>484 lines',len(g),'min gap',min(g),'mean',statistics.mean(g))
print(sorted(g)[:15])
