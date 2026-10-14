import json,sys,re,difflib,fitz
id,dirn=sys.argv[1],sys.argv[2]
ours=json.load(open(f'{dirn}/{id}.pages.json',encoding='utf8'))
doc=fitz.open(f'../../mission01/references/{id}/word.pdf')
norm=lambda t:re.sub(r'[\W_]+','',t.lower())
def toks(ws):
    return [n for n in (norm(w) for w in ws) if n]
O=[];OP=[]
for i,p in enumerate(ours):
    t=toks([w for _,w in sorted(p['words'],key=lambda a:a[0])])  # y-sorted; ties keep DOM order
    O+=t;OP+=[i]*len(t)
W=[];WP=[]
for i,pg in enumerate(doc):
    ws=[w[4] for w in pg.get_text('words',sort=True) if 58<w[1]<790]
    t=toks(ws);W+=t;WP+=[i]*len(t)
print('pages ours',len(ours),'word',len(doc),'tokens ours',len(O),'word',len(W))
sm=difflib.SequenceMatcher(None,O,W,autojunk=False)
blocks=[b for b in sm.get_matching_blocks() if b.size]
matched=sum(b.size for b in blocks)
print('matched tokens',matched,'ours-unmatched',len(O)-matched,'word-unmatched',len(W)-matched)
# map word index -> ours index
import bisect
bw=[b.b for b in blocks]
def map_w(j):
    k=bisect.bisect_right(bw,j)-1
    if k>=0 and j<blocks[k].b+blocks[k].size: return blocks[k].a+(j-blocks[k].b)
    return None
# first token of each ours page
ostart={}
for idx,p in enumerate(OP):
    ostart.setdefault(p,idx)
first_o_idx_of_page=ostart
wstart={}
for idx,p in enumerate(WP): wstart.setdefault(p,idx)
# for each Word page start find ours position
bad=[]
for wp,j in sorted(wstart.items()):
    # find first matched token at/after j within the same word page
    jj=j;m=None
    while jj<len(W) and WP[jj]==wp:
        m=map_w(jj)
        if m is not None:break
        jj+=1
    if m is None: bad.append((wp+1,'unmatched',None));continue
    op=OP[m];off=m-ostart[op]-(jj-j)
    if abs(off)>2: bad.append((wp+1,op+1,off))
print('Word page openings not at an ours page start:',len(bad))
for b in bad[:int(sys.argv[3]) if len(sys.argv)>3 else 25]: print(b)
# show unmatched runs summary
runs=[];pa=pb=0
for b in blocks+[difflib.Match(len(O),len(W),0)]:
    if b.a>pa or b.b>pb: runs.append((pa,pb,b.a-pa,b.b-pb))
    pa,pb=b.a+b.size,b.b+b.size
big=[r for r in runs if r[2]+r[3]>=6]
print('diff runs >=6 tokens:',len(big))
for a,b,la,lb in big[:15]: print('ours p',OP[a]+1 if a<len(OP) else '-', 'word p',WP[b]+1 if b<len(WP) else '-',la,lb,' '.join(O[a:a+4]),'|',' '.join(W[b:b+4]))
