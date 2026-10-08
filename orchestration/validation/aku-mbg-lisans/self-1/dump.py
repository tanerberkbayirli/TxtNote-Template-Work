import sys, pymupdf
S=25.4/72
d=pymupdf.open(sys.argv[1]); a,b=int(sys.argv[2]),int(sys.argv[3])
for pn in range(a-1,b):
    p=d[pn]; print('--- page',pn+1)
    for blk in p.get_text('dict')['blocks']:
        if blk['type']==1: print('IMG',[round(x*S,2) for x in blk['bbox']]); continue
        for l in blk['lines']:
            t=''.join(s['text'] for s in l['spans']); s0=l['spans'][0]
            print(f"{s0['origin'][1]*S:7.2f} x0={l['bbox'][0]*S:6.2f} x1={l['bbox'][2]*S:6.2f} {s0['font'][:24]:24s} {s0['size']:.1f} {t[:80]}")
