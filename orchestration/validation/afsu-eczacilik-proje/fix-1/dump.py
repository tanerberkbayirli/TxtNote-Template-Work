import sys, pymupdf
# usage: dump.py in.pdf out.txt  -> one line per text line: baseline_mm x0 x1 xc size font | text
doc = pymupdf.open(sys.argv[1]); out = []
k = 25.4 / 72
out.append(f"pages {len(doc)}")
for i, pg in enumerate(doc, 1):
    out.append(f"=== p{i} size ({pg.rect.width*k:.1f}, {pg.rect.height*k:.1f})")
    for b in pg.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            sp = [s for s in l["spans"] if s["text"].strip()]
            if not sp: continue
            x0 = min(s["bbox"][0] for s in sp) * k; x1 = max(s["bbox"][2] for s in sp) * k
            base = sp[0]["origin"][1] * k
            out.append(f"{base:.2f} x0={x0:.2f} x1={x1:.2f} xc={(x0+x1)/2:.2f} sz={sp[0]['size']:.1f} {sp[0]['font'][:12]} | {''.join(s['text'] for s in sp)[:60]}")
open(sys.argv[2], "w", encoding="utf-8").write("\n".join(out))
