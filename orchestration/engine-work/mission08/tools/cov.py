import sys,pymupdf as fitz
d=fitz.open(sys.argv[1]);pn=int(sys.argv[2]) if len(sys.argv)>2 else 1
print("pages",len(d))
p=d[pn]
lines=[]
for b in p.get_text("dict")["blocks"]:
    for l in b.get("lines",[]):
        t="".join(s["text"] for s in l["spans"]).strip()
        if t: lines.append((l["spans"][0]["origin"][1]*25.4/72,l["bbox"],t,l["spans"][0]["size"]))
lines.sort()
prev=None
for y,bb,t,sz in lines:
    ov=prev and bb[1]<prev[3]-0.5
    print(f"{y:8.3f} sz{sz:5.1f} {t[:50]} {'OVERLAP' if ov else ''}")
    prev=bb
