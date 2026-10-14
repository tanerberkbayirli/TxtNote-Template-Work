import fitz,sys,glob
for f in sys.argv[1:]:
    d=fitz.open(f); n=0; out=[]
    for pi,pg in enumerate(d[:4]):
        L=[]
        for b in pg.get_text("dict")["blocks"]:
            for l in b.get("lines",[]):
                t="".join(s["text"] for s in l["spans"]).strip()
                if t: L.append((fitz.Rect(l["bbox"]),t))
        for i in range(len(L)):
            for j in range(i+1,len(L)):
                r=L[i][0]&L[j][0]
                if r.width>1 and r.height>1.5: n+=1; out.append((pi+1,L[i][1][:25],L[j][1][:25]))
    print(f,len(d),"pages overlaps",n,out[:4])
