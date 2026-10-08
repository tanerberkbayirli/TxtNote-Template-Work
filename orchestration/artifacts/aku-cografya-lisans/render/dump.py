import sys; sys.path.insert(0,"orchestration/tools"); sys.path.insert(0,"orchestration/tools/python-packages")
from pdfmeasure import *
doc=open_pdf(sys.argv[1]); lo=int(sys.argv[2]); hi=int(sys.argv[3])
for i in range(lo-1,min(hi,len(doc))):
    pg=doc[i]; print("--- p",i+1,page_size_mm(pg),"label",repr(page_number(pg)))
    for ln in visual_lines(pg):
        print(f'{ln["baseline"]:7.2f} x0={ln["x0"]:6.2f} x1={ln.get("x1",0):6.2f} sz={ln.get("size","")} b={ln.get("bold","")} {ln["text"][:70]}')
