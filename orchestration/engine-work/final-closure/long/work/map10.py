import json,sys,re,collections,pymupdf
d=sys.argv[1]
ours=json.load(open(f'orchestration/engine-work/final-closure/long/work/{d}/SRC10.pages.json',encoding='utf8'))
doc=pymupdf.open('orchestration/engine-work/mission01/references/SRC10/word.pdf')
norm=lambda t:re.sub(r'[\W_\d]+','',t.lower())
O=[[norm(w) for _,w in sorted(p['words'],key=lambda a:a[0])] for p in ours]
W=[[norm(x[4]) for x in sorted(pg.get_text('words'),key=lambda w:(round(w[1]),w[0]))] for pg in doc]
cnt=collections.Counter(w for p in W for w in p if len(w)>5)
loc=collections.defaultdict(list)
for i,p in enumerate(O):
    for w in set(p):
        if len(w)>5: loc[w].append(i)
res=[]
for i,p in enumerate(W):
    votes=collections.Counter()
    for w in set(p):
        if len(w)>5 and cnt[w]<=2 and len(loc[w])<=2:
            for j in loc[w]: votes[j+1]+=1
    res.append((i+1,len(p),votes.most_common(2)))
for r in res: print(*r)
