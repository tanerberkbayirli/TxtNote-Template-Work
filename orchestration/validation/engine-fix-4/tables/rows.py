# row pitch of table rows: horizontal rules (drawings) y-gaps for pages that have tables; prints median gap mm
import sys, fitz, statistics
for f in sys.argv[1:]:
    d = fitz.open(f); print(f, "pages", len(d))
    gaps = []
    for p in d:
        ys = sorted({round(r['rect'].y0 if r['rect'].height < 1 else r['rect'].y1, 1) for r in p.get_drawings() for r in [r] if r['rect'].width > 20 and r['rect'].height < 1.5})
        ys = [y for y in ys]
        g = [round((b - a) * 25.4 / 72, 2) for a, b in zip(ys, ys[1:]) if 3 < (b - a) * 25.4 / 72 < 30]
        # rows: consecutive gaps (single-line rows)
        if len(g) >= 3: gaps += g
    if gaps:
        c = statistics.mode([round(x, 1) for x in gaps]); print(" row gaps mm: n=%d median=%.2f mode=%.1f min=%.2f" % (len(gaps), statistics.median(gaps), c, min(gaps)))
