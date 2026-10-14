import pymupdf as fitz,sys,json
# usage: lines.py <pages.json> <page> ; prints Word lines (pt tops) beside editor lines (pt tops)
d=fitz.open('orchestration/engine-work/mission01/references/SRC10/word.pdf')
o=json.load(open(sys.argv[1],encoding='utf8'))
for n in map(int,sys.argv[2:]):
    W=[]
    for b in d[n-1].get_text('dict')['blocks']:
        if b['type']!=0:continue
        for ln in b['lines']:
            W.append((ln['bbox'][1],ln['bbox'][3],''.join(s['text'] for s in ln['spans'])))
    W.sort()
    E={}
    for y,w in o[n-1]['words']:E.setdefault(y,[]).append(w)
    E=sorted((y*0.69876,' '.join(v)) for y,v in E.items())
    print('=== page',n,'word lines',len(W),'editor lines',len(E))
    for i in range(max(len(W),len(E))):
        a=W[i] if i<len(W) else None;b=E[i] if i<len(E) else None
        print('%-6s %-6s %-40s | %-6s %s'%(round(a[0],1) if a else '',round(a[1],1) if a else '',a[2][:40] if a else '',round(b[0],1) if b else '',b[1][:40] if b else ''))
