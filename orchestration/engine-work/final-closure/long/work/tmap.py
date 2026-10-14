import json,sys,re,bisect,pymupdf
d=sys.argv[1]
ours=json.load(open(f'orchestration/engine-work/final-closure/long/work/{d}/SRC09.pages.json',encoding='utf8'))
tables=json.load(open(f'orchestration/engine-work/final-closure/long/work/{d}/SRC09.tables.json',encoding='utf8'))
doc=pymupdf.open('orchestration/engine-work/mission01/references/SRC09/word.pdf')
norm=lambda t:re.sub(r'[\W_]+','',t.lower())
def stream(pages):
    s='';pos=[]
    for p in pages:
        pos.append(len(s)); s+=p
    return s,pos
O=[norm(''.join(w for _,w in sorted(p['words'],key=lambda a:a[0]))) for p in ours]
W=[norm(''.join(x[4] for x in sorted(pg.get_text('words'),key=lambda w:(round(w[1]/2),w[0])))) for pg in doc]
so,po=stream(O); sw,pw=stream(W)
def locate(s,pos,key,cur):
    k=s.find(key,cur)
    if k<0: return None,cur
    return bisect.bisect_right(pos,k),k
co=cw=0
out=[]
for ti,t in enumerate(tables):
    rows=t['allRows']
    first=norm(rows[0]['text'])[:14]; last=norm(rows[-1]['text'])[:14]
    # find first row for each side
    po_,co2=locate(so,po,first,co); pw_,cw2=locate(sw,pw,first,cw)
    # last row: search from found position
    pl_o,_=locate(so,po,last,co2 if po_ else co); pl_w,_=locate(sw,pw,last,cw2 if pw_ else cw)
    out.append((ti,len(rows),po_,pl_o,pw_,pl_w))
    if po_: co=co2
    if pw_: cw=cw2
print('tbl rows | ours first-last | word first-last')
for r in out: print(*r, '' if (r[2]==r[4] and r[3]==r[5]) else '  <--')
