import sys; sys.stdout.reconfigure(encoding="utf-8")
import pymupdf,sys,json
f=sys.argv[1]; d=pymupdf.open(f)
print("pages",len(d), d.metadata)
fonts={}
for p in d:
    for x in p.get_fonts(): fonts[x[3]]=x
print(fonts.keys())
for i,p in enumerate(d):
    print(f"--- p{i+1} size {p.rect.width/72*25.4:.2f}x{p.rect.height/72*25.4:.2f}mm")
    for b in p.get_text("dict")["blocks"]:
        for l in b.get("lines",[]):
            t="".join(s["text"] for s in l["spans"]).strip()
            if not t: continue
            s=l["spans"][0]
            print(f'  x0={l["bbox"][0]*25.4/72:6.2f} x1={l["bbox"][2]*25.4/72:6.2f} base={l["spans"][0]["origin"][1]*25.4/72:7.2f} sz={s["size"]:.1f} {s["font"][:18]:18} fl={s["flags"]} | {t[:70]}')
