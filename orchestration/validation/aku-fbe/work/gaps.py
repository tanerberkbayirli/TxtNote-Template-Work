import pymupdf,sys,collections
d=pymupdf.open(sys.argv[1]); K=25.4/72
tot=0; small=[]
for pn,p in enumerate(d,1):
    ws=p.get_text('words')
    lines=collections.defaultdict(list)
    for w in ws: lines[(round(w[3]*K,1))].append(w)
    for y,l in lines.items():
        l.sort(key=lambda w:w[0])
        for a,b in zip(l,l[1:]):
            g=(b[0]-a[2])*K; sz=(a[3]-a[1])*K
            tot+=1
            if g<0.9 and g>0.0 and sz>3.5: small.append((pn,round(y,1),round(g,2),a[4],b[4]))
print('gaps',tot,'small(<0.9mm)',len(small))
for s in small[:25]: print(s)
