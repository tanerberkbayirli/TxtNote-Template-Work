import pymupdf, sys
S={"lisans":"Lisans_Bitirme_Tezi_Yazim_Kilavuzu_2019","seminer":"Seminer_Hazirlama_Kilavuzu_2019"}
def rows(pg):
    r=[]
    for b in pg.get_text("dict")["blocks"]:
        for l in b.get("lines",[]):
            t="".join(x["text"] for x in l["spans"]).strip()
            if t:
                s=l["spans"][0]; x=(l["bbox"][0]+l["bbox"][2])/2
                r.append((t,round(s["origin"][1]*25.4/72,2),round(x*25.4/72,2),round(s["size"],1),s["font"]))
    return r
for t in sys.argv[1:]:
    src=pymupdf.open(f"aku-felsefe-independent-2/official-guides/AKU_Felsefe_{S[t]}.docx.pdf")[6]
    ref={a[0]:a for a in rows(src)}
    out=pymupdf.open(f"aku-felsefe-{t}/self-2/"+(sys.argv[0] and __import__("os").environ.get("PDFN","fel"))+".pdf")
    n=2 if t=="lisans" else 1
    print(t,"pages",len(out))
    for i in range(n+1):
        print(" page",i+1,"footer labels:",[x[0] for x in rows(out[i]) if x[1]>270])
    for i in range(n):
        for (tx,y,x,sz,f) in rows(out[i]):
            k=ref.get(tx)
            if k: print(f"  p{i+1} {tx[:30]:30} y {y:7} src {k[1]:7} d {y-k[1]:+.2f} | size {sz}/{k[3]} | cx {x} src {k[2]} d {x-k[2]:+.2f} | {f}")
