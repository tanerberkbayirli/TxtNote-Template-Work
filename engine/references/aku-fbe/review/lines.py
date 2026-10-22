"""Reviewer helper: dump visual lines (baseline mm, pitch pt, x0/x1 mm) of given pages.
usage: python3 lines.py <pdf> 4,5,9 [--draw]"""
import sys; sys.path.insert(0, "/home/user/TxtNote-Template-Work/orchestration/tools")
from pdfmeasure import *
path = sys.argv[1]; pages = [int(x) for x in sys.argv[2].split(',')]
draw = '--draw' in sys.argv
doc = open_pdf(path)
for pn in pages:
    p = doc[pn - 1]
    print("=== page", pn, [round(v * PT2MM, 2) for v in p.rect])
    prev = None
    for ln in visual_lines(p):
        b = ln["baseline"]; d = (b - prev) * MM2PT if prev else 0
        print(f"{b:8.2f} d={d:6.2f}pt x0={ln['x0']:7.2f} x1={ln['x1']:7.2f} sz={ln.get('size', 0)} {str(ln.get('font', ''))[:22]:22} {ln['text'][:70]}")
        prev = b
    if draw:
        for dr in p.get_drawings():
            r = dr["rect"]
            print("  DRAW", [round(v * PT2MM, 2) for v in r], dr.get("type"), dr.get("width"))
        for im in p.get_images(full=True):
            for r in p.get_image_rects(im[0]):
                print("  IMG", [round(v * PT2MM, 2) for v in r])
