# usage: python dumplines.py <in.pdf> <out.txt>  -- every PDF line: x0-x1 mm, baseline mm, pitch pt, size, B/I, text
import sys; sys.path.insert(0,'../../../tools')
import pdfmeasure as m
d=m.open_pdf(sys.argv[1])
print(sys.argv[1], m.embedded_fonts(d), file=sys.stderr)
with open(sys.argv[2],'w',encoding='utf-8') as f:
    for i,p in enumerate(d):
        f.write(f'=== PAGE {i+1} size={m.page_size_mm(p)}\n')
        prev=None
        for l in m.visual_lines(p):
            pitch = '' if prev is None else f"{(l['baseline']-prev)*72/25.4:6.2f}"
            prev=l['baseline']
            f.write(f"{l['x0']:6.2f}-{l['x1']:6.2f} b={l['baseline']:7.2f} p={pitch:>6} {l['size']:5.1f} {'B' if l['bold'] else ' '}{'I' if l['italic'] else ' '} {l['text'][:80]}\n")
