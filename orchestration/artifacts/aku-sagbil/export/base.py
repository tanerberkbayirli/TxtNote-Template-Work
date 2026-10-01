import pymupdf as fitz, sys
MM=25.4/72
def lines(pg, only_black=True):
    out=[]
    for b in pg.get_text('dict')['blocks']:
        if b['type']!=0: continue
        for l in b['lines']:
            sp=[s for s in l['spans'] if s['text'].strip()]
            if not sp: continue
            t=''.join(s['text'] for s in sp); s0=sp[0]
            out.append(dict(base=s0['origin'][1]*MM,x0=l['bbox'][0]*MM,x1=l['bbox'][2]*MM,size=s0['size'],font=s0['font'],text=t))
    return out
if __name__=='__main__':
    d=fitz.open(sys.argv[1])
    for i in map(int,sys.argv[2:]):
        print('PAGE',i)
        for l in lines(d[i-1]): print(f"  base={l['base']:7.2f} x0={l['x0']:6.2f} x1={l['x1']:6.2f} sz={l['size']:.1f} {l['font'][-12:]:12} {l['text'][:60]!r}")
