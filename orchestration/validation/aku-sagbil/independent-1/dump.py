import pymupdf, sys
MM=25.4/72
def lines(p):
    out=[]
    for b in p.get_text("dict")["blocks"]:
        for l in b.get("lines",[]):
            sp=[s for s in l["spans"] if s["text"].strip()]
            if not sp: continue
            out.append(dict(x0=l["bbox"][0]*MM,x1=l["bbox"][2]*MM,base=sp[0]["origin"][1]*MM,size=round(sp[0]["size"],2),font=sp[0]["font"],text="".join(s["text"] for s in sp),bold=bool(sp[0]["flags"]&16)))
    return sorted(out,key=lambda l:l["base"])
if __name__=="__main__":
    d=pymupdf.open(sys.argv[1])
    fonts=sorted({(f[3],f[1]) for p in d for f in p.get_fonts()});print(fonts, d[0].rect, len(d))
    for i,p in enumerate(d):
        ls=lines(p)
        if not ls: print(i+1,"EMPTY");continue
        body=[l for l in ls if l["base"]<270]
        foot=[l for l in ls if l["base"]>=270]
        print(f"p{i+1} n={len(body)} first={body[0]['base']:.2f}:{body[0]['text'][:40]!r} {body[0]['size']} {body[0]['font'][-8:]} last={body[-1]['base']:.2f} x0min={min(l['x0'] for l in body):.2f} x1max={max(l['x1'] for l in body):.2f} foot={[(f['text'],round((f['x0']+f['x1'])/2,2),f['size'],round(f['base'],2)) for f in foot]}")
