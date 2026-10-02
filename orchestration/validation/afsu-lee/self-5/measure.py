"""Compare editor PDF and Word-rendered DOCX against the official Word renders (baseline y of matching text lines, pt; mm = pt*0.3528)."""
import pymupdf, sys
SRC = "../../../artifacts/afsu-lee/source/word-render/AFSU_Lisansustu_%s_Tez_Sablonu_2026.pdf"
def lines(d, p):
    out = []
    for b in d[p - 1].get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            t = "".join(s["text"] for s in l["spans"]).strip()
            if t: out.append((round(l["spans"][0]["origin"][1], 2), round(l["bbox"][0], 2), round(l["spans"][0]["size"], 1), t))
    return sorted(out)
def foot(d, p):
    for l in lines(d, p):
        if l[0] > 760 and len(l[3]) < 5: return l
rows = []
for deg, name in (("master", "Yuksek_Lisans"), ("phd", "Doktora")):
    src = pymupdf.open(SRC % name)
    for kind, f in (("editor", f"{deg}.pdf"), ("word", f"{deg}-word.pdf")):
        d = pymupdf.open(f)
        # pages 1,2: same index and same line order
        for p in (1, 2):
            a, b = lines(src, p), lines(d, p)
            # match by order of lines with same font size and position class (fixture text differs, so match by index of lines sharing prefix-free y order)
            for la in a:
                best = min(b, key=lambda lb: abs(lb[0] - la[0]) + (100 if lb[2] != la[2] else 0), default=None)
                if best and abs(best[0] - la[0]) < 3: rows.append((deg, kind, "p%d" % p, la[3][:22].encode("ascii", "replace").decode(), la[0], best[0], round((best[0] - la[0]) * 25.4 / 72, 3)))
        # footers
        for p, sp in ((6, 6), (7, 7), (8, 8), (13 if deg == "master" else 13, 12 if deg == "master" else 12)):
            fa, fb = foot(src, sp), foot(d, p)
            if fa and fb: rows.append((deg, kind, "footer p%d" % p, fb[3], fa[0], fb[0], round((fb[0] - fa[0]) * 25.4 / 72, 3), "dx_mm=%.3f" % ((fb[1] - fa[1]) * 25.4 / 72)))
for r in rows: print("	".join(map(str, r)))
