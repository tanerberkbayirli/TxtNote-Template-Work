import pymupdf,sys,collections
f=sys.argv[1]
d=pymupdf.open(f);print(f,len(d),'pages')
mm=lambda v:round(v/72*25.4,2)
fonts=collections.Counter()
for i,p in enumerate(d):
    L=[]
    for b in p.get_text('dict')['blocks']:
        for l in b.get('lines',[]):
            t=''.join(s['text'] for s in l['spans']).strip()
            if t: L.append((l['bbox'],l['spans'][0],t))
            for s in l['spans']:
                if s['text'].strip(): fonts[(s['font'],round(s['size'],1))]+=len(s['text'])
    if not L: print(i+1,'blank');continue
    x0=min(b[0] for b,_,_ in L);x1=max(b[2] for b,_,_ in L);y0=min(b[1] for b,_,_ in L);y1=max(b[3] for b,_,_ in L)
    body=[l for l in L if l[0][3]<p.rect.height-mm(1)*0+0]
    last=L[-1]
    print(i+1,'x',mm(x0),'-',mm(x1),'y',mm(y0),'-',mm(y1),'|',L[0][2][:30],'|last',last[2][:12],mm(last[0][1]))
print(fonts.most_common(12))
