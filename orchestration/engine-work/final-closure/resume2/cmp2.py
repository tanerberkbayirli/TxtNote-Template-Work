import json,sys,re,fitz,bisect,unicodedata
id,dirn=sys.argv[1],sys.argv[2]
ours=json.load(open(f'{dirn}/{id}.pages.json',encoding='utf8'))
doc=fitz.open(f'../../mission01/references/{id}/word.pdf')
norm=lambda t:re.sub(r'[\W_]+','',t.lower())
OS=[norm(''.join(w for _,w in sorted(p['words'],key=lambda a:a[0]))) for p in ours]
WS=[norm(''.join(w[4] for w in pg.get_text('words',sort=True) if 58<w[1]<790)) for pg in doc]
big=''.join(OS);pos=[];c=0
for s in OS: pos.append(c);c+=len(s)
wpos=[];c=0
for s in WS: wpos.append(c);c+=len(s)
print('pages ours',len(OS),'word',len(WS),'chars ours',len(big),'word',sum(map(len,WS)))
K=22
res=[];last=0
for wi,s in enumerate(WS):
    if len(s)<K+8: res.append((wi+1,None,None));continue
    # expected position scaled by char ratio to keep monotone and local
    exp=int(wpos[wi]*len(big)/max(1,sum(map(len,WS))))
    cands=[]
    for shift in (0,K,2*K,3*K,4*K):
        if len(s)<shift+K: break
        q=s[shift:shift+K];k=big.find(q,max(0,last-3000))
        while k>=0 and len(cands)<8:
            cands.append(k-shift);k=big.find(q,k+1)
        if cands: break
    if not cands: res.append((wi+1,-1,None));continue
    k=min(cands,key=lambda x:abs(x-max(exp,last)) if x>=last-3000 else 10**9)
    k=max(k,0)
    last=k;pg=bisect.bisect_right(pos,k)-1;res.append((wi+1,pg+1,k-pos[pg]))
bad=[r for r in res if r[1] is not None and (r[1]==-1 or r[2]>6)]
print('Word openings not at an ours page start (>6 chars):',len(bad),'of',len([r for r in res if r[1] is not None]))
for r in bad[:int(sys.argv[3]) if len(sys.argv)>3 else 40]: print(r)
