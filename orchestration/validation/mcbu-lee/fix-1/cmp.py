# usage: python cmp.py old.pdf new.pdf  -- page count + per-line (page, baseline, x0, text) differences
import sys; sys.path.insert(0,'../../../tools')
import pdfmeasure as m
def lines(path):
    d=m.open_pdf(path); out=[]
    for i,p in enumerate(d):
        for l in m.visual_lines(p): out.append((i+1,round(l['baseline'],2),round(l['x0'],2),l['text']))
    return len(d),out
(n1,a),(n2,b)=lines(sys.argv[1]),lines(sys.argv[2])
print("pages",n1,n2,"lines",len(a),len(b))
diff=0
for x,y in zip(a,b):
    if x!=y:
        diff+=1
        if diff<=12: print("DIFF",x,"->",y)
print("differing lines",diff)
