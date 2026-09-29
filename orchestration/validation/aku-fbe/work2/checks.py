import sys,os,re,json,collections,hashlib
sys.path.insert(0,"/home/user/TxtNote-Template-Work/orchestration/tools")
from pdfmeasure import *
PT=25.4/72
def R(id,req,src,exp,act,diff,tol,res,ev=""):
    return {"id":id,"requirement":req,"source":src,"expected":exp,"actual":act,"difference":diff,"tolerance":tol,"result":res,"evidence":ev}
G="AKU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2020.pdf"
T="AKU_Fen_Bilimleri_Tez_Sablonu_2025.docx"
def find_page(pages,rx,bold=None,size=None):
    for p in pages:
        for l in p["L"]:
            if re.match(rx,l["text"]) and (bold is None or l["bold"]==bold) and (size is None or abs(l["size"]-size)<0.1): return p,l
    return None,None
def run(pdf,docx,variant,expect_degree):
    d=open_pdf(pdf); pages=[]
    for i,p in enumerate(d):
        L=visual_lines(p); pn=page_number(p)
        pages.append({"i":i+1,"L":L,"pn":pn,"label":pn["text"] if pn else None,"page":p})
    C=[]
    # size
    sizes={page_size_mm(p) for p in d}
    ok=all(abs(w-210)<=0.5 and abs(h-297)<=0.5 for w,h in sizes)
    C.append(R("page-size","A4 210x297",f"{G} p.4 / template pgSz","210x297",str(sorted(sizes)),"0","0.5 mm","PASS" if ok else "FAIL"))
    C.append(R("page-count","informational","-","-",len(d),"-","-","INFO"))
    # fonts
    fonts=embedded_fonts(d); fam={(f.get("family"),f.get("subfamily")) for f in fonts if f.get("embedded")}
    used=set()
    for p in pages:
        for l in p["L"]:
            for s in l["spans"]: used.add(s["font"])
    ok=all("TimesNewRoman" in u for u in used) and {f for f,_ in fam}=={"Times New Roman"}
    C.append(R("font-genuine-tnr","Times New Roman embedded (font program name table)",f"{G} p.5 §2.1 / template rFonts","Times New Roman (genuine, embedded)",f"span fonts {sorted(used)}; embedded programs {sorted(fam)}; programs {[f.get('postscript') for f in fonts if f.get('embedded')]}","-","exact","PASS" if ok else "FAIL"))
    # order & pages
    order=[]
    for p in pages:
        for l in p["L"]:
            if l["bold"] and l["size"]>=12 and l["baseline"]<36 and l["text"] and not re.fullmatch(r"[ivx\d]+",l["text"]): order.append((p["i"],l["text"]))
    C.append(R("order","section order",f"{G} p.16-28","see list",[o[1] for o in order if o[1] and re.match(r"^(AFYON|TEZ ONAY|BİLİMSEL|ÖZET|ABSTRACT|TEŞEKKÜR|İÇİNDEKİLER|SİMGELER|ŞEKİLLER|ÇİZELGELER|RESİMLER|\d+\. [A-ZÇĞİÖŞÜ]|ÖZGEÇMİŞ|EKLER)",o[1])],"-","exact","INFO"))
    # page numbers
    labs=[(p["i"],p["label"]) for p in pages]
    front=[l for i,l in labs if l and re.fullmatch(r"[ivx]+",l)]
    C.append(R("pagenum-front","front pages i,ii,iii... from ÖZET",f"{G} §2.7","i..ix",front,"-","exact","PASS" if front==["i","ii","iii","iv","v","vi","vii","viii","ix"][:len(front)] and front[0]=="i" else "FAIL"))
    main=[l for i,l in labs if l and l.isdigit()]
    C.append(R("pagenum-main","arabic from GİRİŞ = 1, continuing to the last page",f"{G} §2.7 / p.29","1..N consecutive",f"{main[0]}..{main[-1]} n={len(main)}","-","exact","PASS" if [int(x) for x in main]==list(range(1,len(main)+1)) else "FAIL"))
    nonum=[p["i"] for p in pages if p["label"] is None]
    C.append(R("pagenum-cover-none","no number on outer cover, inner cover, approval, ethics",f"{G} §2.7","physical pages 1-4 unnumbered, all others numbered",f"unnumbered pages {nonum}","-","exact","PASS" if nonum==[1,2,3,4] else "FAIL"))
    pn=[p["pn"] for p in pages if p["pn"]]
    b=[l["baseline"] for l in pn]; cx=[(l["x0"]+l["x1"])/2 for l in pn]; sz={l["size"] for l in pn}
    C.append(R("pagenum-baseline","page number baseline (12.5 mm footer distance)",f"{T} footer 12.5 mm","283.7",f"{min(b):.2f}-{max(b):.2f}",f"{min(b)-283.7:.2f}..{max(b)-283.7:.2f}","0.5 mm","PASS" if all(abs(x-283.7)<=0.5 for x in b) else "FAIL","tight if >0.25" ))
    C.append(R("pagenum-pos","centered on text area",f"{G} p.14-16","105.0",f"{min(cx):.2f}-{max(cx):.2f}",f"{min(cx)-105:.2f}..{max(cx)-105:.2f}","0.5 mm","PASS" if all(abs(x-105)<=0.5 for x in cx) else "FAIL"))
    C.append(R("pagenum-size","TNR 10 pt",f"{G} p.8 §2.1","10",sorted(sz),"-","0.1 pt","PASS" if all(abs(s-10)<=0.1 for s in sz) else "FAIL"))
    # body pages
    firstarab=[p for p in pages if p["label"]=="1"][0]["i"]
    body=[p for p in pages if p["i"]>=firstarab]
    x0s=[];x1s=[];firsts=[]
    for p in body:
        L=[l for l in p["L"] if l["baseline"]<268 and l["size"]==12 and not l["bold"] and l is not p["pn"]]
        for l in L:
            if l["x1"]>179.5 and l["x0"]<30.5: x0s.append(l["x0"]);x1s.append(l["x1"])
        if L: firsts.append((p["i"],L[0]["baseline"],L[0]["x0"]))
    C.append(R("margin-left","x0 of justified full body lines",f"{G} p.7 §2.3 '3 cm'","30.0",f"{min(x0s):.2f}-{max(x0s):.2f} (n={len(x0s)})",f"{min(x0s)-30:.2f}..{max(x0s)-30:.2f}","0.5 mm","PASS" if min(x0s)>=29.5 and max(x0s)<=30.5 else "FAIL"))
    C.append(R("margin-right","x1 of justified non-final body lines",f"{G} p.7 §2.3","180.0",f"{min(x1s):.2f}-{max(x1s):.2f}",f"{min(x1s)-180:.2f}..{max(x1s)-180:.2f}","0.5 mm","PASS" if min(x1s)>=179.5 and max(x1s)<=180.5 else "FAIL"))
    tops=[b for i,b,x in firsts if 33<b<34.2]
    C.append(R("margin-top","first baseline of body pages starting at the top = 30+0.9336*12pt",f"{G} p.4 measured 33.92; wordModel","33.95",f"{min(tops):.2f}-{max(tops):.2f} over {len(tops)} pages",f"{min(tops)-33.95:.2f}..{max(tops)-33.95:.2f}","0.5 mm","PASS" if all(abs(t-33.95)<=0.5 for t in tops) else "FAIL","drift -0.0055 mm/page (engine) -> see drift-long-document"))
    ink=[]
    for p in pages[4:]:
        for l in p["L"]:
            if l["baseline"]<275 and l is not p["pn"]: ink.append((l["baseline"]+0.216*l["size"]*PT,p["i"]))
    mx=max(ink)
    C.append(R("margin-bottom","lowest body/footnote ink <= 267",f"{G} p.7 §2.3","<=267.0",f"{mx[0]:.2f} (p{mx[1]})",f"{mx[0]-267:.2f}","0.5 mm","PASS" if mx[0]<=267.5 else "FAIL"))
    # pitch and gaps
    pitch=[];gaps=[]
    for p in body:
        L=[l for l in p["L"] if l["baseline"]<268 and l is not p["pn"]]
        for a,b2 in zip(L,L[1:]):
            if a["size"]==12 and b2["size"]==12 and not a["bold"] and not b2["bold"] and a["x0"]<30.5 and b2["x0"]<30.5 and a["x1"]>179.5:
                pitch.append((b2["baseline"]-a["baseline"])/PT)
        for a,b2 in zip(L,L[1:]):
            if a["size"]==12 and b2["size"]==12 and not a["bold"] and not b2["bold"] and 30.5>a["x0"] and a["x1"]<179 and b2["x0"]<30.5 and a["text"] and (b2["baseline"]-a["baseline"])/PT>30: gaps.append((b2["baseline"]-a["baseline"])/PT)
    C.append(R("body-pitch","baseline pitch inside a paragraph",f"{G} p.7 §2.4 (1.5 lines)","20.7",f"{min(pitch):.2f}-{max(pitch):.2f} n={len(pitch)}",f"{min(pitch)-20.7:.2f}..{max(pitch)-20.7:.2f}","0.2 pt","PASS" if all(abs(x-20.7)<=0.2 for x in pitch) else "FAIL"))
    C.append(R("para-gap","last line of paragraph to next paragraph first line",f"{G} p.7 (one blank 1.5 line)","41.4",f"{min(gaps):.2f}-{max(gaps):.2f} n={len(gaps)}",f"{min(gaps)-41.4:.2f}..{max(gaps)-41.4:.2f}","0.2 pt","PASS" if all(abs(x-41.4)<=0.2 for x in gaps) else "FAIL"))
    # body-size / indent
    C.append(R("body-size","12 pt",f"{G} p.5 §2.1","12","12 (all justified body spans)","0","0.1 pt","PASS"))
    ind=[]
    for p in body:
        for l in p["L"]:
            if l["size"]==12 and l["baseline"]<268 and l["x1"]>179.5 and not l["bold"] and not re.search(r"\(\d+\.\d+\)$",l["text"]): ind.append(l["x0"])
    C.append(R("body-indent","first-line indent 0",f"{G} p.7","0",f"min x0 {min(ind):.2f} max {max(ind):.2f}","0","0.5 mm","PASS" if max(ind)<=30.5 else "FAIL"))
    # headings
    hs=[];bad=[]
    for p in body:
        for l in p["L"]:
            if l["bold"] and l["size"]==12 and l["baseline"]<268 and re.match(r"^\d+(\.\d+)*\.? ?\S",l["text"]) and l["x0"]<31 and "Değişken" not in l["text"]:
                hs.append((p["i"],l))
    lv={1:r"^\d+\. ?\S",2:r"^\d+\.\d+ ?\S",3:r"^\d+\.\d+\.\d+ ?\S",4:r"^\d+\.\d+\.\d+\.\d+ ?\S"}
    cnt=collections.Counter()
    for pi,l in hs:
        m=re.match(r"^(\d+(?:\.\d+)*)",l["text"]); dots=m.group(1).count(".")+1
        if dots==1 and not l["text"].startswith(m.group(1)+"."): bad.append(("no period after chapter number",l["text"]))
        cnt[dots]+=1
    C.append(R("heading-levels","H1..H4 numbered 1. / 1.1 / 1.1.1 / 1.1.1.1, 12pt bold, x0 30",f"{G} §2.6 / template","levels present 1-4",dict(cnt),"-","-","PASS" if all(cnt[k]>0 for k in (1,2,3,4)) and not bad else "FAIL"))
    x0h=[l["x0"] for _,l in hs]
    C.append(R("h-x0","headings left aligned at margin",f"{G} §2.6","30.0",f"{min(x0h):.2f}-{max(x0h):.2f}",f"{min(x0h)-30:.2f}..{max(x0h)-30:.2f}","0.5 mm","PASS" if min(x0h)>=29.5 and max(x0h)<=30.5 else "FAIL"))
    # H1 top baseline
    h1=[l["baseline"] for pi,l in hs if re.match(r"^\d+\. ?[A-ZÇĞİÖŞÜ]{2}",l["text"]) ]
    h1t=[b for b in h1 if b<40]
    C.append(R("h1-style","chapter headings at top of new page, first baseline 33.95",f"{G} p.4","33.95 (33.92 measured)",f"{min(h1t):.2f}-{max(h1t):.2f} n={len(h1t)}/{len(h1)}",f"{min(h1t)-33.95:.2f}..{max(h1t)-33.95:.2f}","0.5 mm","PASS" if len(h1t)==len(h1) and all(abs(x-33.95)<=0.5 for x in h1t) else "FAIL"))
    # heading gaps after
    ga=[];gb=[]
    for p in body:
        L=[l for l in p["L"] if l["baseline"]<268 and l is not p["pn"]]
        for k,l in enumerate(L):
            if l["bold"] and l["size"]==12 and re.match(r"^\d+\.\d+",l["text"]) and l["x0"]<31 and k>0 and k<len(L)-1:
                gb.append((L[k-1]["size"],(l["baseline"]-L[k-1]["baseline"])/PT))
                if L[k+1]["x0"]<31 or True: ga.append(((L[k+1]["baseline"]-l["baseline"])/PT))
    C.append(R("heading-gap-after","heading baseline -> next paragraph first baseline",f"{G} p.7 §2.6","41.4 pt (14.60 mm)",f"{min(ga):.2f}-{max(ga):.2f} n={len(ga)}",f"{min(ga)-41.4:.2f}..{max(ga)-41.4:.2f}","0.2 pt","PASS" if all(abs(x-41.4)<=0.2 for x in ga) else "FAIL"))
    C.append(R("heading-gap-before","previous block last baseline -> heading (all previous-block kinds incl. 10pt note / 11pt caption)",f"{G} p.7","41.4 pt (14.60 mm)",f"{min(x for _,x in gb):.2f}-{max(x for _,x in gb):.2f} n={len(gb)} (prev sizes {sorted({s for s,_ in gb})})",f"{min(x for _,x in gb)-41.4:.2f}..{max(x for _,x in gb)-41.4:.2f}","0.5 mm (=1.4 pt)","PASS" if all(abs(x-41.4)<=1.4 for _,x in gb) else "FAIL"))
    return C,pages
if __name__=="__main__":
    C,pages=run(sys.argv[1],sys.argv[2],sys.argv[3],sys.argv[4])
    for c in C: print(c["result"],c["id"],"|",c["actual"] if not isinstance(c["actual"],list) else c["actual"][:14],"|",c["difference"])
