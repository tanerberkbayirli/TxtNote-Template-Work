"""Measure the equation sweep PDF (see eq-sweep.mjs): every numbered one-line equation must sit 14.6 mm (41.4 pt, +-0.2 pt)
below the previous body baseline and 14.6 mm above the next one on the same page. Prints a table; exit 1 on any deviation."""
import re, sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from pdfmeasure import open_pdf, visual_lines, MM2PT

NUM = re.compile(r"\(\d+\.\d+\)$")
EXPECT_PT, TOL_PT = 41.4, 0.2
doc = open_pdf(sys.argv[1])
rows, bad, checked = [], [], 0
for pno, page in enumerate(doc, 1):
    body = [ln for ln in visual_lines(page) if 30 < ln["baseline"] < 262]
    body.sort(key=lambda ln: ln["baseline"])
    for i, ln in enumerate(body):
        if not NUM.search(ln["text"]) or not ln["text"].startswith("x"):
            continue
        for label, other in (("before", body[i - 1] if i else None), ("after", body[i + 1] if i + 1 < len(body) else None)):
            if other is None:
                continue
            pt = abs(ln["baseline"] - other["baseline"]) * MM2PT
            # the next/previous line must be the neighbouring block (one blank line away), not a wrapped continuation
            if pt < 30:
                continue
            checked += 1
            ok = abs(pt - EXPECT_PT) <= TOL_PT
            rows.append((pno, ln["baseline"], label, pt, ok))
            if not ok:
                bad.append((pno, round(ln["baseline"], 2), label, round(pt, 2)))
print(f"{len(doc)} pages, {checked} equation gaps checked, eq baselines {min(r[1] for r in rows):.1f}..{max(r[1] for r in rows):.1f} mm, "
      f"{len({round(r[1], 0) for r in rows})} distinct y positions")
if bad:
    print("DEVIATIONS (page, eq baseline mm, side, pt):")
    for b in bad:
        print("  ", b)
    sys.exit(1)
print(f"all gaps 41.4 pt +-{TOL_PT}")
