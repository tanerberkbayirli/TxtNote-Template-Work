import json,sys,pymupdf
id=sys.argv[1] if len(sys.argv)>1 else 'synth'
o=json.load(open(f'orchestration/engine-work/mission07/synthetic/{id}.pages.json',encoding='utf8'))
f=lambda l:[w for w in l if w not in('•','','·')]
O=[f([w for _,w in sorted(p['words'],key=lambda a:a[0])]) for p in o]
doc=pymupdf.open(f'orchestration/engine-work/mission07/synthetic/{id}.pdf')
W=[f([w[4] for w in sorted(pg.get_text('words'),key=lambda w:(round(w[1]),w[0]))]) for pg in doc]
print('word',len(W),'ours',len(O))
for i in range(max(len(W),len(O))):
    a=W[i] if i<len(W) else [];b=O[i] if i<len(O) else []
    print(i+1,'OK ' if a[:6]==b[:6] else 'DIFF',len(a),len(b),'|W:',' '.join(a[:4]),'..',' '.join(a[-3:]),'|O:',' '.join(b[:4]),'..',' '.join(b[-3:]))
