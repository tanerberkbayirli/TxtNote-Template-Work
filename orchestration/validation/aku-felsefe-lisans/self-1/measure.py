import pymupdf, zipfile, re, sys, collections
MM=25.4/72
for t,left in [("lisans",35),("seminer",30)]:
    d=f"orchestration/validation/aku-felsefe-{t}/self-1/"
    doc=pymupdf.open(d+"fel.pdf")
    print("==",t,"pages",len(doc),"size",[round(x*MM,1) for x in doc[0].rect[2:]])
    fonts=collections.Counter(); xs=[];x1=[];ys=[];y1=[]
    for pg in doc:
        for b in pg.get_text("dict")["blocks"]:
            for l in b.get("lines",[]):
                for s in l["spans"]:
                    if s["text"].strip(): fonts[(s["font"],round(s["size"],1))]+=1
    print(fonts.most_common(5))
    # body page: find page with long paragraph (most lines)
    best=max(range(len(doc)),key=lambda i:len(doc[i].get_text("dict")["blocks"]))
    pg=doc[best]; lines=[]
    for b in pg.get_text("dict")["blocks"]:
        for l in b.get("lines",[]):
            if l["spans"][0]["size"]>11.5 and l["bbox"][3]*MM<270: lines.append(l)
    print("page",best+1,"left",round(min(l["bbox"][0] for l in lines)*MM,2),"right",round(max(l["bbox"][2] for l in lines)*MM,2),"(exp right",210-20,") top",round(min(l["bbox"][1] for l in lines)*MM,2))
    bl=sorted(l["spans"][0]["origin"][1] for l in lines)
    print("baseline pitches pt",sorted(set(round(b-a,2) for a,b in zip(bl,bl[1:])))[:6],"(exp 1.5 line=20.7)")
    # page number
    for i in (0,1,len(doc)-1):
        pg=doc[i]; w=[(l["bbox"],"".join(s["text"] for s in l["spans"]),l["spans"][0]["size"]) for b in pg.get_text("dict")["blocks"] for l in b.get("lines",[]) if l["bbox"][1]*MM>270]
        print("p",i+1,[(round((b[0]+b[2])/2*MM,1),t,round(sz,1)) for b,t,sz in w])
    z=zipfile.ZipFile(d+"fel.docx"); x=z.read("word/document.xml").decode()
    print("sectPr pgMar",set(re.findall(r'<w:pgMar [^>]*>',x)))
    print("fonts docx",set(re.findall(r'w:ascii="([^"]+)"',x+z.read("word/styles.xml").decode())))
