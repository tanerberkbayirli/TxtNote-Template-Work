# usage: pncmp.py old.pdf new.pdf -> page-number lines (short roman/arabic/dash) weight/italic/size/x/baseline diffs
import sys,re; sys.path.insert(0,'../../tools')
import pdfmeasure as m
def pn(path):
    d=m.open_pdf(path); out=[]
    for i,p in enumerate(d):
        H=m.page_size_mm(p)[1]
        for l in m.visual_lines(p):
            t=l['text'].strip()
            if re.fullmatch(r'[-– ]*([0-9]{1,3}|[IVXLivxl]{1,6})[-– ]*',t) and (l['baseline']>H-40 or l['baseline']<25):
                out.append((i+1,t,round(l['x0'],2),round(l['x1'],2),round(l['baseline'],2),l['size'],bool(l['bold']),bool(l['italic'])))
    return out
a,b=pn(sys.argv[1]),pn(sys.argv[2])
diff=[(x,y) for x,y in zip(a,b) if x!=y]
print(f"{sys.argv[1]}: old={len(a)} new={len(b)} diff={len(diff)+abs(len(a)-len(b))}")
for x,y in diff[:6]: print("  old",x,"new",y)
