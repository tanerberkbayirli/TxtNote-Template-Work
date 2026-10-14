import pymupdf,sys
# natural width of Word line + next word, using PDF char advances; usage fit.py page(1-based) y0 y1
d=pymupdf.open('orchestration/engine-work/mission01/references/SRC10/word.pdf')
pg=int(sys.argv[1]);y0=float(sys.argv[2]);y1=float(sys.argv[3])
raw=d[pg-1].get_text('rawdict')
lines=[]
for b in raw['blocks']:
    for ln in b.get('lines',[]):
        if y0<=ln['bbox'][1]<=y1:lines.append(ln)
lines.sort(key=lambda l:l['bbox'][1])
def words(ln):
    ws=[];cur=''; w=0
    for s in ln['spans']:
        for c in s['chars']:
            if c['c']==' ':
                if cur:ws.append((cur,w));cur='';w=0
            else:
                cur+=c['c'];w+=c['bbox'][2]-c['bbox'][0]
    if cur:ws.append((cur,w))
    return ws
allw=[words(l) for l in lines]
for i,l in enumerate(lines):
    ws=allw[i];nat=sum(w for _,w in ws)
    x0=l['bbox'][0];x1=l['bbox'][2]
    nxt=allw[i+1][0] if i+1<len(lines) and allw[i+1] else None
    print(round(l['bbox'][1],1),'n',len(ws),'wordsum',round(nat,2),'x',round(x0,2),round(x1,2),'gap',round((x1-x0-nat)/max(1,len(ws)-1),3),'next',nxt[0] if nxt else None,round(nxt[1],2) if nxt else None)
