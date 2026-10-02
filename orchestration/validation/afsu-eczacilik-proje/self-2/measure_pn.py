import pymupdf, sys, json, re
doc = pymupdf.open("orchestration/artifacts/afsu-eczacilik-proje/exports/export-v6.pdf")
rows=[]; 
for i,p in enumerate(doc,1):
    best=None
    for b in p.get_text("dict")["blocks"]:
        for l in b.get("lines",[]):
            for s in l["spans"]:
                t=s["text"].strip()
                if t and l["bbox"][1]>p.rect.height*0.9 and s["size"]>10 and re.fullmatch(r"[ivxl]+|\d+",t):
                    best=(t,s["bbox"],s["origin"],s["size"],s["font"])
    if best:
        t,bb,o,sz,f=best
        # glyph centre from span bbox (advance box); use char-level for tightness
        rows.append((i,t,round((bb[0]+bb[2])/2*25.4/72,3),round(o[1]*25.4/72,3),sz,f))
    else: rows.append((i,None))
shown=[r for r in rows if r[1]]
print("pages with number",len(shown),"of",len(rows)); print("unnumbered:",[r[0] for r in rows if not r[1]])
cs=[r[2] for r in shown]; print("centre x mm min/max",min(cs),max(cs)); print("baseline y",set(r[3] for r in shown)); print(set((r[4],r[5]) for r in shown))
for w in sorted(set(len(r[1]) for r in shown)): 
    ex=[r for r in shown if len(r[1])==w][:3]; print("len",w,ex)
